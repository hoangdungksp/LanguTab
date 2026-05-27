import type {
  ExamLevel,
  ExamPart,
  ExamAnswer,
  ExamPartResult,
  ExamAttemptResult,
} from '../types';

/**
 * Pure grading logic — no I/O. Given a level and the user's answers,
 * return per-part and overall results.
 *
 * Answers are keyed by partId (drag, colour) or partId+questionId (write,
 * tick) since those parts have multiple sub-questions. We use a Map<string,
 * ExamAnswer> with composite keys for write/tick.
 *
 * Star threshold: a part awards a star if at least 4 of 5 sub-items are
 * correct (Cambridge YLE convention). Drag-name and colour parts only have
 * "all correct" as their grading metric — but for v2 we still credit
 * partial accuracy: a star if ≥80% of items are correct.
 */
export function gradeAttempt(
  level: ExamLevel,
  answers: ExamAnswer[],
  startedAt: number,
  finishedAt: number,
): ExamAttemptResult {
  // Index answers by their key for fast lookup
  const dragAnswers = new Map<string, ExamAnswer>();
  const writeAnswers = new Map<string, ExamAnswer>(); // key: partId+questionId
  const tickAnswers = new Map<string, ExamAnswer>();
  const colourAnswers = new Map<string, ExamAnswer>();
  const matchAnswers = new Map<string, ExamAnswer>();

  for (const ans of answers) {
    if (ans.type === 'listening_drag_name') {
      dragAnswers.set(ans.partId, ans);
    } else if (ans.type === 'listening_write') {
      writeAnswers.set(`${ans.partId}::${ans.questionId}`, ans);
    } else if (ans.type === 'listening_tick') {
      tickAnswers.set(`${ans.partId}::${ans.questionId}`, ans);
    } else if (ans.type === 'listening_colour') {
      colourAnswers.set(ans.partId, ans);
    } else if (ans.type === 'listening_match') {
      matchAnswers.set(ans.partId, ans);
    }
  }

  const partResults = level.parts.map((part) =>
    gradePart(part, dragAnswers, writeAnswers, tickAnswers, colourAnswers, matchAnswers),
  );
  const totalStars = partResults.filter((p) => p.starEarned).length;

  return {
    attemptId: crypto.randomUUID(),
    levelNumber: level.levelNumber,
    startedAt,
    finishedAt,
    totalStars,
    partResults,
    answers,
  };
}

function gradePart(
  part: ExamPart,
  dragAnswers: Map<string, ExamAnswer>,
  writeAnswers: Map<string, ExamAnswer>,
  tickAnswers: Map<string, ExamAnswer>,
  colourAnswers: Map<string, ExamAnswer>,
  matchAnswers: Map<string, ExamAnswer>,
): ExamPartResult {
  switch (part.type) {
    case 'listening_drag_name': {
      const answer = dragAnswers.get(part.partId);
      const mapping =
        answer?.type === 'listening_drag_name' ? answer.mapping : {};
      const itemResults = part.names.map((name) => ({
        itemId: name,
        correct: mapping[name] === part.correctMapping[name],
      }));
      const correctCount = itemResults.filter((r) => r.correct).length;
      return {
        partId: part.partId,
        partType: part.type,
        totalGraded: part.names.length,
        correctCount,
        starEarned: correctCount >= Math.ceil(part.names.length * 0.8),
        itemResults,
      };
    }

    case 'listening_write': {
      const itemResults = part.questions.map((q) => {
        const answer = writeAnswers.get(`${part.partId}::${q.questionId}`);
        if (!answer || answer.type !== 'listening_write') {
          return { itemId: q.questionId, correct: false };
        }
        const typed = answer.answer.trim().toLowerCase();
        const correct = q.acceptedAnswers.some(
          (v) => v.trim().toLowerCase() === typed,
        );
        return { itemId: q.questionId, correct };
      });
      const correctCount = itemResults.filter((r) => r.correct).length;
      return {
        partId: part.partId,
        partType: part.type,
        totalGraded: part.questions.length,
        correctCount,
        starEarned: correctCount >= 4, // Cambridge: 4 of 5
        itemResults,
      };
    }

    case 'listening_tick': {
      const itemResults = part.questions.map((q) => {
        const answer = tickAnswers.get(`${part.partId}::${q.questionId}`);
        if (!answer || answer.type !== 'listening_tick') {
          return { itemId: q.questionId, correct: false };
        }
        return {
          itemId: q.questionId,
          correct: answer.selectedOptionId === q.correctOptionId,
        };
      });
      const correctCount = itemResults.filter((r) => r.correct).length;
      return {
        partId: part.partId,
        partType: part.type,
        totalGraded: part.questions.length,
        correctCount,
        starEarned: correctCount >= 4,
        itemResults,
      };
    }

    case 'listening_colour': {
      const answer = colourAnswers.get(part.partId);
      const colors =
        answer?.type === 'listening_colour' ? answer.colors : {};
      const itemResults = part.regions.map((r) => ({
        itemId: r.id,
        correct: colors[r.id] === part.correctColors[r.id],
      }));
      const correctCount = itemResults.filter((r) => r.correct).length;
      return {
        partId: part.partId,
        partType: part.type,
        totalGraded: part.regions.length,
        correctCount,
        starEarned: correctCount >= Math.ceil(part.regions.length * 0.8),
        itemResults,
      };
    }

    case 'listening_match': {
      const answer = matchAnswers.get(part.partId);
      const mapping =
        answer?.type === 'listening_match' ? answer.mapping : {};
      const itemResults = part.items.map((item) => ({
        itemId: item.id,
        correct: mapping[item.id] === part.correctMapping[item.id],
      }));
      const correctCount = itemResults.filter((r) => r.correct).length;
      return {
        partId: part.partId,
        partType: part.type,
        totalGraded: part.items.length,
        correctCount,
        starEarned: correctCount >= Math.ceil(part.items.length * 0.8),
        itemResults,
      };
    }
  }
}
