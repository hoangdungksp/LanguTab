-- D-19: Role-based access control.
-- Adds a `role` column to users: 'user' | 'editor' | 'admin'.
--   user   — normal learner (default)
--   editor — may edit exam content (audio script, scene gen/upload, calibration, gen audio)
--   admin  — editor + user/role management
--
-- Replaces the old static ADMIN_TOKEN + hardcoded email allowlist (which
-- shipped the token in the client bundle). ADMIN_TOKEN is kept server-side
-- only as a break-glass superadmin credential.
--
-- Run via:
--   wrangler d1 execute lingua-newtab-metrics --remote --file=src/db/migrations/13_user_role.sql

ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user';

-- Seed the initial admin (project owner). Others promoted via the admin UI / API.
UPDATE users SET role = 'admin' WHERE email = 'jasonnguyenksp@gmail.com';
