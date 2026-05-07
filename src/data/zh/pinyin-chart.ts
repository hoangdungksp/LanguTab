/**
 * Standard Mandarin Pinyin chart — layout matches DigMandarin 100%.
 *
 * Structure:
 *   PINYIN_ROWS: 7 initial groups (zero, bpmf, dtnl, gkh, zcs, zhchshr, jqx)
 *   PINYIN_COLS: 38 columns in exact DigMandarin order
 *
 * Why 3 columns all labelled "i":
 *   - Col 4  (`i_z`):       for z/c/s        → "zi ci si"         (dental apical)
 *   - Col 5  (`i_zh`):      for zh/ch/sh/r   → "zhi chi shi ri"   (retroflex apical)
 *   - Col 16 (`i_default`): for EVERYONE else — zero-initial (→ yi),
 *                           b/p/m (→ bi/pi/mi), d/t/n/l (→ di/ti/ni/li),
 *                           j/q/x (→ ji/qi/xi). Palatalised /i/ at start of
 *                           the i-compound group.
 *   Previous (wrong) interpretation: col 4 held b/p/m/d/t/n/l and col 5 held
 *   z/c/s/zh/ch/sh/r. Corrected by careful pixel inspection of DigMandarin
 *   image: "bi" is directly next to "biao" (i.e. at col 16), not at col 4.
 *
 * Orthographic rules handled by composeSyllable():
 *   - Zero-initial + i-compound  → y-prefix   (ia → ya, ie → ye, iu → you, ...)
 *   - Zero-initial + u-compound  → w-prefix   (ua → wa, ui → wei, un → wen, ...)
 *   - Zero-initial + ü-compound  → y- prefix + drop umlaut (ü → yu, üe → yue, ...)
 *   - j/q/x + ü-compound         → drop umlaut (ü → u, üe → ue, üan → uan, ün → un)
 *   - j/q/x do NOT combine with u-column          (written with ü in u-column slot
 *                                                   would be confusing, so empty)
 *
 * Audio file naming (davinfifield repo):
 *   {syllable}{tone}.mp3 — e.g., ma1.mp3, ma2.mp3, ma3.mp3, ma4.mp3
 */

// ————————————————————————————————————————————
// Column definitions — 38 columns, matching DigMandarin header order
// ————————————————————————————————————————————

export interface PinyinCol {
  /** Unique key used in composeSyllable() — disambiguates the 3 "i" columns. */
  key: string;
  /** Display label shown in the chart header. May be duplicated across columns. */
  label: string;
}

export const PINYIN_COLS: readonly PinyinCol[] = [
  // Simple finals
  { key: 'a',         label: 'a'    },
  { key: 'o',         label: 'o'    },
  { key: 'e',         label: 'e'    },
  { key: 'i_z',       label: 'i'    }, // col 4 — z/c/s only
  { key: 'i_zh',      label: 'i'    }, // col 5 — zh/ch/sh/r only
  { key: 'er',        label: 'er'   },
  // Compound finals (vowel + vowel, vowel + nasal)
  { key: 'ai',        label: 'ai'   },
  { key: 'ei',        label: 'ei'   },
  { key: 'ao',        label: 'ao'   },
  { key: 'ou',        label: 'ou'   },
  { key: 'an',        label: 'an'   },
  { key: 'en',        label: 'en'   },
  { key: 'ang',       label: 'ang'  },
  { key: 'eng',       label: 'eng'  },
  { key: 'ong',       label: 'ong'  },
  // i-compound group
  { key: 'i_default', label: 'i'    }, // col 16 — zero-initial + b/p/m/d/t/n/l + j/q/x
  { key: 'ia',     label: 'ia'   },
  { key: 'iao',    label: 'iao'  },
  { key: 'ie',     label: 'ie'   },
  { key: 'iu',     label: 'iu'   },
  { key: 'ian',    label: 'ian'  },
  { key: 'in',     label: 'in'   },
  { key: 'iang',   label: 'iang' },
  { key: 'ing',    label: 'ing'  },
  { key: 'iong',   label: 'iong' },
  // u-compound group
  { key: 'u',      label: 'u'    },
  { key: 'ua',     label: 'ua'   },
  { key: 'uo',     label: 'uo'   },
  { key: 'uai',    label: 'uai'  },
  { key: 'ui',     label: 'ui'   },
  { key: 'uan',    label: 'uan'  },
  { key: 'un',     label: 'un'   },
  { key: 'uang',   label: 'uang' },
  { key: 'ueng',   label: 'ueng' },
  // ü-compound group
  { key: 'ü',      label: 'ü'    },
  { key: 'üe',     label: 'üe'   },
  { key: 'üan',    label: 'üan'  },
  { key: 'ün',     label: 'ün'   },
];

