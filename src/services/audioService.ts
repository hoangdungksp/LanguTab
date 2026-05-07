/**
 * Audio playback service for words, example sentences and phonemes.
 *
 * Priority order:
 *   1. Pre-generated MP3 bundled under /public/audio/{lang}/ (via scripts/gen_kokoro_mac.py
 *      or gen_google_mac.py). Single source of truth is the manifest below.
 *   2. Web Speech API fallback — always available, robot voice.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Manifest schema (public/audio/{lang}/manifest.json)
 * ─────────────────────────────────────────────────────────────────────────
 *
 * {
 *   "generated_at": "2026-04-22T12:00:00Z",
 *   "generator":    "cosyvoice",                    // or "kokoro", "google", "azure"
 *   "voice":        "zf_xiaoxiao",
 *   "total_files":  214,
 *   "entries": {
 *     "words/zh_001":        { "default": "words/zh_001.mp3" },
 *     "words/zh_002":        { "normal":  "words/zh_002_normal.mp3",
 *                              "slow":    "words/zh_002_slow.mp3" },
 *     "sentences/zh_001":    { "default": "sentences/zh_001.mp3" },
 *     "initials/zh_init_b":  { "default": "initials/zh_init_b.mp3" },
 *     "finals/zh_fin_a":     { "default": "finals/zh_fin_a.mp3" },
 *     "tones/zh_tone_1":     { "default": "tones/zh_tone_1.mp3" }
 *   }
 * }
 *
 * Resolve order for a given speed:
 *   entries[key][speed] ?? entries[key].default
 *
 * When only "default" exists, slow playback is achieved by lowering
 * HTMLAudioElement.playbackRate. Tiered files give cleaner results — if they
 * ever exist they override the playbackRate hack.
 *
 * Folder convention:
 *   words/{wordId}[_speed].mp3           — word term audio
 *   sentences/{wordId}[_speed].mp3       — example sentence audio
 *   initials/{phonemeId}.mp3             — pinyin initial
 *   finals/{phonemeId}.mp3               — pinyin final
 *   tones/{phonemeId}.mp3                — pinyin tone
 *   consonants/{phonemeId}.mp3           — IPA consonant
 *   vowels/{phonemeId}.mp3               — IPA vowel
 */

import type { Language } from '../types';

// ————————————— Manifest types —————————————

/**
 * One audio asset can have multiple variants (default, normal, slow, ...).
 * We always prefer an exact speed match; "default" is the catch-all.
 */
export interface AudioManifestEntry {
  /** Single-file fallback — used when normal/slow not available for this item. */
  default?: string;
  /** Explicit 1.0× speed. */
  normal?: string;
  /** Explicit ~0.7× speed file. */
  slow?: string;
}

export interface AudioManifest {
  generated_at: string;
  /** Engine that produced the audio — informational, not used for playback. */
  generator?: string;
  /** Voice identifier — informational. */
  voice?: string;
  /** Number of entries. */
  total_files: number;
  /** Key → variant paths. Keys follow `{folder}/{id}` convention. */
  entries: Record<string, AudioManifestEntry>;
}

/** Speed label — matches manifest variant names. */
export type AudioSpeed = 'normal' | 'slow';

/** Scope: term, example sentence, or a phoneme under one of its sub-folders. */
export type AudioScope = 'word' | 'sentence';

/** Playback rate used when we only have `default` and user asked for slow. */
const SLOW_PLAYBACK_RATE = 0.7;

// ————————————— State —————————————

const manifestCache: Record<Language, AudioManifest | null> = {
  zh: null,
  en: null,
};
const manifestLoading: Record<Language, Promise<AudioManifest | null> | null> = {
  zh: null,
  en: null,
};
/**
 * Negative cache: once we've confirmed a language has no bundled manifest
 * (e.g. English currently — no gen script exists for `en` yet), remember it
 * so we don't refetch on every single card play. Without this, every word
 * played in a language-without-audio triggered a fresh failed fetch and a
 * matching warning in the Chrome extension Errors panel.
 */
