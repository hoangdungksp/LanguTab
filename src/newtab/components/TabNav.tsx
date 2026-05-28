import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import type { TabId } from '../../types';

interface Tab { id: TabId; label: string; emoji: string; description: string; }

/** All tab metadata, keyed by id. The nav structure references these. */
const TABS: Record<TabId, Tab> = {
  dashboard:  { id: 'dashboard',  label: 'Tổng quan',  emoji: '🏡', description: 'Tiến độ hôm nay' },
  phonetics:  { id: 'phonetics',  label: 'Phát âm',    emoji: '🎧', description: 'Âm & thanh điệu' },
  flashcards: { id: 'flashcards', label: 'Flashcard',  emoji: '🃏', description: 'Ôn từ vựng' },
  stories:    { id: 'stories',    label: 'Truyện',     emoji: '📖', description: 'Truyện ngắn HSK 1-4' },
  phrasebook: { id: 'phrasebook', label: 'Mẫu câu',    emoji: '💬', description: '300 câu thông dụng' },
  journal:    { id: 'journal',    label: 'Nhật ký',    emoji: '📔', description: 'Viết & AI sửa câu' },
  translate:  { id: 'translate',  label: 'Dịch',       emoji: '🌐', description: 'Dịch văn bản' },
  exam:       { id: 'exam',       label: 'Phòng thi',  emoji: '🎯', description: 'Bài thi tương tác' },
};

/** Top-level menu entries: either a single tab or a dropdown group of tabs. */
type NavEntry =
  | { kind: 'tab'; id: TabId }
  | { kind: 'group'; key: string; label: string; emoji: string; items: TabId[] };

const NAV: NavEntry[] = [
  { kind: 'tab', id: 'dashboard' },
  { kind: 'group', key: 'hoctap', label: 'Học tập', emoji: '📚',
    items: ['phonetics', 'flashcards', 'stories', 'phrasebook'] },
  { kind: 'tab', id: 'journal' },
  { kind: 'tab', id: 'translate' },
];
const SECONDARY: TabId[] = ['exam'];

function pillClass(active: boolean): string {
  return [
    'group relative flex flex-1 min-w-0 items-center justify-center gap-2 rounded-chunk border-2 px-3 py-2.5 text-center transition-all duration-150',
    active
      ? 'border-ink-700 bg-paper shadow-chunky-ink'
      : 'border-ink-100 bg-paper/70 hover:border-ink-300 hover:bg-paper',
  ].join(' ');
}
function ActiveDot() {
  return <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-coral-500 shadow-[0_0_0_3px_rgba(255,107,53,0.2)]" />;
}

function TabButton({ tab, active, onClick }: { tab: Tab; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={pillClass(active)} title={tab.description}>
      <span className={['text-xl leading-none', active ? 'animate-pop' : ''].join(' ')}>{tab.emoji}</span>
      <span className={['font-display text-sm font-bold leading-tight whitespace-nowrap', active ? 'text-ink-700' : 'text-ink-500'].join(' ')}>
        {tab.label}
      </span>
      {active && <ActiveDot />}
    </button>
  );
}

function GroupButton({ label, emoji, items, activeTab, onPick }: {
  label: string; emoji: string; items: TabId[]; activeTab: TabId; onPick: (id: TabId) => void;
}) {
  const isActive = items.includes(activeTab);
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={wrap} className="relative flex flex-1 min-w-0">
      <button onClick={() => setOpen((o) => !o)} className={pillClass(isActive)} title={label}>
        <span className={['text-xl leading-none', isActive ? 'animate-pop' : ''].join(' ')}>{emoji}</span>
        <span className={['font-display text-sm font-bold leading-tight whitespace-nowrap', isActive ? 'text-ink-700' : 'text-ink-500'].join(' ')}>
          {label}
        </span>
        <span className="text-ink-400 text-xs">{open ? '▴' : '▾'}</span>
        {isActive && <ActiveDot />}
      </button>
      {open && (
        <div className="absolute left-1/2 top-full z-30 mt-2 w-56 -translate-x-1/2 rounded-chunk border-2 border-ink-200 bg-paper p-1 shadow-chunky-ink">
          {items.map((id) => {
            const t = TABS[id]; const active = activeTab === id;
            return (
              <button key={id} onClick={() => { onPick(id); setOpen(false); }}
                className={['flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors',
                  active ? 'bg-coral-50 text-coral-700' : 'text-ink-700 hover:bg-ink-50'].join(' ')}>
                <span className="text-lg">{t.emoji}</span>
                <span className="font-display text-sm font-bold">{t.label}</span>
                <span className="ml-auto text-[10px] text-ink-400">{t.description}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TabNav() {
  const { activeTab, setTab } = useAppStore();
  return (
    <nav className="mb-4 flex items-center gap-2">
      {NAV.map((entry) =>
        entry.kind === 'tab' ? (
          <TabButton key={entry.id} tab={TABS[entry.id]} active={activeTab === entry.id} onClick={() => setTab(entry.id)} />
        ) : (
          <GroupButton key={entry.key} label={entry.label} emoji={entry.emoji}
            items={entry.items} activeTab={activeTab} onPick={setTab} />
        ),
      )}
      <div className="h-8 w-px bg-ink-200" />
      {SECONDARY.map((id) => (
        <TabButton key={id} tab={TABS[id]} active={activeTab === id} onClick={() => setTab(id)} />
      ))}
    </nav>
  );
}
