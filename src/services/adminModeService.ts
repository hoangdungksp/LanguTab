/**
 * adminModeService — D-19 role-based access.
 *
 * Replaces the old email-allowlist + hardcoded ADMIN_TOKEN (which shipped the
 * real secret in the client bundle). Now:
 *   1. After sign-in, we ask the worker `GET /exam/me` for the user's role
 *      (resolved from D1: 'user' | 'editor' | 'admin').
 *   2. If role is editor/admin (and the user hasn't toggled admin off), we set
 *      a sessionStorage SENTINEL `admin_token='role'`. This is ONLY a client UI
 *      gate (isAdminMode / planet unlock read its presence). It is NOT a secret
 *      and grants no server power — admin endpoints authorize by the Google
 *      token + D1 role, not by this flag.
 *
 * To grant someone editor/admin: set their `role` in D1 (admin dashboard / API).
 * No code change, no shared secret.
 */

import { authedFetch } from './authService';

const WORKER_URL = 'https://lingua-newtab-worker.kspstudio.workers.dev';

export type Role = 'user' | 'editor' | 'admin';

/** localStorage key: admin temporarily testing as a regular user. */
const ADMIN_DISABLED_KEY = 'linguanewtab.admin_disabled';

/** In-memory cache of the role from the last /exam/me call. */
let cachedRole: Role = 'user';

export function getCachedRole(): Role {
  return cachedRole;
}

/** True if the cached role may edit exam content (editor or admin). */
export function isAdminRole(): boolean {
  return cachedRole === 'editor' || cachedRole === 'admin';
}

export function isAdminManuallyDisabled(): boolean {
  return localStorage.getItem(ADMIN_DISABLED_KEY) === '1';
}

/** Apply (or clear) the client-side admin UI gate based on cached role. */
function applyGate(): void {
  if (isAdminRole() && !isAdminManuallyDisabled()) {
    sessionStorage.setItem('admin_token', 'role');
  } else {
    sessionStorage.removeItem('admin_token');
  }
}

/**
 * Fetch the signed-in user's role from the worker and apply the UI gate.
 * Call on app boot and after auth state changes. Safe to call when signed
 * out (clears the gate). Never throws.
 */
export async function refreshAdminRole(): Promise<Role> {
  try {
    const res = await authedFetch(`${WORKER_URL}/exam/me`);
    if (res.ok) {
      const data = (await res.json()) as { role?: Role };
      cachedRole = data.role === 'editor' || data.role === 'admin' ? data.role : 'user';
    } else {
      cachedRole = 'user';
    }
  } catch {
    // Not signed in / network — treat as normal user.
    cachedRole = 'user';
  }
  applyGate();
  return cachedRole;
}

/** Clear admin role + UI gate (on sign-out). */
export function clearAdminRole(): void {
  cachedRole = 'user';
  sessionStorage.removeItem('admin_token');
}

/** Manually toggle admin mode on/off (Settings UI). */
export function setAdminEnabled(enabled: boolean): void {
  if (enabled) {
    localStorage.removeItem(ADMIN_DISABLED_KEY);
  } else {
    localStorage.setItem(ADMIN_DISABLED_KEY, '1');
  }
  applyGate();
}
