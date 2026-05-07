import { useAppStore } from '../../stores/useAppStore';
import type { TabId } from '../../types';

interface Tab {
  id: TabId;
  label: string;
  emoji: string;
  description: string;
}

/**
 * Main learning tabs — left-aligned, primary surfaces user spends most time on.
 * Order matters: typical user journey is dashboard → flashcards/stories → check stats.
 */
const MAIN_TABS: Tab[] = [
  { id: 'dashboard',  label: 'Tổng quan',  emoji: '🏡', description: 'Tiến độ hôm nay' },
  { id: 'phonetics',  label: 'Phát âm',    emoji: '🎧', description: 'Âm & thanh điệu' },
  { id: 'flashcards', label: 'Flashcard',  emoji: '🃏', description: 'Ôn từ vựng' },
  { id: 'stories',    label: 'Truyện kể',  emoji: '📖', description: 'Truyện ngắn HSK 1-4' },
  { id: 'translate',  label: 'Dịch',       emoji: '🌐', description: 'Dịch văn bản' },
];

/**
 * Secondary tabs — right-aligned, accessed less frequently.
 *
 * Stats was moved out of here in v0.17.0: a "look back" surface didn't
 * earn a top-level slot, and the modal under the user avatar (Account &
 * Sync → Thống kê) is a more natural home for personal analytics.
 *
 * Exam takes its place: Phòng thi (interactive Cambridge-YLE-style mock
 * tests, Level 1-3) is the new flagship feature shipping in v1.0.
 */
const SECONDARY_TABS: Tab[] = [
  { id: 'exam', label: 'Phòng thi', emoji: '🎯', description: 'Bài thi tương tác' },
];

function TabButton({ tab, active, onClick }: { tab: Tab; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={[
        'group relative flex flex-1 min-w-0 items-center justify-center gap-2 rounded-chunk border-2 px-3 py-2.5 text-center transition-all duration-150',
        active
          ? 'border-ink-700 bg-paper shadow-chunky-ink'
          : 'border-ink-100 bg-paper/70 hover:border-ink-300 hover:bg-paper',
      ].join(' ')}
      title={tab.description}
    >
      <span className={['text-xl leading-none', active ? 'animate-pop' : ''].join(' ')}>
        {tab.emoji}
      </span>
      <span
        className={[
          'font-display text-sm font-bold leading-tight whitespace-nowrap',
          active ? 'text-ink-700' : 'text-ink-500',
        ].join(' ')}
      >
        {tab.label}
      </span>
      {active && (
        <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-coral-500 shadow-[0_0_0_3px_rgba(255,107,53,0.2)]" />
      )}
    </button>
  );
}

export function TabNav() {
  const { activeTab, setTab } = useAppStore();

  return (
    // Single-row flex with flex-1 on each button. All tabs share screen width
    // equally so nothing scrolls horizontally. Description text moved to the
    // `title` attribute (tooltip) since it would steal too much space inline.
    // The compact layout fits all 6 tabs at viewports ≥ ~720px; below that
    // the buttons squish but text stays readable thanks to whitespace-nowrap +
    // flex-1's equal distribution.
    <nav className="mb-4 flex items-center gap-2">
      {MAIN_TABS.map((t) => (
        <TabButton
          key={t.id}
          tab={t}
          active={activeTab === t.id}
          onClick={() => setTab(t.id)}
        />
      ))}
      {/* Visual separator between main + secondary group */}
      <div className="h-8 w-px bg-ink-200" />
      {SECONDARY_TABS.map((t) => (
        <TabButton
          key={t.id}
          tab={t}
          active={activeTab === t.id}
          onClick={() => setTab(t.id)}
        />
      ))}
    </nav>
  );
}
