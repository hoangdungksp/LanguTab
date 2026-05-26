import { useEffect, useState } from 'react';
import {
  fetchSyncStatus,
  setForceDirection,
  getForceDirection,
  deleteAccount,
  clearSyncState,
  type SyncStatus,
} from '../../services/syncService';
import { signOut } from '../../services/authService';
import { clearActiveUserId } from '../../services/syncMigration';
import { db } from '../../services/db';
import { useAppStore } from '../../stores/useAppStore';
import { UpgradeModal } from './UpgradeModal';
import { StatsSection } from './StatsSection';
import { refreshTier } from '../hooks/useTier';
import {
  isAdminRole,
  isAdminManuallyDisabled,
  setAdminEnabled,
} from '../../services/adminModeService';

interface Props {
  onClose: () => void;
}

/** Inner tab inside the modal — replaces the previous single-page layout. */
type AccountTab = 'account' | 'stats';

/**
 * Account & Sync settings modal.
 *
 * v0.17.0 restructure: split into 2 inner tabs to declutter the long
 * single-page form and surface stats more prominently.
 *   - "Tài khoản & Đồng bộ" — original content (info, cloud, force, sign-out, danger)
 *   - "Thống kê" — full StatsSection (heatmap, daily chart, mastery, etc.)
 *     Stats was previously a top-level tab but a "look back" surface didn't
 *     earn that real-estate; the avatar-menu modal is the natural home for
 *     personal analytics. Top-level slot now goes to Phòng thi (v1.0).
 *
 * Sections in "account" tab:
 *   1. Account info — email, tier, member-since
 *   2. Cloud storage — counts of synced rows (from /sync/status)
 *   3. Force one-way — radio for next-sync direction (Anki "force one-way" feature)
 *   4. Sign out — with optional "clear local cache" toggle
 *   5. Danger zone — delete account (wipes server + local)
 */
