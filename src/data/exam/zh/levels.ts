/**
 * D-23: Chinese (HSK1) exam.
 *
 * Levels 101-120 (no collision with the English 1-60 range). Audio is Chinese,
 * read by Qwen-TTS Cherry (D-1); Part 2 accepts hanzi AND toneless pinyin.
 *
 * L101-L105 are HAND-CURATED unique per level (like the English Starters):
 * each has its own theme, Chinese scene image, vocabulary and questions —
 * driven by ZH_LEVEL_DEFS below. L106-L120 still use the original uniform
 * template (reusing English scenes) until later batches curate them.
 *
 * Theme roadmap (HSK1 syllabus, progressive):
 *   101 数字 & 公园 · 102 家庭 & 家 · 103 颜色 & 衣服 · 104 动物 · 105 食物
 *   106-120: 学校/时间/地点/天气/动词/职业… (template fallback for now)
 */
import type { ExamLevel, DragNamePart, WritePart, TickPart, ColourPart } from '../../../types';
import type { IconId } from '../examIcons';
import { STARTERS_SCENE_IDS_BY_LEVEL } from '../sceneCharacters';

// ─── Shared constants ─────────────────────────────────────────────────────

// Drag zone layout (same 3×2 grid as the English exam).
const ZONES = [
  { id: 'zone_tl', x: 0.02, y: 0.05, width: 0.30, height: 0.45, label: 'top-left' },
  { id: 'zone_tm', x: 0.35, y: 0.05, width: 0.30, height: 0.45, label: 'top-middle' },
  { id: 'zone_tr', x: 0.68, y: 0.05, width: 0.30, height: 0.45, label: 'top-right' },
  { id: 'zone_bl', x: 0.02, y: 0.50, width: 0.30, height: 0.45, label: 'bottom-left' },
  { id: 'zone_bm', x: 0.35, y: 0.50, width: 0.30, height: 0.45, label: 'bottom-middle' },
  { id: 'zone_br', x: 0.68, y: 0.50, width: 0.30, height: 0.45, label: 'bottom-right' },
];

// Curated levels narrate the 5 used zones by clothing colour (tl is the
// example), matching the scene-image colours top→bottom, left→right.
const ZONE_ORDER = ['zone_tl', 'zone_tm', 'zone_tr', 'zone_bl', 'zone_bm'];
const ZONE_COLOR_WORD = ['红色', '蓝色', '绿色', '黄色', '粉色'];

const ZH_NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const ZH_NUM_PINYIN = ['yi', 'er', 'san', 'si', 'wu', 'liu', 'qi', 'ba', 'jiu', 'shi'];
/** All accepted forms of a number answer: hanzi + digit + toneless pinyin. */
const numAns = (n: number) => [ZH_NUM[n - 1], String(n), ZH_NUM_PINYIN[n - 1]];

const ZH_COLOR_WORD: Record<string, string> = {
  red: '红色', blue: '蓝色', green: '绿色', yellow: '黄色', pink: '粉色',
  purple: '紫色', orange: '橙色', brown: '棕色', black: '黑色', grey: '灰色',
};
const COLOUR_PALETTE = ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown', 'black', 'grey'];

// Six positions for colour-part outline objects (slot 0 = example).
const COLOUR_SLOTS = [
  { x: 0.06, y: 0.14, width: 0.20, height: 0.30 },
  { x: 0.40, y: 0.10, width: 0.20, height: 0.32 },
  { x: 0.74, y: 0.14, width: 0.20, height: 0.30 },
  { x: 0.06, y: 0.58, width: 0.20, height: 0.32 },
  { x: 0.40, y: 0.58, width: 0.20, height: 0.32 },
  { x: 0.74, y: 0.58, width: 0.20, height: 0.30 },
];

const OPT_IDS = ['A', 'B', 'C'];

// ─── Per-level definition shape ─────────────────────────────────────────────