const manifestMissing: Record<Language, boolean> = {
  zh: false,
  en: false,
};

// Blob URL cache keyed by `{lang}:{relPath}` — prevents refetching on repeat plays.
const blobUrlCache = new Map<string, string>();

// ————————————— Manifest loading —————————————

/**
 * Load the audio manifest for a language. Returns null if the file doesn't
 * exist (means audio wasn't pre-generated yet — Web Speech fallback will kick in).
 *
 * Negative results are cached in `manifestMissing` so we only probe the
 * filesystem once per language per session.
 *
 * Error logging policy:
 *   - "file not bundled" (TypeError from chrome-extension:// fetch) is the
 *     expected path when a language has no generated audio → `console.debug`
 *     so it doesn't surface in chrome://extensions Errors panel.
 *   - Anything else (JSON corruption, unexpected permission issues) → still
 *     `console.warn` so real bugs don't get silently swallowed.
 */
async function loadManifest(lang: Language): Promise<AudioManifest | null> {
  if (manifestCache[lang]) return manifestCache[lang];
  if (manifestMissing[lang]) return null;
  if (manifestLoading[lang]) return manifestLoading[lang];

  const promise = (async () => {
    try {
      const url = chrome.runtime.getURL(`audio/${lang}/manifest.json`);
      const res = await fetch(url);
      if (!res.ok) {
        manifestMissing[lang] = true;
        return null;
      }
      const json = (await res.json()) as AudioManifest;
      manifestCache[lang] = json;
      return json;
    } catch (err) {
      manifestMissing[lang] = true;
      // TypeError from chrome-extension:// fetch = file not in extension bundle.
      // Expected when a language hasn't been generated yet — don't pollute
      // the Errors panel with this known-and-handled case.
      if (err instanceof TypeError) {
        console.debug(
          `[audio] no bundled manifest for ${lang} — Web Speech fallback will be used`,
        );
      } else {
        console.warn(`[audio] failed to load ${lang} manifest:`, err);
      }
      return null;
    } finally {
      manifestLoading[lang] = null;
    }
  })();

  manifestLoading[lang] = promise;
  return promise;
}

// ————————————— Path resolution —————————————

/**
 * Resolve the best audio path for a given entry + desired speed.
 *
 * Priority:
 *   1. Exact speed match (`entry.slow` or `entry.normal`)
 *   2. `entry.default` with playbackRate adjustment at the <audio> level
 *   3. null — caller should fall back to Web Speech
 */
function resolveVariant(
  entry: AudioManifestEntry | undefined,
  speed: AudioSpeed,
): { path: string; needsRateAdjust: boolean } | null {
  if (!entry) return null;
  const exact = entry[speed];
  if (exact) return { path: exact, needsRateAdjust: false };
  if (entry.default) {
    return { path: entry.default, needsRateAdjust: speed === 'slow' };
  }
  return null;
}

/** Build manifest key for a word or sentence: `words/zh_001` or `sentences/en_042`. */
function wordKey(scope: AudioScope, wordId: string): string {
  const folder = scope === 'word' ? 'words' : 'sentences';
  return `${folder}/${wordId}`;
}

/**
 * Maps ZH phoneme IDs to pinyin-chart syllable+tone keys, reusing the
 * DigMandarin audio that was downloaded for the chart. This avoids needing
 * a separate set of phoneme audio files.
 *
 * Per user mapping:
 *   - Initials use a "demonstration syllable" formed from initial + canonical
 *     vowel (b→bo, d→de, j→ji, zh→zhi, z→zi, etc).
 *   - Finals use the zero-initial pinyin chart audio for that final.
 *   - Tones use ma{tone} as a clear demonstration syllable.
 *
 * Returns null if no clean mapping exists. The two finals 'ei' and 'ong' have
 * no standalone audio in DigMandarin's chart (they're only sung after consonants
 * in modern Mandarin), so the closest available syllables are used as fallback:
 *   - ei  → wei  (heard as [wei], the ei sound is clear after the brief glide)
 *   - ong → yong (heard as [jʊŋ], same caveat with y-glide)
 */