export function AccountSettingsModal({ onClose }: Props) {
  const reloadFromDb = useAppStore(s => s.reloadFromDb);
  const [activeTab, setActiveTab] = useState<AccountTab>('account');
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forceDir, setForceDir] = useState<'upload' | 'download' | null>(null);
  const [signOutBusy, setSignOutBusy] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Fetch status on mount
  useEffect(() => {
    let alive = true;
    fetchSyncStatus()
      .then(s => { if (alive) { setStatus(s); setLoading(false); } })
      .catch(err => { if (alive) { setError(err.message); setLoading(false); } });
    setForceDir(getForceDirection());
    return () => { alive = false; };
  }, []);

  const onForceChange = (dir: 'upload' | 'download' | null) => {
    setForceDir(dir);
    setForceDirection(dir);
  };

  const onSignOut = async (clearLocal: boolean) => {
    setSignOutBusy(true);
    try {
      if (clearLocal) {
        // Wipe local user data (preserve cache table — it's just AI assets)
        await Promise.all([
          db.wordProgress.clear(),
          db.userStories.clear(),
          db.customImages.clear(),
          db.reviewLog.clear(),
          db.settings.clear(),
        ]);
      } else {
        // KEEP local data — but mark as orphan (clear active user marker)
        // so the next sign-in correctly detects user-switch if a different
        // Google account comes in (security defense in syncMigration.ts).
        clearActiveUserId();
      }
      clearSyncState();
      await signOut();

      // Always re-hydrate Zustand from Dexie post-sign-out.
      // Why even when keeping data: localStorage flags like
      // `lingu_initial_done` get cleared by `clearSyncState()`, and the
      // sync-state-derived counters (streak, totalReviewsToday) need to
      // reflect post-sign-out reality. Without this, the Dashboard keeps
      // rendering the in-memory `useAppStore` values from before sign-out,
      // showing stale "🔥 Chuỗi 1 ngày" / "🎯 3/10" / "⏰ 2 thẻ" etc.
      await reloadFromDb();

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng xuất thất bại');
      setSignOutBusy(false);
    }
  };

  const onDeleteAccount = async () => {
    if (confirmText !== 'XOA') return;
    setDeleteBusy(true);
    try {
      await deleteAccount();
      // deleteAccount() already clears local Dexie + sync state; we just
      // need to flush the in-memory Zustand state so the UI re-renders
      // with default values instead of the stale streak/reviews/etc.
      await reloadFromDb();
      await signOut();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xóa tài khoản thất bại');
      setDeleteBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !deleteBusy && !signOutBusy) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-lg font-semibold text-ink-900">Tài khoản & Đồng bộ</h2>
          <button
            onClick={onClose}
            disabled={deleteBusy || signOutBusy}
            className="text-ink-400 hover:text-ink-600 disabled:opacity-50"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Inner tab nav. Bumped up max-w (xl → 3xl) above to give Stats
            charts adequate width. The two-tab UI keeps Account-flow short
            (info, sync, sign-out) and pushes the heavy Stats panel onto
            its own surface so users browsing for stats don't scroll past
            the danger zone. */}
        <div className="mb-5 flex gap-1 rounded-pill border-2 border-ink-100 bg-ink-50 p-1">
          <TabPill
            active={activeTab === 'account'}
            onClick={() => setActiveTab('account')}
            emoji="⚙️"
            label="Tài khoản & Đồng bộ"
          />
          <TabPill
            active={activeTab === 'stats'}
            onClick={() => setActiveTab('stats')}
            emoji="📊"
            label="Thống kê"
          />
        </div>

        {error && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {activeTab === 'stats' ? (
          <div className="-mx-1">
            <StatsSection lang={useAppStore.getState().targetLang} />
          </div>
        ) : loading ? (
          <div className="py-8 text-center text-sm text-ink-500">Đang tải...</div>
        ) : status ? (
          <>
            {/* ─── Account info ─────────────────────────────────────────── */}
            <Section title="Thông tin tài khoản">
              <Field label="Email" value={status.user.email} />
              <Field
                label="Gói"
                value={
                  status.user.tier === 'pro'
                    ? `Pro${status.user.tier_expires_at ? ` (đến ${formatDate(status.user.tier_expires_at)})` : ''}`
                    : status.user.tier === 'lifetime'
                      ? 'Pro lifetime'
                      : status.user.tier === 'banned'
                        ? 'Banned'
                        : 'Miễn phí'
                }
              />
              <Field label="Tham gia" value={formatDate(status.user.created_at)} />
            </Section>

            {/* ─── Sprint 4.9.5.1: Admin mode toggle ────────────────────── */}
            {/* Only renders if signed-in email is in the admin list. Lets
                admin temporarily disable admin features (e.g., to test as
                a regular user) without signing out. State persists in
                localStorage so it survives reloads. */}
            <AdminModeSection />

            {/* ─── Upgrade / Pro management ─────────────────────────────── */}
            {status.user.tier === 'free' ? (
              <Section
                title="✨ Nâng cấp Pro"
                description="Mở khoá 30 truyện AI/ngày (10× nhiều hơn Free)"
              >
                <button
                  onClick={() => setShowUpgrade(true)}
                  className="w-full rounded-md border-2 border-coral-600 bg-coral-500 py-2 text-sm font-semibold text-white hover:bg-coral-600"
                >
                  Xem các gói Pro →
                </button>
              </Section>
            ) : (status.user.tier === 'pro' || status.user.tier === 'lifetime') ? (
              <Section
                title="✨ Bạn đang dùng Pro"
                description={
                  status.user.tier === 'lifetime'
                    ? 'Cảm ơn đã ủng hộ! Bạn dùng Pro mãi mãi.'
                    : status.user.tier_expires_at
                      ? `Subscription tự gia hạn vào ${formatDate(status.user.tier_expires_at)}.`
                      : 'Subscription đang hoạt động.'
                }
              >
                {status.user.tier === 'pro' && (
                  <p className="text-xs text-ink-500">
                    Quản lý subscription qua email từ Lemon Squeezy. Hỗ trợ:{' '}
                    <a href="mailto:jasonnguyenksp@gmail.com" className="text-coral-600 underline">
                      jasonnguyenksp@gmail.com
                    </a>
                  </p>
                )}
              </Section>
            ) : null}

            {/* ─── Cloud storage ────────────────────────────────────────── */}
            <Section title="Dữ liệu trên cloud">
              <Field label="Từ đã học" value={status.counts.word_progress.toLocaleString()} />
              <Field label="Truyện AI" value={status.counts.user_stories.toLocaleString()} />
              <Field
                label="Ảnh custom"
                value={`${status.counts.custom_images.toLocaleString()} (${formatBytes(status.counts.custom_images_bytes)})`}
              />
              <Field label="Lượt review" value={status.counts.review_log.toLocaleString()} />
            </Section>

            {/* ─── Force one-way ────────────────────────────────────────── */}
            <Section
              title="Đồng bộ lần tới"
              description="Chỉ dùng nếu bạn muốn restore data hoặc reset cloud. Bình thường không cần."
            >
              <RadioRow
                checked={forceDir === null}
                onChange={() => onForceChange(null)}
                label="Tự động merge (mặc định)"
                description="Sync hai chiều, last-write-wins"
              />
              <RadioRow
                checked={forceDir === 'download'}
                onChange={() => onForceChange('download')}
                label="⬇️ Force download (lấy từ cloud)"
                description="Ghi đè data trên máy này bằng data cloud. Dùng khi muốn restore."
              />
              <RadioRow
                checked={forceDir === 'upload'}
                onChange={() => onForceChange('upload')}
                label="⬆️ Force upload (đẩy lên cloud)"
                description="Ghi đè data cloud bằng data máy này. Dùng khi cloud bị lỗi."
              />
              {forceDir !== null && (
                <p className="mt-2 text-xs text-amber-700">
                  ⚠️ Lần sync tới sẽ chỉ chạy 1 chiều. Sau đó sẽ tự reset về mặc định.
                </p>
              )}
            </Section>

            {/* ─── Sign out ─────────────────────────────────────────────── */}
            <Section title="Đăng xuất">
              <div className="space-y-2">
                <button
                  onClick={() => onSignOut(false)}
                  disabled={signOutBusy}
                  className="w-full rounded-md border border-ink-200 bg-white py-2 text-sm font-medium text-ink-700 hover:bg-ink-50 disabled:opacity-50"
                >
                  {signOutBusy ? 'Đang đăng xuất...' : 'Đăng xuất (giữ data trên máy)'}
                </button>
                <button
                  onClick={() => {
                    if (confirm('Xóa toàn bộ data trên máy này? Data trên cloud vẫn còn.\n\nLần sau đăng nhập có thể download lại từ cloud.')) {
                      onSignOut(true);
                    }
                  }}
                  disabled={signOutBusy}
                  className="w-full rounded-md border border-amber-300 bg-amber-50 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                >
                  Đăng xuất + xóa cache local
                </button>
              </div>
            </Section>

            {/* ─── Danger zone ──────────────────────────────────────────── */}
            <Section title="⚠️ Vùng nguy hiểm">
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full rounded-md border border-red-300 bg-red-50 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                >
                  Xóa tài khoản & toàn bộ data
                </button>
              ) : (
                <div className="space-y-3 rounded-md border-2 border-red-300 bg-red-50 p-3">
                  <div className="text-sm text-red-900">
                    <p className="font-semibold">⚠️ Hành động không thể hoàn tác!</p>
                    <p className="mt-1">
                      Sẽ xóa <strong>vĩnh viễn</strong>:
                    </p>
                    <ul className="ml-5 mt-1 list-disc space-y-0.5 text-xs">
                      <li>{status.counts.word_progress.toLocaleString()} từ đã học (FSRS progress)</li>
                      <li>{status.counts.user_stories.toLocaleString()} truyện AI tự tạo</li>
                      <li>{status.counts.custom_images.toLocaleString()} ảnh custom</li>
                      <li>{status.counts.review_log.toLocaleString()} lượt review</li>
                      <li>Settings + preferences</li>
                    </ul>
                    <p className="mt-2 text-xs">
                      Tài khoản Google của bạn sẽ <strong>không</strong> bị xóa — chỉ data LinguTab.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-red-900">
                      Gõ <code className="rounded bg-red-200 px-1.5 py-0.5 font-bold">XOA</code> để xác nhận:
                    </label>
                    <input
                      type="text"
                      value={confirmText}
                      onChange={e => setConfirmText(e.target.value.toUpperCase())}
                      disabled={deleteBusy}
                      autoFocus
                      placeholder="XOA"
                      className="mt-1 w-full rounded-md border border-red-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none disabled:opacity-50"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowDeleteConfirm(false); setConfirmText(''); }}
                      disabled={deleteBusy}
                      className="flex-1 rounded-md border border-ink-300 bg-white py-2 text-sm font-medium text-ink-700 hover:bg-ink-50 disabled:opacity-50"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={onDeleteAccount}
                      disabled={confirmText !== 'XOA' || deleteBusy}
                      className="flex-1 rounded-md bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deleteBusy ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
                    </button>
                  </div>
                </div>
              )}
            </Section>
          </>
        ) : null}
      </div>

      {/* Upgrade modal — overlay above this one. On close we refresh both
          the tier hook (so the Header badge flips) and the local sync
          status (so this modal re-renders the new tier). */}
      {showUpgrade && (
        <UpgradeModal
          onClose={async () => {
            setShowUpgrade(false);
            await refreshTier();
            // Re-fetch sync status so the "Gói" field updates without a
            // full reload. Best-effort: ignore errors (worst case user
            // sees stale "Miễn phí" until next modal open).
            try {
              const fresh = await fetchSyncStatus();
              setStatus(fresh);
            } catch { /* ignore */ }
          }}
        />
      )}
    </div>
  );
}