interface ZhTickDef {
  /** Spoken Chinese question, ends with ？ */
  prompt: string;
  /** Three picture options (existing iconIds). */
  icons: [IconId, IconId, IconId];
  /** Index (0-2) of the correct option. */
  correct: number;
}
interface ZhWriteQDef {
  /** Spoken question, ends with ？ */
  prompt: string;
  /** Spoken answer sentence read after the question, e.g. "有三只猫。" */
  say: string;
  /** Accepted typed answers. */
  accepted: string[];
}
interface ZhColourObj {
  label: string;
  color: string;
}
interface ZhLevelDef {
  /** Short Chinese theme label for the level title. */
  theme: string;
  dragSceneId: string;
  /** Names for the 5 narrated zones (tl example, then tm,tr,bl,bm). */
  dragNames: [string, string, string, string, string];
  write: {
    examples: { q: string; say: string; a: string }[];
    questions: ZhWriteQDef[];
  };
  tick: { example: ZhTickDef; questions: ZhTickDef[] };
  colourSceneId: string;
  colour: { example: ZhColourObj; regions: ZhColourObj[] };
}

// ─── Part builders (curated, def-driven) ────────────────────────────────────

function zhDrag(levelNumber: number, def: ZhLevelDef): DragNamePart {
  const [exName, ...names] = def.dragNames;
  const correctMapping: Record<string, string> = {};
  names.forEach((n, i) => { correctMapping[n] = ZONE_ORDER[i + 1]; });

  const frames = [
    (c: string, n: string) => `穿${c}衣服的是${n}。`,
    (c: string, n: string) => `${n}穿着${c}衣服。`,
    (c: string, n: string) => `看，穿${c}衣服的那个是${n}。`,
  ];
  const lines = [
    `看图，听一听。有一个例子。`,
    `穿${ZONE_COLOR_WORD[0]}衣服的是${exName}。看到${exName}了吗？`,
    `现在听，写出名字。`,
    ...names.map((n, i) => frames[i % frames.length](ZONE_COLOR_WORD[i + 1], n)),
  ];

  return {
    type: 'listening_drag_name',
    partId: `zh_lvl${levelNumber}_p1`,
    audioKey: `zh/level${levelNumber}/p1.mp3`,
    audioScript: lines.join(''),
    sceneId: def.dragSceneId,
    dropZones: ZONES,
    exampleName: exName,
    exampleZoneId: 'zone_tl',
    names,
    correctMapping,
  };
}

function zhWrite(levelNumber: number, def: ZhLevelDef): WritePart {
  const { examples, questions } = def.write;
  const exLines = examples.map((e) => `${e.q}${e.say}`).join('');
  const qLines = questions.map((q, i) => `${ZH_NUM[i]}。${q.prompt}${q.say}`).join('');
  return {
    type: 'listening_write',
    partId: `zh_lvl${levelNumber}_p2`,
    audioKey: `zh/level${levelNumber}/p2.mp3`,
    audioScript:
      `读问题，听一听，写出数字或名字。有两个例子。` +
      exLines +
      `现在听，写出答案。` +
      qLines,
    sceneId: def.dragSceneId,
    examples: examples.map((e) => ({ question: e.q, answer: e.a })),
    questions: questions.map((q, i) => ({
      questionId: `q${i + 1}`,
      prompt: q.prompt,
      acceptedAnswers: q.accepted,
    })),
  };
}

function makeTickItem(questionId: string, def: ZhTickDef) {
  return {
    questionId,
    prompt: def.prompt,
    options: def.icons.map((ic, i) => ({ id: OPT_IDS[i], iconId: ic })),
    correctOptionId: OPT_IDS[def.correct],
  };
}

function zhTick(levelNumber: number, def: ZhLevelDef): TickPart {
  const qLines = def.tick.questions.map((q, i) => `${ZH_NUM[i]}。${q.prompt}`).join('');
  return {
    type: 'listening_tick',
    partId: `zh_lvl${levelNumber}_p3`,
    audioKey: `zh/level${levelNumber}/p3.mp3`,
    audioScript:
      `听一听，选一选。有一个例子。${def.tick.example.prompt}` +
      `现在听。` +
      qLines,
    example: makeTickItem('ex', def.tick.example),
    questions: def.tick.questions.map((q, i) => makeTickItem(`q${i + 1}`, q)),
  };
}

