/**
 * Exam types — Cambridge YLE-inspired interactive tests v2.
 *
 * v1 ship 1 question per part. Real Cambridge format is 5 sub-questions per
 * part with one shared audio narration. v2 restructures to match:
 *
 *   ExamLevel (level 1, 2, ..., 300)
 *     └─ ExamPart (4 parts per level)
 *         ├─ One audio narration covering all sub-questions
 *         └─ Multiple sub-items (5 typically), 1 of which is an "example"
 *
 * The 4 part formats — modeled on Cambridge Starters Listening (kept stable
 * across all 300 levels regardless of difficulty band):
 *
 *   Part 1 — Listen & match names: scene with 5+ characters; drag 5 names
 *            (1 pre-placed example) onto matching drop zones.
 *   Part 2 — Listen & write: shared scene image; 5 short fill-in answers
 *            (1-2 words each) with 2 examples shown.
 *   Part 3 — Listen & tick: 5 individual question rows; each has prompt +
 *            3 picture options A/B/C; pick the correct one.
 *   Part 4 — Listen & colour: outline scene with 5+ colorable regions;
 *            audio names region+color for each.
 *
 * Levels group by difficulty:
 *   1-100   Cấp 1 (Starters / Pre-A1) — 6-8 tuổi
 *   101-200 Cấp 2 (Movers / A1)        — 8-10 tuổi
 *   201-300 Cấp 3 (Flyers / A2)        — 10-12 tuổi
 */

export type ExamDifficulty = 'starters' | 'movers' | 'flyers';

export interface ExamDropZone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

export interface DragNamePart {
  type: 'listening_drag_name';
  partId: string;
  audioKey: string;
  audioScript: string;
  sceneId: string;
  dropZones: ExamDropZone[];
  exampleName: string;
  exampleZoneId: string;
  names: string[];
  correctMapping: Record<string, string>;
}

export interface WritePart {
  type: 'listening_write';
  partId: string;
  audioKey: string;
  audioScript: string;
  sceneId: string;
  examples: { question: string; answer: string }[];
  questions: WriteQuestionItem[];
}
export interface WriteQuestionItem {
  questionId: string;
  prompt: string;
  prefix?: string;
  suffix?: string;
  acceptedAnswers: string[];
}

export interface TickPart {
  type: 'listening_tick';
  partId: string;
  audioKey: string;
  audioScript: string;
  example: TickQuestionItem;
  questions: TickQuestionItem[];
}
export interface TickQuestionItem {
  questionId: string;
  prompt: string;
  options: TickOption[];
  correctOptionId: string;
}
export interface TickOption {
  id: string;
  iconId: string;
  label?: string;
}

export interface ColourPart {
  type: 'listening_colour';
  partId: string;
  audioKey: string;
  audioScript: string;
  sceneId: string;
  /** Sprint 4.9.2: example region needs coords too so it can be rendered
   *  with calibration handles in admin mode. */
  example: { regionId: string; color: string; x: number; y: number; width: number; height: number };
  /**
   * Sprint 4.9.2: Each region carries x/y/width/height (0-1 fractions of
   * scene image) so they can be positioned over the AI-generated outline
   * art. Admin can fine-tune per-level via calibration tool (same flow
   * as Part 1 drag zones — see examCalibrationService.ts).
   */
  regions: { id: string; label: string; x: number; y: number; width: number; height: number }[];
  correctColors: Record<string, string>;
  palette: string[];
}

export type ExamPart = DragNamePart | WritePart | TickPart | ColourPart;

export interface ExamLevel {
  levelNumber: number;
  difficulty: ExamDifficulty;
  title: string;
  description: string;
  timeLimitSec: number;
  parts: [DragNamePart, WritePart, TickPart, ColourPart];
}

export const STARS_PER_LEVEL = 4;

export type ExamAnswer =
  | { type: 'listening_drag_name'; partId: string; mapping: Record<string, string> }
  | { type: 'listening_write'; partId: string; questionId: string; answer: string }
  | { type: 'listening_tick'; partId: string; questionId: string; selectedOptionId: string }
  | { type: 'listening_colour'; partId: string; colors: Record<string, string> };

export interface ExamPartResult {
  partId: string;
  partType: ExamPart['type'];
  totalGraded: number;
  correctCount: number;
  starEarned: boolean;
  itemResults: { itemId: string; correct: boolean }[];
}

export interface ExamAttemptResult {
  attemptId: string;
  levelNumber: number;
  startedAt: number;
  finishedAt: number;
  totalStars: number;
  partResults: ExamPartResult[];
  answers: ExamAnswer[];
}
