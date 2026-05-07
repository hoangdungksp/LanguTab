import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import {
  addToHistory,
  clearHistory,
  clearStoredEmail,
  defaultPairFor,
  getHistory,
  getStoredEmail,
  setStoredEmail,
  translateText,
  TranslateError,
  type HistoryEntry,
  type TranslateLang,
} from '../../services/translateService';
import { wordsByLang } from '../../data';
import type { Word } from '../../types';

/**
 * Translate tab — MyMemory-powered bilingual translation.
 *
 * Smart features:
 *   - Default language pair derived from user's study target (zh ↔ vi or en ↔ vi)
 *   - HSK1 word highlighting in Chinese results, click → opens Flashcard
 *   - Local history of last 30 translations
 *   - Cached results don't count against quota
 *   - Optional email config to raise quota from 5K → 50K chars/day
 */

export function TabTranslate() {
  const targetLang = useAppStore((s) => s.targetLang);
  return <TranslateMain targetLang={targetLang} />;
}

function TranslateMain({ targetLang }: { targetLang: 'zh' | 'en' }) {
  const defaultPair = defaultPairFor(targetLang);
  const [from, setFrom] = useState<TranslateLang>(defaultPair.from);
  const [to, setTo] = useState<TranslateLang>(defaultPair.to);
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [matchQuality, setMatchQuality] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  // Reset language pair when targetLang changes
  useEffect(() => {
    const dp = defaultPairFor(targetLang);
    setFrom(dp.from);
    setTo(dp.to);
    setSourceText('');
    setTranslatedText('');
    setError(null);
  }, [targetLang]);

  useEffect(() => {
    getHistory().then(setHistory);
  }, []);

  // Stop any in-flight speech synthesis when the component unmounts.
  // Without this, clicking "Nghe" then switching to another tab leaves the
  // browser narrating into the void from the user's perspective.
  useEffect(() => {
    return () => {
      try {
        speechSynthesis.cancel();
      } catch {
        // Some browsers throw if speechSynthesis is unavailable; ignore.
      }
    };
  }, []);

  const swap = () => {
    const oldFrom = from;
    setFrom(to);
    setTo(oldFrom);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
    setError(null);
  };

  const doTranslate = async () => {
    setLoading(true);
    setError(null);
    setFromCache(false);
    setMatchQuality(null);
    try {
      const result = await translateText(sourceText, from, to);
      setTranslatedText(result.translatedText);
      setFromCache(result.fromCache);
      setMatchQuality(result.matchQuality ?? null);

      // Add to history (fire and forget)
      addToHistory({
        sourceText: sourceText.trim(),
        translatedText: result.translatedText,
        from,
        to,
      }).then(() => getHistory().then(setHistory));
    } catch (err) {
      const e = err as TranslateError;
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      doTranslate();
    }
  };

  const copyResult = async () => {
    if (!translatedText) return;
    try {
      await navigator.clipboard.writeText(translatedText);
    } catch {
      // ignore
    }
  };

  const playAudio = () => {
    if (!translatedText) return;
    const utter = new SpeechSynthesisUtterance(translatedText);
    utter.lang = to === 'zh' ? 'zh-CN' : to === 'vi' ? 'vi-VN' : 'en-US';
    utter.rate = 0.9;
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-bold text-ink-700">🌐 Dịch</h1>
          <p className="text-sm text-ink-500">
            Dịch nhanh giữa các ngôn ngữ. Click vào từ tiếng Trung trong kết
            quả để mở Flashcard.
          </p>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          aria-label="Cài đặt"
          className="flex h-10 w-10 items-center justify-center rounded-chunk border-2 border-ink-200 bg-paper text-ink-400 transition-colors hover:border-ink-300 hover:text-ink-700"
        >
          ⚙️
        </button>
      </header>

      {/* Compact language pair indicator + swap.
          The active study language (targetLang) anchors which pair is used:
            zh → vi ↔ zh   (Vietnamese learner studying Chinese)
            en → vi ↔ en   (Vietnamese learner studying English)
          Pickers were removed — the pair is implicit from what Jason is
          learning, and a tap on ⇄ flips direction. Smaller footprint, no
          decision-making overhead. */}
      <div className="flex items-center justify-center gap-2">
        <FlagPill lang={from} />
        <button
          onClick={swap}
          aria-label="Đổi chiều dịch"
          title="Đổi chiều dịch"
          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink-200 bg-paper text-ink-500 transition-all hover:border-ink-400 hover:rotate-180"
        >
          <span className="text-sm">⇄</span>
        </button>
        <FlagPill lang={to} />
      </div>

      {/* Input + output side by side */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card-soft flex flex-col p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-display text-sm font-bold uppercase tracking-wider text-ink-500">
              <span className="text-base">{LANG_LABELS[from].flag}</span>
              <span>{LANG_LABELS[from].name}</span>
            </span>
            <span className={`text-xs ${sourceText.length > 450 ? 'text-coral-600' : 'text-ink-400'}`}>
              {sourceText.length}/500
            </span>
          </div>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập văn bản cần dịch..."
            maxLength={500}
            rows={6}
            className="flex-1 resize-none rounded-chunk border-2 border-ink-100 bg-paper p-3 font-display text-base text-ink-700 outline-none transition-colors focus:border-ink-300"
          />
          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              onClick={() => {
                setSourceText('');
                setTranslatedText('');
                setError(null);
              }}
              className="text-xs font-semibold text-ink-400 hover:text-ink-600"
            >
              Xóa
            </button>
            <button
              onClick={doTranslate}
              disabled={loading || !sourceText.trim()}
              className="rounded-pill border-2 border-ink-700 bg-coral-500 px-5 py-2 font-display text-sm font-semibold text-white shadow-chunky-coral transition-all hover:bg-coral-600 disabled:cursor-not-allowed disabled:bg-ink-200 disabled:text-ink-400 disabled:shadow-none"
            >
              {loading ? '⏳ Đang dịch...' : '🌐 Dịch'}
            </button>
          </div>
          <div className="mt-1 text-right text-xs text-ink-300">
            <kbd className="rounded bg-ink-100 px-1 py-0.5">⌘</kbd>+
            <kbd className="rounded bg-ink-100 px-1 py-0.5">Enter</kbd> để dịch
          </div>
        </div>

        <div className="card-soft flex flex-col p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-display text-sm font-bold uppercase tracking-wider text-ink-500">
              <span className="text-base">{LANG_LABELS[to].flag}</span>
              <span>{LANG_LABELS[to].name}</span>
            </span>
            <div className="flex items-center gap-2">
              {fromCache && (
                <span title="Kết quả từ cache, không tốn quota" className="text-xs text-mint-600">
                  ⚡ cached
                </span>
              )}
              {matchQuality !== null && matchQuality < 0.5 && !fromCache && (
                <span title="Chất lượng dịch thấp, kiểm tra lại" className="text-xs text-sun-600">
                  ⚠️ {Math.round(matchQuality * 100)}%
                </span>
              )}
            </div>
          </div>
          <div className="min-h-[160px] flex-1 rounded-chunk border-2 border-ink-100 bg-cream p-3">
            {error ? (
              <div className="flex h-full items-center justify-center text-center text-sm text-coral-600">
                ⚠️ {error}
              </div>
            ) : translatedText ? (
              <ResultText text={translatedText} lang={to} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm italic text-ink-300">
                Kết quả dịch sẽ hiện ở đây
              </div>
            )}
          </div>
          {translatedText && !error && (
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                onClick={playAudio}
                className="rounded-pill border-2 border-ink-200 bg-paper px-4 py-1.5 text-sm font-semibold text-ink-600 transition-all hover:border-ink-400"
              >
                🔊 Nghe
              </button>
              <button
                onClick={copyResult}
                className="rounded-pill border-2 border-ink-200 bg-paper px-4 py-1.5 text-sm font-semibold text-ink-600 transition-all hover:border-ink-400"
              >
                📋 Copy
              </button>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      <HistoryList
        history={history}
        onClick={(h) => {
          setSourceText(h.sourceText);
          setTranslatedText(h.translatedText);
          setFrom(h.from);
          setTo(h.to);
        }}
        onClear={async () => {
          await clearHistory();
          setHistory([]);
        }}
      />

      {/* Settings modal */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Settings modal — optional email for higher quota
// ────────────────────────────────────────────────────────────────────────────

function SettingsModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getStoredEmail().then((e) => {
      setSavedEmail(e);
      if (e) setEmail(e);
    });
  }, []);

  const save = async () => {
    if (!email.includes('@')) {
      alert('Vui lòng nhập email hợp lệ');
      return;
    }
    setSaving(true);
    try {
      await setStoredEmail(email);
      setSavedEmail(email);
    } finally {
      setSaving(false);
    }
  };

  const clear = async () => {
    if (!confirm('Xóa email khỏi cài đặt? Quota sẽ giảm xuống 5K ký tự/ngày.')) return;
    await clearStoredEmail();
    setEmail('');
    setSavedEmail(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-700/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="card-chunky relative w-full max-w-md overflow-hidden p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-chunk text-ink-400 hover:bg-ink-100 hover:text-ink-700"
        >
          ✕
        </button>

        <h2 className="font-display text-2xl font-bold text-ink-700">⚙️ Cài đặt Dịch</h2>

        <p className="mt-3 text-sm text-ink-600">
          Tab Dịch sử dụng <strong>MyMemory</strong> — dịch vụ miễn phí từ
          translated.net với cơ sở dữ liệu hàng tỷ câu dịch của con người.
        </p>

        <div className="mt-4 space-y-3 rounded-chunk border-2 border-ink-100 bg-paper p-4">
          <div>
            <div className="font-display text-sm font-bold text-ink-700">
              📧 Email (tùy chọn)
            </div>
            <p className="mt-1 text-xs text-ink-500">
              Cung cấp email sẽ <strong>tăng quota từ 5K → 50K ký tự/ngày</strong>.
              MyMemory chỉ dùng email để identify quota, không spam.
            </p>
          </div>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ten@example.com"
            className="w-full rounded-chunk border-2 border-ink-200 bg-paper px-3 py-2 text-sm text-ink-700 outline-none transition-colors focus:border-ink-400"
          />

          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={saving || !email.trim() || email === savedEmail}
              className="flex-1 rounded-pill border-2 border-ink-700 bg-mint-500 px-4 py-1.5 text-sm font-semibold text-white shadow-chunky-soft transition-all hover:bg-mint-600 disabled:cursor-not-allowed disabled:bg-ink-200 disabled:text-ink-400 disabled:shadow-none"
            >
              {saving ? 'Đang lưu...' : savedEmail === email ? '✓ Đã lưu' : 'Lưu'}
            </button>
            {savedEmail && (
              <button
                onClick={clear}
                className="rounded-pill border-2 border-ink-200 bg-paper px-4 py-1.5 text-sm font-semibold text-ink-500 transition-all hover:border-coral-400 hover:text-coral-600"
              >
                Xóa
              </button>
            )}
          </div>

          {savedEmail && (
            <div className="rounded-chunk bg-mint-50 px-3 py-2 text-xs text-mint-700">
              ✓ Đang dùng email: <strong>{savedEmail}</strong> (50K ký tự/ngày)
            </div>
          )}
        </div>

        <div className="mt-4 rounded-chunk border-2 border-sun-200 bg-sun-50 p-3 text-xs text-ink-700">
          <strong>💡 Mẹo:</strong> Quota reset lúc <strong>7 giờ sáng giờ Việt Nam</strong>{' '}
          (00:00 UTC). Kết quả dịch được cache 30 ngày trong trình duyệt — dịch
          lại văn bản giống hệt sẽ không tốn quota.
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────────────────

const LANG_LABELS: Record<TranslateLang, { flag: string; name: string }> = {
  zh: { flag: '🇨🇳', name: 'Tiếng Trung' },
  vi: { flag: '🇻🇳', name: 'Tiếng Việt' },
  en: { flag: '🇺🇸', name: 'Tiếng Anh' },
};

/**
 * Compact flag pill that just *shows* the language — no dropdown to pick a
 * different one (the pair is auto-derived from targetLang). Replaces the
 * old <select> dropdown which felt heavy for a fixed two-language pair.
 */
function FlagPill({ lang }: { lang: TranslateLang }) {
  const { flag, name } = LANG_LABELS[lang];
  return (
    <div className="flex items-center gap-2 rounded-pill border-2 border-ink-200 bg-paper px-3 py-1.5">
      <span className="text-base leading-none">{flag}</span>
      <span className="font-display text-sm font-semibold text-ink-700">{name}</span>
    </div>
  );
}

/**
 * Render translated text with HSK1 word highlighting + click-to-flashcard
 * for Chinese results. For Vietnamese/English we render plain text.
 */
function ResultText({ text, lang }: { text: string; lang: TranslateLang }) {
  const navigateToWord = useAppStore((s) => s.navigateToWord);

  // wordsByLang.zh is the flat union of all unlocked Chinese tiers
  // (HSK 1 + HSK 2 currently). As more HSKs are added in tiers.ts they
  // become clickable here automatically without changes here.
  const allZhWords = wordsByLang.zh;
  const wordByTerm = useMemo(() => {
    const m = new Map<string, Word>();
    for (const w of allZhWords) m.set(w.term, w);
    return m;
  }, [allZhWords]);

  const sortedTerms = useMemo(() => {
    return [...wordByTerm.keys()].sort((a, b) => b.length - a.length);
  }, [wordByTerm]);

  if (lang !== 'zh') {
    return <p className="whitespace-pre-wrap font-display text-base leading-relaxed text-ink-700">{text}</p>;
  }

  // Greedy longest-match tokenize
  const tokens: Array<{ text: string; word?: Word }> = [];
  let i = 0;
  while (i < text.length) {
    let matched: { text: string; word: Word } | null = null;
    for (const term of sortedTerms) {
      if (text.startsWith(term, i)) {
        matched = { text: term, word: wordByTerm.get(term)! };
        break;
      }
    }
    if (matched) {
      tokens.push(matched);
      i += matched.text.length;
    } else {
      let j = i + 1;
      while (j < text.length) {
        let nextMatch = false;
        for (const term of sortedTerms) {
          if (text.startsWith(term, j)) {
            nextMatch = true;
            break;
          }
        }
        if (nextMatch) break;
        j++;
      }
      tokens.push({ text: text.slice(i, j) });
      i = j;
    }
  }

  return (
    <p className="whitespace-pre-wrap font-display text-zh text-2xl leading-relaxed text-ink-700">
      {tokens.map((tok, ti) =>
        tok.word ? (
          <button
            key={ti}
            onClick={() => navigateToWord(tok.word!.id)}
            title={`${tok.word.phonetic} — ${tok.word.translation}\nClick để mở Flashcard`}
            className="cursor-pointer border-b-2 border-coral-300 text-coral-700 transition-colors hover:border-coral-500"
          >
            {tok.text}
          </button>
        ) : (
          <span key={ti}>{tok.text}</span>
        ),
      )}
    </p>
  );
}

function HistoryList({
  history,
  onClick,
  onClear,
}: {
  history: HistoryEntry[];
  onClick: (h: HistoryEntry) => void;
  onClear: () => void;
}) {
  if (history.length === 0) return null;

  return (
    <div className="card-soft p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink-500">
          📜 Lịch sử ({history.length})
        </h3>
        <button
          onClick={() => {
            if (confirm('Xóa toàn bộ lịch sử dịch?')) onClear();
          }}
          className="text-xs font-semibold text-ink-400 hover:text-coral-600"
        >
          Xóa tất cả
        </button>
      </div>
      <ul className="divide-y divide-ink-100">
        {history.map((h) => (
          <li key={h.id}>
            <button
              onClick={() => onClick(h)}
              className="flex w-full items-start gap-3 py-3 text-left transition-colors hover:bg-paper"
            >
              <div className="flex flex-col items-center gap-0.5 pt-0.5 text-base font-semibold text-ink-400">
                <span>{LANG_LABELS[h.from].flag}</span>
                <span className="text-xs text-ink-300">↓</span>
                <span>{LANG_LABELS[h.to].flag}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-ink-600">{h.sourceText}</div>
                <div className="truncate text-sm font-medium text-ink-700">
                  {h.translatedText}
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
