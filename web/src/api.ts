/** Thin client for the shared worker API, attaching the Google Bearer token. */
import { getToken, clearToken } from './auth';

const WORKER_URL = (import.meta.env.VITE_WORKER_URL as string)
  || 'https://lingua-newtab-worker.kspstudio.workers.dev';

async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${WORKER_URL}${path}`, {
    ...opts,
    headers: {
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });
  if (res.status === 401) {
    clearToken();
    throw new Error('Phiên đăng nhập hết hạn — đăng nhập lại.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
  return data as T;
}

export interface Me { email: string; role: 'user' | 'editor' | 'admin'; tier: string }
export interface AdminUser {
  id: string; email: string; display_name: string | null; avatar_url: string | null;
  role: string | null; tier: string | null; tier_expires_at: number | null;
  created_at: number; last_active_at: number;
}
export interface Stats {
  totalUsers: number;
  byTier: { tier: string; n: number }[];
  byRole: { role: string; n: number }[];
  levelsCompleted: number;
  starsEarned: number;
}
export interface ProgressRow {
  level_number: number; lang: string; best_stars: number; max_stars: number;
  attempts: number; first_completed_at: number; last_attempt_at: number;
}

export const getMe = () => api<Me>('/exam/me');
export const listUsers = () => api<{ users: AdminUser[] }>('/admin/users').then((r) => r.users);
export const getStats = () => api<Stats>('/admin/stats');
export const setUserRole = (userId: string, role: string) =>
  api<{ ok: boolean }>('/admin/users/role', { method: 'POST', body: JSON.stringify({ userId, role }) });
export const getUserProgress = (userId: string) =>
  api<{ progress: ProgressRow[] }>(`/admin/users/${encodeURIComponent(userId)}/progress`).then((r) => r.progress);
