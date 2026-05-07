import { useEffect, useState } from 'react';
import type {
  BackFieldId,
  FlashcardLayout,
  FrontFieldId,
} from '../../types';
import {
  BACK_FIELD_LABELS,
  DEFAULT_CARD_LAYOUT,
  FRONT_FIELD_LABELS,
  sanitizeCardLayout,
} from '../../types';

interface LayoutEditorProps {
  open: boolean;
  initialLayout: FlashcardLayout;
  onClose: () => void;
  onSave: (layout: FlashcardLayout) => void | Promise<void>;
}

/**
 * Modal editor for the flashcard field order.
 *
 * UX flow:
 *   1. Opens with a DRAFT copy of the current layout — user changes don't
 *      touch the real store until they hit "Lưu".
 *   2. User can reorder via HTML5 drag-and-drop (mouse) OR via the ↑/↓
 *      buttons next to each item (keyboard-accessible, touch-friendly).
 *   3. "Khôi phục mặc định" resets the draft to DEFAULT_CARD_LAYOUT in-place
 *      (still requires "Lưu" to commit).
 *   4. "Hủy" / Esc / backdrop click discards the draft.
 *   5. "Lưu" commits via onSave and closes.
 *
 * No drag-and-drop library is used — native HTML5 DnD is sufficient for
 * short (4-item) lists on desktop Chrome. Arrow buttons provide keyboard
 * reorder + touch fallback.
 */
