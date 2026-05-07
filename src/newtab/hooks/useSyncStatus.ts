import { useEffect, useState, useCallback, useRef } from 'react';
import {
  syncOnce,
  pushOnly,
  hasPendingChanges,
  isInitialSyncDone,
  SyncError,
  type SyncResult,
  type FirstSyncDecision,
} from '../../services/syncService';
import { migrateLegacyDataIfNeeded } from '../../services/syncMigration';
import { isSignedIn, onAuthChange } from '../../services/authService';
import { useAppStore } from '../../stores/useAppStore';

/**
 * Sync UI state machine for the header SyncButton.
 *
 *   idle ──[click]──▶ syncing ──[ok]──▶ done ──(2s)──▶ idle
 *                              ├─[err]─▶ error
 *                              └─[need choice]─▶ first_sync (modal opens)
 */
export type SyncUiState =
  | { kind: 'idle' }
  | { kind: 'syncing' }
  | { kind: 'done'; result: SyncResult }
  | { kind: 'error'; error: SyncError | Error }
  | { kind: 'first_sync'; decision: FirstSyncDecision };

interface UseSyncStatusReturn {
  state: SyncUiState;
  /** True if user is signed in (sync only meaningful then) */
  signedIn: boolean;
  /** True if there are local edits not yet pushed */
  hasPending: boolean;
  /** Last successful sync timestamp (Unix ms) */
  lastSyncAt: number | null;
  /** Trigger a sync. Returns the result or rethrows. */
  triggerSync: () => Promise<void>;
  /** Dismiss the first-sync modal without choosing (returns to idle) */
  cancelFirstSync: () => void;
  /** Reset state from done/error back to idle, also re-hydrates Zustand */
  reset: () => Promise<void>;
}

export function useSyncStatus(): UseSyncStatusReturn {
  const [state, setState] = useState<SyncUiState>({ kind: 'idle' });
  const [signedIn, setSignedIn] = useState(false);
  const [hasPending, setHasPending] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const reloadFromDb = useAppStore(s => s.reloadFromDb);

  // Track sign-in
  useEffect(() => {
    let alive = true;
    isSignedIn().then(s => alive && setSignedIn(s));
    const unsub = onAuthChange(s => alive && setSignedIn(s));
    return () => { alive = false; unsub(); };
  }, []);

  // Run migration on first sign-in (auto-claim legacy data + detect user switch).
  // Cheap if already done (single localStorage check + early return).
  // CRITICAL: this MUST complete before any sync push runs — otherwise a new
  // user's first push would upload the previous user's settings/stories.
  useEffect(() => {
    if (!signedIn) return;
    migrateLegacyDataIfNeeded()
      .then(async (result) => {
        if (result.userSwitched) {
          // We just wiped local Dexie. Refresh Zustand so the dashboard
          // counters drop to 0 instead of showing the previous user's
          // streak/totalReviewsToday.
          await reloadFromDb();
        }
      })
      .catch(err => {
        console.warn('[sync] migration failed', err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn]);

  // Refresh `lastSyncAt` and `hasPending` periodically + after each sync
  const refreshDerived = useCallback(async () => {
    const ts = parseInt(localStorage.getItem('lingu_sync_last_at') ?? '0', 10);
    setLastSyncAt(ts > 0 ? ts : null);
    if (signedIn) {
      try {
        setHasPending(await hasPendingChanges());
      } catch {
        // Ignore — non-critical
      }
    } else {
      setHasPending(false);
    }
  }, [signedIn]);

  useEffect(() => {
    refreshDerived();
    const id = setInterval(refreshDerived, 30_000);
    return () => clearInterval(id);
  }, [refreshDerived]);

  // Auto-revert 'done' → 'idle' after 2s
  const doneTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (state.kind === 'done') {
      if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
      doneTimerRef.current = window.setTimeout(() => {
        setState({ kind: 'idle' });
      }, 2000);
    }
    return () => {
      if (doneTimerRef.current) {
        clearTimeout(doneTimerRef.current);
        doneTimerRef.current = null;
      }
    };
  }, [state]);

  const triggerSync = useCallback(async () => {
    if (state.kind === 'syncing') return; // already in flight
    setState({ kind: 'syncing' });
    try {
      const result = await syncOnce();
      setState({ kind: 'done', result });
      // Refresh Zustand from Dexie. Critical for the download/upload-all
      // paths (which wipe + repopulate local) — without this, the dashboard
      // keeps rendering the old streak/totalReviewsToday/dailyGoal in
      // memory and the user sees stale numbers despite the sync succeeding.
      // Cheap for delta sync too (just a settings.get + 1 set call).
      await reloadFromDb();
      await refreshDerived();
    } catch (err) {
      if (err instanceof SyncError && err.kind === 'choice') {
        const decision = (err as SyncError & { decision: FirstSyncDecision }).decision;
        setState({ kind: 'first_sync', decision });
      } else {
        setState({ kind: 'error', error: err as Error });
      }
    }
  }, [state.kind, refreshDerived, reloadFromDb]);

  const cancelFirstSync = useCallback(() => {
    setState({ kind: 'idle' });
  }, []);

  const reset = useCallback(async () => {
    // Called from FirstSyncModal.onResolved — by the time we're here, the
    // user has chosen Upload or Download and the sync has completed. We
    // need to reload Zustand from Dexie so the dashboard re-renders with
    // post-sync values (especially after download-all which wiped local).
    setState({ kind: 'idle' });
    await reloadFromDb();
    await refreshDerived();
  }, [reloadFromDb, refreshDerived]);

  // Auto-sync on sign-in (if initial done already)
  useEffect(() => {
    if (signedIn && isInitialSyncDone()) {
      // Don't await — fire and forget
      triggerSync().catch(() => {});
    }
    // Note: when signedIn flips false → true and initial sync NOT done,
    // we don't auto-trigger. The user's first explicit click on Sync
    // button will run decideFirstSync and open the modal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn]);

  // Auto push-only on tab close (best-effort)
  useEffect(() => {
    if (!signedIn) return;
    const onUnload = () => {
      // Best-effort — fetch may not complete during unload.
      // Future: use navigator.sendBeacon for reliability.
      pushOnly().catch(() => {});
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [signedIn]);

  return {
    state, signedIn, hasPending, lastSyncAt,
    triggerSync, cancelFirstSync, reset,
  };
}
