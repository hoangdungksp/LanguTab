import type { Language } from '../types';

/**
 * Thin wrapper around the Web Speech API that picks a natural voice
 * per language and caches voice lookup.
 */
class TTSService {
  private voices: SpeechSynthesisVoice[] = [];
  private pendingLoad?: Promise<void>;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        this.voices = window.speechSynthesis.getVoices();
      });
    }
  }

  private loadVoices(): Promise<void> {
    if (this.pendingLoad) return this.pendingLoad;
    this.pendingLoad = new Promise((resolve) => {
      const tryLoad = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          this.voices = voices;
          resolve();
        } else {
          setTimeout(tryLoad, 100);
        }
      };
      tryLoad();
    });
    return this.pendingLoad;
  }

  private bcpForLang(lang: Language): string[] {
    // Preferred BCP-47 tags for each language, in priority order.
    if (lang === 'zh') return ['zh-CN', 'zh-Hans', 'zh'];
    return ['en-US', 'en-GB', 'en'];
  }

  private pickVoice(lang: Language): SpeechSynthesisVoice | undefined {
    const preferredTags = this.bcpForLang(lang);
    // Prefer "natural" / "neural" / "Enhanced" voices if available.
    const qualityPrefs = ['Natural', 'Neural', 'Enhanced', 'Premium'];

    for (const tag of preferredTags) {
      const matches = this.voices.filter((v) =>
        v.lang.toLowerCase().startsWith(tag.toLowerCase())
      );
      if (matches.length === 0) continue;

      for (const q of qualityPrefs) {
        const qMatch = matches.find((v) =>
          v.name.toLowerCase().includes(q.toLowerCase())
        );
        if (qMatch) return qMatch;
      }
      return matches[0];
    }
    return undefined;
  }

  async speak(
    text: string,
    lang: Language,
    options: { rate?: number; pitch?: number } = {}
  ): Promise<void> {
    if (!('speechSynthesis' in window)) {
      console.warn('[TTS] Speech Synthesis not supported');
      return;
    }

    await this.loadVoices();

    // Cancel any ongoing speech to prevent queue buildup.
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    const voice = this.pickVoice(lang);
    if (voice) {
      utter.voice = voice;
      utter.lang = voice.lang;
    } else {
      utter.lang = this.bcpForLang(lang)[0];
    }
    utter.rate = options.rate ?? 0.9;
    utter.pitch = options.pitch ?? 1;

    return new Promise((resolve) => {
      utter.onend = () => resolve();
      utter.onerror = () => resolve();
      window.speechSynthesis.speak(utter);
    });
  }

  stop() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  availableVoices(lang: Language): SpeechSynthesisVoice[] {
    const tags = this.bcpForLang(lang);
    return this.voices.filter((v) =>
      tags.some((t) => v.lang.toLowerCase().startsWith(t.toLowerCase()))
    );
  }
}

export const tts = new TTSService();
