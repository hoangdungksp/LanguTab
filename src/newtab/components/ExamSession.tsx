import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type {
  ExamLevel,
  ExamPart,
  ExamAnswer,
  ExamAttemptResult,
} from '../../types';
import { gradeAttempt } from '../../services/examGradingService';
import { markLevelCompleted } from '../../services/examProgressService';
import { getPlanet, planetForLevel } from '../../data/exam/planets';
import { ExamPartView } from './ExamPartView';
import { ExamResultsModal } from './ExamResultsModal';

/**
 * Cambridge YLE-styled exam session. Replaces v1's simple ExamRunner with
 * a full-screen game-like layout matching the screenshots:
 *
 *   Top bar:
 *     [✕ exit] [STARTERS / Bài thi N — Listening]
 *     [▶ progress bar with rocket icon]                 [⏱️ time]
 *
 *   Main content: large white card with the current part's question
 *
 *   Side nav: large red circular ◀ ▶ buttons (visible on left/right of card)
 *
 *   Bottom-right: "Báo cáo lỗi" (placeholder) + audio player
 *
 * Navigation paradigm: each "page" of the session is one question (or one
 * sub-question). Total pages = sum of graded items across all parts:
 *   Part 1 (drag) → 1 page (whole scene)
 *   Part 2 (write) → 5 pages (one per question, sharing scene)
 *   Part 3 (tick) → 5 pages (one per sub-question)
 *   Part 4 (colour) → 1 page (whole scene)
 *   Total: 12 pages typical for a level.
 */

interface Props {
  level: ExamLevel;
  onExit: () => void;
}

