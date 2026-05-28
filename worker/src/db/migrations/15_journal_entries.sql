-- Migration 15 — Journal entries (D-22, server-side persistence)
--
-- The journal moved from local-only (Dexie) to D1 so entries survive a
-- browser reinstall / device switch and back the web dashboard later.
-- Notes are stored as a JSON string (array of {wrong, fix, explain}).
--
-- Run via:
--   wrangler d1 execute lingua-newtab-metrics --remote --file=src/db/migrations/15_journal_entries.sql

CREATE TABLE IF NOT EXISTS journal_entries (
  id          TEXT    PRIMARY KEY,           -- 'jr_<ts>_<rand>'
  user_id     TEXT    NOT NULL,
  lang        TEXT    NOT NULL,              -- 'en' | 'zh'
  date        TEXT    NOT NULL,              -- YYYY-MM-DD
  text        TEXT    NOT NULL,
  corrected   TEXT,
  notes       TEXT,                          -- JSON: [{wrong,fix,explain}]
  summary     TEXT,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_journal_user_created ON journal_entries(user_id, created_at DESC);
