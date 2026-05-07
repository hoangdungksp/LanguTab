import { useCallback, useEffect, useState } from 'react';
import {
  getAuthToken,
  getUserInfo,
  isSignedIn,
  onAuthChange,
  signOut,
  type UserInfo,
} from '../../services/authService';
import { clearSyncState } from '../../services/syncService';
import { clearActiveUserId } from '../../services/syncMigration';
import { useAppStore } from '../../stores/useAppStore';

/**
 * React hook for Google OAuth state.
 *
 * - Subscribes to authService events so UI stays in sync across components
 *   (e.g. sign in from Dashboard → Flashcard immediately shows upload button).
 * - `signedIn` starts as null while we check; use to gate UI loading states.
 * - `userInfo` is populated after sign-in so the header can show the user's
 *   name + avatar.
 *
 * Usage:
 *   const { signedIn, userInfo, signIn, signOut: doSignOut, busy } = useAuth();
 *   if (signedIn === null) return <Spinner />;
 *   if (!signedIn) return <button onClick={signIn}>Sign in</button>;
 */
export function useAuth() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [busy, setBusy] = useState(false);

  // Initial check + subscribe to changes
  useEffect(() => {
    let mounted = true;

    (async () => {
      const result = await isSignedIn();
      if (mounted) setSignedIn(result);
    })();

    const unsubscribe = onAuthChange((state) => {
      if (mounted) setSignedIn(state);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // When signed in, fetch user profile. Re-runs whenever signedIn flips
  // true → false → true (e.g. sign-out then sign-in to a different account).
  useEffect(() => {
    if (signedIn !== true) {
      setUserInfo(null);
      return;
    }
    let cancelled = false;
    getUserInfo().then((info) => {
      if (!cancelled) setUserInfo(info);
    });
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  /**
   * Prompt user to sign in (interactive Chrome Identity flow).
   * Returns true on success, false on user decline or error.
   */
  const signIn = useCallback(async (): Promise<boolean> => {
    setBusy(true);
    try {
      const token = await getAuthToken(true);
      return !!token;
    } finally {
      setBusy(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    setBusy(true);
    try {
      // Clear sync state in localStorage so the next sign-in starts fresh
      // (no orphan "initial sync done" flag making decideFirstSync skip).
      clearSyncState();
      // Clear active user marker. Without this, signing into a DIFFERENT
      // Google account next time wouldn't trigger user-switch wipe in
      // syncMigration.ts (security defense).
      clearActiveUserId();
      // Revoke Google OAuth token + clear Chrome's identity cache.
      await signOut();
      // Re-hydrate Zustand from Dexie. Critical fix for the bug where
      // dashboard kept rendering the previous user's streak / today's
      // reviews / due cards after sign-out. reloadFromDb() resets to
      // either default values (if Dexie cleared) or the stored values
      // for this device (if user kept data).
      await useAppStore.getState().reloadFromDb();
    } finally {
      setBusy(false);
    }
  }, []);

  return {
    signedIn,
    userInfo,
    busy,
    signIn,
    signOut: handleSignOut,
  };
}
