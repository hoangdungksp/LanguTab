/**
 * D-22 journal — server-side persistence (D1) so entries survive device or
 * browser changes. All endpoints require a signed-in Google user; if the user
 * isn't signed in, calls throw a friendly error and the UI prompts to log in.
 *
 * Local Dexie is no longer the source of truth (the v6 table stays defined
 * for future offline-draft support but isn't written to here).
 */
import { authedFetch } from './authService';

const WORKER_URL = 'https://lingua-newtab-worker.kspstudio.workers.dev';

export type JournalLang = 'en' | 'zh';
export interface CorrectionNote { wrong: string; fix: string; explain: string }
export interface Correction { corrected: string; notes: CorrectionNote[]; summary: string }
export interface JournalEntry {
  id: string;
  lang: JournalLang;
  date: string;
  text: string;
  corrected?: string;
  notes?: CorrectionNote[];
  summary?: string;
  createdAt: number;
  updatedAt: number;
}

async function asJson<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) throw new Error('Hãy đăng nhập Google để lưu nhật ký lên cloud.');
    throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
  }
  return data as T;
}

export async function listEntries(lang?: JournalLang): Promise<JournalEntry[]> {
  const res = await authedFetch(`${WORKER_URL}/journal`);
  const data = await asJson<{ entries: JournalEntry[] }>(res);
  return lang ? data.entries.filter((e) => e.lang === lang) : data.entries;
}

export interface SaveInput {
  id?: string;
  lang: JournalLang;
  date: string;
  text: string;
  corrected?: string;
  notes?: CorrectionNote[];
  summary?: string;
}
export async function saveEntry(input: SaveInput): Promise<JournalEntry> {
  const res = await authedFetch(`${WORKER_URL}/journal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await asJson<{ id: string; createdAt?: number; updatedAt: number }>(res);
  return {
    id: data.id, lang: input.lang, date: input.date, text: input.text,
    corrected: input.corrected, notes: input.notes, summary: input.summary,
    createdAt: data.createdAt ?? Date.now(), updatedAt: data.updatedAt,
  };
}

export async function deleteEntry(id: string): Promise<void> {
  const res = await authedFetch(`${WORKER_URL}/journal/${encodeURIComponent(id)}`, { method: 'DELETE' });
  await asJson(res);
}

/** Ask the AI to correct grammar (focus tenses + conditionals). */
export async function correctText(text: string, lang: JournalLang): Promise<Correction> {
  const res = await authedFetch(`${WORKER_URL}/journal/correct`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, lang }),
  });
  return asJson<Correction>(res);
}