function zhColour(levelNumber: number, def: ZhLevelDef): ColourPart {
  const ex = def.colour.example;
  const regions = def.colour.regions.slice(0, 5);
  const exSlot = COLOUR_SLOTS[0];
  const correctColors: Record<string, string> = {};
  const lines = [
    `听一听，涂颜色。有一个例子。把${ex.label}涂成${ZH_COLOR_WORD[ex.color]}。现在听，涂颜色。`,
  ];
  const regionObjs = regions.map((r, i) => {
    const id = `obj_${i + 1}`;
    correctColors[id] = r.color;
    lines.push(`把${r.label}涂成${ZH_COLOR_WORD[r.color]}。`);
    const slot = COLOUR_SLOTS[i + 1];
    return { id, label: r.label, x: slot.x, y: slot.y, width: slot.width, height: slot.height };
  });
  return {
    type: 'listening_colour',
    partId: `zh_lvl${levelNumber}_p4`,
    audioKey: `zh/level${levelNumber}/p4.mp3`,
    audioScript: lines.join(''),
    sceneId: def.colourSceneId,
    example: { regionId: 'obj_ex', color: ex.color, x: exSlot.x, y: exSlot.y, width: exSlot.width, height: exSlot.height },
    regions: regionObjs,
    correctColors,
    palette: COLOUR_PALETTE,
  };
}

// ─── Curated level definitions (L101-L105) ──────────────────────────────────

