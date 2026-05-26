/**
 * D-23: Chinese (HSK1) exam — PILOT.
 *
 * Reuses the existing 4-part engine + ENGLISH scene images (drag uses the
 * starter_lN scenes; colour reuses the 3 generic outline scenes) so no new
 * AI generation is needed for the pilot. Only audio + text are Chinese.
 *
 * Level numbers are 101-120 (HSK1) so progress never collides with the
 * English 1-60 range. Audio scripts are Chinese (read by Qwen-TTS Cherry,
 * D-1). Part 2 (write) accepts hanzi AND toneless pinyin to reduce input
 * friction for beginners.
 *
 * NOTE: pilot content is intentionally uniform/template-driven. Hand-curated
 * uniqueness per level (like the English tiers) is a follow-up.
 */
import type { ExamLevel, DragNamePart, WritePart, TickPart, ColourPart } from '../../../types';
import { STARTERS_SCENE_IDS_BY_LEVEL } from '../sceneCharacters';

// Chinese kid names (hanzi) used as drag labels.
const ZH_NAMES = ['小明', '小红', '小华', '小英', '小宝', '小丽', '小刚', '小芳'];

// Drag zone layout (same 3×2 grid as the English exam).
const ZONES = [
  { id: 'zone_tl', x: 0.02, y: 0.05, width: 0.30, height: 0.45, label: 'top-left' },
  { id: 'zone_tm', x: 0.35, y: 0.05, width: 0.30, height: 0.45, label: 'top-middle' },
  { id: 'zone_tr', x: 0.68, y: 0.05, width: 0.30, height: 0.45, label: 'top-right' },
  { id: 'zone_bl', x: 0.02, y: 0.50, width: 0.30, height: 0.45, label: 'bottom-left' },
  { id: 'zone_bm', x: 0.35, y: 0.50, width: 0.30, height: 0.45, label: 'bottom-middle' },
  { id: 'zone_br', x: 0.68, y: 0.50, width: 0.30, height: 0.45, label: 'bottom-right' },
];

// The starter scenes place clothing colours in a fixed order:
// tl=red tm=blue tr=green bl=yellow bm=pink br=orange. We match by colour.
const ZH_COLORS = ['红色', '蓝色', '绿色', '黄色', '粉色']; // for zones tl,tm,tr,bl,bm

/** Part 1 — drag names onto the picture, matching by clothing colour. */
function makeZhDrag(levelNumber: number, idx: number): DragNamePart {
  const audioKey = `zh/level${levelNumber}/p1.mp3`;
  const partId = `zh_lvl${levelNumber}_p1`;
  // Reuse the English starter scene (idx 1-20) — already cached in R2.
  const sceneId = STARTERS_SCENE_IDS_BY_LEVEL[((idx - 1) % 20) + 1];

  // 1 example (tl) + 4 names (tm,tr,bl,bm). zone_br left empty (decorative).
  const pool = [
    ZH_NAMES[idx % ZH_NAMES.length],
    ZH_NAMES[(idx + 1) % ZH_NAMES.length],
    ZH_NAMES[(idx + 2) % ZH_NAMES.length],
    ZH_NAMES[(idx + 3) % ZH_NAMES.length],
    ZH_NAMES[(idx + 4) % ZH_NAMES.length],
  ];
  const exampleName = pool[0];
  const names = pool.slice(1) as string[];
  const remaining = ['zone_tm', 'zone_tr', 'zone_bl', 'zone_bm'];
  const correctMapping: Record<string, string> = {};
  names.forEach((n, i) => { correctMapping[n] = remaining[i]; });

  const lines: string[] = [
    `看图。听一听。这是例子。`,
    `穿${ZH_COLORS[0]}衣服的是${exampleName}。看到${exampleName}了吗？`,
    `现在听，写出名字。`,
  ];
  names.forEach((n, i) => {
    lines.push(`穿${ZH_COLORS[i + 1]}衣服的是${n}。`);
  });

  return {
    type: 'listening_drag_name',
    partId, audioKey,
    audioScript: lines.join(''),
    sceneId,
    dropZones: ZONES,
    exampleName,
    exampleZoneId: 'zone_tl',
    names,
    correctMapping,
  };
}

/** Part 2 — listen & write (HSK1: numbers + a name). Accepts hanzi + pinyin. */
const ZH_NUM = ['一', '二', '三', '四', '五', '六', '七', '八'];
const ZH_NUM_PINYIN = ['yi', 'er', 'san', 'si', 'wu', 'liu', 'qi', 'ba'];

