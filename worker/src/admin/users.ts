/**
 * Admin user management API (D-21 dashboard backend). Admin-only.
 *
 *   GET  /admin/users                 → list all users (role, tier, activity)
 *   POST /admin/users/role            → { userId, role } set a user's role
 *   GET  /admin/users/:id/progress    → one user's exam progress
 *   GET  /admin/stats                 → headline counts for the dashboard
 *
 * Auth: caller (index.ts) verifies the Google user and passes their role;
 * every endpoint here requires role === 'admin'. Returns null if the path
 * doesn't match so the caller can fall through.
 */
import { isRole, type Role } from '../auth/roles';
import { getUserProgress } from '../exam/progress';

interface UsersEnv {
  DB?: D1Database;
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

interface UserRow {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
  tier: string | null;
  tier_expires_at: number | null;
  created_at: number;
  last_active_at: number;
}

export async function handleAdminUsersRequest(
  req: Request,
  env: UsersEnv,
  role: Role,
): Promise<Response | null> {
  const url = new URL(req.url);
  const p = url.pathname;
  const isUsersRoute = p === '/admin/users' || p === '/admin/users/role' || p === '/admin/stats'
    || /^\/admin\/users\/[^/]+\/progress$/.test(p);
  if (!isUsersRoute) return null;

  if (role !== 'admin') return json({ error: 'Admin only' }, 403);
  if (!env.DB) return json({ error: 'DB not configured' }, 503);

  // GET /admin/users — list everyone (newest activity first).
  if (p === '/admin/users' && req.method === 'GET') {
    const res = await env.DB
      .prepare(
        `SELECT id, email, display_name, avatar_url, role, tier, tier_expires_at,
                created_at, last_active_at
           FROM users WHERE deleted_at IS NULL
          ORDER BY last_active_at DESC LIMIT 500`,
      )
      .all<UserRow>();
    return json({ users: res.results ?? [] });
  }

  // POST /admin/users/role — set a user's role.
  if (p === '/admin/users/role' && req.method === 'POST') {
    let body: { userId?: string; role?: string };
    try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
    if (!body.userId) return json({ error: 'Missing userId' }, 400);
    if (!isRole(body.role)) return json({ error: 'Invalid role' }, 400);
    const r = await env.DB
      .prepare(`UPDATE users SET role = ? WHERE id = ?`)
      .bind(body.role, body.userId)
      .run();
    if (!r.meta.changes) return json({ error: 'User not found' }, 404);
    return json({ ok: true, userId: body.userId, role: body.role });
  }

  // GET /admin/users/:id/progress — one learner's exam progress.
  const progMatch = p.match(/^\/admin\/users\/([^/]+)\/progress$/);
  if (progMatch && req.method === 'GET') {
    const rows = await getUserProgress(env.DB, decodeURIComponent(progMatch[1]));
    return json({ progress: rows });
  }

  // GET /admin/stats — dashboard headline numbers + breakdowns for charts.
  if (p === '/admin/stats' && req.method === 'GET') {
    const planetCase = `CASE
        WHEN level_number > 140 THEN 'HSK3' WHEN level_number > 120 THEN 'HSK2'
        WHEN level_number > 100 THEN 'HSK1' WHEN level_number > 40 THEN 'Flyers'
        WHEN level_number > 20 THEN 'Movers' ELSE 'Starters' END`;
    const [users, byTier, byRole, progress, byPlanet] = await Promise.all([
      env.DB.prepare(`SELECT COUNT(*) AS n FROM users WHERE deleted_at IS NULL`).first<{ n: number }>(),
      env.DB.prepare(`SELECT tier, COUNT(*) AS n FROM users WHERE deleted_at IS NULL GROUP BY tier`).all<{ tier: string; n: number }>(),
      env.DB.prepare(`SELECT role, COUNT(*) AS n FROM users WHERE deleted_at IS NULL GROUP BY role`).all<{ role: string; n: number }>(),
      env.DB.prepare(`SELECT COUNT(*) AS n, COALESCE(SUM(best_stars),0) AS stars FROM exam_progress`).first<{ n: number; stars: number }>(),
      env.DB.prepare(`SELECT ${planetCase} AS planet, COUNT(*) AS n, COALESCE(SUM(best_stars),0) AS stars FROM exam_progress GROUP BY planet`).all<{ planet: string; n: number; stars: number }>(),
    ]);
    return json({
      totalUsers: users?.n ?? 0,
      byTier: byTier.results ?? [],
      byRole: byRole.results ?? [],
      levelsCompleted: progress?.n ?? 0,
      starsEarned: progress?.stars ?? 0,
      byPlanet: byPlanet.results ?? [],
    });
  }

  return json({ error: 'Method not allowed' }, 405);
}