const ZH_PHONEME_TO_PINYIN_CHART: Record<string, string> = {
  // ── Initials: <initial> + <neutral vowel> at tone 1 ──
  // Lip/labial: b/p/m/f → +o
  zh_init_b: 'bo1',
  zh_init_p: 'po1',
  zh_init_m: 'mo1',
  zh_init_f: 'fo1',
  // Alveolar: d/t/n/l → +e
  zh_init_d: 'de1',
  zh_init_t: 'te1',
  zh_init_n: 'ne1',
  zh_init_l: 'le1',
  // Velar: g/k/h → +e
  zh_init_g: 'ge1',
  zh_init_k: 'ke1',
  zh_init_h: 'he1',
  // Palatal: j/q/x → +i (always followed by /i/ or /y/)
  zh_init_j: 'ji1',
  zh_init_q: 'qi1',
  zh_init_x: 'xi1',
  // Retroflex: zh/ch/sh/r → +i (apical retroflex)
  zh_init_zh: 'zhi1',
  zh_init_ch: 'chi1',
  zh_init_sh: 'shi1',
  zh_init_r: 'ri1',
  // Dental sibilant: z/c/s → +i (apical dental)
  zh_init_z: 'zi1',
  zh_init_c: 'ci1',
  zh_init_s: 'si1',

  // ── Finals: zero-initial syllable at tone 1 ──
  // Simple finals
  zh_fin_a: 'a1',
  zh_fin_o: 'o1',
  zh_fin_e: 'e1',
  zh_fin_i: 'yi1',
  zh_fin_u: 'wu1',
  zh_fin_u_umlaut: 'yu1',
  zh_fin_er: 'er1',
  // Compound finals
  zh_fin_ai: 'ai1',
  zh_fin_ei: 'wei1',  // no standalone "ei" in DigMandarin chart — closest match
  zh_fin_ao: 'ao1',
  zh_fin_ou: 'ou1',
  zh_fin_an: 'an1',
  zh_fin_en: 'en1',
  zh_fin_ang: 'ang1',
  zh_fin_eng: 'eng1',
  zh_fin_ing: 'ying1',
  zh_fin_ong: 'yong1',  // no standalone "ong" — closest match
  // i-prefix compounds (zero-initial → y-prefix orthography)
  zh_fin_ia: 'ya1',
  zh_fin_ie: 'ye1',
  zh_fin_iao: 'yao1',
  zh_fin_iou: 'you1',
  zh_fin_ian: 'yan1',
  zh_fin_in: 'yin1',
  zh_fin_iang: 'yang1',
  zh_fin_iong: 'yong1',
  // u-prefix compounds (zero-initial → w-prefix orthography)
  zh_fin_ua: 'wa1',
  zh_fin_uo: 'wo1',
  zh_fin_uai: 'wai1',
  zh_fin_uei: 'wei1',
  zh_fin_uan: 'wan1',
  zh_fin_uen: 'wen1',
  zh_fin_uang: 'wang1',
  zh_fin_ueng: 'weng1',
  // ü-prefix compounds (zero-initial → yu- orthography, dropping umlaut)
  zh_fin_ue: 'yue1',
  zh_fin_uan_u: 'yuan1',
  zh_fin_un_u: 'yun1',
  // Special "buzzed" i finals — use the prototypical zhi/zi syllable
  zh_fin_i_retroflex: 'zhi1',
  zh_fin_i_apical: 'zi1',

  // ── Tones: ma{tone} as the demonstration syllable ──
  // 'ma' is the canonical Mandarin tone teaching example (ma/má/mǎ/mà).
  zh_tone_1: 'ma1',
  zh_tone_2: 'ma2',
  zh_tone_3: 'ma3',
  zh_tone_4: 'ma4',
  // Neutral tone — use ma1 as the closest stable reference (no tone-mark file).
  zh_tone_0: 'ma1',
};