function makeZhWrite(levelNumber: number, idx: number): WritePart {
  const audioKey = `zh/level${levelNumber}/p2.mp3`;
  const partId = `zh_lvl${levelNumber}_p2`;
  const sceneId = STARTERS_SCENE_IDS_BY_LEVEL[((idx - 1) % 20) + 1];
  const catN = (idx % 5) + 2;        // 2..6
  const bookN = ((idx + 2) % 5) + 2; // 2..6
  const name = ZH_NAMES[idx % ZH_NAMES.length];
  const numAns = (n: number) => [ZH_NUM[n - 1], String(n), ZH_NUM_PINYIN[n - 1]];

  return {
    type: 'listening_write', partId, audioKey,
    audioScript:
      `读问题，听一听，写出数字或名字。有两个例子。` +
      `这是谁？这是${name}。${name}。` +
      `有几本书？有${ZH_NUM[bookN - 1]}本书。${ZH_NUM[bookN - 1]}。` +
      `现在听，写出答案。` +
      `一。有几只猫？有${ZH_NUM[catN - 1]}只猫。${ZH_NUM[catN - 1]}。` +
      `二。今天几号？今天三号。三。` +
      `三。他几岁？他${ZH_NUM[(idx % 6) + 2 - 1]}岁。` +
      `四。有几个苹果？有${ZH_NUM[(idx + 1) % 5 + 2 - 1]}个。` +
      `五。现在几点？现在五点。五。`,
    sceneId,
    examples: [
      { question: '这是谁？', answer: name },
      { question: '有几本书？', answer: ZH_NUM[bookN - 1] },
    ],
    questions: [
      { questionId: 'q1', prompt: '有几只猫？', acceptedAnswers: numAns(catN) },
      { questionId: 'q2', prompt: '今天几号？', acceptedAnswers: ['三', '3', 'san'] },
      { questionId: 'q3', prompt: '他几岁？', acceptedAnswers: numAns((idx % 6) + 2) },
      { questionId: 'q4', prompt: '有几个苹果？', acceptedAnswers: numAns(((idx + 1) % 5) + 2) },
      { questionId: 'q5', prompt: '现在几点？', acceptedAnswers: ['五', '5', 'wu', '五点'] },
    ],
  };
}

/** Part 3 — listen & tick (HSK1 vocab, reuses existing icons). */
function makeZhTick(levelNumber: number): TickPart {
  const audioKey = `zh/level${levelNumber}/p3.mp3`;
  const partId = `zh_lvl${levelNumber}_p3`;
  // Rotate a few HSK1 question sets built from existing icons.
  return {
    type: 'listening_tick', partId, audioKey,
    audioScript:
      `听一听，选一选。有一个例子。哪个是猫？这是猫。` +
      `现在听，有五个问题。` +
      `一。哪个是狗？二。哪个是鱼？三。哪个是苹果？四。哪个是书？五。有几个？三个。`,
    example: {
      questionId: 'ex', prompt: '哪个是猫？',
      options: [{ id: 'A', iconId: 'cat' }, { id: 'B', iconId: 'dog' }, { id: 'C', iconId: 'fish' }],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: '哪个是狗？', options: [{ id: 'A', iconId: 'cat' }, { id: 'B', iconId: 'dog' }, { id: 'C', iconId: 'rabbit' }], correctOptionId: 'B' },
      { questionId: 'q2', prompt: '哪个是鱼？', options: [{ id: 'A', iconId: 'bird' }, { id: 'B', iconId: 'fish' }, { id: 'C', iconId: 'cat' }], correctOptionId: 'B' },
      { questionId: 'q3', prompt: '哪个是苹果？', options: [{ id: 'A', iconId: 'apple' }, { id: 'B', iconId: 'banana' }, { id: 'C', iconId: 'orange' }], correctOptionId: 'A' },
      { questionId: 'q4', prompt: '哪个是书？', options: [{ id: 'A', iconId: 'ball' }, { id: 'B', iconId: 'book' }, { id: 'C', iconId: 'pen' }], correctOptionId: 'B' },
      { questionId: 'q5', prompt: '有几个？', options: [{ id: 'A', iconId: 'count_2' }, { id: 'B', iconId: 'count_3' }, { id: 'C', iconId: 'count_4' }], correctOptionId: 'B' },
    ],
  };
}

