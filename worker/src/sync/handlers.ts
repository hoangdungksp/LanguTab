/**
 * Sync API endpoints — Anki-style sync between Dexie (client) and D1 (server).
 *
 * Auth: same Google OAuth as /generate-story (Bearer token in Authorization header).
 *       Worker verifies via Google tokeninfo and uses the `sub` claim as user_id.
 *
 * Sync model (Anki-inspired):
 *   - User triggers sync explicitly (manual button) or on sign-in / tab close
 *   - First-time sync requires user choice: Upload (overwrite server) or
 *     Download (overwrite client). Subsequent syncs auto-merge with
 *     last-write-wins.
 *   - Force one-way option in settings for safety/restore scenarios
 *
 * Endpoints:
 *   GET  /sync/pull?since=<ts>     → delta pull (changes since timestamp)
 *   POST /sync/push                → delta push (batch upserts, merge)
 *   POST /sync/upload-all          → "Upload to cloud" — overwrite server
 *   GET  /sync/download-all        → "Download from cloud" — full snapshot
 *   POST /sync/clear               → wipe user's data (account deletion)
 *   GET  /sync/status              → user's tier + storage usage info
 *
 * Conflict resolution (auto-merge mode):
 *   Each row has updated_at (Unix ms). On push, server compares incoming
 *   row's updated_at vs existing row's updated_at; only writes if incoming
 *   is newer. Race window is ~100ms, acceptable for personal-use scale.
 *
 * Tables synced:
 *   - word_progress  (FSRS state)
 *   - user_stories   (AI-generated stories)
 *   - settings       (preferences)
 *   - custom_images  (metadata only — actual files in R2)
 *   - review_log     (append-only)
 *
 * NOT synced (handled separately):
 *   - users          (created on first sign-in via ensureUser)
 *   - sync_state     (server tracks, client doesn't read)
 *   - metrics_*      (admin-only)
 */

import { handleImageRequest, deleteAllUserImages } from './images';

export interface SyncEnv {
  DB?: D1Database;
  RATE_LIMITER?: KVNamespace;
  /** R2 bucket for custom flashcard images */
  IMAGES?: R2Bucket;
}

