import Dexie, { type EntityTable } from 'dexie';
import type { ReviewLog, Settings, WordProgress, WordCustomImage } from '../types';
import type { UserStory } from '../types/story';
import { DEFAULT_CARD_LAYOUT } from '../types';

/**
 * LinguTab IndexedDB schema.
 *
 * NOTE: The actual database name in IndexedDB stays "LinguaNewTabDB" (the
 * original product name) — renaming it would orphan every existing user's
 * flashcard progress, settings, and cached audio. Dexie identifies databases
 * by string name; changing it = creating a brand new empty DB. So we keep
 * the legacy name in `super(...)` below even though everything user-facing
 * has been rebranded to "LinguTab".
 *
 * Stores:
 *  - wordProgress:  FSRS per-word state (due date, difficulty, stability...)
 *  - settings:      singleton row with user preferences (lang, streak, goal)
 *  - cache:         generic k/v cache for future AI-generated assets
 *  - customImages:  user-uploaded flashcard images, mirrored with Drive appDataFolder
 *
 * Schema evolution:
 *  v1: wordProgress + settings + cache
 *  v2: +customImages (added for Google Drive sync feature)
 *
 * Note on cardLayout (v0.5.9+): stored as a JSON column inside the singleton
 * settings row, not a new table. No schema bump needed — Dexie stores the
 * whole Settings object as-is.
 */

export interface CacheEntry {
  key: string;
  value: unknown;
  createdAt: Date;
}

export class LinguaDB extends Dexie {
  wordProgress!: EntityTable<WordProgress, 'wordId'>;
  settings!: EntityTable<Settings, 'id'>;
  cache!: EntityTable<CacheEntry, 'key'>;
  customImages!: EntityTable<WordCustomImage, 'wordId'>;
  /**
   * Append-only log of every word rating event.
   * Used by the stats dashboard for time-series analytics:
   *   - daily streak / heatmap
   *   - words learned per day
   *   - average review speed
   *   - retention rate
   *
   * One row per rate action — never updated, only inserted. Auto-incrementing
   * primary key (`++id`) so multiple inserts in the same millisecond don't
   * collide. Indexed by `reviewedAt` (date range queries) and `lang` (filter
   * by target language) and `wordId` (per-word history).
   */
  reviewLog!: EntityTable<ReviewLog, 'id'>;
  /**
   * AI-generated user stories. Created via the "+ Tạo truyện" feature
   * (TabStories), which calls the Cloudflare Worker → Gemini and persists
   * the result here. User can mark as favorite, delete, or filter.
   *
   * Indexed fields:
   *   - id (PK)         : 'usr_<timestamp>_<random>' string
   *   - createdAt       : sort newest first
   *   - hskLevel        : filter by level
   *   - genre           : filter/group by genre
   *   - isFavorite      : filter starred stories
   */
  userStories!: EntityTable<UserStory, 'id'>;

  constructor() {
    super('LinguaNewTabDB');

    // v1 — original schema
    this.version(1).stores({
      wordProgress: 'wordId, lang, due, state',
      settings: 'id',
      cache: 'key, createdAt',
    });

    // v2 — add customImages table for Drive-synced flashcard images
    // Indexed fields: wordId (PK), lang (filter), syncStatus (find pending work), uploadedAt (sort)
    this.version(2).stores({
      wordProgress: 'wordId, lang, due, state',
      settings: 'id',
      cache: 'key, createdAt',
      customImages: 'wordId, lang, syncStatus, uploadedAt',
    });

    // v3 — append-only review log for stats dashboard.
    // Primary key `++id` = auto-increment; indexes on reviewedAt / lang / wordId.
    this.version(3).stores({
      wordProgress: 'wordId, lang, due, state',
      settings: 'id',
      cache: 'key, createdAt',
      customImages: 'wordId, lang, syncStatus, uploadedAt',
      reviewLog: '++id, reviewedAt, lang, wordId',
    });

    // v4 — user-generated AI stories
    // PK `id` is a string we generate client-side ('usr_<timestamp>_<rand>').
    // Indexes mirror likely query shapes: list newest, filter by level/genre,
    // surface favorites. No compound indexes since the user-stories table is
    // expected to stay small (3/day cap × months of usage = a few hundred).
    this.version(4).stores({
      wordProgress: 'wordId, lang, due, state',
      settings: 'id',
      cache: 'key, createdAt',
      customImages: 'wordId, lang, syncStatus, uploadedAt',
      reviewLog: '++id, reviewedAt, lang, wordId',
      userStories: 'id, createdAt, hskLevel, genre, isFavorite',
    });

    // v5 — multi-user support. Adds `userId` index to every per-user table
    // so queries can filter by owner (`db.wordProgress.where('userId').
    // equals(currentUserId)`). The first sign-in after this version triggers
    // syncMigration.ts which back-fills userId on legacy rows that were
    // written by earlier versions (auto-claim).
    //
    // Why not also add `updatedAt` as an index? It's used per-row at write
    // time but we never query "all rows updated since X" client-side
    // (server does that via D1). Skipping the index saves write overhead
    // on the hot path (every rate click writes wordProgress + reviewLog).
    this.version(5).stores({
      wordProgress: 'wordId, lang, due, state, userId',
      settings: 'id, userId',
      cache: 'key, createdAt',
      customImages: 'wordId, lang, syncStatus, uploadedAt, userId',
      reviewLog: '++id, reviewedAt, lang, wordId, userId',
      userStories: 'id, createdAt, hskLevel, genre, isFavorite, userId',
    });
  }
}

export const db = new LinguaDB();

/** Get or create the singleton settings row. */
export async function getSettings(): Promise<Settings> {
  const s = await db.settings.get('singleton');
  if (s) return s;
  const defaults: Settings = {
    id: 'singleton',
    targetLang: 'zh',
    dailyGoal: 10,
    streak: 0,
    totalReviewsToday: 0,
    soundEnabled: true,
    cardLayout: DEFAULT_CARD_LAYOUT,
  };
  await db.settings.put(defaults);
  return defaults;
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  await db.settings.put({ ...current, ...patch });
}

// ————————————— Custom image helpers —————————————

/** Get the custom image record for a word, if any. */
export async function getCustomImage(
  wordId: string
): Promise<WordCustomImage | undefined> {
  return db.customImages.get(wordId);
}

/** Upsert a custom image record. */
export async function putCustomImage(img: WordCustomImage): Promise<void> {
  await db.customImages.put(img);
}

/** Remove the custom image record for a word. */
export async function removeCustomImage(wordId: string): Promise<void> {
  await db.customImages.delete(wordId);
}

/** List images that need syncing (upload or delete). */
export async function listPendingSyncImages(): Promise<WordCustomImage[]> {
  return db.customImages
    .where('syncStatus')
    .anyOf('pending_upload', 'pending_delete')
    .toArray();
}
