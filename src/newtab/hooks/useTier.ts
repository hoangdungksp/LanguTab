import { useEffect, useState, useCallback } from 'react';
import { fetchTier, type Tier, type TierInfo } from '../../services/billingService';
import { onAuthChange } from '../../services/authService';

/**
 * Module-level cache so two components mounting useTier() at the same time
 * (Header + StoryGenModal, say) share a single fetch and a single render
 * tick. Cache invalidated by `refreshTier()` after upgrade flows.
 */
let cached: TierInfo | null | undefined = undefined; // undefined = "not yet loaded"
const subscribers = new Set<(t: TierInfo | null) => void>();

function notify(value: TierInfo | null) {
  cached = value;
  subscribers.forEach((cb) => cb(value));
}

/**
 * Force a refresh of the tier — call after an upgrade flow returns to the
 * tab so the UI flips from Free to Pro without a full reload. Safe to call
 * multiple times in quick succession; only one in-flight fetch at a time.
 */
let inFlight: Promise<TierInfo | null> | null = null;
export async function refreshTier(): Promise<TierInfo | null> {
  if (inFlight) return inFlight;
  inFlight = fetchTier()
    .then((t) => {
      notify(t);
      return t;
    })
    .catch(() => null)
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

// ─── Module-level auth listener ────────────────────────────────────────────
// Refetch tier whenever the user signs in or out so the badge flips
// correctly without depending on focus events. The listener is registered
// once at module load and persists for the lifetime of the new-tab page.
//
// Without this, a user who first opens the new-tab signed-out would have
// `cached === null` (auth check returned no token). After signing in, the
// useTier hook would still show free until something else triggered a
// refetch (focus, manual upgrade, etc) — fixing audit bug #12.
let authListenerRegistered = false;
function ensureAuthListener() {
  if (authListenerRegistered) return;
  authListenerRegistered = true;
  onAuthChange((signedIn) => {
    if (signedIn) {
      refreshTier();
    } else {
      // On sign-out, clear cache so a re-mount after sign-in doesn't show
      // the previous user's tier briefly before refetch resolves.
      notify(null);
    }
  });
}

export interface UseTierResult {
  /** The effective tier; defaults to 'free' until first fetch resolves */
  tier: Tier;
  isPro: boolean;
  expiresAt: number | null;
  /** True until the first fetch resolves (so UI can avoid Free/Pro flicker) */
  loading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook for any component that needs to know the current user's tier.
 *
 * Behavior:
 *   - On first mount across the app: kicks off fetchTier(), shows
 *     `loading=true` until it resolves
 *   - Subsequent mounts: instant (uses cached value)
 *   - Refreshes on window focus (catches the "user upgraded in another tab"
 *     case without bothering with chrome.runtime messaging)
 *   - Refreshes on auth state change (audit fix #12)
 *
 * Defaults to 'free' if not signed in or fetch fails — never throws.
 */
export function useTier(): UseTierResult {
  // Snapshot cache as initial state. `undefined` means we haven't fetched
  // yet, so we kick off a fetch in the effect below.
  const [info, setInfo] = useState<TierInfo | null | undefined>(cached);

  // Subscribe to module-level updates
  useEffect(() => {
    ensureAuthListener();
    const cb = (v: TierInfo | null) => setInfo(v);
    subscribers.add(cb);
    return () => {
      subscribers.delete(cb);
    };
  }, []);

  // Trigger initial fetch + refetch on focus
  useEffect(() => {
    if (cached === undefined) {
      refreshTier();
    }
    const onFocus = () => {
      refreshTier();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const refresh = useCallback(async () => {
    await refreshTier();
  }, []);

  // Resolve effective tier — server's /billing/tier already folds in expiry,
  // but we double-check on the client in case of stale cache.
  const now = Date.now();
  const tier: Tier =
    !info
      ? 'free'
      : info.tier === 'pro' && info.tier_expires_at && info.tier_expires_at < now
        ? 'free'
        : info.tier;

  return {
    tier,
    isPro: tier === 'pro' || tier === 'lifetime',
    expiresAt: info?.tier_expires_at ?? null,
    loading: cached === undefined && info === undefined,
    refresh,
  };
}
