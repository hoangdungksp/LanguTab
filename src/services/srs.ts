import {
  createEmptyCard,
  FSRS,
  generatorParameters,
  Rating,
  type Card,
  type Grade,
} from 'ts-fsrs';
import { db } from './db';
import type { Language, Word, WordProgress } from '../types';

const params = generatorParameters({ enable_fuzz: true });
const fsrs = new FSRS(params);

/** Convert our WordProgress (Date + state number) to ts-fsrs Card */
function progressToCard(p: WordProgress): Card {
  return {
    due: new Date(p.due),
    stability: p.stability,
    difficulty: p.difficulty,
    elapsed_days: p.elapsedDays,
    scheduled_days: p.scheduledDays,
    reps: p.reps,
    lapses: p.lapses,
    state: p.state as 0 | 1 | 2 | 3,
    last_review: p.lastReview ? new Date(p.lastReview) : undefined,
  };
}

function cardToProgress(wordId: string, lang: Language, card: Card): WordProgress {
  return {
    wordId,
    lang,
    difficulty: card.difficulty,
    stability: card.stability,
    state: card.state as 0 | 1 | 2 | 3,
    due: card.due,
    reps: card.reps,
    lapses: card.lapses,
    lastReview: card.last_review,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
  };
}

/** Get progress for a word, creating a fresh FSRS card if none exists. */
export async function getProgress(word: Word): Promise<WordProgress> {
  const existing = await db.wordProgress.get(word.id);
  if (existing) return existing;
  const empty = createEmptyCard();
  return cardToProgress(word.id, word.lang, empty);
}

/** Preview what would happen for each rating (for showing intervals on buttons). */
export async function previewRatings(word: Word) {
  const prog = await getProgress(word);
  const card = progressToCard(prog);
  const now = new Date();
  const scheduling = fsrs.repeat(card, now);
  return {
    again: scheduling[Rating.Again],
    hard: scheduling[Rating.Hard],
    good: scheduling[Rating.Good],
    easy: scheduling[Rating.Easy],
  };
}

/** Apply a rating and persist. Only valid grades (Again/Hard/Good/Easy). */
export async function rateWord(word: Word, rating: Grade): Promise<WordProgress> {
  const prog = await getProgress(word);
  const card = progressToCard(prog);
  const now = new Date();
  const scheduling = fsrs.repeat(card, now);
  const chosen = scheduling[rating];
  const next = cardToProgress(word.id, word.lang, chosen.card);
  await db.wordProgress.put(next);

  // Append to the review log for stats. Fire-and-forget — log failures
  // shouldn't block the actual review (which is the user-visible action).
  // wasNew is captured BEFORE the rate (state 0 = new), since after rating
  // the state changes to learning (1) or review (2).
  db.reviewLog.add({
    wordId: word.id,
    lang: word.lang,
    rating: rating as 1 | 2 | 3 | 4,
    reviewedAt: now,
    wasNew: prog.state === 0,
  }).catch((err) => {
    console.warn('[srs] reviewLog.add failed (non-fatal):', err);
  });

  return next;
}

/** Get all words that are due for review today (or new). */
export async function getDueQueue(lang: Language, allWords: Word[]): Promise<Word[]> {
  const progressRows = await db.wordProgress.where('lang').equals(lang).toArray();
  const progressMap = new Map(progressRows.map((p) => [p.wordId, p]));
  const now = Date.now();

  const due: Word[] = [];
  const newOnes: Word[] = [];

  for (const w of allWords) {
    const p = progressMap.get(w.id);
    if (!p) {
      newOnes.push(w);
    } else if (new Date(p.due).getTime() <= now) {
      due.push(w);
    }
  }

  // Interleave: due reviews first, then new words.
  return [...due, ...newOnes];
}

/** Stats summary for dashboard. */
export async function getStats(lang: Language, allWords: Word[]) {
  const progressRows = await db.wordProgress.where('lang').equals(lang).toArray();
  const now = Date.now();

  let learning = 0;
  let review = 0;
  let dueNow = 0;

  for (const p of progressRows) {
    if (p.state === 1 || p.state === 3) learning++;
    else if (p.state === 2) review++;
    if (new Date(p.due).getTime() <= now) dueNow++;
  }

  const newCount = allWords.length - progressRows.length;
  return {
    total: allWords.length,
    newCount,
    learning,
    review,
    dueNow,
    seen: progressRows.length,
  };
}

export { Rating };
