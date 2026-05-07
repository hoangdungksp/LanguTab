/**
 * Alert detection + delivery via Resend email.
 *
 * Threshold model (from plan):
 *   - 70% → Warning      (one email per resource per 4 hours)
 *   - 90% → Critical     (one email per resource per 1 hour)
 *   - Daily summary at 9am ICT regardless
 *
 * Dedup strategy:
 *   - Each alert has an `id` like "workers_ai:warning:hour123456"
 *   - Bucket size depends on severity (1h critical, 4h warning)
 *   - Before sending, query D1 alerts_log; skip if id exists
 *   - After sending, insert into alerts_log
 *
 * Anomaly detection (Phase D, lighter version included):
 *   - Error rate > 10% → Critical
 *   - Traffic spike > 5x baseline → Warning (needs history; skipped if <7 snapshots)
 *   - Zero requests in 1h during business hours → Warning
 */

import type { Metrics } from './metrics';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  /** Dedup key — same ID won't be re-sent within its hour bucket */
  id: string;
  severity: AlertSeverity;
  /** Logical grouping — used for filter/dedup. e.g. 'workers_ai', 'kv_writes', 'errors', 'anomaly' */
  resource: string;
  title: string;
  /** Markdown body. Will be rendered as HTML for the email. */
  body: string;
}

// ─── Thresholds ────────────────────────────────────────────────────────────
const THRESHOLD_WARNING = 0.70;
const THRESHOLD_CRITICAL = 0.90;

// Dedup bucket sizes — in milliseconds. Critical alerts more frequent.
const DEDUP_BUCKET_CRITICAL_MS = 60 * 60 * 1000;       // 1h
const DEDUP_BUCKET_WARNING_MS  = 4 * 60 * 60 * 1000;   // 4h
const DEDUP_BUCKET_INFO_MS     = 24 * 60 * 60 * 1000;  // 24h

function dedupBucket(severity: AlertSeverity): number {
  return severity === 'critical'
    ? DEDUP_BUCKET_CRITICAL_MS
    : severity === 'warning'
      ? DEDUP_BUCKET_WARNING_MS
      : DEDUP_BUCKET_INFO_MS;
}

function makeDedupId(resource: string, severity: AlertSeverity): string {
  const bucket = Math.floor(Date.now() / dedupBucket(severity));
  return `${resource}:${severity}:${bucket}`;
}

// ─── Detection ─────────────────────────────────────────────────────────────
/**
 * Inspect current metrics + a short history window, return all alerts that
 * should be sent. History is optional; anomaly checks degrade gracefully if
 * fewer than 7 snapshots are available.
 */
