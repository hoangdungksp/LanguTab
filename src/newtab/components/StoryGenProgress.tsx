import { useEffect, useState } from 'react';

/**
 * Progress overlay shown during story generation.
 *
 * Replaces the previous simple "Đang viết truyện..." spinner. Generation
 * takes 15-25s typically (Workers AI Qwen 30B with 8K max_tokens) and a
 * static spinner makes it feel broken. This component runs an animated
 * "phase" indicator that gives the user a sense of progress and what's
 * happening behind the scenes — even though the actual generation is a
 * single sync call (not real progress events).
 *
 * Why "perceived progress" instead of true SSE streaming:
 *   The model returns JSON (not plain text), so partial output isn't
 *   renderable until the closing `}`. True streaming would mean parsing
 *   chunk-by-chunk to extract the first complete `sentence` field then
 *   typewriter it, which is significant complexity for limited UX gain
 *   (the user still has to wait for the full story before they can
 *   interact). The phase indicator below gives 80% of the perceived UX
 *   benefit at 5% of the implementation cost. We can revisit true SSE if
 *   user feedback shows they really want word-by-word streaming.
 *
 * Phases (timed to match observed avg generation time of ~20s):
 *   0-5s   "Đang lên ý tưởng"     (model digesting prompt + reasoning)
 *   5-12s  "Đang viết câu chuyện"  (most of the token output)
 *   12-18s "Đang chọn từ vựng"     (vocabulary list extraction)
 *   18s+   "Đang hoàn thiện"        (still waiting / final formatting)
 *
 * If generation completes before phases finish, the parent unmounts this.
 * If generation runs longer, we just stay on phase 4 indefinitely.
 */

interface Phase {
  emoji: string;
  label: string;
  /** Start time in milliseconds since generation began */
  startsAt: number;
}

const PHASES: Phase[] = [
  { emoji: '🤔', label: 'Đang lên ý tưởng', startsAt: 0 },
  { emoji: '✍️', label: 'Đang viết câu chuyện', startsAt: 5000 },
  { emoji: '🎨', label: 'Đang chọn từ vựng', startsAt: 12000 },
  { emoji: '🌐', label: 'Đang hoàn thiện và dịch', startsAt: 18000 },
];

/** Visual fill duration (slowest expected gen time). UI clamps at 95%. */
const ESTIMATED_TOTAL_MS = 25000;

export function StoryGenProgress() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Date.now() - start);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Determine current phase based on elapsed time
  const currentPhaseIndex = PHASES.reduce(
    (acc, phase, idx) => (elapsed >= phase.startsAt ? idx : acc),
    0,
  );
  const currentPhase = PHASES[currentPhaseIndex];

  // Progress bar fills toward 95% (never 100% — final 5% requires actual
  // completion which the parent handles by unmounting this component).
  // Curve is roughly linear with a small ease-out at the end.
  const progressPct = Math.min(95, (elapsed / ESTIMATED_TOTAL_MS) * 100);

  return (
    <div className="rounded-chunk border-2 border-ink-200 bg-cream p-8">
      {/* Big animated emoji */}
      <div className="text-center">
        <div
          key={currentPhaseIndex}
          className="inline-block animate-bounce text-6xl"
        >
          {currentPhase.emoji}
        </div>

        <h3 className="mt-3 font-display text-xl font-bold text-ink-700">
          {currentPhase.label}
          <AnimatedDots />
        </h3>

        <p className="mt-2 text-sm text-ink-500">
          AI đang sáng tác truyện ngắn dành riêng cho bạn — mất khoảng 15-25 giây.
        </p>
      </div>

      {/* Progress bar */}
      <div className="mt-6">
        <div className="relative h-3 overflow-hidden rounded-pill border-2 border-ink-200 bg-white">
          <div
            className="h-full rounded-pill bg-gradient-to-r from-coral-400 to-coral-600 transition-all duration-200 ease-out"
            style={{ width: `${progressPct}%` }}
          />
          {/* Shimmer overlay */}
          <div
            className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-ink-400">
          <span>{Math.floor(elapsed / 1000)}s</span>
          <span>~25s</span>
        </div>
      </div>

      {/* Phase breadcrumbs */}
      <div className="mt-5 flex justify-between gap-1">
        {PHASES.map((p, idx) => (
          <div
            key={p.label}
            className={[
              'flex flex-1 flex-col items-center gap-1 rounded-md px-2 py-1.5 text-center text-xs transition-all',
              idx < currentPhaseIndex
                ? 'text-ink-300'
                : idx === currentPhaseIndex
                  ? 'bg-coral-50 font-semibold text-coral-700'
                  : 'text-ink-300',
            ].join(' ')}
          >
            <span className={idx < currentPhaseIndex ? 'opacity-50' : ''}>
              {idx < currentPhaseIndex ? '✓' : p.emoji}
            </span>
            <span className="hidden sm:inline">{p.label.split(' ').slice(-2).join(' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Animated "..." that progresses ., .., ... cyclically every 400ms.
 * Pure CSS would be simpler but we want the dots to feel synchronous with
 * the bouncy emoji above (both reset together when phase changes).
 */
function AnimatedDots() {
  const [count, setCount] = useState(1);
  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => (c % 3) + 1);
    }, 400);
    return () => clearInterval(id);
  }, []);
  return <span className="inline-block w-6 text-left">{'.'.repeat(count)}</span>;
}
