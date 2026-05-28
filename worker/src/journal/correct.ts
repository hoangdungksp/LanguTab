/**
 * D-22: Journal grammar correction via Gemini.
 *
 *   POST /journal/correct  { text, lang }  (auth required)
 *     → { corrected, notes: [{ wrong, fix, explain }], summary }
 *       explain/summary are in Vietnamese; focuses on verb tenses and
 *       conditional sentences. Daily per-user rate limit (KV).
 *
 * Auth is checked by index.ts (passes the verified user). Gemini key reused
 * from the semantic-check feature (env.GEMINI_API_KEY).
 */
import type { VerifiedUser } from '../sync/handlers';

interface JournalEnv {
  GEMINI_API_KEY?: string;
  RATE_LIMITER?: KVNamespace;
}

const GEMINI_MODEL = 'gemini-2.5-flash';
const DAILY_LIMIT = 50;

const json = (b: unknown, status = 200): Response =>
  new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } });

export async function handleJournalRequest(
  req: Request,
  env: JournalEnv,
  user: VerifiedUser | null,
): Promise<Response | null> {
  const url = new URL(req.url);
  if (url.pathname !== '/journal/correct' || req.method !== 'POST') return null;
  if (!user) return json({ error: 'Bạn cần đăng nhập để dùng AI sửa câu.' }, 401);
  if (!env.GEMINI_API_KEY) return json({ error: 'Chưa cấu hình GEMINI_API_KEY trên server.' }, 503);

  // Daily per-user rate limit.
  if (env.RATE_LIMITER) {
    const key = `journal:${user.userId}:${new Date().toISOString().slice(0, 10)}`;
    const used = parseInt((await env.RATE_LIMITER.get(key)) ?? '0', 10);
    if (used >= DAILY_LIMIT) return json({ error: `Hết lượt sửa câu hôm nay (${DAILY_LIMIT}/ngày).` }, 429);
    await env.RATE_LIMITER.put(key, String(used + 1), { expirationTtl: 90000 });
  }

  let body: { text?: string; lang?: string };
  try { body = (await req.json()) as typeof body; } catch { return json({ error: 'Invalid JSON' }, 400); }
  const text = (body.text ?? '').trim();
  const langName = body.lang === 'zh' ? 'Chinese (Mandarin)' : 'English';
  if (!text) return json({ error: 'Thiếu nội dung.' }, 400);
  if (text.length > 4000) return json({ error: 'Nhật ký quá dài (tối đa 4000 ký tự).' }, 400);

  const prompt =
    `You are a kind ${langName} writing tutor for a Vietnamese learner.\n` +
    `The learner wrote this journal entry in ${langName}:\n"""${text}"""\n\n` +
    `Tasks:\n` +
    `1) "corrected": the full entry rewritten with correct grammar & natural ${langName} (keep the learner's meaning and simple level).\n` +
    `2) "notes": an array of the main mistakes (focus on VERB TENSES and CONDITIONAL sentences). Each note: ` +
    `{ "wrong": the learner's phrase, "fix": the corrected phrase, "explain": a short explanation IN VIETNAMESE }.\n` +
    `3) "summary": 1-2 encouraging sentences IN VIETNAMESE about what to improve.\n` +
    `If there are no real mistakes, return an empty notes array and praise them in the summary.\n` +
    `Return ONLY JSON: { "corrected": string, "notes": [{"wrong":string,"fix":string,"explain":string}], "summary": string }`;

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;
  let resp: Response;
  try {
    resp = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2048, responseMimeType: 'application/json' },
      }),
    });
  } catch (err) {
    return json({ error: `Gemini lỗi: ${err instanceof Error ? err.message : String(err)}` }, 502);
  }
  if (!resp.ok) {
    const b = await resp.text().catch(() => '');
    return json({ error: `Gemini HTTP ${resp.status}: ${b.slice(0, 200)}` }, 502);
  }

  const data = (await resp.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  try {
    const parsed = JSON.parse(raw);
    return json({
      corrected: String(parsed.corrected ?? text),
      notes: Array.isArray(parsed.notes) ? parsed.notes.slice(0, 20) : [],
      summary: String(parsed.summary ?? ''),
    });
  } catch {
    return json({ error: 'Không đọc được kết quả AI, thử lại.' }, 502);
  }
}