/**
 * Infer manifest key for a phoneme based on its id prefix.
 *
 *   zh_init_b   → pinyin-chart/bo1     (DigMandarin demo syllable for /b/)
 *   zh_fin_a    → pinyin-chart/a1      (DigMandarin zero-initial /a/)
 *   zh_tone_1   → pinyin-chart/ma1
 *   en_cons_θ   → consonants/en_cons_θ
 *   en_vowel_iː → vowels/en_vowel_iː
 *
 * For ZH phonemes, all initials/finals/tones reuse the DigMandarin pinyin-chart
 * audio via the ZH_PHONEME_TO_PINYIN_CHART mapping. For EN phonemes, fall back
 * to the original folder-based scheme.
 *
 * Returns null if the id doesn't match a known phoneme prefix.
 */
function phonemeKey(phonemeId: string): string | null {
  // ZH phonemes → reuse pinyin-chart audio
  const pinyinChartSyllable = ZH_PHONEME_TO_PINYIN_CHART[phonemeId];
  if (pinyinChartSyllable) {
    return `pinyin-chart/${pinyinChartSyllable}`;
  }
  // EN phonemes → original folder scheme
  if (phonemeId.startsWith('en_cons_')) return `consonants/${phonemeId}`;
  if (phonemeId.startsWith('en_vowel_')) return `vowels/${phonemeId}`;
  return null;
}

// ————————————— Playback —————————————

/** Play a bundled MP3 given its relative path under audio/{lang}/. */
async function playBundled(
  lang: Language,
  relPath: string,
  playbackRate: number,
): Promise<void> {
  const cacheKey = `${lang}:${relPath}`;
  let blobUrl = blobUrlCache.get(cacheKey);

  if (!blobUrl) {
    const url = chrome.runtime.getURL(`audio/${lang}/${relPath}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Audio file missing: ${relPath}`);
    const blob = await res.blob();
    blobUrl = URL.createObjectURL(blob);
    blobUrlCache.set(cacheKey, blobUrl);
  }

  const audio = new Audio(blobUrl);
  audio.preload = 'auto';
  audio.playbackRate = playbackRate;
  await audio.play();

  // Wait for playback to end so UI can show a playing indicator
  await new Promise<void>((resolve) => {
    audio.addEventListener('ended', () => resolve(), { once: true });
    audio.addEventListener('error', () => resolve(), { once: true });
  });
}

/**
 * Web Speech fallback. Not ideal but always available.
 * Speed maps to SpeechSynthesisUtterance.rate (0.9 = normal, 0.6 = slow).
 */
function playWebSpeech(text: string, lang: Language, speed: AudioSpeed): void {
  if (!('speechSynthesis' in window)) {
    console.warn('[audio] speechSynthesis unavailable');
    return;
  }
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
  utter.rate = speed === 'slow' ? 0.6 : 0.9;
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}

// ————————————— Public API —————————————

/**
 * Play audio for a word's term or example sentence at the requested speed.
 *
 * @param wordId  Word ID from data files, e.g. "zh_001" or "en_042"
 * @param scope   'word' (the term itself) or 'sentence' (the example sentence)
 * @param text    Fallback text for Web Speech if no bundled file exists
 * @param lang    Language
 * @param speed   'normal' (1.0×) or 'slow' (0.7×)
 */
/**
 * Voice identifier for word/sentence audio.
 *
 * - 'male' / 'female' — CosyVoice AI generated voices (longanyang / Cherry)
 * - 'native' — Native human voice extracted from Anki HSK+ deck.
 *   Only available for ~92% of HSK 1-6 words (the ones Jason's deck covers).
 *   Files live at /audio/zh/words-anki/{wordId}.mp3 (and sentences-anki/...
 *   for sentence audio); coverage map is in /src/data/zh/anki_index.json.
 */
export type AudioVoice = 'male' | 'female' | 'native';

