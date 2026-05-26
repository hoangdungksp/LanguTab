/**
 * examCalibrationService — Sprint 4.9 (v1.4.0)
 *
 * Fetches drop zone overrides from worker for the current level/part,
 * with a small in-memory cache. Admin operations (save/delete) require
 * an admin token in sessionStorage (see README.md "Admin calibration").
 *
 * Override coordinates are 0-1 fractions of the scene image dimensions.
 * Caller (ExamPartView) merges these with hardcoded zones from levels.ts.
 */

/**
 * Hardcoded worker URL (matches the rest of the services like
 * examAudioService, examSceneService). Sprint 4.9.5.2: was previously
 * using import.meta.env.VITE_WORKER_URL which was never defined,
 * causing all admin fetches to use relative URLs and fail.
 */
import { authedFetch } from './authService';

const WORKER_URL = 'https://lingua-newtab-worker.kspstudio.workers.dev';

export interface ZoneOverride {
  zone_id: string;
  x: number;       // 0-1 fraction of scene width
  y: number;       // 0-1 fraction of scene height
  width: number;   // 0-1 fraction
  height: number;  // 0-1 fraction
}

interface CalibrationResponse {
  zones: ZoneOverride[];
}

/** In-memory cache to avoid refetching during a session. */
const cache = new Map<string, ZoneOverride[]>();

function cacheKey(levelId: string, partId: string): string {
  return `${levelId}::${partId}`;
}

/**
 * Fetch overrides for a level/part. Returns empty array on any error
 * — calibration is never load-blocking. The exam falls back to the
 * hardcoded 3×2 grid from levels.ts when no overrides exist.
 */
export async function getCalibration(
  levelId: string,
  partId: string,
): Promise<ZoneOverride[]> {
  const key = cacheKey(levelId, partId);
  const cached = cache.get(key);
  if (cached) return cached;

  try {
    const url = `${WORKER_URL}/exam/calibration/${encodeURIComponent(levelId)}/${encodeURIComponent(partId)}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      console.warn('[calibration] fetch returned', resp.status);
      cache.set(key, []);
      return [];
    }
    const data = (await resp.json()) as CalibrationResponse;
    const zones = Array.isArray(data?.zones) ? data.zones : [];
    cache.set(key, zones);
    return zones;
  } catch (err) {
    console.warn('[calibration] fetch error:', err);
    cache.set(key, []);
    return [];
  }
}

/**
 * Admin save — sends overrides to worker. Admin token from sessionStorage.
 * Throws on auth/server error so caller can show user-facing message.
 */
export async function saveCalibration(
  levelId: string,
  partId: string,
  zones: ZoneOverride[],
): Promise<{ ok: true; saved: number }> {
  const url = `${WORKER_URL}/admin/exam/calibration/${encodeURIComponent(levelId)}/${encodeURIComponent(partId)}`;
  const resp = await authedFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ zones }),
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`Save failed: ${resp.status} ${body}`);
  }
  // Invalidate cache so next read sees latest values
  cache.delete(cacheKey(levelId, partId));
  return resp.json() as Promise<{ ok: true; saved: number }>;
}

/**
 * Admin delete — removes all overrides for a level/part. Falls back to
 * hardcoded zones in levels.ts.
 */
export async function deleteCalibration(
  levelId: string,
  partId: string,
): Promise<{ ok: true; deleted: number }> {
  const url = `${WORKER_URL}/admin/exam/calibration/${encodeURIComponent(levelId)}/${encodeURIComponent(partId)}`;
  const resp = await authedFetch(url, { method: 'DELETE' });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`Delete failed: ${resp.status} ${body}`);
  }
  cache.delete(cacheKey(levelId, partId));
  return resp.json() as Promise<{ ok: true; deleted: number }>;
}

/** Check if calibration mode is active for the current session.
 *
 *  Sprint 4.9.5.1: Now reads from the auto-provisioned token set by
 *  `adminModeService.provisionAdminToken()` based on user email match.
 *  Admin no longer needs to manually paste the token in DevTools.
 */
export function isAdminMode(): boolean {
  return Boolean(sessionStorage.getItem('admin_token'));
}

/** Clear in-memory cache (e.g., after admin save during dev). */
export function clearCalibrationCache(): void {
  cache.clear();
}
