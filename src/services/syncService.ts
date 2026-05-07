/**
 * Sync service — talks to Worker /sync/* endpoints.
 *
 * Anki-style sync model:
 *   - Manual button trigger (or auto on sign-in / tab close)
 *   - First-time sync: user chooses Upload-all or Download-all
 *   - Subsequent syncs: pull + push delta (last-write-wins)
 *   - Force one-way option for restore scenarios
 *
 * State machine:
 *   idle ──▶ syncing ──▶ done (back to idle after 2s flash)
 *                     └─▶ error
 *                     └─▶ first_sync_choice (initial sync popup)
 *
 * The four scenarios in syncOnce() decide what kind of sync to run:
 *   1. First sync, server empty + local empty  → mark as synced, no-op
 *   2. First sync, server empty + local has data → auto upload-all (no popup)
 *   3. First sync, local empty + server has data → auto download-all (no popup)
 *   4. First sync, both have data                → require user choice (popup)
 *   5. Subsequent sync                           → delta merge
 */

import { db } from './db';
import { getUserInfo, authedFetch } from './authService';
import type { Settings, WordProgress, ReviewLog, WordCustomImage } from '../types';
import type { UserStory } from '../types/story';

const WORKER_URL = 'https://lingua-newtab-worker.kspstudio.workers.dev';

// ─── localStorage keys ─────────────────────────────────────────────────────
//
// We persist sync state in localStorage (NOT Dexie) so it survives Dexie
// version migrations and is trivially readable from any tab. Keys are
// prefixed `lingu_sync_` to namespace and avoid collisions.

const KEY_LAST_SYNC_AT     = 'lingu_sync_last_at';        // Unix ms of last successful sync
const KEY_LAST_PUSH_AT     = 'lingu_sync_last_push_at';   // Unix ms of last successful push
const KEY_INITIAL_DONE     = 'lingu_sync_initial_done';   // '1' if first-time sync resolved
const KEY_FORCE_DIRECTION  = 'lingu_sync_force_direction'; // 'upload' | 'download' | undefined
const KEY_DEVICE_ID        = 'lingu_sync_device_id';      // random UUID, generated once

function getDeviceId(): string {
  let id = localStorage.getItem(KEY_DEVICE_ID);
  if (!id) {
    id = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)) + '-' + Date.now();
    localStorage.setItem(KEY_DEVICE_ID, id);
  }
  return id;
}

function getLastSyncAt(): number {
  return parseInt(localStorage.getItem(KEY_LAST_SYNC_AT) ?? '0', 10);
}

function setLastSyncAt(ts: number): void {
  localStorage.setItem(KEY_LAST_SYNC_AT, String(ts));
}

function setLastPushAt(ts: number): void {
  localStorage.setItem(KEY_LAST_PUSH_AT, String(ts));
}

export function isInitialSyncDone(): boolean {
  return localStorage.getItem(KEY_INITIAL_DONE) === '1';
}

function markInitialSyncDone(): void {
  localStorage.setItem(KEY_INITIAL_DONE, '1');
}

/** Get + clear the force-direction flag. Used for "force one-way" option. */
function consumeForceDirection(): 'upload' | 'download' | null {
  const v = localStorage.getItem(KEY_FORCE_DIRECTION);
  if (v === 'upload' || v === 'download') {
    localStorage.removeItem(KEY_FORCE_DIRECTION);
    return v;
  }
  return null;
}

/** Set force-direction for the next sync. UI calls this from Settings. */
export function setForceDirection(dir: 'upload' | 'download' | null): void {
  if (dir === null) {
    localStorage.removeItem(KEY_FORCE_DIRECTION);
  } else {
    localStorage.setItem(KEY_FORCE_DIRECTION, dir);
  }
}

export function getForceDirection(): 'upload' | 'download' | null {
  const v = localStorage.getItem(KEY_FORCE_DIRECTION);
  if (v === 'upload' || v === 'download') return v;
  return null;
}

/** Reset everything — used on sign-out. */
export function clearSyncState(): void {
  localStorage.removeItem(KEY_LAST_SYNC_AT);
  localStorage.removeItem(KEY_LAST_PUSH_AT);
  localStorage.removeItem(KEY_INITIAL_DONE);
  localStorage.removeItem(KEY_FORCE_DIRECTION);
  // Keep device_id — it's identity for sync_state tracking, OK to reuse
  // across sign-out/sign-in cycles on the same browser.
}

