/**
 * MyMemory translation service.
 *
 * Why MyMemory (vs DeepL/Google/Azure):
 *   - No signup required, no credit card required, no API key required
 *   - 5,000 chars/day anonymous, 50,000 chars/day with email (still free)
 *   - Public REST endpoint, simple GET request
 *   - Supports vi, zh, en — the language pairs we need
 *
 * Trade-offs:
 *   - Translation quality slightly lower than DeepL/Google for nuanced text
 *   - For vocabulary/sentence learning the quality is fine — short phrases
 *     translate predictably well from a human-translation memory database
 *   - Daily quota resets at midnight UTC (NOT Vietnam time — 7 AM Hanoi)
 *
 * Caching:
 *   - Local cache (IndexedDB) keyed on (text, from, to). Repeat queries don't
 *     hit the API and don't count against the daily quota.
 *   - 30-day TTL — translations of common phrases are stable.
 *
 * Personal vs multi-user note:
 *   This is currently personal-use code. The 5-50K daily quota is per-IP, so
 *   at multi-user scale users would share Jason's IP-based quota. If/when this
 *   goes multi-user, we proxy through a backend that injects each user's own
 *   email (or use Microsoft Azure 2M chars/month).
 */

import type { Language } from '../types';
import { db } from './db';

const MYMEMORY_API_URL = 'https://api.mymemory.translated.net/get';
const CACHE_PREFIX = 'translate:';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// Per-user-supplied email for the higher quota tier. Stored locally only.
// MyMemory ToS: providing an email = 50K chars/day instead of 5K.
const EMAIL_STORAGE_KEY = 'translate:user_email';

export type TranslateLang = 'zh' | 'vi' | 'en';

/**
 * MyMemory accepts standard ISO codes. For Chinese we explicitly use `zh-CN`
 * (mainland simplified) — without the suffix it sometimes returns traditional.
 */
const LANG_CODE: Record<TranslateLang, string> = {
  zh: 'zh-CN',
  vi: 'vi',
  en: 'en',
};

export interface TranslateResult {
  translatedText: string;
  /** Confidence score from MyMemory (0-1). UI hints when it's low. */
  matchQuality?: number;
  /** True if the result came from cache, not the API. */
  fromCache: boolean;
}

export class TranslateError extends Error {
  constructor(
    public code: 'quota_exceeded' | 'rate_limited' | 'invalid_input' | 'network' | 'unknown',
    message: string,
  ) {
    super(message);
    this.name = 'TranslateError';
  }
}

export function defaultPairFor(targetLang: Language): { from: TranslateLang; to: TranslateLang } {
  if (targetLang === 'zh') return { from: 'vi', to: 'zh' };
  return { from: 'vi', to: 'en' };
}

// ────────────────────────────────────────────────────────────────────────────
// Email config (optional, raises quota from 5K → 50K chars/day)
// ────────────────────────────────────────────────────────────────────────────

export async function getStoredEmail(): Promise<string | null> {
  try {
    const row = await db.cache.get(EMAIL_STORAGE_KEY);
    if (!row) return null;
    const email = row.value as string;
    return typeof email === 'string' && email.length > 0 ? email : null;
  } catch {
    return null;
  }
}

export async function setStoredEmail(email: string): Promise<void> {
  await db.cache.put({
    key: EMAIL_STORAGE_KEY,
    value: email.trim(),
    createdAt: new Date(),
  });
}

export async function clearStoredEmail(): Promise<void> {
  await db.cache.delete(EMAIL_STORAGE_KEY).catch(() => {});
}

// ────────────────────────────────────────────────────────────────────────────
// Cache layer — uses the shared `cache` table in Dexie
// ────────────────────────────────────────────────────────────────────────────

interface CacheEntry {
  text: string;
  matchQuality?: number;
  cachedAt: number;
}

