/**
 * R2 image storage endpoints — replaces Google Drive `appDataFolder`.
 *
 * Why R2 instead of Drive:
 *   - Cuts the only sensitive-ish OAuth scope we held (`drive.appdata`),
 *     simplifying future OAuth verification renewals.
 *   - Single prefix-delete for account deletion (Drive required listing
 *     + per-file delete with rate-limit pacing).
 *   - Same Cloudflare account as the rest of the backend — one less
 *     vendor in the data-residency picture for the privacy policy.
 *   - No 5MB upload chunking concerns; R2 handles streaming uploads up to
 *     5GB per object out of the box.
 *
 * Endpoints (all under /sync/images/*, auth required):
 *   PUT    /sync/images/:lang/:wordId   → upload (raw binary body)
 *   GET    /sync/images/:lang/:wordId   → download (binary)
 *   DELETE /sync/images/:lang/:wordId   → delete
 *
 * Key format in R2: `{userId}/{lang}/{wordId}` — the file extension is
 * NOT in the key. Mime type is preserved in R2 object metadata so a
 * subsequent GET sets the right Content-Type without needing a DB lookup.
 *
 * Per-user storage quota: enforced server-side via the `custom_images`
 * D1 table (sum of `size_bytes` per user). Upload rejected if the user
 * is at or above their tier's cap.
 */

import { effectiveTier, type Tier } from '../billing/tier';

export interface ImagesEnv {
  DB?: D1Database;
  /** Cloudflare R2 bucket binding for flashcard images */
  IMAGES?: R2Bucket;
}

export interface VerifiedUser {
  userId: string;
  email: string;
}

// ─── Storage limits per tier ──────────────────────────────────────────────
/**
 * How much R2 a user can fill with custom images, by tier.
 *
 * Free 50 MB ≈ 100 medium photos, generous for a flashcard tool.
 * Pro 500 MB ≈ 1000 photos.
 * Lifetime same as Pro.
 *
 * If we ever need to lower these, do it ONLY for new uploads — never
 * retroactively (a Pro user shouldn't lose images on quota reduction).
 */
const STORAGE_QUOTA_BY_TIER: Record<Tier, number> = {
  free: 50 * 1024 * 1024,
  pro: 500 * 1024 * 1024,
  lifetime: 500 * 1024 * 1024,
  banned: 0,
};

const MAX_PER_FILE_BYTES = 5 * 1024 * 1024; // matches client-side validation

const ACCEPTED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

