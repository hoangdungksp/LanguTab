-- Sprint 4.12-pre (D-16 Phase 2): Semantic check results for Exam parts.
--
-- Problem: D-16 Phase 1 (scripts/validate-exam-data.ts) catches STRUCTURAL
-- bugs at build time (broken sceneId refs, malformed correctMapping, etc).
-- But Phase 1 cannot detect SEMANTIC mismatches between Flux-generated
-- scene image and the audio script the kid listens to. Example:
--   audioScript says "Colour the cat orange" but Flux rendered a dog
-- Phase 1 PASSES (cat is in regions[], cat is in palette, well-formed) —
-- yet the test is broken for the kid.
--
-- Fix: Admin runs `POST /admin/exam/semantic-check/:levelId/:partId`.
-- Worker sends scene image + effective audioScript to Gemini Vision.
-- Gemini extracts entities from both, compares, returns confidence +
-- lists of missing/extra entities. Result is upserted here for the
-- Phase 3 admin dashboard to surface red flags quickly.
--
-- One row per (level_id, part_id). Re-running the check upserts (INSERT
-- OR REPLACE) so we always have the latest snapshot. History/audit log
-- explicitly NOT kept — dashboard only needs current status.
--
-- Same architectural pattern as exam_audio_scripts (migration 11) and
-- drop_zone_overrides (migration 10):
--   - PRIMARY KEY (level_id, part_id)
--   - Admin-only write, GET via authenticated admin endpoint (Phase 3)
--
-- NOTE: Sprint 4.12 (D1 sync exam attempts, was scheduled as migration 12
-- in HANDOFF.md) is bumped to slot 13 since this Phase 2 work shipped first.

CREATE TABLE IF NOT EXISTS exam_semantic_checks (
  level_id          TEXT    NOT NULL,
  part_id           TEXT    NOT NULL,
  status            TEXT    NOT NULL,  -- 'pass' | 'warn' | 'fail' | 'error'
  confidence        REAL    NOT NULL,  -- 0.0 to 1.0
  caption_text      TEXT,               -- Gemini's free-form image caption
  image_entities    TEXT,               -- JSON array (entities seen)
  script_entities   TEXT,               -- JSON array (entities mentioned)
  missing_entities  TEXT,               -- JSON array (in script, NOT in image)
  extra_entities    TEXT,               -- JSON array (in image, NOT in script)
  gemini_model      TEXT,               -- e.g. 'gemini-2.5-flash'
  error_detail      TEXT,               -- populated when status='error'
  checked_at        INTEGER NOT NULL,   -- epoch seconds
  PRIMARY KEY (level_id, part_id)
);

CREATE INDEX IF NOT EXISTS idx_semantic_status
  ON exam_semantic_checks(status);

CREATE INDEX IF NOT EXISTS idx_semantic_checked_at
  ON exam_semantic_checks(checked_at);
