-- LinguTab multi-user schema (D1) — Phase 1
--
-- Extends the monitoring schema (metrics_snapshots, alerts_log) with
-- per-user tables. All user data tables have user_id FK and ON DELETE CASCADE
-- so account deletion wipes everything cleanly.
--
-- Run via:
--   wrangler d1 execute lingua-newtab-metrics --remote --file=src/db/multiuser_schema.sql

-- ─── Users ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  -- Google OAuth `sub` claim — stable across email changes, never reused.
  -- 21 chars typical, never contains PII. Primary identifier for everything.
  id TEXT PRIMARY KEY,

  -- Snapshot of user info from Google. Updated on each sign-in (so display
  -- name and email stay fresh if user changes them on Google account).
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,

  -- Subscription tier. Defaults to 'free'. Changed by Lemon Squeezy webhook
  -- handler when user upgrades/cancels.
  -- Values: 'free' | 'pro' | 'lifetime' | 'banned'
  tier TEXT NOT NULL DEFAULT 'free',
  -- For 'pro' (recurring), Unix ms when subscription expires. NULL for
  -- 'free' and 'lifetime'.
  tier_expires_at INTEGER,

  -- Lifecycle timestamps (Unix ms)
  created_at INTEGER NOT NULL,
  last_active_at INTEGER NOT NULL,

  -- Soft delete flag — used for "delete account" flow that needs a grace
  -- period before hard-wipe (in case user changes mind). 0 = active, 1 =
  -- pending deletion (will be hard-deleted by cron after 30 days).
  deleted_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier, tier_expires_at);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(last_active_at DESC);

-- ─── Word progress (FSRS state per user × word) ────────────────────────────
-- Mirrors the WordProgress shape in src/types/index.ts. Stored as a row per
-- (user, word) pair instead of a JSON blob so we can index/query efficiently
-- (e.g. "show me all due cards across users for stats").
CREATE TABLE IF NOT EXISTS word_progress (
  user_id TEXT NOT NULL,
  word_id TEXT NOT NULL,         -- e.g. 'zh_001', 'en_apple'
  lang TEXT NOT NULL,            -- 'zh' | 'en'

  -- FSRS scheduler state
  due INTEGER,                   -- Unix ms of next review
  state INTEGER NOT NULL DEFAULT 0,  -- 0=new, 1=learning, 2=review, 3=relearning
  stability REAL,
  difficulty REAL,
  reps INTEGER NOT NULL DEFAULT 0,
  lapses INTEGER NOT NULL DEFAULT 0,
  last_review INTEGER,           -- Unix ms

  -- Conflict resolution: client picks max(local.updated_at, server.updated_at)
  updated_at INTEGER NOT NULL,

  PRIMARY KEY (user_id, word_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_word_progress_user ON word_progress(user_id, updated_at DESC);

-- ─── User-generated stories (AI gen) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_stories (
  -- 'usr_<timestamp>_<rand>' — generated client-side, sync'd to server
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,

  hsk_level INTEGER NOT NULL,     -- 1-6
  genre TEXT NOT NULL,            -- preset or custom string
  is_favorite INTEGER NOT NULL DEFAULT 0,  -- SQLite boolean (0/1)

  -- Original generation params (so user can re-generate variants).
  -- JSON blob — { hskLevel, genre, description, sentenceCount, includeDialogue }
  prompt_json TEXT NOT NULL,

  -- Compiled Story object as JSON. We don't normalize sentences/tokens into
  -- separate tables because they're never queried independently — always
  -- read together as the full story. JSON keeps the schema compact.
  story_json TEXT NOT NULL,

  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_stories_user ON user_stories(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_stories_fav ON user_stories(user_id, is_favorite, created_at DESC);

-- ─── Settings (per user) ───────────────────────────────────────────────────
-- Single row per user, JSON blob holds entire Settings object. JSON because:
--   1. Settings shape evolves often — adding a column per setting is painful.
--   2. Settings always read whole, never queried by individual fields.
--   3. Small payload (<5KB) — JSON parsing cost negligible.
CREATE TABLE IF NOT EXISTS settings (
  user_id TEXT PRIMARY KEY,
  data_json TEXT NOT NULL,       -- whole Settings object
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── Custom flashcard images (metadata) ────────────────────────────────────
-- The actual binary lives in R2 (next phase). This table stores metadata
-- that lets us render image references quickly without R2 calls.
CREATE TABLE IF NOT EXISTS custom_images (
  user_id TEXT NOT NULL,
  word_id TEXT NOT NULL,
  lang TEXT NOT NULL,            -- 'zh' | 'en'

  -- R2 object key — derive download URL by signing this key. Format:
  -- '<user_id>/<lang>/<word_id>.<ext>'
  r2_key TEXT NOT NULL,
  mime_type TEXT NOT NULL,       -- 'image/png', 'image/jpeg', etc.
  size_bytes INTEGER NOT NULL,

  uploaded_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,

  PRIMARY KEY (user_id, word_id, lang),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_custom_images_user ON custom_images(user_id, uploaded_at DESC);

-- ─── Review log (append-only event stream) ─────────────────────────────────
-- Used by stats dashboard for historical analytics. Append-only = no updates,
-- only inserts; conflict resolution trivial because each row is independent.
CREATE TABLE IF NOT EXISTS review_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  word_id TEXT NOT NULL,
  lang TEXT NOT NULL,
  rating INTEGER NOT NULL,       -- 1=again, 2=hard, 3=good, 4=easy
  reviewed_at INTEGER NOT NULL,  -- Unix ms — when user actually rated
  created_at INTEGER NOT NULL,   -- Unix ms — when row was inserted
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_review_log_user_time ON review_log(user_id, reviewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_log_user_word ON review_log(user_id, word_id, reviewed_at DESC);

-- ─── Sync state (per user, per device) ─────────────────────────────────────
-- Tracks what each device has last synced, used for delta-sync. Each
-- browser/device gets a unique device_id stored client-side.
CREATE TABLE IF NOT EXISTS sync_state (
  user_id TEXT NOT NULL,
  device_id TEXT NOT NULL,       -- Random UUID generated client-side once
  last_pull_at INTEGER,          -- Last successful pull from server
  last_push_at INTEGER,          -- Last successful push to server
  PRIMARY KEY (user_id, device_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
