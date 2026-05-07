-- Sprint 4.9.4 (v1.6.0): Admin-editable audio scripts per (level, part)
--
-- Problem: AI Flux generates scenes that don't match hardcoded audio scripts.
-- Audio says "Tom wearing red shirt flying kite" but image shows totally
-- different characters. Cambridge YLE exam fails because audio cues don't
-- match visual cues.
--
-- Fix: Allow admin to override audio script per (level, part). Admin views
-- generated image, types description that matches what they see, saves to D1.
-- Worker uses override if exists, falls back to hardcoded script in levels.ts.
--
-- Cache invalidation: existing audioScript hash mechanism (Sprint 4.9.3)
-- handles this automatically — different script text → different hash →
-- different cache key → fresh TTS generation.
--
-- Same architectural pattern as drop_zone_overrides (Sprint 4.9):
--   - PRIMARY KEY (level_id, part_id) — one script override per part
--   - INSERT OR REPLACE on save = upsert
--   - Public read endpoint, admin-only write/delete

CREATE TABLE IF NOT EXISTS exam_audio_scripts (
  level_id    TEXT NOT NULL,
  part_id     TEXT NOT NULL,
  script      TEXT NOT NULL,
  updated_at  INTEGER NOT NULL,
  updated_by  TEXT,
  PRIMARY KEY (level_id, part_id)
);

CREATE INDEX IF NOT EXISTS idx_audio_scripts_level
  ON exam_audio_scripts(level_id);