const ZH_LEVEL_DEFS: Record<number, ZhLevelDef> = {
  // L101 — 数字 & 公园 (numbers & park)
  101: {
    theme: '数字·公园',
    dragSceneId: 'zh_hsk1_l101_park',
    dragNames: ['小明', '小红', '小华', '小英', '小丽'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小明。', a: '小明' },
        { q: '有几本书？', say: '有三本书。', a: '三' },
      ],
      questions: [
        { prompt: '有几只猫？', say: '有三只猫。', accepted: numAns(3) },
        { prompt: '有几个苹果？', say: '有五个苹果。', accepted: numAns(5) },
        { prompt: '他几岁？', say: '他六岁。', accepted: numAns(6) },
        { prompt: '有几只狗？', say: '有两只狗。', accepted: [...numAns(2), '两'] },
        { prompt: '现在几点？', say: '现在四点。', accepted: [...numAns(4), '四点'] },
      ],
    },
    tick: {
      example: { prompt: '哪个是猫？', icons: ['cat', 'dog', 'fish'], correct: 0 },
      questions: [
        { prompt: '哪个是狗？', icons: ['cat', 'dog', 'rabbit'], correct: 1 },
        { prompt: '哪个是鸟？', icons: ['bird', 'fish', 'cat'], correct: 0 },
        { prompt: '哪个是鱼？', icons: ['dog', 'cat', 'fish'], correct: 2 },
        { prompt: '哪个是兔子？', icons: ['rabbit', 'bird', 'dog'], correct: 0 },
        { prompt: '有几个苹果？', icons: ['count_2', 'count_3', 'count_4'], correct: 1 },
      ],
    },
    colourSceneId: 'zh_hsk1_l101_park_outline',
    colour: {
      example: { label: '球', color: 'red' },
      regions: [
        { label: '树', color: 'green' },
        { label: '猫', color: 'orange' },
        { label: '鸟', color: 'blue' },
        { label: '自行车', color: 'purple' },
        { label: '花', color: 'pink' },
      ],
    },
  },

  // L102 — 家庭 & 家 (family & home)
  102: {
    theme: '家庭·家',
    dragSceneId: 'zh_hsk1_l102_home',
    dragNames: ['小芳', '小刚', '小明', '小红', '小华'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小芳。', a: '小芳' },
        { q: '有几张桌子？', say: '有两张桌子。', a: '二' },
      ],
      questions: [
        { prompt: '有几把椅子？', say: '有四把椅子。', accepted: numAns(4) },
        { prompt: '有几个人？', say: '有五个人。', accepted: numAns(5) },
        { prompt: '有几本书？', say: '有三本书。', accepted: numAns(3) },
        { prompt: '他几岁？', say: '他七岁。', accepted: numAns(7) },
        { prompt: '现在几点？', say: '现在八点。', accepted: [...numAns(8), '八点'] },
      ],
    },
    tick: {
      example: { prompt: '哪个是床？', icons: ['bed', 'chair', 'lamp'], correct: 0 },
      questions: [
        { prompt: '哪个是椅子？', icons: ['lamp', 'chair', 'bed'], correct: 1 },
        { prompt: '哪个是灯？', icons: ['lamp', 'tv', 'book'], correct: 0 },
        { prompt: '哪个是电视？', icons: ['book', 'laptop', 'tv'], correct: 2 },
        { prompt: '哪个是书？', icons: ['book', 'ball', 'pen'], correct: 0 },
        { prompt: '哪个是玩具熊？', icons: ['cat', 'teddy', 'dog'], correct: 1 },
      ],
    },
    colourSceneId: 'zh_hsk1_l102_home_outline',
    colour: {
      example: { label: '床', color: 'pink' },
      regions: [
        { label: '椅子', color: 'blue' },
        { label: '桌子', color: 'brown' },
        { label: '灯', color: 'yellow' },
        { label: '玩具熊', color: 'orange' },
        { label: '窗户', color: 'green' },
      ],
    },
  },

  // L103 — 颜色 & 衣服 (colours & clothes)
  103: {
    theme: '颜色·衣服',
    dragSceneId: 'zh_hsk1_l103_clothes',
    dragNames: ['小英', '小丽', '小宝', '小明', '小红'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小英。', a: '小英' },
        { q: '有几顶帽子？', say: '有两顶帽子。', a: '二' },
      ],
      questions: [
        { prompt: '有几件衣服？', say: '有三件衣服。', accepted: numAns(3) },
        { prompt: '有几条裙子？', say: '有两条裙子。', accepted: [...numAns(2), '两'] },
        { prompt: '她几岁？', say: '她六岁。', accepted: numAns(6) },
        { prompt: '有几个人？', say: '有五个人。', accepted: numAns(5) },
        { prompt: '现在几点？', say: '现在三点。', accepted: [...numAns(3), '三点'] },
      ],
    },
    tick: {
      example: { prompt: '哪个是红色的衣服？', icons: ['shirt_red', 'shirt_blue', 'kite'], correct: 0 },
      questions: [
        { prompt: '哪个是蓝色的衣服？', icons: ['shirt_red', 'shirt_blue', 'ball'], correct: 1 },
        { prompt: '哪个是红色的伞？', icons: ['umbrella_green', 'umbrella_red', 'kite'], correct: 1 },
        { prompt: '哪个是绿色的伞？', icons: ['umbrella_green', 'shirt_blue', 'umbrella_red'], correct: 0 },
        { prompt: '哪个是风筝？', icons: ['ball', 'kite', 'book'], correct: 1 },
        { prompt: '哪个是球？', icons: ['ball', 'pen', 'kite'], correct: 0 },
      ],
    },
    colourSceneId: 'zh_hsk1_l103_clothes_outline',
    colour: {
      example: { label: '衣服', color: 'red' },
      regions: [
        { label: '帽子', color: 'blue' },
        { label: '裙子', color: 'pink' },
        { label: '伞', color: 'green' },
        { label: '包', color: 'yellow' },
        { label: '鞋', color: 'brown' },
      ],
    },
  },

  // L104 — 动物 (animals)
  104: {
    theme: '动物',
    dragSceneId: 'zh_hsk1_l104_animals',
    dragNames: ['小华', '小明', '小红', '小英', '小丽'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小华。', a: '小华' },
        { q: '有几只猫？', say: '有两只猫。', a: '二' },
      ],
      questions: [
        { prompt: '有几只狗？', say: '有三只狗。', accepted: numAns(3) },
        { prompt: '有几只鸟？', say: '有四只鸟。', accepted: numAns(4) },
        { prompt: '有几只鱼？', say: '有五只鱼。', accepted: numAns(5) },
        { prompt: '有几只兔子？', say: '有两只兔子。', accepted: [...numAns(2), '两'] },
        { prompt: '它几岁？', say: '它六岁。', accepted: numAns(6) },
      ],
    },
    tick: {
      example: { prompt: '哪个是猫？', icons: ['cat', 'dog', 'bird'], correct: 0 },
      questions: [
        { prompt: '哪个是狗？', icons: ['cat', 'dog', 'rabbit'], correct: 1 },
        { prompt: '哪个是鱼？', icons: ['bird', 'fish', 'cat'], correct: 1 },
        { prompt: '哪个是鸟？', icons: ['bird', 'fish', 'rabbit'], correct: 0 },
        { prompt: '哪个是兔子？', icons: ['dog', 'bird', 'rabbit'], correct: 2 },
        { prompt: '有几只狗？', icons: ['count_2', 'count_3', 'count_4'], correct: 0 },
      ],
    },
    colourSceneId: 'zh_hsk1_l104_animals_outline',
    colour: {
      example: { label: '猫', color: 'orange' },
      regions: [
        { label: '狗', color: 'brown' },
        { label: '鱼', color: 'blue' },
        { label: '鸟', color: 'yellow' },
        { label: '兔子', color: 'pink' },
        { label: '树', color: 'green' },
      ],
    },
  },

  // L105 — 食物 (food)
  105: {
    theme: '食物',
    dragSceneId: 'zh_hsk1_l105_food',
    dragNames: ['小红', '小明', '小丽', '小华', '小英'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小红。', a: '小红' },
        { q: '有几个苹果？', say: '有三个苹果。', a: '三' },
      ],
      questions: [
        { prompt: '有几个面包？', say: '有四个面包。', accepted: numAns(4) },
        { prompt: '有几块蛋糕？', say: '有两块蛋糕。', accepted: [...numAns(2), '两'] },
        { prompt: '有几个橙子？', say: '有五个橙子。', accepted: numAns(5) },
        { prompt: '他几岁？', say: '他七岁。', accepted: numAns(7) },
        { prompt: '现在几点？', say: '现在六点。', accepted: [...numAns(6), '六点'] },
      ],
    },
    tick: {
      example: { prompt: '哪个是苹果？', icons: ['apple', 'banana', 'orange'], correct: 0 },
      questions: [
        { prompt: '哪个是香蕉？', icons: ['banana', 'apple', 'orange'], correct: 0 },
        { prompt: '哪个是橙子？', icons: ['apple', 'orange', 'banana'], correct: 1 },
        { prompt: '哪个是蛋糕？', icons: ['bread', 'cake', 'pizza'], correct: 1 },
        { prompt: '哪个是面包？', icons: ['bread', 'cake', 'sandwich'], correct: 0 },
        { prompt: '哪个是冰淇淋？', icons: ['cake', 'ice_cream', 'pizza'], correct: 1 },
      ],
    },
    colourSceneId: 'zh_hsk1_l105_food_outline',
    colour: {
      example: { label: '苹果', color: 'red' },
      regions: [
        { label: '香蕉', color: 'yellow' },
        { label: '蛋糕', color: 'pink' },
        { label: '面包', color: 'brown' },
        { label: '橙子', color: 'orange' },
        { label: '葡萄', color: 'purple' },
      ],
    },
  },
};