export function LayoutEditor({
  open,
  initialLayout,
  onClose,
  onSave,
}: LayoutEditorProps) {
  // Draft state — mutated freely; only pushed to the store on Save.
  const [draft, setDraft] = useState<FlashcardLayout>(initialLayout);

  // Reset draft whenever the modal opens or the initial layout changes
  // (so if the user cancels and later reopens, they see the saved state).
  useEffect(() => {
    if (open) setDraft(initialLayout);
  }, [open, initialLayout]);

  // Close on Escape (doesn't steal Space / Enter — those are valid inside
  // form controls within the modal, e.g. clicking ↑/↓ buttons).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Body scroll lock while open — prevents the card behind from scrolling
  // when mouse is over the modal.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const moveFront = (from: number, to: number) => {
    setDraft((d) => ({ ...d, front: reorder(d.front, from, to) }));
  };
  const moveBack = (from: number, to: number) => {
    setDraft((d) => ({ ...d, back: reorder(d.back, from, to) }));
  };

  const handleReset = () => setDraft(DEFAULT_CARD_LAYOUT);

  const handleSave = async () => {
    await onSave(sanitizeCardLayout(draft));
    onClose();
  };

  // Count of changes from initial, shown in the Save button as a subtle hint.
  const hasChanges =
    !arraysEqual(draft.front, initialLayout.front) ||
    !arraysEqual(draft.back, initialLayout.back);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="layout-editor-title"
    >
      {/* Backdrop — click to cancel */}
      <div
        className="absolute inset-0 bg-ink-700/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal body */}
      <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-chunk border-2 border-ink-200 bg-paper p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2
              id="layout-editor-title"
              className="font-display text-2xl font-bold text-ink-700"
            >
              ⚙️ Tùy chỉnh thẻ flashcard
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Kéo thả <span className="font-semibold">⋮⋮</span> hoặc dùng nút ↑↓ để
              thay đổi thứ tự. Nhấn <span className="font-semibold">Lưu</span> để
              áp dụng.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill border-2 border-ink-200 bg-white text-ink-500 hover:border-coral-500 hover:text-coral-700"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Front face column */}
          <FaceColumn
            title="Mặt trước"
            subtitle="Khi thẻ chưa lật"
            tint="coral"
            items={draft.front.map((id) => ({
              id,
              label: FRONT_FIELD_LABELS[id].label,
              emoji: FRONT_FIELD_LABELS[id].emoji,
            }))}
            onMove={moveFront}
          />

          {/* Back face column */}
          <FaceColumn
            title="Mặt sau"
            subtitle="Khi thẻ đã lật, xem đáp án"
            tint="mint"
            items={draft.back.map((id) => ({
              id,
              label: BACK_FIELD_LABELS[id].label,
              emoji: BACK_FIELD_LABELS[id].emoji,
            }))}
            onMove={moveBack}
          />
        </div>

        {/* Action row */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 rounded-pill border-2 border-ink-200 bg-white px-4 py-2 font-display text-sm font-semibold text-ink-600 transition-colors hover:border-ink-400"
          >
            <span>🔄</span>
            <span>Khôi phục mặc định</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-pill border-2 border-ink-200 bg-white px-5 py-2 font-display text-sm font-semibold text-ink-600 transition-colors hover:border-ink-400"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={[
                'rounded-pill border-2 px-5 py-2 font-display text-sm font-semibold transition-all',
                hasChanges
                  ? 'border-mint-500 bg-mint-500 text-white hover:bg-mint-600 hover:border-mint-600'
                  : 'cursor-not-allowed border-ink-200 bg-ink-100 text-ink-400',
              ].join(' ')}
            >
              {hasChanges ? '💾 Lưu' : 'Không có thay đổi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// —————————————————————————————————————————————————————————
// FaceColumn — a sortable list for one face of the card
// —————————————————————————————————————————————————————————

function FaceColumn<ID extends FrontFieldId | BackFieldId>({
  title,
  subtitle,
  tint,
  items,
  onMove,
}: {
  title: string;
  subtitle: string;
  tint: 'coral' | 'mint';
  items: { id: ID; label: string; emoji: string }[];
  onMove: (from: number, to: number) => void;
}) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const headerTint =
    tint === 'coral' ? 'text-coral-700' : 'text-mint-700';
  const accentTint =
    tint === 'coral' ? 'border-coral-200 bg-coral-50' : 'border-mint-200 bg-mint-50';

  return (
    <div
      className={[
        'rounded-chunk border-2 p-4',
        accentTint,
      ].join(' ')}
    >
      <div className="mb-3">
        <h3 className={['font-display text-lg font-bold', headerTint].join(' ')}>
          {title}
        </h3>
        <p className="text-xs text-ink-500">{subtitle}</p>
      </div>

      <ol className="space-y-2">
        {items.map((item, index) => {
          const isDragged = draggedIndex === index;
          const isOver =
            overIndex === index && draggedIndex !== null && draggedIndex !== index;

          return (
            <li
              key={item.id}
              draggable
              onDragStart={(e) => {
                setDraggedIndex(index);
                // Firefox requires any dataTransfer payload to initiate drag.
                e.dataTransfer.setData('text/plain', String(index));
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragEnter={() => {
                if (draggedIndex !== null) setOverIndex(index);
              }}
              onDragOver={(e) => {
                // Must preventDefault to allow drop.
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (draggedIndex !== null) setOverIndex(index);
              }}
              onDragLeave={(e) => {
                // Only clear if leaving the <li> boundary, not crossing a child.
                if (e.currentTarget === e.target) {
                  setOverIndex((prev) => (prev === index ? null : prev));
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                const from = draggedIndex;
                if (from !== null && from !== index) {
                  onMove(from, index);
                }
                setDraggedIndex(null);
                setOverIndex(null);
              }}
              onDragEnd={() => {
                setDraggedIndex(null);
                setOverIndex(null);
              }}
              className={[
                'flex items-center gap-3 rounded-chunk border-2 bg-white p-3 transition-all',
                isDragged && 'opacity-40',
                isOver && 'border-ink-700 shadow-md scale-[1.02]',
                !isDragged && !isOver && 'border-ink-100',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {/* Drag handle — visual affordance for grab */}
              <span
                className="flex h-8 w-6 shrink-0 cursor-grab items-center justify-center text-lg text-ink-400 active:cursor-grabbing"
                aria-hidden
                title="Kéo để sắp xếp"
              >
                ⋮⋮
              </span>

              {/* Item label */}
              <span className="flex flex-1 items-center gap-2">
                <span className="text-xl" aria-hidden>
                  {item.emoji}
                </span>
                <span className="font-display text-sm font-semibold text-ink-700">
                  {item.label}
                </span>
              </span>

              {/* Keyboard-accessible reorder buttons */}
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => onMove(index, index - 1)}
                  disabled={index === 0}
                  aria-label={`Di chuyển ${item.label} lên`}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-ink-200 bg-white text-ink-600 transition-colors hover:border-ink-400 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-ink-200"
                >
                  ↑
                </button>
                <button
                  onClick={() => onMove(index, index + 1)}
                  disabled={index === items.length - 1}
                  aria-label={`Di chuyển ${item.label} xuống`}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-ink-200 bg-white text-ink-600 transition-colors hover:border-ink-400 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-ink-200"
                >
                  ↓
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// —————————————————————————————————————————————————————————
// Pure helpers
// —————————————————————————————————————————————————————————

function reorder<T>(arr: T[], from: number, to: number): T[] {
  if (from === to) return arr;
  if (to < 0 || to >= arr.length) return arr;
  const next = arr.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
