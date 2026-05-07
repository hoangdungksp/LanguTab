CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  tier TEXT NOT NULL DEFAULT 'free',
  tier_expires_at INTEGER,
  created_at INTEGER NOT NULL,
  last_active_at INTEGER NOT NULL,
  deleted_at INTEGER
);
