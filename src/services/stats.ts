/**
 * Stats service — aggregates the review log into dashboard-ready data.
 *
 * Design:
 *   - All queries are idx-driven (`reviewedAt` index for date ranges).
 *   - Data shapes match what Recharts expects: arrays of plain objects.
 *   - All time bucketing is done in user's local timezone (their study habits
 *     are local), via Date.toDateString() / .toLocaleDateString().
 *   - Cheap to recompute; no caching layer needed at this scale (10K events
 *     would be ~5ms total). If review log grows beyond ~50K rows we'll
 *     need pre-aggregation, but that's a year+ away for any single user.
 */

import { db } from './db';
import { wordsByLang } from '../data';
import type { Language, ReviewLog } from '../types';

// ────────────────────────────────────────────────────────────────────────────
// Types for chart-ready data
// ────────────────────────────────────────────────────────────────────────────

export interface DailyStats {
  /** YYYY-MM-DD key in local timezone */
  date: string;
  /** Human-friendly label, e.g. "T2", "29/4" */
  label: string;
  reviews: number;
  newWords: number;
  /** Average rating (1-4, where 4=Easy) — null if no reviews this day */
  avgRating: number | null;
}

export interface MasteryDistribution {
  new: number;        // state 0 — never seen or only just started
  learning: number;   // state 1
  review: number;     // state 2 — in stable rotation
  relearning: number; // state 3 — failed and back in learning
  /** Words user has actually reviewed at least once */
  seen: number;
  /** Total HSK1 words for the lang */
  total: number;
}

export interface OverviewStats {
  /** Words completed today (any rating) */
  reviewsToday: number;
  /** Brand-new words seen today (wasNew=true) */
  newWordsToday: number;
  /** Total words ever reviewed */
  totalReviews: number;
  /** Total unique words user has rated at least once */
  uniqueWordsLearned: number;
  /** Days the user studied at least once */
  daysActive: number;
  /** Reviews per active day (average) */
  reviewsPerDay: number;
  /** Current streak (consecutive days with ≥1 review) */
  currentStreak: number;
  /** Best streak ever achieved */
  longestStreak: number;
}

export interface HeatmapDay {
  /** YYYY-MM-DD */
  date: string;
  /** Number of reviews on that day */
  count: number;
  /** Visual intensity 0-4 (matches GitHub-style 5-level scale) */
  level: 0 | 1 | 2 | 3 | 4;
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

/** Local-timezone YYYY-MM-DD key for a Date. */
function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Vietnamese day-of-week short label */
function dayLabel(d: Date): string {
  const dow = d.getDay(); // 0=Sun
  return ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][dow];
}

/** Read all log rows for a lang within a date range (inclusive). */
async function logsInRange(
  lang: Language,
  from: Date,
  to: Date,
): Promise<ReviewLog[]> {
  return db.reviewLog
    .where('reviewedAt')
    .between(from, to, true, true)
    .filter((row) => row.lang === lang)
    .toArray();
}

// ────────────────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────────────────

/**
 * Per-day stats for the last N days (oldest first, ready for line chart).
 * Days with zero reviews are still included with reviews=0 so the chart
 * doesn't have gaps.
 */
export async function getDailyStats(lang: Language, days = 30): Promise<DailyStats[]> {
  const now = new Date();
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - (days - 1));

  const logs = await logsInRange(lang, from, now);

  // Bucket by date key
  const buckets = new Map<string, { reviews: number; newWords: number; ratingSum: number }>();
  for (const r of logs) {
    const key = dateKey(new Date(r.reviewedAt));
    const b = buckets.get(key) ?? { reviews: 0, newWords: 0, ratingSum: 0 };
    b.reviews += 1;
    if (r.wasNew) b.newWords += 1;
    b.ratingSum += r.rating;
    buckets.set(key, b);
  }

  // Fill in every day in range so chart has uniform x-axis
  const result: DailyStats[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    const key = dateKey(d);
    const b = buckets.get(key);
    result.push({
      date: key,
      label: dayLabel(d),
      reviews: b?.reviews ?? 0,
      newWords: b?.newWords ?? 0,
      avgRating: b ? b.ratingSum / b.reviews : null,
    });
  }

  return result;
}

/**
 * GitHub-style heatmap data: last N days, with intensity buckets.
 * Default 84 days = 12 weeks for a wide-but-readable grid.
 */
export async function getHeatmap(lang: Language, days = 84): Promise<HeatmapDay[]> {
  const daily = await getDailyStats(lang, days);

  // Determine breakpoints based on the user's own range — clamp top bucket
  // at the 75th percentile so a heavy day doesn't make every other look flat.
  const counts = daily.map((d) => d.reviews).filter((c) => c > 0).sort((a, b) => a - b);
  const p75 = counts[Math.floor(counts.length * 0.75)] ?? 1;
  const max = Math.max(p75, 4); // baseline so 1-4 reviews gets level 1

  return daily.map((d) => ({
    date: d.date,
    count: d.reviews,
    level: bucketLevel(d.reviews, max),
  }));
}