// ─── Auth helper ───────────────────────────────────────────────────────────
// All authenticated fetches go through `authedFetch` from authService, which
// auto-retries on 401 with a refreshed token (fixes the "session goes stale
// after 1 hour" bug).

// ─── Errors ────────────────────────────────────────────────────────────────
export type SyncErrorKind =
  | 'auth'         // not signed in or token expired
  | 'network'      // fetch failed
  | 'server'       // worker returned 5xx
  | 'choice'       // first sync requires user choice (not really an error, more like a state)
  | 'unknown';

export class SyncError extends Error {
  kind: SyncErrorKind;
  detail?: string;
  constructor(message: string, kind: SyncErrorKind, detail?: string) {
    super(message);
    this.kind = kind;
    this.detail = detail;
  }
}

// ─── Status (server-side counts) ───────────────────────────────────────────
export interface SyncStatus {
  user: {
    id: string;
    email: string;
    tier: 'free' | 'pro' | 'lifetime' | 'banned';
    tier_expires_at: number | null;
    created_at: number;
    last_active_at: number;
  };
  counts: {
    word_progress: number;
    user_stories: number;
    custom_images: number;
    custom_images_bytes: number;
    review_log: number;
  };
}

export async function fetchSyncStatus(): Promise<SyncStatus> {
  const res = await authedFetch(`${WORKER_URL}/sync/status`);
  if (!res.ok) throw new SyncError(`Status check failed: ${res.status}`, 'server');
  return res.json();
}

// ─── Local counts (for first-sync comparison) ──────────────────────────────
export interface LocalCounts {
  word_progress: number;
  user_stories: number;
  custom_images: number;
  review_log: number;
}

export async function getLocalCounts(): Promise<LocalCounts> {
  const [wp, us, ci, rl] = await Promise.all([
    db.wordProgress.count(),
    db.userStories.count(),
    db.customImages.count(),
    db.reviewLog.count(),
  ]);
  return { word_progress: wp, user_stories: us, custom_images: ci, review_log: rl };
}

// ─── Pull (delta) ──────────────────────────────────────────────────────────
async function pullDelta(since: number): Promise<{
  applied: number;
  serverTime: number;
  hasMore: boolean;
}> {
  const res = await authedFetch(`${WORKER_URL}/sync/pull?since=${since}`);
  if (!res.ok) {
    const text = await res.text();
    throw new SyncError(`Pull failed: ${res.status}`, 'server', text.slice(0, 200));
  }
  const data = await res.json() as PullResponse;
  const applied = await applyServerToLocal(data);
  return {
    applied,
    serverTime: data.server_time,
    hasMore: data.has_more,
  };
}

interface PullResponse {
  word_progress: WordProgressRow[];
  user_stories: UserStoryRow[];
  settings: SettingsRow | null;
  custom_images: CustomImageRow[];
  review_log: ReviewLogRow[];
  server_time: number;
  has_more: boolean;
}

interface WordProgressRow {
  word_id: string;
  lang: string;
  due: number | null;
  state: number;
  stability: number | null;
  difficulty: number | null;
  reps: number;
  lapses: number;
  last_review: number | null;
  updated_at: number;
}
interface UserStoryRow {
  id: string;
  hsk_level: number;
  genre: string;
  is_favorite: number;
  prompt_json: string;
  story_json: string;
  created_at: number;
  updated_at: number;
}
interface SettingsRow {
  data_json: string;
  updated_at: number;
}
interface CustomImageRow {
  word_id: string;
  lang: string;
  r2_key: string;
  mime_type: string;
  size_bytes: number;
  uploaded_at: number;
  updated_at: number;
}
interface ReviewLogRow {
  word_id: string;
  lang: string;
  rating: number;
  reviewed_at: number;
  created_at: number;
}