// ─── Helper components ──────────────────────────────────────────────────────
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5 border-b border-ink-100 pb-4 last:border-b-0">
      <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
      {description && (
        <p className="mb-2 mt-0.5 text-xs text-ink-500">{description}</p>
      )}
      <div className="mt-2 space-y-1.5">{children}</div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-ink-500">{label}</span>
      <span className="font-medium text-ink-800">{value}</span>
    </div>
  );
}

function RadioRow({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 rounded-md p-2 hover:bg-ink-50">
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 cursor-pointer accent-coral-500"
      />
      <div className="flex-1">
        <div className="text-sm font-medium text-ink-800">{label}</div>
        {description && <div className="text-xs text-ink-500">{description}</div>}
      </div>
    </label>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('vi-VN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

/**
 * Compact pill-style tab button for the modal's inner navigation.
 * Active tab gets a white card with shadow; inactive stays low-contrast.
 */
function TabPill({
  active,
  onClick,
  emoji,
  label,
}: {
  active: boolean;
  onClick: () => void;
  emoji: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex flex-1 items-center justify-center gap-2 rounded-pill px-4 py-2 text-sm font-semibold transition-all',
        active
          ? 'bg-white text-ink-700 shadow-sm'
          : 'text-ink-500 hover:text-ink-700',
      ].join(' ')}
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </button>
  );
}

// ─── Sprint 4.9.5.1: Admin mode section ─────────────────────────────────

/**
 * Inline section in account settings — only renders if the signed-in
 * email is in the ADMIN_EMAILS list. Lets admin temporarily disable
 * admin features without signing out (e.g., to test as a regular user).
 */
function AdminModeSection() {
  const [disabled, setDisabled] = useState(isAdminManuallyDisabled());

  if (!isAdminRole()) {
    // Not an editor/admin (per D1 role) — render nothing
    return null;
  }

  function toggleAdmin() {
    const newDisabled = !disabled;
    setDisabled(newDisabled);
    // setAdminEnabled takes ENABLED state, so we negate
    setAdminEnabled(!newDisabled);
  }

  return (
    <section className="mb-4 rounded-md border-2 border-purple-400 bg-purple-50 p-3">
      <h3 className="mb-1 font-display text-sm font-bold text-purple-800">
        🛠️ Super Admin
      </h3>
      <p className="mb-2 text-xs text-purple-700">
        Tài khoản này có quyền admin. Khi bật, các tính năng admin (calibration,
        edit audio script, vision auto-caption) sẽ hiện trong Phòng thi.
      </p>
      <div className="flex items-center justify-between">
        <span className="font-display text-xs font-bold text-purple-800">
          Admin mode: {disabled ? 'TẮT' : 'BẬT'}
        </span>
        <button
          onClick={toggleAdmin}
          className={`rounded-md border-2 px-3 py-1 font-display text-xs font-bold shadow-chunky-soft ${
            disabled
              ? 'border-mint-700 bg-mint-500 text-white hover:bg-mint-600'
              : 'border-coral-700 bg-coral-500 text-white hover:bg-coral-600'
          }`}
        >
          {disabled ? '✓ Bật admin mode' : '✕ Tắt admin mode'}
        </button>
      </div>
      {disabled && (
        <p className="mt-2 text-[11px] text-purple-600">
          Admin mode đang TẮT. Tải lại trang để áp dụng (tab Phòng thi sẽ
          không hiện admin features cho đến khi bật lại).
        </p>
      )}
      {!disabled && (
        <p className="mt-2 text-[11px] text-purple-600">
          Admin mode đang BẬT. Vào tab Phòng thi để dùng tools.
        </p>
      )}
    </section>
  );
}
