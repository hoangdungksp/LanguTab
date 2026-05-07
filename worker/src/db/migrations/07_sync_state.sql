CREATE TABLE IF NOT EXISTS sync_state (
  user_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  last_pull_at INTEGER,
  last_push_at INTEGER,
  PRIMARY KEY (user_id, device_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