// ————————————————————————————————————————————
// Row groups — matches DigMandarin visual grouping (7 groups)
// ————————————————————————————————————————————

export interface PinyinRow {
  /** Initials sharing this row. '' = zero-initial. */
  initials: readonly string[];
  /** Display label for the whole group (shown on row-header column). */
  groupLabel: string;
}

export const PINYIN_ROWS: readonly PinyinRow[] = [
  { initials: [''],                      groupLabel: '' },            // zero-initial
  { initials: ['b', 'p', 'm', 'f'],      groupLabel: 'b/p/m/f' },
  { initials: ['d', 't', 'n', 'l'],      groupLabel: 'd/t/n/l' },
  { initials: ['g', 'k', 'h'],           groupLabel: 'g/k/h' },
  { initials: ['z', 'c', 's'],           groupLabel: 'z/c/s' },
  { initials: ['zh', 'ch', 'sh', 'r'],   groupLabel: 'zh/ch/sh/r' },
  { initials: ['j', 'q', 'x'],           groupLabel: 'j/q/x' },
];

// ————————————————————————————————————————————
// Valid syllables registry — 407 syllables
// Used as final gate by composeSyllable() to filter out combinations that
// are orthographically possible but not phonotactically used in Mandarin.
// ————————————————————————————————————————————

