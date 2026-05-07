/**
 * Google OAuth via Chrome Identity API.
 *
 * - Uses `chrome.identity.getAuthToken` — native Chrome flow, no external redirect.
 * - Token scope (see manifest.json `oauth2.scopes`): `drive.appdata` only.
 *   This grants access to a HIDDEN per-app Drive folder. We CANNOT read the
 *   user's other Drive files, and they cannot see ours in the regular UI.
 * - Tokens expire after ~1 hour. We auto-refresh on 401 in driveService.
 *
 * Usage:
 *   const token = await getAuthToken();   // prompts user first time
 *   if (token) { ...make API call... }
 *   await signOut();                       // revokes + clears cache
 */

type AuthChangeListener = (signedIn: boolean) => void;

let cachedToken: string | null = null;
const listeners: AuthChangeListener[] = [];

function emit(signedIn: boolean): void {
  for (const fn of listeners) {
    try {
      fn(signedIn);
    } catch (err) {
      console.error('[auth] listener error:', err);
    }
  }
}

/**
 * Chrome 87+ returns `{ token }` object; older Chrome returns a string.
 * Normalize to a single string | null.
 */
function normalizeTokenResult(
  result: string | { token?: string } | undefined
): string | null {
  if (!result) return null;
  if (typeof result === 'string') return result;
  return result.token ?? null;
}

/**
 * Get a valid OAuth token.
 *
 * @param interactive If true, prompts the user with Google consent the first time.
 *                    If false, returns null silently when not signed in (good for
 *                    startup "am I signed in?" checks).
 */
export async function getAuthToken(interactive = true): Promise<string | null> {
  if (cachedToken) return cachedToken;

  if (typeof chrome === 'undefined' || !chrome.identity?.getAuthToken) {
    console.error('[auth] chrome.identity not available — not running as extension?');
    return null;
  }

  return new Promise((resolve) => {
    chrome.identity.getAuthToken({ interactive }, (result) => {
      if (chrome.runtime.lastError) {
        // User declined, offline, or interactive=false with no cached token — all expected.
        if (interactive) {
          console.warn('[auth] getAuthToken error:', chrome.runtime.lastError.message);
        }
        cachedToken = null;
        emit(false);
        resolve(null);
        return;
      }
      const token = normalizeTokenResult(result as string | { token?: string });
      cachedToken = token;
      emit(!!token);
      resolve(token);
    });
  });
}

/**
 * Force a token refresh. Call this after a 401 from the Drive API:
 * clears the stale token from Chrome's cache and asks for a fresh one.
 */
export async function refreshToken(): Promise<string | null> {
  if (cachedToken) {
    const stale = cachedToken;
    await new Promise<void>((resolve) => {
      chrome.identity.removeCachedAuthToken({ token: stale }, () => resolve());
    });
    cachedToken = null;
  }
  // Interactive=false first — if the user still has consent on file, this is silent.
  return getAuthToken(false).then((t) => t ?? getAuthToken(true));
}

/**
 * Revoke the current token with Google and clear Chrome's cache.
 * After this the user must re-consent to get a new token.
 */
export async function signOut(): Promise<void> {
  const token = cachedToken ?? (await getAuthToken(false));
  if (!token) {
    emit(false);
    return;
  }

  // 1) Revoke with Google (best-effort; don't block on failure)
  try {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  } catch (err) {
    console.warn('[auth] revoke request failed:', err);
  }

  // 2) Clear Chrome's cached token
  await new Promise<void>((resolve) => {
    chrome.identity.removeCachedAuthToken({ token }, () => resolve());
  });

  cachedToken = null;
  emit(false);
}

/** Non-interactive check. Useful at startup to render the correct UI. */
export async function isSignedIn(): Promise<boolean> {
  const token = await getAuthToken(false);
  return !!token;
}

/** Subscribe to auth state changes. Returns an unsubscribe function. */
export function onAuthChange(fn: AuthChangeListener): () => void {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

/**
 * Fetch wrapper that automatically retries once with a fresh token if the
 * server returns 401. Solves the "token expired ~1h after sign-in, all
 * subsequent calls fail silently" UX bug.
 *
 * The token is attached as `Authorization: Bearer <token>`. Caller can pass
 * other headers via init.headers — they're merged with the auth header.
 *
 * Returns the final Response (caller still inspects res.ok / res.status).
 * Throws if the user isn't signed in at all (no token even after refresh).
 */
export async function authedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getAuthToken(false);
  if (!token) {
    throw new Error('AUTH_REQUIRED: not signed in');
  }
  const buildHeaders = (tok: string): HeadersInit => {
    const merged = new Headers(init.headers ?? {});
    merged.set('Authorization', `Bearer ${tok}`);
    return merged;
  };

  let res = await fetch(input, { ...init, headers: buildHeaders(token) });
  if (res.status === 401) {
    // Token likely expired — Chrome silently issues a new one if consent is
    // still on file. refreshToken() handles both interactive and silent.
    const fresh = await refreshToken();
    if (fresh) {
      res = await fetch(input, { ...init, headers: buildHeaders(fresh) });
    }
  }
  return res;
}

export interface UserInfo {
  /**
   * Google's stable user identifier (the OIDC `sub` claim). Never reused,
   * doesn't change if the user changes their email. Used as the primary
   * key in our D1 users table.
   */
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

/**
 * Fetch the signed-in user's basic profile (email, name, avatar, sub).
 *
 * Uses the OAuth userinfo endpoint — no extra scopes needed beyond what
 * we already requested (Drive scope implicitly grants email visibility
 * via OpenID). Returns null if not signed in or the request fails.
 *
 * Result is intentionally not cached here; the caller (useAuth hook) is
 * the right layer for caching since it already manages signedIn state.
 */
export async function getUserInfo(): Promise<UserInfo | null> {
  const token = await getAuthToken(false);
  if (!token) return null;

  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      id?: string;          // Google's sub claim — stable PK
      email?: string;
      name?: string;
      picture?: string;
    };
    if (!json.email || !json.id) return null;
    return {
      id: json.id,
      email: json.email,
      name: json.name,
      picture: json.picture,
    };
  } catch (err) {
    console.warn('[auth] getUserInfo failed:', err);
    return null;
  }
}
