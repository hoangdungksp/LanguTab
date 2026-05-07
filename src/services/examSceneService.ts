import { authedFetch } from './authService';

const WORKER_URL = 'https://lingua-newtab-worker.kspstudio.workers.dev';

/**
 * Exam scene service — fetch (with R2 caching on server) and provide blob
 * URLs for `<img>` rendering on client.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Two-layer caching (parallels examAudioService)
 * ─────────────────────────────────────────────────────────────────────────
 *
 *   1. Server-side R2 (handled by worker) — persistent, cross-user
 *   2. Client-side blob URL Map (this module) — per-session, free re-render
 *
 * The first time a user encounters a scene, client GETs /exam/scene/:id
 * with auth. Worker checks R2 → MISS → calls Flux-1-Schnell → stores in R2
 * → returns JPEG bytes (~5-10s latency on miss). Client receives bytes,
 * makes a blob URL, caches it in this module's Map by sceneId.
 *
 * Why blob URLs and not direct `<img src="worker-url">`:
 *   1. <img> doesn't pass auth headers; we need authedFetch to attach the
 *      Google bearer token. Worker requires auth to prevent abuse.
 *   2. Blob URLs replay from memory instantly (no network on every navigate).
 *
 * Cleanup: blob URLs are revoked when the user leaves the exam tab
 * (TabExam unmount → clearSceneCache). For active exam, the cache holds
 * up to ~12 scenes × ~50KB JPEG = ~600KB worst case.
 */

const blobCache = new Map<string, string>();

export class ExamSceneError extends Error {
  constructor(
    message: string,
    public kind: 'auth' | 'network' | 'server' | 'not-warmed' | 'unknown',
  ) {
    super(message);
    this.name = 'ExamSceneError';
  }
}

/**
 * Get a blob URL for a scene image.
 *
 * - Returns instantly if already cached this session
 * - Otherwise fetches from worker (R2 read-only — admin-warmed scenes only)
 * - Caches the blob URL for free re-renders this session
 *
 * Sprint 4.7.2 architecture: scene generation is admin-only via separate
 * `/admin/exam/scenes/*` endpoints. Regular users get 404 if scene hasn't
 * been pre-warmed yet, with a hint that admin needs to generate first.
 * This protects Workers AI Neuron budget — 1 generation per scene total,
 * not 1 generation per first-time user.
 */
export async function getSceneUrl(sceneId: string): Promise<string> {
  const cached = blobCache.get(sceneId);
  if (cached) return cached;

  let res: Response;
  try {
    res = await authedFetch(
      `${WORKER_URL}/exam/scene/${encodeURIComponent(sceneId)}`,
    );
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('AUTH_REQUIRED')) {
      throw new ExamSceneError(
        'Bạn cần đăng nhập để xem hình bài thi',
        'auth',
      );
    }
    throw new ExamSceneError('Không kết nối được máy chủ', 'network');
  }

  if (res.status === 401) {
    throw new ExamSceneError(
      'Bạn cần đăng nhập để xem hình bài thi',
      'auth',
    );
  }
  // 404 = admin hasn't pre-warmed this scene yet. Distinct from other errors
  // because the user can't fix it — only the admin can. We surface a clear
  // message so the user knows it's a setup issue, not a network problem.
  if (res.status === 404) {
    throw new ExamSceneError(
      'Hình minh họa chưa được Admin tạo. Vui lòng liên hệ quản trị viên.',
      'not-warmed',
    );
  }
  if (!res.ok) {
    let errorMsg = `Lỗi tải hình (HTTP ${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) errorMsg = body.error;
    } catch {
      // Body wasn't JSON — keep generic error
    }
    throw new ExamSceneError(errorMsg, 'server');
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  blobCache.set(sceneId, url);
  return url;
}

/**
 * Free all cached blob URLs. Call when leaving the exam tab to release
 * memory. Subsequent fetches re-download from R2 (which is fast).
 */
export function clearSceneCache(): void {
  for (const url of blobCache.values()) {
    URL.revokeObjectURL(url);
  }
  blobCache.clear();
}

/**
 * Sprint 4.9.5.6: Invalidate cached blob for a single scene. Use after
 * admin regenerates the image via /admin/exam/scenes/:id/recaption with
 * regenerateImage:true — without this, ExamScene keeps showing the old
 * blob URL even though R2 has new image bytes.
 */
export function invalidateScene(sceneId: string): void {
  const cached = blobCache.get(sceneId);
  if (cached) {
    URL.revokeObjectURL(cached);
    blobCache.delete(sceneId);
  }
}
