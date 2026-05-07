/**
 * adminModeService — Sprint 4.9.5.1 (v1.7.1)
 *
 * Replaces the manual sessionStorage admin_token workflow with email-based
 * admin detection. Workflow:
 *   1. User signs in via Google OAuth → fetchSyncStatus() returns email
 *   2. If email matches ADMIN_EMAILS list → admin mode auto-enabled
 *   3. User can toggle off via Settings (saves localStorage flag)
 *   4. Toggle back on by clicking the same toggle in Settings
 *
 * Security note: This is UI-level only. Worker still validates Bearer
 * ADMIN_TOKEN on admin endpoints. The admin token is now also auto-set
 * in sessionStorage when email matches, so existing admin endpoints
 * (calibration, audio scripts, vision recaption) keep working without
 * changes.
 *
 * Future Sprint: Worker should verify Google ID token + check email
 * against ADMIN_EMAILS env var instead of static Bearer token. That's
 * the proper security model. v1.7.1 keeps the Bearer token but auto-
 * provisions it for admin emails.
 */

/**
 * List of admin email addresses (case-insensitive). To add a new admin,
 * append their Google email here. Stored in client code by design — this
 * is just the UI hint; worker still authoritatively validates the token.
 */
const ADMIN_EMAILS: string[] = [
  'jasonnguyenksp@gmail.com',
  'dungthichvar@gmail.com',
];

/**
 * The admin token used for worker authentication. This is the same token
 * configured in worker/wrangler.toml ADMIN_TOKEN. It's auto-provisioned
 * to sessionStorage when an admin email signs in.
 *
 * NOTE: Yes, this is leaky — anyone who unzips the extension can read
 * this. For now we accept the risk because:
 *   1. The extension is a private dev build, not yet on CWS
 *   2. Admin endpoints don't have catastrophic blast radius (no user data
 *      deletion, just calibration/script overrides which can be reverted)
 *   3. Sprint 5.0 will replace with Google ID token verification at worker
 *      level before public CWS launch
 */
const ADMIN_TOKEN_FOR_PROVISIONING =
  '5320a30ce78e85f9edb69bc4596944fd4743ae4e601a2150d8553fb59a120212';

/** localStorage key for user-disabled admin mode (when admin email signs in
 *  but they want to test as a regular user temporarily). */
const ADMIN_DISABLED_KEY = 'linguanewtab.admin_disabled';

/** Returns true if the given email is in the admin list (case-insensitive). */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const lower = email.toLowerCase();
  return ADMIN_EMAILS.some((e) => e.toLowerCase() === lower);
}

/**
 * Whether admin mode is currently active. Combines:
 *   - User's email is in ADMIN_EMAILS list (passed in by caller from auth)
 *   - User has NOT manually disabled admin mode via Settings toggle
 *
 * Pass undefined for email if auth state unknown (returns false).
 */
export function isAdminActive(email: string | null | undefined): boolean {
  if (!isAdminEmail(email)) return false;
  return localStorage.getItem(ADMIN_DISABLED_KEY) !== '1';
}

/**
 * Auto-provision admin token to sessionStorage if user's email is admin.
 * Call this on app boot and after sign-in. Idempotent.
 *
 * If user has manually disabled admin mode, this does NOT provision the
 * token (so admin features hide).
 */
export function provisionAdminToken(email: string | null | undefined): void {
  if (isAdminActive(email)) {
    sessionStorage.setItem('admin_token', ADMIN_TOKEN_FOR_PROVISIONING);
  } else {
    sessionStorage.removeItem('admin_token');
  }
}

/** Manually toggle admin mode on/off (Settings UI). */
export function setAdminEnabled(enabled: boolean, email: string | null | undefined): void {
  if (enabled) {
    localStorage.removeItem(ADMIN_DISABLED_KEY);
  } else {
    localStorage.setItem(ADMIN_DISABLED_KEY, '1');
  }
  provisionAdminToken(email);
}

/** Whether admin mode is currently disabled by user toggle. */
export function isAdminManuallyDisabled(): boolean {
  return localStorage.getItem(ADMIN_DISABLED_KEY) === '1';
}
