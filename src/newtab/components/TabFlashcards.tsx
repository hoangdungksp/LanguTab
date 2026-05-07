import { useEffect, useState, useCallback } from 'react';
import { Rating, type Grade } from 'ts-fsrs';
import { useAppStore } from '../../stores/useAppStore';
import { wordsByLang, langLabels } from '../../data';
import { getDueQueue, previewRatings, rateWord } from '../../services/srs';
import { useTTS } from '../hooks/useTTS';
import type { AudioScope, AudioSpeed } from '../../services/audioService';
import type { Word } from '../../types';
import { Flashcard } from './Flashcard';
import { hasNativeWordAudio, hasNativeSentenceAudio, useAnkiData } from '../hooks/useAnkiData';
import { LayoutEditor } from './LayoutEditor';

interface IntervalPreview {
  again: string;
  hard: string;
  good: string;
  easy: string;
}

function formatInterval(d: Date): string {
  const now = Date.now();
  const diffMs = d.getTime() - now;
  const min = diffMs / 1000 / 60;
  if (min < 60) return `${Math.max(1, Math.round(min))} phút`;
  const hrs = min / 60;
  if (hrs < 24) return `${Math.round(hrs)} giờ`;
  const days = hrs / 24;
  if (days < 30) return `${Math.round(days)} ngày`;
  const months = days / 30;
  if (months < 12) return `${Math.round(months)} tháng`;
  return `${Math.round(months / 12)} năm`;
}