export const VALID_SYLLABLES = new Set<string>([
  // Zero-initial
  'a', 'o', 'e', 'ai', 'ei', 'ao', 'ou', 'an', 'en', 'ang', 'eng', 'er',
  // b-
  'ba', 'bo', 'bai', 'bei', 'bao', 'ban', 'ben', 'bang', 'beng', 'bi', 'bie',
  'biao', 'bian', 'bin', 'bing', 'bu',
  // p-
  'pa', 'po', 'pai', 'pei', 'pao', 'pou', 'pan', 'pen', 'pang', 'peng', 'pi',
  'pie', 'piao', 'pian', 'pin', 'ping', 'pu',
  // m-
  'ma', 'mo', 'me', 'mai', 'mei', 'mao', 'mou', 'man', 'men', 'mang', 'meng',
  'mi', 'mie', 'miao', 'miu', 'mian', 'min', 'ming', 'mu',
  // f-
  'fa', 'fo', 'fei', 'fou', 'fan', 'fen', 'fang', 'feng', 'fu',
  // d-
  'da', 'de', 'dai', 'dei', 'dao', 'dou', 'dan', 'den', 'dang', 'deng', 'dong',
  'di', 'die', 'diao', 'diu', 'dian', 'ding', 'du', 'duo', 'dui', 'duan', 'dun',
  // t-
  'ta', 'te', 'tai', 'tao', 'tou', 'tan', 'tang', 'teng', 'tong', 'ti', 'tie',
  'tiao', 'tian', 'ting', 'tu', 'tuo', 'tui', 'tuan', 'tun',
  // n-
  'na', 'ne', 'nai', 'nei', 'nao', 'nou', 'nan', 'nen', 'nang', 'neng', 'nong',
  'ni', 'nie', 'niao', 'niu', 'nian', 'nin', 'niang', 'ning', 'nu', 'nuo',
  'nuan', 'nü', 'nüe',
  // l-
  'la', 'le', 'lai', 'lei', 'lao', 'lou', 'lan', 'lang', 'leng', 'long', 'li',
  'lia', 'lie', 'liao', 'liu', 'lian', 'lin', 'liang', 'ling', 'lu', 'luo',
  'luan', 'lun', 'lü', 'lüe',
  // g-
  'ga', 'ge', 'gai', 'gei', 'gao', 'gou', 'gan', 'gen', 'gang', 'geng', 'gong',
  'gu', 'gua', 'guo', 'guai', 'gui', 'guan', 'gun', 'guang',
  // k-
  'ka', 'ke', 'kai', 'kei', 'kao', 'kou', 'kan', 'ken', 'kang', 'keng', 'kong',
  'ku', 'kua', 'kuo', 'kuai', 'kui', 'kuan', 'kun', 'kuang',
  // h-
  'ha', 'he', 'hai', 'hei', 'hao', 'hou', 'han', 'hen', 'hang', 'heng', 'hong',
  'hu', 'hua', 'huo', 'huai', 'hui', 'huan', 'hun', 'huang',
  // j-
  'ji', 'jia', 'jie', 'jiao', 'jiu', 'jian', 'jin', 'jiang', 'jing', 'jiong',
  'ju', 'jue', 'juan', 'jun',
  // q-
  'qi', 'qia', 'qie', 'qiao', 'qiu', 'qian', 'qin', 'qiang', 'qing', 'qiong',
  'qu', 'que', 'quan', 'qun',
  // x-
  'xi', 'xia', 'xie', 'xiao', 'xiu', 'xian', 'xin', 'xiang', 'xing', 'xiong',
  'xu', 'xue', 'xuan', 'xun',
  // zh-
  'zha', 'zhe', 'zhi', 'zhai', 'zhei', 'zhao', 'zhou', 'zhan', 'zhen', 'zhang',
  'zheng', 'zhong', 'zhu', 'zhua', 'zhuo', 'zhuai', 'zhui', 'zhuan', 'zhun',
  'zhuang',
  // ch-
  'cha', 'che', 'chi', 'chai', 'chao', 'chou', 'chan', 'chen', 'chang', 'cheng',
  'chong', 'chu', 'chua', 'chuo', 'chuai', 'chui', 'chuan', 'chun', 'chuang',
  // sh-
  'sha', 'she', 'shi', 'shai', 'shei', 'shao', 'shou', 'shan', 'shen', 'shang',
  'sheng', 'shu', 'shua', 'shuo', 'shuai', 'shui', 'shuan', 'shun', 'shuang',
  // r-
  're', 'ri', 'rao', 'rou', 'ran', 'ren', 'rang', 'reng', 'rong', 'ru', 'rua',
  'ruo', 'rui', 'ruan', 'run',
  // z-
  'za', 'ze', 'zi', 'zai', 'zei', 'zao', 'zou', 'zan', 'zen', 'zang', 'zeng',
  'zong', 'zu', 'zuo', 'zui', 'zuan', 'zun',
  // c-
  'ca', 'ce', 'ci', 'cai', 'cao', 'cou', 'can', 'cen', 'cang', 'ceng', 'cong',
  'cu', 'cuo', 'cui', 'cuan', 'cun',
  // s-
  'sa', 'se', 'si', 'sai', 'sao', 'sou', 'san', 'sen', 'sang', 'seng', 'song',
  'su', 'suo', 'sui', 'suan', 'sun',
  // y- (zero-initial i/ü orthographic forms)
  'ya', 'ye', 'yao', 'you', 'yan', 'yang', 'yi', 'yin', 'ying', 'yong', 'yu',
  'yue', 'yuan', 'yun',
  // w- (zero-initial u orthographic forms)
  'wa', 'wo', 'wai', 'wei', 'wan', 'wen', 'wang', 'weng', 'wu',
]);

// ————————————————————————————————————————————
// Composition — (initial, colKey) → syllable | null
// ————————————————————————————————————————————

// Initial sets for the 3 "i" columns (per DigMandarin layout)
const I_Z_INITIALS = new Set(['z', 'c', 's']);
const I_ZH_INITIALS = new Set(['zh', 'ch', 'sh', 'r']);
const I_DEFAULT_INITIALS = new Set(['', 'b', 'p', 'm', 'd', 't', 'n', 'l', 'j', 'q', 'x']);

// Zero-initial + compound finals → y/w prefix orthography.
// Note: IU→YOU, UI→WEI, UN→WEN are irregular transformations.
const ZERO_INITIAL_ORTHO: Record<string, string> = {
  // i-compound
  ia: 'ya', ie: 'ye', iao: 'yao', iu: 'you', ian: 'yan',
  in: 'yin', iang: 'yang', ing: 'ying', iong: 'yong',
  // u-compound
  u: 'wu', ua: 'wa', uo: 'wo', uai: 'wai', ui: 'wei',
  uan: 'wan', un: 'wen', uang: 'wang', ueng: 'weng',
  // ü-compound — prefixed 'y' and dropped umlaut
  'ü': 'yu', 'üe': 'yue', 'üan': 'yuan', 'ün': 'yun',
};

