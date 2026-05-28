/**
 * D-22 journal: local persistence (Dexie) + AI grammar correction (worker).
 * Entries live in IndexedDB and are kept until the user explicitly deletes
 * them — nothing auto-expires.
 */
import { db, type JournalEntry } from './db';
import { authedFetch } from './authService';

const WORKER_URL = 'https://lingua-newtab-worker.kspstudio.workers.dev';

export type JournalLang = 'en' | 'zh';
export interface CorrectionNote { wrong: string; fix: string; explain: string }
export interface Correction { corrected: string; notes: CorrectionNote[]; summary: string }

/** Newest first, optionally filtered by language. */
export async function listEntries(lang?: JournalLang): Promise<JournalEntry[]> {
  const all = await db.journalEntries.orderBy('createdAt').reverse().toArray();
  return lang ? all.filter((e) => e.lang === lang) : all;
}

export async function createEntry(lang: JournalLang, date: string, text: string): Promise<JournalEntry> {
  const now = Date.now();
  const e: JournalEntry = {
    id: `jr_${now}_${Math.random().toString(36).slice(2, 8)}`,
    lang, date, text, createdAt: now, updatedAt: now,
  };
  await db.journalEntries.put(e);
  return e;
}

export async function updateEntry(id: string, patch: Partial<JournalEntry>): Promise<void> {
  await db.journalEntries.update(id, { ...patch, updatedAt: Date.now() });
}

/** Permanent delete — only ever called from an explicit user action. */
export async function deleteEntry(id: string): Promise<void> {
  await db.journalEntries.delete(id);
}

/** Ask the AI to correct grammar (focus tenses + conditionals). Needs login. */
export async function correctText(text: string, lang: JournalLang): Promise<Correction> {
  const res = await authedFetch(`${WORKER_URL}/journal/correct`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, lang }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Lỗi khi sửa câu');
  return data as Correction;
}