// ─── Helpers ──────────────────────────────────────────────────────────────
function jsonResp(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errResp(message: string, status = 400, detail?: string): Response {
  return jsonResp({ error: message, detail }, status);
}

function r2Key(userId: string, lang: string, wordId: string): string {
  // Defensive sanitization — wordId comes from client. Reject any path
  // separators or sneaky characters that could let one user write outside
  // their prefix.
  if (lang.includes('/') || wordId.includes('/') || wordId.includes('..')) {
    throw new Error('invalid_id');
  }
  return `${userId}/${lang}/${wordId}`;
}

/**
 * Compute the user's effective storage quota in bytes by reading their
 * tier from the users table. Returns 0 (= banned/no quota) if user not
 * found, which lets the caller reject the upload cleanly.
 */
async function quotaForUser(db: D1Database, userId: string): Promise<number> {
  const row = await db
    .prepare(`SELECT tier, tier_expires_at FROM users WHERE id = ?`)
    .bind(userId)
    .first<{ tier: Tier; tier_expires_at: number | null }>();
  return STORAGE_QUOTA_BY_TIER[effectiveTier(row)];
}

/**
 * Sum of size_bytes for a user. Cheap (indexed on user_id).
 */
async function usedBytes(db: D1Database, userId: string): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COALESCE(SUM(size_bytes), 0) AS bytes FROM custom_images WHERE user_id = ?`,
    )
    .bind(userId)
    .first<{ bytes: number }>();
  return Number(row?.bytes ?? 0);
}

// ─── PUT (upload) ─────────────────────────────────────────────────────────
async function handlePut(
  req: Request,
  env: ImagesEnv,
  user: VerifiedUser,
  lang: string,
  wordId: string,
): Promise<Response> {
  if (!env.IMAGES) return errResp('R2 not configured', 500);
  if (!env.DB) return errResp('Database not configured', 500);

  const mimeType = req.headers.get('Content-Type') ?? 'application/octet-stream';
  if (!ACCEPTED_MIME.has(mimeType)) {
    return errResp(`Unsupported mime type: ${mimeType}`, 415);
  }

  const sizeStr = req.headers.get('Content-Length');
  const size = sizeStr ? parseInt(sizeStr, 10) : null;
  if (size !== null && size > MAX_PER_FILE_BYTES) {
    return errResp(
      `File too large (${(size / 1024 / 1024).toFixed(1)} MB). Max 5 MB.`,
      413,
    );
  }

  // Quota check — fetch tier + current usage. We fetch BEFORE reading the
  // body so we can short-circuit oversized uploads and not waste bandwidth.
  const [quota, used] = await Promise.all([
    quotaForUser(env.DB, user.userId),
    usedBytes(env.DB, user.userId),
  ]);
  if (quota === 0) {
    return errResp('Storage not allowed for this account', 403);
  }
  // Estimate post-upload usage. If we're about to replace an existing image,
  // the existing size will be released — query for that and subtract.
  const existing = await env.DB
    .prepare(
      `SELECT size_bytes FROM custom_images
       WHERE user_id = ? AND word_id = ? AND lang = ?`,
    )
    .bind(user.userId, wordId, lang)
    .first<{ size_bytes: number }>();
  const existingBytes = existing ? Number(existing.size_bytes) : 0;
  const projected = used - existingBytes + (size ?? MAX_PER_FILE_BYTES);
  if (projected > quota) {
    return errResp(
      `Storage quota exceeded. Used ${(used / 1024 / 1024).toFixed(1)}/${(quota / 1024 / 1024).toFixed(0)} MB.`,
      413,
    );
  }

  let key: string;
  try {
    key = r2Key(user.userId, lang, wordId);
  } catch {
    return errResp('Invalid lang or wordId', 400);
  }

  const body = await req.arrayBuffer();
  // Hard-check actual size (Content-Length can be missing/wrong)
  if (body.byteLength > MAX_PER_FILE_BYTES) {
    return errResp(
      `File too large (${(body.byteLength / 1024 / 1024).toFixed(1)} MB). Max 5 MB.`,
      413,
    );
  }
  const actualSize = body.byteLength;

  // Upload to R2 with mime type preserved as object metadata
  await env.IMAGES.put(key, body, {
    httpMetadata: {
      contentType: mimeType,
      // Reasonable cache: 1 day private — clients re-fetch infrequently.
      // Custom images don't change often; if they do, a new wordId is
      // unlikely (always overwriting the same key).
      cacheControl: 'private, max-age=86400',
    },
    customMetadata: {
      uploaded_at: String(Date.now()),
      user_id: user.userId,
    },
  });

  // Upsert metadata into D1 so listings / quotas / sync stay in sync.
  const now = Date.now();
  await env.DB
    .prepare(
      `INSERT INTO custom_images (
         user_id, word_id, lang, r2_key, mime_type, size_bytes,
         uploaded_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, word_id, lang) DO UPDATE SET
         r2_key = excluded.r2_key,
         mime_type = excluded.mime_type,
         size_bytes = excluded.size_bytes,
         uploaded_at = excluded.uploaded_at,
         updated_at = excluded.updated_at`,
    )
    .bind(
      user.userId, wordId, lang, key, mimeType, actualSize, now, now,
    )
    .run();

  return jsonResp({
    ok: true,
    r2_key: key,
    size_bytes: actualSize,
    mime_type: mimeType,
    used_bytes: used - existingBytes + actualSize,
    quota_bytes: quota,
  });
}

// ─── GET (download) ───────────────────────────────────────────────────────
async function handleGet(
  env: ImagesEnv,
  user: VerifiedUser,
  lang: string,
  wordId: string,
): Promise<Response> {
  if (!env.IMAGES) return errResp('R2 not configured', 500);

  let key: string;
  try {
    key = r2Key(user.userId, lang, wordId);
  } catch {
    return errResp('Invalid lang or wordId', 400);
  }

  const obj = await env.IMAGES.get(key);
  if (!obj) {
    return errResp('Not found', 404);
  }

  // Stream the body straight back. Content-Type from R2's stored metadata.
  return new Response(obj.body, {
    status: 200,
    headers: {
      'Content-Type': obj.httpMetadata?.contentType ?? 'application/octet-stream',
      'Cache-Control': 'private, max-age=86400',
      'Content-Length': String(obj.size),
    },
  });
}

// ─── DELETE ───────────────────────────────────────────────────────────────
async function handleDelete(
  env: ImagesEnv,
  user: VerifiedUser,
  lang: string,
  wordId: string,
): Promise<Response> {
  if (!env.IMAGES) return errResp('R2 not configured', 500);
  if (!env.DB) return errResp('Database not configured', 500);

  let key: string;
  try {
    key = r2Key(user.userId, lang, wordId);
  } catch {
    return errResp('Invalid lang or wordId', 400);
  }

  // Run R2 delete + D1 delete in parallel. R2 delete is idempotent (404 ≈ ok).
  await Promise.all([
    env.IMAGES.delete(key),
    env.DB
      .prepare(
        `DELETE FROM custom_images
         WHERE user_id = ? AND word_id = ? AND lang = ?`,
      )
      .bind(user.userId, wordId, lang)
      .run(),
  ]);

  return jsonResp({ ok: true });
}

// ─── Bulk delete on account deletion ──────────────────────────────────────
/**
 * Wipe ALL R2 objects under a user's prefix. Called from /sync/clear
 * (account deletion) so we don't leave orphaned R2 spend after the user
 * row + custom_images metadata are gone.
 *
 * R2 doesn't support prefix-delete in one API call — we list (paginated)
 * then delete. For typical users (<100 images) this is a single round-trip.
 */
export async function deleteAllUserImages(
  env: ImagesEnv,
  userId: string,
): Promise<number> {
  if (!env.IMAGES) return 0;
  let cursor: string | undefined;
  let totalDeleted = 0;
  // Bound the loop — even at 1000 keys/page, real users are way under this.
  for (let page = 0; page < 50; page++) {
    const list = await env.IMAGES.list({
      prefix: `${userId}/`,
      limit: 1000,
      cursor,
    });
    if (list.objects.length === 0) break;
    await env.IMAGES.delete(list.objects.map((o) => o.key));
    totalDeleted += list.objects.length;
    if (!list.truncated) break;
    cursor = list.cursor;
  }
  return totalDeleted;
}

// ─── Main router ──────────────────────────────────────────────────────────
/**
 * Routes /sync/images/:lang/:wordId requests. Returns null if the path
 * doesn't match this prefix so the caller can fall through to other
 * /sync/* handlers.
 */
export async function handleImageRequest(
  req: Request,
  env: ImagesEnv,
  user: VerifiedUser,
): Promise<Response | null> {
  const url = new URL(req.url);
  if (!url.pathname.startsWith('/sync/images/')) return null;

  // /sync/images/:lang/:wordId
  const parts = url.pathname.split('/').filter(Boolean); // ['sync','images','lang','wordId']
  if (parts.length !== 4) {
    return errResp('Path must be /sync/images/:lang/:wordId', 400);
  }
  const [, , lang, wordId] = parts;
  if (!['zh', 'en'].includes(lang)) {
    return errResp(`Unsupported lang: ${lang}`, 400);
  }

  if (req.method === 'PUT') {
    return handlePut(req, env, user, lang, wordId);
  }
  if (req.method === 'GET') {
    return handleGet(env, user, lang, wordId);
  }
  if (req.method === 'DELETE') {
    return handleDelete(env, user, lang, wordId);
  }
  return errResp(`Method not allowed: ${req.method}`, 405);
}