// ─── Apply server payload → Dexie ──────────────────────────────────────────
async function applyServerToLocal(data: PullResponse): Promise<number> {
  const userInfo = await getUserInfo();
  const userId = userInfo?.id ?? null;

  let applied = 0;

  // Word progress: upsert by wordId, only if server's updated_at > local's
  for (const row of data.word_progress) {
    const existing = await db.wordProgress.get(row.word_id);
    if (existing && (existing.updatedAt ?? 0) >= row.updated_at) continue;
    await db.wordProgress.put({
      wordId: row.word_id,
      lang: row.lang as 'zh' | 'en',
      userId,
      updatedAt: row.updated_at,
      due: row.due ? new Date(row.due) : new Date(),
      state: (row.state as 0 | 1 | 2 | 3) ?? 0,
      stability: row.stability ?? 0,
      difficulty: row.difficulty ?? 0,
      reps: row.reps,
      lapses: row.lapses,
      lastReview: row.last_review ? new Date(row.last_review) : undefined,
      // FSRS fields not stored on server (computed locally) — keep existing or default
      elapsedDays: existing?.elapsedDays ?? 0,
      scheduledDays: existing?.scheduledDays ?? 0,
    });
    applied++;
  }

  // User stories: upsert by id
  for (const row of data.user_stories) {
    const existing = await db.userStories.get(row.id);
    if (existing && (existing.updatedAt ?? 0) >= row.updated_at) continue;
    let prompt;
    let story;
    try {
      prompt = JSON.parse(row.prompt_json);
      story = JSON.parse(row.story_json);
    } catch (err) {
      console.error('[sync] failed to parse story json', row.id, err);
      continue;
    }
    await db.userStories.put({
      id: row.id,
      userId,
      updatedAt: row.updated_at,
      createdAt: new Date(row.created_at),
      hskLevel: row.hsk_level as 1 | 2 | 3 | 4 | 5 | 6,
      genre: row.genre,
      isFavorite: row.is_favorite === 1,
      prompt,
      story,
    });
    applied++;
  }

  // Settings: singleton
  if (data.settings) {
    const existing = await db.settings.get('singleton');
    if (!existing || (existing.updatedAt ?? 0) < data.settings.updated_at) {
      try {
        const parsed = JSON.parse(data.settings.data_json) as Partial<Settings>;
        await db.settings.put({
          ...parsed,
          id: 'singleton',
          userId,
          updatedAt: data.settings.updated_at,
        } as Settings);
        applied++;
      } catch (err) {
        console.error('[sync] failed to parse settings json', err);
      }
    }
  }

  // Custom images: upsert by wordId. We DO NOT pull cachedBlob from server
  // (clients fetch on-demand via /sync/images/:lang/:wordId). R2-uploaded
  // records carry an r2_key shaped `{userId}/{lang}/{wordId}`; legacy
  // pre-v0.16 records may carry a synthetic `drive-legacy:<fileId>` key
  // (see toCustomImageRow). We split those back into the right field.
  for (const row of data.custom_images) {
    const existing = await db.customImages.get(row.word_id);
    if (existing && (existing.updatedAt ?? 0) >= row.updated_at) continue;
    const isLegacyDrive = row.r2_key.startsWith('drive-legacy:');
    await db.customImages.put({
      wordId: row.word_id,
      lang: row.lang as 'zh' | 'en',
      userId,
      updatedAt: row.updated_at,
      r2Key: isLegacyDrive ? undefined : row.r2_key,
      driveFileId: isLegacyDrive
        ? row.r2_key.slice('drive-legacy:'.length)
        : existing?.driveFileId,
      fileName: existing?.fileName ?? 'image',
      mimeType: row.mime_type,
      sizeBytes: row.size_bytes,
      uploadedAt: new Date(row.uploaded_at),
      syncStatus: 'synced',
      cachedBlob: existing?.cachedBlob,
    });
    applied++;
  }

  // Review log: append-only, dedup by (wordId, reviewedAt)
  for (const row of data.review_log) {
    const dupes = await db.reviewLog
      .where('wordId').equals(row.word_id)
      .filter(r => r.reviewedAt.getTime() === row.reviewed_at)
      .count();
    if (dupes > 0) continue;
    await db.reviewLog.add({
      userId,
      wordId: row.word_id,
      lang: row.lang as 'zh' | 'en',
      rating: row.rating as 1 | 2 | 3 | 4,
      reviewedAt: new Date(row.reviewed_at),
      wasNew: false, // historical info lost; sync only carries the rating
    });
    applied++;
  }

  return applied;
}

