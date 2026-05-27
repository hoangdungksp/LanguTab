/**
 * D-23: Chinese (HSK) exam.
 *
 * Levels 101+ (display as 1-60; no collision with the English 1-60 range).
 * HSK1 = 101-120 (4-part), HSK2 = 121-140 (5-part with a Matching part, like
 * Movers), HSK3 = 141-160. Audio is Chinese, read by Qwen-TTS Cherry (D-1);
 * Part 2 accepts hanzi AND toneless pinyin.
 *
 * ALL 20 levels (L101-L120) are HAND-CURATED unique per level (like the
 * English Starters): each has its own theme, Chinese scene image, vocabulary
 * and questions — driven by ZH_LEVEL_DEFS below. (The template fallback
 * functions remain only as a safety net for any future uncurated level.)
 *
 * Theme roadmap (HSK1 syllabus, progressive):
 *   101 数字·公园 · 102 家庭·家 · 103 颜色·衣服 · 104 动物 · 105 食物
 *   106 学校 · 107 数字·年龄 · 108 时间 · 109 家里物品 · 110 吃喝
 *   111 交通 · 112 玩具 · 113 动物园 · 114 野餐 · 115 购物
 *   116 复习·校园 · 117 复习·房间 · 118 复习·市场 · 119 复习·周末 · 120 复习·联欢会
 */
import type { ExamLevel, DragNamePart, WritePart, TickPart, ColourPart, MatchPart } from '../../../types';
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
/** One match row: a person + the picture (icon) the audio links them to. */
interface ZhMatchObj {
  name: string;
  iconId: IconId;
  /** Spoken Chinese clue, e.g. "小明踢了足球。" */
  say: string;
}
interface ZhMatchDef {
  example: ZhMatchObj;
  items: ZhMatchObj[]; // 5
  distractors: IconId[];
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
  /** HSK2+ only: a Matching part (Part 3) → makes the level 5-part. */
  match?: ZhMatchDef;
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

function zhTick(levelNumber: number, def: ZhLevelDef, pos = 3): TickPart {
  const qLines = def.tick.questions.map((q, i) => `${ZH_NUM[i]}。${q.prompt}`).join('');
  return {
    type: 'listening_tick',
    partId: `zh_lvl${levelNumber}_p${pos}`,
    audioKey: `zh/level${levelNumber}/p${pos}.mp3`,
    audioScript:
      `听一听，选一选。有一个例子。${def.tick.example.prompt}` +
      `现在听。` +
      qLines,
    example: makeTickItem('ex', def.tick.example),
    questions: def.tick.questions.map((q, i) => makeTickItem(`q${i + 1}`, q)),
  };
}

function zhColour(levelNumber: number, def: ZhLevelDef, pos = 4): ColourPart {
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
    partId: `zh_lvl${levelNumber}_p${pos}`,
    audioKey: `zh/level${levelNumber}/p${pos}.mp3`,
    audioScript: lines.join(''),
    sceneId: def.colourSceneId,
    example: { regionId: 'obj_ex', color: ex.color, x: exSlot.x, y: exSlot.y, width: exSlot.width, height: exSlot.height },
    regions: regionObjs,
    correctColors,
    palette: COLOUR_PALETTE,
  };
}

const MATCH_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

/** Deterministic Fisher–Yates shuffle (mulberry32) so picture order is stable
 *  per level but NOT in answer order. */
