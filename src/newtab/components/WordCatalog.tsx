import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppStore } from '../../stores/useAppStore';
import { tiersByLang, type WordTier } from '../../data';
import { db } from '../../services/db';
import type { Word, WordProgress } from '../../types';

/**
 * Word catalog — browseable index of every vocabulary word, grouped by HSK tier.
 *
 * UX rules per Jason's request:
 *   - All tiers collapsed by default (Jason wants to opt in to viewing each)
 *   - Compact card grid, ~10 cards per row on wide screens
 *   - Pagination per tier (10 / 20 / 50 per page)
 *
 * Status comes from FSRS state stored in `wordProgress`:
 *   - new       → no progress row
 *   - learning  → state 1 or 3
 *   - mastered  → state 2 (in long-term review schedule)
 *
 * Click any card → jump to Flashcard for that word (uses navigateToWord).
 */

type StatusFilter = 'all' | 'new' | 'learning' | 'mastered';
type PageSize = 10 | 20 | 50;

interface CardData extends Word {
  status: 'new' | 'learning' | 'mastered';
  reps: number;
}

export function WordCatalog() {
  const targetLang = useAppStore((s) => s.targetLang);
  const navigateToWordFromCatalog = useAppStore((s) => s.navigateToWordFromCatalog);

  const [filter, setFilter] = useState<StatusFilter>('all');
  // No tier expanded by default — Jason wants to opt in to each.
  const [expandedTiers, setExpandedTiers] = useState<Set<string>>(new Set());

  const progressRows = useLiveQuery(
    () => db.wordProgress.where('lang').equals(targetLang).toArray(),
    [targetLang],
    [] as WordProgress[],
  );

  const progressByWord = useMemo(() => {
    const m = new Map<string, WordProgress>();
    for (const p of progressRows) m.set(p.wordId, p);
    return m;
  }, [progressRows]);

  const tiers = tiersByLang[targetLang];

  const tierCards = useMemo(() => {
    return tiers.map((tier) => {
      const cards: CardData[] = tier.words.map((w) => {
        const p = progressByWord.get(w.id);
        let status: CardData['status'];
        if (!p) status = 'new';
        else if (p.state === 2) status = 'mastered';
        else status = 'learning';
        return { ...w, status, reps: p?.reps ?? 0 };
      });
      return { tier, cards };
    });
  }, [tiers, progressByWord]);

  const tierStats = useMemo(() => {
    const stats = new Map<
      string,
      { total: number; new: number; learning: number; mastered: number }
    >();
    for (const { tier, cards } of tierCards) {
      stats.set(tier.id, {
        total: cards.length,
        new: cards.filter((c) => c.status === 'new').length,
        learning: cards.filter((c) => c.status === 'learning').length,
        mastered: cards.filter((c) => c.status === 'mastered').length,
      });
    }
    return stats;
  }, [tierCards]);

  const toggleTier = (id: string) => {
    setExpandedTiers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filterCards = (cards: CardData[]): CardData[] => {
    if (filter === 'all') return cards;
    return cards.filter((c) => c.status === filter);
  };

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-700">📚 Từ vựng</h2>
          <p className="text-sm text-ink-500">
            Toàn bộ từ vựng theo level HSK — click vào thẻ để mở Flashcard.
          </p>
        </div>
      </div>

      <FilterPills value={filter} onChange={setFilter} />

      <div className="space-y-3">
        {tierCards.map(({ tier, cards }) => {
          const stats = tierStats.get(tier.id)!;
          const expanded = expandedTiers.has(tier.id);
          const filteredCards = filterCards(cards);

          return (
            <TierSection
              key={tier.id}
              tier={tier}
              stats={stats}
              expanded={expanded}
              onToggle={() => toggleTier(tier.id)}
              cards={filteredCards}
              filterActive={filter !== 'all'}
              // Pass a closure that captures this tier's id so the back
              // button knows which section to expand on return.
              onCardClick={(wordId) => navigateToWordFromCatalog(tier.id, wordId)}
            />
          );
        })}
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Filter pills
// ────────────────────────────────────────────────────────────────────────────

const FILTER_LABELS: Record<StatusFilter, { label: string; emoji: string }> = {
  all: { label: 'Tất cả', emoji: '🌐' },
  new: { label: 'Chưa học', emoji: '⚪' },
  learning: { label: 'Đang học', emoji: '📗' },
  mastered: { label: 'Đã thuộc', emoji: '📕' },
};

function FilterPills({
  value,
  onChange,
}: {
  value: StatusFilter;
  onChange: (v: StatusFilter) => void;
}) {
  const options: StatusFilter[] = ['all', 'new', 'learning', 'mastered'];
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const meta = FILTER_LABELS[opt];
        const active = value === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={[
              'flex items-center gap-2 rounded-pill border-2 px-4 py-1.5 font-display text-sm font-semibold transition-all',
              active
                ? 'border-ink-700 bg-ink-700 text-cream shadow-chunky-soft'
                : 'border-ink-200 bg-paper text-ink-500 hover:border-ink-400',
            ].join(' ')}
          >
            <span>{meta.emoji}</span>
            <span>{meta.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Tier section (collapsible, with pagination)
// ────────────────────────────────────────────────────────────────────────────

function TierSection({
  tier,
  stats,
  expanded,
  onToggle,
  cards,
  filterActive,
  onCardClick,
}: {
  tier: WordTier;
  stats: { total: number; new: number; learning: number; mastered: number };
  expanded: boolean;
  onToggle: () => void;
  cards: CardData[];
  filterActive: boolean;
  onCardClick: (id: string) => void;
}) {
  // Pagination state — local to tier so each tier remembers independently
  const [pageSize, setPageSize] = useState<PageSize>(50);
  const [page, setPage] = useState(0);

  // When the filtered cards array changes (e.g. user rates a card and it
  // moves out of the current filter), clamp the page to a valid range
  // instead of resetting to 0. This way the user keeps their browse
  // position even after grading cards mid-page.
  // Edge case: if all cards on later pages are gone, snap to the last
  // available page rather than rendering an empty viewport.
  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(cards.length / pageSize) - 1);
    setPage((p) => Math.min(p, maxPage));
  }, [cards.length, pageSize]);

  const masteryPct = Math.round((stats.mastered / Math.max(1, stats.total)) * 100);

  const totalPages = Math.max(1, Math.ceil(cards.length / pageSize));
  const start = page * pageSize;
  const end = Math.min(start + pageSize, cards.length);
  const pageCards = cards.slice(start, end);

  return (
    <div className="card-soft overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-paper"
      >
        <div className="flex items-center gap-3">
          <span
            className={[
              'inline-block text-base text-ink-400 transition-transform',
              expanded ? 'rotate-90' : '',
            ].join(' ')}
          >
            ▶
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg font-bold text-ink-700">{tier.name}</h3>
              <span className="text-xs font-semibold text-ink-400">{stats.total} từ</span>
            </div>
            <p className="text-xs text-ink-500">{tier.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 text-xs sm:flex">
            <span className="text-ink-400">
              <span className="font-bold text-ink-600">{stats.new}</span> mới
            </span>
            <span className="text-ink-300">·</span>
            <span className="text-ink-400">
              <span className="font-bold text-mint-700">{stats.learning}</span> đang học
            </span>
            <span className="text-ink-300">·</span>
            <span className="text-ink-400">
              <span className="font-bold text-coral-600">{stats.mastered}</span> đã thuộc
            </span>
          </div>
          <div className="rounded-pill border-2 border-ink-700 bg-paper px-3 py-1 font-display text-xs font-bold text-ink-700">
            {masteryPct}%
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t-2 border-ink-100 bg-cream p-4">
          {cards.length === 0 ? (
            <div className="py-8 text-center text-sm italic text-ink-400">
              {filterActive
                ? 'Không có từ nào phù hợp với bộ lọc.'
                : 'Tier này chưa có từ nào.'}
            </div>
          ) : (
            <>
              {/* Top control bar — pagination + page-size picker.
                  Visible above the grid so it's always reachable without
                  scrolling, even with 500+ cards in the tier. */}
              <PaginationBar
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                totalCount={cards.length}
                showingFrom={start + 1}
                showingTo={end}
              />

              {/* The grid itself — see CSS notes inside CompactCard.
                  10 cols on lg+ screens, scales down to 2 cols on mobile. */}
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
                {pageCards.map((card) => (
                  <CompactCard key={card.id} card={card} onClick={() => onCardClick(card.id)} />
                ))}
              </div>

              {/* Bottom pagination — duplicate of top so user doesn't have to
                  scroll back up after browsing a long page. */}
              {totalPages > 1 && (
                <div className="mt-4">
                  <PaginationBar
                    page={page}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                    totalCount={cards.length}
                    showingFrom={start + 1}
                    showingTo={end}
                    compact
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Compact card — small enough to fit 10 across on desktop
// ────────────────────────────────────────────────────────────────────────────

function CompactCard({ card, onClick }: { card: CardData; onClick: () => void }) {
  const statusMeta = STATUS_META[card.status];
  return (
    <button
      onClick={onClick}
      title={`${card.term} (${card.phonetic}) — ${card.translation}\n${
        card.example ? `\n${card.example}\n${card.exampleTranslation ?? ''}` : ''
      }${card.reps > 0 ? `\n\nĐã ôn ${card.reps} lần` : ''}\n\nClick để mở Flashcard`}
      className={[
        'group relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-chunk border-2 p-2 text-center transition-all hover:shadow-chunky-soft',
        // Color border by status — gives at-a-glance grid-level feedback
        // (you can scan a tier and see which sections are mostly mastered).
        card.status === 'mastered'
          ? 'border-coral-300 bg-coral-50 hover:border-coral-500'
          : card.status === 'learning'
            ? 'border-mint-300 bg-mint-50 hover:border-mint-500'
            : 'border-ink-100 bg-paper hover:border-ink-400',
      ].join(' ')}
    >
      {/* Hanzi takes the lion's share of the card — that's what the user
          is actually trying to recognize. Pinyin and gloss are smaller hints. */}
      <div className="font-display text-zh text-xl font-bold leading-none text-ink-700">
        {card.term}
      </div>
      <div className="text-[10px] font-semibold leading-tight text-ink-400">{card.phonetic}</div>
      <div className="line-clamp-1 text-[10px] leading-tight text-ink-500">
        {card.translation}
      </div>

      {/* Status indicator — tiny dot in the corner, not a full badge,
          to keep the card uncluttered. Color matches the border. */}
      <div className="absolute right-1 top-1">
        <span
          aria-label={statusMeta.tooltip}
          className={[
            'block h-1.5 w-1.5 rounded-full',
            card.status === 'mastered'
              ? 'bg-coral-500'
              : card.status === 'learning'
                ? 'bg-mint-500'
                : 'bg-ink-200',
          ].join(' ')}
        />
      </div>
    </button>
  );
}

const STATUS_META: Record<CardData['status'], { tooltip: string }> = {
  new: { tooltip: 'Chưa học' },
  learning: { tooltip: 'Đang học' },
  mastered: { tooltip: 'Đã thuộc' },
};

// ────────────────────────────────────────────────────────────────────────────
// Pagination bar
// ────────────────────────────────────────────────────────────────────────────

function PaginationBar({
  page,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  totalCount,
  showingFrom,
  showingTo,
  compact,
}: {
  page: number;
  totalPages: number;
  pageSize: PageSize;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: PageSize) => void;
  totalCount: number;
  showingFrom: number;
  showingTo: number;
  compact?: boolean;
}) {
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      {/* Left — count summary; hidden in the bottom (compact) bar to
          de-duplicate info. */}
      {!compact && (
        <div className="text-xs text-ink-500">
          Hiển thị <span className="font-semibold text-ink-700">{showingFrom}–{showingTo}</span> trong{' '}
          <span className="font-semibold text-ink-700">{totalCount}</span> từ
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Page size selector — only on top bar */}
        {!compact && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value) as PageSize)}
            className="rounded-pill border-2 border-ink-200 bg-paper px-3 py-1 text-xs font-semibold text-ink-600 outline-none transition-colors hover:border-ink-400"
          >
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
            <option value={50}>50 / trang</option>
          </select>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(0)}
            disabled={!canPrev}
            aria-label="Trang đầu"
            className="rounded-pill border-2 border-ink-200 bg-paper px-2 py-1 text-xs font-semibold text-ink-600 transition-all hover:border-ink-400 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-ink-200"
          >
            «
          </button>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={!canPrev}
            aria-label="Trang trước"
            className="rounded-pill border-2 border-ink-200 bg-paper px-2 py-1 text-xs font-semibold text-ink-600 transition-all hover:border-ink-400 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-ink-200"
          >
            ‹
          </button>
          <span className="px-2 text-xs font-semibold text-ink-600">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={!canNext}
            aria-label="Trang sau"
            className="rounded-pill border-2 border-ink-200 bg-paper px-2 py-1 text-xs font-semibold text-ink-600 transition-all hover:border-ink-400 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-ink-200"
          >
            ›
          </button>
          <button
            onClick={() => onPageChange(totalPages - 1)}
            disabled={!canNext}
            aria-label="Trang cuối"
            className="rounded-pill border-2 border-ink-200 bg-paper px-2 py-1 text-xs font-semibold text-ink-600 transition-all hover:border-ink-400 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-ink-200"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}
