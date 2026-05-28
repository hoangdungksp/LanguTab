import { useEffect, useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import type { JournalEntry } from '../../services/db';
import {
  listEntries, createEntry, updateEntry, deleteEntry, correctText,
  type Correction, type JournalLang,
} from '../../services/journalService';

const todayISO = () => new Date().toISOString().slice(0, 10);

export function TabJournal() {
  const targetLang = useAppStore((s) => s.targetLang);
  const lang: JournalLang = targetLang === 'en' ? 'en' : 'zh';

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [date, setDate] = useState(todayISO());
  const [text, setText] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [corr, setCorr] = useState<Correction | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const reload = () => { listEntries().then(setEntries); };
  useEffect(reload, []);

  const reset = () => { setEditId(null); setText(''); setDate(todayISO()); setCorr(null); setErr(''); };

  const onCorrect = async () => {
    if (!text.trim()) { setErr('Hãy viết vài câu trước đã.'); return; }
    setBusy(true); setErr(''); setCorr(null);
    try { setCorr(await correctText(text, lang)); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  const onSave = async () => {
    if (!text.trim()) { setErr('Nhật ký trống.'); return; }
    if (editId) {
      await updateEntry(editId, { date, text, corrected: corr?.corrected, notes: corr?.notes, summary: corr?.summary });
    } else {
      const e = await createEntry(lang, date, text);
      if (corr) await updateEntry(e.id, { corrected: corr.corrected, notes: corr.notes, summary: corr.summary });
    }
    reset(); reload();
  };

  const onEdit = (e: JournalEntry) => {
    setEditId(e.id); setText(e.text); setDate(e.date);
    setCorr(e.corrected ? { corrected: e.corrected, notes: e.notes ?? [], summary: e.summary ?? '' } : null);
    setErr(''); window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const onDelete = async (e: JournalEntry) => {
    if (!confirm(`Xoá vĩnh viễn nhật ký ngày ${e.date}? Không thể hoàn tác.`)) return;
    await deleteEntry(e.id);
    if (editId === e.id) reset();
    reload();
  };

  const placeholder = lang === 'en'
    ? 'Viết vài câu tiếng Anh về ngày hôm nay… (vd: Today I went to school. If it rains tomorrow, I will stay home.)'
    : '用中文写几句今天的事… (例如：今天我去了学校。如果明天下雨，我就待在家里。)';

  return (
    <div className="mx-auto max-w-3xl p-4">
      <div className="mb-4">
        <h1 className="font-display text-2xl font-bold text-ink-700">📔 Nhật ký {lang === 'en' ? 'tiếng Anh' : 'tiếng Trung'}</h1>
        <p className="text-sm text-ink-500">Viết mỗi ngày — AI sửa ngữ pháp & câu điều kiện. Nhật ký lưu vĩnh viễn trên máy bạn, chỉ xoá khi bạn muốn.</p>
      </div>

      {/* Editor */}
      <div className="rounded-chunk border-2 border-ink-200 bg-paper p-4 shadow-chunky-soft">
        <div className="mb-2 flex items-center gap-2">
          <label className="text-sm font-bold text-ink-600">Ngày:</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="rounded-md border-2 border-ink-200 px-2 py-1 text-sm" />
          {editId && <span className="rounded-pill bg-sun-200 px-2 py-0.5 text-xs font-bold text-sun-800">đang sửa</span>}
          <span className="flex-1" />
          {editId && <button onClick={reset} className="text-xs font-bold text-ink-400 hover:text-ink-600">+ Viết bài mới</button>}
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} placeholder={placeholder}
          className="w-full rounded-chunk border-2 border-ink-200 p-3 text-sm leading-relaxed focus:border-coral-400 focus:outline-none" />
        <div className="mt-2 flex flex-wrap gap-2">
          <button onClick={onCorrect} disabled={busy}
            className="rounded-pill border-2 border-coral-700 bg-coral-500 px-4 py-2 text-sm font-bold text-white shadow-chunky-soft hover:bg-coral-600 disabled:opacity-60">
            {busy ? 'Đang nhờ AI…' : '🤖 Kiểm tra & sửa câu'}
          </button>
          <button onClick={onSave}
            className="rounded-pill border-2 border-mint-700 bg-mint-500 px-4 py-2 text-sm font-bold text-white shadow-chunky-soft hover:bg-mint-600">
            💾 Lưu nhật ký
          </button>
        </div>
        {err && <p className="mt-2 text-sm font-bold text-coral-600">{err}</p>}
      </div>

      {/* AI feedback */}
      {corr && (
        <div className="mt-3 rounded-chunk border-2 border-mint-300 bg-mint-50 p-4">
          <h3 className="font-display font-bold text-ink-700">✅ Bản đã sửa</h3>
          <p className="mt-1 whitespace-pre-wrap text-sm text-ink-800">{corr.corrected}</p>
          {corr.notes.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-bold text-ink-600">Lỗi & cách sửa:</h4>
              <ul className="mt-1 space-y-2">
                {corr.notes.map((n, i) => (
                  <li key={i} className="rounded-md border border-ink-200 bg-paper p-2 text-sm">
                    <span className="text-coral-600 line-through">{n.wrong}</span>{' → '}
                    <span className="font-bold text-mint-700">{n.fix}</span>
                    <div className="text-xs text-ink-500">{n.explain}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {corr.summary && <p className="mt-3 text-sm italic text-ink-600">💬 {corr.summary}</p>}
          <button onClick={() => setText(corr.corrected)} className="mt-3 text-xs font-bold text-coral-600 hover:underline">
            ↪ Dùng bản đã sửa làm bài viết
          </button>
        </div>
      )}

      {/* Past entries */}
      <div className="mt-6">
        <h2 className="mb-2 font-display text-lg font-bold text-ink-700">Nhật ký đã lưu ({entries.length})</h2>
        {entries.length === 0 ? (
          <p className="text-sm text-ink-400">Chưa có nhật ký nào. Viết bài đầu tiên ở trên nhé!</p>
        ) : (
          <div className="space-y-2">
            {entries.map((e) => (
              <div key={e.id} className="rounded-chunk border-2 border-ink-200 bg-paper p-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink-700">{e.date}</span>
                  <span className="rounded-pill bg-ink-100 px-2 text-xs font-bold text-ink-500">{e.lang === 'en' ? 'EN' : '中文'}</span>
                  {e.corrected && <span className="rounded-pill bg-mint-100 px-2 text-xs font-bold text-mint-700">đã sửa</span>}
                  <span className="flex-1" />
                  <button onClick={() => onEdit(e)} className="text-xs font-bold text-coral-600 hover:underline">Mở/Sửa</button>
                  <button onClick={() => onDelete(e)} className="text-xs font-bold text-ink-400 hover:text-coral-600">Xoá</button>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-ink-600">{e.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