// ─── Push (delta) ──────────────────────────────────────────────────────────
async function pushDelta(since: number, userId: string): Promise<{
  serverTime: number;
  accepted: number;
  rejected: number;
}> {
  const payload = await collectLocalChanges(since, userId);
  if (
    payload.word_progress.length === 0 &&
    payload.user_stories.length === 0 &&
    !payload.settings &&
    payload.custom_images.length === 0 &&
    payload.review_log.length === 0
  ) {
    return { serverTime: Date.now(), accepted: 0, rejected: 0 };
  }

  const res = await authedFetch(`${WORKER_URL}/sync/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, device_id: getDeviceId() }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new SyncError(`Push failed: ${res.status}`, 'server', text.slice(0, 200));
  }
  const data = await res.json() as {
    accepted: Record<string, number>;
    rejected: Record<string, number>;
    server_time: number;
  };
  const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);
  return {
    serverTime: data.server_time,
    accepted: sum(data.accepted),
    rejected: sum(data.rejected),
  };
}

interface PushPayload {
  word_progress: WordProgressRow[];
  user_stories: UserStoryRow[];
  settings: SettingsRow | undefined;
  custom_images: CustomImageRow[];
  review_log: ReviewLogRow[];
}

async function collectLocalChanges(
  since: number,
  userId: string,
): Promise<PushPayload> {
  // Pull all rows that belong to current user AND have updatedAt > since
  // We can't filter by `updatedAt > since` in Dexie efficiently without an
  // index on updatedAt, so we fetch user-owned rows then filter in JS.
  // Personal-scale data sizes (a few thousand rows) make this trivial.
  const filter = (r: { userId?: string | null; updatedAt?: number }) =>
    (r.userId === null || r.userId === userId) && (r.updatedAt ?? 0) > since;

  const [allWp, allUs, allCi, allRl, settings] = await Promise.all([
    db.wordProgress.toArray(),
    db.userStories.toArray(),
    db.customImages.toArray(),
    db.reviewLog.toArray(),
    db.settings.get('singleton'),
  ]);

  return {
    word_progress: allWp.filter(filter).map(toWordProgressRow),
    user_stories: allUs.filter(filter).map(toUserStoryRow),
    // Settings is a singleton row but still has a userId. Must check it
    // matches the current user before pushing — otherwise after a User A
    // sign-out → User B sign-in race (where user-switch detection didn't
    // fire yet because they don't have a sync active), User B would
    // upload User A's preferences. The user-switch wipe in
    // syncMigration.ts is the primary defense; this filter is belt-and-
    // suspenders to ensure no cross-user push under any sequencing.
    settings:
      settings &&
      (settings.userId === null || settings.userId === undefined || settings.userId === userId) &&
      (settings.updatedAt ?? 0) > since
        ? toSettingsRow(settings)
        : undefined,
    custom_images: allCi.filter(filter).map(toCustomImageRow),
    review_log: allRl
      .filter(r => filter(r as { userId?: string | null; updatedAt?: number })
        || ((r.userId === null || r.userId === userId) && r.reviewedAt.getTime() > since))
      .map(toReviewLogRow),
  };
}

function toWordProgressRow(p: WordProgress): WordProgressRow {
  return {
    word_id: p.wordId,
    lang: p.lang,
    due: p.due ? p.due.getTime() : null,
    state: p.state,
    stability: p.stability,
    difficulty: p.difficulty,
    reps: p.reps,
    lapses: p.lapses,
    last_review: p.lastReview ? p.lastReview.getTime() : null,
    updated_at: p.updatedAt ?? Date.now(),
  };
}

function toUserStoryRow(s: UserStory): UserStoryRow {
  return {
    id: s.id,
    hsk_level: s.hskLevel,
    genre: s.genre,
    is_favorite: s.isFavorite ? 1 : 0,
    prompt_json: JSON.stringify(s.prompt),
    story_json: JSON.stringify(s.story),
    created_at: s.createdAt.getTime(),
    updated_at: s.updatedAt ?? s.createdAt.getTime(),
  };
}

function toSettingsRow(s: Settings): SettingsRow {
  // Strip blob fields and meta we don't need on server. Server stores the
  // whole Settings object as JSON minus `id`, `userId`, `updatedAt` (which
  // are tracked via columns).
  const { id: _id, userId: _userId, updatedAt: _updatedAt, ...data } = s;
  return {
    data_json: JSON.stringify(data),
    updated_at: s.updatedAt ?? Date.now(),
  };
}

function toCustomImageRow(img: WordCustomImage): CustomImageRow {
  // Prefer the R2 key (current backend). Fall back to a synthetic key
  // built from the legacy Drive file ID for any pre-v0.16 record that
  // hasn't been re-uploaded yet — server treats `r2_key` as opaque.
  const r2Key =
    img.r2Key ??
    (img.driveFileId ? `drive-legacy:${img.driveFileId}` : '');
  return {
    word_id: img.wordId,
    lang: img.lang,
    r2_key: r2Key,
    mime_type: img.mimeType,
    size_bytes: img.sizeBytes,
    uploaded_at: img.uploadedAt.getTime(),
    updated_at: img.updatedAt ?? img.uploadedAt.getTime(),
  };
}

function toReviewLogRow(r: ReviewLog): ReviewLogRow {
  return {
    word_id: r.wordId,
    lang: r.lang,
    rating: r.rating,
    reviewed_at: r.reviewedAt.getTime(),
    created_at: r.reviewedAt.getTime(),
  };
}

// ─── Upload-all (Anki "Upload to AnkiWeb") ─────────────────────────────────
async function uploadAll(userId: string): Promise<void> {
  // Collect ALL local rows owned by this user (since=0)
  const payload = await collectLocalChanges(0, userId);

  const res = await authedFetch(`${WORKER_URL}/sync/upload-all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, device_id: getDeviceId() }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new SyncError(`Upload-all failed: ${res.status}`, 'server', text.slice(0, 200));
  }
}

