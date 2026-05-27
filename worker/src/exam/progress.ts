/**
 * Exam progress persistence (D-21) — mirrors the extension's local exam
 * progress to D1 so the web dashboard can show learner progress.
 *
 *   POST /exam/progress   body { levelNumber, lang, stars, maxStars }
 *                         → upsert best-per-level for the signed-in user
 *   GET  /exam/progress   → the signed-in user's own progress rows
 *
 * Auth: requires a verified Google user (passed from index.ts). Returns null
 * if the path doesn't match so the caller can fall through to other routes.
 */
import type { VerifiedUser } from '../sync/handlers';

interface ProgressEnv {
  DB?: D1Database;
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export interface ExamProgressRow {
  level_number: number;
  lang: string;
  best_stars: number;
  max_stars: number;
  attempts: number;
  first_completed_at: number;
  last_attempt_at: number;
}

/** Read every progress row for a user (used by own GET + admin view). */
export async function getUserProgress(
  db: D1Database,
  userId: string,
): Promise<ExamProgressRow[]> {
  const res = await db
    .prepare(
      `SELECT level_number, lang, best_stars, max_stars, attempts,
              first_completed_at, last_attempt_at
         FROM exam_progress WHERE user_id = ? ORDER BY level_number`,
    )
    .bind(userId)
    .all<ExamProgressRow>();
  return res.results ?? [];
}

export async function handleProgressRequest(
  req: Request,
  env: ProgressEnv,
  user: VerifiedUser | null,
): Promise<Response | null> {
  const url = new URL(req.url);
  if (url.pathname !== '/exam/progress') return null;
  if (!user) return json({ error: 'Auth required' }, 401);
  if (!env.DB) return json({ error: 'DB not configured' }, 503);

  if (req.method === 'GET') {
    const rows = await getUserProgress(env.DB, user.userId);
    return json({ progress: rows });
  }

  if (req.method === 'POST') {
    let body: { levelNumber?: number; lang?: string; stars?: number; maxStars?: number };
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid JSON' }, 400);
    }
    const levelNumber = Number(body.levelNumber);
    const stars = Number(body.stars);
    const maxStars = Number(body.maxStars);
    const lang = body.lang === 'zh' ? 'zh' : 'en';
    if (!Number.isInteger(levelNumber) || levelNumber < 1) return json({ error: 'Bad levelNumber' }, 400);
    if (!Number.isInteger(stars) || stars < 0) return json({ error: 'Bad stars' }, 400);
    if (!Number.isInteger(maxStars) || maxStars < 1) return json({ error: 'Bad maxStars' }, 400);

    const now = Date.now();
    await env.DB
      .prepare(
        `INSERT INTO exam_progress
           (user_id, level_number, lang, best_stars, max_stars, attempts, first_completed_at, last_attempt_at)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?)
         ON CONFLICT(user_id, level_number) DO UPDATE SET
           best_stars = MAX(best_stars, excluded.best_stars),
           max_stars  = excluded.max_stars,
           lang       = excluded.lang,
           attempts   = attempts + 1,
           last_attempt_at = excluded.last_attempt_at`,
      )
      .bind(user.userId, levelNumber, lang, stars, maxStars, now, now)
      .run();
    return json({ ok: true });
  }

  return json({ error: 'Method not allowed' }, 405);
}
