/**
 * Tier helpers — single source of truth for what each tier gets.
 *
 * Why a separate module: story rate limit, /quota, the upgrade UI, and the
 * billing webhook all need to agree on (a) what counts as Pro, (b) how many
 * stories Pro gets, (c) how to check if a Pro subscription has expired. Any
 * disagreement = user-visible bug ("I'm Pro but quota says 3?").
 *
 * The single rule is: `effectiveTier(userRow)` is the only function the rest
 * of the worker should ask. It folds expiry into the answer so callers don't
 * have to remember to check `tier_expires_at` themselves.
 */

export type Tier = 'free' | 'pro' | 'lifetime' | 'banned';

export interface UserTierRow {
  tier: Tier;
  /** Unix ms when subscription expires. NULL for free / lifetime. */
  tier_expires_at: number | null;
}

/**
 * Daily story-generation quotas per tier.
 *
 * Free: 3/day — established in v0.x and shipped to existing users; reducing
 *   it now would feel like a takeaway. Stays for honesty.
 * Pro:  30/day — 10× boost. High enough that a power user (a few stories
 *   per session, a few sessions per day) never hits the cap; low enough
 *   that abuse (scraping with a paid account) is bounded by daily AI cost.
 * Lifetime: same as Pro for now. Bumping later is a strict upgrade we can
 *   do without breaking anyone.
 * Banned: 0 — full block on AI features. Sync still works so the user can
 *   export their data before we permanently delete the account.
 */
export const STORY_QUOTA_BY_TIER: Record<Tier, number> = {
  free: 3,
  pro: 30,
  lifetime: 30,
  banned: 0,
};

/**
 * Resolve the *effective* tier for a user, accounting for expiry. A user
 * whose `tier='pro'` but `tier_expires_at` has passed is treated as free
 * until the next webhook upgrades them again. Saves us from mass-running
 * a downgrade cron.
 */
export function effectiveTier(row: UserTierRow | null | undefined): Tier {
  if (!row) return 'free';
  if (row.tier === 'lifetime' || row.tier === 'banned') return row.tier;
  if (row.tier === 'pro') {
    if (row.tier_expires_at && row.tier_expires_at < Date.now()) return 'free';
    return 'pro';
  }
  return 'free';
}

/**
 * Look up a user's tier from D1. Returns 'free' if user doesn't exist yet
 * (which can happen during the very first sign-in race between
 * /generate-story arriving before /sync/pull has had a chance to ensureUser).
 */
export async function getUserTier(
  db: D1Database | undefined,
  userId: string,
): Promise<Tier> {
  if (!db) return 'free';
  try {
    const row = await db
      .prepare(`SELECT tier, tier_expires_at FROM users WHERE id = ?`)
      .bind(userId)
      .first<UserTierRow>();
    return effectiveTier(row);
  } catch {
    return 'free';
  }
}

/**
 * Daily quota for a given tier. Convenience wrapper so callers don't have
 * to remember to import the constant separately.
 */
export function quotaFor(tier: Tier): number {
  return STORY_QUOTA_BY_TIER[tier];
}
