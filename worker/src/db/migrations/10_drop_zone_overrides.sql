-- Sprint 4.9 (v1.4.0): Drop zone calibration overrides
--
-- Allows admin (Jason) to precisely calibrate drag-name drop zone positions
-- per-level/per-part, since AI-generated scenes don't have predictable
-- character placements that match the hardcoded 3×2 grid.
--
-- Workflow:
--   1. Frontend renders zones from `levels.ts` (hardcoded 3×2 grid by default)
--   2. Frontend fetches GET /exam/calibration/:levelId/:partId on mount
--   3. If override exists → merge: override coords win, hardcoded labels kept
--   4. Admin mode (sessionStorage admin_token set) → drop zones become
--      drag-resize handles. Save button → POST /admin/exam/calibration/...
--
-- Data shape:
--   - Coords (x, y, width, height) stored as 0-1 fractions of the scene
--     image dimensions, so they map directly onto the rendered image
--     regardless of viewport size.
--   - PRIMARY KEY (level_id, part_id, zone_id) — one override per zone
--     per part per level. INSERT OR REPLACE on save = upsert.

CREATE TABLE IF NOT EXISTS drop_zone_overrides (
  level_id    TEXT NOT NULL,
  part_id     TEXT NOT NULL,
  zone_id     TEXT NOT NULL,
  x           REAL NOT NULL,
  y           REAL NOT NULL,
  width       REAL NOT NULL,
  height      REAL NOT NULL,
  updated_at  INTEGER NOT NULL,
  updated_by  TEXT,
  PRIMARY KEY (level_id, part_id, zone_id)
);

CREATE INDEX IF NOT EXISTS idx_dzoverride_levelpart
  ON drop_zone_overrides(level_id, part_id);
