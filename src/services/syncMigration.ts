/**
 * Migration: assign existing local data to the current Google user.
 *
 * Two responsibilities since the v0.15.x audit:
 *
 * 1. **User-switch detection (data isolation)** — if a *different* Google
 *    user signs in on this browser than the one whose data is sitting in
 *    Dexie, we wipe the per-user tables BEFORE the new user can read or
 *    push them. Without this, User B sees User A's stories/settings/images
 *    and (worse) the next sync push uploads User A's settings into User B's
 *    cloud account.
 *
 * 2. **Auto-claim legacy data** — pre-v0.10 (single-user), Dexie rows had
 *    no `userId` field. After upgrading to multi-user, those rows are
 *    "orphaned" — they belong to no one and would be invisible to per-user
 *    queries. On first sign-in we back-fill them with the current user's id.
 *
 * Strategy:
 *   - Read `lingu_active_user_id` from localStorage (the user we last
 *     accepted as "owner of the local data").
 *   - If it's set AND different from current Google user → clear per-user
 *     Dexie tables, set new active user id, do NOT auto-claim (there's
 *     nothing to claim — we just wiped).
 *   - If unset OR same as current → run the legacy auto-claim path.
 *
 * Idempotency:
 *   The migrate-once flag (`lingu_v5_migrated_<userId>`) is per-user, so a
 *   user_id that already migrated won't re-claim on subsequent sign-ins.
 *
 * Failure mode:
 *   If clearing or migration crashes mid-way, we don't set the flag → it'll
 *   retry next sign-in. Each row update is independent, so partial progress
 *   is OK.
 */

import { db } from './db';
import { getUserInfo } from './authService';

const KEY_ACTIVE_USER = 'lingu_active_user_id';

function flagKey(userId: string): string {
  return `lingu_v5_migrated_${userId}`;
}

/**
 * Wipe every per-user Dexie table. Does NOT touch the `cache` table
 * (generic AI assets, reusable across users) or non-user-scoped tables.
 *
 * Used when a different Google user signs in than the previous active user.
 */
async function clearUserTables(): Promise<void> {
  await Promise.all([
    db.wordProgress.clear(),
    db.userStories.clear(),
    db.customImages.clear(),
    db.reviewLog.clear(),
    db.settings.clear(),
  ]);
}

export async function migrateLegacyDataIfNeeded(): Promise<{
  migrated: boolean;
  rowsClaimed: number;
  userSwitched?: boolean;
}> {
  const userInfo = await getUserInfo();
  if (!userInfo) {
    return { migrated: false, rowsClaimed: 0 };
  }
  const userId = userInfo.id;

  // ─── Step 1: User-switch detection ────────────────────────────────────
  // If a different user previously owned the local data, wipe it before
  // doing anything else. CRITICAL for privacy — we MUST NOT let the new
  // user read or push the old user's records.
  const previousActive = localStorage.getItem(KEY_ACTIVE_USER);
  let userSwitched = false;
  if (previousActive && previousActive !== userId) {
    console.warn(
      `[migration] User switched (${previousActive} → ${userId}); wiping local per-user tables`,
    );
    await clearUserTables();
    userSwitched = true;
    // After wipe, there are no orphan rows to claim — just stamp the new
    // active user and bail out.
    localStorage.setItem(KEY_ACTIVE_USER, userId);
    localStorage.setItem(flagKey(userId), '1');
    return { migrated: false, rowsClaimed: 0, userSwitched: true };
  }

  // First-time sign-in on this browser: stamp the active user.
  if (!previousActive) {
    localStorage.setItem(KEY_ACTIVE_USER, userId);
  }

  // ─── Step 2: Already-migrated check ────────────────────────────────────
  if (localStorage.getItem(flagKey(userId)) === '1') {
    return { migrated: false, rowsClaimed: 0, userSwitched };
  }

  // ─── Step 3: Auto-claim legacy rows ────────────────────────────────────
  let rowsClaimed = 0;
  const now = Date.now();

  // wordProgress — the FSRS spine. Most rows.
  const wpOrphans = await db.wordProgress
    .filter(r => !r.userId)
    .toArray();
  for (const row of wpOrphans) {
    await db.wordProgress.put({
      ...row,
      userId,
      updatedAt: row.updatedAt ?? now,
    });
    rowsClaimed++;
  }

  // userStories — typically a handful
  const usOrphans = await db.userStories
    .filter(r => !r.userId)
    .toArray();
  for (const row of usOrphans) {
    await db.userStories.put({
      ...row,
      userId,
      updatedAt: row.updatedAt ?? row.createdAt.getTime(),
    });
    rowsClaimed++;
  }

  // customImages
  const ciOrphans = await db.customImages
    .filter(r => !r.userId)
    .toArray();
  for (const row of ciOrphans) {
    await db.customImages.put({
      ...row,
      userId,
      updatedAt: row.updatedAt ?? row.uploadedAt.getTime(),
    });
    rowsClaimed++;
  }

  // reviewLog
  const rlOrphans = await db.reviewLog
    .filter(r => !r.userId)
    .toArray();
  for (const row of rlOrphans) {
    if (row.id !== undefined) {
      await db.reviewLog.update(row.id, { userId });
      rowsClaimed++;
    }
  }

  // settings — singleton
  const settings = await db.settings.get('singleton');
  if (settings && !settings.userId) {
    await db.settings.put({
      ...settings,
      userId,
      updatedAt: settings.updatedAt ?? now,
    });
    rowsClaimed++;
  }

  // Mark as done so we don't retry on next sign-in
  localStorage.setItem(flagKey(userId), '1');

  console.log(`[migration] claimed ${rowsClaimed} legacy rows for user ${userId}`);
  return { migrated: true, rowsClaimed, userSwitched };
}

/**
 * Read the user_id whose data currently lives in this browser's Dexie.
 * Used by syncService to filter writes/reads. Returns null if no user
 * has ever signed in on this browser.
 */
export function getActiveUserId(): string | null {
  return localStorage.getItem(KEY_ACTIVE_USER);
}

/**
 * Clear the active user marker. Called on sign-out so the next sign-in
 * either treats this as a fresh first-time (no switch) or correctly
 * detects a switch if a different user comes in.
 */
export function clearActiveUserId(): void {
  localStorage.removeItem(KEY_ACTIVE_USER);
}
