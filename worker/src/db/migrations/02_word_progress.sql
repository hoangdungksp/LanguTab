CREATE TABLE IF NOT EXISTS word_progress (
  user_id TEXT NOT NULL,
  word_id TEXT NOT NULL,
  lang TEXT NOT NULL,
  due INTEGER,
  state INTEGER NOT NULL DEFAULT 0,
  stability REAL,
  difficulty REAL,
  reps INTEGER NOT NULL DEFAULT 0,
  lapses INTEGER NOT NULL DEFAULT 0,
  last_review INTEGER,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, word_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