// ─── Download-all (Anki "Download from AnkiWeb") ───────────────────────────
async function downloadAll(): Promise<void> {
  const res = await authedFetch(`${WORKER_URL}/sync/download-all`);
  if (!res.ok) {
    const text = await res.text();
    throw new SyncError(`Download-all failed: ${res.status}`, 'server', text.slice(0, 200));
  }
  const data = await res.json() as PullResponse;

  // Wipe local user data (preserve cache + non-user data)
  await Promise.all([
    db.wordProgress.clear(),
    db.userStories.clear(),
    db.customImages.clear(),
    db.reviewLog.clear(),
    // Don't clear settings yet — applyServerToLocal will overwrite singleton
  ]);

  await applyServerToLocal(data);
}

// ─── Account deletion ──────────────────────────────────────────────────────
export async function deleteAccount(): Promise<void> {
  const res = await authedFetch(`${WORKER_URL}/sync/clear`, { method: 'POST' });
  if (!res.ok) {
    throw new SyncError(`Delete account failed: ${res.status}`, 'server');
  }

  // Wipe local
  await Promise.all([
    db.wordProgress.clear(),
    db.userStories.clear(),
    db.customImages.clear(),
    db.reviewLog.clear(),
    db.settings.clear(),
  ]);
  clearSyncState();
}

// ─── First-sync decision result ────────────────────────────────────────────
export interface FirstSyncDecision {
  /** Action the syncOnce() caller should take. */
  action: 'noop' | 'auto-upload' | 'auto-download' | 'ask-user';
  /** Local counts at decision time — used to render comparison in popup */
  local: LocalCounts;
  /** Server counts at decision time */
  server: SyncStatus['counts'];
}

/**
 * Inspect local + server state and determine what kind of first-time sync
 * to run. Pure decision; doesn't actually sync. Caller (UI layer) can
 * render the popup if action === 'ask-user', or proceed automatically
 * for other actions.
 */
export async function decideFirstSync(): Promise<FirstSyncDecision> {
  const [local, status] = await Promise.all([getLocalCounts(), fetchSyncStatus()]);
  const server = status.counts;

  const localEmpty = local.word_progress + local.user_stories + local.custom_images + local.review_log === 0;
  const serverEmpty = server.word_progress + server.user_stories + server.custom_images + server.review_log === 0;

  let action: FirstSyncDecision['action'];
  if (localEmpty && serverEmpty) action = 'noop';
  else if (serverEmpty) action = 'auto-upload';
  else if (localEmpty) action = 'auto-download';
  else action = 'ask-user';

  return { action, local, server };
}

// ─── Main sync entry point ─────────────────────────────────────────────────
export interface SyncResult {
  applied: number;     // server → local
  uploaded: number;    // local → server (accepted)
  rejected: number;    // local → server (rejected as older)
  durationMs: number;
}

/**
 * Run one sync cycle. UI layer calls this from the Sync button.
 *
 * Behaviors:
 *   - If forceDirection is set ('upload'|'download'), do that one-way sync
 *     (and clear the flag).
 *   - Else if initial sync not done:
 *       - noop:           mark done, return success
 *       - auto-upload:    upload-all + mark done
 *       - auto-download:  download-all + mark done
 *       - ask-user:       throw SyncError(kind='choice') so UI shows popup
 *   - Else: delta merge (pull + push).
 */
