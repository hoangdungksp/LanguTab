// Shared types across the app

export type Language = 'zh' | 'en';

export interface Word {
  /** Unique ID, e.g., "zh_001", "en_001" */
  id: string;
  lang: Language;
  /** The word in target language: 你好 / hello */
  term: string;
  /** Pinyin for ZH, IPA for EN */
  phonetic: string;
  /** Vietnamese translation */
  translation: string;
  /** Optional: level (HSK 1-6 or frequency band 1-10) */
  level: number;
  /** Part of speech (optional) */
  pos?: string;
  /** Example sentence in target language */
  example?: string;
  /** Vietnamese translation of the example */
  exampleTranslation?: string;
  /** Optional emoji/hint for memorability */
  hint?: string;
}

/** Phoneme for the Phonetics tab */
export interface Phoneme {
  id: string;
  /** The phonetic symbol shown big: zh, /θ/, etc. */
  symbol: string;
  /** Category: initial, final, tone, consonant, vowel, diphthong */
  category: string;
  /** One-word label in Vietnamese: "Âm đầu", "Nguyên âm", etc. */
  categoryLabel: string;
  /** Vietnamese explanation of how to pronounce */
  vietnameseGuide: string;
  /** Closest Vietnamese sound for comparison, or "không có trong tiếng Việt" */
  vietnameseComparison: string;
  /** Example word in target language (used for TTS) */
  exampleWord: string;
  /** Phonetic of the example */
  examplePhonetic: string;
  /** Vietnamese meaning of example */
  exampleMeaning: string;
  /** Common Vietnamese learner mistake */
  commonMistake?: string;
}

/** FSRS progress per word, stored in IndexedDB */
export interface WordProgress {
  wordId: string;
  lang: Language;
  /**
   * Owner of this progress record. Set by syncMigration on first sign-in
   * (auto-claim strategy) and by all subsequent writes via the sync layer.
   * `null` only exists for legacy rows from before v5 schema migration —
   * those get auto-claimed when the user first signs in.
   */
  userId?: string | null;
  /**
   * Last-write-wins timestamp for sync. Bumped on every put to this row.
   * Compared against server's updated_at on push to decide whether to
   * accept the incoming write.
   */
  updatedAt?: number;
  // FSRS core fields
  difficulty: number;
  stability: number;
  state: 0 | 1 | 2 | 3; // 0=new, 1=learning, 2=review, 3=relearning
  due: Date;
  reps: number;
  lapses: number;
  lastReview?: Date;
  elapsedDays: number;
  scheduledDays: number;
}

/**
 * Append-only log of every rating event. One row per rate click.
 *
 * Distinct from `WordProgress`: WordProgress is the latest FSRS state per
 * word (mutable), while ReviewLog is the historical event stream
 * (immutable). The dashboard derives stats by aggregating this stream.
 *
 * `wasNew` lets us count "first-time mastered" without having to look up
 * the prior state — we set it from `state === 0` at the time of rating.
 */
export interface ReviewLog {
  /** Auto-incrementing PK from Dexie */
  id?: number;
  /** Owner — see WordProgress.userId comment */
  userId?: string | null;
  wordId: string;
  lang: Language;
  /** FSRS rating: 1=Again, 2=Hard, 3=Good, 4=Easy */
  rating: 1 | 2 | 3 | 4;
  reviewedAt: Date;
  /** True if this was the user's first time seeing this word */
  wasNew: boolean;
  /** Optional: time spent on the card before rating (ms). Future use. */
  durationMs?: number;
}

// —————————————————————————————————————————————————————————
// Flashcard layout — user-configurable field order
// —————————————————————————————————————————————————————————

/**
 * IDs for the rearrangeable blocks on the FRONT face.
 *   pos       — "đại từ / danh từ" uppercase label
 *   term      — the big hanzi/word itself
 *   audio     — the "Nghe" + "Chậm" pill-button row
 *   flipHint  — "Chạm để lật hoặc ↵ Enter" prompt
 */
export type FrontFieldId = 'pos' | 'term' | 'audio' | 'flipHint';

/**
 * IDs for the rearrangeable blocks on the BACK face.
 *   term         — term + phonetic + audio icons (grouped as one block because
 *                  phonetic alone has no meaning without its term).
 *   translation  — Vietnamese meaning card
 *   image        — custom image slot (via Google Drive sync, user-uploaded)
 *   example      — example sentence + its translation + audio icons
 */
export type BackFieldId = 'term' | 'translation' | 'image' | 'example';

/** User-configurable layout for the flashcard front + back faces. */
export interface FlashcardLayout {
  front: FrontFieldId[];
  back: BackFieldId[];
}

/** The default layout shipped with v0.5.9 (and used for first-time users). */
export const DEFAULT_CARD_LAYOUT: FlashcardLayout = {
  front: ['pos', 'term', 'audio', 'flipHint'],
  back: ['term', 'translation', 'image', 'example'],
};

/** Vietnamese labels for front-face fields, shown in the layout editor. */
export const FRONT_FIELD_LABELS: Record<FrontFieldId, { label: string; emoji: string }> = {
  pos: { label: 'Loại từ', emoji: '🏷️' },
  term: { label: 'Từ chính', emoji: '🀄' },
  audio: { label: 'Nút nghe (Nghe + Chậm)', emoji: '🔊' },
  flipHint: { label: 'Gợi ý lật thẻ', emoji: '👆' },
};