/**
 * Play word or sentence audio.
 *
 * Voice resolution order depends on `voice`:
 *   - 'native' → /audio/zh/words-anki/{wordId}.mp3 (Anki MP3, no manifest)
 *                → fallthrough to manifest male voice if file missing.
 *   - 'male' or 'female' → manifest lookup (CosyVoice-generated, with the
 *     legacy non-gendered fallback chain we already had).
 *
 * If everything fails, Web Speech reads the text out loud (robot voice).
 *
 * @param wordId  Stable id like 'zh_001'
 * @param scope   'word' or 'sentence'
 * @param text    Fallback text for Web Speech
 * @param lang    Language
 * @param speed   'normal' (1.0×) or 'slow' (0.7×)
 * @param voice   'male' (default), 'female', or 'native'
 */
export async function playWordAudio(
  wordId: string,
  scope: AudioScope,
  text: string,
  lang: Language,
  speed: AudioSpeed = 'normal',
  voice: AudioVoice = 'male',
): Promise<void> {
  // Native Anki audio: direct file path, no manifest lookup. Falls back to AI
  // if the file is missing (Anki coverage is ~92% words / 61% sentences).
  if (voice === 'native' && lang === 'zh') {
    const folder = scope === 'sentence' ? 'sentences-anki' : 'words-anki';
    const path = `${folder}/${wordId}.mp3`;
    try {
      const rate = speed === 'slow' ? SLOW_PLAYBACK_RATE : 1.0;
      await playBundled(lang, path, rate);
      return;
    } catch {
      // File doesn't exist → fall through to AI male voice as fallback
      // so the user still gets audio rather than silence.
    }
  }

  // AI voices (and native fallback): use manifest-based lookup.
  const aiGender: 'male' | 'female' = voice === 'female' ? 'female' : 'male';
  const manifest = await loadManifest(lang);

  // Lookup chain: gender-specific folder first, fall back to legacy single voice.
  //   1. words-{gender}/{id}      ← preferred (CosyVoice gendered audio)
  //   2. words/{id}               ← legacy Cherry/Kokoro/etc generated earlier
  //
  // Same chain mirrors phoneme-examples logic so the user can install the
  // gender-specific generator script later without breaking existing setups.
  const candidateKeys = [
    `${scope === 'sentence' ? 'sentences' : 'words'}-${aiGender}/${wordId}`,
    wordKey(scope, wordId),
  ];

  for (const key of candidateKeys) {
    const entry = manifest?.entries[key];
    const variant = resolveVariant(entry, speed);
    if (!variant) continue;

    try {
      const rate = variant.needsRateAdjust ? SLOW_PLAYBACK_RATE : 1.0;
      await playBundled(lang, variant.path, rate);
      return;
    } catch (err) {
      console.warn(`[audio] bundled playback failed for ${key}:`, err);
      // Try next candidate (e.g. fall through to legacy key)
    }
  }

  playWebSpeech(text, lang, speed);
}

/**
 * Play audio for a phoneme.
 *
 * Tries bundled MP3 first — Kokoro handles tone 3 correctly for ZH, making
 * bundled playback viable (this was not possible with Chirp 3 HD, hence the
 * old unconditional Web Speech fallback).
 *
 * @param phonemeId  Phoneme id like "zh_init_b". Determines manifest folder.
 * @param fallbackText  Text to speak via Web Speech if bundled lookup fails.
 *                      Caller should pass `phoneme.exampleWord` (like "八"),
 *                      NOT `phoneme.symbol` ("b") — Web Speech would otherwise
 *                      read "b" as English letter "bee".
 * @param lang  Language.
 */