function bucketLevel(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  const pct = count / max;
  if (pct < 0.25) return 1;
  if (pct < 0.5) return 2;
  if (pct < 0.75) return 3;
  return 4;
}

/**
 * Distribution of FSRS state across words for the lang.
 * Used for the pie/donut chart "Mastery breakdown".
 */
export async function getMasteryDistribution(lang: Language): Promise<MasteryDistribution> {
  const allWords = wordsByLang[lang];
  const progress = await db.wordProgress.where('lang').equals(lang).toArray();

  let learning = 0;
  let review = 0;
  let relearning = 0;
  let seen = 0;
  for (const p of progress) {
    seen += 1;
    if (p.state === 1) learning += 1;
    else if (p.state === 2) review += 1;
    else if (p.state === 3) relearning += 1;
  }

  return {
    new: allWords.length - seen,
    learning,
    review,
    relearning,
    seen,
    total: allWords.length,
  };
}

/**
 * High-level overview metrics for the top of the dashboard.
 */
export async function getOverview(lang: Language): Promise<OverviewStats> {
  const allLogs = await db.reviewLog.where('lang').equals(lang).toArray();

  if (allLogs.length === 0) {
    return {
      reviewsToday: 0,
      newWordsToday: 0,
      totalReviews: 0,
      uniqueWordsLearned: 0,
      daysActive: 0,
      reviewsPerDay: 0,
      currentStreak: 0,
      longestStreak: 0,
    };
  }

  const todayKey = dateKey(new Date());

  let reviewsToday = 0;
  let newWordsToday = 0;
  const uniqueWords = new Set<string>();
  const activeDays = new Set<string>();

  for (const log of allLogs) {
    const k = dateKey(new Date(log.reviewedAt));
    activeDays.add(k);
    uniqueWords.add(log.wordId);
    if (k === todayKey) {
      reviewsToday += 1;
      if (log.wasNew) newWordsToday += 1;
    }
  }

  const daysActive = activeDays.size;
  const totalReviews = allLogs.length;
  const reviewsPerDay = daysActive > 0 ? totalReviews / daysActive : 0;

  const { current, longest } = computeStreaks(activeDays);

  return {
    reviewsToday,
    newWordsToday,
    totalReviews,
    uniqueWordsLearned: uniqueWords.size,
    daysActive,
    reviewsPerDay,
    currentStreak: current,
    longestStreak: longest,
  };
}

/**
 * Streak calculation from a set of active-day keys.
 *
 * Current streak: consecutive days ending TODAY (or yesterday — we extend
 * one day of grace since a user studying late at night might miss midnight).
 *
 * Longest streak: max consecutive run anywhere in the history.
 */
function computeStreaks(activeDays: Set<string>): { current: number; longest: number } {
  if (activeDays.size === 0) return { current: 0, longest: 0 };

  // Walk back from today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let current = 0;
  // Grace period: if user hasn't studied today yet, count from yesterday so
  // the streak doesn't appear broken until they actually miss a day.
  const startOffset = activeDays.has(dateKey(today)) ? 0 : 1;

  for (let i = startOffset; i < 9999; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (activeDays.has(dateKey(d))) {
      current += 1;
    } else {
      break;
    }
  }

  // For longest, sort all keys and find max run
  const sortedKeys = [...activeDays].sort();
  let longest = 0;
  let run = 1;
  for (let i = 1; i < sortedKeys.length; i++) {
    const prev = new Date(sortedKeys[i - 1]);
    const curr = new Date(sortedKeys[i]);
    const dayDiff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (dayDiff === 1) {
      run += 1;
    } else {
      longest = Math.max(longest, run);
      run = 1;
    }
  }
  longest = Math.max(longest, run);

  return { current, longest: Math.max(longest, current) };
}

/**
 * Words learned TODAY — for the "what did I learn today" section.
 * Returns word IDs in chronological order of first review today.
 * "Learned" here means: rated for the first time today (wasNew=true).
 */
export async function getWordsLearnedToday(lang: Language): Promise<string[]> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrow = new Date(todayStart);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const logs = await logsInRange(lang, todayStart, tomorrow);
  const newOnes = logs
    .filter((l) => l.wasNew)
    .sort((a, b) => new Date(a.reviewedAt).getTime() - new Date(b.reviewedAt).getTime());

  return newOnes.map((l) => l.wordId);
}

/**
 * Words REVIEWED today (whether new or not) — for the activity feed.
 * Distinct word IDs in chronological order.
 */
export async function getWordsReviewedToday(lang: Language): Promise<string[]> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrow = new Date(todayStart);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const logs = await logsInRange(lang, todayStart, tomorrow);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const l of logs.sort((a, b) => new Date(a.reviewedAt).getTime() - new Date(b.reviewedAt).getTime())) {
    if (!seen.has(l.wordId)) {
      result.push(l.wordId);
      seen.add(l.wordId);
    }
  }
  return result;
}
