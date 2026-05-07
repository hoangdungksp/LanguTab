-- LinguTab monitoring schema (D1)
--
-- Two tables only:
--   1. metrics_snapshots — time-series of resource usage (cron writes every 15m)
--   2. alerts_log         — alerts sent (dedup + history for admin dashboard)
--
-- Sized for moderate retention. At 15m cron, 30 days = 2880 rows in
-- metrics_snapshots. Far below D1's 1B-row soft limit.
--
-- Run via: wrangler d1 execute lingua-newtab-metrics --file=src/db/schema.sql

-- ─── Metrics snapshots ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS metrics_snapshots (
  -- Unix milliseconds. PK so cron writes are O(1).
  timestamp INTEGER PRIMARY KEY,

  -- Quota usage at the time of this snapshot
  neurons_used INTEGER NOT NULL,
  neurons_limit INTEGER NOT NULL,

  workers_requests INTEGER NOT NULL,
  workers_limit INTEGER NOT NULL,

  kv_writes INTEGER NOT NULL,
  kv_writes_limit INTEGER NOT NULL,

  -- Business metrics
  dau INTEGER NOT NULL DEFAULT 0,
  mau INTEGER NOT NULL DEFAULT 0,
  total_users INTEGER NOT NULL DEFAULT 0,
  pro_users INTEGER NOT NULL DEFAULT 0,

  -- AI generation health
  stories_today INTEGER NOT NULL DEFAULT 0,
  ai_success_rate REAL NOT NULL DEFAULT 1.0,
  ai_avg_latency_ms INTEGER NOT NULL DEFAULT 0,

  -- Errors
  error_count INTEGER NOT NULL DEFAULT 0,
  error_rate REAL NOT NULL DEFAULT 0.0,

  -- Full Metrics JSON for forensics / new fields without schema migration
  raw_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_metrics_time
  ON metrics_snapshots(timestamp DESC);

-- ─── Alerts log ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts_log (
  -- Dedup key: format "<resource>:<severity>:<hour_bucket>"
  -- Hour bucket = floor(timestamp / 3600000)
  -- This means ONE alert per resource+severity per hour.
  id TEXT PRIMARY KEY,

  severity TEXT NOT NULL,         -- 'info' | 'warning' | 'critical'
  resource TEXT NOT NULL,         -- 'workers_ai' | 'kv_writes' | 'errors' | 'anomaly'
  title TEXT NOT NULL,
  body TEXT NOT NULL,             -- markdown body of the alert
  sent_at INTEGER NOT NULL,       -- Unix ms when actually sent
  email_id TEXT,                  -- Resend response id (null on failure)
  email_status TEXT,              -- 'sent' | 'failed'
  failure_reason TEXT             -- if email_status='failed'
);

CREATE INDEX IF NOT EXISTS idx_alerts_time
  ON alerts_log(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_resource
  ON alerts_log(resource, severity, sent_at DESC);
