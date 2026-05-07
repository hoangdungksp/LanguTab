import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AccountSettingsModal } from './AccountSettingsModal';

/**
 * Simple, provider-agnostic auth control for the header.
 *
 * Design intent (per Jason):
 *   - NOT a chunky button with brand logo. The previous Google "G" glyph +
 *     pill button looked too heavy and was provider-specific. We want this
 *     spot to support email/password, Apple, Facebook etc. in the future
 *     without redesigning, so the entry point is just a text link.
 *   - Signed-out state: plain text link "Đăng ký / Đăng nhập" — clicking it
 *     triggers signIn() which currently routes to Google OAuth via Chrome
 *     Identity API. When other providers are added, this single link will
 *     open a small provider chooser modal instead.
 *   - Signed-in state: avatar + display name (no border, just compact chip),
 *     click to open a tiny dropdown menu (currently just sign-out; can grow
 *     to settings, switch account etc.).
 *
 * The actual auth flow still goes through Chrome Identity API for Google
 * (only working provider right now). Email/password & other providers will
 * be added later — the UI is ready for them via a future provider selector.
 */
export function AuthButton() {
  const { signedIn, userInfo, busy, signIn, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Initial check — render placeholder to avoid layout shift
  if (signedIn === null) {
    return <span className="text-xs text-ink-300">Đang kiểm tra…</span>;
  }

  if (!signedIn) {
    return (
      <button
        onClick={signIn}
        disabled={busy}
        className="text-sm font-semibold text-ink-600 underline-offset-4 transition-colors hover:text-coral-600 hover:underline disabled:opacity-50"
      >
        {busy ? 'Đang xử lý…' : 'Đăng ký / Đăng nhập'}
      </button>
    );
  }

  // Signed in: avatar + name → click for dropdown menu.
  // Falls back to email prefix if Google profile name unavailable, then to
  // generic "User" if userInfo hasn't loaded yet (brief profile-fetch window
  // after sign-in). Keeps the chip visible without layout shift.
  const displayName = userInfo?.name ?? userInfo?.email?.split('@')[0] ?? 'User';

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="flex items-center gap-2 rounded-pill px-2 py-1 transition-colors hover:bg-ink-100"
        title={userInfo?.email ?? ''}
      >
        {userInfo?.picture ? (
          <img
            src={userInfo.picture}
            alt=""
            referrerPolicy="no-referrer"
            className="h-7 w-7 rounded-full"
          />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-coral-500 text-xs font-bold text-cream">
            {displayName.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="max-w-[100px] truncate text-sm font-semibold text-ink-700">
          {displayName}
        </span>
      </button>

      {menuOpen && (
        <>
          {/* Backdrop closes menu on outside click. We don't use a portal —
              the menu is small + adjacent so keeping the DOM simple avoids
              stacking-context surprises with the language switcher. */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-chunk border-2 border-ink-200 bg-paper shadow-chunky-soft">
            <div className="border-b border-ink-100 px-4 py-3">
              <div className="text-xs text-ink-400">Đã đăng nhập</div>
              <div className="truncate text-sm font-semibold text-ink-700">
                {userInfo?.email ?? displayName}
              </div>
            </div>
            <button
              onClick={() => {
                setMenuOpen(false);
                setSettingsOpen(true);
              }}
              className="w-full border-b border-ink-100 px-4 py-2.5 text-left text-sm font-semibold text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-800"
            >
              ⚙️ Tài khoản & Đồng bộ
            </button>
            <button
              onClick={async () => {
                setMenuOpen(false);
                if (confirm('Đăng xuất khỏi tài khoản?')) {
                  await signOut();
                }
              }}
              disabled={busy}
              className="w-full px-4 py-2.5 text-left text-sm font-semibold text-ink-600 transition-colors hover:bg-coral-50 hover:text-coral-700 disabled:opacity-50"
            >
              Đăng xuất
            </button>
          </div>
        </>
      )}

      {/* Account & Sync settings modal */}
      {settingsOpen && (
        <AccountSettingsModal onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}
