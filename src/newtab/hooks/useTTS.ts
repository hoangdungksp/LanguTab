import { useCallback, useState } from 'react';
import { tts } from '../../services/tts';
import {
  playWordAudio,
  playPhonemeAudio,
  playPhonemeExampleAudio,
  playPinyinSyllableAudio,
  type AudioSpeed,
  type AudioScope,
  type AudioVoice,
} from '../../services/audioService';
import { useAppStore } from '../../stores/useAppStore';
import type { Language, Phoneme, Word } from '../../types';

/**
 * Unified TTS hook.
 *
 * Usage patterns:
 *   1. `speak(text, lang)` — raw Web Speech. Ad-hoc text without ID.
 *   2. `playWord(word, scope, speed, voice)` — bundled MP3 (if available)
 *      for either the word term or its example sentence.
 *      voice ∈ { 'native', 'male', 'female' }:
 *        - 'native' = Anki HSK+ deck human recording (~92% words coverage)
 *        - 'male' = CosyVoice longanyang
 *        - 'female' = Cherry / Qwen-TTS
 *      Native falls back to male AI if Anki MP3 missing for that word.
 *   3. `playPhoneme(phoneme, lang)` — bundled MP3 by phoneme.id (Kokoro
 *      handles Chinese tones correctly), Web Speech fallback.
 *
 * `isSpeaking` covers all three paths. `supported` stays true as long as at
 * least one backend (bundled MP3 or Web Speech) can produce sound.
 */
export function useTTS() {
  const soundEnabled = useAppStore((s) => s.soundEnabled);
  const [isSpeaking, setIsSpeaking] = useState(false);

  /** Low-level Web Speech. Used for translations, phoneme guides, etc. */
  const speak = useCallback(
    async (text: string, lang: Language, options?: { rate?: number }) => {
      if (!soundEnabled || !text.trim()) return;
      setIsSpeaking(true);
      try {
        await tts.speak(text, lang, options);
      } finally {
        setIsSpeaking(false);
      }
    },
    [soundEnabled],
  );

  /**
   * Play a Word — either the term itself or its example sentence.
   *
   * Voice options:
   *   - 'native': Anki HSK+ human recording (preferred when available)
   *   - 'male': CosyVoice longanyang AI voice
   *   - 'female': Cherry / Qwen-TTS AI voice
   *
   * Lookup chain inside playWordAudio:
   *   1. If voice='native' → /audio/zh/words-anki/{id}.mp3
   *   2. words-{aiGender}/{id} (or sentences-{aiGender}/{id}) — gender-specific
   *   3. words/{id}            (or sentences/{id})            — legacy single voice
   *   4. Web Speech                                           — last resort
   *
   * Native auto-falls-back to AI male if the MP3 doesn't exist (Anki coverage
   * is ~92% words / 61% sentences — gaps stay silent → fallback covers them).
   */
  const playWord = useCallback(
    async (
      word: Word,
      scope: AudioScope = 'word',
      speed: AudioSpeed = 'normal',
      voice: AudioVoice = 'male',
      customText?: string,
    ) => {
      if (!soundEnabled) return;
      // Text is used for Web Speech fallback when bundled MP3 is missing.
      // customText takes priority — used by Ví dụ 2 (Anki sentence) to read
      // ankiData.s instead of word.example.
      const fallbackText = customText
        ?? (scope === 'sentence' ? (word.example ?? word.term) : word.term);
      if (!fallbackText.trim()) return;

      setIsSpeaking(true);
      try {
        await playWordAudio(word.id, scope, fallbackText, word.lang, speed, voice);
      } finally {
        setIsSpeaking(false);
      }
    },
    [soundEnabled],
  );

  /**
   * Play a Phoneme. Tries bundled MP3 first (Kokoro renders tones correctly
   * for ZH); falls back to Web Speech otherwise.
   *
   * We pass phoneme.id (not symbol) so audioService can look up the bundled
   * file, and phoneme.exampleWord as the Web Speech fallback text — because
   * Web Speech would read a bare "b" or "zh" as English letters.
   */
  const playPhoneme = useCallback(
    async (phoneme: Phoneme, lang: Language) => {
      if (!soundEnabled) return;
      setIsSpeaking(true);
      try {
        await playPhonemeAudio(phoneme.id, phoneme.exampleWord, lang);
      } finally {
        setIsSpeaking(false);
      }
    },
    [soundEnabled],
  );

  /**
   * Play a Phoneme at slow speed (0.7× playback rate). Same bundled MP3 as
   * playPhoneme, just played back slower via HTMLAudioElement.playbackRate
   * to preserve the Qwen-TTS voice (otherwise "Chậm" fell back to Chrome's
   * robotic Web Speech voice).
   */
  const playPhonemeSlow = useCallback(
    async (phoneme: Phoneme, lang: Language) => {
      if (!soundEnabled) return;
      setIsSpeaking(true);
      try {
        await playPhonemeAudio(phoneme.id, phoneme.exampleWord, lang, 'slow');
      } finally {
        setIsSpeaking(false);
      }
    },
    [soundEnabled],
  );

  /**
   * Play the EXAMPLE WORD for a phoneme — full hanzi pronounced via CosyVoice.
   *
   * Currently hardcoded to male voice (longanyang) since this lives in the
   * Âm đầu / Âm vận / Thanh điệu tabs which are primarily DigMandarin-driven
   * (mono voice for the phoneme tile click). Adding a gender toggle here
   * would be misleading — the tile-click audio can't switch voices anyway.
   * Voice gender selection lives in the Flashcard tab instead.
   */
  const playPhonemeExample = useCallback(
    async (phoneme: Phoneme, lang: Language) => {
      if (!soundEnabled) return;
      setIsSpeaking(true);
      try {
        await playPhonemeExampleAudio(phoneme.id, phoneme.exampleWord, lang, 'normal', 'male');
      } finally {
        setIsSpeaking(false);
      }
    },
    [soundEnabled],
  );

  const playPhonemeExampleSlow = useCallback(
    async (phoneme: Phoneme, lang: Language) => {
      if (!soundEnabled) return;
      setIsSpeaking(true);
      try {
        await playPhonemeExampleAudio(phoneme.id, phoneme.exampleWord, lang, 'slow', 'male');
      } finally {
        setIsSpeaking(false);
      }
    },
    [soundEnabled],
  );

  const stop = useCallback(() => {
    tts.stop();
    setIsSpeaking(false);
  }, []);

  /**
   * Play a pinyin syllable from the chart — bundled davinfifield audio if
   * the syllable was downloaded, Web Speech fallback otherwise.
   *
   * @param syllable  Bare pinyin like "ma", "zhong" (no tone mark)
   * @param tone      1-4
   */
  const playPinyinSyllable = useCallback(
    async (syllable: string, tone: 1 | 2 | 3 | 4) => {
      if (!soundEnabled) return;
      setIsSpeaking(true);
      try {
        await playPinyinSyllableAudio(syllable, tone);
      } finally {
        setIsSpeaking(false);
      }
    },
    [soundEnabled],
  );

  return {
    speak,
    playWord,
    playPhoneme,
    playPhonemeSlow,
    playPhonemeExample,
    playPhonemeExampleSlow,
    playPinyinSyllable,
    stop,
    isSpeaking,
    supported: tts.isSupported(),
  };
}
