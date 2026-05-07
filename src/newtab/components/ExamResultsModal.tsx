import type { ExamLevel, ExamAttemptResult } from '../../types';
import { STARS_PER_LEVEL } from '../../types';

/**
 * Results screen shown after the kid finishes (or runs out of time).
 *
 * v2 structure (Sprint 4.6):
 *   - 4 stars total (one per part), not 5 shields
 *   - partResults shape: { partId, partType, totalGraded, correctCount, starEarned, itemResults[] }
 *   - level (not test) is the source of truth for titles
 *
 * UX goals:
 *   - Celebrate even partial success (each part-star earned is a win)
 *   - Per-part breakdown so they know which area to practice
 *   - Encourage retake without shaming
 *   - Match the Cambridge YLE celebration vibe (kid-friendly, big emojis,
 *     animated reveal)
 */
interface Props {
  result: ExamAttemptResult;
  level: ExamLevel;
  onClose: () => void;
}

export function ExamResultsModal({ result, level, onClose }: Props) {
  const passed = result.totalStars >= Math.ceil(STARS_PER_LEVEL / 2);
  const perfect = result.totalStars === STARS_PER_LEVEL;
  const elapsedMin = Math.max(1, Math.round((result.finishedAt - result.startedAt) / 60000));

  // Cambridge-style label per part type — kid-friendly Vietnamese summaries
  const partLabel: Record<string, string> = {
    listening_drag_name: 'Phần 1 — Nghe và kéo tên',
    listening_write: 'Phần 2 — Nghe và viết',
    listening_tick: 'Phần 3 — Nghe và chọn tranh',
    listening_colour: 'Phần 4 — Nghe và tô màu',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-700/60 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-chunk border-2 border-ink-700 bg-paper p-6 shadow-chunky-ink">
        {/* Hero header */}
        <div className="text-center">
          <div className="inline-block animate-bounce text-7xl">
            {perfect ? '🏆' : passed ? '🎉' : '💪'}
          </div>
          <h2 className="mt-2 font-display text-3xl font-bold text-ink-700">
            {perfect
              ? 'Tuyệt vời! Hoàn hảo!'
              : passed
                ? 'Làm tốt lắm!'
                : 'Cố lên! Hãy luyện thêm!'}
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            [STARTERS] {level.title} · Hoàn thành trong {elapsedMin} phút
          </p>
        </div>

        {/* 4-star row */}
        <div className="my-6 flex justify-center gap-3">
          {Array.from({ length: STARS_PER_LEVEL }).map((_, i) => {
            const earned = i < result.totalStars;
            return (
              <div
                key={i}
                className={[
                  'flex h-20 w-20 items-center justify-center rounded-chunk border-2 text-5xl transition-all',
                  earned
                    ? 'animate-pop border-sun-700 bg-gradient-to-br from-sun-200 to-sun-400 shadow-chunky-ink'
                    : 'border-ink-200 bg-ink-50 opacity-50 grayscale',
                ].join(' ')}
                style={earned ? { animationDelay: `${i * 100}ms` } : {}}
              >
                {earned ? '⭐' : '◯'}
              </div>
            );
          })}
        </div>

        <div className="text-center font-display text-2xl font-bold text-ink-700">
          {result.totalStars} / {STARS_PER_LEVEL} sao ⭐
        </div>

        {/* Per-part breakdown */}
        <div className="mt-6 space-y-2">
          <h3 className="font-display text-lg font-bold text-ink-700">
            Chi tiết từng phần
          </h3>
          {result.partResults.map((pr) => {
            const pct = pr.totalGraded > 0
              ? Math.round((pr.correctCount / pr.totalGraded) * 100)
              : 0;
            return (
              <div
                key={pr.partId}
                className={[
                  'flex items-center gap-3 rounded-chunk border-2 p-3',
                  pr.starEarned
                    ? 'border-mint-300 bg-mint-50'
                    : 'border-ink-200 bg-paper',
                ].join(' ')}
              >
                <div className="text-3xl">{pr.starEarned ? '⭐' : '◯'}</div>
                <div className="flex-1">
                  <div className="font-display font-bold text-ink-700">
                    {partLabel[pr.partType] ?? pr.partId}
                  </div>
                  <div className="text-xs text-ink-500">
                    {pr.correctCount}/{pr.totalGraded} câu đúng · {pct}%
                  </div>
                </div>
                <div
                  className={[
                    'rounded-pill px-3 py-1 text-xs font-bold',
                    pr.starEarned
                      ? 'bg-mint-500 text-white'
                      : 'bg-ink-200 text-ink-500',
                  ].join(' ')}
                >
                  {pr.starEarned ? 'Đạt' : 'Chưa đạt'}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={onClose}
            className="flex-1 rounded-pill border-2 border-ink-700 bg-cream py-2.5 text-sm font-bold text-ink-700 shadow-chunky-soft hover:bg-sun-100"
          >
            ← Quay lại Phòng thi
          </button>
          <button
            onClick={() => {
              // Reload triggers a fresh attempt; v1.1.x will replace with proper retake.
              window.location.reload();
            }}
            className="flex-1 rounded-pill border-2 border-coral-700 bg-coral-500 py-2.5 text-sm font-bold text-white shadow-chunky-soft hover:bg-coral-600"
          >
            🔄 Thi lại
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-ink-400">
          💡 Mẹo: làm bài nhiều lần để cải thiện điểm và lấy đủ 4 sao!
        </p>
      </div>
    </div>
  );
}
