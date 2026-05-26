import { authedFetch } from './authService';

const WORKER_URL = 'https://lingua-newtab-worker.kspstudio.workers.dev';

/**
 * Exam audio service — fetch (with R2 caching) and provide blob URLs for
 * <audio> playback.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Two-layer caching
 * ─────────────────────────────────────────────────────────────────────────
 *
 *   1. Server-side R2 (handled by worker) — persistent, cross-user
 *   2. Client-side blob URL Map (this module) — per-session, free replay
 *
 * The first time a user plays a question, the client POSTs to /exam/audio
 * with `{ audioKey, audioScript }`. Worker checks R2 → MISS → calls TTS
 * → stores in R2 → returns MP3 bytes (~3-5s). Client receives the bytes,
 * makes a blob URL, plays. We then keep the blob URL in this module's
 * `blobCache` Map keyed by audioKey so subsequent plays in the same session
 * are instant (no network at all).
 *
 * Why blob URLs and not just <audio src=workerURL>: streaming directly
 * from the worker would re-fetch on every play (browser doesn't always
 * cache POST responses), wasting bandwidth and adding a small latency
 * each time. Blob URLs are 100% local after first fetch.
 *
 * Cleanup: blob URLs are revoked when the user navigates away from the
 * exam (TabExam unmount). For v1.0 we accept the small leak if they keep
 * the tab open all day with the same exam — total memory is bounded by
 * test size (~12 audio × ~50KB = 600KB worst case).
 */

/**
 * Sprint 4.9.3: blob cache keyed by audioKey + audioScript hash so script
 * changes invalidate the in-memory blob cache. Without this, if a level's
 * audioScript was updated mid-session the blob cache returned stale audio.
 */
const blobCache = new Map<string, string>();

/** Compute short hash for cache key. Browser Web Crypto. */
async function scriptHash(s: string): Promise<string> {
  const buf = new TextEncoder().encode(s);
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  const bytes = new Uint8Array(hashBuf);
  let hex = '';
  for (let i = 0; i < 4; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

export class ExamAudioError extends Error {
  constructor(
    message: string,
    public kind: 'auth' | 'network' | 'server' | 'unknown',
  ) {
    super(message);
    this.name = 'ExamAudioError';
  }
}

/**
 * Get a playable blob URL for an audio question.
 *
 * - Returns instantly if already cached this session
 * - Otherwise fetches from worker (which checks R2 → falls back to TTS)
 * - Caches the result for free replay
 */
export async function getAudioUrl(
  audioKey: string,
  audioScript: string,
): Promise<string> {
  // Sprint 4.9.3: hash script into cache key
  const cacheKey = `${audioKey}::${await scriptHash(audioScript)}`;
  const cached = blobCache.get(cacheKey);
  if (cached) return cached;

  let res: Response;
  try {
    res = await authedFetch(`${WORKER_URL}/exam/audio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioKey, audioScript }),
    });
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('AUTH_REQUIRED')) {
      throw new ExamAudioError(
        'Bạn cần đăng nhập để nghe audio bài thi',
        'auth',
      );
    }
    throw new ExamAudioError('Không kết nối được máy chủ', 'network');
  }

  if (res.status === 401) {
    throw new ExamAudioError(
      'Bạn cần đăng nhập để nghe audio bài thi',
      'auth',
    );
  }
  if (!res.ok) {
    let errorMsg = `Lỗi tải audio (HTTP ${res.status})`;
    try {
      const body = await res.json() as { error?: string };
      if (body.error) errorMsg = body.error;
    } catch {
      // Body wasn't JSON — keep the generic error.
    }
    throw new ExamAudioError(errorMsg, 'server');
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  blobCache.set(cacheKey, url);
  return url;
}

/**
 * D-18 admin tool: generate + cache the audio for a (audioKey, audioScript)
 * via the admin-only worker endpoint. Normal users can only READ audio
 * (GET-only /exam/audio); this is the single path that spends TTS budget.
 * Returns the provider that produced the audio. Drops any stale in-session
 * blob so the next playback streams the freshly cached file.
 */
export async function adminGenerateAudio(
  audioKey: string,
  audioScript: string,
  force = false,
): Promise<string> {
  const res = await authedFetch(`${WORKER_URL}/admin/exam/audio/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audioKey, audioScript, force }),
  });
  if (!res.ok) {
    let msg = `Gen audio thất bại (HTTP ${res.status})`;
    try {
      const b = (await res.json()) as { error?: string };
      if (b.error) msg = b.error;
    } catch { /* keep generic */ }
    throw new ExamAudioError(msg, 'server');
  }
  const cacheKey = `${audioKey}::${await scriptHash(audioScript)}`;
  const old = blobCache.get(cacheKey);
  if (old) {
    URL.revokeObjectURL(old);
    blobCache.delete(cacheKey);
  }
  return res.headers.get('X-Audio-Provider') ?? 'unknown';
}

/**
 * D-18 admin tool: check whether audio for (audioKey, audioScript) already
 * exists in R2 — powers the "✓ có audio / ⚠️ chưa có audio" badge. Cheap
 * (worker uses HEAD). Returns false on any error (treat as "not ready").
 */
export async function adminCheckAudio(
  audioKey: string,
  audioScript: string,
): Promise<boolean> {
  try {
    const res = await authedFetch(`${WORKER_URL}/admin/exam/audio/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioKey, audioScript }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { cached?: boolean };
    return !!data.cached;
  } catch {
    return false;
  }
}

/**
 * Free all cached blob URLs. Call when leaving the exam tab to release
 * memory. Subsequent fetches will re-download from R2 (which is fast).
 */
export function clearAudioCache(): void {
  for (const url of blobCache.values()) {
    URL.revokeObjectURL(url);
  }
  blobCache.clear();
}

/**
 * Pre-fetch audio in the background so playback is instant when the user
 * clicks play. Useful at the start of a part: prefetch all questions in
 * that part so the kid doesn't wait between questions.
 *
 * Errors are swallowed — prefetch is best-effort, never critical.
 */
export async function prefetchAudio(
  items: { audioKey: string; audioScript: string }[],
): Promise<void> {
  await Promise.allSettled(
    items.map((item) =>
      getAudioUrl(item.audioKey, item.audioScript).catch(() => {
        /* ignore — prefetch is best-effort */
      }),
    ),
  );
}
