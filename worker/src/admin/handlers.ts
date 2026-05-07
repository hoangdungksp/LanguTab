/**
 * Admin endpoints — restricted to Jason via Bearer token.
 *
 * Auth: simple shared secret (env.ADMIN_TOKEN). Set via:
 *   wrangler secret put ADMIN_TOKEN
 *
 * Endpoints:
 *   GET  /admin/metrics                   → current snapshot
 *   GET  /admin/metrics/history?days=7    → time-series
 *   GET  /admin/alerts                    → recent alerts log
 *   GET  /admin/users?limit=50&offset=0   → list users (after multi-user setup)
 *
 * The admin dashboard (Cloudflare Pages app) calls these endpoints with
 * the Bearer token stored in localStorage on the Pages domain.
 */

import { collectMetrics, type Metrics } from '../metrics';

export interface AdminEnv {
  RATE_LIMITER?: KVNamespace;
  DB?: D1Database;
  ADMIN_TOKEN?: string;
}

/**
 * Verify admin Bearer token. Returns null if unauthorized; the auth check
 * is intentionally constant-time-ish so we don't leak info via timing.
 */
function isAuthorized(req: Request, env: AdminEnv): boolean {
  const expected = env.ADMIN_TOKEN;
  if (!expected) return false; // Refuse if not configured (safer than allowing all)
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return false;
  const provided = auth.slice(7);
  // Use constant-time comparison
  if (provided.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < provided.length; i++) {
    mismatch |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

function unauthorized(): Response {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Main admin router. Returns null if path is not an admin path so the main
 * router can fall through to user endpoints.
 */
export async function handleAdminRequest(
  req: Request,
  env: AdminEnv,
): Promise<Response | null> {
  const url = new URL(req.url);
  if (!url.pathname.startsWith('/admin/')) return null;

  // Sprint 4.9.5.3: Defer /admin/exam/* paths to handleAdminExamRequest
  // (registered in index.ts after this handler). Without this, paths like
  // /admin/exam/scenes/:id/recaption hit the catch-all 404 below before
  // ever reaching the exam admin router.
  if (url.pathname.startsWith('/admin/exam/')) return null;

  if (!isAuthorized(req, env)) return unauthorized();

  // ─── Routes ────────────────────────────────────────────────────────────
  if (url.pathname === '/admin/metrics' && req.method === 'GET') {
    return jsonResponse(await collectMetrics(env));
  }

  if (url.pathname === '/admin/metrics/history' && req.method === 'GET') {
    const days = Math.min(parseInt(url.searchParams.get('days') ?? '7', 10), 90);
    return jsonResponse(await loadMetricsHistory(env.DB, days));
  }

  if (url.pathname === '/admin/alerts' && req.method === 'GET') {
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10), 200);
    return jsonResponse(await loadAlertsLog(env.DB, limit));
  }

  if (url.pathname === '/admin/users' && req.method === 'GET') {
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10), 200);
    const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);
    return jsonResponse(await loadUsers(env.DB, limit, offset));
  }

  if (url.pathname === '/admin/test-alert' && req.method === 'POST') {
    // Useful for verifying Resend setup. Sends a fake "info" email.
    const { sendAlertEmail } = await import('../alerts');
    const ok = await sendAlertEmail(
      {
        id: `test:${Date.now()}`,
        severity: 'info',
        resource: 'test',
        title: '✅ Test alert from LinguTab Admin',
        body: 'This is a test alert. Resend integration is working correctly.\n\nSent at: ' + new Date().toISOString(),
      },
      env as Parameters<typeof sendAlertEmail>[1],
    );
    return jsonResponse({ ok });
  }

  if (url.pathname === '/admin/upgrade' && req.method === 'POST') {
    // Manual tier override — used by Jason for testing the Pro UI before
    // Lemon Squeezy is wired up, and as a manual support tool for refunds /
    // edge cases. Body: { user_id, tier, expires_at? }.
    return handleAdminUpgrade(req, env);
  }

  return new Response(JSON.stringify({ error: 'Admin endpoint not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ─── Admin: manually set a user's tier ──────────────────────────────────────
async function handleAdminUpgrade(req: Request, env: AdminEnv): Promise<Response> {
  if (!env.DB) return jsonResponse({ error: 'Database not configured' });
  let body: { user_id?: string; tier?: string; expires_at?: number | null; reason?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const userId = body.user_id?.trim();
  const tier = body.tier;
  if (!userId || !tier || !['free', 'pro', 'lifetime', 'banned'].includes(tier)) {
    return new Response(JSON.stringify({
      error: 'user_id and tier (free|pro|lifetime|banned) are required',
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const expiresAt = body.expires_at ?? (tier === 'pro' ? Date.now() + 30 * 86400_000 : null);

  await env.DB
    .prepare(`UPDATE users SET tier = ?, tier_expires_at = ? WHERE id = ?`)
    .bind(tier, expiresAt, userId)
    .run();

  // Audit log entry so this manual change is visible in /admin/billing later.
  await env.DB
    .prepare(
      `INSERT INTO billing_events (
         user_id, event_name, applied_tier, applied_expires_at, raw_json, received_at
       ) VALUES (?, 'admin_test_upgrade', ?, ?, ?, ?)`,
    )
    .bind(
      userId,
      tier,
      expiresAt,
      JSON.stringify({ reason: body.reason ?? 'admin_manual', actor: 'admin_token' }),
      Date.now(),
    )
    .run()
    .catch(() => {/* billing_events may not exist on stale DBs; ignore */});

  return jsonResponse({ ok: true, user_id: userId, tier, expires_at: expiresAt });
}

// ─── Data loaders ──────────────────────────────────────────────────────────
async function loadMetricsHistory(
  db: D1Database | undefined,
  days: number,
): Promise<Metrics[]> {
  if (!db) return [];
  try {
    const cutoff = Date.now() - days * 24 * 3600_000;
    const result = await db
      .prepare(
        `SELECT raw_json FROM metrics_snapshots
         WHERE timestamp >= ?
         ORDER BY timestamp ASC`,
      )
      .bind(cutoff)
      .all<{ raw_json: string }>();
    return (result.results ?? [])
      .map((r) => {
        try { return JSON.parse(r.raw_json) as Metrics; } catch { return null; }
      })
      .filter((m): m is Metrics => m !== null);
  } catch (err) {
    console.error('[admin] history load failed', err);
    return [];
  }
}

async function loadAlertsLog(
  db: D1Database | undefined,
  limit: number,
): Promise<Array<{
  id: string;
  severity: string;
  resource: string;
  title: string;
  body: string;
  sent_at: number;
  email_status: string | null;
}>> {
  if (!db) return [];
  try {
    const result = await db
      .prepare(
        `SELECT id, severity, resource, title, body, sent_at, email_status
         FROM alerts_log
         ORDER BY sent_at DESC
         LIMIT ?`,
      )
      .bind(limit)
      .all<{
        id: string;
        severity: string;
        resource: string;
        title: string;
        body: string;
        sent_at: number;
        email_status: string | null;
      }>();
    return result.results ?? [];
  } catch {
    return [];
  }
}

async function loadUsers(
  db: D1Database | undefined,
  limit: number,
  offset: number,
): Promise<{ users: unknown[]; total: number }> {
  if (!db) return { users: [], total: 0 };
  try {
    const result = await db
      .prepare(
        `SELECT id, email, display_name, tier, created_at, last_active_at
         FROM users
         ORDER BY last_active_at DESC
         LIMIT ? OFFSET ?`,
      )
      .bind(limit, offset)
      .all();
    const totalRow = await db
      .prepare(`SELECT COUNT(*) as c FROM users`)
      .first<{ c: number }>();
    return { users: result.results ?? [], total: totalRow?.c ?? 0 };
  } catch {
    // Users table doesn't exist yet
    return { users: [], total: 0 };
  }
}

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