export function detectAlerts(metrics: Metrics, history: Metrics[] = []): Alert[] {
  const alerts: Alert[] = [];

  // ─── Quota thresholds ─────────────────────────────────────────────────
  // Normalize each resource snapshot to a common shape `{used, limit, percentUsed}`
  // so buildQuotaAlertBody can work uniformly. The Metrics type intentionally
  // uses domain-specific field names (`used` for neurons, `requests` for workers,
  // `writes` for kv) for clarity at call sites.
  type NormalizedSnapshot = { used: number; limit: number; percentUsed: number };
  const resources: Array<[string, NormalizedSnapshot, string]> = [
    ['workers_ai', { used: metrics.neurons.used, limit: metrics.neurons.limit, percentUsed: metrics.neurons.percentUsed }, 'Workers AI Neurons'],
    ['workers_requests', { used: metrics.workers.requests, limit: metrics.workers.limit, percentUsed: metrics.workers.percentUsed }, 'Workers requests'],
    ['kv_writes', { used: metrics.kv.writes, limit: metrics.kv.limit, percentUsed: metrics.kv.percentUsed }, 'KV writes'],
  ];

  for (const [resource, snapshot, displayName] of resources) {
    const pct = snapshot.percentUsed;
    if (pct >= THRESHOLD_CRITICAL) {
      alerts.push({
        id: makeDedupId(resource, 'critical'),
        severity: 'critical',
        resource,
        title: `🚨 ${displayName} at ${(pct * 100).toFixed(0)}% — service may degrade`,
        body: buildQuotaAlertBody(displayName, snapshot, 'critical'),
      });
    } else if (pct >= THRESHOLD_WARNING) {
      alerts.push({
        id: makeDedupId(resource, 'warning'),
        severity: 'warning',
        resource,
        title: `⚠️ ${displayName} at ${(pct * 100).toFixed(0)}%`,
        body: buildQuotaAlertBody(displayName, snapshot, 'warning'),
      });
    }
  }

  // ─── Error rate ─────────────────────────────────────────────────────────
  if (metrics.errors.rate > 0.1 && metrics.workers.requests > 100) {
    alerts.push({
      id: makeDedupId('errors', 'critical'),
      severity: 'critical',
      resource: 'errors',
      title: `🚨 Error rate at ${(metrics.errors.rate * 100).toFixed(1)}%`,
      body: buildErrorRateBody(metrics),
    });
  }

  // ─── AI generation health ──────────────────────────────────────────────
  if (metrics.ai.storiesGenerated > 5 && metrics.ai.successRate < 0.8) {
    alerts.push({
      id: makeDedupId('ai_health', 'warning'),
      severity: 'warning',
      resource: 'ai_health',
      title: `⚠️ AI success rate at ${(metrics.ai.successRate * 100).toFixed(0)}%`,
      body: buildAiHealthBody(metrics),
    });
  }

  // ─── Anomaly: traffic spike (when we have ≥7 historical snapshots) ────
  if (history.length >= 7) {
    const baseline = average(history.map((m) => m.workers.requests));
    if (baseline > 0 && metrics.workers.requests > baseline * 5) {
      alerts.push({
        id: makeDedupId('anomaly_spike', 'warning'),
        severity: 'warning',
        resource: 'anomaly',
        title: `⚠️ Traffic spike: ${(metrics.workers.requests / baseline).toFixed(1)}x baseline`,
        body: buildAnomalyBody('spike', metrics, baseline),
      });
    }

    // ─── Anomaly: traffic drop (only during business hours) ───────────────
    // If requests drop to <10% of baseline AND it's not nighttime ICT,
    // that suggests something broke (e.g. extension push out a bad build,
    // CORS misconfigured, etc.).
    const utcHour = new Date().getUTCHours();
    const ictHour = (utcHour + 7) % 24;
    const isBusinessHours = ictHour >= 8 && ictHour <= 22;
    if (
      isBusinessHours &&
      baseline > 50 && // Don't trigger when baseline is tiny
      metrics.workers.requests < baseline * 0.1
    ) {
      alerts.push({
        id: makeDedupId('anomaly_drop', 'warning'),
        severity: 'warning',
        resource: 'anomaly',
        title: `⚠️ Traffic drop: ${metrics.workers.requests} requests vs ${baseline.toFixed(0)} baseline`,
        body: buildAnomalyBody('drop', metrics, baseline),
      });
    }

    // ─── Anomaly: AI latency surge ────────────────────────────────────────
    // p95-style — if average latency is 3x baseline and we have meaningful
    // sample size, alert. Doesn't dedup with success-rate alert above
    // because the resource is different (latency vs success).
    const latencyBaseline = average(history.map((m) => m.ai.avgLatencyMs).filter((v) => v > 0));
    if (
      latencyBaseline > 0 &&
      metrics.ai.avgLatencyMs > latencyBaseline * 3 &&
      metrics.ai.storiesGenerated > 3
    ) {
      alerts.push({
        id: makeDedupId('anomaly_latency', 'warning'),
        severity: 'warning',
        resource: 'anomaly',
        title: `⚠️ AI latency surge: ${metrics.ai.avgLatencyMs}ms vs ${Math.round(latencyBaseline)}ms baseline`,
        body: buildLatencyBody(metrics, latencyBaseline),
      });
    }
  }

  return alerts;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// ─── Body builders ─────────────────────────────────────────────────────────
function buildQuotaAlertBody(
  resource: string,
  snapshot: { used: number; limit: number; percentUsed: number },
  severity: AlertSeverity,
): string {
  const remaining = snapshot.limit - snapshot.used;
  const action = severity === 'critical'
    ? '**URGENT**: Service may start failing soon. Consider:\n' +
      '- Upgrade Cloudflare Workers Paid ($5/mo)\n' +
      '- Or accept service degradation until 00:00 UTC reset'
    : 'Recommended actions:\n' +
      '- Monitor through the day, may resolve naturally\n' +
      '- If pattern repeats, plan upgrade to Workers Paid\n' +
      '- Review if free-tier abuse is happening (anti-abuse rules)';

  return `**${resource}** is at **${(snapshot.percentUsed * 100).toFixed(0)}%** of daily free tier.

| Metric | Value |
|--------|-------|
| Used | ${snapshot.used.toLocaleString()} |
| Limit | ${snapshot.limit.toLocaleString()} |
| Remaining | ${remaining.toLocaleString()} |
| Resets at | 00:00 UTC daily |

${action}

[View dashboard](https://lingua-newtab-admin.pages.dev) · [Cloudflare console](https://dash.cloudflare.com)`;
}

function buildErrorRateBody(metrics: Metrics): string {
  return `Error rate is at **${(metrics.errors.rate * 100).toFixed(1)}%** in the last 15 minutes.

| Metric | Value |
|--------|-------|
| Errors | ${metrics.errors.count} |
| Requests | ${metrics.workers.requests} |
| AI success | ${(metrics.ai.successRate * 100).toFixed(0)}% |

Check Worker logs:
\`\`\`
npx wrangler tail
\`\`\`

Common causes:
- AI provider upstream failure (Workers AI Qwen)
- Bad request from clients (malformed prompts)
- Auth token expirations spiking
- Rate-limit thrashing`;
}

function buildAiHealthBody(metrics: Metrics): string {
  return `AI generation success rate dropped to **${(metrics.ai.successRate * 100).toFixed(0)}%**.

| Metric | Value |
|--------|-------|
| Stories today | ${metrics.ai.storiesGenerated} |
| Success rate | ${(metrics.ai.successRate * 100).toFixed(1)}% |
| Avg latency | ${metrics.ai.avgLatencyMs} ms |

Likely causes:
- Qwen returning unexpected response shape
- Validation pipeline rejecting outputs (pinyin/diacritic checks)
- Network instability between Worker and Workers AI

Tail logs to investigate: \`npx wrangler tail\``;
}

function buildAnomalyBody(
  kind: 'spike' | 'drop' | string,
  metrics: Metrics,
  baseline: number,
): string {
  if (kind === 'drop') {
    return `Detected **traffic drop** during business hours.

| Metric | Value |
|--------|-------|
| Current requests | ${metrics.workers.requests.toLocaleString()} |
| Baseline | ${baseline.toFixed(0)} |
| Drop ratio | ${((1 - metrics.workers.requests / baseline) * 100).toFixed(0)}% lower |

Possible causes:
- 🐛 Recent extension build broke client-side requests (CORS, auth)
- 🌐 Worker URL changed, old extensions stuck on old endpoint
- 🔌 Cloudflare incident in user's region
- 📅 Holiday / weekend (acceptable if pattern repeats weekly)

Check:
1. Recent Worker deployments (any breaking change in headers/routing?)
2. Browser DevTools console on a fresh extension install
3. Cloudflare status: https://www.cloudflarestatus.com`;
  }
  return `Detected **${kind}** anomaly in traffic patterns.

| Metric | Value |
|--------|-------|
| Current requests | ${metrics.workers.requests.toLocaleString()} |
| 7-snapshot baseline | ${baseline.toFixed(0)} |
| Multiplier | ${(metrics.workers.requests / baseline).toFixed(1)}x |

Possible causes:
- 🎉 Genuine viral / popular post about LinguTab
- 🐛 Client-side bug causing retry loops
- 👾 Bot scraping or abuse

Check Cloudflare Analytics → Workers → Recent IPs for hot sources.`;
}

function buildLatencyBody(metrics: Metrics, baseline: number): string {
  return `AI generation latency is **${(metrics.ai.avgLatencyMs / baseline).toFixed(1)}x** above baseline.

| Metric | Value |
|--------|-------|
| Current avg | ${metrics.ai.avgLatencyMs}ms |
| Baseline avg | ${Math.round(baseline)}ms |
| Stories sampled | ${metrics.ai.storiesGenerated} |

Possible causes:
- Cloudflare Workers AI experiencing high load (regional)
- Qwen model cold start after deployment
- Network issues between Worker and AI infrastructure
- Prompt got longer (check buildStoryPrompt history)

Workers AI status: https://www.cloudflarestatus.com/#workersai`;
}

// ─── Daily summary (sent at 9am ICT regardless) ────────────────────────────
export function buildDailySummary(metrics: Metrics, prevDay?: Metrics): Alert {
  const dauChange = prevDay
    ? `${metrics.users.dau > prevDay.users.dau ? '↑' : '↓'} ${
        Math.abs(metrics.users.dau - prevDay.users.dau)
      } vs yesterday`
    : '';

  return {
    id: `daily_summary:${new Date().toISOString().slice(0, 10)}`,
    severity: 'info',
    resource: 'summary',
    title: `📊 LinguTab Daily Summary — ${new Date().toISOString().slice(0, 10)}`,
    body: `## Yesterday's stats

| Metric | Value | |
|--------|-------|---|
| DAU | ${metrics.users.dau} | ${dauChange} |
| MAU | ${metrics.users.mau} | |
| Total users | ${metrics.users.total} | |
| Pro users | ${metrics.users.pro} (${metrics.users.total > 0 ? ((metrics.users.pro / metrics.users.total) * 100).toFixed(1) : '0'}%) | |
| AI stories | ${metrics.ai.storiesGenerated} | |
| AI success | ${(metrics.ai.successRate * 100).toFixed(0)}% | |

## Quota usage

| Resource | Used | Limit | % |
|----------|------|-------|---|
| Workers AI Neurons | ${metrics.neurons.used.toLocaleString()} | ${metrics.neurons.limit.toLocaleString()} | ${(metrics.neurons.percentUsed * 100).toFixed(0)}% |
| Workers requests | ${metrics.workers.requests.toLocaleString()} | ${metrics.workers.limit.toLocaleString()} | ${(metrics.workers.percentUsed * 100).toFixed(0)}% |
| KV writes | ${metrics.kv.writes.toLocaleString()} | ${metrics.kv.writes.toLocaleString()} | ${(metrics.kv.percentUsed * 100).toFixed(0)}% |

✅ Systems healthy

[View dashboard](https://lingua-newtab-admin.pages.dev)`,
  };
}

// ─── Resend delivery ───────────────────────────────────────────────────────
interface ResendEnv {
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  RESEND_TO_EMAIL?: string;
  DB?: D1Database;
}

/**
 * Send alert via Resend. Logs result into D1 alerts_log for traceability +
 * dedup purposes. Returns true if email was actually delivered (or had
 * already been sent in this dedup bucket — no-op success).
 */
export async function sendAlertEmail(alert: Alert, env: ResendEnv): Promise<boolean> {
  // Dedup check — query D1 first
  if (env.DB) {
    const existing = await env.DB
      .prepare(`SELECT id FROM alerts_log WHERE id = ? LIMIT 1`)
      .bind(alert.id)
      .first();
    if (existing) {
      // Already sent this alert in the current bucket; success no-op
      return true;
    }
  }

  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL || !env.RESEND_TO_EMAIL) {
    console.error('[alerts] Resend not configured. Skipping email.');
    await logAlertResult(env.DB, alert, null, 'failed', 'Resend not configured');
    return false;
  }

  // Convert markdown to simple HTML — keep dependency-free since this
  // Worker has zero npm runtime deps. Markdown table → <table>, **bold** →
  // <strong>, # headings, [text](url) → <a>. Good enough for our emails.
  const html = markdownToHtml(alert.body);

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL,
        to: env.RESEND_TO_EMAIL,
        subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
        html: wrapEmailHtml(alert.title, html),
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('[alerts] Resend error', resp.status, errText);
      await logAlertResult(env.DB, alert, null, 'failed', `Resend ${resp.status}: ${errText.slice(0, 200)}`);
      return false;
    }

    const data = await resp.json() as { id?: string };
    await logAlertResult(env.DB, alert, data.id ?? null, 'sent', null);
    return true;
  } catch (err) {
    console.error('[alerts] send error', err);
    await logAlertResult(env.DB, alert, null, 'failed', String(err instanceof Error ? err.message : err));
    return false;
  }
}

