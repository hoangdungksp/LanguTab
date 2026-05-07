import { useEffect, useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { getStats } from '../../services/srs';
import { wordsByLang, langLabels } from '../../data';
import { db } from '../../services/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '../hooks/useAuth';
import { WordCatalog } from './WordCatalog';

function greetingForNow(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Khuya rồi';
  if (h < 11) return 'Chào buổi sáng';
  if (h < 13) return 'Chào buổi trưa';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

export function Dashboard() {
  const { targetLang, streak, totalReviewsToday, dailyGoal, setTab, setDailyGoal } = useAppStore();
  const { userInfo, signedIn } = useAuth();
  const words = wordsByLang[targetLang];
  const lbl = langLabels[targetLang];

  // Display name in greeting — use first name from Google profile if signed
  // in, otherwise omit the name entirely (Hardcoded "Jason" was a leftover
  // from dev). Falls back to "bạn" (Vietnamese "you") for signed-out users
  // so the greeting doesn't look broken.
  const greetName = signedIn && userInfo?.name
    ? userInfo.name.split(' ')[0]
    : 'bạn';

  // Live-update when progress changes — re-renders Dashboard whenever
  // wordProgress table mutates (rate a card, sign out + clear, sync pull,
  // download-all, account delete, user-switch wipe). Without this, the
  // dueNow/seen counters keep showing stale values until next manual reload.
  const wpCount = useLiveQuery(
    () => db.wordProgress.where('lang').equals(targetLang).count(),
    [targetLang],
  );

  const [stats, setStats] = useState<{
    total: number;
    newCount: number;
    learning: number;
    review: number;
    dueNow: number;
    seen: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getStats(targetLang, words).then((s) => {
      if (!cancelled) setStats(s);
    });
    return () => { cancelled = true; };
    // wpCount in deps so recompute when Dexie changes (sign-out + clear,
    // sync pull, etc). Adding it triggers useEffect on every wordProgress
    // mutation — fine because getStats is fast (single Dexie query).
  }, [targetLang, words, wpCount]);

  const goalProgress = Math.min(100, Math.round((totalReviewsToday / dailyGoal) * 100));

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="card-chunky relative overflow-hidden p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-coral-100 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-8 h-48 w-48 rounded-full bg-mint-100 blur-3xl" />

        <div className="relative">
          <p className="font-display text-sm font-semibold uppercase tracking-widest text-ink-400">
            {greetingForNow()}, {greetName} 👋
          </p>
          <h2 className="mt-2 font-display text-4xl font-bold text-ink-700">
            Hôm nay học{' '}
            <span className={targetLang === 'zh' ? 'text-zh text-coral-500' : 'text-coral-500'}>
              {lbl.name}
            </span>{' '}
            nào!
          </h2>
          <p className="mt-3 max-w-xl text-base text-ink-500">
            {lbl.tagline}. Mỗi tab mới là một buổi ôn nhỏ — chỉ cần{' '}
            <strong className="text-ink-700">{dailyGoal} thẻ</strong> để giữ chuỗi ngày.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button onClick={() => setTab('flashcards')} className="btn-coral">
              <span>🃏</span>
              <span>Bắt đầu ôn</span>
            </button>
            <button onClick={() => setTab('phonetics')} className="btn-ghost">
              <span>🎧</span>
              <span>Luyện phát âm</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon="🔥"
          label="Chuỗi ngày"
          value={streak}
          suffix={streak === 1 ? 'ngày' : 'ngày'}
          tint="sun"
        />
        <StatCard
          icon="🎯"
          label="Mục tiêu hôm nay"
          value={totalReviewsToday}
          suffix={`/ ${dailyGoal}`}
          tint="coral"
          progress={goalProgress}
        />
        <StatCard
          icon="⏰"
          label="Đến hạn ôn"
          value={stats?.dueNow ?? 0}
          suffix="thẻ"
          tint="mint"
        />
        <StatCard
          icon="📚"
          label="Đã gặp"
          value={stats?.seen ?? 0}
          suffix={`/ ${stats?.total ?? 0}`}
          tint="ink"
        />
      </div>

      {/* Daily goal chooser */}
      <div className="card-soft p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-bold text-ink-700">
              Mục tiêu hàng ngày
            </h3>
            <p className="mt-1 text-sm text-ink-500">
              Chọn số thẻ bạn muốn ôn mỗi ngày. Ít mà đều hơn là nhiều mà đứt chuỗi.
            </p>
          </div>
          <div className="flex gap-2">
            {[5, 10, 20, 30].map((n) => (
              <button
                key={n}
                onClick={() => setDailyGoal(n)}
                className={[
                  'rounded-chunk border-2 px-4 py-2 font-display font-bold transition-all',
                  dailyGoal === n
                    ? 'border-coral-500 bg-coral-500 text-white shadow-chunky-coral'
                    : 'border-ink-200 bg-paper text-ink-500 hover:border-ink-300',
                ].join(' ')}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Word catalog — browseable index of all HSK vocab. Lives inside
          Dashboard rather than as its own tab so the home view feels
          complete without an extra navigation hop. */}
      <WordCatalog />
    </div>
  );
}

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  suffix?: string;
  tint: 'coral' | 'mint' | 'sun' | 'ink';
  progress?: number;
}

function StatCard({ icon, label, value, suffix, tint, progress }: StatCardProps) {
  const tintClasses = {
    coral: 'border-coral-200 bg-coral-50',
    mint: 'border-mint-200 bg-mint-50',
    sun: 'border-sun-200 bg-sun-50',
    ink: 'border-ink-100 bg-paper',
  }[tint];

  const progressColor = {
    coral: 'bg-coral-500',
    mint: 'bg-mint-500',
    sun: 'bg-sun-300',
    ink: 'bg-ink-700',
  }[tint];

  return (
    <div className={`card-soft ${tintClasses} p-5`}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
        <span className="text-base leading-none">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <div className="font-display text-4xl font-bold text-ink-700 tabular-nums">{value}</div>
        {suffix && <div className="text-sm font-semibold text-ink-400">{suffix}</div>}
      </div>
      {typeof progress === 'number' && (
        <div className="mt-3 h-2 overflow-hidden rounded-pill bg-ink-100">
          <div
            className={`h-full rounded-pill transition-all duration-500 ${progressColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