export async function syncOnce(): Promise<SyncResult> {
  const start = Date.now();
  const userInfo = await getUserInfo();
  if (!userInfo) throw new SyncError('Not signed in', 'auth');

  // Force one-way?
  const force = consumeForceDirection();
  if (force === 'upload') {
    await uploadAll(userInfo.id);
    setLastSyncAt(Date.now());
    setLastPushAt(Date.now());
    markInitialSyncDone();
    return { applied: 0, uploaded: -1, rejected: 0, durationMs: Date.now() - start };
  }
  if (force === 'download') {
    await downloadAll();
    setLastSyncAt(Date.now());
    markInitialSyncDone();
    return { applied: -1, uploaded: 0, rejected: 0, durationMs: Date.now() - start };
  }

  // First-time sync?
  if (!isInitialSyncDone()) {
    const decision = await decideFirstSync();
    if (decision.action === 'noop') {
      markInitialSyncDone();
      setLastSyncAt(Date.now());
      return { applied: 0, uploaded: 0, rejected: 0, durationMs: Date.now() - start };
    }
    if (decision.action === 'auto-upload') {
      await uploadAll(userInfo.id);
      markInitialSyncDone();
      setLastSyncAt(Date.now());
      setLastPushAt(Date.now());
      return { applied: 0, uploaded: -1, rejected: 0, durationMs: Date.now() - start };
    }
    if (decision.action === 'auto-download') {
      await downloadAll();
      markInitialSyncDone();
      setLastSyncAt(Date.now());
      return { applied: -1, uploaded: 0, rejected: 0, durationMs: Date.now() - start };
    }
    // ask-user — let the UI handle it via showFirstSyncModal()
    const err = new SyncError('First sync requires user choice', 'choice');
    (err as SyncError & { decision: FirstSyncDecision }).decision = decision;
    throw err;
  }

  // Subsequent sync — delta merge.
  const since = getLastSyncAt();

  // Push first (so our changes don't get overwritten by a slightly older
  // copy from another device pulling around the same time)
  const pushResult = await pushDelta(since, userInfo.id);
  setLastPushAt(pushResult.serverTime);

  // Pull (use server time from the push response so we don't miss anything
  // that was committed during the push roundtrip)
  const pullResult = await pullDelta(since);
  setLastSyncAt(pullResult.serverTime);

  return {
    applied: pullResult.applied,
    uploaded: pushResult.accepted,
    rejected: pushResult.rejected,
    durationMs: Date.now() - start,
  };
}

/**
 * Resolve first-time sync after the user picked Upload or Download in the
 * modal. Caller passes the choice; we run the corresponding one-way sync.
 */
export async function resolveFirstSync(choice: 'upload' | 'download'): Promise<SyncResult> {
  const start = Date.now();
  const userInfo = await getUserInfo();
  if (!userInfo) throw new SyncError('Not signed in', 'auth');

  if (choice === 'upload') {
    await uploadAll(userInfo.id);
    setLastSyncAt(Date.now());
    setLastPushAt(Date.now());
    markInitialSyncDone();
    return { applied: 0, uploaded: -1, rejected: 0, durationMs: Date.now() - start };
  } else {
    await downloadAll();
    setLastSyncAt(Date.now());
    markInitialSyncDone();
    return { applied: -1, uploaded: 0, rejected: 0, durationMs: Date.now() - start };
  }
}

/**
 * Push-only sync — used in the `beforeunload` handler (tab close) to
 * make sure local changes get up before the user goes offline. Pulls
 * are skipped because they'd require waiting for the response.
 */
export async function pushOnly(): Promise<void> {
  if (!isInitialSyncDone()) return; // skip if user hasn't done initial sync
  try {
    const userInfo = await getUserInfo();
    if (!userInfo) return;
    const since = getLastPushAt();
    const result = await pushDelta(since, userInfo.id);
    setLastPushAt(result.serverTime);
  } catch (err) {
    // Best-effort; we're in unload, can't really recover
    console.warn('[sync] push-only failed', err);
  }
}

function getLastPushAt(): number {
  return parseInt(localStorage.getItem(KEY_LAST_PUSH_AT) ?? '0', 10);
}

// ─── Pending changes detection (for UI badge "●") ──────────────────────────
/**
 * True if there are local changes that haven't been pushed yet. Used by
 * SyncButton to show the "pending" red dot.
 */
export async function hasPendingChanges(): Promise<boolean> {
  if (!isInitialSyncDone()) return false;
  const userInfo = await getUserInfo();
  if (!userInfo) return false;
  const since = getLastPushAt();
  const payload = await collectLocalChanges(since, userInfo.id);
  return (
    payload.word_progress.length > 0 ||
    payload.user_stories.length > 0 ||
    !!payload.settings ||
    payload.custom_images.length > 0 ||
    payload.review_log.length > 0
  );
}
