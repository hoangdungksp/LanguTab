/**
 * Exam progress tracking — local persistence via localStorage with a
 * forward path to D1 sync (Sprint 5+ once exam_attempts schema lands).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Why localStorage now, not Dexie
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Existing Dexie schema doesn't have an exam attempts table yet. Instead
 * of expanding the schema mid-sprint (with migrations + sync rules), we
 * store progress in a single localStorage key. Data shape is intentionally
 * thin: just enough to drive UI state (level completion, planet progress,
 * gating). Score history will go in Dexie when we add attempt detail view.
 *
 * Storage key: `linguanewtab.exam.progress.v1`
 * Shape: `{ completed: { [levelNumber]: { score, completedAt } } }`
 */

import { authedFetch } from './authService';

const STORAGE_KEY = 'linguanewtab.exam.progress.v1';
const WORKER_URL = 'https://lingua-newtab-worker.kspstudio.workers.dev';

/**
 * D-21: best-effort mirror of a finished level to D1 so the web dashboard can
 * show progress. Fire-and-forget — never blocks or throws into the exam flow;
 * silently no-ops when the user isn't signed in. lang is derived from the
 * level number (101+ = Chinese HSK).
 */
export function syncExamProgressToServer(levelNumber: number, stars: number, maxStars: number): void {
  const lang = levelNumber > 100 ? 'zh' : 'en';
  void authedFetch(`${WORKER_URL}/exam/progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ levelNumber, lang, stars, maxStars }),
  }).catch(() => { /* offline / not signed in — local progress still saved */ });
}

export interface LevelCompletion {
  /** Score 0-100 from gradeAttempt. */
  score: number;
  /** Unix ms of completion. */
  completedAt: number;
}

interface ProgressData {
  completed: Record<number, LevelCompletion>;
}

function load(): ProgressData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { completed: {} };
    const parsed = JSON.parse(raw) as ProgressData;
    if (!parsed.completed || typeof parsed.completed !== 'object') {
      return { completed: {} };
    }
    return parsed;
  } catch {
    // Corrupted localStorage entry — start fresh rather than crash.
    return { completed: {} };
  }
}

function save(data: ProgressData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Quota exceeded or storage disabled — silently fail. Progress will
    // reset next session but the exam itself still functions.
  }
}

/**
 * Mark a level as completed with the given score. Idempotent —
 * subsequent calls overwrite (so re-attempts can update score).
 *
 * Threshold for "completed" is up to caller. Recommendation:
 * - Score ≥ 60 → mark completed (passing grade)
 * - Score < 60 → don't mark (allow retry)
 *
 * The decision is up to ExamSession.finishAttempt which has score context.
 */
export function markLevelCompleted(levelNumber: number, score: number): void {
  const data = load();
  // Keep the highest score across attempts so progress reflects best effort.
  const existing = data.completed[levelNumber];
  if (!existing || score > existing.score) {
    data.completed[levelNumber] = { score, completedAt: Date.now() };
    save(data);
  }
}

/** Fetch completion record for a single level, or undefined if not played. */
export function getLevelCompletion(levelNumber: number): LevelCompletion | undefined {
  return load().completed[levelNumber];
}

/** Returns true iff the level has been completed (any pass). */
export function isLevelCompleted(levelNumber: number): boolean {
  return getLevelCompletion(levelNumber) !== undefined;
}

/**
 * Count completed levels within a range. Used for planet progress
 * indicators (⭐ 5/20) and unlock gating.
 */
export function countCompletedInRange(start: number, end: number): number {
  const data = load();
  let count = 0;
  for (let n = start; n <= end; n++) {
    if (data.completed[n]) count++;
  }
  return count;
}

/**
 * Reset all progress. Used by debug/admin tooling. Not exposed in normal
 * UI flow (would lose user data accidentally).
 */
export function resetAllProgress(): void {
  save({ completed: {} });
}

/**
 * Fetch every completed level number. Used for export / sync.
 * Returns sorted ascending.
 */
export function getCompletedLevelNumbers(): number[] {
  return Object.keys(load().completed)
    .map(Number)
    .sort((a, b) => a - b);
}
