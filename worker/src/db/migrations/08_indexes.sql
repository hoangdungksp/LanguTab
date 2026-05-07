CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier, tier_expires_at);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_word_progress_user ON word_progress(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_stories_user ON user_stories(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_stories_fav ON user_stories(user_id, is_favorite, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_images_user ON custom_images(user_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_log_user_time ON review_log(user_id, reviewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_log_user_word ON review_log(user_id, word_id, reviewed_at DESC);
