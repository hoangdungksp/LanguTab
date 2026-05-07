/**
 * Billing service — talks to the worker's /billing/* endpoints.
 *
 * Two responsibilities:
 *   1. fetchCheckoutInfo() — gets the per-user Lemon Squeezy checkout URLs
 *      (each URL has the user_id pre-baked into custom_data so the webhook
 *      can link the resulting subscription back to our user).
 *   2. fetchTier() — quick "what tier am I?" lookup used by useTier(). Lighter
 *      than fetchSyncStatus(), which also computes counts.
 *
 * Both endpoints require a Google OAuth token. We reuse the same flow as
 * storyGenService — sign-in failures bubble up so the caller can show the
 * existing AuthButton CTA instead of a billing-specific error.
 */

import { getAuthToken, authedFetch } from './authService';

const WORKER_URL = 'https://lingua-newtab-worker.kspstudio.workers.dev';

export type Tier = 'free' | 'pro' | 'lifetime' | 'banned';

export interface PlanInfo {
  /** Pre-built Lemon Squeezy checkout URL with user_id embedded */
  url: string;
  /** Display price in USD ('4.99', '99', etc). null if not configured. */
  price_usd: string | null;
}

export interface CheckoutInfo {
  plans: {
    pro_monthly: PlanInfo | null;
    pro_yearly: PlanInfo | null;
    lifetime: PlanInfo | null;
  };
}

export interface TierInfo {
  tier: Tier;
  /** Unix ms when subscription expires, or null for free / lifetime */
  tier_expires_at: number | null;
}

export class BillingError extends Error {
  constructor(
    message: string,
    public kind: 'auth' | 'network' | 'not_configured',
  ) {
    super(message);
  }
}

/**
 * Fetch the user's checkout URLs. Returns null if the worker reports
 * `billing_not_configured` (Lemon Squeezy hasn't been set up yet — we
 * can show "Coming soon" UI instead of an error).
 */
export async function fetchCheckoutInfo(): Promise<CheckoutInfo | null> {
  let res: Response;
  try {
    res = await authedFetch(`${WORKER_URL}/billing/checkout-info`);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('AUTH_REQUIRED')) {
      throw new BillingError('Bạn cần đăng nhập', 'auth');
    }
    throw new BillingError(`Network error`, 'network');
  }

  if (res.status === 503) {
    // billing_not_configured — Jason hasn't set up Lemon Squeezy yet
    return null;
  }
  if (!res.ok) {
    throw new BillingError(`Checkout info failed: ${res.status}`, 'network');
  }
  return (await res.json()) as CheckoutInfo;
}

/**
 * Fetch the user's current effective tier. Cheap (~50ms). Used by
 * useTier() on mount and after the upgrade flow returns.
 */
export async function fetchTier(): Promise<TierInfo | null> {
  // Skip the call entirely if not signed in — authedFetch would throw,
  // and we want fetchTier to silently return null in that case.
  const token = await getAuthToken(false);
  if (!token) return null;

  try {
    const res = await authedFetch(`${WORKER_URL}/billing/tier`);
    if (!res.ok) return null;
    return (await res.json()) as TierInfo;
  } catch {
    return null;
  }
}

/**
 * Open the Lemon Squeezy checkout URL in a new tab. We don't redirect the
 * current tab because (a) this is a new-tab extension — we'd lose the
 * user's flashcard state, (b) Chrome's iframe sandbox blocks LS's overlay
 * checkout from working when embedded.
 */
export function openCheckout(url: string): void {
  // chrome.tabs.create requires the "tabs" permission; window.open is enough
  // for opening an external URL and works without extra manifest perms.
  window.open(url, '_blank', 'noopener,noreferrer');
}
