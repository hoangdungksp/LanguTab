/**
 * AI story generation — calls the Cloudflare Worker `/generate-story`,
 * validates the response, builds a Story (tokenized), and persists it
 * to `db.userStories`.
 *
 * Auth: uses the existing Google OAuth token from authService. The Worker
 * verifies it server-side and uses the Google `sub` (user ID) as the
 * rate-limit key — 3 stories per user per day.
 *
 * Validation pipeline (after Worker returns):
 *   1. Shape check (title/description/rows present and well-formed)
 *   2. Sentence count matches the requested count (±1 tolerance)
 *   3. Pinyin contains tone marks (catches Gemini fallback to plain)
 *   4. Vietnamese has diacritics (catches English fallback)
 *   5. Tokenize each sentence via the existing storyTokenizer pipeline
 *
 * On validation failure we throw — the credit was already refunded by the
 * Worker on Gemini failure, but validation failures happen AFTER Gemini
 * returned successfully so the credit IS consumed. Acceptable trade-off:
 * not refunding here means we don't need a separate refund endpoint.
 */

import { getAuthToken, authedFetch } from './authService';
import { db } from './db';
import { stories as sourceStories } from '../data/zh/stories';
import { hsk1 } from '../data/zh/hsk1';
import { hsk2 } from '../data/zh/hsk2';
import { hsk3 } from '../data/zh/hsk3';
import { hsk4 } from '../data/zh/hsk4';
import { hsk5 } from '../data/zh/hsk5';
import { hsk6 } from '../data/zh/hsk6';
import {
  buildVocabIndex,
  tokenizeSentence,
  type PinyinMap,
} from '../data/zh/storyTokenizer';
import type {
  HskLevel,
  NewWord,
  Story,
  StoryGenre,
  StoryParagraph,
  StorySentence,
  UserStory,
} from '../types';

// Match the Worker URL from gemini.ts — keep these in sync if Jason changes
// the Worker subdomain.
const WORKER_ENDPOINT = 'https://lingua-newtab-worker.kspstudio.workers.dev';

// ────────────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────────────

export interface StoryGenParams {
  hskLevel: HskLevel;
  /** Free-text genre — preset id ('daily'/'fantasy'/...) or custom string */
  genre: string;
  /** Free-text description of what user wants the story about */
  description: string;
  /** Number of sentences to generate. Capped per HSK level (see MAX_SENTENCES). */
  sentenceCount: number;
  /** Whether the story should include dialogue between characters */
  includeDialogue: boolean;
}

export interface QuotaInfo {
  used: number;
  limit: number;
  remaining: number;
  /** ISO datetime when the quota resets (next UTC midnight) */
  resetAt: string;
  /** Effective tier (folds in expiry — a 'pro' user past renews_at returns 'free') */
  tier?: 'free' | 'pro' | 'lifetime' | 'banned';
}

/**
 * Sentence-count caps per HSK level. Lower levels have tighter caps
 * because vocabulary is small — long stories at HSK 1 just repeat the
 * same 50 words endlessly.
 */
export const MAX_SENTENCES: Record<HskLevel, number> = {
  1: 15,
  2: 15,
  3: 20,
  4: 20,
  5: 25,
  6: 25,
};

export const MIN_SENTENCES = 5;

/**
 * Get current user's quota status. Returns null if not signed in.
 *
 * Cheap (~100ms) — does an authenticated GET /quota on the Worker. Cache
 * results in component state if calling repeatedly; we don't cache here
 * to keep this layer simple/stateless.
 */
export async function getQuota(): Promise<QuotaInfo | null> {
  const token = await getAuthToken(false);
  if (!token) return null;
  try {
    const res = await authedFetch(`${WORKER_ENDPOINT}/quota`);
    if (!res.ok) return null;
    return (await res.json()) as QuotaInfo;
  } catch {
    return null;
  }
}

/** Domain-specific error so the UI can render the right message. */
export class StoryGenError extends Error {
  constructor(
    message: string,
    public kind: 'auth' | 'quota' | 'network' | 'invalid' | 'gemini',
    public detail?: string,
  ) {
    super(message);
  }
}