async function logAlertResult(
  db: D1Database | undefined,
  alert: Alert,
  emailId: string | null,
  status: 'sent' | 'failed',
  failureReason: string | null,
): Promise<void> {
  if (!db) return;
  try {
    await db
      .prepare(
        `INSERT OR REPLACE INTO alerts_log
         (id, severity, resource, title, body, sent_at, email_id, email_status, failure_reason)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        alert.id,
        alert.severity,
        alert.resource,
        alert.title,
        alert.body,
        Date.now(),
        emailId,
        status,
        failureReason,
      )
      .run();
  } catch (err) {
    console.error('[alerts] D1 log failed', err);
  }
}

// ─── Lightweight markdown → HTML ───────────────────────────────────────────
/**
 * Tiny markdown subset converter. Supports just what we use in alert bodies:
 * H2, bold, links, tables, code, simple bullets. Worker can't pull `marked`
 * from npm easily; this keeps the bundle small.
 */
function markdownToHtml(md: string): string {
  let html = md;

  // Headings
  html = html.replace(/^## (.+)$/gm, '<h2 style="font-size:18px;margin:16px 0 8px;color:#1f2937">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 style="font-size:22px;margin:20px 0 10px;color:#1f2937">$1</h1>');

  // Tables (markdown pipe tables) — convert in chunks
  html = html.replace(/((?:^\|.+\|\n?)+)/gm, (block) => {
    const lines = block.trim().split('\n');
    if (lines.length < 2) return block;
    // Skip alignment row if present
    const hasAlign = /^\|[\s:-]+\|/.test(lines[1]);
    const headers = lines[0].split('|').slice(1, -1).map((s) => s.trim());
    const dataLines = lines.slice(hasAlign ? 2 : 1);
    const rows = dataLines.map((line) =>
      line.split('|').slice(1, -1).map((s) => s.trim()),
    );
    let out = '<table style="border-collapse:collapse;margin:12px 0;width:100%;font-size:14px"><thead><tr>';
    for (const h of headers) {
      out += `<th style="border:1px solid #e5e7eb;padding:8px;background:#f9fafb;text-align:left">${h}</th>`;
    }
    out += '</tr></thead><tbody>';
    for (const row of rows) {
      out += '<tr>';
      for (const cell of row) {
        out += `<td style="border:1px solid #e5e7eb;padding:8px">${cell}</td>`;
      }
      out += '</tr>';
    }
    out += '</tbody></table>';
    return out;
  });

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-family:Menlo,monospace;font-size:13px">$1</code>');

  // Code blocks (fenced)
  html = html.replace(/```([\s\S]*?)```/g, '<pre style="background:#f3f4f6;padding:12px;border-radius:6px;overflow-x:auto;font-size:13px;font-family:Menlo,monospace">$1</pre>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#2563eb;text-decoration:none">$1</a>');

  // Bullet list (simple — only works for adjacent `- ` lines)
  html = html.replace(/((?:^- .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map((line) => line.replace(/^- /, ''));
    return '<ul style="margin:8px 0;padding-left:24px">'
      + items.map((it) => `<li style="margin:4px 0">${it}</li>`).join('')
      + '</ul>';
  });

  // Paragraphs (replace double newlines with <br><br>)
  html = html.replace(/\n\n+/g, '<br><br>');
  html = html.replace(/(?<!>)\n(?!<)/g, '<br>');

  return html;
}

function wrapEmailHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:600px;margin:24px auto;background:white;padding:24px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <div style="border-bottom:2px solid #f3f4f6;padding-bottom:12px;margin-bottom:16px">
      <span style="font-size:14px;color:#6b7280">LinguTab Monitoring</span>
    </div>
    <div style="color:#1f2937;line-height:1.6">
      ${body}
    </div>
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #f3f4f6;font-size:12px;color:#6b7280">
      This is an automated alert from LinguTab Worker monitoring system.<br>
      Adjust thresholds in <code>worker/src/alerts.ts</code>.
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
