/** Editor/admin exam-content endpoints (scene images, audio, scripts). */
import { getToken, authExpired } from './auth';

const WORKER_URL = (import.meta.env.VITE_WORKER_URL as string)
  || 'https://lingua-newtab-worker.kspstudio.workers.dev';

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const t = getToken();
  return { ...(t ? { Authorization: `Bearer ${t}` } : {}), ...extra };
}

async function asJson<T>(res: Response): Promise<T> {
  if (res.status === 401) { authExpired(); throw new Error('Phiên hết hạn — đăng nhập lại.'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
  return data as T;
}

/**
 * Fetch a scene image WITH the auth token (GET /exam/scene/:id requires a
 * signed-in user — a plain <img src> can't send the Bearer header) → object
 * URL. Throws on 404 (not generated yet).
 */
export async function fetchSceneImage(sceneId: string): Promise<string> {
  const res = await fetch(`${WORKER_URL}/exam/scene/${encodeURIComponent(sceneId)}?t=${Date.now()}`,
    { headers: authHeaders() });
  if (res.status === 401) { authExpired(); throw new Error('Phiên hết hạn — đăng nhập lại.'); }
  if (!res.ok) throw new Error('no-image');
  return URL.createObjectURL(await res.blob());
}

/** Bulk: which scenes already have a generated image (one R2 head per scene). */
export async function scenesStatus(): Promise<Record<string, boolean>> {
  const res = await fetch(`${WORKER_URL}/admin/exam/scenes/status`, { headers: authHeaders() });
  const data = await asJson<{ scenes: Record<string, { cached: boolean }> }>(res);
  const out: Record<string, boolean> = {};
  for (const [id, v] of Object.entries(data.scenes)) out[id] = v.cached;
  return out;
}

/** Generate a scene image via Flux (overwrites cache). */
export async function generateScene(sceneId: string): Promise<{ bytes: number }> {
  const res = await fetch(`${WORKER_URL}/admin/exam/scenes/${encodeURIComponent(sceneId)}/generate`,
    { method: 'POST', headers: authHeaders() });
  return asJson(res);
}

/** Fetch the canonical image-gen prompt (to paste into an external tool). */
export async function getScenePrompt(sceneId: string): Promise<{ prompt: string }> {
  const res = await fetch(`${WORKER_URL}/admin/exam/scenes/${encodeURIComponent(sceneId)}/prompt`,
    { headers: authHeaders() });
  return asJson(res);
}

/** Upload a manually-made image (raw bytes) → overwrites the scene. */
export async function uploadScene(sceneId: string, file: File): Promise<{ ok: boolean }> {
  const res = await fetch(`${WORKER_URL}/admin/exam/scenes/${encodeURIComponent(sceneId)}/upload`,
    { method: 'POST', headers: authHeaders({ 'Content-Type': file.type || 'image/jpeg' }), body: file });
  return asJson(res);
}

/** Is this (audioKey, script) already cached? */
export async function audioStatus(audioKey: string, audioScript: string): Promise<{ cached: boolean; provider?: string }> {
  const res = await fetch(`${WORKER_URL}/admin/exam/audio/status`,
    { method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ audioKey, audioScript }) });
  return asJson(res);
}

/** Generate/regenerate audio for (audioKey, script). Returns provider header. */
export async function generateAudio(audioKey: string, audioScript: string, force = true): Promise<{ provider: string; bytes: number }> {
  const res = await fetch(`${WORKER_URL}/admin/exam/audio/generate`,
    { method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ audioKey, audioScript, force }) });
  if (res.status === 401) { authExpired(); throw new Error('Phiên hết hạn — đăng nhập lại.'); }
  if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 120)}`);
  const buf = await res.arrayBuffer();
  return { provider: res.headers.get('X-Audio-Provider') || '?', bytes: buf.byteLength };
}

/** Fetch cached audio (read-only, no TTS cost) → object URL to play. 404 if not generated yet. */
export async function fetchAudio(audioKey: string, audioScript: string): Promise<string> {
  const res = await fetch(`${WORKER_URL}/exam/audio`,
    { method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ audioKey, audioScript }) });
  if (res.status === 401) { authExpired(); throw new Error('Phiên hết hạn — đăng nhập lại.'); }
  if (res.status === 404) throw new Error('Chưa có audio — bấm “Tạo audio” trước.');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return URL.createObjectURL(await res.blob());
}

// ── Calibration (drop-zone / colour-region positions, 0-1 fractions) ──────
export interface ZoneOverride { zone_id: string; x: number; y: number; width: number; height: number }

export async function getCalibration(levelId: string, partId: string): Promise<ZoneOverride[]> {
  const res = await fetch(`${WORKER_URL}/exam/calibration/${encodeURIComponent(levelId)}/${encodeURIComponent(partId)}`,
    { headers: authHeaders() });
  if (!res.ok) return [];
  const data = await res.json().catch(() => ({})) as { zones?: ZoneOverride[] };
  return data.zones ?? [];
}
export async function saveCalibration(levelId: string, partId: string, zones: ZoneOverride[]): Promise<void> {
  const res = await fetch(`${WORKER_URL}/admin/exam/calibration/${encodeURIComponent(levelId)}/${encodeURIComponent(partId)}`,
    { method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ zones }) });
  await asJson(res);
}
export async function deleteCalibration(levelId: string, partId: string): Promise<void> {
  const res = await fetch(`${WORKER_URL}/admin/exam/calibration/${encodeURIComponent(levelId)}/${encodeURIComponent(partId)}`,
    { method: 'DELETE', headers: authHeaders() });
  await asJson(res);
}

/** Save a script override for a part (then regen audio to apply it). */
export async function saveScript(levelId: string, partId: string, script: string): Promise<{ ok: true }> {
  const res = await fetch(`${WORKER_URL}/admin/exam/audio-script/${encodeURIComponent(levelId)}/${encodeURIComponent(partId)}`,
    { method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ script }) });
  return asJson(res);
}

/** Remove the override → fall back to the built-in script. */
export async function deleteScript(levelId: string, partId: string): Promise<{ ok: true }> {
  const res = await fetch(`${WORKER_URL}/admin/exam/audio-script/${encodeURIComponent(levelId)}/${encodeURIComponent(partId)}`,
    { method: 'DELETE', headers: authHeaders() });
  return asJson(res);
}