export function ExamSession({ level, onExit }: Props) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [answers, setAnswers] = useState<ExamAnswer[]>([]);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [finalResult, setFinalResult] = useState<ExamAttemptResult | null>(null);
  const startedAtRef = useRef(Date.now());

  // Compute the flat list of "pages" — one per graded item (or per part for
  // single-page parts like drag/colour). Index in this list = currentPageIndex.
  const pages = useMemo(() => buildPageList(level), [level]);
  const currentPage = pages[currentPageIndex];

  // Tick the elapsed timer every second
  useEffect(() => {
    const id = setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-submit when time runs out
  useEffect(() => {
    if (elapsedSec >= level.timeLimitSec && !finalResult) {
      finishAttempt();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsedSec]);

  const handleAnswer = useCallback((answer: ExamAnswer) => {
    setAnswers((prev) => {
      // Replace any existing answer with the same identity. For drag/colour
      // we key by partId; for write/tick we key by partId+questionId.
      const idOf = (a: ExamAnswer) => identityOf(a);
      const next = prev.filter((a) => idOf(a) !== idOf(answer));
      next.push(answer);
      return next;
    });
  }, []);

  function finishAttempt() {
    const result = gradeAttempt(level, answers, startedAtRef.current, Date.now());
    setFinalResult(result);
    // Sprint 4.8: persist completion to localStorage for progress tracking.
    // Threshold: any non-zero star marks completion (kid friendly — "I tried,
    // I get a star"). For stricter completion, raise to >= 2 (half pass).
    // Best-of-attempts: re-attempts only update if higher star count.
    if (result.totalStars > 0) {
      markLevelCompleted(level.levelNumber, result.totalStars);
    }
  }

  const goNext = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    } else {
      finishAttempt();
    }
  };
  const goPrev = () => {
    if (currentPageIndex > 0) setCurrentPageIndex(currentPageIndex - 1);
  };

  if (finalResult) {
    return (
      <ExamResultsModal
        result={finalResult}
        level={level}
        onClose={onExit}
      />
    );
  }

  if (!currentPage) {
    return <div className="card-chunky p-8 text-center">Lỗi: không tìm thấy câu hỏi.</div>;
  }

  const remainingSec = Math.max(0, level.timeLimitSec - elapsedSec);
  const minutes = Math.floor(remainingSec / 60);
  const seconds = remainingSec % 60;
  const timeWarning = remainingSec < 60;
  const totalPages = pages.length;
  const completedPages = answers.length;
  const progressPct = (currentPageIndex / Math.max(1, totalPages - 1)) * 100;
  const isLastPage = currentPageIndex === totalPages - 1;

  // Sprint 4.8.7: Restored white card wrapper around exam content to
  // match exam.png reference. Outer planet bg is full-bleed (cosmic
  // identity), inner white card focuses on the actual exam content
  // (audio player, scene, drop zones). No outer chunky border but the
  // white card has subtle rounded corners + shadow for content focus.
  const planet = getPlanet(planetForLevel(level.levelNumber));

  return (
    <div className={`full-bleed -mt-2 min-h-screen ${planet.theme.pageBg}`}>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* White exam card — matches exam.png reference: white background,
            rounded corners, soft shadow, contains all exam UI. */}
        <div className="rounded-3xl bg-white p-4 shadow-xl sm:p-6">
          {/* ─── Top bar ───────────────────────────────────────────────── */}
          <div className="flex items-center gap-3">
            {/* Exit button (left) */}
            <button
              onClick={() => {
                if (confirm('Thoát bài thi? Câu trả lời chưa lưu sẽ mất.')) onExit();
              }}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[3px] border-ink-700 bg-coral-500 text-xl font-bold text-white shadow-chunky-ink hover:bg-coral-600"
              aria-label="Thoát"
            >
              ✕
        </button>

            {/* Title block — Sprint 4.8.5: planet-themed background, dynamic name */}
            <div className={`rounded-chunk border-2 border-ink-700 px-4 py-2 text-white shadow-chunky-ink ${planet.theme.buttonBg}`}>
              <div className="font-heading text-lg leading-none tracking-wide">
                {planet.name}
              </div>
              <div className="font-display text-xs font-bold leading-tight">
                {level.title}
              </div>
              <div className="font-heading text-[11px] tracking-widest opacity-90">
                LISTENING
              </div>
            </div>

        {/* Progress bar with rocket */}
        <div className="relative flex-1">
          <div className="h-5 overflow-hidden rounded-pill border-2 border-ink-700 bg-coral-200">
            <div
              className="h-full rounded-pill bg-gradient-to-r from-coral-400 to-coral-600 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {/* Rocket icon at the progress tip */}
          <div
            className="pointer-events-none absolute top-1/2 -translate-y-1/2 transition-all duration-300"
            style={{ left: `calc(${progressPct}% - 16px)` }}
          >
            <span className="text-2xl">🚀</span>
          </div>
        </div>

        {/* Timer (right) */}
        <div
          className={[
            'shrink-0 rounded-chunk border-2 border-ink-700 px-3 py-1.5 text-center shadow-chunky-soft',
            timeWarning
              ? 'animate-pulse bg-coral-100'
              : 'bg-cream',
          ].join(' ')}
        >
          <div className="text-[9px] font-bold uppercase tracking-wide text-ink-500">
            Thời gian còn lại
          </div>
          <div className="font-display text-xl font-bold text-ink-700">
            ⏱️ {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <div className="text-[9px] text-ink-400">
            Đã hoàn thành {completedPages}/{totalPages} câu
          </div>
        </div>
      </div>

      {/* ─── Main question card with side nav ──────────────────────── */}
      <div className="relative flex-1">
        {/* Prev button (left, vertically centered) */}
        <button
          onClick={goPrev}
          disabled={currentPageIndex === 0}
          className="absolute left-0 top-1/2 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-ink-700 bg-coral-500 text-2xl text-white shadow-chunky-ink transition-all hover:bg-coral-600 disabled:opacity-30 sm:h-16 sm:w-16"
          aria-label="Câu trước"
        >
          ◀
        </button>

        {/* Next button (right) */}
        <button
          onClick={goNext}
          className={[
            'absolute right-0 top-1/2 z-10 flex h-14 w-14 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border-[3px] border-ink-700 text-2xl text-white shadow-chunky-ink transition-all sm:h-16 sm:w-16',
            isLastPage
              ? 'bg-mint-500 hover:bg-mint-600'
              : 'bg-coral-500 hover:bg-coral-600',
          ].join(' ')}
          aria-label={isLastPage ? 'Nộp bài' : 'Câu tiếp'}
        >
          {isLastPage ? '🏁' : '▶'}
        </button>

        {/* The question card itself */}
        <div className="h-full rounded-chunk border-2 border-ink-700 bg-paper p-4 shadow-chunky-ink sm:p-6">
          <ExamPartView
            page={currentPage}
            currentAnswers={answers}
            onAnswer={handleAnswer}
            levelId={`level${level.levelNumber}`}
          />
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page list construction ─────────────────────────────────────────────

/**
 * A "page" is one navigable view inside the session. Some parts have one
 * page that holds all sub-items (drag, colour); others have one page per
 * sub-item (write, tick).
 */
/**
 * Sprint 4.7.2: write/tick parts now render ALL 5 sub-questions on a single
 * page (no carousel). Audio plays once, kid sees all 5 questions at once,
 * fills them in real-time while listening — matches Cambridge YLE format
 * where the test booklet shows the full part on one page.
 *
 * Before (Sprint 4.6): 1 page per sub-question with dot-nav carousel.
 * Required clicking dots to advance, lost focus from listening.
 *
 * After (Sprint 4.7.2): 1 page per part, all questions stacked vertically.
 * Audio plays once, kid hears all questions, writes answers as they go.
 */
export type ExamPage =
  | { kind: 'drag'; part: Extract<ExamPart, { type: 'listening_drag_name' }>; partIndex: number }
  | { kind: 'write'; part: Extract<ExamPart, { type: 'listening_write' }>; partIndex: number }
  | { kind: 'tick'; part: Extract<ExamPart, { type: 'listening_tick' }>; partIndex: number }
  | { kind: 'colour'; part: Extract<ExamPart, { type: 'listening_colour' }>; partIndex: number };

function buildPageList(level: ExamLevel): ExamPage[] {
  const pages: ExamPage[] = [];
  level.parts.forEach((part, partIndex) => {
    if (part.type === 'listening_drag_name') {
      pages.push({ kind: 'drag', part, partIndex });
    } else if (part.type === 'listening_write') {
      // One page for the whole part — all 5 questions rendered together
      pages.push({ kind: 'write', part, partIndex });
    } else if (part.type === 'listening_tick') {
      // One page for the whole part — all 5 questions rendered together
      pages.push({ kind: 'tick', part, partIndex });
    } else if (part.type === 'listening_colour') {
      pages.push({ kind: 'colour', part, partIndex });
    }
  });
  return pages;
}

/** Identity key for an answer — for de-duping in the answers array. */
function identityOf(a: ExamAnswer): string {
  if (a.type === 'listening_drag_name') return `drag::${a.partId}`;
  if (a.type === 'listening_colour') return `colour::${a.partId}`;
  return `${a.type}::${a.partId}::${a.questionId}`;
}
