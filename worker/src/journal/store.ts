/**
 * D-22 journal storage on D1 (so entries survive device/browser changes).
 *
 *   GET    /journal           → list own entries (newest first)
 *   POST   /journal           → upsert own entry (body has id? else create)
 *   DELETE /journal/:id       → delete own entry
 *
 * All endpoints require a signed-in user (gated in index.ts).
 */
import type { VerifiedUser } from '../sync/handlers';

interface StoreEnv { DB?: D1Database }

const json = (b: unknown, status = 200): Response =>
  new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } });

interface Row {
  id: string;
  user_id: string;
  lang: string;
  date: string;
  text: string;
  corrected: string | null;
  notes: string | null;
  summary: string | null;
  created_at: number;
  updated_at: number;
}
const toEntry = (r: Row) => ({
  id: r.id, lang: r.lang, date: r.date, text: r.text,
  corrected: r.corrected ?? undefined,
  notes: r.notes ? JSON.parse(r.notes) : undefined,
  summary: r.summary ?? undefined,
  createdAt: r.created_at, updatedAt: r.updated_at,
});

export async function handleJournalStoreRequest(
  req: Request,
  env: StoreEnv,
  user: VerifiedUser | null,
): Promise<Response | null> {
  const url = new URL(req.url);
  if (url.pathname !== '/journal' && !/^\/journal\/[^/]+$/.test(url.pathname)) return null;
  if (!user) return json({ error: 'Auth required' }, 401);
  if (!env.DB) return json({ error: 'DB not configured' }, 503);

  // GET /journal — list own entries.
  if (url.pathname === '/journal' && req.method === 'GET') {
    const res = await env.DB.prepare(
      `SELECT id, user_id, lang, date, text, corrected, notes, summary, created_at, updated_at
         FROM journal_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT 500`,
    ).bind(user.userId).all<Row>();
    return json({ entries: (res.results ?? []).map(toEntry) });
  }

  // POST /journal — upsert own entry (creates if no id; updates if id exists & owned).
  if (url.pathname === '/journal' && req.method === 'POST') {
    let body: { id?: string; lang?: string; date?: string; text?: string;
      corrected?: string | null; notes?: unknown; summary?: string | null };
    try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
    const lang = body.lang === 'zh' ? 'zh' : body.lang === 'en' ? 'en' : null;
    if (!lang) return json({ error: 'Bad lang' }, 400);
    if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) return json({ error: 'Bad date' }, 400);
    const text = String(body.text ?? '').trim();
    if (!text) return json({ error: 'Empty text' }, 400);
    if (text.length > 8000) return json({ error: 'Text too long' }, 400);
    const notes = body.notes != null ? JSON.stringify(body.notes).slice(0, 8000) : null;
    const corrected = body.corrected ?? null;
    const summary = body.summary ?? null;
    const now = Date.now();

    if (body.id) {
      // update — only if owned
      const r = await env.DB.prepare(
        `UPDATE journal_entries SET lang=?, date=?, text=?, corrected=?, notes=?, summary=?, updated_at=?
           WHERE id=? AND user_id=?`,
      ).bind(lang, body.date, text, corrected, notes, summary, now, body.id, user.userId).run();
      if (!r.meta.changes) return json({ error: 'Not found' }, 404);
      return json({ ok: true, id: body.id, updatedAt: now });
    }
    const id = `jr_${now}_${Math.random().toString(36).slice(2, 8)}`;
    await env.DB.prepare(
      `INSERT INTO journal_entries (id, user_id, lang, date, text, corrected, notes, summary, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(id, user.userId, lang, body.date, text, corrected, notes, summary, now, now).run();
    return json({ ok: true, id, createdAt: now, updatedAt: now });
  }

  // DELETE /journal/:id — delete own.
  const m = url.pathname.match(/^\/journal\/([^/]+)$/);
  if (m && req.method === 'DELETE') {
    const r = await env.DB.prepare(
      `DELETE FROM journal_entries WHERE id=? AND user_id=?`,
    ).bind(decodeURIComponent(m[1]), user.userId).run();
    if (!r.meta.changes) return json({ error: 'Not found' }, 404);
    return json({ ok: true });
  }

  return json({ error: 'Method not allowed' }, 405);
}