// ─── Template fallback (L106-L120, not yet curated) ─────────────────────────

const ZH_NAMES = ['小明', '小红', '小华', '小英', '小宝', '小丽', '小刚', '小芳'];
const ZH_COLORS = ['红色', '蓝色', '绿色', '黄色', '粉色'];

function tmplDrag(levelNumber: number, idx: number): DragNamePart {
  const sceneId = STARTERS_SCENE_IDS_BY_LEVEL[((idx - 1) % 20) + 1];
  const pool = [0, 1, 2, 3, 4].map((k) => ZH_NAMES[(idx + k) % ZH_NAMES.length]);
  const exampleName = pool[0];
  const names = pool.slice(1);
  const remaining = ['zone_tm', 'zone_tr', 'zone_bl', 'zone_bm'];
  const correctMapping: Record<string, string> = {};
  names.forEach((n, i) => { correctMapping[n] = remaining[i]; });
  const lines = [
    `看图。听一听。这是例子。`,
    `穿${ZH_COLORS[0]}衣服的是${exampleName}。看到${exampleName}了吗？`,
    `现在听，写出名字。`,
    ...names.map((n, i) => `穿${ZH_COLORS[i + 1]}衣服的是${n}。`),
  ];
  return {
    type: 'listening_drag_name', partId: `zh_lvl${levelNumber}_p1`,
    audioKey: `zh/level${levelNumber}/p1.mp3`, audioScript: lines.join(''),
    sceneId, dropZones: ZONES, exampleName, exampleZoneId: 'zone_tl', names, correctMapping,
  };
}