export function TabFlashcards() {
  const {
    targetLang,
    bumpReviewCount,
    cardLayout,
    setCardLayout,
    activeTab,
    storyReturnContext,
    clearStoryReturnContext,
    catalogReturnContext,
    clearCatalogReturnContext,
    setTab,
    openStory,
  } = useAppStore();
  const words = wordsByLang[targetLang];
  const lbl = langLabels[targetLang];

  const [queue, setQueue] = useState<Word[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [preview, setPreview] = useState<IntervalPreview | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);

  // Lifted here so keyboard shortcuts + click buttons share the same isSpeaking
  // pulse state — otherwise Space-triggered audio wouldn't animate the button.
  const { playWord, isSpeaking, supported } = useTTS();

  const current = queue[0];

  // Fetch Anki HSK+ deck supplemental data for the current word. Returns null
  // until the JSON chunk loads (one-time fetch on first card with Anki data),
  // then null when the word isn't in the deck. Either way the Flashcard
  // gracefully renders without the bonus block.
  const ankiData = useAnkiData(current?.id);

  const loadQueue = useCallback(async () => {
    setIsLoading(true);
    const q = await getDueQueue(targetLang, words);
    setQueue(q);
    setFlipped(false);
    setIsLoading(false);
  }, [targetLang, words]);

  // Load queue when language changes
  useEffect(() => {
    loadQueue();
    setSessionCount(0);
  }, [loadQueue]);

  /**
   * "Jump-to-word" behaviour for clicks coming from the Stories tab.
   *
   * When the user clicked an HSK1 word inside a story, the store sets
   * `storyReturnContext` and switches activeTab to 'flashcards'. We watch
   * for that state and override the queue to put that specific word at the
   * front. The actual SRS queue is preserved for after the user dismisses
   * the back-to-story button (or rates the card).
   *
   * Intentional design choice: we DON'T mutate the SRS data when previewing
   * a card from a story. The card is just shown; rating it still works
   * normally and updates SRS. This means a story-clicked card doesn't get
   * "scheduled" just from clicking; it has to be rated to count.
   */
  useEffect(() => {
    if (!storyReturnContext) return;
    // Race-condition guard: the initial loadQueue() runs as an async effect
    // and sets isLoading=false when it completes. If a navigateToWord click
    // arrives during that window, our setQueue update would be overwritten
    // when loadQueue's setQueue resolves a moment later.
    // Wait for the loading flag to clear before applying the jump.
    if (isLoading) return;

    const w = words.find((x) => x.id === storyReturnContext.wordId);
    if (!w) return;

    // Put the requested word at the front. Keep the rest of the queue intact
    // so when the user navigates back to story and away, normal SRS resumes.
    setQueue((prev) => {
      const filtered = prev.filter((x) => x.id !== w.id);
      return [w, ...filtered];
    });
    setFlipped(false);
  }, [storyReturnContext, words, isLoading]);

  // Update preview intervals when flipped
  useEffect(() => {
    if (!current || !flipped) {
      setPreview(null);
      return;
    }
    previewRatings(current).then((r) => {
      setPreview({
        again: formatInterval(r.again.card.due),
        hard: formatInterval(r.hard.card.due),
        good: formatInterval(r.good.card.due),
        easy: formatInterval(r.easy.card.due),
      });
    });
  }, [current, flipped]);

  const handleRate = useCallback(
    async (rating: Grade) => {
      if (!current) return;
      await rateWord(current, rating);
      await bumpReviewCount();
      setSessionCount((c) => c + 1);

      // Move to next card
      setFlipped(false);
      setQueue((q) => q.slice(1));
    },
    [current, bumpReviewCount],
  );

  const handlePlay = useCallback(
    (
      scope: AudioScope,
      speed: AudioSpeed,
      voice: 'native' | 'male' | 'female' = 'male',
      customText?: string,
    ) => {
      if (!current) return;
      playWord(current, scope, speed, voice, customText);
    },
    [current, playWord],
  );

  // —————————————————————————————————————————————
  // Keyboard shortcuts
  //   Space        → play word term (normal)
  //   Shift+Space  → play word term (slow)
  //   Enter        → flip card
  //   1 / 2 / 3 / 4 → rate Again / Hard / Good / Easy (only when flipped)
  //
  // Disabled while the LayoutEditor modal is open so the user can click its
  // buttons / drag handles without triggering card actions in the background.
  // —————————————————————————————————————————————
  useEffect(() => {
    if (editorOpen) return; // Modal owns keyboard focus
    if (activeTab !== 'flashcards') return; // Bug fix: tabs all stay mounted
    // (display:none in App.tsx) — without this guard, Space pressed while
    // viewing Phonetics or Dashboard still played the current flashcard,
    // surfacing as the mysterious "always reads zì" symptom (zì is the
    // example word for the /z/ initial AND the topmost flashcard for some
    // queues, depending on review schedule).

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip when user is typing in a form field (search, future add-card modal, etc.)
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
      }

      // Ignore auto-repeat when a key is held down
      if (e.repeat) return;

      // Ignore when modifier keys other than Shift are pressed — leaves
      // browser shortcuts (Ctrl+Tab, Cmd+R, etc.) alone.
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // No current card → no shortcuts apply
      if (!current) return;

      // Space / Shift+Space → play word term audio
      if (e.code === 'Space') {
        e.preventDefault();
        handlePlay('word', e.shiftKey ? 'slow' : 'normal');
        return;
      }

      // Enter → flip card (ignore shift to avoid conflicts with form enter)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        setFlipped((f) => !f);
        return;
      }

      // 1/2/3/4 → rate. Only valid when card is flipped (answer visible).
      if (flipped && !e.shiftKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            handleRate(Rating.Again);
            return;
          case '2':
            e.preventDefault();
            handleRate(Rating.Hard);
            return;
          case '3':
            e.preventDefault();
            handleRate(Rating.Good);
            return;
          case '4':
            e.preventDefault();
            handleRate(Rating.Easy);
            return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [current, flipped, handleRate, handlePlay, editorOpen, activeTab]);

  // Empty state (no more cards)
  if (!isLoading && queue.length === 0) {
    return (
      <div className="card-chunky relative overflow-hidden p-12 text-center">
        <div className="pointer-events-none absolute -right-20 top-0 h-60 w-60 rounded-full bg-mint-100 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-12 h-60 w-60 rounded-full bg-sun-100 blur-3xl" />
        <div className="relative">
          <div className="text-7xl animate-bounce-in">🎉</div>
          <h2 className="mt-6 font-display text-3xl font-bold text-ink-700">
            {sessionCount > 0 ? 'Hết thẻ rồi — tuyệt vời!' : 'Chưa có thẻ nào đến hạn'}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-base text-ink-500">
            {sessionCount > 0
              ? `Bạn vừa ôn ${sessionCount} thẻ ${lbl.name}. Quay lại mai để ôn tiếp nhé!`
              : `Tất cả thẻ ${lbl.name} đã được ôn. Hẹn gặp lại khi có thẻ mới đến hạn.`}
          </p>
          <button onClick={loadQueue} className="btn-mint mt-6">
            <span>🔄</span>
            <span>Làm mới</span>
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !current) {
    return (
      <div className="card-soft flex h-64 items-center justify-center">
        <div className="font-display text-ink-400">Đang tải...</div>
      </div>
    );
  }

  const totalProgress = Math.round(((sessionCount) / (sessionCount + queue.length)) * 100) || 0;

  return (
    <div className="space-y-6">
      {/* "Back to story" breadcrumb — shown when user clicked through from
          Stories tab. Returns to the same story they came from. We clear
          the context first so the next render of TabFlashcards doesn't try
          to re-jump. */}
      {/* "Back to story" breadcrumb — shown only when the user clicked through
          from a real Story (storyId !== ''). Translate also navigates to a word
          but doesn't set a story id, so this button stays hidden in that case. */}
      {storyReturnContext && storyReturnContext.storyId && (
        <button
          onClick={() => {
            const sid = storyReturnContext.storyId;
            clearStoryReturnContext();
            openStory(sid);
          }}
          className="group flex items-center gap-2 rounded-pill border-2 border-coral-300 bg-coral-50 px-4 py-2 font-display text-sm font-semibold text-coral-700 transition-all hover:border-coral-500 hover:bg-coral-100"
        >
          <span className="transition-transform group-hover:-translate-x-1">←</span>
          <span>Quay lại truyện</span>
        </button>
      )}

      {/* "Back to vocabulary list" — shown when the user clicked a card in
          WordCatalog (which lives inside Dashboard). Returns to Dashboard
          tab; the catalog will still be on the same tier they expanded
          since WordCatalog's expanded-tier state is component-local and
          doesn't reset on tab change.
          We clear both the catalog and story return contexts so subsequent
          card clicks start fresh — leaving stale storyReturnContext around
          would re-trigger the queue jump effect on next mount. */}
      {catalogReturnContext && (
        <button
          onClick={() => {
            clearCatalogReturnContext();
            clearStoryReturnContext();
            setTab('dashboard');
          }}
          className="group flex items-center gap-2 rounded-pill border-2 border-mint-300 bg-mint-50 px-4 py-2 font-display text-sm font-semibold text-mint-700 transition-all hover:border-mint-500 hover:bg-mint-100"
        >
          <span className="transition-transform group-hover:-translate-x-1">←</span>
          <span>Quay lại danh sách từ vựng</span>
        </button>
      )}

      {/* Progress bar + Settings */}
      <div className="flex items-center gap-3">
        <div className="tag border-ink-700 bg-ink-700 text-cream">
          <span>📚</span>
          <span>
            {sessionCount + 1} / {sessionCount + queue.length}
          </span>
        </div>
        <div className="h-3 flex-1 overflow-hidden rounded-pill bg-ink-100">
          <div
            className="h-full rounded-pill bg-gradient-to-r from-coral-500 to-mint-500 transition-all duration-500"
            style={{ width: `${Math.max(4, totalProgress)}%` }}
          />
        </div>
        <button
          onClick={() => setEditorOpen(true)}
          aria-label="Tùy chỉnh thứ tự hiển thị các field"
          title="Tùy chỉnh thẻ"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill border-2 border-ink-200 bg-white text-ink-500 transition-colors hover:border-coral-500 hover:text-coral-700"
        >
          ⚙️
        </button>
      </div>

      {/* Flashcard */}
      <Flashcard
        word={current}
        flipped={flipped}
        onFlip={() => setFlipped((f) => !f)}
        onPlay={handlePlay}
        isSpeaking={isSpeaking}
        supported={supported}
        layout={cardLayout}
        hasNativeWord={hasNativeWordAudio(current.id)}
        hasNativeSentence={hasNativeSentenceAudio(current.id)}
        ankiData={ankiData}
      />

      {/* Rating buttons (only when flipped) */}
      {flipped ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <RatingButton
            emoji="😰"
            label="Quên"
            keyHint="1"
            interval={preview?.again}
            tint="coral"
            onClick={() => handleRate(Rating.Again)}
          />
          <RatingButton
            emoji="😣"
            label="Khó"
            keyHint="2"
            interval={preview?.hard}
            tint="sun"
            onClick={() => handleRate(Rating.Hard)}
          />
          <RatingButton
            emoji="🙂"
            label="Được"
            keyHint="3"
            interval={preview?.good}
            tint="mint"
            onClick={() => handleRate(Rating.Good)}
          />
          <RatingButton
            emoji="😎"
            label="Dễ"
            keyHint="4"
            interval={preview?.easy}
            tint="forest"
            onClick={() => handleRate(Rating.Easy)}
          />
        </div>
      ) : (
        <div className="rounded-chunk border-2 border-dashed border-ink-200 bg-paper/50 p-6 text-center">
          <p className="font-display text-sm font-semibold uppercase tracking-widest text-ink-400">
            Đoán nghĩa trước, rồi chạm thẻ <KbdInline>↵</KbdInline> để xem đáp án
          </p>
        </div>
      )}

      {/* Keyboard shortcut legend — subtle reminder at the bottom */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-ink-400">
        <span className="flex items-center gap-1.5">
          <KbdInline>Space</KbdInline> Nghe
        </span>
        <span className="flex items-center gap-1.5">
          <KbdInline>⇧</KbdInline>
          <KbdInline>Space</KbdInline> Chậm
        </span>
        <span className="flex items-center gap-1.5">
          <KbdInline>↵</KbdInline> Lật thẻ
        </span>
        <span className="flex items-center gap-1.5">
          <KbdInline>1</KbdInline>
          <KbdInline>2</KbdInline>
          <KbdInline>3</KbdInline>
          <KbdInline>4</KbdInline> Đánh giá
        </span>
      </div>

      {/* Layout editor modal — lazy-mount-safe, renders null when closed */}
      <LayoutEditor
        open={editorOpen}
        initialLayout={cardLayout}
        onClose={() => setEditorOpen(false)}
        onSave={setCardLayout}
      />
    </div>
  );
}

/**
 * Inline keyboard hint, e.g. <KbdInline>Space</KbdInline>.
 * Monospace, subtle border, matches the paper/ink design system.
 */
function KbdInline({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[1.5rem] items-center justify-center rounded-md border border-ink-200 bg-white px-1.5 py-0.5 font-mono text-[0.7rem] font-semibold text-ink-600 shadow-sm">
      {children}
    </kbd>
  );
}

function RatingButton({
  emoji,
  label,
  keyHint,
  interval,
  tint,
  onClick,
}: {
  emoji: string;
  label: string;
  keyHint: string;
  interval?: string;
  tint: 'coral' | 'sun' | 'mint' | 'forest' | 'ink';
  onClick: () => void;
}) {
  const tintMap = {
    coral: 'border-coral-500 bg-coral-50 text-coral-700 shadow-chunky-coral hover:bg-coral-100',
    sun: 'border-sun-300 bg-sun-50 text-ink-700 shadow-chunky-sun hover:bg-sun-100',
    mint: 'border-mint-500 bg-mint-50 text-mint-700 shadow-chunky-mint hover:bg-mint-100',
    // Forest = "Easy" — green, semantically reinforces success / mastered.
    forest: 'border-forest-500 bg-forest-50 text-forest-700 shadow-chunky-forest hover:bg-forest-100',
    ink: 'border-ink-700 bg-ink-700 text-cream shadow-chunky-ink hover:bg-ink-600',
  }[tint];

  // Keep the key hint pill legible on the dark "ink" button.
  const kbdClass =
    tint === 'ink'
      ? 'border-cream/40 bg-ink-600 text-cream'
      : 'border-ink-200 bg-white text-ink-600';

  return (
    <button
      onClick={onClick}
      className={[
        'group relative flex flex-col items-center gap-1 rounded-chunk border-2 px-4 py-4 font-display font-semibold transition-all duration-100 active:translate-y-1 active:shadow-none',
        tintMap,
      ].join(' ')}
    >
      <kbd
        className={[
          'absolute right-2 top-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-md border px-1 py-0 font-mono text-[0.7rem] font-semibold',
          kbdClass,
        ].join(' ')}
        aria-hidden
      >
        {keyHint}
      </kbd>
      <span className="text-3xl leading-none">{emoji}</span>
      <span className="text-base uppercase tracking-wide">{label}</span>
      <span className="text-xs font-medium opacity-70 tabular-nums">
        {interval ?? '—'}
      </span>
    </button>
  );
}