/**
 * Generate a story via the Worker, validate, save to Dexie, return it.
 *
 * Flow:
 *   1. Get OAuth token (interactive=true: prompts sign-in if not signed in)
 *   2. POST to /generate-story with params
 *   3. Validate response shape + content quality
 *   4. Build Story (tokenize) and wrap as UserStory
 *   5. Save to db.userStories
 *
 * Throws StoryGenError on any failure with `kind` indicating where it
 * went wrong so the UI can display appropriate messages.
 */
export async function generateStory(params: StoryGenParams): Promise<UserStory> {
  // Validate params client-side first — saves a network round-trip
  if (params.sentenceCount < MIN_SENTENCES || params.sentenceCount > MAX_SENTENCES[params.hskLevel]) {
    throw new StoryGenError(
      `Số câu phải từ ${MIN_SENTENCES}-${MAX_SENTENCES[params.hskLevel]} cho HSK ${params.hskLevel}`,
      'invalid',
    );
  }
  if (!params.description.trim() || params.description.length > 500) {
    throw new StoryGenError('Mô tả phải có (tối đa 500 ký tự)', 'invalid');
  }
  if (!params.genre.trim() || params.genre.length > 50) {
    throw new StoryGenError('Thể loại không hợp lệ', 'invalid');
  }

  // Get auth token — interactive=true so user gets sign-in prompt if needed
  const token = await getAuthToken(true);
  if (!token) {
    throw new StoryGenError(
      'Bạn cần đăng nhập Google để tạo truyện AI',
      'auth',
    );
  }

  // Call Worker — authedFetch handles 401 retry + token refresh transparently.
  let respJson: { story?: unknown; error?: string; remaining?: number; resetAt?: string };
  try {
    const res = await authedFetch(`${WORKER_ENDPOINT}/generate-story`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    // Read response body once as text — if it's JSON we parse, if not we
    // fall back to a generic error. Cloudflare error pages and rate-limit
    // walls return HTML; calling res.json() on them throws SyntaxError
    // (bug #16 from v0.15.1 audit).
    const rawText = await res.text();
    try {
      respJson = rawText ? JSON.parse(rawText) : {};
    } catch {
      respJson = { error: rawText.slice(0, 200) || `HTTP ${res.status}` };
    }
    if (!res.ok) {
      // 401 = auth failure, 429 = quota exhausted, 502 = Gemini error
      const kind = res.status === 401 ? 'auth'
        : res.status === 429 ? 'quota'
        : res.status >= 500 ? 'gemini'
        : 'invalid';
      throw new StoryGenError(
        respJson.error || `Lỗi máy chủ (${res.status})`,
        kind,
        rawText.slice(0, 500),
      );
    }
  } catch (err) {
    if (err instanceof StoryGenError) throw err;
    throw new StoryGenError(
      'Không kết nối được máy chủ. Kiểm tra mạng và thử lại.',
      'network',
      err instanceof Error ? err.message : String(err),
    );
  }

  // Validate raw response shape
  const raw = respJson.story;
  if (!raw || typeof raw !== 'object') {
    throw new StoryGenError('Phản hồi từ AI không hợp lệ', 'gemini');
  }
  const validated = validateGeminiStory(raw, params);

  // Compile to Story (tokenize each sentence using the same pipeline as
  // source-data stories so rendering is identical)
  const story = compileGeneratedStory(validated, params);

  // Persist
  const userStory: UserStory = {
    id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date(),
    prompt: params,
    story,
    isFavorite: false,
    hskLevel: params.hskLevel,
    genre: params.genre,
  };
  await db.userStories.put(userStory);
  return userStory;
}

/**
 * Delete a user-generated story. Returns true on success, false if story
 * doesn't exist or is favorited (favorites are protected from accidental
 * deletion — user must un-star first).
 */
export async function deleteUserStory(id: string, force = false): Promise<boolean> {
  const story = await db.userStories.get(id);
  if (!story) return false;
  if (story.isFavorite && !force) return false;
  await db.userStories.delete(id);
  return true;
}

/** Toggle favorite flag. Returns the new state. */
export async function toggleFavorite(id: string): Promise<boolean> {
  const story = await db.userStories.get(id);
  if (!story) return false;
  const next = !story.isFavorite;
  await db.userStories.update(id, { isFavorite: next });
  return next;
}

/**
 * List user stories, newest first. Optionally filter by HSK level. Used by
 * TabStories to merge with source-data stories.
 */
export async function listUserStories(hskLevel?: HskLevel): Promise<UserStory[]> {
  const all = await db.userStories.orderBy('createdAt').reverse().toArray();
  return hskLevel ? all.filter((s) => s.hskLevel === hskLevel) : all;
}

// ────────────────────────────────────────────────────────────────────────
// Internal: validation
// ────────────────────────────────────────────────────────────────────────

interface RawGeminiStory {
  title: { zh: string; pinyin: string; vi: string };
  description: { zh: string; pinyin: string; vi: string };
  newWords?: NewWord[];
  rows: Array<{ zh: string; pinyin: string; vi: string } | 'P_BREAK'>;
}

/** Pinyin tone mark detection — covers all 4 tones across all 5 vowels. */
const TONE_MARK_RE = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/i;

/** Vietnamese diacritic detection — common combining marks. */
const VI_DIACRITIC_RE = /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;

function validateGeminiStory(
  raw: unknown,
  params: StoryGenParams,
): RawGeminiStory {
  const fail = (msg: string): never => {
    throw new StoryGenError(`AI trả về dữ liệu không hợp lệ: ${msg}`, 'gemini');
  };

  if (!raw || typeof raw !== 'object') fail('không phải object');
  const r = raw as Record<string, unknown>;

  // title / description shape
  for (const field of ['title', 'description'] as const) {
    const f = r[field] as Record<string, unknown> | undefined;
    if (!f || typeof f.zh !== 'string' || typeof f.pinyin !== 'string' || typeof f.vi !== 'string') {
      fail(`thiếu field "${field}"`);
    }
  }

  // rows
  const rows = r.rows;
  if (!Array.isArray(rows)) fail('rows không phải array');
  const sentenceRows = (rows as unknown[]).filter((row) => row !== 'P_BREAK');
  // Tolerance ±2 — Gemini sometimes off-by-one despite explicit instruction.
  // Stricter than that produces too many UX-blocking failures.
  if (Math.abs(sentenceRows.length - params.sentenceCount) > 2) {
    fail(
      `số câu sai (yêu cầu ${params.sentenceCount}, AI trả về ${sentenceRows.length})`,
    );
  }
  for (const row of sentenceRows) {
    if (typeof row !== 'object' || !row) fail('row không phải object');
    const sr = row as Record<string, unknown>;
    if (typeof sr.zh !== 'string' || !sr.zh.trim()) fail('row thiếu zh');
    if (typeof sr.pinyin !== 'string' || !sr.pinyin.trim()) fail('row thiếu pinyin');
    if (typeof sr.vi !== 'string' || !sr.vi.trim()) fail('row thiếu vi');
  }

  // Quality checks — sample-based to keep validation fast
  const samplePinyin = sentenceRows
    .map((row) => (row as { pinyin: string }).pinyin)
    .join(' ');
  if (!TONE_MARK_RE.test(samplePinyin)) {
    fail('pinyin không có dấu thanh');
  }
  const sampleVi = sentenceRows
    .map((row) => (row as { vi: string }).vi)
    .join(' ');
  if (!VI_DIACRITIC_RE.test(sampleVi)) {
    fail('tiếng Việt không có dấu (có thể AI fallback English)');
  }

  // newWords shape (optional but if present must be valid)
  const nw = r.newWords;
  if (nw !== undefined && !Array.isArray(nw)) fail('newWords không phải array');
  if (Array.isArray(nw)) {
    for (const w of nw) {
      const wo = w as Record<string, unknown>;
      if (typeof wo.id !== 'string' || typeof wo.hanzi !== 'string'
          || typeof wo.pinyin !== 'string' || typeof wo.vi !== 'string') {
        fail('newWord thiếu fields');
      }
    }
  }

  return r as unknown as RawGeminiStory;
}

// ────────────────────────────────────────────────────────────────────────
// Internal: compile (tokenize) the Gemini-validated story into a Story
// ────────────────────────────────────────────────────────────────────────

/**
 * Lazy-init vocab index — combining all 6 HSK lists. Used by the tokenizer
 * to classify each Chinese word as known/new. Reused across multiple
 * generations (cached after first call). Only the HSK pool is preset; new
 * words from each generation get folded in via a fresh call below.
 */
let cachedHskWords: ReturnType<typeof getCachedHskWords> | null = null;
function getCachedHskWords() {
  return [...hsk1, ...hsk2, ...hsk3, ...hsk4, ...hsk5, ...hsk6];
}
function getHskWords() {
  if (!cachedHskWords) cachedHskWords = getCachedHskWords();
  return cachedHskWords;
}

/**
 * Build a PinyinMap from existing source stories — gives the tokenizer fallback
 * pinyin for common multi-char tokens we already have data for.
 */
let cachedPinyinMap: PinyinMap | null = null;
function getPinyinMap(): PinyinMap {
  if (!cachedPinyinMap) {
    const map = new Map<string, string>();
    for (const story of sourceStories) {
      for (const para of story.paragraphs) {
        for (const sentence of para.sentences) {
          for (const tok of sentence.tokens) {
            if (tok.text && tok.pinyin && !map.has(tok.text)) {
              map.set(tok.text, tok.pinyin);
            }
          }
        }
      }
    }
    cachedPinyinMap = map;
  }
  return cachedPinyinMap;
}

function compileGeneratedStory(
  raw: RawGeminiStory,
  params: StoryGenParams,
): Story {
  const newWords: NewWord[] = (raw.newWords ?? []).map((nw) => ({
    id: nw.id,
    hanzi: nw.hanzi,
    pinyin: nw.pinyin,
    vi: nw.vi,
    storyIds: [],
  }));

  // Build vocab index fresh per generation — folds in this story's new words
  // alongside the static HSK pool. Cheap (a few thousand entries).
  const vocabIndex = buildVocabIndex(getHskWords(), newWords);

  // Pinyin map: source-story tokens + this story's newWords for fallback
  const pinyinMap = new Map(getPinyinMap());
  for (const nw of newWords) {
    if (!pinyinMap.has(nw.hanzi)) pinyinMap.set(nw.hanzi, nw.pinyin);
  }

  // Walk rows: P_BREAK starts a new paragraph; sentence rows tokenize.
  const paragraphs: StoryParagraph[] = [];
  let currentSentences: StorySentence[] = [];
  const vocabularyUsed = new Set<string>();

  const flushParagraph = () => {
    if (currentSentences.length > 0) {
      paragraphs.push({ sentences: currentSentences });
      currentSentences = [];
    }
  };

  for (const row of raw.rows) {
    if (row === 'P_BREAK') {
      flushParagraph();
      continue;
    }
    const tokens = tokenizeSentence(row.zh, vocabIndex, pinyinMap);
    for (const tok of tokens) {
      if (tok.type === 'hsk1' && tok.wordId) vocabularyUsed.add(tok.wordId);
    }
    currentSentences.push({
      zh: row.zh,
      pinyin: row.pinyin,
      vi: row.vi,
      tokens,
    });
  }
  flushParagraph();

  // Estimate reading time: ~80 chars/min for HSK learners reading aloud
  const totalChars = paragraphs
    .flatMap((p) => p.sentences)
    .reduce((sum, s) => sum + s.zh.length, 0);
  const estimatedMinutes = Math.max(1, Math.round(totalChars / 80));

  // Genre: if it's a known StoryGenre, keep typed; otherwise fall back to 'daily'
  // for typing. TabStories metadata table covers display labels for either.
  const knownGenres: StoryGenre[] = ['daily', 'comedy', 'horror', 'xianxia', 'sad', 'fantasy', 'mystery'];
  const genre = (knownGenres as string[]).includes(params.genre)
    ? (params.genre as StoryGenre)
    : 'daily';

  return {
    id: `usr_story_${Date.now()}`,
    genre,
    hskLevel: params.hskLevel,
    title: raw.title,
    description: raw.description,
    paragraphs,
    vocabularyUsed: [...vocabularyUsed],
    newWords,
    estimatedMinutes,
  };
}