function tmplWrite(levelNumber: number, idx: number): WritePart {
  const sceneId = STARTERS_SCENE_IDS_BY_LEVEL[((idx - 1) % 20) + 1];
  const catN = (idx % 5) + 2;
  const bookN = ((idx + 2) % 5) + 2;
  const name = ZH_NAMES[idx % ZH_NAMES.length];
  return {
    type: 'listening_write', partId: `zh_lvl${levelNumber}_p2`,
    audioKey: `zh/level${levelNumber}/p2.mp3`,
    audioScript:
      `读问题，听一听，写出数字或名字。有两个例子。这是谁？这是${name}。` +
      `有几本书？有${ZH_NUM[bookN - 1]}本书。现在听，写出答案。` +
      `一。有几只猫？有${ZH_NUM[catN - 1]}只猫。二。今天几号？今天三号。` +
      `三。他几岁？他${ZH_NUM[(idx % 6) + 1]}岁。四。有几个苹果？有${ZH_NUM[(idx + 1) % 5 + 1]}个。五。现在几点？现在五点。`,
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

function tmplTick(levelNumber: number): TickPart {
  return {
    type: 'listening_tick', partId: `zh_lvl${levelNumber}_p3`,
    audioKey: `zh/level${levelNumber}/p3.mp3`,
    audioScript:
      `听一听，选一选。有一个例子。哪个是猫？现在听。` +
      `一。哪个是狗？二。哪个是鱼？三。哪个是苹果？四。哪个是书？五。有几个？`,
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

function tmplColour(levelNumber: number, idx: number): ColourPart {
  const o = ZH_OUTLINES[idx % ZH_OUTLINES.length];
  const lines = [`听一听，涂颜色。有一个例子。把${o.ex.label}涂成${ZH_COLOR_WORD[o.ex.color]}。现在听，涂颜色。`];
  for (const r of o.regions) lines.push(`把${r.label}涂成${ZH_COLOR_WORD[r.color]}。`);
  const correctColors: Record<string, string> = {};
  for (const r of o.regions) correctColors[r.id] = r.color;
  return {
    type: 'listening_colour', partId: `zh_lvl${levelNumber}_p4`,
    audioKey: `zh/level${levelNumber}/p4.mp3`, audioScript: lines.join(''),
    sceneId: o.sceneId,
    example: { regionId: o.ex.id, color: o.ex.color, x: o.ex.x, y: o.ex.y, width: o.ex.width, height: o.ex.height },
    regions: o.regions.map((r) => ({ id: r.id, label: r.label, x: r.x, y: r.y, width: r.width, height: r.height })),
    correctColors,
    palette: COLOUR_PALETTE,
  };
}

// ─── Level assembly ─────────────────────────────────────────────────────────

function makeZhLevel(idx: number): ExamLevel {
  const levelNumber = 100 + idx; // 101..120
  const def = ZH_LEVEL_DEFS[levelNumber];
  const parts: ExamLevel['parts'] = def
    ? [zhDrag(levelNumber, def), zhWrite(levelNumber, def), zhTick(levelNumber, def), zhColour(levelNumber, def)]
    : [tmplDrag(levelNumber, idx), tmplWrite(levelNumber, idx), tmplTick(levelNumber), tmplColour(levelNumber, idx)];
  return {
    levelNumber,
    difficulty: 'starters', // engine difficulty hint (time limit); HSK1 ≈ easy
    title: def ? `HSK 1 · ${idx} — ${def.theme}` : `HSK 1 · ${idx}`,
    description: 'Bài thi nghe tiếng Trung HSK1 — nghe, ghép tên, viết, chọn, tô màu.',
    timeLimitSec: 30 * 60,
    parts,
  };
}

/** HSK1: 20 levels (101-120). L101-105 curated, L106-120 template. */
export const allLevelsZh: ExamLevel[] = Array.from({ length: 20 }, (_, i) => makeZhLevel(i + 1));

export function getLevelZh(levelNumber: number): ExamLevel | undefined {
  return allLevelsZh.find((l) => l.levelNumber === levelNumber);
}
