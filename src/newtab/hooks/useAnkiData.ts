import { useEffect, useState } from 'react';

/**
 * Anki HSK+ deck integration.
 *
 * Two JSON files in /src/data/zh/:
 *
 * - `anki_index.json` — small (~115KB), eagerly imported at app load. Maps
 *   wordId → { f: bitmap_flags, e: image_extension }.
 *   Bitmap: 1 = word audio, 2 = sentence audio, 4 = image.
 *   Used to know whether to render the 🎙️ Native button at all (UI hint
 *   that doesn't trigger any network).
 *
 * - `anki_data.json` — larger (~463KB), lazy-loaded on first WordDetail open
 *   so the new-tab page stays light. Maps wordId → { m, p, s, sp, se }
 *   short-keyed: meaning, pos, sentence, sentence-pinyin, sentence-en.
 *
 * Coverage stats (HSK+ deck from ankiweb, 4333 matched entries):
 *   - Word audio: 100% of matched
 *   - Sentence (text + audio + en): 61%
 *   - Image: 52%
 *
 * Where audio/image files live on disk:
 *   - /public/audio/zh/words-anki/{wordId}.mp3
 *   - /public/audio/zh/sentences-anki/{wordId}.mp3
 *   - /public/images/zh/words-anki/{wordId}.{ext}  (ext from index entry)
 */

import indexData from '../../data/zh/anki_index.json';

interface AnkiIndexEntry {
  /** Bitmap: 1 = word audio, 2 = sentence audio, 4 = image */
  f: number;
  /** Image extension without leading dot, e.g. 'jpg' or 'png'. null when no image. */
  e: string | null;
}

interface AnkiDataEntry {
  /** Meaning (English) */
  m: string;
  /** Part of speech (English, e.g. "noun", "verb") */
  p: string;
  /** Example sentence in Chinese */
  s: string;
  /** Sentence pinyin with tone marks. Occasionally null when source missing. */
  sp: string | null;
  /** Sentence English translation. Occasionally null when source missing. */
  se: string | null;
}

// Cast through unknown because Vite generates literal types for JSON keys
// (zh_001, zh_002, ...) which TS can't widen to a generic Record.
const INDEX = indexData as unknown as Record<string, AnkiIndexEntry>;

// Lazy-loaded data — populated on first call to ensureAnkiDataLoaded().
let cachedData: Record<string, AnkiDataEntry> | null = null;
let loadPromise: Promise<Record<string, AnkiDataEntry>> | null = null;

async function ensureAnkiDataLoaded(): Promise<Record<string, AnkiDataEntry>> {
  if (cachedData) return cachedData;
  if (loadPromise) return loadPromise;
  // Use dynamic import so Vite emits a separate chunk and the JSON only
  // downloads when WordDetail actually needs it.
  loadPromise = import('../../data/zh/anki_data.json').then((m) => {
    cachedData = m.default as unknown as Record<string, AnkiDataEntry>;
    return cachedData;
  });
  return loadPromise;
}

/**
 * Synchronous lookup: does this wordId have any Anki content at all?
 * Cheap (just object key check on the small eagerly-loaded index).
 */
export function hasAnkiContent(wordId: string): boolean {
  return wordId in INDEX;
}

/**
 * Synchronous flag check: native word audio MP3 exists on disk?
 * Use to decide whether to render the 🎙️ button.
 */
export function hasNativeWordAudio(wordId: string): boolean {
  const entry = INDEX[wordId];
  return !!entry && (entry.f & 1) !== 0;
}

/**
 * Synchronous flag check: native sentence audio MP3 exists on disk?
 */
export function hasNativeSentenceAudio(wordId: string): boolean {
  const entry = INDEX[wordId];
  return !!entry && (entry.f & 2) !== 0;
}

/**
 * Synchronous: get image URL if Anki has one for this word, else null.
 * Returns chrome-extension:// URL ready for <img src={...}>.
 */
export function getAnkiImageUrl(wordId: string): string | null {
  const entry = INDEX[wordId];
  if (!entry || (entry.f & 4) === 0 || !entry.e) return null;
  // chrome.runtime.getURL resolves paths against the extension's bundled
  // assets (everything under /public/ at build time). Wrapped in try/catch
  // for safety — chrome.runtime is always defined inside the extension,
  // but undefined when running unit tests outside Chrome.
  try {
    return chrome.runtime.getURL(`images/zh/words-anki/${wordId}.${entry.e}`);
  } catch {
    return `/images/zh/words-anki/${wordId}.${entry.e}`;
  }
}

/**
 * React hook: lazy-load full Anki data for a single wordId. Returns null
 * while loading or if the word has no Anki sentence content.
 *
 * Triggers the network fetch on first render that asks for any wordId; all
 * subsequent calls share the cache.
 */
export function useAnkiData(wordId: string | null | undefined): AnkiDataEntry | null {
  const [entry, setEntry] = useState<AnkiDataEntry | null>(() => {
    // If data already loaded synchronously (subsequent component mount),
    // return immediately without flicker.
    if (!wordId) return null;
    if (cachedData) return cachedData[wordId] ?? null;
    return null;
  });

  useEffect(() => {
    if (!wordId) {
      setEntry(null);
      return;
    }
    if (cachedData) {
      setEntry(cachedData[wordId] ?? null);
      return;
    }
    // First-time fetch: kick off async load.
    let cancelled = false;
    ensureAnkiDataLoaded().then((data) => {
      if (cancelled) return;
      setEntry(data[wordId] ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [wordId]);

  return entry;
}
