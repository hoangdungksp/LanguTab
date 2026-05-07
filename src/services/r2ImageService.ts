/**
 * R2 image service — replaces driveService for custom flashcard images.
 *
 * The Worker handles auth + storage; this client just wraps the four
 * REST endpoints with auto-refresh on 401 (via authedFetch).
 *
 * Why a separate service from driveService instead of replacing in place:
 *   - Existing users have Drive-uploaded images we don't want to break
 *     mid-session. imageService.ts can read from R2 first, fall back to
 *     Drive for legacy records, until they're all migrated.
 *   - Easier to delete driveService.ts in a future version once nobody
 *     has any `driveFileId`-flagged images left.
 */

import { authedFetch } from './authService';

const WORKER_URL = 'https://lingua-newtab-worker.kspstudio.workers.dev';

export interface UploadResult {
  /** R2 object key — `{userId}/{lang}/{wordId}` */
  r2_key: string;
  size_bytes: number;
  mime_type: string;
  /** User's used storage after this upload (informational) */
  used_bytes: number;
  /** User's quota for their tier (informational) */
  quota_bytes: number;
}

export class R2ImageError extends Error {
  constructor(
    message: string,
    public kind: 'auth' | 'quota' | 'too_large' | 'not_found' | 'network' | 'unknown',
  ) {
    super(message);
  }
}

/**
 * Upload image bytes to R2 via the Worker. The Worker enforces:
 *   - mime type whitelist (jpeg/png/webp/gif)
 *   - max 5 MB per file
 *   - per-user quota (tier-dependent)
 */
export async function uploadImage(
  wordId: string,
  lang: string,
  blob: Blob,
): Promise<UploadResult> {
  // Trim wordId/lang of anything that could mess with the URL path. The
  // Worker also re-validates, so this is defense in depth.
  const safeWord = encodeURIComponent(wordId);
  const safeLang = encodeURIComponent(lang);
  const url = `${WORKER_URL}/sync/images/${safeLang}/${safeWord}`;

  let res: Response;
  try {
    res = await authedFetch(url, {
      method: 'PUT',
      headers: {
        // PUT raw body — Worker reads Content-Type for the mime check.
        'Content-Type': blob.type || 'application/octet-stream',
      },
      body: blob,
    });
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('AUTH_REQUIRED')) {
      throw new R2ImageError('Bạn cần đăng nhập để upload ảnh', 'auth');
    }
    throw new R2ImageError('Không kết nối được máy chủ', 'network');
  }

  if (res.status === 413) {
    const body = await readJsonSafely(res);
    throw new R2ImageError(
      body?.error ?? 'File hoặc dung lượng vượt giới hạn',
      'quota',
    );
  }
  if (res.status === 415) {
    throw new R2ImageError('Định dạng file không hỗ trợ (chỉ JPEG/PNG/WebP/GIF)', 'too_large');
  }
  if (!res.ok) {
    const body = await readJsonSafely(res);
    throw new R2ImageError(
      body?.error ?? `Upload thất bại (${res.status})`,
      'unknown',
    );
  }

  return (await res.json()) as UploadResult;
}

/**
 * Download image bytes from R2 via the Worker. Returns null on 404
 * (image not on server — caller falls back to local cache or shows
 * placeholder). Throws on other errors.
 */
export async function downloadImage(
  wordId: string,
  lang: string,
): Promise<Blob | null> {
  const safeWord = encodeURIComponent(wordId);
  const safeLang = encodeURIComponent(lang);
  const url = `${WORKER_URL}/sync/images/${safeLang}/${safeWord}`;

  let res: Response;
  try {
    res = await authedFetch(url);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('AUTH_REQUIRED')) {
      throw new R2ImageError('Bạn cần đăng nhập', 'auth');
    }
    throw new R2ImageError('Không kết nối được máy chủ', 'network');
  }

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new R2ImageError(`Tải ảnh thất bại (${res.status})`, 'unknown');
  }
  return res.blob();
}

/**
 * Delete an image from R2 + its D1 metadata row. Idempotent — 404
 * is treated as success (the image was already gone).
 */
export async function deleteImage(
  wordId: string,
  lang: string,
): Promise<void> {
  const safeWord = encodeURIComponent(wordId);
  const safeLang = encodeURIComponent(lang);
  const url = `${WORKER_URL}/sync/images/${safeLang}/${safeWord}`;

  let res: Response;
  try {
    res = await authedFetch(url, { method: 'DELETE' });
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('AUTH_REQUIRED')) {
      throw new R2ImageError('Bạn cần đăng nhập', 'auth');
    }
    throw new R2ImageError('Không kết nối được máy chủ', 'network');
  }

  if (res.status === 404) return; // already gone — fine
  if (!res.ok) {
    throw new R2ImageError(`Xóa ảnh thất bại (${res.status})`, 'unknown');
  }
}

/** Read a JSON body safely — returns null if response isn't JSON. */
async function readJsonSafely(res: Response): Promise<{ error?: string } | null> {
  try {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}