export interface VerifiedUser {
  userId: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

// ─── Sync payload types ────────────────────────────────────────────────────
//
// All sync payloads use snake_case keys to match the D1 column names. Client
// code translates camelCase ↔ snake_case in syncService.ts. This convention
// keeps the wire format aligned with the persistence layer for easier debug.

interface WordProgressRow {
  word_id: string;
  lang: string;
  due: number | null;
  state: number;
  stability: number | null;
  difficulty: number | null;
  reps: number;
  lapses: number;
  last_review: number | null;
  updated_at: number;
}

interface UserStoryRow {
  id: string;
  hsk_level: number;
  genre: string;
  is_favorite: number; // 0 | 1
  prompt_json: string;
  story_json: string;
  created_at: number;
  updated_at: number;
}

interface SettingsRow {
  data_json: string;
  updated_at: number;
}

interface CustomImageRow {
  word_id: string;
  lang: string;
  r2_key: string;
  mime_type: string;
  size_bytes: number;
  uploaded_at: number;
  updated_at: number;
}

interface ReviewLogRow {
  word_id: string;
  lang: string;
  rating: number;
  reviewed_at: number;
  created_at: number;
}

/**
 * Pull payload — what the server sends back to the client. Each table is a
 * separate array; client merges into local Dexie tables. A `cursor` is
 * returned for resumable sync if a single pull would be too large.
 */
interface PullResponse {
  word_progress: WordProgressRow[];
  user_stories: UserStoryRow[];
  settings: SettingsRow | null;
  custom_images: CustomImageRow[];
  review_log: ReviewLogRow[];
  /** Server timestamp at the moment of this pull. Client uses this as the
      `since` parameter for the next pull. */
  server_time: number;
  /** True if there are more rows to pull (rare; only when client is way
      behind, e.g. fresh device). Client should call /sync/pull again with
      the new since value. */
  has_more: boolean;
}

interface PushRequest {
  word_progress?: WordProgressRow[];
  user_stories?: UserStoryRow[];
  settings?: SettingsRow;
  custom_images?: CustomImageRow[];
  review_log?: ReviewLogRow[];
  /**
   * Optional client device id. Anki-style sync treats the user's collection
   * as a single shared resource (not per-device), so we no longer require
   * it. We still log it in sync_state when present, useful for debugging
   * "which browser did this sync come from" questions.
   */
  device_id?: string;
}

interface PushResponse {
  /** Number of rows accepted per table */
  accepted: {
    word_progress: number;
    user_stories: number;
    settings: number;
    custom_images: number;
    review_log: number;
  };
  /** Number of rows rejected (older than server's version) per table */
  rejected: {
    word_progress: number;
    user_stories: number;
    settings: number;
    custom_images: number;
    review_log: number;
  };
  server_time: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function jsonResp(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errResp(message: string, status = 400, detail?: string): Response {
  return jsonResp({ error: message, detail }, status);
}

/**
 * Upsert user record on every sign-in. Cheap (single PK lookup + UPSERT).
 * Updates last_active_at + display fields if user info changed on Google side.
 */
async function ensureUser(db: D1Database, user: VerifiedUser): Promise<void> {
  const now = Date.now();
  await db
    .prepare(
      `INSERT INTO users (id, email, display_name, avatar_url, tier, created_at, last_active_at)
       VALUES (?, ?, ?, ?, 'free', ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         email = excluded.email,
         display_name = excluded.display_name,
         avatar_url = excluded.avatar_url,
         last_active_at = excluded.last_active_at`,
    )
    .bind(
      user.userId,
      user.email,
      user.displayName ?? null,
      user.avatarUrl ?? null,
      now,
      now,
    )
    .run();
}

// ─── Pull ──────────────────────────────────────────────────────────────────
const PULL_LIMIT_PER_TABLE = 1000;

async function handlePull(
  req: Request,
  env: SyncEnv,
  user: VerifiedUser,
): Promise<Response> {
  if (!env.DB) return errResp('Database not configured', 500);

  await ensureUser(env.DB, user);

  const url = new URL(req.url);
  const since = parseInt(url.searchParams.get('since') ?? '0', 10);
  const serverTime = Date.now();

  // Run all queries in parallel — D1 supports concurrent prepared statements.
  // Each query limited to PULL_LIMIT_PER_TABLE rows; if any hits the limit,
  // we set has_more=true so client knows to call pull again with the new
  // since (= max updated_at returned).
  const [wp, us, st, ci, rl] = await Promise.all([
    env.DB.prepare(
      `SELECT word_id, lang, due, state, stability, difficulty, reps, lapses,
              last_review, updated_at
       FROM word_progress
       WHERE user_id = ? AND updated_at > ?
       ORDER BY updated_at ASC
       LIMIT ?`,
    ).bind(user.userId, since, PULL_LIMIT_PER_TABLE).all<WordProgressRow>(),

    env.DB.prepare(
      `SELECT id, hsk_level, genre, is_favorite, prompt_json, story_json,
              created_at, updated_at
       FROM user_stories
       WHERE user_id = ? AND updated_at > ?
       ORDER BY updated_at ASC
       LIMIT ?`,
    ).bind(user.userId, since, PULL_LIMIT_PER_TABLE).all<UserStoryRow>(),

    env.DB.prepare(
      `SELECT data_json, updated_at FROM settings
       WHERE user_id = ? AND updated_at > ?`,
    ).bind(user.userId, since).first<SettingsRow>(),

    env.DB.prepare(
      `SELECT word_id, lang, r2_key, mime_type, size_bytes, uploaded_at, updated_at
       FROM custom_images
       WHERE user_id = ? AND updated_at > ?
       ORDER BY updated_at ASC
       LIMIT ?`,
    ).bind(user.userId, since, PULL_LIMIT_PER_TABLE).all<CustomImageRow>(),

    env.DB.prepare(
      `SELECT word_id, lang, rating, reviewed_at, created_at
       FROM review_log
       WHERE user_id = ? AND created_at > ?
       ORDER BY created_at ASC
       LIMIT ?`,
    ).bind(user.userId, since, PULL_LIMIT_PER_TABLE).all<ReviewLogRow>(),
  ]);

  const wpRows = wp.results ?? [];
  const usRows = us.results ?? [];
  const ciRows = ci.results ?? [];
  const rlRows = rl.results ?? [];

  // has_more: true if any table hit the limit AND its tail has updated_at < serverTime
  // (which means there might be more rows in the gap [tail.updated_at, serverTime]).
  const hasMore =
    wpRows.length === PULL_LIMIT_PER_TABLE ||
    usRows.length === PULL_LIMIT_PER_TABLE ||
    ciRows.length === PULL_LIMIT_PER_TABLE ||
    rlRows.length === PULL_LIMIT_PER_TABLE;

  const response: PullResponse = {
    word_progress: wpRows,
    user_stories: usRows,
    settings: st ?? null,
    custom_images: ciRows,
    review_log: rlRows,
    server_time: serverTime,
    has_more: hasMore,
  };

  return jsonResp(response);
}

// ─── Push ──────────────────────────────────────────────────────────────────
async function handlePush(
  req: Request,
  env: SyncEnv,
  user: VerifiedUser,
): Promise<Response> {
  if (!env.DB) return errResp('Database not configured', 500);

  let body: PushRequest;
  try {
    body = await req.json() as PushRequest;
  } catch {
    return errResp('Invalid JSON body');
  }

  // device_id is now optional (Anki-style sync — collection is shared, not
  // per-device). If client doesn't send one, we just skip the sync_state
  // tracking step below.

  await ensureUser(env.DB, user);

  const accepted = { word_progress: 0, user_stories: 0, settings: 0, custom_images: 0, review_log: 0 };
  const rejected = { word_progress: 0, user_stories: 0, settings: 0, custom_images: 0, review_log: 0 };

  // Process each table. We use individual D1 statements per row rather than
  // batched transactions because D1 doesn't yet support multi-statement
  // transactions across heterogeneous tables in beta. Per-row is fine for
  // personal-scale (push payloads are typically <100 rows).
  for (const row of body.word_progress ?? []) {
    const result = await upsertWordProgress(env.DB, user.userId, row);
    if (result) accepted.word_progress++; else rejected.word_progress++;
  }
  for (const row of body.user_stories ?? []) {
    const result = await upsertUserStory(env.DB, user.userId, row);
    if (result) accepted.user_stories++; else rejected.user_stories++;
  }
  if (body.settings) {
    const result = await upsertSettings(env.DB, user.userId, body.settings);
    if (result) accepted.settings++; else rejected.settings++;
  }
  for (const row of body.custom_images ?? []) {
    const result = await upsertCustomImage(env.DB, user.userId, row);
    if (result) accepted.custom_images++; else rejected.custom_images++;
  }
  // Review log is append-only — never reject, but skip if (user_id, word_id, reviewed_at)
  // already exists (would happen if client retries a push after partial success).
  for (const row of body.review_log ?? []) {
    const inserted = await insertReviewLogIfNew(env.DB, user.userId, row);
    if (inserted) accepted.review_log++;
  }

  // Update sync_state for this device (only if client provided one — see
  // PushRequest comment about Anki-style optional device tracking).
  if (body.device_id) {
    await env.DB
      .prepare(
        `INSERT INTO sync_state (user_id, device_id, last_push_at)
         VALUES (?, ?, ?)
         ON CONFLICT(user_id, device_id) DO UPDATE SET last_push_at = excluded.last_push_at`,
      )
      .bind(user.userId, body.device_id, Date.now())
      .run();
  }

  const response: PushResponse = {
    accepted,
    rejected,
    server_time: Date.now(),
  };
  return jsonResp(response);
}

// ─── Per-table upsert helpers ──────────────────────────────────────────────
//
// Each helper returns true if the row was written (newer than existing or
// new), false if rejected (incoming has older updated_at than existing).
// Last-write-wins by updated_at field.

async function upsertWordProgress(
  db: D1Database,
  userId: string,
  row: WordProgressRow,
): Promise<boolean> {
  // INSERT OR REPLACE with a guard on updated_at — atomic last-write-wins.
  // SQLite's UPSERT lets us do this in one statement without a separate
  // SELECT to check timestamps.
  const result = await db
    .prepare(
      `INSERT INTO word_progress (
         user_id, word_id, lang, due, state, stability, difficulty,
         reps, lapses, last_review, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, word_id) DO UPDATE SET
         lang = excluded.lang,
         due = excluded.due,
         state = excluded.state,
         stability = excluded.stability,
         difficulty = excluded.difficulty,
         reps = excluded.reps,
         lapses = excluded.lapses,
         last_review = excluded.last_review,
         updated_at = excluded.updated_at
       WHERE excluded.updated_at > word_progress.updated_at`,
    )
    .bind(
      userId, row.word_id, row.lang, row.due, row.state,
      row.stability, row.difficulty, row.reps, row.lapses,
      row.last_review, row.updated_at,
    )
    .run();
  // D1 returns meta.changes — 1 if INSERT or UPDATE actually wrote, 0 if
  // the WHERE in DO UPDATE rejected the change (incoming was older).
  return (result.meta?.changes ?? 0) > 0;
}

async function upsertUserStory(
  db: D1Database,
  userId: string,
  row: UserStoryRow,
): Promise<boolean> {
  const result = await db
    .prepare(
      `INSERT INTO user_stories (
         id, user_id, hsk_level, genre, is_favorite,
         prompt_json, story_json, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         hsk_level = excluded.hsk_level,
         genre = excluded.genre,
         is_favorite = excluded.is_favorite,
         prompt_json = excluded.prompt_json,
         story_json = excluded.story_json,
         updated_at = excluded.updated_at
       WHERE excluded.updated_at > user_stories.updated_at`,
    )
    .bind(
      row.id, userId, row.hsk_level, row.genre, row.is_favorite,
      row.prompt_json, row.story_json, row.created_at, row.updated_at,
    )
    .run();
  return (result.meta?.changes ?? 0) > 0;
}

async function upsertSettings(
  db: D1Database,
  userId: string,
  row: SettingsRow,
): Promise<boolean> {
  const result = await db
    .prepare(
      `INSERT INTO settings (user_id, data_json, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         data_json = excluded.data_json,
         updated_at = excluded.updated_at
       WHERE excluded.updated_at > settings.updated_at`,
    )
    .bind(userId, row.data_json, row.updated_at)
    .run();
  return (result.meta?.changes ?? 0) > 0;
}

async function upsertCustomImage(
  db: D1Database,
  userId: string,
  row: CustomImageRow,
): Promise<boolean> {
  const result = await db
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
         updated_at = excluded.updated_at
       WHERE excluded.updated_at > custom_images.updated_at`,
    )
    .bind(
      userId, row.word_id, row.lang, row.r2_key, row.mime_type,
      row.size_bytes, row.uploaded_at, row.updated_at,
    )
    .run();
  return (result.meta?.changes ?? 0) > 0;
}

async function insertReviewLogIfNew(
  db: D1Database,
  userId: string,
  row: ReviewLogRow,
): Promise<boolean> {
  // Append-only: detect dupes by (user_id, word_id, reviewed_at) tuple.
  // Two rows with same triple = client retried after partial success.
  const existing = await db
    .prepare(
      `SELECT id FROM review_log
       WHERE user_id = ? AND word_id = ? AND reviewed_at = ? LIMIT 1`,
    )
    .bind(userId, row.word_id, row.reviewed_at)
    .first();
  if (existing) return false;

  await db
    .prepare(
      `INSERT INTO review_log (user_id, word_id, lang, rating, reviewed_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(userId, row.word_id, row.lang, row.rating, row.reviewed_at, row.created_at)
    .run();
  return true;
}

// ─── Clear (account deletion) ──────────────────────────────────────────────
async function handleClear(
  env: SyncEnv,
  user: VerifiedUser,
): Promise<Response> {
  if (!env.DB) return errResp('Database not configured', 500);

  // Run D1 + R2 cleanup in parallel. Both are idempotent — re-running the
  // same delete is a no-op. R2 errors don't roll back D1 (and vice versa);
  // if R2 cleanup fails, the user can retry the delete or we eat the few
  // KB of orphan storage as the cost of preserving a clean D1 wipe path.
  const [, r2Deleted] = await Promise.all([
    env.DB
      .prepare(`DELETE FROM users WHERE id = ?`)
      .bind(user.userId)
      .run(),
    deleteAllUserImages(env, user.userId).catch((err) => {
      console.warn('[sync] R2 cleanup failed during account delete', err);
      return 0;
    }),
  ]);

  return jsonResp({
    ok: true,
    deleted_user_id: user.userId,
    deleted_images: r2Deleted,
  });
}

// ─── Upload-all (Anki-style "Upload to AnkiWeb" — overwrite server) ────────
/**
 * Wipe all user data on server, replace with the payload from client.
 * Used when the user explicitly chooses "Upload to cloud" in the first-time
 * sync popup or in the Force one-way option.
 *
 * NOTE: We DO NOT delete the user row itself — only their data — because
 * the user is still active. Cascading delete on users would also wipe their
 * subscription tier / billing history, which we want to preserve.
 *
 * Payload shape is identical to PushRequest, but semantics are "replace all"
 * not "merge". We delete all user rows in each table first, then insert
 * the payload.
 */
async function handleUploadAll(
  req: Request,
  env: SyncEnv,
  user: VerifiedUser,
): Promise<Response> {
  if (!env.DB) return errResp('Database not configured', 500);

  let body: PushRequest;
  try {
    body = await req.json() as PushRequest;
  } catch {
    return errResp('Invalid JSON body');
  }

  await ensureUser(env.DB, user);

  // Wipe per-user data (NOT the users row — keep tier/billing)
  await Promise.all([
    env.DB.prepare(`DELETE FROM word_progress WHERE user_id = ?`).bind(user.userId).run(),
    env.DB.prepare(`DELETE FROM user_stories WHERE user_id = ?`).bind(user.userId).run(),
    env.DB.prepare(`DELETE FROM settings WHERE user_id = ?`).bind(user.userId).run(),
    env.DB.prepare(`DELETE FROM custom_images WHERE user_id = ?`).bind(user.userId).run(),
    env.DB.prepare(`DELETE FROM review_log WHERE user_id = ?`).bind(user.userId).run(),
  ]);

  // Now insert the payload using the same upsert helpers (which will
  // succeed because there are no existing rows to conflict with)
  let inserted = { word_progress: 0, user_stories: 0, settings: 0, custom_images: 0, review_log: 0 };
  for (const row of body.word_progress ?? []) {
    if (await upsertWordProgress(env.DB, user.userId, row)) inserted.word_progress++;
  }
  for (const row of body.user_stories ?? []) {
    if (await upsertUserStory(env.DB, user.userId, row)) inserted.user_stories++;
  }
  if (body.settings) {
    if (await upsertSettings(env.DB, user.userId, body.settings)) inserted.settings++;
  }
  for (const row of body.custom_images ?? []) {
    if (await upsertCustomImage(env.DB, user.userId, row)) inserted.custom_images++;
  }
  for (const row of body.review_log ?? []) {
    if (await insertReviewLogIfNew(env.DB, user.userId, row)) inserted.review_log++;
  }

  return jsonResp({
    ok: true,
    mode: 'upload-all',
    inserted,
    server_time: Date.now(),
  });
}

// ─── Download-all (Anki-style "Download from AnkiWeb" — server is source) ──
/**
 * Return the user's complete dataset as a single snapshot. Client uses this
 * to wipe local Dexie + repopulate fresh.
 *
 * Same shape as PullResponse but `since=0` semantics — every row, not just
 * changed rows. Could in theory be replaced by a pull with since=0, but we
 * keep it as a separate endpoint for two reasons:
 *   1. Clearer intent in logs ("the user clicked Download")
 *   2. Larger PULL_LIMIT_PER_TABLE for one-shot snapshot (no pagination
 *      needed since we know client will replace everything)
 */
async function handleDownloadAll(
  env: SyncEnv,
  user: VerifiedUser,
): Promise<Response> {
  if (!env.DB) return errResp('Database not configured', 500);

  await ensureUser(env.DB, user);

  // No `since` filter — return everything. We bump the per-table limit
  // assuming personal-scale collections (a heavy user might have ~5K word
  // progress rows; D1 free tier handles this in one query just fine).
  const FULL_LIMIT = 10_000;

  const [wp, us, st, ci, rl] = await Promise.all([
    env.DB.prepare(
      `SELECT word_id, lang, due, state, stability, difficulty, reps, lapses,
              last_review, updated_at
       FROM word_progress WHERE user_id = ? ORDER BY updated_at ASC LIMIT ?`,
    ).bind(user.userId, FULL_LIMIT).all<WordProgressRow>(),

    env.DB.prepare(
      `SELECT id, hsk_level, genre, is_favorite, prompt_json, story_json,
              created_at, updated_at
       FROM user_stories WHERE user_id = ? ORDER BY updated_at ASC LIMIT ?`,
    ).bind(user.userId, FULL_LIMIT).all<UserStoryRow>(),

    env.DB.prepare(
      `SELECT data_json, updated_at FROM settings WHERE user_id = ?`,
    ).bind(user.userId).first<SettingsRow>(),

    env.DB.prepare(
      `SELECT word_id, lang, r2_key, mime_type, size_bytes, uploaded_at, updated_at
       FROM custom_images WHERE user_id = ? ORDER BY updated_at ASC LIMIT ?`,
    ).bind(user.userId, FULL_LIMIT).all<CustomImageRow>(),

    env.DB.prepare(
      `SELECT word_id, lang, rating, reviewed_at, created_at
       FROM review_log WHERE user_id = ? ORDER BY created_at ASC LIMIT ?`,
    ).bind(user.userId, FULL_LIMIT).all<ReviewLogRow>(),
  ]);

  return jsonResp({
    word_progress: wp.results ?? [],
    user_stories: us.results ?? [],
    settings: st ?? null,
    custom_images: ci.results ?? [],
    review_log: rl.results ?? [],
    server_time: Date.now(),
    has_more: false,
    mode: 'download-all',
  });
}

// ─── Status (tier info, storage usage) ─────────────────────────────────────
async function handleStatus(
  env: SyncEnv,
  user: VerifiedUser,
): Promise<Response> {
  if (!env.DB) return errResp('Database not configured', 500);


  await ensureUser(env.DB, user);

  const userRow = await env.DB
    .prepare(
      `SELECT tier, tier_expires_at, created_at, last_active_at
       FROM users WHERE id = ?`,
    )
    .bind(user.userId)
    .first<{
      tier: string;
      tier_expires_at: number | null;
      created_at: number;
      last_active_at: number;
    }>();

  // Counts of user's data — useful for "delete account" confirmation flow
  // and for showing storage usage in settings.
  const [wpCount, usCount, ciCount, rlCount] = await Promise.all([
    env.DB.prepare(`SELECT COUNT(*) as c FROM word_progress WHERE user_id = ?`)
      .bind(user.userId).first<{ c: number }>(),
    env.DB.prepare(`SELECT COUNT(*) as c FROM user_stories WHERE user_id = ?`)
      .bind(user.userId).first<{ c: number }>(),
    env.DB.prepare(`SELECT COUNT(*) as c, COALESCE(SUM(size_bytes), 0) as bytes FROM custom_images WHERE user_id = ?`)
      .bind(user.userId).first<{ c: number; bytes: number }>(),
    env.DB.prepare(`SELECT COUNT(*) as c FROM review_log WHERE user_id = ?`)
      .bind(user.userId).first<{ c: number }>(),
  ]);

  return jsonResp({
    user: {
      id: user.userId,
      email: user.email,
      tier: userRow?.tier ?? 'free',
      tier_expires_at: userRow?.tier_expires_at ?? null,
      created_at: userRow?.created_at,
      last_active_at: userRow?.last_active_at,
    },
    counts: {
      word_progress: wpCount?.c ?? 0,
      user_stories: usCount?.c ?? 0,
      custom_images: ciCount?.c ?? 0,
      custom_images_bytes: ciCount?.bytes ?? 0,
      review_log: rlCount?.c ?? 0,
    },
  });
}

// ─── Main router ───────────────────────────────────────────────────────────
export async function handleSyncRequest(
  req: Request,
  env: SyncEnv,
  user: VerifiedUser,
): Promise<Response | null> {
  const url = new URL(req.url);
  if (!url.pathname.startsWith('/sync/')) return null;

  // Image endpoints — PUT/GET/DELETE /sync/images/:lang/:wordId
  if (url.pathname.startsWith('/sync/images/')) {
    return handleImageRequest(req, env, user);
  }

  if (url.pathname === '/sync/pull' && req.method === 'GET') {
    return handlePull(req, env, user);
  }
  if (url.pathname === '/sync/push' && req.method === 'POST') {
    return handlePush(req, env, user);
  }
  if (url.pathname === '/sync/upload-all' && req.method === 'POST') {
    return handleUploadAll(req, env, user);
  }
  if (url.pathname === '/sync/download-all' && req.method === 'GET') {
    return handleDownloadAll(env, user);
  }
  if (url.pathname === '/sync/clear' && req.method === 'POST') {
    return handleClear(env, user);
  }
  if (url.pathname === '/sync/status' && req.method === 'GET') {
    return handleStatus(env, user);
  }

  return errResp('Sync endpoint not found', 404);
}
