/**
 * examAudioScriptService — Sprint 4.9.4 (v1.6.0)
 *
 * Fetches admin-edited audio script overrides per (levelId, partId).
 * Mirrors examCalibrationService pattern.
 *
 * Why this exists: AI Flux generates scenes that don't match hardcoded
 * audio scripts in levels.ts. Admin views actual generated image, edits
 * the script to match what they see, saves to D1. All users get the
 * matching script + audio.
 *
 * Falls back to hardcoded script (passed as `defaultScript`) when no
 * override is set.
 */

/**
 * Hardcoded worker URL (matches the rest of the services like
 * examAudioService, examSceneService). Sprint 4.9.5.2: was previously
 * using import.meta.env.VITE_WORKER_URL which was never defined,
 * causing all admin fetches to use relative URLs and fail.
 */
import { authedFetch } from './authService';

const WORKER_URL = 'https://lingua-newtab-worker.kspstudio.workers.dev';

interface AudioScriptResponse {
  script: string | null;
}

/** In-memory cache to avoid refetching during a session. */
const cache = new Map<string, string | null>();

function cacheKey(levelId: string, partId: string): string {
  return `${levelId}::${partId}`;
}

/**
 * Get effective audio script: returns override if admin saved one, else
 * `defaultScript` (hardcoded from levels.ts). Never blocks audio playback
 * — on any error returns defaultScript.
 */
export async function getEffectiveAudioScript(
  levelId: string,
  partId: string,
  defaultScript: string,
): Promise<string> {
  const key = cacheKey(levelId, partId);
  if (cache.has(key)) {
    const cached = cache.get(key);
    return cached ?? defaultScript;
  }

  try {
    const url = `${WORKER_URL}/exam/audio-script/${encodeURIComponent(levelId)}/${encodeURIComponent(partId)}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      cache.set(key, null);
      return defaultScript;
    }
    const data = (await resp.json()) as AudioScriptResponse;
    cache.set(key, data.script ?? null);
    return data.script ?? defaultScript;
  } catch (err) {
    console.warn('[audio-script] fetch error:', err);
    cache.set(key, null);
    return defaultScript;
  }
}

/**
 * Admin save — sends script to worker. Throws on error so caller can
 * surface a user-facing message.
 */
export async function saveAudioScript(
  levelId: string,
  partId: string,
  script: string,
): Promise<{ ok: true; length: number }> {
  const url = `${WORKER_URL}/admin/exam/audio-script/${encodeURIComponent(levelId)}/${encodeURIComponent(partId)}`;
  const resp = await authedFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ script }),
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`Save failed: ${resp.status} ${body}`);
  }
  // Invalidate cache so next read fetches the new script
  cache.delete(cacheKey(levelId, partId));
  return resp.json() as Promise<{ ok: true; length: number }>;
}

/**
 * Admin delete — falls back to hardcoded script in levels.ts.
 */
export async function deleteAudioScript(
  levelId: string,
  partId: string,
): Promise<{ ok: true; deleted: number }> {
  const url = `${WORKER_URL}/admin/exam/audio-script/${encodeURIComponent(levelId)}/${encodeURIComponent(partId)}`;
  const resp = await authedFetch(url, { method: 'DELETE' });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`Delete failed: ${resp.status} ${body}`);
  }
  cache.delete(cacheKey(levelId, partId));
  return resp.json() as Promise<{ ok: true; deleted: number }>;
}

/** Fetch the raw override (or null) so admin can prefill the editor. */
export async function getAudioScriptRaw(
  levelId: string,
  partId: string,
): Promise<string | null> {
  try {
    const url = `${WORKER_URL}/exam/audio-script/${encodeURIComponent(levelId)}/${encodeURIComponent(partId)}`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = (await resp.json()) as AudioScriptResponse;
    return data.script ?? null;
  } catch {
    return null;
  }
}

export function clearAudioScriptCache(): void {
  cache.clear();
}