export async function playPhonemeAudio(
  phonemeId: string,
  fallbackText: string,
  lang: Language,
  speed: AudioSpeed = 'normal',
): Promise<void> {
  const key = phonemeKey(phonemeId);
  if (key) {
    const manifest = await loadManifest(lang);
    const entry = manifest?.entries[key];
    const variant = resolveVariant(entry, speed);
    if (variant) {
      try {
        const rate = variant.needsRateAdjust || speed === 'slow' ? SLOW_PLAYBACK_RATE : 1.0;
        await playBundled(lang, variant.path, rate);
        return;
      } catch (err) {
        console.warn(`[audio] bundled phoneme playback failed for ${key}:`, err);
        // Fall through to Web Speech
      }
    }
  }

  // Fallback: speak the example word slowly so learners hear detail.
  playWebSpeech(fallbackText, lang, speed === 'slow' ? 'slow' : 'slow');
}

/** Release cached Blob URLs. Call on tab hide / memory pressure. */
export function clearAudioCache(): void {
  for (const url of blobUrlCache.values()) {
    URL.revokeObjectURL(url);
  }
  blobUrlCache.clear();
}

/**
 * Play the EXAMPLE WORD audio for a phoneme (e.g. for zh_init_b → "八", "ba1").
 *
 * Distinct from `playPhonemeAudio`:
 *   - playPhonemeAudio plays the phoneme itself (initial/final/tone in isolation,
 *     mapped to a DigMandarin pinyin-chart syllable like "bo1").
 *   - playPhonemeExampleAudio plays the FULL example word (hanzi) using a
 *     CosyVoice or Cherry voice TTS recording, generated by one of the
 *     `gen_phoneme_examples_*.py` scripts.
 *
 * Manifest key resolution (gender-aware, with fallback chain):
 *   1. `phoneme-examples-{gender}/{phonemeId}` — preferred, gender-specific
 *   2. `phoneme-examples/{phonemeId}`         — legacy single-voice (Cherry)
 *
 * The fallback ensures the app keeps working for users who haven't yet
 * generated gender-specific audio (only have the older Cherry/Qwen output).
 *
 * @param phonemeId    Phoneme id like "zh_init_b". Used as manifest key.
 * @param fallbackText Hanzi text to speak via Web Speech if bundled file missing.
 *                     Caller should pass `phoneme.exampleWord` (e.g. "八").
 * @param lang         Language (always 'zh' currently — only ZH has examples).
 * @param speed        normal / slow.
 * @param gender       Preferred speaker gender ('male' | 'female').
 */
export async function playPhonemeExampleAudio(
  phonemeId: string,
  fallbackText: string,
  lang: Language,
  speed: AudioSpeed = 'normal',
  gender: 'male' | 'female' = 'male',
): Promise<void> {
  const manifest = await loadManifest(lang);

  // Try gender-specific key first, then fall back to the legacy unified key.
  // Going via an array keeps the "try X then Y" logic compact without nested ifs.
  const candidateKeys = [
    `phoneme-examples-${gender}/${phonemeId}`,
    `phoneme-examples/${phonemeId}`,
  ];

  for (const key of candidateKeys) {
    const entry = manifest?.entries[key];
    const variant = resolveVariant(entry, speed);
    if (!variant) continue;

    try {
      const rate = variant.needsRateAdjust || speed === 'slow' ? SLOW_PLAYBACK_RATE : 1.0;
      console.info(`[phoneme-example] ${phonemeId} (${gender}) → file=${variant.path}`);
      await playBundled(lang, variant.path, rate);
      return;
    } catch (err) {
      console.warn(`[audio] bundled phoneme-example playback failed for ${key}:`, err);
      // Try next candidate (e.g. fall through to legacy key)
    }
  }

  console.warn(
    `[phoneme-example] NO BUNDLED AUDIO for "${phonemeId}" (gender=${gender}) — falling back to Web Speech. ` +
      `Run scripts/gen_phoneme_examples_cosyvoice_mac.py to generate.`,
  );

  // Fallback: Web Speech reading the hanzi.
  playWebSpeech(fallbackText, lang, speed === 'slow' ? 'slow' : 'slow');
}