/** Part 4 — listen & colour. Reuses the 3 generic outline scenes (cached). */
const ZH_OUTLINES = [
  { sceneId: 'garden_objects_outline', ex: { id: 'ball', label: '球', color: 'red', x: 0.45, y: 0.62, width: 0.10, height: 0.18 },
    regions: [
      { id: 'bike', label: '自行车', color: 'blue', x: 0.21, y: 0.50, width: 0.20, height: 0.36 },
      { id: 'cat', label: '猫', color: 'orange', x: 0.10, y: 0.74, width: 0.20, height: 0.22 },
      { id: 'dog', label: '狗', color: 'brown', x: 0.70, y: 0.75, width: 0.20, height: 0.20 },
      { id: 'yarn', label: '毛线', color: 'purple', x: 0.04, y: 0.86, width: 0.10, height: 0.12 },
      { id: 'tree', label: '树', color: 'green', x: 0.04, y: 0.20, width: 0.16, height: 0.50 },
    ] },
  { sceneId: 'farm_outline', ex: { id: 'cow', label: '牛', color: 'brown', x: 0.10, y: 0.55, width: 0.20, height: 0.30 },
    regions: [
      { id: 'pig', label: '猪', color: 'pink', x: 0.30, y: 0.65, width: 0.18, height: 0.25 },
      { id: 'chicken', label: '鸡', color: 'yellow', x: 0.50, y: 0.70, width: 0.12, height: 0.22 },
      { id: 'barn', label: '谷仓', color: 'red', x: 0.10, y: 0.30, width: 0.30, height: 0.45 },
      { id: 'tree', label: '树', color: 'green', x: 0.65, y: 0.20, width: 0.18, height: 0.55 },
      { id: 'sun', label: '太阳', color: 'orange', x: 0.80, y: 0.05, width: 0.15, height: 0.20 },
    ] },
  { sceneId: 'bedroom_outline', ex: { id: 'bed', label: '床', color: 'pink', x: 0.05, y: 0.65, width: 0.25, height: 0.25 },
    regions: [
      { id: 'teddy', label: '玩具熊', color: 'brown', x: 0.05, y: 0.30, width: 0.18, height: 0.35 },
      { id: 'lamp', label: '灯', color: 'yellow', x: 0.28, y: 0.10, width: 0.14, height: 0.30 },
      { id: 'books', label: '书', color: 'blue', x: 0.46, y: 0.40, width: 0.18, height: 0.25 },
      { id: 'window', label: '窗户', color: 'green', x: 0.66, y: 0.10, width: 0.20, height: 0.40 },
      { id: 'toybox', label: '玩具箱', color: 'red', x: 0.30, y: 0.65, width: 0.30, height: 0.30 },
    ] },
];
const ZH_COLOR_WORD: Record<string, string> = {
  red: '红色', blue: '蓝色', green: '绿色', yellow: '黄色', pink: '粉色',
  purple: '紫色', orange: '橙色', brown: '棕色', black: '黑色', grey: '灰色',
};

function makeZhColour(levelNumber: number, idx: number): ColourPart {
  const audioKey = `zh/level${levelNumber}/p4.mp3`;
  const partId = `zh_lvl${levelNumber}_p4`;
  const o = ZH_OUTLINES[idx % ZH_OUTLINES.length];
  const lines = [`听一听，涂颜色。有一个例子。把${o.ex.label}涂成${ZH_COLOR_WORD[o.ex.color]}。现在听，涂颜色。`];
  for (const r of o.regions) lines.push(`把${r.label}涂成${ZH_COLOR_WORD[r.color]}。`);
  const correctColors: Record<string, string> = {};
  for (const r of o.regions) correctColors[r.id] = r.color;
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: lines.join(''),
    sceneId: o.sceneId,
    example: { regionId: o.ex.id, color: o.ex.color, x: o.ex.x, y: o.ex.y, width: o.ex.width, height: o.ex.height },
    regions: o.regions.map((r) => ({ id: r.id, label: r.label, x: r.x, y: r.y, width: r.width, height: r.height })),
    correctColors,
    palette: ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown', 'black', 'grey'],
  };
}

function makeZhLevel(idx: number): ExamLevel {
  const levelNumber = 100 + idx; // 101..120
  return {
    levelNumber,
    difficulty: 'starters', // engine difficulty hint (time limit); HSK1 ≈ easy
    title: `HSK 1 · ${idx}`,
    description: 'Bài thi nghe tiếng Trung HSK1 — nghe, ghép tên, viết, chọn, tô màu.',
    timeLimitSec: 30 * 60,
    parts: [
      makeZhDrag(levelNumber, idx),
      makeZhWrite(levelNumber, idx),
      makeZhTick(levelNumber),
      makeZhColour(levelNumber, idx),
    ],
  };
}

/** HSK1 pilot: 20 levels (101-120). */
export const allLevelsZh: ExamLevel[] = Array.from({ length: 20 }, (_, i) => makeZhLevel(i + 1));

export function getLevelZh(levelNumber: number): ExamLevel | undefined {
  return allLevelsZh.find((l) => l.levelNumber === levelNumber);
}
