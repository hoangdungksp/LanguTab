import { useState } from 'react';
import { resolveFirstSync } from '../../services/syncService';
import type { FirstSyncDecision } from '../../services/syncService';

interface Props {
  decision: FirstSyncDecision;
  onResolved: () => void;
  onCancel: () => void;
}

/**
 * Anki-style first-sync popup.
 *
 * Shown when local AND server both have data — we can't auto-merge for
 * the very first sync (the server has never seen this user, the user has
 * never sync'd). User must explicitly choose which side wins.
 *
 * After this initial one-way resolution, future syncs use delta merge
 * with last-write-wins, no popup needed.
 */
export function FirstSyncModal({ decision, onResolved, onCancel }: Props) {
  const [busy, setBusy] = useState<'upload' | 'download' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const choose = async (which: 'upload' | 'download') => {
    setBusy(which);
    setError(null);
    try {
      await resolveFirstSync(which);
      onResolved();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">Đồng bộ lần đầu</h2>
            <p className="mt-1 text-sm text-ink-600">
              Cả máy này và cloud đều có dữ liệu. Bạn cần chọn giữ bên nào.
            </p>
          </div>
        </div>

        {/* Comparison table */}
        <div className="mb-5 grid grid-cols-2 gap-3 rounded-lg border border-ink-200 bg-ink-50 p-3">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
              Trên máy này
            </h3>
            <ul className="space-y-1 text-sm text-ink-700">
              <li>{decision.local.word_progress.toLocaleString()} từ đã học</li>
              <li>{decision.local.user_stories.toLocaleString()} truyện AI</li>
              <li>{decision.local.custom_images.toLocaleString()} ảnh custom</li>
              <li>{decision.local.review_log.toLocaleString()} lượt review</li>
            </ul>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
              Trên cloud
            </h3>
            <ul className="space-y-1 text-sm text-ink-700">
              <li>{decision.server.word_progress.toLocaleString()} từ đã học</li>
              <li>{decision.server.user_stories.toLocaleString()} truyện AI</li>
              <li>{decision.server.custom_images.toLocaleString()} ảnh custom</li>
              <li>{decision.server.review_log.toLocaleString()} lượt review</li>
            </ul>
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-2">
          <button
            onClick={() => choose('upload')}
            disabled={!!busy}
            className="flex w-full items-start gap-3 rounded-lg border-2 border-coral-200 bg-coral-50 p-3 text-left hover:border-coral-300 hover:bg-coral-100 disabled:opacity-60"
          >
            <span className="text-xl">⬆️</span>
            <div className="flex-1">
              <div className="font-semibold text-coral-900">
                {busy === 'upload' ? 'Đang upload...' : 'Upload lên cloud'}
              </div>
              <div className="text-xs text-coral-700">
                Gửi data máy này lên cloud. Cloud sẽ bị ghi đè.
              </div>
            </div>
          </button>

          <button
            onClick={() => choose('download')}
            disabled={!!busy}
            className="flex w-full items-start gap-3 rounded-lg border-2 border-blue-200 bg-blue-50 p-3 text-left hover:border-blue-300 hover:bg-blue-100 disabled:opacity-60"
          >
            <span className="text-xl">⬇️</span>
            <div className="flex-1">
              <div className="font-semibold text-blue-900">
                {busy === 'download' ? 'Đang download...' : 'Download từ cloud'}
              </div>
              <div className="text-xs text-blue-700">
                Lấy data từ cloud về. Mọi data trên máy này sẽ bị thay thế.
              </div>
            </div>
          </button>

          <button
            onClick={onCancel}
            disabled={!!busy}
            className="w-full rounded-md border border-ink-200 bg-white py-2 text-sm font-medium text-ink-600 hover:bg-ink-50 disabled:opacity-50"
          >
            Hủy
          </button>
        </div>

        <p className="mt-4 text-xs text-ink-500">
          💡 Sau lần đầu này, các lần sync sau sẽ tự động merge cả hai bên (không cần chọn nữa).
        </p>
      </div>
    </div>
  );
}
