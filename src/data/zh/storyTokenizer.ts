/**
 * Tokeniser for story sentences.
 *
 * Splits a raw Chinese sentence into a list of `StoryToken`s using a greedy
 * longest-match strategy:
 *
 *   1. Build a trie/lookup of all known multi-character vocabulary
 *      (HSK1 words + new words for this story).
 *   2. Walk the sentence left-to-right, at each position trying the longest
 *      possible match against the lookup. Falls back to single-character
 *      tokens for unmatched runs.
 *   3. Punctuation gets its own token type so the renderer can apply
 *      different styling (no underline, no hover).
 *
 * Why greedy longest-match (not full BPE/word-segmentation):
 *   The vocab is small (~200 entries) and curated. Greedy works perfectly
 *   for our HSK1 corpus and keeps the tokeniser self-contained — no need
 *   for a heavy CN-segmentation library in the bundle. If the story uses
 *   ambiguous compounds later, we can swap in jieba-wasm.
 */

import type { Word } from '../../types';
import type { NewWord, StoryToken } from '../../types';

/** Chinese punctuation we treat as standalone tokens. */
const PUNCT_RE = /[，。！？；：、""''（）《》【】「」…—\s]/;

/**
 * Build a lookup map: hanzi → Word/NewWord, indexed by token text.
 * Both core HSK vocabulary and story-specific new words are merged here
 * for a single-pass tokenise.
 *
 * Naming note: the field is called `hsk1` for historical reasons (back when
 * only HSK 1 existed). It now contains the full union of HSK 1+2+3 vocab
 * passed in as `coreWords`. Renaming would cascade through `StoryToken.type`
 * and CSS class names — not worth the churn since "hsk1" here just means
 * "any vocab the learner has a flashcard for".
 */
export interface VocabIndex {
  /** Hanzi → Word (any tier — clicking opens its flashcard) */
  hsk1: Map<string, Word>;
  /** Hanzi → NewWord (story-specific vocab, shown via hover popup) */
  newWords: Map<string, NewWord>;
  /** All known hanzi keys, sorted longest-first for greedy match */
  sortedKeys: string[];
}

export function buildVocabIndex(
  coreWords: Word[],
  newWords: NewWord[],
): VocabIndex {
  const core = new Map<string, Word>();
  for (const w of coreWords) core.set(w.term, w);

  const nw = new Map<string, NewWord>();
  for (const w of newWords) nw.set(w.hanzi, w);

  const allKeys = [...core.keys(), ...nw.keys()];
  // Longest first so "学习" wins over "学" + "习"
  allKeys.sort((a, b) => b.length - a.length);

  // Field name kept as `hsk1` for backward compatibility with consumers.
  return { hsk1: core, newWords: nw, sortedKeys: allKeys };
}

/**
 * Pinyin map for tokens — provided per-story so we can use the manually
 * curated pinyin from the source file without having to re-derive it at
 * runtime. Falls back to undefined if missing.
 */
export type PinyinMap = Map<string, string>;

/**
 * Tokenise one sentence. Returns tokens in left-to-right order.
 *
 * The pinyin map is consulted for each matched token; if the token text
 * isn't in the map, the resulting token has no pinyin (renderer hides
 * the pinyin row for that column).
 */
export function tokenizeSentence(
  zh: string,
  vocab: VocabIndex,
  pinyinByToken: PinyinMap,
): StoryToken[] {
  const tokens: StoryToken[] = [];
  let i = 0;

  while (i < zh.length) {
    const ch = zh[i];

    // Punctuation — emits as its own token, no pinyin/interaction
    if (PUNCT_RE.test(ch)) {
      tokens.push({ text: ch, type: 'punct' });
      i += 1;
      continue;
    }

    // Greedy longest match against vocab
    let matched: { text: string; type: StoryToken['type']; ref?: string } | null = null;
    for (const key of vocab.sortedKeys) {
      if (zh.startsWith(key, i)) {
        if (vocab.hsk1.has(key)) {
          matched = { text: key, type: 'hsk1', ref: vocab.hsk1.get(key)!.id };
        } else if (vocab.newWords.has(key)) {
          const nw = vocab.newWords.get(key)!;
          // Heuristic: if the new word's vi looks like a name (capitalised
          // single proper noun), tag as 'name' instead so styling differs.
          const isName = /^[A-ZĐ]/.test(nw.vi.charAt(0)) && nw.vi.split(' ').length <= 2;
          matched = { text: key, type: isName ? 'name' : 'new', ref: nw.id };
        }
        break;
      }
    }

    if (matched) {
      const token: StoryToken = {
        text: matched.text,
        type: matched.type,
        pinyin: pinyinByToken.get(matched.text),
      };
      if (matched.type === 'hsk1') token.wordId = matched.ref;
      else if (matched.type === 'new' || matched.type === 'name') token.newWordId = matched.ref;
      tokens.push(token);
      i += matched.text.length;
      continue;
    }

    // Fallback — single character we didn't recognise. Most likely a typo
    // in the source data or a word missing from both registries. Emit as
    // 'unknown' so it renders plainly without hover behaviour.
    tokens.push({
      text: ch,
      type: 'unknown',
      pinyin: pinyinByToken.get(ch),
    });
    i += 1;
  }

  return tokens;
}
