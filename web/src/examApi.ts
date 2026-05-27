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

/** Public scene image URL (200 if generated, 404 otherwise). */
export const sceneImageUrl = (sceneId: string) =>
  `${WORKER_URL}/exam/scene/${encodeURIComponent(sceneId)}`;

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
