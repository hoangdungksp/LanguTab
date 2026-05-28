import { useMemo, useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { PHRASEBOOK, phraseAudioKey, type Phrase } from '../../data/phrasebook';
import { getAudioUrl } from '../../services/examAudioService';

export function TabPhrasebook() {
  const targetLang = useAppStore((s) => s.targetLang);
  const lang: 'en' | 'zh' = targetLang === 'en' ? 'en' : 'zh';
  const [openCat, setOpenCat] = useState<string>(PHRASEBOOK[0]?.id ?? '');
  const [q, setQ] = useState('');
  const [playing, setPlaying] = useState<string | null>(null);

  const cats = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return PHRASEBOOK;
    return PHRASEBOOK
      .map((c) => ({ ...c, phrases: c.phrases.filter((p) => (p.vi + p.en + p.zh + p.pinyin).toLowerCase().includes(s)) }))
      .filter((c) => c.phrases.length);
  }, [q]);

  const play = async (p: Phrase) => {
    setPlaying(p.id);
    const sentence = lang === 'en' ? p.en : p.zh;
    try {
      // Premium server audio (Qwen/ElevenLabs) if it's been generated.
      const url = await getAudioUrl(phraseAudioKey(lang, p.id), sentence);
      const a = new Audio(url);
      a.onended = () => setPlaying(null);
      await a.play();
    } catch {
      // Fallback: browser voice so it always plays (until premium is generated).
      try {
        const u = new SpeechSynthesisUtterance(sentence);
        u.lang = lang === 'en' ? 'en-US' : 'zh-CN';
        u.onend = () => setPlaying(null);
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
      } catch { setPlaying(null); }
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-4">
      <div className="mb-3">
        <h1 className="font-display text-2xl font-bold text-ink-700">💬 Mẫu câu thông dụng {lang === 'en' ? 'tiếng Anh' : 'tiếng Trung'}</h1>
        <p className="text-sm text-ink-500">Câu giao tiếp hằng ngày theo chủ đề — bấm 🔊 để nghe.</p>
      </div>

      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Tìm câu (tiếng Việt / Anh / Trung)…"
        className="mb-3 w-full rounded-chunk border-2 border-ink-200 px-3 py-2 text-sm focus:border-coral-400 focus:outline-none" />

      <div className="space-y-2">
        {cats.map((c) => {
          const open = openCat === c.id || !!q.trim();
          return (
            <div key={c.id} className="rounded-chunk border-2 border-ink-200 bg-paper">
              <button onClick={() => setOpenCat(open && !q ? '' : c.id)}
                className="flex w-full items-center gap-2 px-4 py-3 text-left font-display font-bold text-ink-700">
                <span className="text-xl">{c.emoji}</span>{c.title}
                <span className="ml-1 rounded-pill bg-ink-100 px-2 text-xs font-bold text-ink-500">{c.phrases.length}</span>
                <span className="flex-1" />
                <span className="text-ink-400">{open ? '▴' : '▾'}</span>
              </button>
              {open && (
                <div className="divide-y divide-ink-100 border-t-2 border-ink-100">
                  {c.phrases.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                      <button onClick={() => play(p)}
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${playing === p.id ? 'border-coral-600 bg-coral-100' : 'border-coral-300 bg-coral-50'} text-lg hover:bg-coral-100`}
                        title="Nghe">🔊</button>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-ink-800">{lang === 'en' ? p.en : p.zh}</div>
                        {lang === 'zh' && <div className="text-xs text-coral-600">{p.pinyin}</div>}
                        <div className="text-sm text-ink-500">{p.vi}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {cats.length === 0 && <p className="text-sm text-ink-400">Không tìm thấy câu nào.</p>}
      </div>
    </div>
  );
}