function zhSeededShuffle<T>(arr: T[], seed: number): T[] {
  let a = seed >>> 0;
  const rand = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Part 3 (HSK2+) — listen & draw a line from each name to the right picture. */
function zhMatch(levelNumber: number, def: ZhMatchDef, pos = 3): MatchPart {
  const idOf = (name: string) => name; // Chinese names are unique enough as ids
  const iconPool = [def.example.iconId, ...def.items.map((it) => it.iconId), ...def.distractors];
  const shuffled = zhSeededShuffle([...new Set(iconPool)], levelNumber * 101 + 17);
  const options = shuffled.map((iconId, i) => ({ letter: MATCH_LETTERS[i], iconId }));
  const iconToLetter = new Map(options.map((o) => [o.iconId, o.letter]));
  const correctMapping: Record<string, string> = {};
  for (const it of def.items) correctMapping[idOf(it.name)] = iconToLetter.get(it.iconId)!;
  return {
    type: 'listening_match',
    partId: `zh_lvl${levelNumber}_p${pos}`,
    audioKey: `zh/level${levelNumber}/p${pos}.mp3`,
    audioScript:
      `听一听，连线。有一个例子。${def.example.say}` +
      `现在听，把名字和图片连起来。` +
      def.items.map((it) => it.say).join(''),
    exampleItem: { id: `ex_${def.example.name}`, label: def.example.name },
    exampleLetter: iconToLetter.get(def.example.iconId)!,
    items: def.items.map((it) => ({ id: idOf(it.name), label: it.name })),
    options,
    correctMapping,
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
  // L106 — 学校 (school)
  106: {
    theme: '学校',
    dragSceneId: 'zh_hsk1_l106_school',
    dragNames: ['小明', '小红', '小华', '小英', '小刚'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小明。', a: '小明' },
        { q: '有几本书？', say: '有四本书。', a: '四' },
      ],
      questions: [
        { prompt: '有几支笔？', say: '有三支笔。', accepted: numAns(3) },
        { prompt: '有几个学生？', say: '有五个学生。', accepted: numAns(5) },
        { prompt: '有几把椅子？', say: '有六把椅子。', accepted: numAns(6) },
        { prompt: '老师叫什么？', say: '老师叫小红。', accepted: ['小红', 'xiaohong'] },
        { prompt: '现在几点？', say: '现在八点。', accepted: [...numAns(8), '八点'] },
      ],
    },
    tick: {
      example: { prompt: '哪个是书？', icons: ['book', 'pen', 'bag_red'], correct: 0 },
      questions: [
        { prompt: '哪个是笔？', icons: ['ball', 'pen', 'book'], correct: 1 },
        { prompt: '哪个是书包？', icons: ['bag_red', 'book', 'chair'], correct: 0 },
        { prompt: '哪个是椅子？', icons: ['lamp', 'chair', 'bed'], correct: 1 },
        { prompt: '哪个是球？', icons: ['pen', 'book', 'ball'], correct: 2 },
        { prompt: '有几本书？', icons: ['count_2', 'count_3', 'count_4'], correct: 1 },
      ],
    },
    colourSceneId: 'zh_hsk1_l106_school_outline',
    colour: {
      example: { label: '书', color: 'red' },
      regions: [
        { label: '笔', color: 'blue' },
        { label: '椅子', color: 'brown' },
        { label: '球', color: 'green' },
        { label: '书包', color: 'yellow' },
        { label: '钟', color: 'black' },
      ],
    },
  },
  // L107 — 数字与年龄 (numbers & age)
  107: {
    theme: '数字·年龄',
    dragSceneId: 'zh_hsk1_l107_birthday',
    dragNames: ['小丽', '小华', '小明', '小红', '小英'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小丽。', a: '小丽' },
        { q: '她几岁？', say: '她七岁。', a: '七' },
      ],
      questions: [
        { prompt: '他几岁？', say: '他八岁。', accepted: numAns(8) },
        { prompt: '有几个蛋糕？', say: '有两个蛋糕。', accepted: [...numAns(2), '两'] },
        { prompt: '有几个气球？', say: '有九个气球。', accepted: numAns(9) },
        { prompt: '有几个朋友？', say: '有六个朋友。', accepted: numAns(6) },
        { prompt: '有几只猫？', say: '有三只猫。', accepted: numAns(3) },
      ],
    },
    tick: {
      example: { prompt: '有几只狗？', icons: ['count_2', 'count_3', 'count_4'], correct: 0 },
      questions: [
        { prompt: '有几只猫？', icons: ['count_3', 'count_2', 'count_4'], correct: 0 },
        { prompt: '有几个苹果？', icons: ['count_5', 'count_4', 'count_6'], correct: 1 },
        { prompt: '有几本书？', icons: ['count_4', 'count_5', 'count_6'], correct: 1 },
        { prompt: '有几支笔？', icons: ['count_6', 'count_5', 'count_7'], correct: 0 },
        { prompt: '有几只鸟？', icons: ['count_2', 'count_3', 'count_7'], correct: 0 },
      ],
    },
    colourSceneId: 'zh_hsk1_l107_birthday_outline',
    colour: {
      example: { label: '苹果', color: 'red' },
      regions: [
        { label: '球', color: 'blue' },
        { label: '书', color: 'green' },
        { label: '猫', color: 'orange' },
        { label: '鸟', color: 'yellow' },
        { label: '花', color: 'pink' },
      ],
    },
  },
  // L108 — 时间 (time)
  108: {
    theme: '时间',
    dragSceneId: 'zh_hsk1_l108_daily',
    dragNames: ['小华', '小刚', '小芳', '小明', '小红'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小华。', a: '小华' },
        { q: '今天几号？', say: '今天五号。', a: '五' },
      ],
      questions: [
        { prompt: '现在几点？', say: '现在七点。', accepted: [...numAns(7), '七点'] },
        { prompt: '今天几号？', say: '今天六号。', accepted: numAns(6) },
        { prompt: '他几点起床？', say: '他八点起床。', accepted: [...numAns(8), '八点'] },
        { prompt: '现在几点？', say: '现在三点。', accepted: [...numAns(3), '三点'] },
        { prompt: '今天星期几？', say: '今天星期四。', accepted: ['四', '4', 'si', '星期四'] },
      ],
    },
    tick: {
      example: { prompt: '哪个是三点？', icons: ['clock_3', 'clock_4', 'clock_5'], correct: 0 },
      questions: [
        { prompt: '哪个是四点？', icons: ['clock_5', 'clock_4', 'clock_3'], correct: 1 },
        { prompt: '哪个是五点？', icons: ['clock_6', 'clock_5', 'clock_4'], correct: 1 },
        { prompt: '哪个是六点？', icons: ['clock_6', 'clock_8', 'clock_3'], correct: 0 },
        { prompt: '哪个是八点？', icons: ['clock_5', 'clock_6', 'clock_8'], correct: 2 },
        { prompt: '哪个是书？', icons: ['book', 'pen', 'ball'], correct: 0 },
      ],
    },
    colourSceneId: 'zh_hsk1_l108_daily_outline',
    colour: {
      example: { label: '钟', color: 'red' },
      regions: [
        { label: '太阳', color: 'yellow' },
        { label: '月亮', color: 'grey' },
        { label: '星星', color: 'blue' },
        { label: '床', color: 'pink' },
        { label: '灯', color: 'orange' },
      ],
    },
  },
  // L109 — 家里物品 (home objects)
  109: {
    theme: '家里物品',
    dragSceneId: 'zh_hsk1_l109_livingroom',
    dragNames: ['小英', '小宝', '小明', '小华', '小红'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小英。', a: '小英' },
        { q: '有几张桌子？', say: '有两张桌子。', a: '二' },
      ],
      questions: [
        { prompt: '有几把椅子？', say: '有四把椅子。', accepted: numAns(4) },
        { prompt: '有几台电视？', say: '有一台电视。', accepted: numAns(1) },
        { prompt: '有几张床？', say: '有三张床。', accepted: numAns(3) },
        { prompt: '有几盏灯？', say: '有五盏灯。', accepted: numAns(5) },
        { prompt: '现在几点？', say: '现在六点。', accepted: [...numAns(6), '六点'] },
      ],
    },
    tick: {
      example: { prompt: '哪个是床？', icons: ['bed', 'chair', 'lamp'], correct: 0 },
      questions: [
        { prompt: '哪个是椅子？', icons: ['lamp', 'chair', 'bed'], correct: 1 },
        { prompt: '哪个是灯？', icons: ['book', 'tv', 'lamp'], correct: 2 },
        { prompt: '哪个是电视？', icons: ['tv', 'laptop', 'lamp'], correct: 0 },
        { prompt: '哪个是电脑？', icons: ['book', 'laptop', 'tv'], correct: 1 },
        { prompt: '哪个是玩具熊？', icons: ['cat', 'teddy', 'dog'], correct: 1 },
      ],
    },
    colourSceneId: 'zh_hsk1_l109_livingroom_outline',
    colour: {
      example: { label: '床', color: 'pink' },
      regions: [
        { label: '椅子', color: 'blue' },
        { label: '桌子', color: 'brown' },
        { label: '电视', color: 'black' },
        { label: '灯', color: 'yellow' },
        { label: '电脑', color: 'grey' },
      ],
    },
  },
  // L110 — 吃的喝的 (food & drink)
  110: {
    theme: '吃喝',
    dragSceneId: 'zh_hsk1_l110_kitchen',
    dragNames: ['小红', '小明', '小丽', '小华', '小英'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小红。', a: '小红' },
        { q: '有几个面包？', say: '有三个面包。', a: '三' },
      ],
      questions: [
        { prompt: '有几碗米饭？', say: '有两碗米饭。', accepted: [...numAns(2), '两'] },
        { prompt: '有几杯水？', say: '有四杯水。', accepted: numAns(4) },
        { prompt: '有几个苹果？', say: '有五个苹果。', accepted: numAns(5) },
        { prompt: '有几块蛋糕？', say: '有六块蛋糕。', accepted: numAns(6) },
        { prompt: '有几杯果汁？', say: '有三杯果汁。', accepted: numAns(3) },
      ],
    },
    tick: {
      example: { prompt: '哪个是面包？', icons: ['bread', 'cake', 'pizza'], correct: 0 },
      questions: [
        { prompt: '哪个是米饭？', icons: ['soup_bowl', 'bread', 'cake'], correct: 0 },
        { prompt: '哪个是苹果？', icons: ['apple', 'banana', 'orange'], correct: 0 },
        { prompt: '哪个是蛋糕？', icons: ['bread', 'cake', 'pizza'], correct: 1 },
        { prompt: '哪个是果汁？', icons: ['juice_glass', 'soup_bowl', 'cake'], correct: 0 },
        { prompt: '哪个是香蕉？', icons: ['orange', 'banana', 'apple'], correct: 1 },
      ],
    },
    colourSceneId: 'zh_hsk1_l110_kitchen_outline',
    colour: {
      example: { label: '苹果', color: 'red' },
      regions: [
        { label: '香蕉', color: 'yellow' },
        { label: '面包', color: 'brown' },
        { label: '蛋糕', color: 'pink' },
        { label: '米饭', color: 'grey' },
        { label: '果汁', color: 'orange' },
      ],
    },
  },
  // L111 — 交通 (transport)
  111: {
    theme: '交通',
    dragSceneId: 'zh_hsk1_l111_station',
    dragNames: ['小明', '小红', '小华', '小英', '小刚'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小明。', a: '小明' },
        { q: '有几辆车？', say: '有三辆车。', a: '三' },
      ],
      questions: [
        { prompt: '有几架飞机？', say: '有两架飞机。', accepted: [...numAns(2), '两'] },
        { prompt: '有几条船？', say: '有四条船。', accepted: numAns(4) },
        { prompt: '他几岁？', say: '他六岁。', accepted: numAns(6) },
        { prompt: '有几张票？', say: '有五张票。', accepted: numAns(5) },
        { prompt: '现在几点？', say: '现在八点。', accepted: [...numAns(8), '八点'] },
      ],
    },
    tick: {
      example: { prompt: '哪个是公共汽车？', icons: ['bus', 'plane', 'sailboat'], correct: 0 },
      questions: [
        { prompt: '哪个是飞机？', icons: ['sailboat', 'plane', 'bus'], correct: 1 },
        { prompt: '哪个是船？', icons: ['bus', 'sailboat', 'plane'], correct: 1 },
        { prompt: '哪个是救护车？', icons: ['ambulance', 'fire_engine', 'bus'], correct: 0 },
        { prompt: '哪个是消防车？', icons: ['bus', 'fire_engine', 'ambulance'], correct: 1 },
        { prompt: '哪个是票？', icons: ['ticket', 'box', 'book'], correct: 0 },
      ],
    },
    colourSceneId: 'zh_hsk1_l111_station_outline',
    colour: {
      example: { label: '公共汽车', color: 'red' },
      regions: [
        { label: '飞机', color: 'blue' },
        { label: '船', color: 'green' },
        { label: '火车', color: 'black' },
        { label: '气球', color: 'pink' },
        { label: '太阳', color: 'orange' },
      ],
    },
  },
  // L112 — 玩具 (toys)
  112: {
    theme: '玩具',
    dragSceneId: 'zh_hsk1_l112_toyshop',
    dragNames: ['小红', '小华', '小明', '小英', '小丽'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小红。', a: '小红' },
        { q: '有几个球？', say: '有三个球。', a: '三' },
      ],
      questions: [
        { prompt: '有几个风筝？', say: '有两个风筝。', accepted: [...numAns(2), '两'] },
        { prompt: '有几个娃娃？', say: '有四个娃娃。', accepted: numAns(4) },
        { prompt: '有几个玩具熊？', say: '有五个玩具熊。', accepted: numAns(5) },
        { prompt: '她几岁？', say: '她六岁。', accepted: numAns(6) },
        { prompt: '有几本书？', say: '有七本书。', accepted: numAns(7) },
      ],
    },
    tick: {
      example: { prompt: '哪个是球？', icons: ['ball', 'kite', 'teddy'], correct: 0 },
      questions: [
        { prompt: '哪个是风筝？', icons: ['teddy', 'kite', 'ball'], correct: 1 },
        { prompt: '哪个是玩具熊？', icons: ['teddy', 'drum', 'doll_in_box'], correct: 0 },
        { prompt: '哪个是鼓？', icons: ['ball', 'drum', 'kite'], correct: 1 },
        { prompt: '哪个是娃娃？', icons: ['doll_in_box', 'teddy', 'drum'], correct: 0 },
        { prompt: '哪个是书？', icons: ['ball', 'book', 'pen'], correct: 1 },
      ],
    },
    colourSceneId: 'zh_hsk1_l112_toyshop_outline',
    colour: {
      example: { label: '球', color: 'red' },
      regions: [
        { label: '风筝', color: 'blue' },
        { label: '玩具熊', color: 'brown' },
        { label: '鼓', color: 'green' },
        { label: '娃娃', color: 'pink' },
        { label: '书', color: 'yellow' },
      ],
    },
  },
  // L113 — 动物园 (zoo animals)
  113: {
    theme: '动物园',
    dragSceneId: 'zh_hsk1_l113_zoo',
    dragNames: ['小华', '小明', '小红', '小英', '小丽'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小华。', a: '小华' },
        { q: '有几只狮子？', say: '有两只狮子。', a: '二' },
      ],
      questions: [
        { prompt: '有几只猴子？', say: '有三只猴子。', accepted: numAns(3) },
        { prompt: '有几只大象？', say: '有四只大象。', accepted: numAns(4) },
        { prompt: '有几只企鹅？', say: '有五只企鹅。', accepted: numAns(5) },
        { prompt: '它几岁？', say: '它六岁。', accepted: numAns(6) },
        { prompt: '有几只长颈鹿？', say: '有两只长颈鹿。', accepted: [...numAns(2), '两'] },
      ],
    },
    tick: {
      example: { prompt: '哪个是狮子？', icons: ['lion', 'monkey', 'elephant'], correct: 0 },
      questions: [
        { prompt: '哪个是猴子？', icons: ['elephant', 'monkey', 'lion'], correct: 1 },
        { prompt: '哪个是大象？', icons: ['elephant', 'giraffe', 'snake'], correct: 0 },
        { prompt: '哪个是长颈鹿？', icons: ['snake', 'giraffe', 'monkey'], correct: 1 },
        { prompt: '哪个是蛇？', icons: ['snake', 'penguin', 'lion'], correct: 0 },
        { prompt: '哪个是企鹅？', icons: ['monkey', 'elephant', 'penguin'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk1_l113_zoo_outline',
    colour: {
      example: { label: '狮子', color: 'yellow' },
      regions: [
        { label: '猴子', color: 'brown' },
        { label: '大象', color: 'grey' },
        { label: '长颈鹿', color: 'orange' },
        { label: '蛇', color: 'green' },
        { label: '企鹅', color: 'black' },
      ],
    },
  },
  // L114 — 野餐 (picnic food)
  114: {
    theme: '野餐',
    dragSceneId: 'zh_hsk1_l114_picnic',
    dragNames: ['小英', '小明', '小丽', '小华', '小红'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小英。', a: '小英' },
        { q: '有几个汉堡？', say: '有三个汉堡。', a: '三' },
      ],
      questions: [
        { prompt: '有几块比萨？', say: '有两块比萨。', accepted: [...numAns(2), '两'] },
        { prompt: '有几个冰淇淋？', say: '有四个冰淇淋。', accepted: numAns(4) },
        { prompt: '有几块蛋糕？', say: '有五块蛋糕。', accepted: numAns(5) },
        { prompt: '有几个面包？', say: '有六个面包。', accepted: numAns(6) },
        { prompt: '有几根香蕉？', say: '有三根香蕉。', accepted: numAns(3) },
      ],
    },
    tick: {
      example: { prompt: '哪个是比萨？', icons: ['pizza', 'burger', 'cake'], correct: 0 },
      questions: [
        { prompt: '哪个是汉堡？', icons: ['bread', 'burger', 'pizza'], correct: 1 },
        { prompt: '哪个是冰淇淋？', icons: ['ice_cream', 'cake', 'pizza'], correct: 0 },
        { prompt: '哪个是蛋糕？', icons: ['bread', 'cake', 'burger'], correct: 1 },
        { prompt: '哪个是面包？', icons: ['bread', 'pizza', 'cake'], correct: 0 },
        { prompt: '哪个是香蕉？', icons: ['apple', 'banana', 'orange'], correct: 1 },
      ],
    },
    colourSceneId: 'zh_hsk1_l114_picnic_outline',
    colour: {
      example: { label: '比萨', color: 'red' },
      regions: [
        { label: '汉堡', color: 'brown' },
        { label: '冰淇淋', color: 'pink' },
        { label: '蛋糕', color: 'yellow' },
        { label: '面包', color: 'orange' },
        { label: '香蕉', color: 'green' },
      ],
    },
  },
  // L115 — 购物 (shopping)
  115: {
    theme: '购物',
    dragSceneId: 'zh_hsk1_l115_shop',
    dragNames: ['小红', '小明', '小华', '小丽', '小刚'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小红。', a: '小红' },
        { q: '有几个包？', say: '有两个包。', a: '二' },
      ],
      questions: [
        { prompt: '有几个盒子？', say: '有三个盒子。', accepted: numAns(3) },
        { prompt: '有几本书？', say: '有四本书。', accepted: numAns(4) },
        { prompt: '有几张票？', say: '有五张票。', accepted: numAns(5) },
        { prompt: '他几岁？', say: '他八岁。', accepted: numAns(8) },
        { prompt: '现在几点？', say: '现在六点。', accepted: [...numAns(6), '六点'] },
      ],
    },
    tick: {
      example: { prompt: '哪个是钱？', icons: ['coin', 'bag_red', 'box'], correct: 0 },
      questions: [
        { prompt: '哪个是包？', icons: ['box', 'bag_red', 'book'], correct: 1 },
        { prompt: '哪个是盒子？', icons: ['box', 'coin', 'ticket'], correct: 0 },
        { prompt: '哪个是书？', icons: ['ball', 'book', 'pen'], correct: 1 },
        { prompt: '哪个是价签？', icons: ['price_tag', 'coin', 'box'], correct: 0 },
        { prompt: '哪个是票？', icons: ['book', 'box', 'ticket'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk1_l115_shop_outline',
    colour: {
      example: { label: '包', color: 'red' },
      regions: [
        { label: '盒子', color: 'brown' },
        { label: '书', color: 'blue' },
        { label: '票', color: 'yellow' },
        { label: '钱', color: 'green' },
        { label: '价签', color: 'orange' },
      ],
    },
  },

  // L116 — 复习 1 · 校园活动 (school fair, mixed review)
  116: {
    theme: '复习·校园',
    dragSceneId: 'zh_hsk1_l116_schoolfair',
    dragNames: ['小明', '小红', '小华', '小英', '小刚'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小明。', a: '小明' },
        { q: '有几本书？', say: '有三本书。', a: '三' },
      ],
      questions: [
        { prompt: '有几个球？', say: '有两个球。', accepted: [...numAns(2), '两'] },
        { prompt: '有几只猫？', say: '有四只猫。', accepted: numAns(4) },
        { prompt: '有几个苹果？', say: '有五个苹果。', accepted: numAns(5) },
        { prompt: '他几岁？', say: '他七岁。', accepted: numAns(7) },
        { prompt: '现在几点？', say: '现在八点。', accepted: [...numAns(8), '八点'] },
      ],
    },
    tick: {
      example: { prompt: '哪个是书？', icons: ['book', 'ball', 'cat'], correct: 0 },
      questions: [
        { prompt: '哪个是球？', icons: ['cat', 'ball', 'book'], correct: 1 },
        { prompt: '哪个是猫？', icons: ['cat', 'apple', 'bus'], correct: 0 },
        { prompt: '哪个是苹果？', icons: ['ball', 'apple', 'cat'], correct: 1 },
        { prompt: '哪个是公共汽车？', icons: ['bus', 'cat', 'apple'], correct: 0 },
        { prompt: '有几只猫？', icons: ['count_2', 'count_3', 'count_4'], correct: 1 },
      ],
    },
    colourSceneId: 'zh_hsk1_l116_schoolfair_outline',
    colour: {
      example: { label: '书', color: 'red' },
      regions: [
        { label: '球', color: 'blue' },
        { label: '猫', color: 'orange' },
        { label: '苹果', color: 'green' },
        { label: '公共汽车', color: 'yellow' },
        { label: '树', color: 'brown' },
      ],
    },
  },
  // L117 — 复习 2 · 我的房间 (my room, mixed review)
  117: {
    theme: '复习·房间',
    dragSceneId: 'zh_hsk1_l117_myroom',
    dragNames: ['小红', '小华', '小明', '小英', '小丽'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小红。', a: '小红' },
        { q: '有几张床？', say: '有两张床。', a: '二' },
      ],
      questions: [
        { prompt: '有几把椅子？', say: '有四把椅子。', accepted: numAns(4) },
        { prompt: '有几盏灯？', say: '有三盏灯。', accepted: numAns(3) },
        { prompt: '有几台电视？', say: '有一台电视。', accepted: numAns(1) },
        { prompt: '有几本书？', say: '有五本书。', accepted: numAns(5) },
        { prompt: '现在几点？', say: '现在六点。', accepted: [...numAns(6), '六点'] },
      ],
    },
    tick: {
      example: { prompt: '哪个是床？', icons: ['bed', 'chair', 'lamp'], correct: 0 },
      questions: [
        { prompt: '哪个是椅子？', icons: ['lamp', 'chair', 'bed'], correct: 1 },
        { prompt: '哪个是灯？', icons: ['tv', 'book', 'lamp'], correct: 2 },
        { prompt: '哪个是电视？', icons: ['tv', 'teddy', 'lamp'], correct: 0 },
        { prompt: '哪个是玩具熊？', icons: ['cat', 'teddy', 'dog'], correct: 1 },
        { prompt: '哪个是书？', icons: ['book', 'ball', 'pen'], correct: 0 },
      ],
    },
    colourSceneId: 'zh_hsk1_l117_myroom_outline',
    colour: {
      example: { label: '床', color: 'pink' },
      regions: [
        { label: '椅子', color: 'blue' },
        { label: '灯', color: 'yellow' },
        { label: '电视', color: 'black' },
        { label: '玩具熊', color: 'brown' },
        { label: '书', color: 'green' },
      ],
    },
  },
  // L118 — 复习 3 · 市场 (market day, food + money review)
  118: {
    theme: '复习·市场',
    dragSceneId: 'zh_hsk1_l118_market',
    dragNames: ['小华', '小明', '小红', '小英', '小丽'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小华。', a: '小华' },
        { q: '有几个苹果？', say: '有三个苹果。', a: '三' },
      ],
      questions: [
        { prompt: '有几根香蕉？', say: '有两根香蕉。', accepted: [...numAns(2), '两'] },
        { prompt: '有几个面包？', say: '有四个面包。', accepted: numAns(4) },
        { prompt: '有几块蛋糕？', say: '有五块蛋糕。', accepted: numAns(5) },
        { prompt: '有几杯果汁？', say: '有六杯果汁。', accepted: numAns(6) },
        { prompt: '有几个橙子？', say: '有三个橙子。', accepted: numAns(3) },
      ],
    },
    tick: {
      example: { prompt: '哪个是苹果？', icons: ['apple', 'banana', 'bread'], correct: 0 },
      questions: [
        { prompt: '哪个是香蕉？', icons: ['bread', 'banana', 'apple'], correct: 1 },
        { prompt: '哪个是面包？', icons: ['bread', 'cake', 'banana'], correct: 0 },
        { prompt: '哪个是蛋糕？', icons: ['apple', 'cake', 'bread'], correct: 1 },
        { prompt: '哪个是果汁？', icons: ['juice_glass', 'apple', 'cake'], correct: 0 },
        { prompt: '哪个是钱？', icons: ['book', 'coin', 'box'], correct: 1 },
      ],
    },
    colourSceneId: 'zh_hsk1_l118_market_outline',
    colour: {
      example: { label: '苹果', color: 'red' },
      regions: [
        { label: '香蕉', color: 'yellow' },
        { label: '面包', color: 'brown' },
        { label: '蛋糕', color: 'pink' },
        { label: '果汁', color: 'orange' },
        { label: '钱包', color: 'green' },
      ],
    },
  },
  // L119 — 复习 4 · 周末出去玩 (weekend out, transport + play review)
  119: {
    theme: '复习·周末',
    dragSceneId: 'zh_hsk1_l119_weekend',
    dragNames: ['小英', '小明', '小华', '小红', '小刚'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小英。', a: '小英' },
        { q: '有几辆车？', say: '有三辆车。', a: '三' },
      ],
      questions: [
        { prompt: '有几架飞机？', say: '有两架飞机。', accepted: [...numAns(2), '两'] },
        { prompt: '有几个球？', say: '有四个球。', accepted: numAns(4) },
        { prompt: '有几个风筝？', say: '有五个风筝。', accepted: numAns(5) },
        { prompt: '他几岁？', say: '他八岁。', accepted: numAns(8) },
        { prompt: '现在几点？', say: '现在三点。', accepted: [...numAns(3), '三点'] },
      ],
    },
    tick: {
      example: { prompt: '哪个是公共汽车？', icons: ['bus', 'plane', 'sailboat'], correct: 0 },
      questions: [
        { prompt: '哪个是飞机？', icons: ['sailboat', 'plane', 'bus'], correct: 1 },
        { prompt: '哪个是船？', icons: ['sailboat', 'bus', 'plane'], correct: 0 },
        { prompt: '哪个是球？', icons: ['kite', 'ball', 'bus'], correct: 1 },
        { prompt: '哪个是风筝？', icons: ['kite', 'ball', 'plane'], correct: 0 },
        { prompt: '哪个是三点？', icons: ['clock_3', 'clock_5', 'clock_8'], correct: 0 },
      ],
    },
    colourSceneId: 'zh_hsk1_l119_weekend_outline',
    colour: {
      example: { label: '公共汽车', color: 'red' },
      regions: [
        { label: '飞机', color: 'blue' },
        { label: '船', color: 'green' },
        { label: '球', color: 'orange' },
        { label: '风筝', color: 'purple' },
        { label: '太阳', color: 'yellow' },
      ],
    },
  },
  // L120 — 复习 5 · 联欢会 (celebration party, big mixed review)
  120: {
    theme: '复习·联欢会',
    dragSceneId: 'zh_hsk1_l120_party',
    dragNames: ['小红', '小明', '小华', '小丽', '小英'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小红。', a: '小红' },
        { q: '有几块蛋糕？', say: '有三块蛋糕。', a: '三' },
      ],
      questions: [
        { prompt: '有几个礼物？', say: '有四个礼物。', accepted: numAns(4) },
        { prompt: '有几只猫？', say: '有两只猫。', accepted: [...numAns(2), '两'] },
        { prompt: '有几只狗？', say: '有五只狗。', accepted: numAns(5) },
        { prompt: '她几岁？', say: '她六岁。', accepted: numAns(6) },
        { prompt: '现在几点？', say: '现在七点。', accepted: [...numAns(7), '七点'] },
      ],
    },
    tick: {
      example: { prompt: '哪个是蛋糕？', icons: ['cake', 'pizza', 'bread'], correct: 0 },
      questions: [
        { prompt: '哪个是礼物？', icons: ['box', 'ball', 'cake'], correct: 0 },
        { prompt: '哪个是球？', icons: ['cat', 'ball', 'box'], correct: 1 },
        { prompt: '哪个是猫？', icons: ['cat', 'dog', 'ball'], correct: 0 },
        { prompt: '哪个是狗？', icons: ['cat', 'box', 'dog'], correct: 2 },
        { prompt: '有几块蛋糕？', icons: ['count_3', 'count_4', 'count_5'], correct: 1 },
      ],
    },
    colourSceneId: 'zh_hsk1_l120_party_outline',
    colour: {
      example: { label: '蛋糕', color: 'pink' },
      regions: [
        { label: '礼物盒', color: 'red' },
        { label: '球', color: 'blue' },
        { label: '猫', color: 'orange' },
        { label: '狗', color: 'brown' },
        { label: '气球', color: 'green' },
      ],
    },
  },

  // ─── HSK2 (L121-140): 5-part with Matching (Part 3), A2-level language ───
  // L121 — 运动会 (sports day)
  121: {
    theme: '运动会',
    dragSceneId: 'zh_hsk2_l121_sportsday',
    dragNames: ['小明', '小红', '小华', '小英', '小刚'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小明。', a: '小明' },
        { q: '有几个球？', say: '有三个球。', a: '三' },
      ],
      questions: [
        { prompt: '有几个奖杯？', say: '有两个奖杯。', accepted: [...numAns(2), '两'] },
        { prompt: '有几块奖牌？', say: '有四块奖牌。', accepted: numAns(4) },
        { prompt: '有几个人跑步？', say: '有五个人跑步。', accepted: numAns(5) },
        { prompt: '他跑了第几名？', say: '他跑了第一名。', accepted: [...numAns(1), '第一'] },
        { prompt: '现在几点？', say: '现在八点。', accepted: [...numAns(8), '八点'] },
      ],
    },
    match: {
      example: { name: '小明', iconId: 'soccer_ball', say: '小明踢了足球。' },
      items: [
        { name: '小红', iconId: 'ball', say: '小红打了篮球。' },
        { name: '小华', iconId: 'trophy', say: '小华拿了奖杯。' },
        { name: '小英', iconId: 'medal', say: '小英得了奖牌。' },
        { name: '小丽', iconId: 'whistle', say: '小丽吹了哨子。' },
        { name: '小刚', iconId: 'microphone', say: '小刚唱了歌。' },
      ],
      distractors: ['ballet_shoe'],
    },
    tick: {
      example: { prompt: '哪个是足球？', icons: ['soccer_ball', 'ball', 'trophy'], correct: 0 },
      questions: [
        { prompt: '哪个是篮球？', icons: ['trophy', 'ball', 'soccer_ball'], correct: 1 },
        { prompt: '哪个是奖杯？', icons: ['trophy', 'medal', 'ball'], correct: 0 },
        { prompt: '哪个是奖牌？', icons: ['whistle', 'medal', 'trophy'], correct: 1 },
        { prompt: '哪个是哨子？', icons: ['whistle', 'ball', 'medal'], correct: 0 },
        { prompt: '有几个奖杯？', icons: ['count_2', 'count_3', 'count_4'], correct: 0 },
      ],
    },
    colourSceneId: 'zh_hsk2_l121_sportsday_outline',
    colour: {
      example: { label: '足球', color: 'black' },
      regions: [
        { label: '篮球', color: 'orange' },
        { label: '奖杯', color: 'yellow' },
        { label: '奖牌', color: 'red' },
        { label: '哨子', color: 'blue' },
        { label: '旗子', color: 'green' },
      ],
    },
  },
  // L122 — 音乐课 (music lesson)
  122: {
    theme: '音乐课',
    dragSceneId: 'zh_hsk2_l122_music',
    dragNames: ['小红', '小华', '小明', '小英', '小丽'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小红。', a: '小红' },
        { q: '有几把吉他？', say: '有两把吉他。', a: '二' },
      ],
      questions: [
        { prompt: '有几个鼓？', say: '有三个鼓。', accepted: numAns(3) },
        { prompt: '有几个人唱歌？', say: '有四个人唱歌。', accepted: numAns(4) },
        { prompt: '有几架钢琴？', say: '有一架钢琴。', accepted: numAns(1) },
        { prompt: '她几岁？', say: '她七岁。', accepted: numAns(7) },
        { prompt: '现在几点？', say: '现在五点。', accepted: [...numAns(5), '五点'] },
      ],
    },
    match: {
      example: { name: '小红', iconId: 'guitar', say: '小红弹了吉他。' },
      items: [
        { name: '小华', iconId: 'piano', say: '小华弹了钢琴。' },
        { name: '小明', iconId: 'drum', say: '小明打了鼓。' },
        { name: '小英', iconId: 'violin', say: '小英拉了小提琴。' },
        { name: '小丽', iconId: 'trumpet', say: '小丽吹了小号。' },
        { name: '小刚', iconId: 'microphone', say: '小刚唱了歌。' },
      ],
      distractors: ['music_note'],
    },
    tick: {
      example: { prompt: '哪个是吉他？', icons: ['guitar', 'piano', 'drum'], correct: 0 },
      questions: [
        { prompt: '哪个是钢琴？', icons: ['drum', 'piano', 'guitar'], correct: 1 },
        { prompt: '哪个是鼓？', icons: ['drum', 'violin', 'piano'], correct: 0 },
        { prompt: '哪个是小提琴？', icons: ['trumpet', 'violin', 'guitar'], correct: 1 },
        { prompt: '哪个是小号？', icons: ['trumpet', 'drum', 'violin'], correct: 0 },
        { prompt: '哪个是麦克风？', icons: ['music_note', 'microphone', 'drum'], correct: 1 },
      ],
    },
    colourSceneId: 'zh_hsk2_l122_music_outline',
    colour: {
      example: { label: '吉他', color: 'brown' },
      regions: [
        { label: '钢琴', color: 'black' },
        { label: '鼓', color: 'red' },
        { label: '小提琴', color: 'yellow' },
        { label: '小号', color: 'orange' },
        { label: '音符', color: 'blue' },
      ],
    },
  },
  // L123 — 在动物园 (at the zoo)
  123: {
    theme: '在动物园',
    dragSceneId: 'zh_hsk2_l123_zoo',
    dragNames: ['小华', '小明', '小红', '小英', '小丽'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小华。', a: '小华' },
        { q: '有几只狮子？', say: '有两只狮子。', a: '二' },
      ],
      questions: [
        { prompt: '有几只猴子？', say: '有三只猴子。', accepted: numAns(3) },
        { prompt: '有几只大象？', say: '有四只大象。', accepted: numAns(4) },
        { prompt: '有几只企鹅？', say: '有五只企鹅。', accepted: numAns(5) },
        { prompt: '他喜欢几只动物？', say: '他喜欢六只动物。', accepted: numAns(6) },
        { prompt: '现在几点？', say: '现在三点。', accepted: [...numAns(3), '三点'] },
      ],
    },
    match: {
      example: { name: '小华', iconId: 'lion', say: '小华看了狮子。' },
      items: [
        { name: '小明', iconId: 'elephant', say: '小明喂了大象。' },
        { name: '小红', iconId: 'monkey', say: '小红看了猴子。' },
        { name: '小英', iconId: 'giraffe', say: '小英喜欢长颈鹿。' },
        { name: '小丽', iconId: 'snake', say: '小丽怕那条蛇。' },
        { name: '小刚', iconId: 'penguin', say: '小刚看了企鹅。' },
      ],
      distractors: ['cat'],
    },
    tick: {
      example: { prompt: '哪个是狮子？', icons: ['lion', 'monkey', 'elephant'], correct: 0 },
      questions: [
        { prompt: '哪个是大象？', icons: ['giraffe', 'elephant', 'lion'], correct: 1 },
        { prompt: '哪个是猴子？', icons: ['monkey', 'snake', 'penguin'], correct: 0 },
        { prompt: '哪个是长颈鹿？', icons: ['snake', 'giraffe', 'monkey'], correct: 1 },
        { prompt: '哪个是蛇？', icons: ['snake', 'penguin', 'lion'], correct: 0 },
        { prompt: '哪个是企鹅？', icons: ['lion', 'monkey', 'penguin'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk2_l123_zoo_outline',
    colour: {
      example: { label: '狮子', color: 'yellow' },
      regions: [
        { label: '大象', color: 'grey' },
        { label: '猴子', color: 'brown' },
        { label: '长颈鹿', color: 'orange' },
        { label: '蛇', color: 'green' },
        { label: '企鹅', color: 'black' },
      ],
    },
  },
  // L124 — 在餐厅 (at the restaurant)
  124: {
    theme: '在餐厅',
    dragSceneId: 'zh_hsk2_l124_restaurant',
    dragNames: ['小英', '小明', '小丽', '小华', '小红'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小英。', a: '小英' },
        { q: '有几个汉堡？', say: '有三个汉堡。', a: '三' },
      ],
      questions: [
        { prompt: '有几碗面条？', say: '有两碗面条。', accepted: [...numAns(2), '两'] },
        { prompt: '有几杯果汁？', say: '有四杯果汁。', accepted: numAns(4) },
        { prompt: '有几个冰淇淋？', say: '有五个冰淇淋。', accepted: numAns(5) },
        { prompt: '他们几个人？', say: '他们六个人。', accepted: numAns(6) },
        { prompt: '现在几点？', say: '现在七点。', accepted: [...numAns(7), '七点'] },
      ],
    },
    match: {
      example: { name: '爸爸', iconId: 'pizza', say: '爸爸吃了比萨。' },
      items: [
        { name: '妈妈', iconId: 'burger', say: '妈妈吃了汉堡。' },
        { name: '小华', iconId: 'noodles', say: '小华吃了面条。' },
        { name: '小英', iconId: 'juice_glass', say: '小英喝了果汁。' },
        { name: '小丽', iconId: 'ice_cream', say: '小丽吃了冰淇淋。' },
        { name: '小刚', iconId: 'soup_bowl', say: '小刚喝了汤。' },
      ],
      distractors: ['salad'],
    },
    tick: {
      example: { prompt: '哪个是比萨？', icons: ['pizza', 'burger', 'noodles'], correct: 0 },
      questions: [
        { prompt: '哪个是汉堡？', icons: ['noodles', 'burger', 'pizza'], correct: 1 },
        { prompt: '哪个是面条？', icons: ['noodles', 'soup_bowl', 'pizza'], correct: 0 },
        { prompt: '哪个是果汁？', icons: ['ice_cream', 'juice_glass', 'soup_bowl'], correct: 1 },
        { prompt: '哪个是冰淇淋？', icons: ['ice_cream', 'burger', 'noodles'], correct: 0 },
        { prompt: '哪个是汤？', icons: ['juice_glass', 'pizza', 'soup_bowl'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk2_l124_restaurant_outline',
    colour: {
      example: { label: '比萨', color: 'red' },
      regions: [
        { label: '汉堡', color: 'brown' },
        { label: '面条', color: 'yellow' },
        { label: '果汁', color: 'orange' },
        { label: '冰淇淋', color: 'pink' },
        { label: '汤', color: 'green' },
      ],
    },
  },
  // L125 — 去旅行 (going travelling)
  125: {
    theme: '去旅行',
    dragSceneId: 'zh_hsk2_l125_travel',
    dragNames: ['小明', '小红', '小华', '小丽', '小刚'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小明。', a: '小明' },
        { q: '有几个行李箱？', say: '有两个行李箱。', a: '二' },
      ],
      questions: [
        { prompt: '有几张票？', say: '有三张票。', accepted: numAns(3) },
        { prompt: '有几架飞机？', say: '有四架飞机。', accepted: numAns(4) },
        { prompt: '有几辆车？', say: '有五辆车。', accepted: numAns(5) },
        { prompt: '他们坐几点的飞机？', say: '他们坐八点的飞机。', accepted: [...numAns(8), '八点'] },
        { prompt: '他几岁？', say: '他九岁。', accepted: numAns(9) },
      ],
    },
    match: {
      example: { name: '小明', iconId: 'plane', say: '小明坐了飞机。' },
      items: [
        { name: '小红', iconId: 'bus', say: '小红坐了公共汽车。' },
        { name: '小华', iconId: 'sailboat', say: '小华坐了船。' },
        { name: '小丽', iconId: 'suitcase', say: '小丽带了行李箱。' },
        { name: '小刚', iconId: 'ticket', say: '小刚买了票。' },
        { name: '小英', iconId: 'map', say: '小英看了地图。' },
      ],
      distractors: ['compass'],
    },
    tick: {
      example: { prompt: '哪个是飞机？', icons: ['plane', 'bus', 'sailboat'], correct: 0 },
      questions: [
        { prompt: '哪个是公共汽车？', icons: ['sailboat', 'bus', 'plane'], correct: 1 },
        { prompt: '哪个是船？', icons: ['sailboat', 'plane', 'bus'], correct: 0 },
        { prompt: '哪个是行李箱？', icons: ['ticket', 'suitcase', 'map'], correct: 1 },
        { prompt: '哪个是票？', icons: ['ticket', 'map', 'suitcase'], correct: 0 },
        { prompt: '哪个是地图？', icons: ['suitcase', 'ticket', 'map'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk2_l125_travel_outline',
    colour: {
      example: { label: '飞机', color: 'blue' },
      regions: [
        { label: '公共汽车', color: 'red' },
        { label: '船', color: 'green' },
        { label: '行李箱', color: 'brown' },
        { label: '票', color: 'yellow' },
        { label: '地图', color: 'orange' },
      ],
    },
  },

  // L126 — 我的一周 (my week)
  126: {
    theme: '我的一周',
    dragSceneId: 'zh_hsk2_l126_week',
    dragNames: ['小明', '小红', '小华', '小英', '小刚'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小明。', a: '小明' },
        { q: '一周有几天上学？', say: '一周有五天上学。', a: '五' },
      ],
      questions: [
        { prompt: '他几点起床？', say: '他七点起床。', accepted: [...numAns(7), '七点'] },
        { prompt: '有几本书？', say: '有三本书。', accepted: numAns(3) },
        { prompt: '他打了几次球？', say: '他打了两次球。', accepted: [...numAns(2), '两'] },
        { prompt: '有几个苹果？', say: '有四个苹果。', accepted: numAns(4) },
        { prompt: '现在几点？', say: '现在八点。', accepted: [...numAns(8), '八点'] },
      ],
    },
    match: {
      example: { name: '小明', iconId: 'bus', say: '小明坐公共汽车上学。' },
      items: [
        { name: '小红', iconId: 'ball', say: '小红打了球。' },
        { name: '小华', iconId: 'book', say: '小华看了书。' },
        { name: '小英', iconId: 'apple', say: '小英吃了苹果。' },
        { name: '小丽', iconId: 'bed', say: '小丽睡得很早。' },
        { name: '小刚', iconId: 'clock_3', say: '小刚三点起床了。' },
      ],
      distractors: ['kite'],
    },
    tick: {
      example: { prompt: '哪个是公共汽车？', icons: ['bus', 'ball', 'book'], correct: 0 },
      questions: [
        { prompt: '哪个是球？', icons: ['book', 'ball', 'bus'], correct: 1 },
        { prompt: '哪个是书？', icons: ['book', 'apple', 'bed'], correct: 0 },
        { prompt: '哪个是苹果？', icons: ['bed', 'apple', 'ball'], correct: 1 },
        { prompt: '哪个是床？', icons: ['bed', 'clock_3', 'book'], correct: 0 },
        { prompt: '哪个是三点？', icons: ['clock_5', 'clock_3', 'clock_8'], correct: 1 },
      ],
    },
    colourSceneId: 'zh_hsk2_l126_week_outline',
    colour: {
      example: { label: '公共汽车', color: 'red' },
      regions: [
        { label: '球', color: 'blue' },
        { label: '书', color: 'green' },
        { label: '苹果', color: 'orange' },
        { label: '床', color: 'pink' },
        { label: '钟', color: 'yellow' },
      ],
    },
  },
  // L127 — 看医生 (visiting the doctor)
  127: {
    theme: '看医生',
    dragSceneId: 'zh_hsk2_l127_doctor',
    dragNames: ['小红', '小华', '小明', '小英', '小丽'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小红。', a: '小红' },
        { q: '有几个医生？', say: '有两个医生。', a: '二' },
      ],
      questions: [
        { prompt: '他吃了几片药？', say: '他吃了三片药。', accepted: numAns(3) },
        { prompt: '有几张床？', say: '有四张床。', accepted: numAns(4) },
        { prompt: '有几辆救护车？', say: '有一辆救护车。', accepted: numAns(1) },
        { prompt: '她几岁？', say: '她六岁。', accepted: numAns(6) },
        { prompt: '现在几点？', say: '现在五点。', accepted: [...numAns(5), '五点'] },
      ],
    },
    match: {
      example: { name: '小红', iconId: 'stethoscope', say: '小红看了医生。' },
      items: [
        { name: '小华', iconId: 'pill', say: '小华吃了药。' },
        { name: '小明', iconId: 'bandage', say: '小明贴了创可贴。' },
        { name: '小英', iconId: 'thermometer', say: '小英量了体温。' },
        { name: '小丽', iconId: 'bed', say: '小丽躺在床上。' },
        { name: '小刚', iconId: 'ambulance', say: '小刚坐了救护车。' },
      ],
      distractors: ['flower'],
    },
    tick: {
      example: { prompt: '哪个是床？', icons: ['bed', 'pill', 'bandage'], correct: 0 },
      questions: [
        { prompt: '哪个是药？', icons: ['bandage', 'pill', 'bed'], correct: 1 },
        { prompt: '哪个是创可贴？', icons: ['bandage', 'thermometer', 'pill'], correct: 0 },
        { prompt: '哪个是体温计？', icons: ['pill', 'thermometer', 'bed'], correct: 1 },
        { prompt: '哪个是救护车？', icons: ['ambulance', 'bed', 'pill'], correct: 0 },
        { prompt: '哪个是花？', icons: ['pill', 'bandage', 'flower'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk2_l127_doctor_outline',
    colour: {
      example: { label: '床', color: 'pink' },
      regions: [
        { label: '药', color: 'red' },
        { label: '创可贴', color: 'yellow' },
        { label: '体温计', color: 'blue' },
        { label: '救护车', color: 'green' },
        { label: '花', color: 'orange' },
      ],
    },
  },
  // L128 — 做饭 (cooking)
  128: {
    theme: '做饭',
    dragSceneId: 'zh_hsk2_l128_cooking',
    dragNames: ['小华', '小明', '小红', '小英', '小丽'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小华。', a: '小华' },
        { q: '做了几个比萨？', say: '做了三个比萨。', a: '三' },
      ],
      questions: [
        { prompt: '做了几个蛋糕？', say: '做了两个蛋糕。', accepted: [...numAns(2), '两'] },
        { prompt: '有几把刀？', say: '有四把刀。', accepted: numAns(4) },
        { prompt: '煮了几碗汤？', say: '煮了五碗汤。', accepted: numAns(5) },
        { prompt: '他几岁？', say: '他七岁。', accepted: numAns(7) },
        { prompt: '现在几点？', say: '现在六点。', accepted: [...numAns(6), '六点'] },
      ],
    },
    match: {
      example: { name: '妈妈', iconId: 'chef_hat', say: '妈妈戴了厨师帽。' },
      items: [
        { name: '小红', iconId: 'whisk', say: '小红用了打蛋器。' },
        { name: '小华', iconId: 'knife', say: '小华用了刀。' },
        { name: '小英', iconId: 'pizza', say: '小英做了比萨。' },
        { name: '小丽', iconId: 'cake', say: '小丽做了蛋糕。' },
        { name: '小刚', iconId: 'soup_bowl', say: '小刚煮了汤。' },
      ],
      distractors: ['burger'],
    },
    tick: {
      example: { prompt: '哪个是厨师帽？', icons: ['chef_hat', 'whisk', 'knife'], correct: 0 },
      questions: [
        { prompt: '哪个是打蛋器？', icons: ['knife', 'whisk', 'chef_hat'], correct: 1 },
        { prompt: '哪个是刀？', icons: ['knife', 'pizza', 'cake'], correct: 0 },
        { prompt: '哪个是比萨？', icons: ['cake', 'pizza', 'soup_bowl'], correct: 1 },
        { prompt: '哪个是蛋糕？', icons: ['cake', 'soup_bowl', 'pizza'], correct: 0 },
        { prompt: '哪个是汤？', icons: ['pizza', 'cake', 'soup_bowl'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk2_l128_cooking_outline',
    colour: {
      example: { label: '厨师帽', color: 'red' },
      regions: [
        { label: '打蛋器', color: 'grey' },
        { label: '刀', color: 'blue' },
        { label: '比萨', color: 'orange' },
        { label: '蛋糕', color: 'pink' },
        { label: '汤', color: 'green' },
      ],
    },
  },
  // L129 — 太空馆 (space exhibition)
  129: {
    theme: '太空馆',
    dragSceneId: 'zh_hsk2_l129_space',
    dragNames: ['小明', '小红', '小华', '小英', '小刚'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小明。', a: '小明' },
        { q: '有几个火箭？', say: '有两个火箭。', a: '二' },
      ],
      questions: [
        { prompt: '有几颗星星？', say: '有五颗星星。', accepted: numAns(5) },
        { prompt: '有几个行星？', say: '有三个行星。', accepted: numAns(3) },
        { prompt: '有几个头盔？', say: '有四个头盔。', accepted: numAns(4) },
        { prompt: '他几岁？', say: '他八岁。', accepted: numAns(8) },
        { prompt: '有几个月亮？', say: '有一个月亮。', accepted: numAns(1) },
      ],
    },
    match: {
      example: { name: '小明', iconId: 'rocket', say: '小明做了火箭。' },
      items: [
        { name: '小红', iconId: 'telescope', say: '小红用了望远镜。' },
        { name: '小华', iconId: 'planet', say: '小华画了行星。' },
        { name: '小英', iconId: 'astronaut_helmet', say: '小英戴了头盔。' },
        { name: '小丽', iconId: 'star', say: '小丽看了星星。' },
        { name: '小刚', iconId: 'moon', say: '小刚看了月亮。' },
      ],
      distractors: ['robot'],
    },
    tick: {
      example: { prompt: '哪个是火箭？', icons: ['rocket', 'telescope', 'planet'], correct: 0 },
      questions: [
        { prompt: '哪个是望远镜？', icons: ['planet', 'telescope', 'rocket'], correct: 1 },
        { prompt: '哪个是行星？', icons: ['planet', 'star', 'moon'], correct: 0 },
        { prompt: '哪个是头盔？', icons: ['moon', 'astronaut_helmet', 'star'], correct: 1 },
        { prompt: '哪个是星星？', icons: ['star', 'moon', 'planet'], correct: 0 },
        { prompt: '哪个是月亮？', icons: ['rocket', 'star', 'moon'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk2_l129_space_outline',
    colour: {
      example: { label: '火箭', color: 'red' },
      regions: [
        { label: '望远镜', color: 'grey' },
        { label: '行星', color: 'blue' },
        { label: '头盔', color: 'yellow' },
        { label: '星星', color: 'orange' },
        { label: '月亮', color: 'purple' },
      ],
    },
  },
  // L130 — 海边 (at the seaside)
  130: {
    theme: '海边',
    dragSceneId: 'zh_hsk2_l130_seaside',
    dragNames: ['小红', '小明', '小华', '小英', '小丽'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小红。', a: '小红' },
        { q: '有几条船？', say: '有三条船。', a: '三' },
      ],
      questions: [
        { prompt: '钓了几条鱼？', say: '钓了两条鱼。', accepted: [...numAns(2), '两'] },
        { prompt: '有几个水桶？', say: '有四个水桶。', accepted: numAns(4) },
        { prompt: '有几个救生圈？', say: '有五个救生圈。', accepted: numAns(5) },
        { prompt: '她几岁？', say: '她六岁。', accepted: numAns(6) },
        { prompt: '现在几点？', say: '现在七点。', accepted: [...numAns(7), '七点'] },
      ],
    },
    match: {
      example: { name: '小红', iconId: 'sailboat', say: '小红开了船。' },
      items: [
        { name: '小明', iconId: 'life_ring', say: '小明拿了救生圈。' },
        { name: '小华', iconId: 'oar', say: '小华用了桨。' },
        { name: '小英', iconId: 'fish', say: '小英钓了鱼。' },
        { name: '小丽', iconId: 'bucket', say: '小丽装了一桶水。' },
        { name: '小刚', iconId: 'fishing_rod', say: '小刚用了钓鱼竿。' },
      ],
      distractors: ['tree'],
    },
    tick: {
      example: { prompt: '哪个是船？', icons: ['sailboat', 'life_ring', 'oar'], correct: 0 },
      questions: [
        { prompt: '哪个是救生圈？', icons: ['oar', 'life_ring', 'sailboat'], correct: 1 },
        { prompt: '哪个是桨？', icons: ['oar', 'fish', 'bucket'], correct: 0 },
        { prompt: '哪个是鱼？', icons: ['bucket', 'fish', 'oar'], correct: 1 },
        { prompt: '哪个是水桶？', icons: ['bucket', 'fishing_rod', 'fish'], correct: 0 },
        { prompt: '哪个是钓鱼竿？', icons: ['fish', 'bucket', 'fishing_rod'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk2_l130_seaside_outline',
    colour: {
      example: { label: '船', color: 'red' },
      regions: [
        { label: '救生圈', color: 'orange' },
        { label: '桨', color: 'brown' },
        { label: '鱼', color: 'blue' },
        { label: '水桶', color: 'green' },
        { label: '钓鱼竿', color: 'yellow' },
      ],
    },
  },

  // L131 — 宠物店 (pet shop)
  131: {
    theme: '宠物店',
    dragSceneId: 'zh_hsk2_l131_petshop',
    dragNames: ['小明', '小红', '小华', '小英', '小刚'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小明。', a: '小明' },
        { q: '有几只猫？', say: '有三只猫。', a: '三' },
      ],
      questions: [
        { prompt: '有几只狗？', say: '有两只狗。', accepted: [...numAns(2), '两'] },
        { prompt: '有几只兔子？', say: '有四只兔子。', accepted: numAns(4) },
        { prompt: '有几只鸟？', say: '有五只鸟。', accepted: numAns(5) },
        { prompt: '他几岁？', say: '他六岁。', accepted: numAns(6) },
        { prompt: '有几条鱼？', say: '有七条鱼。', accepted: numAns(7) },
      ],
    },
    match: {
      example: { name: '小明', iconId: 'cat', say: '小明喂了猫。' },
      items: [
        { name: '小红', iconId: 'dog', say: '小红喂了狗。' },
        { name: '小华', iconId: 'rabbit', say: '小华抱了兔子。' },
        { name: '小英', iconId: 'bird', say: '小英看了鸟。' },
        { name: '小丽', iconId: 'fishbowl', say: '小丽喂了鱼。' },
        { name: '小刚', iconId: 'bone', say: '小刚拿了骨头。' },
      ],
      distractors: ['bird_cage'],
    },
    tick: {
      example: { prompt: '哪个是猫？', icons: ['cat', 'dog', 'rabbit'], correct: 0 },
      questions: [
        { prompt: '哪个是狗？', icons: ['rabbit', 'dog', 'cat'], correct: 1 },
        { prompt: '哪个是兔子？', icons: ['rabbit', 'bird', 'dog'], correct: 0 },
        { prompt: '哪个是鸟？', icons: ['fishbowl', 'bird', 'cat'], correct: 1 },
        { prompt: '哪个是鱼缸？', icons: ['fishbowl', 'bone', 'bird_cage'], correct: 0 },
        { prompt: '哪个是骨头？', icons: ['bird_cage', 'fishbowl', 'bone'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk2_l131_petshop_outline',
    colour: {
      example: { label: '猫', color: 'orange' },
      regions: [
        { label: '狗', color: 'brown' },
        { label: '兔子', color: 'pink' },
        { label: '鸟', color: 'yellow' },
        { label: '鱼', color: 'blue' },
        { label: '骨头', color: 'grey' },
      ],
    },
  },
  // L132 — 美术课 (art class)
  132: {
    theme: '美术课',
    dragSceneId: 'zh_hsk2_l132_artclass',
    dragNames: ['小红', '小华', '小明', '小英', '小丽'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小红。', a: '小红' },
        { q: '有几个画架？', say: '有两个画架。', a: '二' },
      ],
      questions: [
        { prompt: '有几支画笔？', say: '有三支画笔。', accepted: numAns(3) },
        { prompt: '有几张画？', say: '有四张画。', accepted: numAns(4) },
        { prompt: '有几个画框？', say: '有五个画框。', accepted: numAns(5) },
        { prompt: '她几岁？', say: '她八岁。', accepted: numAns(8) },
        { prompt: '现在几点？', say: '现在六点。', accepted: [...numAns(6), '六点'] },
      ],
    },
    match: {
      example: { name: '小红', iconId: 'easel', say: '小红用了画架。' },
      items: [
        { name: '小华', iconId: 'paintbrush', say: '小华用了画笔。' },
        { name: '小明', iconId: 'palette', say: '小明拿了调色板。' },
        { name: '小英', iconId: 'frame', say: '小英做了画框。' },
        { name: '小丽', iconId: 'painting', say: '小丽看了一张画。' },
        { name: '小刚', iconId: 'statue', say: '小刚看了雕像。' },
      ],
      distractors: ['vase'],
    },
    tick: {
      example: { prompt: '哪个是画架？', icons: ['easel', 'paintbrush', 'palette'], correct: 0 },
      questions: [
        { prompt: '哪个是画笔？', icons: ['palette', 'paintbrush', 'easel'], correct: 1 },
        { prompt: '哪个是调色板？', icons: ['palette', 'frame', 'painting'], correct: 0 },
        { prompt: '哪个是画框？', icons: ['painting', 'frame', 'statue'], correct: 1 },
        { prompt: '哪个是画？', icons: ['painting', 'statue', 'vase'], correct: 0 },
        { prompt: '哪个是雕像？', icons: ['vase', 'painting', 'statue'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk2_l132_artclass_outline',
    colour: {
      example: { label: '画架', color: 'brown' },
      regions: [
        { label: '画笔', color: 'red' },
        { label: '调色板', color: 'blue' },
        { label: '画框', color: 'yellow' },
        { label: '画', color: 'green' },
        { label: '雕像', color: 'grey' },
      ],
    },
  },
  // L133 — 摄影 (photography)
  133: {
    theme: '摄影',
    dragSceneId: 'zh_hsk2_l133_photo',
    dragNames: ['小华', '小明', '小红', '小英', '小丽'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小华。', a: '小华' },
        { q: '有几台相机？', say: '有两台相机。', a: '二' },
      ],
      questions: [
        { prompt: '洗了几张照片？', say: '洗了三张照片。', accepted: numAns(3) },
        { prompt: '有几个三脚架？', say: '有四个三脚架。', accepted: numAns(4) },
        { prompt: '有几个镜头？', say: '有五个镜头。', accepted: numAns(5) },
        { prompt: '他几岁？', say: '他七岁。', accepted: numAns(7) },
        { prompt: '现在几点？', say: '现在八点。', accepted: [...numAns(8), '八点'] },
      ],
    },
    match: {
      example: { name: '小华', iconId: 'camera', say: '小华用了照相机。' },
      items: [
        { name: '小明', iconId: 'video_camera', say: '小明用了摄像机。' },
        { name: '小红', iconId: 'photo', say: '小红洗了照片。' },
        { name: '小英', iconId: 'tripod', say: '小英用了三脚架。' },
        { name: '小丽', iconId: 'lens', say: '小丽换了镜头。' },
        { name: '小刚', iconId: 'clapperboard', say: '小刚用了场记板。' },
      ],
      distractors: ['poster'],
    },
    tick: {
      example: { prompt: '哪个是照相机？', icons: ['camera', 'video_camera', 'photo'], correct: 0 },
      questions: [
        { prompt: '哪个是摄像机？', icons: ['photo', 'video_camera', 'camera'], correct: 1 },
        { prompt: '哪个是照片？', icons: ['photo', 'tripod', 'lens'], correct: 0 },
        { prompt: '哪个是三脚架？', icons: ['lens', 'tripod', 'photo'], correct: 1 },
        { prompt: '哪个是镜头？', icons: ['lens', 'clapperboard', 'camera'], correct: 0 },
        { prompt: '哪个是场记板？', icons: ['camera', 'photo', 'clapperboard'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk2_l133_photo_outline',
    colour: {
      example: { label: '照相机', color: 'black' },
      regions: [
        { label: '摄像机', color: 'grey' },
        { label: '照片', color: 'blue' },
        { label: '三脚架', color: 'brown' },
        { label: '镜头', color: 'red' },
        { label: '场记板', color: 'yellow' },
      ],
    },
  },
  // L134 — 花园 (garden)
  134: {
    theme: '花园',
    dragSceneId: 'zh_hsk2_l134_garden',
    dragNames: ['小英', '小明', '小丽', '小华', '小红'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小英。', a: '小英' },
        { q: '种了几棵树？', say: '种了三棵树。', a: '三' },
      ],
      questions: [
        { prompt: '有几个花盆？', say: '有两个花盆。', accepted: [...numAns(2), '两'] },
        { prompt: '摘了几朵花？', say: '摘了四朵花。', accepted: numAns(4) },
        { prompt: '有几个铲子？', say: '有五个铲子。', accepted: numAns(5) },
        { prompt: '她几岁？', say: '她六岁。', accepted: numAns(6) },
        { prompt: '现在几点？', say: '现在七点。', accepted: [...numAns(7), '七点'] },
      ],
    },
    match: {
      example: { name: '小英', iconId: 'spade', say: '小英用了铲子。' },
      items: [
        { name: '小明', iconId: 'watering_can', say: '小明用了浇水壶。' },
        { name: '小丽', iconId: 'wheelbarrow', say: '小丽推了手推车。' },
        { name: '小华', iconId: 'flowerpot', say: '小华拿了花盆。' },
        { name: '小红', iconId: 'tree', say: '小红种了树。' },
        { name: '小刚', iconId: 'flower', say: '小刚摘了花。' },
      ],
      distractors: ['bucket'],
    },
    tick: {
      example: { prompt: '哪个是铲子？', icons: ['spade', 'watering_can', 'wheelbarrow'], correct: 0 },
      questions: [
        { prompt: '哪个是浇水壶？', icons: ['wheelbarrow', 'watering_can', 'spade'], correct: 1 },
        { prompt: '哪个是手推车？', icons: ['wheelbarrow', 'flowerpot', 'tree'], correct: 0 },
        { prompt: '哪个是花盆？', icons: ['tree', 'flowerpot', 'flower'], correct: 1 },
        { prompt: '哪个是树？', icons: ['tree', 'flower', 'spade'], correct: 0 },
        { prompt: '哪个是花？', icons: ['spade', 'tree', 'flower'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk2_l134_garden_outline',
    colour: {
      example: { label: '铲子', color: 'grey' },
      regions: [
        { label: '浇水壶', color: 'blue' },
        { label: '手推车', color: 'red' },
        { label: '花盆', color: 'brown' },
        { label: '树', color: 'green' },
        { label: '花', color: 'pink' },
      ],
    },
  },
  // L135 — 邮局 (post office)
  135: {
    theme: '邮局',
    dragSceneId: 'zh_hsk2_l135_postoffice',
    dragNames: ['小红', '小明', '小华', '小丽', '小刚'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小红。', a: '小红' },
        { q: '寄了几个包裹？', say: '寄了三个包裹。', a: '三' },
      ],
      questions: [
        { prompt: '有几封信？', say: '有两封信。', accepted: [...numAns(2), '两'] },
        { prompt: '有几张邮票？', say: '有四张邮票。', accepted: numAns(4) },
        { prompt: '有几个邮筒？', say: '有一个邮筒。', accepted: numAns(1) },
        { prompt: '他几岁？', say: '他八岁。', accepted: numAns(8) },
        { prompt: '现在几点？', say: '现在五点。', accepted: [...numAns(5), '五点'] },
      ],
    },
    match: {
      example: { name: '小红', iconId: 'parcel', say: '小红寄了包裹。' },
      items: [
        { name: '小明', iconId: 'envelope', say: '小明写了信。' },
        { name: '小华', iconId: 'stamp', say: '小华贴了邮票。' },
        { name: '小丽', iconId: 'scales', say: '小丽用了天平。' },
        { name: '小刚', iconId: 'postbox', say: '小刚用了邮筒。' },
        { name: '小英', iconId: 'pen', say: '小英拿了笔。' },
      ],
      distractors: ['box'],
    },
    tick: {
      example: { prompt: '哪个是包裹？', icons: ['parcel', 'envelope', 'stamp'], correct: 0 },
      questions: [
        { prompt: '哪个是信封？', icons: ['stamp', 'envelope', 'parcel'], correct: 1 },
        { prompt: '哪个是邮票？', icons: ['stamp', 'scales', 'postbox'], correct: 0 },
        { prompt: '哪个是天平？', icons: ['postbox', 'scales', 'envelope'], correct: 1 },
        { prompt: '哪个是邮筒？', icons: ['postbox', 'pen', 'stamp'], correct: 0 },
        { prompt: '哪个是笔？', icons: ['box', 'parcel', 'pen'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk2_l135_postoffice_outline',
    colour: {
      example: { label: '包裹', color: 'brown' },
      regions: [
        { label: '信封', color: 'yellow' },
        { label: '邮票', color: 'red' },
        { label: '天平', color: 'grey' },
        { label: '邮筒', color: 'green' },
        { label: '笔', color: 'blue' },
      ],
    },
  },

  // L136 — 修理 (fixing things)
  136: {
    theme: '修理',
    dragSceneId: 'zh_hsk2_l136_fixing',
    dragNames: ['小明', '小红', '小华', '小英', '小刚'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小明。', a: '小明' },
        { q: '有几个锤子？', say: '有两个锤子。', a: '二' },
      ],
      questions: [
        { prompt: '有几把扳手？', say: '有三把扳手。', accepted: numAns(3) },
        { prompt: '有几个梯子？', say: '有四个梯子。', accepted: numAns(4) },
        { prompt: '有几个水桶？', say: '有五个水桶。', accepted: numAns(5) },
        { prompt: '他几岁？', say: '他七岁。', accepted: numAns(7) },
        { prompt: '现在几点？', say: '现在六点。', accepted: [...numAns(6), '六点'] },
      ],
    },
    match: {
      example: { name: '小明', iconId: 'wrench', say: '小明用了扳手。' },
      items: [
        { name: '小红', iconId: 'hammer', say: '小红用了锤子。' },
        { name: '小华', iconId: 'ladder', say: '小华爬了梯子。' },
        { name: '小英', iconId: 'bucket', say: '小英提了水桶。' },
        { name: '小丽', iconId: 'paintbrush', say: '小丽刷了油漆。' },
        { name: '小刚', iconId: 'box', say: '小刚搬了箱子。' },
      ],
      distractors: ['book'],
    },
    tick: {
      example: { prompt: '哪个是扳手？', icons: ['wrench', 'hammer', 'ladder'], correct: 0 },
      questions: [
        { prompt: '哪个是锤子？', icons: ['ladder', 'hammer', 'wrench'], correct: 1 },
        { prompt: '哪个是梯子？', icons: ['ladder', 'bucket', 'box'], correct: 0 },
        { prompt: '哪个是水桶？', icons: ['box', 'bucket', 'ladder'], correct: 1 },
        { prompt: '哪个是油漆刷？', icons: ['paintbrush', 'box', 'hammer'], correct: 0 },
        { prompt: '哪个是箱子？', icons: ['book', 'bucket', 'box'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk2_l136_fixing_outline',
    colour: {
      example: { label: '扳手', color: 'grey' },
      regions: [
        { label: '锤子', color: 'brown' },
        { label: '梯子', color: 'red' },
        { label: '水桶', color: 'blue' },
        { label: '油漆刷', color: 'yellow' },
        { label: '箱子', color: 'green' },
      ],
    },
  },
  // L137 — 生日会 (birthday party)
  137: {
    theme: '生日会',
    dragSceneId: 'zh_hsk2_l137_birthday',
    dragNames: ['小红', '小华', '小明', '小英', '小丽'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小红。', a: '小红' },
        { q: '有几个蛋糕？', say: '有两个蛋糕。', a: '二' },
      ],
      questions: [
        { prompt: '有几个礼物？', say: '有三个礼物。', accepted: numAns(3) },
        { prompt: '有几个球？', say: '有四个球。', accepted: numAns(4) },
        { prompt: '有几面旗子？', say: '有五面旗子。', accepted: numAns(5) },
        { prompt: '她几岁？', say: '她八岁。', accepted: numAns(8) },
        { prompt: '现在几点？', say: '现在七点。', accepted: [...numAns(7), '七点'] },
      ],
    },
    match: {
      example: { name: '小红', iconId: 'cake', say: '小红切了蛋糕。' },
      items: [
        { name: '小华', iconId: 'box', say: '小华拿了礼物。' },
        { name: '小明', iconId: 'drum', say: '小明打了鼓。' },
        { name: '小英', iconId: 'flag', say: '小英举了旗子。' },
        { name: '小丽', iconId: 'star', say: '小丽挂了星星灯。' },
        { name: '小刚', iconId: 'ball', say: '小刚玩了球。' },
      ],
      distractors: ['book'],
    },
    tick: {
      example: { prompt: '哪个是蛋糕？', icons: ['cake', 'box', 'drum'], correct: 0 },
      questions: [
        { prompt: '哪个是礼物？', icons: ['drum', 'box', 'cake'], correct: 1 },
        { prompt: '哪个是鼓？', icons: ['drum', 'flag', 'star'], correct: 0 },
        { prompt: '哪个是旗子？', icons: ['star', 'flag', 'ball'], correct: 1 },
        { prompt: '哪个是星星？', icons: ['star', 'ball', 'box'], correct: 0 },
        { prompt: '哪个是球？', icons: ['cake', 'drum', 'ball'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk2_l137_birthday_outline',
    colour: {
      example: { label: '蛋糕', color: 'pink' },
      regions: [
        { label: '礼物', color: 'red' },
        { label: '鼓', color: 'brown' },
        { label: '旗子', color: 'green' },
        { label: '星星', color: 'yellow' },
        { label: '球', color: 'blue' },
      ],
    },
  },
  // L138 — 电影院 (cinema)
  138: {
    theme: '电影院',
    dragSceneId: 'zh_hsk2_l138_cinema',
    dragNames: ['小华', '小明', '小红', '小英', '小丽'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小华。', a: '小华' },
        { q: '买了几张票？', say: '买了两张票。', a: '二' },
      ],
      questions: [
        { prompt: '有几桶爆米花？', say: '有三桶爆米花。', accepted: numAns(3) },
        { prompt: '有几个冰淇淋？', say: '有四个冰淇淋。', accepted: numAns(4) },
        { prompt: '有几杯果汁？', say: '有五杯果汁。', accepted: numAns(5) },
        { prompt: '他几岁？', say: '他六岁。', accepted: numAns(6) },
        { prompt: '现在几点？', say: '现在八点。', accepted: [...numAns(8), '八点'] },
      ],
    },
    match: {
      example: { name: '小华', iconId: 'popcorn', say: '小华买了爆米花。' },
      items: [
        { name: '小明', iconId: 'glasses_3d', say: '小明戴了3D眼镜。' },
        { name: '小红', iconId: 'film_screen', say: '小红看了屏幕。' },
        { name: '小英', iconId: 'ticket', say: '小英拿了票。' },
        { name: '小丽', iconId: 'juice_glass', say: '小丽喝了果汁。' },
        { name: '小刚', iconId: 'ice_cream', say: '小刚吃了冰淇淋。' },
      ],
      distractors: ['cake'],
    },
    tick: {
      example: { prompt: '哪个是爆米花？', icons: ['popcorn', 'glasses_3d', 'ticket'], correct: 0 },
      questions: [
        { prompt: '哪个是3D眼镜？', icons: ['ticket', 'glasses_3d', 'popcorn'], correct: 1 },
        { prompt: '哪个是屏幕？', icons: ['film_screen', 'juice_glass', 'ticket'], correct: 0 },
        { prompt: '哪个是票？', icons: ['ice_cream', 'ticket', 'popcorn'], correct: 1 },
        { prompt: '哪个是果汁？', icons: ['juice_glass', 'ice_cream', 'ticket'], correct: 0 },
        { prompt: '哪个是冰淇淋？', icons: ['popcorn', 'juice_glass', 'ice_cream'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk2_l138_cinema_outline',
    colour: {
      example: { label: '爆米花', color: 'yellow' },
      regions: [
        { label: '3D眼镜', color: 'black' },
        { label: '屏幕', color: 'blue' },
        { label: '票', color: 'red' },
        { label: '果汁', color: 'orange' },
        { label: '冰淇淋', color: 'pink' },
      ],
    },
  },
  // L139 — 机场 (airport)
  139: {
    theme: '机场',
    dragSceneId: 'zh_hsk2_l139_airport',
    dragNames: ['小英', '小明', '小丽', '小华', '小红'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小英。', a: '小英' },
        { q: '有几架飞机？', say: '有三架飞机。', a: '三' },
      ],
      questions: [
        { prompt: '有几个行李箱？', say: '有两个行李箱。', accepted: [...numAns(2), '两'] },
        { prompt: '有几张票？', say: '有四张票。', accepted: numAns(4) },
        { prompt: '有几张地图？', say: '有五张地图。', accepted: numAns(5) },
        { prompt: '他几岁？', say: '他九岁。', accepted: numAns(9) },
        { prompt: '飞机几点起飞？', say: '飞机八点起飞。', accepted: [...numAns(8), '八点'] },
      ],
    },
    match: {
      example: { name: '小英', iconId: 'plane', say: '小英坐了飞机。' },
      items: [
        { name: '小明', iconId: 'suitcase', say: '小明拉了行李箱。' },
        { name: '小丽', iconId: 'ticket', say: '小丽拿了机票。' },
        { name: '小华', iconId: 'map', say: '小华看了地图。' },
        { name: '小红', iconId: 'globe', say: '小红转了地球仪。' },
        { name: '小刚', iconId: 'compass', say: '小刚用了指南针。' },
      ],
      distractors: ['bus'],
    },
    tick: {
      example: { prompt: '哪个是飞机？', icons: ['plane', 'suitcase', 'ticket'], correct: 0 },
      questions: [
        { prompt: '哪个是行李箱？', icons: ['ticket', 'suitcase', 'plane'], correct: 1 },
        { prompt: '哪个是机票？', icons: ['ticket', 'map', 'globe'], correct: 0 },
        { prompt: '哪个是地图？', icons: ['globe', 'map', 'compass'], correct: 1 },
        { prompt: '哪个是地球仪？', icons: ['globe', 'compass', 'map'], correct: 0 },
        { prompt: '哪个是指南针？', icons: ['plane', 'globe', 'compass'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk2_l139_airport_outline',
    colour: {
      example: { label: '飞机', color: 'blue' },
      regions: [
        { label: '行李箱', color: 'brown' },
        { label: '机票', color: 'yellow' },
        { label: '地图', color: 'orange' },
        { label: '地球仪', color: 'green' },
        { label: '指南针', color: 'red' },
      ],
    },
  },
  // L140 — 复习 (HSK2 big review)
  140: {
    theme: '复习',
    dragSceneId: 'zh_hsk2_l140_review',
    dragNames: ['小明', '小红', '小华', '小丽', '小刚'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小明。', a: '小明' },
        { q: '有几个球？', say: '有三个球。', a: '三' },
      ],
      questions: [
        { prompt: '有几把吉他？', say: '有两把吉他。', accepted: [...numAns(2), '两'] },
        { prompt: '有几只狮子？', say: '有四只狮子。', accepted: numAns(4) },
        { prompt: '有几个比萨？', say: '有五个比萨。', accepted: numAns(5) },
        { prompt: '他几岁？', say: '他八岁。', accepted: numAns(8) },
        { prompt: '现在几点？', say: '现在七点。', accepted: [...numAns(7), '七点'] },
      ],
    },
    match: {
      example: { name: '小明', iconId: 'soccer_ball', say: '小明踢了足球。' },
      items: [
        { name: '小红', iconId: 'guitar', say: '小红弹了吉他。' },
        { name: '小华', iconId: 'lion', say: '小华看了狮子。' },
        { name: '小英', iconId: 'pizza', say: '小英吃了比萨。' },
        { name: '小丽', iconId: 'plane', say: '小丽坐了飞机。' },
        { name: '小刚', iconId: 'camera', say: '小刚拍了照片。' },
      ],
      distractors: ['book'],
    },
    tick: {
      example: { prompt: '哪个是足球？', icons: ['soccer_ball', 'guitar', 'lion'], correct: 0 },
      questions: [
        { prompt: '哪个是吉他？', icons: ['lion', 'guitar', 'soccer_ball'], correct: 1 },
        { prompt: '哪个是狮子？', icons: ['lion', 'pizza', 'plane'], correct: 0 },
        { prompt: '哪个是比萨？', icons: ['plane', 'pizza', 'camera'], correct: 1 },
        { prompt: '哪个是飞机？', icons: ['plane', 'camera', 'guitar'], correct: 0 },
        { prompt: '哪个是照相机？', icons: ['lion', 'pizza', 'camera'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk2_l140_review_outline',
    colour: {
      example: { label: '足球', color: 'black' },
      regions: [
        { label: '吉他', color: 'brown' },
        { label: '狮子', color: 'yellow' },
        { label: '比萨', color: 'red' },
        { label: '飞机', color: 'blue' },
        { label: '照相机', color: 'grey' },
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

/** HSK band (1/2/3) + 1-based index within the band, from a 101+ level number. */
function zhBand(levelNumber: number): { band: 1 | 2 | 3; start: number; idx: number } {
  const band = levelNumber >= 141 ? 3 : levelNumber >= 121 ? 2 : 1;
  const start = band === 3 ? 141 : band === 2 ? 121 : 101;
  return { band, start, idx: levelNumber - start + 1 };
}

function makeZhLevel(levelNumber: number): ExamLevel {
  const idx = levelNumber - 100; // template fallback only ever runs for HSK1
  const def = ZH_LEVEL_DEFS[levelNumber];
  const { band, idx: idxInBand } = zhBand(levelNumber);

  let parts: ExamLevel['parts'];
  if (def?.match) {
    // HSK2+ : 5-part with Matching at p3 (tick→p4, colour→p5).
    parts = [
      zhDrag(levelNumber, def),
      zhWrite(levelNumber, def),
      zhMatch(levelNumber, def.match, 3),
      zhTick(levelNumber, def, 4),
      zhColour(levelNumber, def, 5),
    ];
  } else if (def) {
    parts = [zhDrag(levelNumber, def), zhWrite(levelNumber, def), zhTick(levelNumber, def), zhColour(levelNumber, def)];
  } else {
    parts = [tmplDrag(levelNumber, idx), tmplWrite(levelNumber, idx), tmplTick(levelNumber), tmplColour(levelNumber, idx)];
  }

  // Engine difficulty hint (time limit) rises with the band.
  const difficulty = band === 3 ? 'flyers' : band === 2 ? 'movers' : 'starters';
  const timeLimitSec = (band === 3 ? 40 : band === 2 ? 35 : 30) * 60;
  return {
    levelNumber,
    difficulty,
    title: def ? `HSK ${band} · ${idxInBand} — ${def.theme}` : `HSK ${band} · ${idxInBand}`,
    description: `Bài thi nghe tiếng Trung HSK${band} — nghe, ghép tên, viết, chọn, tô màu.`,
    timeLimitSec,
    parts,
  };
}

/** All curated Chinese levels (HSK1 101-120, HSK2 121+, …) — built from the
 *  level numbers present in ZH_LEVEL_DEFS, ascending. */
export const allLevelsZh: ExamLevel[] = Object.keys(ZH_LEVEL_DEFS)
  .map(Number)
  .sort((a, b) => a - b)
  .map((levelNumber) => makeZhLevel(levelNumber));

export function getLevelZh(levelNumber: number): ExamLevel | undefined {
  return allLevelsZh.find((l) => l.levelNumber === levelNumber);
}