// j/q/x do NOT appear in the u-column group — they're written as ju/que/xuan
// in the ü-column group because they're really /y/ vowels orthographically.
const U_COMPOUND_COLS = new Set([
  'u', 'ua', 'uo', 'uai', 'ui', 'uan', 'un', 'uang', 'ueng',
]);

export function composeSyllable(initial: string, colKey: string): string | null {
  // ─ Col 4: "i" for z/c/s only ─
  if (colKey === 'i_z') {
    if (!I_Z_INITIALS.has(initial)) return null;
    const s = initial + 'i';
    return VALID_SYLLABLES.has(s) ? s : null;
  }
  // ─ Col 5: "i" for zh/ch/sh/r only ─
  if (colKey === 'i_zh') {
    if (!I_ZH_INITIALS.has(initial)) return null;
    const s = initial + 'i';
    return VALID_SYLLABLES.has(s) ? s : null;
  }
  // ─ Col 16: "i" for everyone else (zero-initial, b/p/m/d/t/n/l, j/q/x) ─
  if (colKey === 'i_default') {
    if (!I_DEFAULT_INITIALS.has(initial)) return null;
    if (initial === '') return 'yi';
    const s = initial + 'i';
    return VALID_SYLLABLES.has(s) ? s : null;
  }

  // ─ Zero-initial orthographic rules ─
  if (initial === '') {
    if (ZERO_INITIAL_ORTHO[colKey]) return ZERO_INITIAL_ORTHO[colKey];
    // Bare simple finals valid as standalone syllables in DigMandarin.
    // Explicit allow-list rather than VALID_SYLLABLES membership because:
    //   - 'ei' IS a real syllable (interjection) but DigMandarin omits it
    //   - 'ong' is NOT a valid bare syllable phonotactically
    // Matching DigMandarin exactly per layout spec.
    const ZERO_INITIAL_BARE = new Set([
      'a', 'o', 'e', 'er',
      'ai', 'ao', 'ou',
      'an', 'en', 'ang', 'eng',
    ]);
    if (ZERO_INITIAL_BARE.has(colKey)) {
      return VALID_SYLLABLES.has(colKey) ? colKey : null;
    }
    return null;
  }

  // ─ j/q/x exclusions ─
  //   - u-compound columns are always empty for j/q/x (they use ü-columns)
  //   - ü-compound columns drop the umlaut (ü → u, üe → ue, etc.)
  if (['j', 'q', 'x'].includes(initial)) {
    if (U_COMPOUND_COLS.has(colKey)) return null;
    if (colKey.startsWith('ü')) {
      const adjusted = initial + 'u' + colKey.slice(1);
      return VALID_SYLLABLES.has(adjusted) ? adjusted : null;
    }
  }

  // ─ Default: direct concatenation, gated by VALID_SYLLABLES ─
  const s = initial + colKey;
  return VALID_SYLLABLES.has(s) ? s : null;
}

// ————————————————————————————————————————————
// Tones + tone-mark application
// ————————————————————————————————————————————

export const TONES = [
  { num: 1, label: 'Ngang' },
  { num: 2, label: 'Huyền ngược' },
  { num: 3, label: 'Thanh hỏi' },
  { num: 4, label: 'Sắc' },
] as const;

/**
 * Add a tone mark (1-4) to a pinyin syllable following standard rules.
 * Priority: a > o > e > last vowel in iu/ui pairs > i > u > ü.
 */
export function applyTone(syllable: string, tone: 1 | 2 | 3 | 4): string {
  const toneMap: Record<string, string[]> = {
    a: ['ā', 'á', 'ǎ', 'à'],
    e: ['ē', 'é', 'ě', 'è'],
    i: ['ī', 'í', 'ǐ', 'ì'],
    o: ['ō', 'ó', 'ǒ', 'ò'],
    u: ['ū', 'ú', 'ǔ', 'ù'],
    ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
  };
  const idx = tone - 1;

  // Priority vowels
  for (const v of ['a', 'o', 'e']) {
    if (syllable.includes(v)) return syllable.replace(v, toneMap[v][idx]);
  }
  // Last vowel in iu/ui pairs
  if (syllable.includes('iu')) return syllable.replace('iu', 'i' + toneMap.u[idx]);
  if (syllable.includes('ui')) return syllable.replace('ui', 'u' + toneMap.i[idx]);
  // Fall back to any remaining vowel
  for (const v of ['i', 'u', 'ü']) {
    if (syllable.includes(v)) return syllable.replace(v, toneMap[v][idx]);
  }
  return syllable;
}
