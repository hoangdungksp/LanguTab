import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  getDailyStats,
  getHeatmap,
  getMasteryDistribution,
  getOverview,
  getWordsLearnedToday,
  getWordsReviewedToday,
  type DailyStats,
  type HeatmapDay,
  type MasteryDistribution,
  type OverviewStats,
} from '../../services/stats';
import { wordsByLang } from '../../data';
import type { Language } from '../../types';

/**
 * Detailed stats dashboard — bottom of the Dashboard tab.
 *
 * Loads aggregations from the review log and renders:
 *   - Overview metric cards (4 large numbers)
 *   - Words learned today (chip list of hanzi)
 *   - 30-day activity bar chart
 *   - 12-week heatmap (GitHub style)
 *   - Mastery distribution donut
 *   - HSK1 progress bar with breakdown
 *
 * Loads in parallel on mount + lang change. No live query — explicit refresh
 * after rate events would be ideal but the dashboard auto-reloads on tab
 * switch (useEffect re-fires) so for now this is good enough.
 */

export function StatsSection({ lang }: { lang: Language }) {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [daily, setDaily] = useState<DailyStats[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);
  const [mastery, setMastery] = useState<MasteryDistribution | null>(null);
  const [todayLearned, setTodayLearned] = useState<string[]>([]);
  const [todayReviewed, setTodayReviewed] = useState<string[]>([]);

  // Live-query trigger: re-runs the heavy aggregation effect below whenever
  // Dexie's reviewLog mutates. Without this, signing out + clearing data
  // doesn't reset the stats panel until next manual reload.
  const reviewLogTick = useLiveQuery(() => db.reviewLog.count(), []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getOverview(lang),
      getDailyStats(lang, 30),
      getHeatmap(lang, 84),
      getMasteryDistribution(lang),
      getWordsLearnedToday(lang),
      getWordsReviewedToday(lang),
    ]).then(([o, d, h, m, learnedIds, reviewedIds]) => {
      if (cancelled) return;
      setOverview(o);
      setDaily(d);
      setHeatmap(h);
      setMastery(m);
      setTodayLearned(learnedIds);
      setTodayReviewed(reviewedIds);
    });
    return () => { cancelled = true; };
  }, [lang, reviewLogTick]);

  if (!overview || !mastery) {
    return null; // Don't show anything until first load — avoids flash of zeros
  }

  // Empty-state — no reviews yet at all
  if (overview.totalReviews === 0) {
    return (
      <section className="card-soft mt-6 p-12 text-center">
        <div className="text-6xl">📊</div>
        <h3 className="mt-4 font-display text-2xl font-bold text-ink-700">
          Chưa có dữ liệu thống kê
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
          Bắt đầu ôn vài thẻ trong tab Flashcard, thống kê chi tiết sẽ xuất hiện
          ở đây — bao gồm heatmap, biểu đồ tốc độ, và phân bố mức độ thuộc.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* Big-number metric strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <BigMetric
          icon="✨"
          label="Hôm nay"
          value={overview.reviewsToday}
          unit="lượt ôn"
          accent="coral"
          sub={overview.newWordsToday > 0 ? `${overview.newWordsToday} từ mới` : 'Chưa có từ mới'}
        />
        <BigMetric
          icon="🔥"
          label="Chuỗi ngày"
          value={overview.currentStreak}
          unit="ngày"
          accent="sun"
          sub={`Kỷ lục: ${overview.longestStreak} ngày`}
        />
        <BigMetric
          icon="📚"
          label="Đã học"
          value={overview.uniqueWordsLearned}
          unit="từ"
          accent="mint"
          sub={`${overview.totalReviews} lượt ôn tổng`}
        />
        <BigMetric
          icon="⚡"
          label="Tốc độ TB"
          value={Math.round(overview.reviewsPerDay)}
          unit="lượt/ngày"
          accent="ink"
          sub={`Đã học ${overview.daysActive} ngày`}
        />
      </div>

      {/* Words learned/reviewed today — chip lists */}
      <TodayActivity
        lang={lang}
        learnedIds={todayLearned}
        reviewedIds={todayReviewed}
      />

      {/* 30-day activity chart */}
      <div className="card-soft p-5">
        <h3 className="font-display text-lg font-bold text-ink-700">
          📈 Hoạt động 30 ngày qua
        </h3>
        <p className="text-sm text-ink-500">
          Số lượt ôn mỗi ngày (xanh) + từ mới học (cam)
        </p>
        <div className="mt-4 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%" minHeight={150}>
            <BarChart data={daily}>
              <XAxis
                dataKey="label"
                interval={Math.max(0, Math.floor(daily.length / 10))}
                tick={{ fill: '#666690', fontSize: 11 }}
                axisLine={{ stroke: '#CACADA' }}
              />
              <YAxis
                tick={{ fill: '#666690', fontSize: 11 }}
                axisLine={{ stroke: '#CACADA' }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '2px solid #1A1A2E',
                  fontFamily: 'Be Vietnam Pro, system-ui',
                  fontSize: 13,
                }}
                labelFormatter={(_, payload) => {
                  const d = payload?.[0]?.payload as DailyStats | undefined;
                  return d?.date ?? '';
                }}
                formatter={(value, name) => [
                  value,
                  name === 'reviews' ? 'Lượt ôn' : 'Từ mới',
                ]}
              />
              <Bar dataKey="reviews" fill="#2EC4B6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="newWords" fill="#FF6B35" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heatmap calendar */}
      <Heatmap days={heatmap} />

      {/* Mastery breakdown — pie chart + HSK1 progress */}
      <div className="grid gap-4 md:grid-cols-2">
        <MasteryPie mastery={mastery} />
        <Hsk1Progress mastery={mastery} />
      </div>

      {/* Average rating trend */}
      {daily.some((d) => d.avgRating !== null) && (
        <div className="card-soft p-5">
          <h3 className="font-display text-lg font-bold text-ink-700">
            🎯 Độ chính xác trung bình
          </h3>
          <p className="text-sm text-ink-500">
            Mỗi ngày: trung bình rating bạn cho mỗi thẻ (1=Lại, 4=Dễ).
            Cao hơn = nhớ tốt hơn.
          </p>
          <div className="mt-4 h-44 w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={150}>
              <LineChart data={daily}>
                <XAxis
                  dataKey="label"
                  interval={Math.max(0, Math.floor(daily.length / 10))}
                  tick={{ fill: '#666690', fontSize: 11 }}
                />
                <YAxis
                  domain={[1, 4]}
                  ticks={[1, 2, 3, 4]}
                  tick={{ fill: '#666690', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '2px solid #1A1A2E',
                    fontFamily: 'Be Vietnam Pro, system-ui',
                  }}
                  formatter={(value) =>
                    typeof value === 'number' ? value.toFixed(2) : '—'
                  }
                />
                <Line
                  type="monotone"
                  dataKey="avgRating"
                  stroke="#FF6B35"
                  strokeWidth={3}
                  dot={{ fill: '#FF6B35', r: 3 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────────────────

function BigMetric(props: {
  icon: string;
  label: string;
  value: number;
  unit: string;
  sub: string;
  accent: 'coral' | 'mint' | 'sun' | 'ink';
}) {
  const { icon, label, value, unit, sub, accent } = props;
  const accentBg = {
    coral: 'bg-coral-50 border-coral-200',
    mint: 'bg-mint-50 border-mint-200',
    sun: 'bg-sun-50 border-sun-200',
    ink: 'bg-paper border-ink-100',
  }[accent];

  return (
    <div className={`rounded-chunk border-2 ${accentBg} p-4`}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
        <span className="text-base">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-display text-3xl font-bold text-ink-700 tabular-nums">
          {value}
        </span>
        <span className="text-xs text-ink-400">{unit}</span>
      </div>
      <div className="mt-1 text-xs text-ink-400">{sub}</div>
    </div>
  );
}

function TodayActivity({
  lang,
  learnedIds,
  reviewedIds,
}: {
  lang: Language;
  learnedIds: string[];
  reviewedIds: string[];
}) {
  const allWords = wordsByLang[lang];
  const wordById = new Map(allWords.map((w) => [w.id, w]));

  if (learnedIds.length === 0 && reviewedIds.length === 0) return null;

  return (
    <div className="card-soft p-5">
      <h3 className="font-display text-lg font-bold text-ink-700">
        🌟 Hôm nay đã học
      </h3>

      {learnedIds.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-coral-500">
            Từ mới ({learnedIds.length})
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {learnedIds.map((id) => {
              const w = wordById.get(id);
              if (!w) return null;
              return (
                <span
                  key={id}
                  className="inline-flex items-baseline gap-1.5 rounded-pill border-2 border-coral-300 bg-coral-50 px-3 py-1"
                  title={`${w.phonetic} — ${w.translation}`}
                >
                  <span className="font-display text-zh text-base font-bold text-ink-700">
                    {w.term}
                  </span>
                  <span className="text-xs text-ink-500">{w.translation}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {reviewedIds.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-mint-500">
            Đã ôn ({reviewedIds.length})
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {reviewedIds.map((id) => {
              const w = wordById.get(id);
              if (!w) return null;
              return (
                <span
                  key={id}
                  className="inline-block rounded-pill border border-mint-200 bg-mint-50 px-2.5 py-0.5 font-display text-zh text-sm text-ink-700"
                  title={`${w.phonetic} — ${w.translation}`}
                >
                  {w.term}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * GitHub-style heatmap — 12 weeks × 7 days grid.
 * Days flow vertically within each column (Mon-Sun) and columns flow weekly
 * left to right. The most recent day is at the bottom-right.
 */
function Heatmap({ days }: { days: HeatmapDay[] }) {
  // Group into weeks. Week starts Monday for Vietnamese convention.
  // We need to align the first column so weekday rows match.
  if (days.length === 0) return null;

  const weeks: (HeatmapDay | null)[][] = [];
  let currentWeek: (HeatmapDay | null)[] = [];

  // Pad start: the first day in `days` may not be Monday — pad with nulls
  // so first column reflects calendar layout.
  const firstDay = new Date(days[0].date);
  const firstDow = (firstDay.getDay() + 6) % 7; // 0 = Mon (recompute)
  for (let i = 0; i < firstDow; i++) currentWeek.push(null);

  for (const d of days) {
    currentWeek.push(d);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  const levelClass = (l: 0 | 1 | 2 | 3 | 4) =>
    [
      'bg-ink-100',
      'bg-mint-100',
      'bg-mint-300',
      'bg-mint-500',
      'bg-mint-700',
    ][l];

  const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  return (
    <div className="card-soft p-5">
      <h3 className="font-display text-lg font-bold text-ink-700">
        📅 Lịch học (12 tuần)
      </h3>
      <p className="text-sm text-ink-500">
        Mỗi ô = 1 ngày. Đậm hơn = nhiều lượt ôn hơn.
      </p>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {/* Day-of-week labels */}
        <div className="flex flex-col gap-1 pt-1 text-[10px] font-semibold text-ink-400">
          {dayLabels.map((l) => (
            <div key={l} className="h-3.5 leading-none">
              {l}
            </div>
          ))}
        </div>

        {/* Week columns */}
        <div className="flex gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((d, di) => (
                <div
                  key={di}
                  className={[
                    'h-3.5 w-3.5 rounded-sm transition-transform hover:scale-125',
                    d ? levelClass(d.level) : 'bg-transparent',
                  ].join(' ')}
                  title={
                    d
                      ? `${d.date}: ${d.count} lượt`
                      : ''
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-2 text-xs text-ink-400">
        <span>Ít</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <div
            key={l}
            className={`h-3 w-3 rounded-sm ${levelClass(l as 0 | 1 | 2 | 3 | 4)}`}
          />
        ))}
        <span>Nhiều</span>
      </div>
    </div>
  );
}

function MasteryPie({ mastery }: { mastery: MasteryDistribution }) {
  const data = [
    { name: 'Mới', value: mastery.new, color: '#CACADA' },
    { name: 'Đang học', value: mastery.learning, color: '#FFD23F' },
    { name: 'Đã thuộc', value: mastery.review, color: '#2EC4B6' },
    { name: 'Học lại', value: mastery.relearning, color: '#FF6B35' },
  ].filter((d) => d.value > 0);

  return (
    <div className="card-soft p-5">
      <h3 className="font-display text-lg font-bold text-ink-700">
        🎯 Phân bố mức độ thuộc
      </h3>
      <p className="text-sm text-ink-500">
        Trạng thái của {mastery.total} từ HSK1.
      </p>
      <div className="mt-4 h-48 w-full">
        <ResponsiveContainer width="100%" height="100%" minHeight={150}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={80}
              paddingAngle={2}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: '2px solid #1A1A2E',
                fontFamily: 'Be Vietnam Pro, system-ui',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm" style={{ background: d.color }} />
            <span className="text-ink-500">
              {d.name}: <strong className="text-ink-700">{d.value}</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Hsk1Progress({ mastery }: { mastery: MasteryDistribution }) {
  const masteredPct = (mastery.review / mastery.total) * 100;
  const seenPct = (mastery.seen / mastery.total) * 100;

  return (
    <div className="card-soft p-5">
      <h3 className="font-display text-lg font-bold text-ink-700">
        📖 Tiến độ HSK1
      </h3>
      <p className="text-sm text-ink-500">
        Mục tiêu: thuộc tất cả {mastery.total} từ.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-mint-600">
              Đã thuộc
            </span>
            <span className="font-display text-sm font-bold text-ink-700">
              {mastery.review} / {mastery.total} ({Math.round(masteredPct)}%)
            </span>
          </div>
          <div className="mt-1 h-3 overflow-hidden rounded-pill bg-ink-100">
            <div
              className="h-full bg-mint-500 transition-all duration-500"
              style={{ width: `${masteredPct}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-coral-600">
              Đã gặp
            </span>
            <span className="font-display text-sm font-bold text-ink-700">
              {mastery.seen} / {mastery.total} ({Math.round(seenPct)}%)
            </span>
          </div>
          <div className="mt-1 h-3 overflow-hidden rounded-pill bg-ink-100">
            <div
              className="h-full bg-coral-500 transition-all duration-500"
              style={{ width: `${seenPct}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 text-center">
          <div className="rounded-chunk border-2 border-ink-100 p-3">
            <div className="font-display text-2xl font-bold text-ink-700">
              {mastery.new}
            </div>
            <div className="text-xs text-ink-400">Chưa gặp</div>
          </div>
          <div className="rounded-chunk border-2 border-ink-100 p-3">
            <div className="font-display text-2xl font-bold text-ink-700">
              {mastery.learning + mastery.relearning}
            </div>
            <div className="text-xs text-ink-400">Đang học</div>
          </div>
        </div>
      </div>
    </div>
  );
}
