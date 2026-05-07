CREATE TABLE IF NOT EXISTS user_stories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  hsk_level INTEGER NOT NULL,
  genre TEXT NOT NULL,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  prompt_json TEXT NOT NULL,
  story_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
