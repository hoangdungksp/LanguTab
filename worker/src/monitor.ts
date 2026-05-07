/**
 * Cron handler — runs every 15 minutes via Cloudflare Cron Triggers.
 *
 * Workflow:
 *   1. Collect current metrics (KV + D1)
 *   2. Persist snapshot to D1 (for trend analysis + admin dashboard)
 *   3. Detect alerts (quota thresholds + anomalies)
 *   4. Send each alert via Resend (skipping dedup'd ones)
 *   5. If 9am ICT (= 2am UTC), also send daily summary
 *
 * Cron expression in wrangler.toml: `* /15 * * * *` (every 15 mins).
 *
 * Total work per run: 5-10 KV reads, 1 D1 write, maybe 1-3 emails. Well
 * under any free-tier cap.
 */

import { collectMetrics, type Metrics } from './metrics';
import {
  detectAlerts,
  buildDailySummary,
  sendAlertEmail,
  type Alert,
} from './alerts';

export interface CronEnv {
  RATE_LIMITER?: KVNamespace;
  DB?: D1Database;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  RESEND_TO_EMAIL?: string;
}

export async function runMonitorCron(
  event: ScheduledEvent,
  env: CronEnv,
): Promise<void> {
  console.log('[monitor] cron fired at', new Date(event.scheduledTime).toISOString());

  // 1. Collect metrics (cheap — KV reads + 1-2 D1 queries)
  const metrics = await collectMetrics(env);
  console.log('[monitor] metrics', JSON.stringify({
    neurons: metrics.neurons.percentUsed,
    workers: metrics.workers.percentUsed,
    kv: metrics.kv.percentUsed,
    dau: metrics.users.dau,
    errors: metrics.errors.rate,
  }));

  // 2. Persist snapshot
  await persistSnapshot(env.DB, metrics);

  // 3. Load history for anomaly detection (last 7 snapshots, cheap query)
  const history = await loadRecentHistory(env.DB, 7);

  // 4. Detect alerts
  const alerts = detectAlerts(metrics, history);

  // 5. Send daily summary at ~9am ICT (2am UTC)
  const utcHour = new Date().getUTCHours();
  const utcMin = new Date().getUTCMinutes();
  // Cron runs every 15m, so this branch fires for one run at 02:00-02:14 UTC
  if (utcHour === 2 && utcMin < 15) {
    const yesterdayMidnight = new Date();
    yesterdayMidnight.setUTCDate(yesterdayMidnight.getUTCDate() - 1);
    yesterdayMidnight.setUTCHours(0, 0, 0, 0);
    const prevDayMetrics = await loadSnapshotNear(env.DB, yesterdayMidnight.getTime());
    alerts.push(buildDailySummary(metrics, prevDayMetrics ?? undefined));
  }

  // 6. Send each alert
  for (const alert of alerts) {
    const ok = await sendAlertEmail(alert, env);
    console.log(
      `[monitor] alert ${alert.id} (${alert.severity}) →`,
      ok ? 'sent or deduped' : 'failed',
    );
  }
}

// ─── Persistence helpers ───────────────────────────────────────────────────
async function persistSnapshot(
  db: D1Database | undefined,
  metrics: Metrics,
): Promise<void> {
  if (!db) {
    console.warn('[monitor] no D1 binding; skipping snapshot persist');
    return;
  }
  try {
    await db
      .prepare(
        `INSERT OR REPLACE INTO metrics_snapshots
         (timestamp, neurons_used, neurons_limit, workers_requests, workers_limit,
          kv_writes, kv_writes_limit, dau, mau, total_users, pro_users,
          stories_today, ai_success_rate, ai_avg_latency_ms,
          error_count, error_rate, raw_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        metrics.timestamp,
        metrics.neurons.used,
        metrics.neurons.limit,
        metrics.workers.requests,
        metrics.workers.limit,
        metrics.kv.writes,
        metrics.kv.limit,
        metrics.users.dau,
        metrics.users.mau,
        metrics.users.total,
        metrics.users.pro,
        metrics.ai.storiesGenerated,
        metrics.ai.successRate,
        metrics.ai.avgLatencyMs,
        metrics.errors.count,
        metrics.errors.rate,
        JSON.stringify(metrics),
      )
      .run();
  } catch (err) {
    console.error('[monitor] persist failed', err);
  }
}

async function loadRecentHistory(
  db: D1Database | undefined,
  limit: number,
): Promise<Metrics[]> {
  if (!db) return [];
  try {
    const result = await db
      .prepare(
        `SELECT raw_json FROM metrics_snapshots
         ORDER BY timestamp DESC LIMIT ?`,
      )
      .bind(limit)
      .all<{ raw_json: string }>();
    return (result.results ?? [])
      .map((row) => {
        try { return JSON.parse(row.raw_json) as Metrics; } catch { return null; }
      })
      .filter((m): m is Metrics => m !== null);
  } catch (err) {
    console.error('[monitor] history load failed', err);
    return [];
  }
}

/**
 * Find the metrics snapshot closest to (but not later than) the given
 * timestamp. Used for "yesterday" baseline in daily summary.
 */
async function loadSnapshotNear(
  db: D1Database | undefined,
  timestamp: number,
): Promise<Metrics | null> {
  if (!db) return null;
  try {
    const row = await db
      .prepare(
        `SELECT raw_json FROM metrics_snapshots
         WHERE timestamp <= ?
         ORDER BY timestamp DESC LIMIT 1`,
      )
      .bind(timestamp)
      .first<{ raw_json: string }>();
    if (!row) return null;
    return JSON.parse(row.raw_json) as Metrics;
  } catch (err) {
    console.error('[monitor] near load failed', err);
    return null;
  }
}
