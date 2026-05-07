import type { Language, Phoneme } from '../types';
import { pinyinInitials, pinyinFinals, pinyinTones } from './zh/pinyin';
import { ipaConsonants, ipaVowels } from './en/ipa';

// Words come from the tier registry — see tiers.ts for the unlock model.
export {
  wordsByLang,
  tiersByLang,
  getUnlockedTiers,
  getUnlockedWords,
  getNextLockedTier,
  type WordTier,
} from './tiers';

export const phoneticGroups: Record<
  Language,
  { id: string; label: string; phonemes: Phoneme[] }[]
> = {
  zh: [
    { id: 'initials', label: 'Âm đầu (声母)', phonemes: pinyinInitials },
    { id: 'finals', label: 'Âm vận (韵母)', phonemes: pinyinFinals },
    { id: 'tones', label: 'Thanh điệu (声调)', phonemes: pinyinTones },
  ],
  en: [
    { id: 'consonants', label: 'Phụ âm (Consonants)', phonemes: ipaConsonants },
    { id: 'vowels', label: 'Nguyên âm (Vowels)', phonemes: ipaVowels },
  ],
};

export const langLabels: Record<Language, { name: string; flag: string; tagline: string }> = {
  zh: {
    name: 'Tiếng Trung',
    flag: '🇨🇳',
    tagline: 'Pinyin · HSK · 4 thanh điệu',
  },
  en: {
    name: 'Tiếng Anh',
    flag: '🇬🇧',
    tagline: 'IPA · 6 cấp độ · Phonemes',
  },
};
