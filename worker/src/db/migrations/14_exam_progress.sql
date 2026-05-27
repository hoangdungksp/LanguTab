-- Migration 14 — Exam progress (server-side, for the web dashboard, D-21)
--
-- The extension tracks exam completion in localStorage (examProgressService).
-- To let the web dashboard (parents/teachers/admin) see how learners are
-- doing, we mirror best-per-level progress to D1 when the user is signed in.
--
-- One row per (user, level): we keep the BEST stars and a small attempt
-- counter — enough for progress bars / per-planet completion without storing
-- every attempt.
--
-- Run via:
--   wrangler d1 execute lingua-newtab-metrics --remote --file=src/db/migrations/14_exam_progress.sql

CREATE TABLE IF NOT EXISTS exam_progress (
  user_id            TEXT    NOT NULL,
  level_number       INTEGER NOT NULL,
  lang               TEXT    NOT NULL DEFAULT 'en',  -- 'en' | 'zh'
  best_stars         INTEGER NOT NULL DEFAULT 0,
  max_stars          INTEGER NOT NULL,               -- parts in the level (4 or 5)
  attempts           INTEGER NOT NULL DEFAULT 1,
  first_completed_at INTEGER NOT NULL,
  last_attempt_at    INTEGER NOT NULL,
  PRIMARY KEY (user_id, level_number)
);

CREATE INDEX IF NOT EXISTS idx_exam_progress_user ON exam_progress(user_id);
