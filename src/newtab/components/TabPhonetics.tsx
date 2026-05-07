import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { phoneticGroups } from '../../data';
import type { Phoneme } from '../../types';
import { useTTS } from '../hooks/useTTS';
import { TabPinyinChart } from './TabPinyinChart';

/**
 * Special group id for the Pinyin Chart view. Not a real phoneme group — it
 * triggers a completely different renderer (full-chart grid instead of tile
 * grid + detail panel). ZH only.
 */
const PINYIN_CHART_ID = '__pinyin_chart__';

export function TabPhonetics() {
  const targetLang = useAppStore((s) => s.targetLang);
  const activeTab = useAppStore((s) => s.activeTab);
  const groups = phoneticGroups[targetLang];
  const [activeGroup, setActiveGroup] = useState(groups[0]?.id);
  const [selected, setSelected] = useState<Phoneme | null>(null);
  const { playPhoneme, playPhonemeExample, playPhonemeExampleSlow, isSpeaking, supported } = useTTS();

  const isChartView = activeGroup === PINYIN_CHART_ID;
  const currentGroup = groups.find((g) => g.id === activeGroup) ?? groups[0];

  // Refs to each tile button — needed to read live grid layout for arrow nav
  // (we ask the DOM what column count is currently active rather than
  // hard-coding Tailwind breakpoints, so it stays correct on resize).
  const gridRef = useRef<HTMLDivElement | null>(null);
  const tileRefs = useRef<Array<HTMLButtonElement | null>>([]);

  /**
   * Clicking a phoneme tile selects it AND plays its audio — no need to
   * move to the detail panel and press "Nghe". Re-clicking the same tile
   * replays the audio (useful for drilling).
   */
  const handleTileClick = (p: Phoneme) => {
    setSelected(p);
    playPhoneme(p, targetLang);
  };

  // ─────────────────────────────────────────────
  // Keyboard navigation: arrow keys move between tiles
  // ─────────────────────────────────────────────
  // Arrow up/down/left/right walks the grid; selected tile auto-plays.
  // Scoped to this tab + non-chart view + non-input contexts so it doesn't
  // conflict with TabFlashcards' Space shortcut or the pinyin-chart view.
  useEffect(() => {
    if (activeTab !== 'phonetics') return;
    if (isChartView) return;

    const handler = (e: KeyboardEvent) => {
      // Skip when typing in inputs
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
      }
      if (e.repeat) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;

      const phonemes = currentGroup.phonemes;
      if (phonemes.length === 0) return;

      // Determine column count by reading the grid template at runtime.
      // gridTemplateColumns like "repeat(4, ...)" or "120px 120px 120px 120px"
      // → split on whitespace and count tracks. Fallback to 4 (md default).
      let cols = 4;
      if (gridRef.current) {
        const computed = window.getComputedStyle(gridRef.current);
        const tracks = computed.gridTemplateColumns.split(/\s+/).filter(Boolean);
        if (tracks.length >= 1) cols = tracks.length;
      }

      const currentIdx = selected
        ? phonemes.findIndex((p) => p.id === selected.id)
        : -1;

      // No selection yet → arrow key picks first tile
      let nextIdx: number;
      if (currentIdx === -1) {
        nextIdx = 0;
      } else {
        switch (e.key) {
          case 'ArrowRight':
            nextIdx = Math.min(currentIdx + 1, phonemes.length - 1);
            break;
          case 'ArrowLeft':
            nextIdx = Math.max(currentIdx - 1, 0);
            break;
          case 'ArrowDown':
            nextIdx = Math.min(currentIdx + cols, phonemes.length - 1);
            break;
          case 'ArrowUp':
            nextIdx = Math.max(currentIdx - cols, 0);
            break;
          default:
            return;
        }
      }

      if (nextIdx !== currentIdx) {
        e.preventDefault();
        const next = phonemes[nextIdx];
        setSelected(next);
        playPhoneme(next, targetLang);
        // Bring the newly-focused tile into view (small grids fit anyway,
        // but Âm vận has 38 tiles which scroll on smaller screens).
        tileRefs.current[nextIdx]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTab, isChartView, currentGroup, selected, targetLang, playPhoneme]);

  return (
    <div className="space-y-6">
      {/* Group switcher — includes the Pinyin Chart button for ZH */}
      <div className="flex flex-wrap items-center gap-3">
        {groups.map((g) => {
          const active = g.id === activeGroup;
          return (
            <button
              key={g.id}
              onClick={() => {
                setActiveGroup(g.id);
                setSelected(null);
              }}
              className={[
                'rounded-pill border-2 px-4 py-2 font-display text-sm font-semibold transition-all',
                active
                  ? 'border-ink-700 bg-ink-700 text-cream shadow-chunky-soft'
                  : 'border-ink-200 bg-paper text-ink-500 hover:border-ink-400',
              ].join(' ')}
            >
              {g.label}{' '}
              <span
                className={[
                  'ml-1 rounded-full px-1.5 text-xs',
                  active ? 'bg-cream/20' : 'bg-ink-100 text-ink-400',
                ].join(' ')}
              >
                {g.phonemes.length}
              </span>
            </button>
          );
        })}

        {/* Pinyin Chart button — only for ZH. Sits after Thanh điệu. */}
        {targetLang === 'zh' && (
          <button
            onClick={() => {
              setActiveGroup(PINYIN_CHART_ID);
              setSelected(null);
            }}
            className={[
              'rounded-pill border-2 px-4 py-2 font-display text-sm font-semibold transition-all',
              isChartView
                ? 'border-ink-700 bg-ink-700 text-cream shadow-chunky-soft'
                : 'border-coral-200 bg-coral-50 text-coral-700 hover:border-coral-400',
            ].join(' ')}
          >
            📊 Pinyin Chart
          </button>
        )}
      </div>

      {/* Chart view — full width, no detail panel */}
      {isChartView ? (
        <TabPinyinChart />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          {/* Phoneme grid — `content-start` keeps rows packed from the top so
              when the right-side detail panel is taller than the tile grid
              (e.g. phoneme "b" has a LỖI THƯỜNG GẶP section, phoneme "m"
              doesn't) the tiles don't stretch to fill the extra height with
              awkward gaps between rows. */}
          <div
            ref={gridRef}
            className="grid auto-rows-max grid-cols-2 content-start gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5"
          >
            {currentGroup.phonemes.map((p, idx) => (
              <PhonemeTile
                key={p.id}
                phoneme={p}
                selected={selected?.id === p.id}
                isSpeaking={isSpeaking && selected?.id === p.id}
                onSelect={() => handleTileClick(p)}
                tileRef={(el) => {
                  tileRefs.current[idx] = el;
                }}
              />
            ))}
          </div>

          {/* Detail panel */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            {selected ? (
              <PhonemeDetail
                phoneme={selected}
                onPlay={() => playPhonemeExample(selected, targetLang)}
                onPlaySlow={() => playPhonemeExampleSlow(selected, targetLang)}
                isSpeaking={isSpeaking}
                supported={supported}
              />
            ) : (
              <div className="card-soft flex h-full min-h-[280px] flex-col items-center justify-center p-8 text-center">
                <div className="text-5xl">👆</div>
                <p className="mt-4 font-display text-lg font-bold text-ink-700">
                  Chọn một âm để xem chi tiết
                </p>
                <p className="mt-2 max-w-xs text-sm text-ink-500">
                  Mỗi âm có hướng dẫn phát âm, so sánh với tiếng Việt, và ví dụ nghe được.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PhonemeTile({
  phoneme,
  selected,
  isSpeaking,
  onSelect,
  tileRef,
}: {
  phoneme: Phoneme;
  selected: boolean;
  isSpeaking: boolean;
  onSelect: () => void;
  tileRef?: (el: HTMLButtonElement | null) => void;
}) {
  const isTone = phoneme.category === 'tone';

  // Long symbols like "-i (zh/ch/sh/r)" overflow the tile at the default
  // text-3xl. Pick a size based on character length so the longest still
  // fits horizontally inside the 4xN grid:
  //   ≤3 chars  → text-3xl  (b, ch, ang, ...)
  //   ≤6 chars  → text-xl   (-i, üan, üe, üe, ...)
  //   else      → text-sm   ("-i (zh/ch/sh/r)" et al.)
  const symbolLen = phoneme.symbol.length;
  const symbolSize =
    symbolLen <= 3 ? 'text-3xl' : symbolLen <= 6 ? 'text-xl' : 'text-sm';

  return (
    <button
      ref={tileRef}
      onClick={onSelect}
      className={[
        'group flex h-28 flex-col items-center justify-center gap-1 overflow-hidden rounded-chunk border-2 px-2 transition-colors duration-150',
        selected
          ? 'border-coral-500 bg-coral-50 shadow-chunky-soft'
          : 'border-ink-100 bg-paper hover:border-ink-300',
      ].join(' ')}
    >
      <div
        className={[
          'w-full text-center font-display font-bold leading-tight',
          symbolSize,
          isTone ? 'text-coral-500' : 'text-ink-700',
          // Speaker pulse only runs while audio plays for this tile.
          isSpeaking && 'is-speaking',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {phoneme.symbol}
      </div>
      <div className="mt-1 truncate text-xs font-semibold text-ink-400">
        {phoneme.exampleWord}
      </div>
    </button>
  );
}

function PhonemeDetail({
  phoneme,
  onPlay,
  onPlaySlow,
  isSpeaking,
  supported,
}: {
  phoneme: Phoneme;
  onPlay: () => void;
  onPlaySlow: () => void;
  isSpeaking: boolean;
  supported: boolean;
}) {
  const targetLang = useAppStore((s) => s.targetLang);

  return (
    <div className="card-chunky overflow-hidden">
      {/* Symbol header */}
      <div className="bg-ink-700 px-6 py-8 text-center">
        <div className="text-xs font-semibold uppercase tracking-widest text-cream/60">
          {phoneme.categoryLabel}
        </div>
        <div className="mt-2 font-display text-7xl font-bold leading-none text-cream">
          {phoneme.symbol}
        </div>
      </div>

      <div className="space-y-4 p-6">
        {/* Vietnamese guide */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-400">
            Cách phát âm
          </div>
          <p className="mt-1 text-sm leading-relaxed text-ink-600">
            {phoneme.vietnameseGuide}
          </p>
        </div>

        {/* Vietnamese comparison */}
        <div className="rounded-chunk border-2 border-mint-200 bg-mint-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-mint-700">
            So với tiếng Việt
          </div>
          <p className="mt-1 text-sm font-medium leading-relaxed text-ink-700">
            {phoneme.vietnameseComparison}
          </p>
        </div>

        {/* Example word with TTS */}
        <div className="rounded-chunk border-2 border-coral-200 bg-coral-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-coral-700">
            Ví dụ
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <span
              className={[
                'font-display text-4xl font-bold text-ink-700',
                targetLang === 'zh' && 'text-zh',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {phoneme.exampleWord}
            </span>
            <span className="font-mono-ipa text-lg text-coral-700">
              {phoneme.examplePhonetic}
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-ink-500">
            = {phoneme.exampleMeaning}
          </p>

          {supported && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={onPlay}
                className={[
                  'flex items-center gap-2 rounded-pill border-2 border-coral-500 bg-white px-4 py-2 font-display text-sm font-semibold text-coral-700 transition-colors hover:bg-coral-500 hover:text-white',
                  isSpeaking && 'is-speaking',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span>🔊</span>
                <span>Nghe ví dụ</span>
              </button>
              <button
                onClick={onPlaySlow}
                className="flex items-center gap-2 rounded-pill border-2 border-ink-200 bg-white px-4 py-2 font-display text-sm font-semibold text-ink-600 transition-colors hover:border-ink-400"
              >
                <span>🐢</span>
                <span>Chậm</span>
              </button>
            </div>
          )}
        </div>

        {/* Common mistake */}
        {phoneme.commonMistake && (
          <div className="rounded-chunk border-2 border-sun-300 bg-sun-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-sun-500">
              ⚠️ Lỗi thường gặp
            </div>
            <p className="mt-1 text-sm leading-relaxed text-ink-600">
              {phoneme.commonMistake}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
