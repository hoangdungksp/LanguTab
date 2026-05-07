import { useEffect, useRef, useState } from 'react';
import {
  PINYIN_COLS,
  PINYIN_ROWS,
  TONES,
  applyTone,
  composeSyllable,
} from '../../data/zh/pinyin-chart';
import { useTTS } from '../hooks/useTTS';

/**
 * Interactive Pinyin Chart — layout matches DigMandarin 100%.
 *
 * Structure: 7 row groups × 38 columns.
 *   - Row groups: Ø (zero-initial), b/p/m/f, d/t/n/l, g/k/h, z/c/s, zh/ch/sh/r, j/q/x
 *   - Within a row group, each cell stacks syllables vertically — one line per
 *     initial in the group, with empty lines preserving vertical alignment so
 *     the same initial always shows on the same sub-row across cells.
 *
 * Click a syllable → popover with 4 tone buttons → audio plays from
 * pinyin-chart/{syllable}{tone}.mp3 (downloaded via download_pinyin_chart_audio.py).
 */

// Ultra-compact sizing to guarantee single-viewport fit even on 1366×768 laptops.
//   - sub-row 22px × ~24 sub-rows = ~528px chart body
//   - text 11px is the smallest still-legible size for pinyin
//   - no horizontal scroll — table-fixed forces equal column widths
const SUB_ROW_HEIGHT = 'h-[22px]';

