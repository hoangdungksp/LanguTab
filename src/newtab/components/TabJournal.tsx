import { useEffect, useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import {
  listEntries, saveEntry, deleteEntry, correctText,
  type JournalEntry, type Correction, type JournalLang,
} from '../../services/journalService';

const todayISO = () => new Date().toISOString().slice(0, 10);

export function TabJournal() {
  const targetLang = useAppStore((s) => s.targetLang);
  const lang: JournalLang = targetLang === 'en' ? 'en' : 'zh';

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(todayISO());
  const [text, setText] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [corr, setCorr] = useState<Correction | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [authNeeded, setAuthNeeded] = useState(false);

  const reload = async () => {
    setLoading(true); setErr('');
    try { setEntries(await listEntries()); setAuthNeeded(false); }
    catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('đăng nhập')) setAuthNeeded(true); else setErr(msg);
    } finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []);

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
    setBusy(true); setErr('');
    try {
      const saved = await saveEntry({
        id: editId ?? undefined, lang, date, text,
        corrected: corr?.corrected, notes: corr?.notes, summary: corr?.summary,
      });
      setEditId(saved.id);
      await reload();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  const onOpen = (e: JournalEntry) => {
    setEditId(e.id); setText(e.text); setDate(e.date);
    setCorr(e.corrected ? { corrected: e.corrected, notes: e.notes ?? [], summary: e.summary ?? '' } : null);
    setErr('');
  };

  const onDelete = async (e: JournalEntry) => {
    if (!confirm(`Xoá vĩnh viễn nhật ký ngày ${e.date}? Không thể hoàn tác.`)) return;
    try {
      await deleteEntry(e.id);
      if (editId === e.id) reset();
      await reload();
    } catch (err) { setErr(err instanceof Error ? err.message : String(err)); }
  };

  if (authNeeded) {
    return (
      <div className="mx-auto max-w-xl p-6 text-center">
        <div className="rounded-chunk border-2 border-ink-200 bg-paper p-8 shadow-chunky-soft">
          <div className="text-5xl">🔐</div>
          <h2 className="mt-2 font-display text-xl font-bold text-ink-700">Đăng nhập để dùng Nhật ký</h2>
          <p className="mt-1 text-sm text-ink-500">
            Nhật ký được lưu trên máy chủ (an toàn, đa thiết bị, không sợ mất khi đổi máy hay xoá trình duyệt).
            Đăng nhập Google ở góc trên bên phải rồi quay lại tab này.
          </p>
        </div>
      </div>
    );
  }

  const placeholder = lang === 'en'
    ? 'Viết vài câu tiếng Anh về ngày hôm nay… (vd: Today I went to school. If it rains tomorrow, I will stay home.)'
    : '用中文写几句今天的事… (例如：今天我去了学校。如果明天下雨，我就待在家里。)';

  return (
    <div className="mx-auto grid max-w-6xl gap-4 p-4 md:grid-cols-[280px_1fr]">
      {/* LEFT: list of entries */}
      <aside className="space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-bold text-ink-700">📔 Nhật ký</h2>
          <span className="rounded-pill bg-ink-100 px-2 text-xs font-bold text-ink-500">{entries.length}</span>
          <span className="flex-1" />
          <button onClick={reset} className="rounded-pill border-2 border-coral-700 bg-coral-500 px-3 py-1 text-xs font-bold text-white shadow-chunky-soft hover:bg-coral-600">
            + Viết mới
          </button>
        </div>
        <div className="max-h-[calc(100vh-180px)] space-y-1 overflow-y-auto rounded-chunk border-2 border-ink-200 bg-paper p-2">
          {loading ? (
            <p className="p-2 text-sm text-ink-400">Đang tải…</p>
          ) : entries.length === 0 ? (
            <p className="p-2 text-sm text-ink-400">Chưa có nhật ký. Viết bài đầu tiên bên phải.</p>
          ) : entries.map((e) => (
            <button key={e.id} onClick={() => onOpen(e)}
              className={`w-full rounded-md border-2 p-2 text-left transition-colors ${editId === e.id ? 'border-coral-400 bg-coral-50' : 'border-transparent hover:bg-ink-50'}`}>
              <div className="flex items-center gap-2">
                <span className="font-bold text-ink-700">{e.date}</span>
                <span className="rounded-pill bg-ink-100 px-1.5 text-[10px] font-bold text-ink-500">{e.lang === 'en' ? 'EN' : '中文'}</span>
                {e.corrected && <span className="rounded-pill bg-mint-100 px-1.5 text-[10px] font-bold text-mint-700">đã sửa</span>}
              </div>
              <div className="mt-0.5 line-clamp-2 text-xs text-ink-500">{e.text}</div>
            </button>
          ))}
        </div>
      </aside>

      {/* RIGHT: editor + AI feedback */}
      <section className="space-y-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-700">{editId ? 'Sửa nhật ký' : 'Viết nhật ký mới'} — {lang === 'en' ? 'tiếng Anh' : 'tiếng Trung'}</h1>
          <p className="text-sm text-ink-500">Lưu trên cloud (D1) — đa thiết bị, chỉ xoá khi bạn bấm Xoá.</p>
        </div>

        <div className="rounded-chunk border-2 border-ink-200 bg-paper p-4 shadow-chunky-soft">
          <div className="mb-2 flex items-center gap-2">
            <label className="text-sm font-bold text-ink-600">Ngày:</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="rounded-md border-2 border-ink-200 px-2 py-1 text-sm" />
            <span className="flex-1" />
            {editId && (
              <button onClick={() => onDelete(entries.find((x) => x.id === editId)!)}
                className="text-xs font-bold text-coral-600 hover:underline">🗑 Xoá nhật ký này</button>
            )}
          </div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={9} placeholder={placeholder}
            className="w-full rounded-chunk border-2 border-ink-200 p-3 text-sm leading-relaxed focus:border-coral-400 focus:outline-none" />
          <div className="mt-2 flex flex-wrap gap-2">
            <button onClick={onCorrect} disabled={busy}
              className="rounded-pill border-2 border-coral-700 bg-coral-500 px-4 py-2 text-sm font-bold text-white shadow-chunky-soft hover:bg-coral-600 disabled:opacity-60">
              {busy ? 'Đang…' : '🤖 Kiểm tra & sửa câu'}
            </button>
            <button onClick={onSave} disabled={busy}
              className="rounded-pill border-2 border-mint-700 bg-mint-500 px-4 py-2 text-sm font-bold text-white shadow-chunky-soft hover:bg-mint-600 disabled:opacity-60">
              💾 {editId ? 'Lưu thay đổi' : 'Lưu nhật ký'}
            </button>
          </div>
          {err && <p className="mt-2 text-sm font-bold text-coral-600">{err}</p>}
        </div>

        {corr && (
          <div className="rounded-chunk border-2 border-mint-300 bg-mint-50 p-4">
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
      </section>
    </div>
  );
}