/** Vietnamese labels for back-face fields, shown in the layout editor. */
export const BACK_FIELD_LABELS: Record<BackFieldId, { label: string; emoji: string }> = {
  term: { label: 'Từ + phiên âm + nghe', emoji: '🀄' },
  translation: { label: 'Nghĩa tiếng Việt', emoji: '🇻🇳' },
  image: { label: 'Ảnh minh hoạ', emoji: '🖼️' },
  example: { label: 'Câu ví dụ + nghe', emoji: '💬' },
};

/**
 * Sanitize a layout loaded from storage:
 *   1. Drop any unknown IDs (e.g. from an older/future version).
 *   2. Append any missing required IDs at the end so the card still renders
 *      every block even if the user's stored prefs are stale.
 *   3. Deduplicate (defensive — should never happen but cheap to guard).
 */
export function sanitizeCardLayout(
  stored: Partial<FlashcardLayout> | undefined | null,
): FlashcardLayout {
  const validFront = new Set<FrontFieldId>(DEFAULT_CARD_LAYOUT.front);
  const validBack = new Set<BackFieldId>(DEFAULT_CARD_LAYOUT.back);

  const front: FrontFieldId[] = [];
  for (const id of stored?.front ?? []) {
    if (validFront.has(id as FrontFieldId) && !front.includes(id as FrontFieldId)) {
      front.push(id as FrontFieldId);
    }
  }
  for (const id of DEFAULT_CARD_LAYOUT.front) {
    if (!front.includes(id)) front.push(id);
  }

  const back: BackFieldId[] = [];
  for (const id of stored?.back ?? []) {
    if (validBack.has(id as BackFieldId) && !back.includes(id as BackFieldId)) {
      back.push(id as BackFieldId);
    }
  }
  for (const id of DEFAULT_CARD_LAYOUT.back) {
    if (!back.includes(id)) back.push(id);
  }

  return { front, back };
}

// —————————————————————————————————————————————————————————

/** User settings */
export type PhonemeVoiceGender = 'male' | 'female';

export interface Settings {
  id: 'singleton';
  /** Owner — for sync. See WordProgress.userId comment. */
  userId?: string | null;
  /** Last-write-wins timestamp for sync */
  updatedAt?: number;
  targetLang: Language;
  dailyGoal: number;
  lastStudyDate?: string; // YYYY-MM-DD
  streak: number;
  totalReviewsToday: number;
  soundEnabled: boolean;
  voicePreference?: string;
  /**
   * Preferred speaker gender for the phoneme example word audio (CosyVoice).
   * 'male' → longanyang, 'female' → longanhuan. Default: 'male'.
   * Optional for backward compat with older installs.
   */
  phonemeVoiceGender?: PhonemeVoiceGender;
  /**
   * User-customized flashcard field order. Optional for backward compat — old
   * installs without this key get `DEFAULT_CARD_LAYOUT` via sanitizeCardLayout().
   */
  cardLayout?: FlashcardLayout;
  /**
   * Whether the user has dismissed the onboarding intro. Set true after they
   * complete or skip the welcome modal. Defaulted to false in db.getSettings()
   * for fresh installs so the onboarding shows once on first run.
   */
  hasSeenOnboarding?: boolean;
}

export type TabId = 'dashboard' | 'phonetics' | 'flashcards' | 'stories' | 'translate' | 'exam';

/**
 * User-uploaded custom image for a flashcard.
 *
 * Storage backend evolution:
 *   v0.x–v0.15: Google Drive `appDataFolder` (driveFileId)
 *   v0.16+:     Cloudflare R2 (r2Key) — driveFileId kept for legacy fallback
 *               on records uploaded before v0.16. New uploads only set r2Key.
 *
 * Dexie keeps the metadata + a cached blob for offline display.
 */
export interface WordCustomImage {
  wordId: string;
  lang: Language;
  /** Owner — for sync. See WordProgress.userId comment. */
  userId?: string | null;
  /** Last-write-wins timestamp for sync */
  updatedAt?: number;
  /**
   * R2 object key — `{userId}/{lang}/{wordId}`. Set by the Worker on upload.
   * New uploads after v0.16 always use this; falls back to driveFileId for
   * legacy records uploaded under earlier versions.
   */
  r2Key?: string;
  /** Legacy: Google Drive file ID in appDataFolder. Read-only fallback. */
  driveFileId?: string;
  /** Cached binary for offline display; re-fetched from R2 (or Drive) on miss */
  cachedBlob?: Blob;
  /** Original filename for display (e.g., "my-photo.jpg") */
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: Date;
  /**
   * Sync state:
   * - 'synced':          uploaded to R2 (or legacy Drive) and cached locally
   * - 'pending_upload':  local only, queued to upload when online
   * - 'pending_delete':  marked for deletion, waiting to sync
   * - 'local_only':      user chose not to sync (not yet used)
   */
  syncStatus: 'synced' | 'pending_upload' | 'pending_delete' | 'local_only';
}

export type {
  StoryGenre,
  StoryGenreMeta,
  StoryToken,
  StorySentence,
  StoryParagraph,
  NewWord,
  Story,
  UserStory,
  HskLevel,
  HskWordIndex,
} from "./story";

export type {
  ExamDifficulty,
  ExamDropZone,
  DragNamePart,
  WritePart,
  WriteQuestionItem,
  TickPart,
  TickQuestionItem,
  TickOption,
  ColourPart,
  MatchPart,
  MatchItem,
  MatchOption,
  ExamPart,
  ExamLevel,
  ExamAnswer,
  ExamPartResult,
  ExamAttemptResult,
} from "./exam";

export { STARS_PER_LEVEL } from "./exam";