export function TabPinyinChart() {
  const [selected, setSelected] = useState<{
    syllable: string;
    anchorRect: DOMRect;
  } | null>(null);
  const { playPinyinSyllable, isSpeaking } = useTTS();

  // Close popover on Esc
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  const handleSyllableClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    syllable: string,
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setSelected({ syllable, anchorRect: rect });
  };

  return (
    /*
     * Full-bleed break-out: App.tsx wraps all tabs in `max-w-6xl` (~1152px).
     * The chart needs real estate — use w-screen + left-1/2 + -translate-x-1/2
     * to span the entire viewport width regardless of the parent constraint.
     */
    <div className="relative left-1/2 w-screen -translate-x-1/2 space-y-4 px-6 md:px-8">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 rounded-chunk border-2 border-ink-100 bg-cream/50 px-3 py-2 text-xs text-ink-500">
        <span className="font-semibold text-ink-700">💡</span>
        <span>Click âm tiết → hiện 4 thanh điệu → click thanh để nghe</span>
      </div>

      {/* Chart container — fully fits viewport without scroll */}
      <div className="rounded-chunk border-2 border-ink-100 bg-paper">
        <div className="overflow-hidden">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr>
                {/* Corner */}
                <th className="border-b-2 border-r-2 border-ink-200 bg-ink-700 p-0.5 text-[10px] font-semibold text-cream"
                    style={{ width: '48px' }}>
                  ＋
                </th>
                {PINYIN_COLS.map((col, i) => (
                  <th
                    key={`${col.key}-${i}`}
                    className="border-b-2 border-r border-ink-200 bg-ink-700 px-0.5 py-1 font-mono-ipa text-[11px] font-bold text-cream"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PINYIN_ROWS.map((row, rowIdx) => {
                const isZero = row.initials[0] === '';
                return (
                  <tr key={rowIdx}>
                    {/* Row header — stacked initial labels */}
                    <th
                      scope="row"
                      className={[
                        'border-b-2 border-r-2 border-ink-200 p-0',
                        isZero ? 'bg-mint-500/90' : 'bg-ink-700',
                      ].join(' ')}
                    >
                      <div className="flex flex-col">
                        {row.initials.map((init, i) => (
                          <div
                            key={i}
                            className={[
                              'flex items-center justify-center px-1 font-mono-ipa text-[11px] font-bold text-cream',
                              SUB_ROW_HEIGHT,
                            ].join(' ')}
                          >
                            {init || '\u00A0'}
                          </div>
                        ))}
                      </div>
                    </th>

                    {/* Data cells */}
                    {PINYIN_COLS.map((col, colIdx) => {
                      const syllables = row.initials.map((init) =>
                        composeSyllable(init, col.key),
                      );
                      const hasAny = syllables.some((s) => s !== null);

                      if (!hasAny) {
                        // Whole cell empty — gray shim
                        return (
                          <td
                            key={`${col.key}-${colIdx}`}
                            className={[
                              'border-b border-r border-ink-100',
                              isZero ? 'bg-mint-50/30' : 'bg-ink-50/30',
                            ].join(' ')}
                            aria-hidden
                          />
                        );
                      }

                      return (
                        <td
                          key={`${col.key}-${colIdx}`}
                          className={[
                            'border-b border-r border-ink-100 p-0',
                            isZero && 'bg-mint-50/50',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          <div className="flex flex-col">
                            {syllables.map((syl, i) => {
                              if (!syl) {
                                return (
                                  <div
                                    key={i}
                                    className={SUB_ROW_HEIGHT}
                                    aria-hidden
                                  />
                                );
                              }
                              const isActive = selected?.syllable === syl;
                              return (
                                <button
                                  key={i}
                                  onClick={(e) => handleSyllableClick(e, syl)}
                                  className={[
                                    'flex items-center justify-center px-0.5 font-mono-ipa text-[11px] font-medium transition-colors',
                                    SUB_ROW_HEIGHT,
                                    isActive
                                      ? 'bg-coral-500 text-white'
                                      : 'text-ink-700 hover:bg-coral-50 hover:text-coral-700',
                                  ].join(' ')}
                                >
                                  {syl}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Coverage hint */}
      <p className="text-center text-xs text-ink-400">
        Layout chuẩn theo <span className="font-semibold">DigMandarin Pinyin Chart</span> ·
        Audio bản ngữ từ davinfifield (public domain)
      </p>

      {selected && (
        <TonePopover
          syllable={selected.syllable}
          anchorRect={selected.anchorRect}
          onClose={() => setSelected(null)}
          onPlay={(tone) => playPinyinSyllable(selected.syllable, tone)}
          isSpeaking={isSpeaking}
        />
      )}
    </div>
  );
}

// —————————————————————————————————————————————————————————
// Tone popover — anchored to the clicked syllable
// —————————————————————————————————————————————————————————

function TonePopover({
  syllable,
  anchorRect,
  onClose,
  onPlay,
  isSpeaking,
}: {
  syllable: string;
  anchorRect: DOMRect;
  onClose: () => void;
  onPlay: (tone: 1 | 2 | 3 | 4) => void;
  isSpeaking: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // NO auto-play. User must click a tone button to hear the audio. This is the
  // standard interaction pattern for pinyin charts (DigMandarin, Yabla, etc.)
  // and avoids the jarring "you clicked a cell and it talked at you" UX.

  // Close on outside click (deferred by one tick so the click that OPENED us
  // doesn't immediately CLOSE us via bubbling)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const t = setTimeout(() => document.addEventListener('mousedown', onClick), 10);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', onClick);
    };
  }, [onClose]);

  // Position: centered horizontally on anchor, prefer above if space
  const POPOVER_WIDTH = 320;
  const POPOVER_HEIGHT = 180;
  const MARGIN = 12;
  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800;

  const centerX = anchorRect.left + anchorRect.width / 2;
  let left = centerX - POPOVER_WIDTH / 2;
  left = Math.max(MARGIN, Math.min(left, viewportW - POPOVER_WIDTH - MARGIN));

  const preferAbove = anchorRect.top > POPOVER_HEIGHT + MARGIN * 2;
  const top = preferAbove
    ? anchorRect.top - POPOVER_HEIGHT - MARGIN
    : Math.min(anchorRect.bottom + MARGIN, viewportH - POPOVER_HEIGHT - MARGIN);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={`Các thanh điệu của âm tiết ${syllable}`}
      className="fixed z-50 rounded-chunk border-2 border-ink-700 bg-paper shadow-chunky-ink"
      style={{ left: `${left}px`, top: `${top}px`, width: `${POPOVER_WIDTH}px` }}
    >
      <div className="flex items-center justify-between border-b border-ink-100 px-4 py-2">
        <span className="font-mono-ipa text-sm font-semibold text-ink-600">
          {syllable}
        </span>
        <button
          onClick={onClose}
          aria-label="Đóng"
          className="flex h-6 w-6 items-center justify-center rounded-md text-ink-400 hover:bg-ink-100 hover:text-ink-700"
        >
          ✕
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2 p-3">
        {TONES.map((t) => {
          const toneNum = t.num as 1 | 2 | 3 | 4;
          const marked = applyTone(syllable, toneNum);
          return (
            <button
              key={t.num}
              onClick={() => onPlay(toneNum)}
              title={t.label}
              className={[
                'flex flex-col items-center gap-1 rounded-chunk border-2 border-ink-200 bg-white p-3 transition-all hover:border-coral-500 hover:bg-coral-50',
                isSpeaking && 'is-speaking',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="text-xs font-semibold uppercase text-ink-400">
                T{t.num}
              </span>
              <span className="font-mono-ipa text-xl font-bold text-ink-700">
                {marked}
              </span>
            </button>
          );
        })}
      </div>
      <div className="border-t border-ink-100 px-4 py-2 text-center text-xs text-ink-400">
        Click vào 1 thanh điệu để nghe · Esc để đóng
      </div>
    </div>
  );
}
