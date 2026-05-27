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

  // ─── HSK3 (L141-160): 5-part, hardest (过/会/比 grammar in clues) ─────────
  // L141 — 科学课 (science class)
  141: {
    theme: '科学课',
    dragSceneId: 'zh_hsk3_l141_science',
    dragNames: ['小明', '小红', '小华', '小英', '小刚'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小明。', a: '小明' },
        { q: '有几个显微镜？', say: '有两个显微镜。', a: '二' },
      ],
      questions: [
        { prompt: '有几个试管？', say: '有三个试管。', accepted: numAns(3) },
        { prompt: '有几块磁铁？', say: '有四块磁铁。', accepted: numAns(4) },
        { prompt: '有几把尺子？', say: '有五把尺子。', accepted: numAns(5) },
        { prompt: '他几岁？', say: '他十岁。', accepted: numAns(10) },
        { prompt: '现在几点？', say: '现在八点。', accepted: [...numAns(8), '八点'] },
      ],
    },
    match: {
      example: { name: '小明', iconId: 'microscope', say: '小明用过显微镜。' },
      items: [
        { name: '小红', iconId: 'test_tube', say: '小红用过试管。' },
        { name: '小华', iconId: 'magnet', say: '小华玩过磁铁。' },
        { name: '小英', iconId: 'ruler', say: '小英用了尺子。' },
        { name: '小丽', iconId: 'flask', say: '小丽用过烧瓶。' },
        { name: '小刚', iconId: 'light_bulb', say: '小刚会让灯泡发光。' },
      ],
      distractors: ['robot'],
    },
    tick: {
      example: { prompt: '哪个是显微镜？', icons: ['microscope', 'test_tube', 'magnet'], correct: 0 },
      questions: [
        { prompt: '哪个是试管？', icons: ['magnet', 'test_tube', 'microscope'], correct: 1 },
        { prompt: '哪个是磁铁？', icons: ['magnet', 'ruler', 'flask'], correct: 0 },
        { prompt: '哪个是尺子？', icons: ['flask', 'ruler', 'magnet'], correct: 1 },
        { prompt: '哪个是烧瓶？', icons: ['flask', 'light_bulb', 'ruler'], correct: 0 },
        { prompt: '哪个是灯泡？', icons: ['ruler', 'flask', 'light_bulb'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk3_l141_science_outline',
    colour: {
      example: { label: '显微镜', color: 'grey' },
      regions: [
        { label: '试管', color: 'blue' },
        { label: '磁铁', color: 'red' },
        { label: '尺子', color: 'yellow' },
        { label: '烧瓶', color: 'green' },
        { label: '灯泡', color: 'orange' },
      ],
    },
  },
  // L142 — 科技馆 (technology)
  142: {
    theme: '科技馆',
    dragSceneId: 'zh_hsk3_l142_tech',
    dragNames: ['小红', '小华', '小明', '小英', '小丽'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小红。', a: '小红' },
        { q: '有几个机器人？', say: '有两个机器人。', a: '二' },
      ],
      questions: [
        { prompt: '有几台电脑？', say: '有三台电脑。', accepted: numAns(3) },
        { prompt: '有几个平板？', say: '有四个平板。', accepted: numAns(4) },
        { prompt: '有几台相机？', say: '有五台相机。', accepted: numAns(5) },
        { prompt: '她几岁？', say: '她十岁。', accepted: numAns(10) },
        { prompt: '现在几点？', say: '现在七点。', accepted: [...numAns(7), '七点'] },
      ],
    },
    match: {
      example: { name: '小红', iconId: 'robot', say: '小红做过机器人。' },
      items: [
        { name: '小华', iconId: 'laptop', say: '小华会用电脑。' },
        { name: '小明', iconId: 'tablet', say: '小明用过平板。' },
        { name: '小英', iconId: 'tv', say: '小英看了电视。' },
        { name: '小丽', iconId: 'camera', say: '小丽用过相机。' },
        { name: '小刚', iconId: 'light_bulb', say: '小刚修过灯泡。' },
      ],
      distractors: ['book'],
    },
    tick: {
      example: { prompt: '哪个是机器人？', icons: ['robot', 'laptop', 'tablet'], correct: 0 },
      questions: [
        { prompt: '哪个是电脑？', icons: ['tablet', 'laptop', 'robot'], correct: 1 },
        { prompt: '哪个是平板？', icons: ['tablet', 'tv', 'camera'], correct: 0 },
        { prompt: '哪个是电视？', icons: ['camera', 'tv', 'laptop'], correct: 1 },
        { prompt: '哪个是相机？', icons: ['camera', 'light_bulb', 'robot'], correct: 0 },
        { prompt: '哪个是灯泡？', icons: ['robot', 'tablet', 'light_bulb'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk3_l142_tech_outline',
    colour: {
      example: { label: '机器人', color: 'grey' },
      regions: [
        { label: '电脑', color: 'blue' },
        { label: '平板', color: 'black' },
        { label: '电视', color: 'brown' },
        { label: '相机', color: 'red' },
        { label: '灯泡', color: 'yellow' },
      ],
    },
  },
  // L143 — 环保 (environment)
  143: {
    theme: '环保',
    dragSceneId: 'zh_hsk3_l143_eco',
    dragNames: ['小华', '小明', '小红', '小英', '小丽'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小华。', a: '小华' },
        { q: '种了几棵树？', say: '种了三棵树。', a: '三' },
      ],
      questions: [
        { prompt: '有几个垃圾桶？', say: '有两个垃圾桶。', accepted: [...numAns(2), '两'] },
        { prompt: '摘了几朵花？', say: '摘了四朵花。', accepted: numAns(4) },
        { prompt: '有几块太阳能板？', say: '有五块太阳能板。', accepted: numAns(5) },
        { prompt: '他几岁？', say: '他九岁。', accepted: numAns(9) },
        { prompt: '现在几点？', say: '现在六点。', accepted: [...numAns(6), '六点'] },
      ],
    },
    match: {
      example: { name: '小华', iconId: 'recycle_bin', say: '小华会回收垃圾。' },
      items: [
        { name: '小明', iconId: 'solar_panel', say: '小明修过太阳能板。' },
        { name: '小红', iconId: 'tree', say: '小红种过树。' },
        { name: '小英', iconId: 'flower', say: '小英种了花。' },
        { name: '小丽', iconId: 'watering_can', say: '小丽浇过水。' },
        { name: '小刚', iconId: 'globe', say: '小刚爱护地球。' },
      ],
      distractors: ['bucket'],
    },
    tick: {
      example: { prompt: '哪个是垃圾桶？', icons: ['recycle_bin', 'solar_panel', 'tree'], correct: 0 },
      questions: [
        { prompt: '哪个是太阳能板？', icons: ['tree', 'solar_panel', 'recycle_bin'], correct: 1 },
        { prompt: '哪个是树？', icons: ['tree', 'flower', 'globe'], correct: 0 },
        { prompt: '哪个是花？', icons: ['globe', 'flower', 'tree'], correct: 1 },
        { prompt: '哪个是浇水壶？', icons: ['watering_can', 'globe', 'flower'], correct: 0 },
        { prompt: '哪个是地球仪？', icons: ['tree', 'flower', 'globe'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk3_l143_eco_outline',
    colour: {
      example: { label: '垃圾桶', color: 'green' },
      regions: [
        { label: '太阳能板', color: 'blue' },
        { label: '树', color: 'brown' },
        { label: '花', color: 'pink' },
        { label: '浇水壶', color: 'grey' },
        { label: '地球', color: 'orange' },
      ],
    },
  },
  // L144 — 未来城市 (future city)
  144: {
    theme: '未来城市',
    dragSceneId: 'zh_hsk3_l144_future',
    dragNames: ['小英', '小明', '小丽', '小华', '小红'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小英。', a: '小英' },
        { q: '有几个机器人？', say: '有三个机器人。', a: '三' },
      ],
      questions: [
        { prompt: '有几个火箭？', say: '有两个火箭。', accepted: [...numAns(2), '两'] },
        { prompt: '有几台电脑？', say: '有四台电脑。', accepted: numAns(4) },
        { prompt: '有几块太阳能板？', say: '有五块太阳能板。', accepted: numAns(5) },
        { prompt: '他几岁？', say: '他十岁。', accepted: numAns(10) },
        { prompt: '现在几点？', say: '现在八点。', accepted: [...numAns(8), '八点'] },
      ],
    },
    match: {
      example: { name: '小英', iconId: 'robot', say: '小英会修机器人。' },
      items: [
        { name: '小明', iconId: 'rocket', say: '小明坐过火箭。' },
        { name: '小丽', iconId: 'solar_panel', say: '小丽用过太阳能板。' },
        { name: '小华', iconId: 'light_bulb', say: '小华发明过新灯泡。' },
        { name: '小红', iconId: 'laptop', say: '小红会用电脑。' },
        { name: '小刚', iconId: 'tv', say: '小刚看了大电视。' },
      ],
      distractors: ['book'],
    },
    tick: {
      example: { prompt: '哪个是机器人？', icons: ['robot', 'rocket', 'solar_panel'], correct: 0 },
      questions: [
        { prompt: '哪个是火箭？', icons: ['solar_panel', 'rocket', 'robot'], correct: 1 },
        { prompt: '哪个是太阳能板？', icons: ['solar_panel', 'light_bulb', 'laptop'], correct: 0 },
        { prompt: '哪个是灯泡？', icons: ['laptop', 'light_bulb', 'tv'], correct: 1 },
        { prompt: '哪个是电脑？', icons: ['laptop', 'tv', 'robot'], correct: 0 },
        { prompt: '哪个是电视？', icons: ['robot', 'laptop', 'tv'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk3_l144_future_outline',
    colour: {
      example: { label: '机器人', color: 'grey' },
      regions: [
        { label: '火箭', color: 'red' },
        { label: '太阳能板', color: 'blue' },
        { label: '灯泡', color: 'yellow' },
        { label: '电脑', color: 'green' },
        { label: '电视', color: 'brown' },
      ],
    },
  },
  // L145 — 世界旅行 (world travel)
  145: {
    theme: '世界旅行',
    dragSceneId: 'zh_hsk3_l145_worldtravel',
    dragNames: ['小红', '小明', '小华', '小丽', '小刚'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小红。', a: '小红' },
        { q: '有几架飞机？', say: '有两架飞机。', a: '二' },
      ],
      questions: [
        { prompt: '有几个地球仪？', say: '有三个地球仪。', accepted: numAns(3) },
        { prompt: '有几个指南针？', say: '有四个指南针。', accepted: numAns(4) },
        { prompt: '有几张地图？', say: '有五张地图。', accepted: numAns(5) },
        { prompt: '他去过几个国家？', say: '他去过六个国家。', accepted: numAns(6) },
        { prompt: '现在几点？', say: '现在九点。', accepted: [...numAns(9), '九点'] },
      ],
    },
    match: {
      example: { name: '小红', iconId: 'globe', say: '小红看过地球仪。' },
      items: [
        { name: '小明', iconId: 'plane', say: '小明坐过飞机。' },
        { name: '小华', iconId: 'compass', say: '小华用过指南针。' },
        { name: '小丽', iconId: 'map', say: '小丽会看地图。' },
        { name: '小刚', iconId: 'suitcase', say: '小刚带了行李箱。' },
        { name: '小英', iconId: 'camera', say: '小英拍过照片。' },
      ],
      distractors: ['bus'],
    },
    tick: {
      example: { prompt: '哪个是地球仪？', icons: ['globe', 'plane', 'compass'], correct: 0 },
      questions: [
        { prompt: '哪个是飞机？', icons: ['compass', 'plane', 'globe'], correct: 1 },
        { prompt: '哪个是指南针？', icons: ['compass', 'map', 'suitcase'], correct: 0 },
        { prompt: '哪个是地图？', icons: ['suitcase', 'map', 'compass'], correct: 1 },
        { prompt: '哪个是行李箱？', icons: ['suitcase', 'camera', 'globe'], correct: 0 },
        { prompt: '哪个是相机？', icons: ['globe', 'map', 'camera'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk3_l145_worldtravel_outline',
    colour: {
      example: { label: '地球仪', color: 'blue' },
      regions: [
        { label: '飞机', color: 'red' },
        { label: '指南针', color: 'yellow' },
        { label: '地图', color: 'orange' },
        { label: '行李箱', color: 'brown' },
        { label: '相机', color: 'grey' },
      ],
    },
  },

  // L146 — 电影制作 (film making)
  146: {
    theme: '电影制作',
    dragSceneId: 'zh_hsk3_l146_film',
    dragNames: ['小明', '小红', '小华', '小英', '小刚'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小明。', a: '小明' },
        { q: '有几台摄像机？', say: '有两台摄像机。', a: '二' },
      ],
      questions: [
        { prompt: '有几个话筒？', say: '有三个话筒。', accepted: numAns(3) },
        { prompt: '有几个三脚架？', say: '有四个三脚架。', accepted: numAns(4) },
        { prompt: '写了几页剧本？', say: '写了五页剧本。', accepted: numAns(5) },
        { prompt: '他几岁？', say: '他十岁。', accepted: numAns(10) },
        { prompt: '现在几点？', say: '现在八点。', accepted: [...numAns(8), '八点'] },
      ],
    },
    match: {
      example: { name: '小明', iconId: 'video_camera', say: '小明用过摄像机。' },
      items: [
        { name: '小红', iconId: 'clapperboard', say: '小红用过场记板。' },
        { name: '小华', iconId: 'script_paper', say: '小华写过剧本。' },
        { name: '小英', iconId: 'light_bulb', say: '小英会打灯光。' },
        { name: '小丽', iconId: 'microphone', say: '小丽拿过话筒。' },
        { name: '小刚', iconId: 'tripod', say: '小刚架过三脚架。' },
      ],
      distractors: ['photo'],
    },
    tick: {
      example: { prompt: '哪个是摄像机？', icons: ['video_camera', 'clapperboard', 'script_paper'], correct: 0 },
      questions: [
        { prompt: '哪个是场记板？', icons: ['script_paper', 'clapperboard', 'video_camera'], correct: 1 },
        { prompt: '哪个是剧本？', icons: ['script_paper', 'light_bulb', 'microphone'], correct: 0 },
        { prompt: '哪个是灯光？', icons: ['microphone', 'light_bulb', 'tripod'], correct: 1 },
        { prompt: '哪个是话筒？', icons: ['microphone', 'tripod', 'photo'], correct: 0 },
        { prompt: '哪个是三脚架？', icons: ['photo', 'clapperboard', 'tripod'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk3_l146_film_outline',
    colour: {
      example: { label: '摄像机', color: 'black' },
      regions: [
        { label: '场记板', color: 'brown' },
        { label: '剧本', color: 'blue' },
        { label: '灯光', color: 'yellow' },
        { label: '话筒', color: 'red' },
        { label: '三脚架', color: 'grey' },
      ],
    },
  },
  // L147 — 海洋探险 (ocean adventure)
  147: {
    theme: '海洋探险',
    dragSceneId: 'zh_hsk3_l147_ocean',
    dragNames: ['小红', '小华', '小明', '小英', '小丽'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小红。', a: '小红' },
        { q: '有几条船？', say: '有两条船。', a: '二' },
      ],
      questions: [
        { prompt: '有几个救生圈？', say: '有三个救生圈。', accepted: numAns(3) },
        { prompt: '有几支桨？', say: '有四支桨。', accepted: numAns(4) },
        { prompt: '钓了几条鱼？', say: '钓了五条鱼。', accepted: numAns(5) },
        { prompt: '她几岁？', say: '她九岁。', accepted: numAns(9) },
        { prompt: '现在几点？', say: '现在七点。', accepted: [...numAns(7), '七点'] },
      ],
    },
    match: {
      example: { name: '小红', iconId: 'sailboat', say: '小红开过帆船。' },
      items: [
        { name: '小华', iconId: 'sail', say: '小华升过帆。' },
        { name: '小明', iconId: 'life_ring', say: '小明扔过救生圈。' },
        { name: '小英', iconId: 'oar', say: '小英会用桨。' },
        { name: '小丽', iconId: 'fish', say: '小丽钓过鱼。' },
        { name: '小刚', iconId: 'rope', say: '小刚系过绳子。' },
      ],
      distractors: ['bucket'],
    },
    tick: {
      example: { prompt: '哪个是帆船？', icons: ['sailboat', 'sail', 'life_ring'], correct: 0 },
      questions: [
        { prompt: '哪个是帆？', icons: ['life_ring', 'sail', 'sailboat'], correct: 1 },
        { prompt: '哪个是救生圈？', icons: ['life_ring', 'oar', 'fish'], correct: 0 },
        { prompt: '哪个是桨？', icons: ['fish', 'oar', 'rope'], correct: 1 },
        { prompt: '哪个是鱼？', icons: ['fish', 'rope', 'sail'], correct: 0 },
        { prompt: '哪个是绳子？', icons: ['oar', 'fish', 'rope'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk3_l147_ocean_outline',
    colour: {
      example: { label: '帆船', color: 'red' },
      regions: [
        { label: '帆', color: 'yellow' },
        { label: '救生圈', color: 'orange' },
        { label: '桨', color: 'brown' },
        { label: '鱼', color: 'blue' },
        { label: '绳子', color: 'green' },
      ],
    },
  },
  // L148 — 古代博物馆 (ancient museum)
  148: {
    theme: '古代博物馆',
    dragSceneId: 'zh_hsk3_l148_museum',
    dragNames: ['小华', '小明', '小红', '小英', '小丽'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小华。', a: '小华' },
        { q: '有几个雕像？', say: '有两个雕像。', a: '二' },
      ],
      questions: [
        { prompt: '有几个面具？', say: '有三个面具。', accepted: numAns(3) },
        { prompt: '有几个花瓶？', say: '有四个花瓶。', accepted: numAns(4) },
        { prompt: '有几块化石？', say: '有五块化石。', accepted: numAns(5) },
        { prompt: '他几岁？', say: '他十岁。', accepted: numAns(10) },
        { prompt: '现在几点？', say: '现在六点。', accepted: [...numAns(6), '六点'] },
      ],
    },
    match: {
      example: { name: '小华', iconId: 'mummy', say: '小华看过木乃伊。' },
      items: [
        { name: '小明', iconId: 'mask', say: '小明看过金面具。' },
        { name: '小红', iconId: 'fossil', say: '小红找过化石。' },
        { name: '小英', iconId: 'statue', say: '小英画过雕像。' },
        { name: '小丽', iconId: 'vase', say: '小丽拍过花瓶。' },
        { name: '小刚', iconId: 'dinosaur', say: '小刚研究过恐龙。' },
      ],
      distractors: ['painting'],
    },
    tick: {
      example: { prompt: '哪个是木乃伊？', icons: ['mummy', 'mask', 'fossil'], correct: 0 },
      questions: [
        { prompt: '哪个是面具？', icons: ['fossil', 'mask', 'mummy'], correct: 1 },
        { prompt: '哪个是化石？', icons: ['fossil', 'statue', 'vase'], correct: 0 },
        { prompt: '哪个是雕像？', icons: ['vase', 'statue', 'dinosaur'], correct: 1 },
        { prompt: '哪个是花瓶？', icons: ['vase', 'dinosaur', 'mask'], correct: 0 },
        { prompt: '哪个是恐龙？', icons: ['mummy', 'vase', 'dinosaur'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk3_l148_museum_outline',
    colour: {
      example: { label: '木乃伊', color: 'brown' },
      regions: [
        { label: '面具', color: 'yellow' },
        { label: '化石', color: 'grey' },
        { label: '雕像', color: 'blue' },
        { label: '花瓶', color: 'red' },
        { label: '恐龙', color: 'green' },
      ],
    },
  },
  // L149 — 戏剧节 (drama festival)
  149: {
    theme: '戏剧节',
    dragSceneId: 'zh_hsk3_l149_drama',
    dragNames: ['小英', '小明', '小丽', '小华', '小红'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小英。', a: '小英' },
        { q: '有几个面具？', say: '有两个面具。', a: '二' },
      ],
      questions: [
        { prompt: '有几个话筒？', say: '有三个话筒。', accepted: numAns(3) },
        { prompt: '有几张剧本？', say: '有四张剧本。', accepted: numAns(4) },
        { prompt: '有几条彩带？', say: '有五条彩带。', accepted: numAns(5) },
        { prompt: '她几岁？', say: '她九岁。', accepted: numAns(9) },
        { prompt: '现在几点？', say: '现在八点。', accepted: [...numAns(8), '八点'] },
      ],
    },
    match: {
      example: { name: '小英', iconId: 'mask', say: '小英戴过面具。' },
      items: [
        { name: '小明', iconId: 'curtain', say: '小明拉开过幕布。' },
        { name: '小丽', iconId: 'microphone', say: '小丽对着话筒说过话。' },
        { name: '小华', iconId: 'music_note', say: '小华唱过歌。' },
        { name: '小红', iconId: 'script_paper', say: '小红背过剧本。' },
        { name: '小刚', iconId: 'dance_ribbon', say: '小刚挥过彩带。' },
      ],
      distractors: ['camera'],
    },
    tick: {
      example: { prompt: '哪个是面具？', icons: ['mask', 'curtain', 'microphone'], correct: 0 },
      questions: [
        { prompt: '哪个是幕布？', icons: ['microphone', 'curtain', 'mask'], correct: 1 },
        { prompt: '哪个是话筒？', icons: ['microphone', 'music_note', 'script_paper'], correct: 0 },
        { prompt: '哪个是音符？', icons: ['script_paper', 'music_note', 'dance_ribbon'], correct: 1 },
        { prompt: '哪个是剧本？', icons: ['script_paper', 'dance_ribbon', 'curtain'], correct: 0 },
        { prompt: '哪个是彩带？', icons: ['mask', 'curtain', 'dance_ribbon'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk3_l149_drama_outline',
    colour: {
      example: { label: '面具', color: 'red' },
      regions: [
        { label: '幕布', color: 'purple' },
        { label: '话筒', color: 'grey' },
        { label: '音符', color: 'blue' },
        { label: '剧本', color: 'yellow' },
        { label: '彩带', color: 'pink' },
      ],
    },
  },
  // L150 — 登山 (mountaineering)
  150: {
    theme: '登山',
    dragSceneId: 'zh_hsk3_l150_mountain',
    dragNames: ['小红', '小明', '小华', '小丽', '小刚'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小红。', a: '小红' },
        { q: '有几座山？', say: '有两座山。', a: '二' },
      ],
      questions: [
        { prompt: '有几个指南针？', say: '有三个指南针。', accepted: numAns(3) },
        { prompt: '有几个背包？', say: '有四个背包。', accepted: numAns(4) },
        { prompt: '有几张地图？', say: '有五张地图。', accepted: numAns(5) },
        { prompt: '他几岁？', say: '他十岁。', accepted: numAns(10) },
        { prompt: '现在几点？', say: '现在七点。', accepted: [...numAns(7), '七点'] },
      ],
    },
    match: {
      example: { name: '小红', iconId: 'mountain', say: '小红爬过那座山。' },
      items: [
        { name: '小明', iconId: 'compass', say: '小明用过指南针。' },
        { name: '小华', iconId: 'map', say: '小华会看地图。' },
        { name: '小丽', iconId: 'binoculars', say: '小丽用过望远镜。' },
        { name: '小刚', iconId: 'backpack', say: '小刚背过背包。' },
        { name: '小英', iconId: 'rope', say: '小英拉过绳子。' },
      ],
      distractors: ['tent'],
    },
    tick: {
      example: { prompt: '哪个是山？', icons: ['mountain', 'compass', 'map'], correct: 0 },
      questions: [
        { prompt: '哪个是指南针？', icons: ['map', 'compass', 'mountain'], correct: 1 },
        { prompt: '哪个是地图？', icons: ['map', 'binoculars', 'backpack'], correct: 0 },
        { prompt: '哪个是望远镜？', icons: ['backpack', 'binoculars', 'rope'], correct: 1 },
        { prompt: '哪个是背包？', icons: ['backpack', 'rope', 'tent'], correct: 0 },
        { prompt: '哪个是绳子？', icons: ['tent', 'backpack', 'rope'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk3_l150_mountain_outline',
    colour: {
      example: { label: '山', color: 'grey' },
      regions: [
        { label: '指南针', color: 'red' },
        { label: '地图', color: 'yellow' },
        { label: '望远镜', color: 'black' },
        { label: '背包', color: 'green' },
        { label: '绳子', color: 'brown' },
      ],
    },
  },

  // L151 — 新闻 (news reporting)
  151: {
    theme: '新闻',
    dragSceneId: 'zh_hsk3_l151_news',
    dragNames: ['小明', '小红', '小华', '小英', '小刚'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小明。', a: '小明' },
        { q: '有几个话筒？', say: '有两个话筒。', a: '二' },
      ],
      questions: [
        { prompt: '有几台电脑？', say: '有三台电脑。', accepted: numAns(3) },
        { prompt: '有几台相机？', say: '有四台相机。', accepted: numAns(4) },
        { prompt: '有几张海报？', say: '有五张海报。', accepted: numAns(5) },
        { prompt: '他几岁？', say: '他十岁。', accepted: numAns(10) },
        { prompt: '现在几点？', say: '现在八点。', accepted: [...numAns(8), '八点'] },
      ],
    },
    match: {
      example: { name: '小明', iconId: 'microphone', say: '小明对着话筒报过新闻。' },
      items: [
        { name: '小红', iconId: 'video_camera', say: '小红用过摄像机。' },
        { name: '小华', iconId: 'laptop', say: '小华用电脑写过稿。' },
        { name: '小英', iconId: 'camera', say: '小英拍过照片。' },
        { name: '小丽', iconId: 'script_paper', say: '小丽念过稿子。' },
        { name: '小刚', iconId: 'poster', say: '小刚做过海报。' },
      ],
      distractors: ['tablet'],
    },
    tick: {
      example: { prompt: '哪个是话筒？', icons: ['microphone', 'video_camera', 'laptop'], correct: 0 },
      questions: [
        { prompt: '哪个是摄像机？', icons: ['laptop', 'video_camera', 'microphone'], correct: 1 },
        { prompt: '哪个是电脑？', icons: ['laptop', 'camera', 'script_paper'], correct: 0 },
        { prompt: '哪个是相机？', icons: ['script_paper', 'camera', 'poster'], correct: 1 },
        { prompt: '哪个是稿子？', icons: ['script_paper', 'poster', 'tablet'], correct: 0 },
        { prompt: '哪个是海报？', icons: ['tablet', 'camera', 'poster'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk3_l151_news_outline',
    colour: {
      example: { label: '话筒', color: 'grey' },
      regions: [
        { label: '摄像机', color: 'black' },
        { label: '电脑', color: 'blue' },
        { label: '相机', color: 'red' },
        { label: '稿子', color: 'yellow' },
        { label: '海报', color: 'green' },
      ],
    },
  },
  // L152 — 职业体验 (job experience)
  152: {
    theme: '职业体验',
    dragSceneId: 'zh_hsk3_l152_jobs',
    dragNames: ['小红', '小华', '小明', '小英', '小丽'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小红。', a: '小红' },
        { q: '有几个医生？', say: '有两个医生。', a: '二' },
      ],
      questions: [
        { prompt: '有几个厨师？', say: '有三个厨师。', accepted: numAns(3) },
        { prompt: '有几把锤子？', say: '有四把锤子。', accepted: numAns(4) },
        { prompt: '有几台电脑？', say: '有五台电脑。', accepted: numAns(5) },
        { prompt: '她几岁？', say: '她十岁。', accepted: numAns(10) },
        { prompt: '现在几点？', say: '现在七点。', accepted: [...numAns(7), '七点'] },
      ],
    },
    match: {
      example: { name: '小红', iconId: 'stethoscope', say: '小红当过医生。' },
      items: [
        { name: '小华', iconId: 'wrench', say: '小华会用扳手。' },
        { name: '小明', iconId: 'hammer', say: '小明用过锤子。' },
        { name: '小英', iconId: 'chef_hat', say: '小英当过厨师。' },
        { name: '小丽', iconId: 'paintbrush', say: '小丽当过画家。' },
        { name: '小刚', iconId: 'laptop', say: '小刚用电脑工作过。' },
      ],
      distractors: ['book'],
    },
    tick: {
      example: { prompt: '哪个是听诊器？', icons: ['stethoscope', 'wrench', 'hammer'], correct: 0 },
      questions: [
        { prompt: '哪个是扳手？', icons: ['hammer', 'wrench', 'stethoscope'], correct: 1 },
        { prompt: '哪个是锤子？', icons: ['hammer', 'chef_hat', 'paintbrush'], correct: 0 },
        { prompt: '哪个是厨师帽？', icons: ['paintbrush', 'chef_hat', 'laptop'], correct: 1 },
        { prompt: '哪个是画笔？', icons: ['paintbrush', 'laptop', 'wrench'], correct: 0 },
        { prompt: '哪个是电脑？', icons: ['hammer', 'chef_hat', 'laptop'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk3_l152_jobs_outline',
    colour: {
      example: { label: '听诊器', color: 'blue' },
      regions: [
        { label: '扳手', color: 'grey' },
        { label: '锤子', color: 'brown' },
        { label: '厨师帽', color: 'red' },
        { label: '画笔', color: 'yellow' },
        { label: '电脑', color: 'green' },
      ],
    },
  },
  // L153 — 美食节 (food festival)
  153: {
    theme: '美食节',
    dragSceneId: 'zh_hsk3_l153_foodfest',
    dragNames: ['小华', '小明', '小红', '小英', '小丽'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小华。', a: '小华' },
        { q: '有几碗面条？', say: '有两碗面条。', a: '二' },
      ],
      questions: [
        { prompt: '有几个汉堡？', say: '有三个汉堡。', accepted: numAns(3) },
        { prompt: '有几盘沙拉？', say: '有四盘沙拉。', accepted: numAns(4) },
        { prompt: '有几个冰淇淋？', say: '有五个冰淇淋。', accepted: numAns(5) },
        { prompt: '他几岁？', say: '他九岁。', accepted: numAns(9) },
        { prompt: '现在几点？', say: '现在六点。', accepted: [...numAns(6), '六点'] },
      ],
    },
    match: {
      example: { name: '小华', iconId: 'noodles', say: '小华吃过面条。' },
      items: [
        { name: '小明', iconId: 'cheese', say: '小明尝过奶酪。' },
        { name: '小红', iconId: 'burger', say: '小红吃过汉堡。' },
        { name: '小英', iconId: 'salad', say: '小英吃过沙拉。' },
        { name: '小丽', iconId: 'ice_cream', say: '小丽吃过冰淇淋。' },
        { name: '小刚', iconId: 'juice_glass', say: '小刚喝过果汁。' },
      ],
      distractors: ['pizza'],
    },
    tick: {
      example: { prompt: '哪个是面条？', icons: ['noodles', 'cheese', 'burger'], correct: 0 },
      questions: [
        { prompt: '哪个是奶酪？', icons: ['burger', 'cheese', 'noodles'], correct: 1 },
        { prompt: '哪个是汉堡？', icons: ['burger', 'salad', 'ice_cream'], correct: 0 },
        { prompt: '哪个是沙拉？', icons: ['ice_cream', 'salad', 'cheese'], correct: 1 },
        { prompt: '哪个是冰淇淋？', icons: ['ice_cream', 'juice_glass', 'noodles'], correct: 0 },
        { prompt: '哪个是果汁？', icons: ['pizza', 'salad', 'juice_glass'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk3_l153_foodfest_outline',
    colour: {
      example: { label: '面条', color: 'yellow' },
      regions: [
        { label: '奶酪', color: 'orange' },
        { label: '汉堡', color: 'brown' },
        { label: '沙拉', color: 'green' },
        { label: '冰淇淋', color: 'pink' },
        { label: '果汁', color: 'red' },
      ],
    },
  },
  // L154 — 时间胶囊 (time capsule)
  154: {
    theme: '时间胶囊',
    dragSceneId: 'zh_hsk3_l154_timecapsule',
    dragNames: ['小英', '小明', '小丽', '小华', '小红'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小英。', a: '小英' },
        { q: '有几个盒子？', say: '有两个盒子。', a: '二' },
      ],
      questions: [
        { prompt: '有几张照片？', say: '有三张照片。', accepted: numAns(3) },
        { prompt: '有几封信？', say: '有四封信。', accepted: numAns(4) },
        { prompt: '有几个硬币？', say: '有五个硬币。', accepted: numAns(5) },
        { prompt: '她几岁？', say: '她十岁。', accepted: numAns(10) },
        { prompt: '现在几点？', say: '现在八点。', accepted: [...numAns(8), '八点'] },
      ],
    },
    match: {
      example: { name: '小英', iconId: 'box', say: '小英装满了盒子。' },
      items: [
        { name: '小明', iconId: 'photo', say: '小明放了一张照片。' },
        { name: '小丽', iconId: 'envelope', say: '小丽写了一封信。' },
        { name: '小华', iconId: 'teddy', say: '小华放了一个玩具。' },
        { name: '小红', iconId: 'coin', say: '小红放了一个硬币。' },
        { name: '小刚', iconId: 'tablet', say: '小刚录了一段视频。' },
      ],
      distractors: ['book'],
    },
    tick: {
      example: { prompt: '哪个是盒子？', icons: ['box', 'photo', 'envelope'], correct: 0 },
      questions: [
        { prompt: '哪个是照片？', icons: ['envelope', 'photo', 'box'], correct: 1 },
        { prompt: '哪个是信？', icons: ['envelope', 'teddy', 'coin'], correct: 0 },
        { prompt: '哪个是玩具熊？', icons: ['coin', 'teddy', 'tablet'], correct: 1 },
        { prompt: '哪个是硬币？', icons: ['coin', 'tablet', 'photo'], correct: 0 },
        { prompt: '哪个是平板？', icons: ['box', 'coin', 'tablet'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk3_l154_timecapsule_outline',
    colour: {
      example: { label: '盒子', color: 'brown' },
      regions: [
        { label: '照片', color: 'blue' },
        { label: '信', color: 'yellow' },
        { label: '玩具熊', color: 'orange' },
        { label: '硬币', color: 'grey' },
        { label: '平板', color: 'black' },
      ],
    },
  },
  // L155 — 笔友 (pen pals)
  155: {
    theme: '笔友',
    dragSceneId: 'zh_hsk3_l155_penpals',
    dragNames: ['小红', '小明', '小华', '小丽', '小刚'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小红。', a: '小红' },
        { q: '有几封信？', say: '有三封信。', a: '三' },
      ],
      questions: [
        { prompt: '有几张邮票？', say: '有两张邮票。', accepted: [...numAns(2), '两'] },
        { prompt: '有几个包裹？', say: '有四个包裹。', accepted: numAns(4) },
        { prompt: '有几支笔？', say: '有五支笔。', accepted: numAns(5) },
        { prompt: '他有几个笔友？', say: '他有六个笔友。', accepted: numAns(6) },
        { prompt: '现在几点？', say: '现在七点。', accepted: [...numAns(7), '七点'] },
      ],
    },
    match: {
      example: { name: '小红', iconId: 'envelope', say: '小红写过信。' },
      items: [
        { name: '小明', iconId: 'stamp', say: '小明贴过邮票。' },
        { name: '小华', iconId: 'postbox', say: '小华去过邮筒。' },
        { name: '小丽', iconId: 'parcel', say: '小丽寄过包裹。' },
        { name: '小刚', iconId: 'globe', say: '小刚在地球仪上找过国家。' },
        { name: '小英', iconId: 'pen', say: '小英用过钢笔。' },
      ],
      distractors: ['box'],
    },
    tick: {
      example: { prompt: '哪个是信封？', icons: ['envelope', 'stamp', 'postbox'], correct: 0 },
      questions: [
        { prompt: '哪个是邮票？', icons: ['postbox', 'stamp', 'envelope'], correct: 1 },
        { prompt: '哪个是邮筒？', icons: ['postbox', 'parcel', 'globe'], correct: 0 },
        { prompt: '哪个是包裹？', icons: ['globe', 'parcel', 'pen'], correct: 1 },
        { prompt: '哪个是地球仪？', icons: ['globe', 'pen', 'stamp'], correct: 0 },
        { prompt: '哪个是钢笔？', icons: ['box', 'parcel', 'pen'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk3_l155_penpals_outline',
    colour: {
      example: { label: '信封', color: 'yellow' },
      regions: [
        { label: '邮票', color: 'red' },
        { label: '邮筒', color: 'green' },
        { label: '包裹', color: 'brown' },
        { label: '地球仪', color: 'blue' },
        { label: '钢笔', color: 'black' },
      ],
    },
  },

  // L156 — 学校运动会 (school olympics)
  156: {
    theme: '学校运动会',
    dragSceneId: 'zh_hsk3_l156_olympics',
    dragNames: ['小明', '小红', '小华', '小英', '小刚'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小明。', a: '小明' },
        { q: '有几块奖牌？', say: '有两块奖牌。', a: '二' },
      ],
      questions: [
        { prompt: '有几个奖杯？', say: '有三个奖杯。', accepted: numAns(3) },
        { prompt: '有几面旗子？', say: '有四面旗子。', accepted: numAns(4) },
        { prompt: '有几个球？', say: '有五个球。', accepted: numAns(5) },
        { prompt: '他跑了第几名？', say: '他跑了第一名。', accepted: [...numAns(1), '第一'] },
        { prompt: '现在几点？', say: '现在八点。', accepted: [...numAns(8), '八点'] },
      ],
    },
    match: {
      example: { name: '小明', iconId: 'torch', say: '小明举过火炬。' },
      items: [
        { name: '小红', iconId: 'medal', say: '小红得过奖牌。' },
        { name: '小华', iconId: 'trophy', say: '小华拿过奖杯。' },
        { name: '小英', iconId: 'flag', say: '小英举过旗子。' },
        { name: '小丽', iconId: 'ball', say: '小丽扔过球。' },
        { name: '小刚', iconId: 'whistle', say: '小刚吹过哨子。' },
      ],
      distractors: ['soccer_ball'],
    },
    tick: {
      example: { prompt: '哪个是火炬？', icons: ['torch', 'medal', 'trophy'], correct: 0 },
      questions: [
        { prompt: '哪个是奖牌？', icons: ['trophy', 'medal', 'torch'], correct: 1 },
        { prompt: '哪个是奖杯？', icons: ['trophy', 'flag', 'ball'], correct: 0 },
        { prompt: '哪个是旗子？', icons: ['ball', 'flag', 'whistle'], correct: 1 },
        { prompt: '哪个是球？', icons: ['ball', 'whistle', 'torch'], correct: 0 },
        { prompt: '哪个是哨子？', icons: ['flag', 'ball', 'whistle'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk3_l156_olympics_outline',
    colour: {
      example: { label: '火炬', color: 'orange' },
      regions: [
        { label: '奖牌', color: 'yellow' },
        { label: '奖杯', color: 'red' },
        { label: '旗子', color: 'green' },
        { label: '球', color: 'blue' },
        { label: '哨子', color: 'grey' },
      ],
    },
  },
  // L157 — 慈善活动 (charity event)
  157: {
    theme: '慈善活动',
    dragSceneId: 'zh_hsk3_l157_charity',
    dragNames: ['小红', '小华', '小明', '小英', '小丽'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小红。', a: '小红' },
        { q: '有几个募捐箱？', say: '有两个募捐箱。', a: '二' },
      ],
      questions: [
        { prompt: '有几张海报？', say: '有三张海报。', accepted: numAns(3) },
        { prompt: '卖了几块蛋糕？', say: '卖了四块蛋糕。', accepted: numAns(4) },
        { prompt: '卖了几张票？', say: '卖了五张票。', accepted: numAns(5) },
        { prompt: '她几岁？', say: '她十岁。', accepted: numAns(10) },
        { prompt: '现在几点？', say: '现在七点。', accepted: [...numAns(7), '七点'] },
      ],
    },
    match: {
      example: { name: '小红', iconId: 'coin', say: '小红捐过钱。' },
      items: [
        { name: '小华', iconId: 'donation_box', say: '小华提过募捐箱。' },
        { name: '小明', iconId: 'poster', say: '小明做过海报。' },
        { name: '小英', iconId: 'cake', say: '小英卖过蛋糕。' },
        { name: '小丽', iconId: 'ticket', say: '小丽卖过票。' },
        { name: '小刚', iconId: 'flag', say: '小刚挥过旗子。' },
      ],
      distractors: ['star'],
    },
    tick: {
      example: { prompt: '哪个是钱？', icons: ['coin', 'donation_box', 'poster'], correct: 0 },
      questions: [
        { prompt: '哪个是募捐箱？', icons: ['poster', 'donation_box', 'coin'], correct: 1 },
        { prompt: '哪个是海报？', icons: ['poster', 'cake', 'ticket'], correct: 0 },
        { prompt: '哪个是蛋糕？', icons: ['ticket', 'cake', 'flag'], correct: 1 },
        { prompt: '哪个是票？', icons: ['ticket', 'flag', 'coin'], correct: 0 },
        { prompt: '哪个是旗子？', icons: ['coin', 'cake', 'flag'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk3_l157_charity_outline',
    colour: {
      example: { label: '钱', color: 'yellow' },
      regions: [
        { label: '募捐箱', color: 'red' },
        { label: '海报', color: 'blue' },
        { label: '蛋糕', color: 'pink' },
        { label: '票', color: 'orange' },
        { label: '旗子', color: 'green' },
      ],
    },
  },
  // L158 — 太空旅行 (space travel)
  158: {
    theme: '太空旅行',
    dragSceneId: 'zh_hsk3_l158_spacetravel',
    dragNames: ['小华', '小明', '小红', '小英', '小丽'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小华。', a: '小华' },
        { q: '有几个火箭？', say: '有两个火箭。', a: '二' },
      ],
      questions: [
        { prompt: '有几颗星星？', say: '有五颗星星。', accepted: numAns(5) },
        { prompt: '有几个行星？', say: '有三个行星。', accepted: numAns(3) },
        { prompt: '有几个头盔？', say: '有四个头盔。', accepted: numAns(4) },
        { prompt: '他几岁？', say: '他十岁。', accepted: numAns(10) },
        { prompt: '有几个月亮？', say: '有一个月亮。', accepted: numAns(1) },
      ],
    },
    match: {
      example: { name: '小华', iconId: 'rocket', say: '小华坐过火箭。' },
      items: [
        { name: '小明', iconId: 'telescope', say: '小明用过望远镜。' },
        { name: '小红', iconId: 'planet', say: '小红研究过行星。' },
        { name: '小英', iconId: 'astronaut_helmet', say: '小英戴过头盔。' },
        { name: '小丽', iconId: 'star', say: '小丽数过星星。' },
        { name: '小刚', iconId: 'moon', say: '小刚去过月亮。' },
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
    colourSceneId: 'zh_hsk3_l158_spacetravel_outline',
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
  // L159 — 毕业典礼 (graduation)
  159: {
    theme: '毕业典礼',
    dragSceneId: 'zh_hsk3_l159_graduation',
    dragNames: ['小英', '小明', '小丽', '小华', '小红'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小英。', a: '小英' },
        { q: '有几顶帽子？', say: '有两顶帽子。', a: '二' },
      ],
      questions: [
        { prompt: '有几张证书？', say: '有三张证书。', accepted: numAns(3) },
        { prompt: '有几束花？', say: '有四束花。', accepted: numAns(4) },
        { prompt: '有几个蛋糕？', say: '有五个蛋糕。', accepted: numAns(5) },
        { prompt: '她几岁？', say: '她十岁。', accepted: numAns(10) },
        { prompt: '现在几点？', say: '现在八点。', accepted: [...numAns(8), '八点'] },
      ],
    },
    match: {
      example: { name: '小英', iconId: 'graduation_cap', say: '小英戴过毕业帽。' },
      items: [
        { name: '小明', iconId: 'diploma', say: '小明拿到过证书。' },
        { name: '小丽', iconId: 'flower', say: '小丽收到过花。' },
        { name: '小华', iconId: 'cake', say: '小华切过蛋糕。' },
        { name: '小红', iconId: 'camera', say: '小红拍过照片。' },
        { name: '小刚', iconId: 'star', say: '小刚得过金星。' },
      ],
      distractors: ['trophy'],
    },
    tick: {
      example: { prompt: '哪个是毕业帽？', icons: ['graduation_cap', 'diploma', 'flower'], correct: 0 },
      questions: [
        { prompt: '哪个是证书？', icons: ['flower', 'diploma', 'graduation_cap'], correct: 1 },
        { prompt: '哪个是花？', icons: ['flower', 'cake', 'camera'], correct: 0 },
        { prompt: '哪个是蛋糕？', icons: ['camera', 'cake', 'star'], correct: 1 },
        { prompt: '哪个是相机？', icons: ['camera', 'star', 'diploma'], correct: 0 },
        { prompt: '哪个是星星？', icons: ['cake', 'flower', 'star'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk3_l159_graduation_outline',
    colour: {
      example: { label: '毕业帽', color: 'black' },
      regions: [
        { label: '证书', color: 'yellow' },
        { label: '花', color: 'pink' },
        { label: '蛋糕', color: 'red' },
        { label: '相机', color: 'grey' },
        { label: '星星', color: 'orange' },
      ],
    },
  },
  // L160 — 大复习 (HSK3 final review)
  160: {
    theme: '大复习',
    dragSceneId: 'zh_hsk3_l160_review',
    dragNames: ['小红', '小明', '小华', '小丽', '小刚'],
    write: {
      examples: [
        { q: '这是谁？', say: '这是小红。', a: '小红' },
        { q: '有几个火箭？', say: '有两个火箭。', a: '二' },
      ],
      questions: [
        { prompt: '有几台相机？', say: '有三台相机。', accepted: numAns(3) },
        { prompt: '有几个奖杯？', say: '有四个奖杯。', accepted: numAns(4) },
        { prompt: '有几个地球仪？', say: '有五个地球仪。', accepted: numAns(5) },
        { prompt: '他几岁？', say: '他十岁。', accepted: numAns(10) },
        { prompt: '现在几点？', say: '现在九点。', accepted: [...numAns(9), '九点'] },
      ],
    },
    match: {
      example: { name: '小红', iconId: 'microscope', say: '小红用过显微镜。' },
      items: [
        { name: '小明', iconId: 'rocket', say: '小明坐过火箭。' },
        { name: '小华', iconId: 'globe', say: '小华看过地球仪。' },
        { name: '小英', iconId: 'camera', say: '小英拍过照片。' },
        { name: '小丽', iconId: 'trophy', say: '小丽拿过奖杯。' },
        { name: '小刚', iconId: 'graduation_cap', say: '小刚戴过毕业帽。' },
      ],
      distractors: ['book'],
    },
    tick: {
      example: { prompt: '哪个是显微镜？', icons: ['microscope', 'rocket', 'globe'], correct: 0 },
      questions: [
        { prompt: '哪个是火箭？', icons: ['globe', 'rocket', 'microscope'], correct: 1 },
        { prompt: '哪个是地球仪？', icons: ['globe', 'camera', 'trophy'], correct: 0 },
        { prompt: '哪个是相机？', icons: ['trophy', 'camera', 'graduation_cap'], correct: 1 },
        { prompt: '哪个是奖杯？', icons: ['trophy', 'graduation_cap', 'rocket'], correct: 0 },
        { prompt: '哪个是毕业帽？', icons: ['globe', 'trophy', 'graduation_cap'], correct: 2 },
      ],
    },
    colourSceneId: 'zh_hsk3_l160_review_outline',
    colour: {
      example: { label: '显微镜', color: 'grey' },
      regions: [
        { label: '火箭', color: 'red' },
        { label: '地球仪', color: 'blue' },
        { label: '相机', color: 'black' },
        { label: '奖杯', color: 'yellow' },
        { label: '毕业帽', color: 'green' },
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
