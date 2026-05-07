-- Migration 09 — Billing (Lemon Squeezy integration)
--
-- Adds the columns we need to:
--   1. Look up a user when a webhook arrives (subscription_updated /
--      subscription_cancelled deliver only the subscription_id, not the
--      original custom user_id we passed at checkout)
--   2. Surface the customer_id so admin can deep-link into Lemon Squeezy
--      dashboard for support tickets
--
-- billing_events is an append-only audit log so we can (a) replay events
-- if anything goes wrong, (b) debug webhook issues without spelunking in
-- Lemon Squeezy's UI, (c) eventually support refund / dunning flows.
--
-- Run via:
--   wrangler d1 execute lingua-newtab-metrics --remote --file=src/db/migrations/09_billing.sql

-- ─── Lemon Squeezy linkage on users ────────────────────────────────────────
-- ALTER TABLE ADD COLUMN is idempotent on D1 only when the column doesn't
-- already exist; we wrap each in a separate statement so a partial re-run
-- (e.g. one column added on a previous attempt) doesn't blow up the rest.
ALTER TABLE users ADD COLUMN ls_subscription_id TEXT;
ALTER TABLE users ADD COLUMN ls_customer_id TEXT;

-- Hot path for webhook handler: "find user by subscription_id" runs on
-- every subscription_updated / subscription_cancelled event.
CREATE INDEX IF NOT EXISTS idx_users_ls_sub ON users(ls_subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_ls_customer ON users(ls_customer_id);

-- ─── Billing events (audit log) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS billing_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,                  -- nullable: we may receive an event for
                                 -- a user we don't know yet (rare race)
  event_name TEXT NOT NULL,      -- 'subscription_created', 'order_created',
                                 -- 'subscription_updated', 'subscription_cancelled',
                                 -- 'subscription_resumed', 'subscription_expired',
                                 -- 'admin_test_upgrade' (manual test path)

  ls_subscription_id TEXT,       -- present on subscription_* events
  ls_order_id TEXT,              -- present on order_created (lifetime)
  ls_customer_id TEXT,
  ls_variant_id TEXT,            -- which Lemon Squeezy product variant

  -- Resulting tier change applied to the user (if any). Helps trace
  -- "user X says they upgraded but tier is still free" issues.
  applied_tier TEXT,             -- 'free' | 'pro' | 'lifetime' | 'banned' | null
  applied_expires_at INTEGER,    -- Unix ms

  -- Full webhook payload (or admin reason). Heavy-ish but D1 storage
  -- is cheap and audit data is read rarely.
  raw_json TEXT NOT NULL,

  received_at INTEGER NOT NULL,  -- Unix ms when worker received the event
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_billing_events_user ON billing_events(user_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_events_sub ON billing_events(ls_subscription_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_events_recv ON billing_events(received_at DESC);
