import type { Language, Word } from '../types';
import { hsk1 } from './zh/hsk1';
import { hsk2 } from './zh/hsk2';
import { hsk3 } from './zh/hsk3';
import { hsk4 } from './zh/hsk4';
import { hsk5 } from './zh/hsk5';
import { hsk6 } from './zh/hsk6';
import { enLevel1 } from './en/level1';
import { enLevel2 } from './en/level2';
import { enLevel3 } from './en/level3';
import { enLevel4 } from './en/level4';
import { enLevel5 } from './en/level5';
import { enLevel6 } from './en/level6';

/**
 * A "tier" is one bundled wordlist (e.g. HSK 1, HSK 2, EN Level 1).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Why tiers exist
 * ─────────────────────────────────────────────────────────────────────────
 * Two forces shape the design:
 *   1. Progressive unlock — in v0.6 the level system gates vocab by user XP
 *      level. Each tier declares the minimum level needed to unlock it.
 *   2. Scale — we'll grow from 650 → 5,000 words per language. Keeping each
 *      tier in its own file (hsk1.ts, hsk2.ts, ...) stays merge-friendly and
 *      opens the door to lazy dynamic imports later without changing callers.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * v0.5 behaviour
 * ─────────────────────────────────────────────────────────────────────────
 *   - All tiers are eagerly loaded (tree-shaken by Vite for unused langs).
 *   - `minLevel` is declared but NOT enforced yet — `wordsByLang` still
 *     returns every word. v0.6 will add `getUnlockedWords(lang, userLevel)`
 *     that consults `tiersByLang` + Settings.level.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Adding a new tier (e.g. HSK 2)
 * ─────────────────────────────────────────────────────────────────────────
 *   1. Create src/data/zh/hsk2.ts with `export const hsk2: Word[] = [...]`.
 *   2. Import it below.
 *   3. Append a WordTier entry to `tiersByLang.zh` with a suitable minLevel.
 *   4. No caller changes needed — `wordsByLang.zh` auto-picks up the new words.
 */
export interface WordTier {
  /** Stable slug, e.g. "hsk1", "hsk2", "en_level_1". */
  id: string;
  lang: Language;
  /** Human-facing label: "HSK 1", "Cấp 1 — Cơ bản". */
  name: string;
  /** Vietnamese one-liner for the unlock card / Dashboard. */
  description: string;
  /** Minimum user level required to unlock. v0.6 enforces this. */
  minLevel: number;
  /** Eagerly loaded words in this tier. */
  words: Word[];
}