function cacheKey(text: string, from: TranslateLang, to: TranslateLang): string {
  // Normalize whitespace + lowercase for stable cache keys regardless of how
  // the user typed it. "Hello" and "hello" should hit the same cache entry.
  // Note: for Chinese this is a no-op (no case in hanzi); for VI/EN it
  // collapses casing variants. Quoted brand names that depend on casing
  // are an edge case we accept losing precision on.
  const normalized = text.trim().replace(/\s+/g, ' ').toLowerCase();
  return `${CACHE_PREFIX}${from}:${to}:${normalized}`;
}

async function readCache(key: string): Promise<CacheEntry | null> {
  try {
    const row = await db.cache.get(key);
    if (!row) return null;
    const entry = row.value as CacheEntry;
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
      await db.cache.delete(key).catch(() => {});
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

async function writeCache(key: string, entry: CacheEntry): Promise<void> {
  try {
    await db.cache.put({
      key,
      value: entry,
      createdAt: new Date(),
    });
  } catch (err) {
    console.warn('[translate] cache write failed:', err);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Main translate function
// ────────────────────────────────────────────────────────────────────────────

/**
 * Direct API call helper. Returns null on logical errors so callers can decide
 * whether to retry with a different strategy (e.g. bridge through English).
 */
async function callApi(
  text: string,
  fromCode: string,
  toCode: string,
  email: string | null,
): Promise<{ text: string; quality: number } | { error: TranslateError }> {
  const params = new URLSearchParams();
  params.append('q', text);
  params.append('langpair', `${fromCode}|${toCode}`);
  if (email) params.append('de', email);

  let response: Response;
  try {
    response = await fetch(`${MYMEMORY_API_URL}?${params.toString()}`, { method: 'GET' });
  } catch {
    return { error: new TranslateError('network', 'Không kết nối được mạng — thử lại sau') };
  }

  if (!response.ok) {
    if (response.status === 429) {
      return { error: new TranslateError('rate_limited', 'Đang gửi quá nhanh — chờ vài giây rồi thử lại') };
    }
    return { error: new TranslateError('unknown', `Lỗi không xác định (HTTP ${response.status})`) };
  }

  const data = (await response.json()) as {
    responseData?: { translatedText: string; match: number };
    responseStatus: number;
    responseDetails?: string;
  };

  if (data.responseStatus === 429) {
    return {
      error: new TranslateError(
        'quota_exceeded',
        email
          ? 'Đã hết quota 50K ký tự hôm nay. Reset lúc 7 giờ sáng (giờ VN).'
          : 'Đã hết quota 5K ký tự hôm nay. Thêm email vào cài đặt để tăng lên 50K/ngày.',
      ),
    };
  }

  if (data.responseStatus !== 200 || !data.responseData) {
    return {
      error: new TranslateError('unknown', data.responseDetails || 'API trả về kết quả không hợp lệ'),
    };
  }

  return {
    text: data.responseData.translatedText,
    quality: data.responseData.match,
  };
}

/**
 * Heuristics to detect a "bad" translation result that should trigger the
 * English-bridge fallback. MyMemory's direct vi↔zh route often returns either
 * the input echoed back, the literal string "中文", or a very low match score.
 */
function isBadResult(input: string, output: string, quality: number): boolean {
  const trimmed = output.trim();
  // Empty or echo of input
  if (!trimmed) return true;
  if (trimmed === input.trim()) return true;
  // MyMemory's "I don't know" placeholder for Chinese pair
  if (trimmed === '中文' || trimmed === '中文/Chinese' || trimmed.toLowerCase() === 'chinese') return true;
  // Very low match score = MT didn't really know
  if (quality < 0.3) return true;
  return false;
}

export async function translateText(
  text: string,
  from: TranslateLang,
  to: TranslateLang,
): Promise<TranslateResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new TranslateError('invalid_input', 'Vui lòng nhập văn bản cần dịch');
  }
  if (trimmed.length > 500) {
    throw new TranslateError(
      'invalid_input',
      'Văn bản quá dài (tối đa 500 ký tự mỗi lần)',
    );
  }

  const key = cacheKey(trimmed, from, to);
  const cached = await readCache(key);
  if (cached) {
    return {
      translatedText: cached.text,
      matchQuality: cached.matchQuality,
      fromCache: true,
    };
  }

  const email = await getStoredEmail();

  // Strategy: try direct first. If it returns a bad result AND the pair is
  // vi↔zh (which MyMemory handles poorly directly), retry via English bridge.
  // For other pairs (vi↔en, en↔zh) the direct route works fine.
  const direct = await callApi(trimmed, LANG_CODE[from], LANG_CODE[to], email);
  if ('error' in direct) throw direct.error;

  let finalText = direct.text;
  let finalQuality = direct.quality;

  const isViZhPair =
    (from === 'vi' && to === 'zh') || (from === 'zh' && to === 'vi');

  if (isViZhPair && isBadResult(trimmed, direct.text, direct.quality)) {
    // Bridge through English: source → en → target
    // This costs 2x quota but quality is much higher for vi↔zh pair.
    const step1 = await callApi(trimmed, LANG_CODE[from], 'en', email);
    if (!('error' in step1) && !isBadResult(trimmed, step1.text, step1.quality)) {
      const step2 = await callApi(step1.text, 'en', LANG_CODE[to], email);
      if (!('error' in step2) && !isBadResult(step1.text, step2.text, step2.quality)) {
        finalText = step2.text;
        // Combined quality = product of both step qualities (rough estimate)
        finalQuality = step1.quality * step2.quality;
      }
      // If bridge also failed, fall through with the original direct result
      // so the UI at least shows something rather than an error.
    }
  }

  // Only cache results we'd actually want to serve again.
  // Caching a "bad result" (the literal "中文" placeholder, an echo of the
  // input, or a very low-quality machine translation) would poison the cache
  // — every subsequent identical query would return the bad answer for 30
  // days without retrying the bridge. So we skip the write in that case and
  // let the next call attempt the API path again.
  const isFinalBad = isBadResult(trimmed, finalText, finalQuality);
  if (!isFinalBad) {
    await writeCache(key, {
      text: finalText,
      matchQuality: finalQuality,
      cachedAt: Date.now(),
    });
  }

  return {
    translatedText: finalText,
    matchQuality: finalQuality,
    fromCache: false,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// History — last N translations
// ────────────────────────────────────────────────────────────────────────────

const HISTORY_KEY = 'translate:history';
const HISTORY_MAX = 30;

export interface HistoryEntry {
  id: string;
  sourceText: string;
  translatedText: string;
  from: TranslateLang;
  to: TranslateLang;
  createdAt: number;
}

export async function getHistory(): Promise<HistoryEntry[]> {
  try {
    const row = await db.cache.get(HISTORY_KEY);
    if (!row) return [];
    return (row.value as HistoryEntry[]) ?? [];
  } catch {
    return [];
  }
}

export async function addToHistory(entry: Omit<HistoryEntry, 'id' | 'createdAt'>): Promise<void> {
  const history = await getHistory();
  const next: HistoryEntry = {
    ...entry,
    id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
  const dedupWindow = 5 * 60 * 1000;
  const recent = history.findIndex(
    (h) =>
      h.sourceText === entry.sourceText &&
      h.from === entry.from &&
      h.to === entry.to &&
      Date.now() - h.createdAt < dedupWindow,
  );
  if (recent !== -1) history.splice(recent, 1);

  history.unshift(next);
  if (history.length > HISTORY_MAX) history.length = HISTORY_MAX;

  await db.cache.put({
    key: HISTORY_KEY,
    value: history,
    createdAt: new Date(),
  });
}

export async function clearHistory(): Promise<void> {
  await db.cache.delete(HISTORY_KEY).catch(() => {});
}
