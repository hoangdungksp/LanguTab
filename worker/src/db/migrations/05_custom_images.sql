CREATE TABLE IF NOT EXISTS custom_images (
  user_id TEXT NOT NULL,
  word_id TEXT NOT NULL,
  lang TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  uploaded_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, word_id, lang),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