export const tiersByLang: Record<Language, WordTier[]> = {
  zh: [
    {
      id: 'hsk1',
      lang: 'zh',
      name: 'HSK 1',
      description: '150 từ khởi đầu — đại từ, chào hỏi, gia đình, số đếm.',
      minLevel: 1,
      words: hsk1,
    },
    {
      id: 'hsk2',
      lang: 'zh',
      name: 'HSK 2',
      description: '150 từ tiếp theo — gia đình mở rộng, hành động, cảm xúc, thời gian.',
      // minLevel: 1 means HSK 2 unlocks immediately alongside HSK 1.
      // Jason's choice — he wants both decks active so he can build vocabulary
      // breadth faster rather than gating HSK 2 behind HSK 1 mastery.
      minLevel: 1,
      words: hsk2,
    },
    {
      id: 'hsk3',
      lang: 'zh',
      name: 'HSK 3',
      description: '300 từ trung cấp — du lịch, công việc, sức khỏe, cảm xúc nâng cao.',
      // Same minLevel: 1 reasoning as HSK 2 — Jason wants all decks active
      // simultaneously for breadth-first learning.
      minLevel: 1,
      words: hsk3,
    },
    {
      id: 'hsk4',
      lang: 'zh',
      name: 'HSK 4',
      description: '600 từ trung cao cấp — đời sống, công việc, xã hội, công nghệ, văn hóa, nghệ thuật.',
      // 600 từ HSK 4 (zh_601 → zh_1200) trong file hsk4.ts.
      // Trước đây tách Part A + Part B vì lý do authoring; giờ merged
      // theo Jason muốn 1 tier duy nhất để dễ quản lý.
      minLevel: 1,
      words: hsk4,
    },
    {
      id: 'hsk5',
      lang: 'zh',
      name: 'HSK 5',
      description: 'Trung cấp B2 — từ vựng nâng cao về xã hội, công việc, học thuật, văn hóa.',
      // 1,081 từ HSK 5 mới (loại trừ overlap với HSK 1-4).
      // Source: LiudmilaLV/json_hsk (HSK 2.0 official 2012 wordlist).
      // Vietnamese coverage ~10% — phần còn lại là English fallback,
      // Jason có thể edit specific entries trong file hsk5.ts.
      minLevel: 1,
      words: hsk5,
    },
    {
      id: 'hsk6',
      lang: 'zh',
      name: 'HSK 6',
      description: 'Cao cấp C1 — từ vựng văn học, học thuật, chuyên ngành.',
      // 2,411 từ HSK 6 mới (loại trừ overlap với HSK 1-5).
      // HSK 6 là tier lớn nhất; bao phủ vocabulary cao cấp dành cho
      // độc giả thông thạo. Một số terms văn học/cổ ngôn ít gặp đời thường.
      minLevel: 1,
      words: hsk6,
    },
  ],
  en: [
    {
      id: 'en_level_1',
      lang: 'en',
      name: 'Cấp 1 — Cơ bản',
      description: '280 từ vỡ lòng — đại từ, gia đình, số đếm 1-20, màu sắc, cơ thể, động vật, thức ăn cơ bản.',
      // Pre-A1 / Cambridge Starters-equivalent. Phù hợp trẻ 6-8 tuổi, lớp 1-2.
      // Foundation tier — every learner starts here regardless of level.
      minLevel: 1,
      words: enLevel1,
    },
    {
      id: 'en_level_2',
      lang: 'en',
      name: 'Cấp 2 — Sơ trung',
      description: '220 từ mở rộng — thứ trong tuần, tháng, sinh hoạt hàng ngày, thể thao, nghề nghiệp, phương tiện.',
      // A1 / Cambridge Movers-equivalent. Lớp 3-4.
      minLevel: 1,
      words: enLevel2,
    },
    {
      id: 'en_level_3',
      lang: 'en',
      name: 'Cấp 3 — Trung cấp',
      description: '140 từ trung cấp — thì quá khứ, so sánh hơn/nhất, du lịch, công nghệ, môi trường.',
      // A2 / Cambridge Flyers-equivalent. Lớp 5-6.
      minLevel: 1,
      words: enLevel3,
    },
    {
      id: 'en_level_4',
      lang: 'en',
      name: 'Cấp 4 — Tiểu học cơ bản',
      description: '110 từ trường học — môn học, đồ dùng học tập, địa lý, khoa học cơ bản, sinh vật.',
      // School vocabulary cho học sinh tiểu học cuối cấp.
      minLevel: 1,
      words: enLevel4,
    },
    {
      id: 'en_level_5',
      lang: 'en',
      name: 'Cấp 5 — Tiểu học nâng cao',
      description: '158 từ nâng cao — modal verbs, future tense, cộng đồng, văn hóa, sở thích, khái niệm trừu tượng.',
      // Lớp 5-6 nâng cao + đầu THCS.
      minLevel: 1,
      words: enLevel5,
    },
    {
      id: 'en_level_6',
      lang: 'en',
      name: 'Cấp 6 — Chuẩn bị nâng cao',
      description: '117 từ học thuật — nghiên cứu, ngữ pháp, công việc, sức khỏe, công dân, từ chính thức.',
      // Chuẩn bị KET/PET. Đầu cấp 2.
      minLevel: 1,
      words: enLevel6,
    },
  ],
};

/** Flat list of every word for a language — union of all tiers, in declared order. */
export const wordsByLang: Record<Language, Word[]> = {
  zh: tiersByLang.zh.flatMap((t) => t.words),
  en: tiersByLang.en.flatMap((t) => t.words),
};

/**
 * Returns tiers a user has unlocked at their current level. v0.6+ will wire
 * this into Dashboard + Flashcard filters. For v0.5 it exists so we can unit-
 * test the contract without rewriting callers.
 */
export function getUnlockedTiers(lang: Language, userLevel: number): WordTier[] {
  return tiersByLang[lang].filter((t) => t.minLevel <= userLevel);
}

/** Union of words across all unlocked tiers. */
export function getUnlockedWords(lang: Language, userLevel: number): Word[] {
  return getUnlockedTiers(lang, userLevel).flatMap((t) => t.words);
}

/** Returns the next tier a user hasn't unlocked yet, or null if maxed. */
export function getNextLockedTier(lang: Language, userLevel: number): WordTier | null {
  return tiersByLang[lang].find((t) => t.minLevel > userLevel) ?? null;
}
