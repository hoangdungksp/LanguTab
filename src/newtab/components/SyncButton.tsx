import { useEffect, useState } from 'react';
import type { SyncUiState } from '../hooks/useSyncStatus';

interface Props {
  state: SyncUiState;
  signedIn: boolean;
  hasPending: boolean;
  lastSyncAt: number | null;
  onClick: () => void;
}

/**
 * Header Sync button — Anki-inspired.
 *
 * Visual states:
 *   - hidden when signed-out (no point syncing)
 *   - 🔄 Sync       (idle, no pending)
 *   - 🔄 Sync ●     (idle, pending changes — red dot)
 *   - 🔄 Đang đồng bộ... (syncing — spinner anim)
 *   - ✅ Đã đồng bộ (just done — green, fades after 2s)
 *   - ⚠️ Lỗi sync   (error — red border, click to retry)
 *
 * Tooltip on hover shows last sync time + pending count.
 */
export function SyncButton({ state, signedIn, hasPending, lastSyncAt, onClick }: Props) {
  // Sync only matters when signed in
  if (!signedIn) return null;

  const { label, icon, className, animated } = renderState(state, hasPending);
  const tooltip = buildTooltip(state, lastSyncAt, hasPending);

  return (
    <button
      onClick={onClick}
      disabled={state.kind === 'syncing'}
      title={tooltip}
      className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-all ${className}`}
    >
      <span className={animated ? 'inline-block animate-spin' : 'inline-block'}>
        {icon}
      </span>
      <span>{label}</span>
      {state.kind === 'idle' && hasPending && (
        <span className="ml-0.5 inline-block h-1.5 w-1.5 rounded-full bg-coral-500" aria-label="có thay đổi chưa đồng bộ" />
      )}
    </button>
  );
}

function renderState(state: SyncUiState, hasPending: boolean): {
  label: string;
  icon: string;
  className: string;
  animated: boolean;
} {
  switch (state.kind) {
    case 'idle':
      return {
        label: 'Đồng bộ',
        icon: '🔄',
        className: hasPending
          ? 'border-coral-300 bg-coral-50 text-coral-700 hover:bg-coral-100'
          : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50',
        animated: false,
      };
    case 'syncing':
      return {
        label: 'Đang đồng bộ...',
        icon: '🔄',
        className: 'border-blue-200 bg-blue-50 text-blue-700 cursor-wait',
        animated: true,
      };
    case 'done':
      return {
        label: 'Đã đồng bộ',
        icon: '✅',
        className: 'border-green-200 bg-green-50 text-green-700',
        animated: false,
      };
    case 'error':
      return {
        label: 'Lỗi - bấm thử lại',
        icon: '⚠️',
        className: 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100',
        animated: false,
      };
    case 'first_sync':
      return {
        label: 'Cần chọn',
        icon: '⚠️',
        className: 'border-amber-300 bg-amber-50 text-amber-700',
        animated: false,
      };
  }
}

function buildTooltip(state: SyncUiState, lastSyncAt: number | null, hasPending: boolean): string {
  const lines: string[] = [];
  if (state.kind === 'error') {
    const err = state.error;
    lines.push(`Lỗi: ${err.message}`);
    if ('detail' in err && err.detail) lines.push(err.detail);
  } else if (state.kind === 'done') {
    const r = state.result;
    if (r.applied === -1) lines.push('Đã download toàn bộ từ cloud');
    else if (r.uploaded === -1) lines.push('Đã upload toàn bộ lên cloud');
    else lines.push(`Nhận ${r.applied} thay đổi, gửi ${r.uploaded} thay đổi`);
  } else {
    if (lastSyncAt) {
      lines.push(`Lần sync cuối: ${formatRelative(lastSyncAt)}`);
    } else {
      lines.push('Chưa đồng bộ lần nào');
    }
    if (hasPending) lines.push('Có thay đổi chưa đồng bộ');
  }
  lines.push('Click để đồng bộ ngay');
  return lines.join('\n');
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return `${Math.round(diff / 1000)}s trước`;
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)} phút trước`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)} giờ trước`;
  return `${Math.round(diff / 86_400_000)} ngày trước`;
}

// Optional: live-updating relative time so the tooltip shows "1 phút trước" → "2 phút trước"
// without remount. Used by parent if it cares.
export function useRelativeTimeTick(ts: number | null): string {
  const [_, setTick] = useState(0);
  useEffect(() => {
    if (ts === null) return;
    const id = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(id);
  }, [ts]);
  return ts === null ? 'chưa đồng bộ' : formatRelative(ts);
}