/**
 * Play a single pinyin syllable at a specific tone from the bundled pinyin
 * chart (davinfifield audio, downloaded via scripts/download_pinyin_chart_audio.py).
 *
 * @param syllable  Pinyin syllable without tone mark, e.g. "ma", "zhong", "nü"
 * @param tone      Tone number 1-4 (neutral tone not supported in chart)
 *
 * If the audio file isn't in the manifest (not downloaded yet, or rare
 * syllable davinfifield doesn't have), falls back to Web Speech API with the
 * tone-marked syllable as input.
 */
export async function playPinyinSyllableAudio(
  syllable: string,
  tone: 1 | 2 | 3 | 4,
): Promise<void> {
  const lang: Language = 'zh';
  const manifest = await loadManifest(lang);

  // Try Unicode key first (ü-preserving), then ASCII fallback (ü→v).
  // The ASCII fallback covers two edge cases:
  //   (a) Unicode normalization mismatch on APFS (NFD vs NFC) preventing
  //       the ü-file from being fetched even though it's on disk
  //   (b) Older download scripts that saved ASCII filenames
  const unicodeKey = `pinyin-chart/${syllable}${tone}`;
  const asciiKey = `pinyin-chart/${syllable.replace(/ü/g, 'v')}${tone}`;
  const tryKeys = unicodeKey === asciiKey ? [unicodeKey] : [unicodeKey, asciiKey];

  let variant: ReturnType<typeof resolveVariant> = null;
  let usedKey = unicodeKey;
  for (const k of tryKeys) {
    const e = manifest?.entries[k];
    const v = resolveVariant(e, 'normal');
    if (v) {
      variant = v;
      usedKey = k;
      break;
    }
  }

  if (variant) {
    try {
      // Diagnostic: log what file is actually playing, so a wrong-sound
      // complaint can be traced to either (a) wrong manifest key resolution
      // or (b) wrong file content on disk.
      console.info(
        `[pinyin-chart] click=${syllable}${tone}  →  key=${usedKey}  →  file=${variant.path}`,
      );
      await playBundled(lang, variant.path, 1.0);
      return;
    } catch (err) {
      console.warn(`[audio] bundled pinyin-chart playback failed for ${usedKey}:`, err);
      // Fall through to Web Speech
    }
  } else {
    console.warn(
      `[pinyin-chart] NO BUNDLED AUDIO for "${syllable}${tone}" — falling back to Web Speech (robot voice). ` +
        `Manifest entries: ${manifest ? Object.keys(manifest.entries).filter((k) => k.startsWith('pinyin-chart/')).length : 0} pinyin-chart keys loaded.`,
    );
  }

  // No bundled audio → Web Speech with tone-marked pinyin so the engine
  // at least tries to apply tone info. Quality will be poor but functional.
  const toneMarks: Record<string, string[]> = {
    a: ['ā', 'á', 'ǎ', 'à'], e: ['ē', 'é', 'ě', 'è'],
    i: ['ī', 'í', 'ǐ', 'ì'], o: ['ō', 'ó', 'ǒ', 'ò'],
    u: ['ū', 'ú', 'ǔ', 'ù'], 'ü': ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
  };
  let marked = syllable;
  for (const v of ['a', 'o', 'e', 'i', 'u', 'ü']) {
    if (marked.includes(v)) {
      marked = marked.replace(v, toneMarks[v][tone - 1]);
      break;
    }
  }
  playWebSpeech(marked, lang, 'normal');
}

/** Check if pre-generated audio is available for a language. */
export async function hasBundledAudio(lang: Language): Promise<boolean> {
  const m = await loadManifest(lang);
  return m !== null && m.total_files > 0;
}

/** Check if a specific word+scope has any bundled audio variant. */
export async function hasWordAudio(
  wordId: string,
  scope: AudioScope,
  lang: Language,
): Promise<boolean> {
  const manifest = await loadManifest(lang);
  const entry = manifest?.entries[wordKey(scope, wordId)];
  return !!entry && (!!entry.default || !!entry.normal || !!entry.slow);
}
