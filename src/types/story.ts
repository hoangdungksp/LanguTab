/**
 * Type definitions for the Story-based learning feature.
 *
 * A Story is a short narrative composed mostly of HSK1 vocabulary plus a
 * small budget of "new words" outside HSK1 needed for the genre. Each
 * sentence has three parallel forms (Chinese, pinyin, Vietnamese) and is
 * tokenised so that hovering or clicking individual words can surface
 * flashcards or popup translations.
 *
 * Block-aligned rendering means hanzi tokens and pinyin tokens are paired
 * column-by-column. The Vietnamese line sits below as a free reference
 * (no per-token alignment) — confirmed by Jason that VI is for reading
 * comprehension, not interactive lookup.
 */

import type { Word } from './index';

export type StoryGenre =
  | 'daily'
  | 'comedy'
  | 'horror'
  | 'xianxia'
  | 'sad'
  | 'fantasy'   // Cổ tích / thần thoại — magical creatures, fairy-tale plots
  | 'mystery';  // Trinh thám / bí ẩn — clues, deduction, puzzle solving

export interface StoryGenreMeta {
  id: StoryGenre;
  emoji: string;
  /** Vietnamese label shown to user */
  label: string;
  /** Short tone descriptor (also Vietnamese) */
  description: string;
}

/**
 * A token within a sentence — represents one logical unit (a Chinese word,
 * potentially multi-character) plus the metadata needed for hover/click.
 *
 * The pinyin string is per-token (not per-character) so it aligns block-wise
 * with the hanzi token in the renderer. Splitting hanzi into tokens is done
 * upstream by the data builder, not at render time.
 */
export interface StoryToken {
  /** The Chinese text for this token, e.g. "学生" or "我" or "。" */
  text: string;
  /**
   * Pinyin with tone marks for the whole token, e.g. "xuéshēng".
   * Optional because punctuation tokens have no pinyin.
   */
  pinyin?: string;
  /**
   * Token category — drives styling and interaction.
   *   - `hsk1`: word is in the HSK1 wordlist; click opens its flashcard.
   *   - `new`:  extra word outside HSK1; hover shows VI meaning popup,
   *             click… does nothing for now (we may add "save to deck" later).
   *   - `name`: proper noun (人名 etc.); just rendered, no interaction.
   *   - `punct`: punctuation, plain rendering, no interaction.
   *   - `unknown`: anything we couldn't classify — falls back to plain text.
   */
  type: 'hsk1' | 'new' | 'name' | 'punct' | 'unknown';
  /** For type='hsk1': the Word.id this token links to (e.g. "zh_001"). */
  wordId?: string;
  /** For type='new' or 'name': the NewWord.id this token references. */
  newWordId?: string;
}

export interface StorySentence {
  /** Raw Chinese sentence (kept for copy/paste and search) */
  zh: string;
  /** Full sentence pinyin for line-level rendering fallback */
  pinyin: string;
  /** Vietnamese translation of the whole sentence */
  vi: string;
  /** Tokenised form for interactive rendering (hover/click) */
  tokens: StoryToken[];
}

export interface StoryParagraph {
  sentences: StorySentence[];
}

/**
 * A "new word" — outside the HSK1 set but within the story's expansion budget
 * (≤50 per Jason's design). These words appear in the story and need their own
 * popup info but don't (yet) belong to a flashcard deck.
 */
export interface NewWord {
  id: string;
  hanzi: string;
  pinyin: string;
  vi: string;
  /** Which story(s) this word appears in — useful for de-duping the registry */
  storyIds?: string[];
}

/**
 * HSK level — narrowed numeric type used across Story types and other
 * level-aware features. Stories at this level use vocabulary up to and
 * including this level (so HSK 2 = HSK 1 + HSK 2 words).
 *
 * Originally 1-4; widened to 1-6 in v0.13 so AI-generated user stories
 * can target the full HSK range. Source-data stories still author at
 * HSK 1-4 only (verified at compile time, not at the type level).
 */
export type HskLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface Story {
  id: string;
  genre: StoryGenre;
  /**
   * HSK level this story targets. Determines which deck the story lives
   * under in the Stories tab list. Stories use vocabulary up to and
   * including this level — so an HSK 2 story uses HSK 1 + HSK 2 words
   * plus any new words declared in `newWords`.
   */
  hskLevel: HskLevel;
  title: { zh: string; pinyin: string; vi: string };
  description: { zh: string; pinyin: string; vi: string };
  paragraphs: StoryParagraph[];
  /** Word IDs covered from core HSK vocab (computed at build time) */
  vocabularyUsed: string[];
  /** Extra words outside core vocab that this story uses */
  newWords: NewWord[];
  /** Estimated reading time in minutes (computed) */
  estimatedMinutes?: number;
}

/**
 * AI-generated story persisted in IndexedDB (`db.userStories`).
 *
 * Wraps a Story with extra metadata for management UI: who/when generated
 * it, which prompt produced it (so users can re-generate variants), and
 * favorite/tag flags for filtering.
 *
 * Stored locally only — there's no cloud sync of generated stories yet.
 * If/when we add sync, this shape stays the same; only persistence layer
 * changes.
 */
export interface UserStory {
  /**
   * Locally generated id, e.g. 'usr_<timestamp>_<random>'. Not the same
   * shape as source-story ids (which are 'story_<theme>_<n>') so the two
   * pools never collide in any combined map.
   */
  id: string;
  /** Owner — for multi-user sync. See WordProgress.userId comment. */
  userId?: string | null;
  /** Last-write-wins timestamp for sync */
  updatedAt?: number;
  createdAt: Date;
  /** Original generation params — useful for "regenerate" feature later */
  prompt: {
    hskLevel: HskLevel;
    genre: string;
    description: string;
    sentenceCount: number;
    includeDialogue: boolean;
  };
  /** The compiled Story (post-tokenization, ready to render) */
  story: Story;
  /** User pinned this — UI filter + protect from bulk delete */
  isFavorite: boolean;
  /**
   * Mirror of `story.hskLevel` and `story.genre` at top level so we can
   * index them in Dexie (Dexie can't index nested object fields).
   * Keep these in sync with `story.*` on every write.
   */
  hskLevel: HskLevel;
  genre: string;
}

/** Lookup map: hanzi → HSK1 Word, used by the tokenizer */
export type HskWordIndex = Map<string, Word>;
