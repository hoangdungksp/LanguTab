import { useMemo, useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import {
  STORY_GENRES,
  stories,
  getStoryById,
} from '../../data/zh/stories';
import { hsk1 } from '../../data/zh/hsk1';
import type { Story, StorySentence, StoryToken, NewWord, Word, UserStory } from '../../types';
import { StoryGenModal } from './StoryGenModal';
import {
  useUserStories,
  useUserStoryActions,
} from '../hooks/useUserStories';
import { getCachedRole } from '../../services/adminModeService';

/**
 * Stories tab — comprehensible-input reading practice.
 *
 * Two view modes (controlled by activeStoryId in the app store):
 *   1. Story selector — list 5 stories grouped by genre
 *   2. Story reader   — full block-aligned ZH/pinyin/VI rendering
 *                       with hover popups + click → flashcard navigation
 */

export function TabStories() {
  const activeStoryId = useAppStore((s) => s.activeStoryId);
  const userStories = useUserStories();

  // Single source of truth: if a story is open, render the reader; otherwise
  // the selector. Cleanup of activeStoryId happens in store actions.
  if (activeStoryId) {
    // Try source stories first (most common case), then user stories.
    // User-story IDs always start with 'usr_' so we can branch quickly,
    // but we check both pools for safety against id-namespace collisions.
    const sourceStory = getStoryById(activeStoryId);
    if (sourceStory) return <StoryReader story={sourceStory} />;
    const userStory = userStories.find((us) => us.story.id === activeStoryId);
    if (userStory) return <StoryReader story={userStory.story} />;
    // Falsy story id (corrupted state) — fall through to selector
  }

  return <StorySelector />;
}

// ────────────────────────────────────────────────────────────────────────────
// Story selector — HSK level tabs + filtered story list
// ────────────────────────────────────────────────────────────────────────────

type HskFilter = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Genre lookup by id for resolving emoji + label inside the card render.
 * Built once at module load (STORY_GENRES is a frozen const).
 */
const GENRES_BY_ID = new Map(STORY_GENRES.map((g) => [g.id, g]));

function StorySelector() {
  const openStory = useAppStore((s) => s.openStory);
  const role = getCachedRole();
  const canEdit = role === 'admin' || role === 'editor';

  // Active HSK level tab. Default to HSK 1 since that's where beginners
  // start and we have the most content there. We don't persist this in the
  // store — it's a transient filter, doesn't need to survive tab changes.
  const [activeLevel, setActiveLevel] = useState<HskFilter>(1);

  // Modal state for the AI story generator
  const [modalOpen, setModalOpen] = useState(false);

  // User-generated stories (auto-refreshes via Dexie liveQuery when modal saves)
  const userStoriesAtLevel = useUserStories(activeLevel);
  const { deleteStory, toggleFav } = useUserStoryActions();

  // Pre-compute counts per level so the tab labels can show how many
  // stories live in each. Combines source-data stories + user stories.
  const countsByLevel = useMemo(() => {
    const counts: Record<HskFilter, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    for (const s of stories) counts[s.hskLevel]++;
    return counts;
  }, []);

  // Filter stories by active level. Stable order = source order, which
  // groups stories by genre naturally since they're authored that way.
  const filteredStories = useMemo(
    () => stories.filter((s) => s.hskLevel === activeLevel),
    [activeLevel],
  );

  const handleDeleteUserStory = async (story: UserStory) => {
    // Confirm to prevent accidental deletes — these took API credits
    const ok = window.confirm(
      `Xoá truyện "${story.story.title.vi}"? Hành động này không thể hoàn tác.`,
    );
    if (!ok) return;
    const success = await deleteStory(story.id, true);
    if (!success) {
      window.alert('Không xoá được truyện. Vui lòng thử lại.');
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-display text-3xl font-bold text-ink-700">
          📖 Truyện kể
        </h1>
        <p className="text-sm text-ink-500">
          Đọc truyện ngắn theo trình độ HSK. Click vào từ đã học để xem flashcard.
        </p>
      </header>

      {/* HSK level filter tabs + create button.
          The create button sits at the right end of the tab row so users can
          one-tap from "filter HSK 3" to "generate HSK 3 story" — preselected
          level passes through to the modal. */}
      <div className="flex flex-wrap items-center gap-2">
        {([1, 2, 3, 4, 5, 6] as HskFilter[]).map((level) => {
          const count = countsByLevel[level];
          const isActive = activeLevel === level;
          return (
            <button
              key={level}
              onClick={() => setActiveLevel(level)}
              className={`flex items-center gap-2 rounded-pill border-2 px-4 py-2 font-display text-sm font-semibold transition-all ${
                isActive
                  ? 'border-ink-700 bg-ink-700 text-cream shadow-chunky-ink'
                  : 'border-ink-200 bg-paper text-ink-500 hover:border-ink-400 hover:text-ink-700'
              }`}
            >
              <span>HSK {level}</span>
              <span
                className={`rounded-pill px-2 text-xs ${
                  isActive ? 'bg-cream text-ink-700' : 'bg-ink-100 text-ink-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
        {/* Spacer pushes the create button to the right edge on wide screens.
            On narrow screens flex-wrap drops it to a new line naturally. */}
        <div className="ml-auto" />
        {canEdit && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-pill border-2 border-coral-600 bg-coral-500 px-4 py-2 font-display text-sm font-semibold text-white shadow-chunky-soft transition-all hover:bg-coral-600"
            title="Tạo truyện riêng bằng AI (chỉ admin/editor)"
          >
            <span>✨</span>
            <span>Tạo truyện AI</span>
          </button>
        )}
      </div>

      {/* User-generated stories — render BEFORE source-data stories at the
          same level. Empty when user hasn't generated any yet, so no need
          for a wrapper div / header in that case. Favorites already sorted
          to the top inside the hook. */}
      {userStoriesAtLevel.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-baseline gap-2">
            <h2 className="font-display text-lg font-bold text-ink-700">
              ✨ Truyện của bạn
            </h2>
            <span className="text-xs text-ink-400">
              ({userStoriesAtLevel.length} truyện AI)
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {userStoriesAtLevel.map((us) => (
              <UserStoryCard
                key={us.id}
                userStory={us}
                onOpen={() => openStory(us.story.id)}
                onToggleFav={() => toggleFav(us.id)}
                onDelete={() => handleDeleteUserStory(us)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Story grid — all stories matching the active level. Empty state
          for levels we haven't authored yet keeps users informed instead
          of showing a blank pane. */}
      {/* Source-data stories — the curated 12-per-level set. We add a heading
          when user stories also exist so the two sections feel separate;
          when there are no user stories we skip the heading to avoid
          drawing attention to an empty distinction. */}
      {filteredStories.length === 0 && userStoriesAtLevel.length === 0 ? (
        <div className="rounded-chunk border-2 border-dashed border-ink-200 bg-paper p-10 text-center">
          <div className="text-4xl">📚</div>
          <div className="mt-3 font-display text-lg font-semibold text-ink-700">
            Chưa có truyện HSK {activeLevel}
          </div>
          <div className="mt-1 text-sm text-ink-500">
            Truyện mẫu cho cấp độ này đang được biên soạn.{canEdit && (
              <> Bạn có thể bấm <strong className="text-coral-600">✨ Tạo truyện AI</strong> để tự tạo truyện riêng.</>
            )}
          </div>
        </div>
      ) : filteredStories.length > 0 && (
        <section className="space-y-3">
          {userStoriesAtLevel.length > 0 && (
            <h2 className="font-display text-lg font-bold text-ink-700">
              📚 Truyện mẫu
            </h2>
          )}
          <div className="flex flex-col gap-3">
          {filteredStories.map((story) => {
            const genre = GENRES_BY_ID.get(story.genre);
            const wordCount = story.vocabularyUsed.length;
            // Filter out new words whose hanzi looks like a proper noun
            // (starts with a Latin letter). Same heuristic as before to
            // exclude things like character names from the "new words" count.
            const newWordCount = story.newWords.filter((nw) => !nw.hanzi.match(/^[A-Z]/)).length;

            return (
              <button
                key={story.id}
                onClick={() => openStory(story.id)}
                className="group flex items-center gap-4 rounded-chunk border-2 border-ink-100 bg-paper p-4 text-left transition-all duration-150 hover:border-ink-700 hover:shadow-chunky-ink"
              >
                <span className="shrink-0 text-3xl">{genre?.emoji ?? '📖'}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-zh text-xl font-bold text-ink-700">{story.title.zh}</div>
                  <div className="truncate font-mono-ipa text-sm text-coral-600">{story.title.pinyin}</div>
                  <div className="truncate text-sm italic text-ink-500">{story.title.vi}</div>
                </div>
                <div className="hidden shrink-0 text-right md:block">
                  <span className="inline-block rounded-pill bg-ink-100 px-2 py-0.5 text-xs font-bold text-ink-500">
                    {genre?.label ?? story.genre} · HSK {story.hskLevel}
                  </span>
                  <div className="mt-1 whitespace-nowrap text-xs text-ink-400">
                    📝 {wordCount} · ✨ {newWordCount}{story.estimatedMinutes ? ` · ⏱️ ${story.estimatedMinutes}p` : ''}
                  </div>
                </div>
              </button>
            );
          })}
          </div>
        </section>
      )}

      {/* Modal renders at root of selector so the backdrop covers everything,
          including the fixed Google Apps menu (z-50). Modal also uses z-50
          but sits later in the DOM so it wins via render order. */}
      {modalOpen && (
        <StoryGenModal
          initialHskLevel={activeLevel}
          onClose={() => setModalOpen(false)}
          onCreated={(newStory) => {
            // Auto-open the freshly generated story. Better UX than dropping
            // the user back at the list — they just spent a credit, show them
            // what they got.
            openStory(newStory.story.id);
          }}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// User story card — variant of the source-story card with extra controls
// ────────────────────────────────────────────────────────────────────────────

/**
 * Card for AI-generated user stories. Wraps an outer button (open story)
 * with two stop-propagation overlay buttons (favorite / delete) so users
 * can manage stories without entering the reader.
 *
 * Visually distinct from source stories via:
 *  - "✨ AI tạo" badge top-right
 *  - Coral border tint when favorited
 *  - Larger control buttons since user stories are more "personal"
 */
function UserStoryCard({
  userStory,
  onOpen,
  onToggleFav,
  onDelete,
}: {
  userStory: UserStory;
  onOpen: () => void;
  onToggleFav: () => void;
  onDelete: () => void;
}) {
  const { story } = userStory;
  const genre = GENRES_BY_ID.get(story.genre);
  const wordCount = story.vocabularyUsed.length;
  const newWordCount = story.newWords.filter((nw) => !nw.hanzi.match(/^[A-Z]/)).length;

  // Format created date — locale-aware, short form
  const createdLabel = new Intl.DateTimeFormat('vi-VN', {
    month: 'short',
    day: 'numeric',
  }).format(userStory.createdAt);

  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      className={[
        'group relative flex cursor-pointer flex-col gap-3 rounded-chunk border-2 bg-paper p-5 text-left transition-all duration-150 hover:shadow-chunky-ink',
        userStory.isFavorite
          ? 'border-coral-300 hover:border-coral-600'
          : 'border-ink-100 hover:border-ink-700',
      ].join(' ')}
    >
      {/* AI badge + control buttons in the top-right corner */}
      <div className="absolute right-3 top-3 flex items-center gap-1">
        <span className="rounded-pill bg-coral-100 px-2 py-0.5 text-[10px] font-semibold text-coral-700">
          ✨ AI tạo
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFav();
          }}
          aria-label={userStory.isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'}
          title={userStory.isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'}
          className="rounded-full p-1.5 text-base hover:bg-ink-100"
        >
          {userStory.isFavorite ? '⭐' : '☆'}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Xoá truyện"
          title="Xoá truyện"
          className="rounded-full p-1.5 text-base text-ink-400 hover:bg-coral-100 hover:text-coral-700"
        >
          🗑️
        </button>
      </div>

      <div className="flex items-center gap-3 pr-24">
        <span className="text-4xl">{genre?.emoji ?? '✨'}</span>
        <div className="flex-1">
          <div className="font-display text-lg font-bold text-ink-700">
            {genre?.label ?? story.genre}
          </div>
          <div className="text-xs text-ink-400">
            HSK {story.hskLevel} · {createdLabel}
          </div>
        </div>
      </div>

      <div>
        <div className="font-display text-zh text-2xl font-bold text-ink-700">
          {story.title.zh}
        </div>
        <div className="font-mono-ipa text-sm text-coral-600">
          {story.title.pinyin}
        </div>
        <div className="text-sm italic text-ink-500">{story.title.vi}</div>
      </div>

      <div className="mt-auto flex items-center gap-4 text-xs text-ink-400">
        <span>📝 {wordCount} từ</span>
        <span>✨ {newWordCount} từ mới</span>
        {story.estimatedMinutes && <span>⏱️ ~{story.estimatedMinutes} phút</span>}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Story reader — block-aligned trilingual rendering
// ────────────────────────────────────────────────────────────────────────────

function StoryReader({ story }: { story: Story }) {
  const closeStory = useAppStore((s) => s.closeStory);

  // Build word lookups once per story render so we don't re-scan on every
  // hover.  hsk1 is module-static, newWords is per-story.
  const hsk1ById = useMemo(() => {
    const m = new Map<string, Word>();
    for (const w of hsk1) m.set(w.id, w);
    return m;
  }, []);

  const newWordsById = useMemo(() => {
    const m = new Map<string, NewWord>();
    for (const nw of story.newWords) m.set(nw.id, nw);
    return m;
  }, [story.newWords]);

  const genre = STORY_GENRES.find((g) => g.id === story.genre);

  return (
    <div className="space-y-6">
      <button
        onClick={closeStory}
        className="group flex items-center gap-2 font-display text-sm font-semibold text-ink-500 transition-colors hover:text-ink-700"
      >
        <span className="transition-transform group-hover:-translate-x-1">←</span>
        <span>Quay lại danh sách truyện</span>
      </button>

      <header className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-2xl">{genre?.emoji}</span>
          <span className="font-display font-semibold text-ink-500">
            {genre?.label}
          </span>
        </div>
        <h1 className="font-display text-zh text-4xl font-bold text-ink-700">
          {story.title.zh}
        </h1>
        <div className="font-mono-ipa text-lg text-coral-600">
          {story.title.pinyin}
        </div>
        <div className="text-base italic text-ink-500">{story.title.vi}</div>
      </header>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 rounded-chunk bg-paper p-3 text-xs">
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-coral-500" />
          <span>HSK1 (đã học) — click mở Flashcard</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-sun-400" />
          <span>Từ mới — hover xem nghĩa</span>
        </span>
      </div>

      {/* Story body */}
      <article className="space-y-6 rounded-chunk border-2 border-ink-100 bg-paper p-6 md:p-8">
        {story.paragraphs.map((p, pi) => (
          <div key={pi} className="space-y-4">
            {p.sentences.map((s, si) => (
              <SentenceRow
                key={si}
                sentence={s}
                storyId={story.id}
                hsk1ById={hsk1ById}
                newWordsById={newWordsById}
              />
            ))}
          </div>
        ))}
      </article>

      <button
        onClick={closeStory}
        className="rounded-pill border-2 border-ink-200 bg-paper px-5 py-2 font-display text-sm font-semibold text-ink-600 transition-colors hover:border-ink-700"
      >
        ← Quay lại danh sách truyện
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Sentence renderer — block-aligned hanzi/pinyin pairs + VI reference line
// ────────────────────────────────────────────────────────────────────────────

function SentenceRow({
  sentence,
  storyId,
  hsk1ById,
  newWordsById,
}: {
  sentence: StorySentence;
  storyId: string;
  hsk1ById: Map<string, Word>;
  newWordsById: Map<string, NewWord>;
}) {
  return (
    <div className="space-y-1">
      {/* Block-aligned token row — wraps naturally across lines */}
      <div className="flex flex-wrap items-end gap-x-1 gap-y-2">
        {sentence.tokens.map((tok, ti) => (
          <TokenView
            key={ti}
            token={tok}
            storyId={storyId}
            hsk1ById={hsk1ById}
            newWordsById={newWordsById}
          />
        ))}
      </div>
      {/* Vietnamese reference line — not interactive, just for comprehension */}
      <div className="text-base italic text-ink-500">{sentence.vi}</div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Single token view — block-aligned (hanzi top, pinyin below) + interactions
// ────────────────────────────────────────────────────────────────────────────

function TokenView({
  token,
  storyId,
  hsk1ById,
  newWordsById,
}: {
  token: StoryToken;
  storyId: string;
  hsk1ById: Map<string, Word>;
  newWordsById: Map<string, NewWord>;
}) {
  const [hovering, setHovering] = useState(false);
  const navigateToWordFromStory = useAppStore((s) => s.navigateToWordFromStory);

  const isInteractive = token.type === 'hsk1' || token.type === 'new' || token.type === 'name';

  const handleClick = () => {
    if (token.type === 'hsk1' && token.wordId) {
      navigateToWordFromStory(storyId, token.wordId);
    }
    // 'new' and 'name' — no click action; popup stays via hover
  };

  // Punctuation: render plain inline, no block-align column
  if (token.type === 'punct') {
    return (
      <span className="self-end pb-[1px] font-display text-zh text-2xl text-ink-700">
        {token.text}
      </span>
    );
  }

  // Underlines + colour by type
  let textClass = 'text-ink-700';
  let underlineClass = '';
  if (token.type === 'hsk1') {
    textClass = 'text-coral-700 cursor-pointer';
    underlineClass = 'border-b-2 border-coral-300 hover:border-coral-500';
  } else if (token.type === 'new') {
    textClass = 'text-sun-500 cursor-help';
    underlineClass = 'border-b-2 border-dashed border-sun-400';
  } else if (token.type === 'name') {
    textClass = 'text-ink-600 cursor-help italic';
    underlineClass = 'border-b border-dotted border-ink-300';
  }

  return (
    <span
      className="relative inline-flex flex-col items-center"
      onMouseEnter={() => isInteractive && setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Pinyin row — small, monospace-ish */}
      <span className="font-mono-ipa text-xs leading-tight text-coral-500">
        {token.pinyin ?? '\u00a0'}
      </span>
      {/* Hanzi row */}
      <span
        onClick={handleClick}
        className={[
          'font-display text-zh text-2xl font-medium leading-tight transition-colors',
          textClass,
          underlineClass,
        ].join(' ')}
      >
        {token.text}
      </span>

      {/* Hover popup */}
      {hovering && isInteractive && (
        <TokenPopover
          token={token}
          hsk1ById={hsk1ById}
          newWordsById={newWordsById}
        />
      )}
    </span>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Hover popover — small flashcard preview for HSK1, simple gloss for new words
// ────────────────────────────────────────────────────────────────────────────

function TokenPopover({
  token,
  hsk1ById,
  newWordsById,
}: {
  token: StoryToken;
  hsk1ById: Map<string, Word>;
  newWordsById: Map<string, NewWord>;
}) {
  if (token.type === 'hsk1' && token.wordId) {
    const word = hsk1ById.get(token.wordId);
    if (!word) return null;
    return (
      <div className="absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-chunk border-2 border-coral-300 bg-paper p-3 shadow-lg pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="font-display text-zh text-2xl font-bold text-ink-700">
            {word.term}
          </div>
          {word.hint && <div className="text-xl">{word.hint}</div>}
        </div>
        <div className="font-mono-ipa text-sm text-coral-600">{word.phonetic}</div>
        <div className="mt-1 text-sm font-semibold text-ink-700">
          {word.translation}
        </div>
        {word.pos && (
          <div className="text-xs italic text-ink-400">{word.pos}</div>
        )}
        <div className="mt-2 border-t-2 border-dashed border-ink-100 pt-2 text-xs text-coral-600">
          Click để mở Flashcard
        </div>
      </div>
    );
  }

  if ((token.type === 'new' || token.type === 'name') && token.newWordId) {
    const nw = newWordsById.get(token.newWordId);
    if (!nw) return null;
    return (
      <div className="absolute bottom-full left-1/2 z-20 mb-2 w-48 -translate-x-1/2 rounded-chunk border-2 border-sun-400 bg-paper p-3 shadow-lg pointer-events-none">
        <div className="font-display text-zh text-xl font-bold text-ink-700">
          {nw.hanzi}
        </div>
        <div className="font-mono-ipa text-xs text-coral-600">{nw.pinyin}</div>
        <div className="mt-1 text-sm text-ink-700">{nw.vi}</div>
      </div>
    );
  }

  return null;
}
