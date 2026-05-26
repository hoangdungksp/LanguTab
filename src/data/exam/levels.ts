import type { ExamLevel, DragNamePart, WritePart, TickPart, ColourPart } from '../../types';
import {
  DRAG_SCENE_CHARS,
  buildDragNameAudioScript,
  STARTERS_CHARS_BY_LEVEL,
  STARTERS_SCENE_IDS_BY_LEVEL,
  MOVERS_CHARS_BY_LEVEL,
  MOVERS_SCENE_IDS_BY_LEVEL,
  FLYERS_CHARS_BY_LEVEL,
  FLYERS_SCENE_IDS_BY_LEVEL,
} from './sceneCharacters';

/**
 * Scene IDs that match the backend `worker/src/exam/scenes.ts` registry.
 * Keep in sync — the backend is authoritative for AI generation prompts;
 * this frontend type exists just for compile-time safety on level config.
 */
type SceneId =
  | 'park_kids' | 'beach_family' | 'classroom' | 'playground'
  | 'kitchen_baking' | 'birthday_party'
  | 'pet_girl' | 'family_dinner' | 'weekend_activities'
  | 'garden_objects_outline' | 'bedroom_outline' | 'farm_outline'
  // D-18 Phase 5: Starters L1-L20 per-level unique drag scenes
  | 'starter_l1_petshop' | 'starter_l2_family_dinner' | 'starter_l3_weekend_park'
  | 'starter_l4_birthday' | 'starter_l5_school' | 'starter_l6_beach'
  | 'starter_l7_garden' | 'starter_l8_toyshop' | 'starter_l9_sports'
  | 'starter_l10_picnic' | 'starter_l11_library' | 'starter_l12_bicycle'
  | 'starter_l13_cooking' | 'starter_l14_swimming' | 'starter_l15_farm'
  | 'starter_l16_pets_home' | 'starter_l17_sleepover' | 'starter_l18_garden_play'
  | 'starter_l19_train' | 'starter_l20_snow';

/**
 * Level generator + 20 starter levels.
 *
 * 300 levels manually-curated isn't feasible. Approach:
 *   1. Hand-craft templates for each part type (10+ scene variants)
 *   2. Generator picks a template + word pool + theme to produce a level
 *   3. We ship ~20 demo levels showing variety; expansion to 300 is straight
 *      forward by calling makeLevel() with new parameters
 *
 * The audio scripts are scripted (not procedurally generated) per level so
 * the audio is always coherent. This means each level has hand-written
 * narration, but the structure (drop zones, options, regions) follows a
 * shared template.
 */

// ─── Reusable name pools per difficulty ────────────────────────────────

const STARTER_NAMES = [
  ['Tom', 'May', 'Sam', 'Ann', 'Kim'],
  ['Ben', 'Sue', 'Dan', 'Pat', 'Bob'],
  ['Mia', 'Leo', 'Eva', 'Jay', 'Ivy'],
  ['Anna', 'Mark', 'Lisa', 'Paul', 'Lucy'],
];

/**
 * Movers (A2) name pool — slightly longer/more complex names than Starters.
 * Cambridge YLE Movers exam features names like "Daisy", "Charlie", "Sophie"
 * — 4-6 letters, varied syllables. Movers learners can spell these correctly.
 */
const MOVER_NAMES = [
  ['Charlie', 'Daisy', 'Oliver', 'Hannah', 'Jacob', 'Sophie'],
  ['Lucas', 'Grace', 'Ethan', 'Chloe', 'Noah', 'Lily'],
  ['Mason', 'Emma', 'Ryan', 'Zoe', 'Adam', 'Maya'],
  ['Luke', 'Ruby', 'Henry', 'Ella', 'Jack', 'Mila'],
  ['Owen', 'Holly', 'Aaron', 'Lara', 'Eric', 'Nina'],
];

/**
 * Flyers (B1) name pool — full names including some less common, multi-syllable
 * ones to challenge the spelling component. Cambridge YLE Flyers expects
 * learners to handle names like "Jasmine", "Sebastian", "Madeleine".
 */
const FLYER_NAMES = [
  ['Sebastian', 'Madeleine', 'Christopher', 'Penelope', 'Nathaniel', 'Genevieve'],
  ['Alexander', 'Elizabeth', 'Theodore', 'Annabelle', 'Maximilian', 'Charlotte'],
  ['Jasmine', 'Vincent', 'Catherine', 'Reginald', 'Felicity', 'Bartholomew'],
  ['Beatrice', 'Augustus', 'Cordelia', 'Frederick', 'Evangeline', 'Montgomery'],
  ['Wilhelmina', 'Cornelius', 'Anastasia', 'Reginald', 'Persephone', 'Algernon'],
];

// ─── Template builders ─────────────────────────────────────────────────

/**
 * Park-themed Part 1: 6 drop zones in a 3×2 grid.
 *
 * Sprint 4.9.2: Audio script now built from shared character registry
 * (`sceneCharacters.ts`) so audio describes appearance + activity matching
 * what AI Flux was prompted to render. Layout still 3×2 grid for predictable
 * drop zones; admin can fine-tune positions via Sprint 4.9 calibration tool.
 */
function makeParkDragPart(
  partId: string,
  audioKey: string,
  exampleName: string,
  names: [string, string, string, string, string],
): DragNamePart {
  return buildGridDragPart(partId, audioKey, 'park_kids', 'child', exampleName, names);
}

/** Beach-themed Part 1 — same 3×2 grid structure, different scene. */
function makeBeachDragPart(
  partId: string,
  audioKey: string,
  exampleName: string,
  names: [string, string, string, string, string],
): DragNamePart {
  return buildGridDragPart(partId, audioKey, 'beach_family', 'person', exampleName, names);
}

// ─── Drag-name helper for grid-based scenes ───────────────────────────

/**
 * All grid-based drag scenes (park/beach/classroom/etc) share the same
 * 3×2 zone layout. Sprint 4.9.2 redesign: audio scripts now describe
 * APPEARANCE + ACTIVITY of each character (e.g., "Tom is wearing a red
 * shirt and is flying a kite") instead of position ("Tom is in the
 * top-left"). This is pedagogically valuable — kids learn vocabulary —
 * and matches Cambridge YLE Listening style.
 *
 * Trait descriptions come from `sceneCharacters.ts` registry which is
 * the single source of truth shared with the AI Flux scene prompts on
 * the worker side.
 */
function buildGridDragPart(
  partId: string,
  audioKey: string,
  sceneId: SceneId,
  // subjectNoun param kept for backward compat but no longer used in audio
  _subjectNoun: string,
  exampleName: string,
  names: [string, string, string, string, string],
): DragNamePart {
  const zones = [
    { id: 'zone_tl', x: 0.02, y: 0.05, width: 0.30, height: 0.45, label: 'top-left' },
    { id: 'zone_tm', x: 0.35, y: 0.05, width: 0.30, height: 0.45, label: 'top-middle' },
    { id: 'zone_tr', x: 0.68, y: 0.05, width: 0.30, height: 0.45, label: 'top-right' },
    { id: 'zone_bl', x: 0.02, y: 0.50, width: 0.30, height: 0.45, label: 'bottom-left' },
    { id: 'zone_bm', x: 0.35, y: 0.50, width: 0.30, height: 0.45, label: 'bottom-middle' },
    { id: 'zone_br', x: 0.68, y: 0.50, width: 0.30, height: 0.45, label: 'bottom-right' },
  ];

  const exampleZoneId = zones[0].id;
  const remainingZones = zones.slice(1).map((z) => z.id);
  const correctMapping: Record<string, string> = {};
  names.forEach((name, i) => {
    correctMapping[name] = remainingZones[i];
  });

  // Build name-by-zone for audio script
  const nameForZone: Record<string, string> = { [exampleZoneId]: exampleName };
  for (const [name, zoneId] of Object.entries(correctMapping)) {
    nameForZone[zoneId] = name;
  }

  // Pull character traits from registry; fall back to position-based
  // wording if the scene isn't registered (defensive — should never happen
  // for the 6 known drag scenes).
  const sceneChars = DRAG_SCENE_CHARS[sceneId];
  const audioScript = sceneChars
    ? buildDragNameAudioScript(sceneChars, nameForZone, exampleZoneId)
    : `Look at the picture. ${exampleName} is in the top-left. ` +
      names.map((n, i) => `${n} is in zone ${remainingZones[i]}.`).join(' ');

  return {
    type: 'listening_drag_name',
    partId,
    audioKey,
    audioScript,
    sceneId,
    dropZones: zones,
    exampleName,
    exampleZoneId,
    names,
    correctMapping,
  };
}

function makeClassroomDragPart(
  partId: string, audioKey: string, exampleName: string,
  names: [string, string, string, string, string],
) {
  return buildGridDragPart(partId, audioKey, 'classroom', 'student', exampleName, names);
}

/**
 * D-18 Phase 5: Per-level Starters drag part — each level has its OWN
 * unique sceneId + character set (looked up from STARTERS_CHARS_BY_LEVEL).
 *
 * Falls back to PARK_KIDS_CHARS if level number not in registry (safety).
 */
function makeStarterDragPart(
  partId: string,
  audioKey: string,
  exampleName: string,
  names: [string, string, string, string, string],
  levelNumber: number,
): DragNamePart {
  const sceneChars = STARTERS_CHARS_BY_LEVEL[levelNumber];
  const sceneId = STARTERS_SCENE_IDS_BY_LEVEL[levelNumber] as SceneId | undefined;
  if (!sceneChars || !sceneId) {
    // Defensive fallback — should never hit for levels 1-20
    return buildGridDragPart(partId, audioKey, 'park_kids', 'child', exampleName, names);
  }

  const zones = [
    { id: 'zone_tl', x: 0.02, y: 0.05, width: 0.30, height: 0.45, label: 'top-left' },
    { id: 'zone_tm', x: 0.35, y: 0.05, width: 0.30, height: 0.45, label: 'top-middle' },
    { id: 'zone_tr', x: 0.68, y: 0.05, width: 0.30, height: 0.45, label: 'top-right' },
    { id: 'zone_bl', x: 0.02, y: 0.50, width: 0.30, height: 0.45, label: 'bottom-left' },
    { id: 'zone_bm', x: 0.35, y: 0.50, width: 0.30, height: 0.45, label: 'bottom-middle' },
    { id: 'zone_br', x: 0.68, y: 0.50, width: 0.30, height: 0.45, label: 'bottom-right' },
  ];

  const exampleZoneId = zones[0].id;
  const remainingZones = zones.slice(1).map((z) => z.id);
  const correctMapping: Record<string, string> = {};
  names.forEach((name, i) => {
    correctMapping[name] = remainingZones[i];
  });

  const nameForZone: Record<string, string> = { [exampleZoneId]: exampleName };
  for (const [name, zoneId] of Object.entries(correctMapping)) {
    nameForZone[zoneId] = name;
  }

  const audioScript = buildDragNameAudioScript(sceneChars, nameForZone, exampleZoneId);

  return {
    type: 'listening_drag_name',
    partId,
    audioKey,
    audioScript,
    sceneId,
    dropZones: zones,
    exampleName,
    exampleZoneId,
    names,
    correctMapping,
  };
}

/**
 * D-18 Phase 3: Per-level Movers drag part — same per-level scene approach
 * as makeStarterDragPart but reads from the MOVERS registry. Only called
 * when MOVERS_CHARS_BY_LEVEL has an entry for the level (L21-L30); L31-L40
 * fall back to the rotation drag scenes in makeLevel.
 */
function makeMoverDragPart(
  partId: string,
  audioKey: string,
  exampleName: string,
  names: [string, string, string, string, string],
  levelNumber: number,
): DragNamePart {
  const sceneChars = MOVERS_CHARS_BY_LEVEL[levelNumber];
  const sceneId = MOVERS_SCENE_IDS_BY_LEVEL[levelNumber];
  if (!sceneChars || !sceneId) {
    return buildGridDragPart(partId, audioKey, 'park_kids', 'child', exampleName, names);
  }

  const zones = [
    { id: 'zone_tl', x: 0.02, y: 0.05, width: 0.30, height: 0.45, label: 'top-left' },
    { id: 'zone_tm', x: 0.35, y: 0.05, width: 0.30, height: 0.45, label: 'top-middle' },
    { id: 'zone_tr', x: 0.68, y: 0.05, width: 0.30, height: 0.45, label: 'top-right' },
    { id: 'zone_bl', x: 0.02, y: 0.50, width: 0.30, height: 0.45, label: 'bottom-left' },
    { id: 'zone_bm', x: 0.35, y: 0.50, width: 0.30, height: 0.45, label: 'bottom-middle' },
    { id: 'zone_br', x: 0.68, y: 0.50, width: 0.30, height: 0.45, label: 'bottom-right' },
  ];

  const exampleZoneId = zones[0].id;
  const remainingZones = zones.slice(1).map((z) => z.id);
  const correctMapping: Record<string, string> = {};
  names.forEach((name, i) => {
    correctMapping[name] = remainingZones[i];
  });

  const nameForZone: Record<string, string> = { [exampleZoneId]: exampleName };
  for (const [name, zoneId] of Object.entries(correctMapping)) {
    nameForZone[zoneId] = name;
  }

  const audioScript = buildDragNameAudioScript(sceneChars, nameForZone, exampleZoneId);

  return {
    type: 'listening_drag_name',
    partId,
    audioKey,
    audioScript,
    sceneId,
    dropZones: zones,
    exampleName,
    exampleZoneId,
    names,
    correctMapping,
  };
}

/**
 * D-18 Phase 4: Per-level Flyers drag part — reads the FLYERS registry.
 * Only called when FLYERS_CHARS_BY_LEVEL has an entry (L41-L50); L51-L60
 * fall back to rotation drag scenes in makeLevel.
 */
function makeFlyerDragPart(
  partId: string,
  audioKey: string,
  exampleName: string,
  names: [string, string, string, string, string],
  levelNumber: number,
): DragNamePart {
  const sceneChars = FLYERS_CHARS_BY_LEVEL[levelNumber];
  const sceneId = FLYERS_SCENE_IDS_BY_LEVEL[levelNumber];
  if (!sceneChars || !sceneId) {
    return buildGridDragPart(partId, audioKey, 'park_kids', 'child', exampleName, names);
  }

  const zones = [
    { id: 'zone_tl', x: 0.02, y: 0.05, width: 0.30, height: 0.45, label: 'top-left' },
    { id: 'zone_tm', x: 0.35, y: 0.05, width: 0.30, height: 0.45, label: 'top-middle' },
    { id: 'zone_tr', x: 0.68, y: 0.05, width: 0.30, height: 0.45, label: 'top-right' },
    { id: 'zone_bl', x: 0.02, y: 0.50, width: 0.30, height: 0.45, label: 'bottom-left' },
    { id: 'zone_bm', x: 0.35, y: 0.50, width: 0.30, height: 0.45, label: 'bottom-middle' },
    { id: 'zone_br', x: 0.68, y: 0.50, width: 0.30, height: 0.45, label: 'bottom-right' },
  ];

  const exampleZoneId = zones[0].id;
  const remainingZones = zones.slice(1).map((z) => z.id);
  const correctMapping: Record<string, string> = {};
  names.forEach((name, i) => {
    correctMapping[name] = remainingZones[i];
  });

  const nameForZone: Record<string, string> = { [exampleZoneId]: exampleName };
  for (const [name, zoneId] of Object.entries(correctMapping)) {
    nameForZone[zoneId] = name;
  }

  const audioScript = buildDragNameAudioScript(sceneChars, nameForZone, exampleZoneId);

  return {
    type: 'listening_drag_name',
    partId,
    audioKey,
    audioScript,
    sceneId,
    dropZones: zones,
    exampleName,
    exampleZoneId,
    names,
    correctMapping,
  };
}

function makePlaygroundDragPart(
  partId: string, audioKey: string, exampleName: string,
  names: [string, string, string, string, string],
) {
  return buildGridDragPart(partId, audioKey, 'playground', 'child', exampleName, names);
}
function makeKitchenDragPart(
  partId: string, audioKey: string, exampleName: string,
  names: [string, string, string, string, string],
) {
  return buildGridDragPart(partId, audioKey, 'kitchen_baking', 'person', exampleName, names);
}
function makeBirthdayDragPart(
  partId: string, audioKey: string, exampleName: string,
  names: [string, string, string, string, string],
) {
  return buildGridDragPart(partId, audioKey, 'birthday_party', 'child', exampleName, names);
}

// ─── Part 2: Listen & write — Movers difficulty ───────────────────────

/**
 * Movers write part: A2 difficulty. Uses past tense narratives and
 * comparatives. Vocab pool ~600 words. 3 scenes rotate (idx 0/1/2):
 *   0 → family_dinner: "What did the family eat last night?"
 *   1 → weekend_activities: "What did Lucy do on Saturday?"
 *   2 → pet_girl: "How old was the cat last year?"
 */
function makeMoverWritePart(partId: string, audioKey: string, sceneIdx: number): WritePart {
  if (sceneIdx === 1) {
    return {
      type: 'listening_write',
      partId,
      audioKey,
      audioScript:
        `Read the question. Listen and write a name or a number. There are two examples. ` +
        `Where did Lucy go yesterday? Lucy went to the park. ` +
        `Who did she go with? She went with her friend Tom. T-O-M. Tom. ` +
        `Now listen and write the answers. ` +
        `One. What time did Lucy leave home? She left at half past nine. Nine thirty. ` +
        `Two. How many cousins came to the park? Four cousins came. Four. ` +
        `Three. What was the name of the dog? The dog was called Buddy. B-U-D-D-Y. ` +
        `Four. What did they eat? They ate sandwiches. Sandwich. S-A-N-D-W-I-C-H. ` +
        `Five. How long did they stay? They stayed for three hours. Three.`,
      sceneId: 'weekend_activities',
      examples: [
        { question: 'Where did Lucy go?', answer: 'park' },
        { question: 'Who with?', answer: 'Tom' },
      ],
      questions: [
        { questionId: 'q1', prompt: 'What time did Lucy leave home?', acceptedAnswers: ['9:30', 'nine thirty', 'half past nine'] },
        { questionId: 'q2', prompt: 'How many cousins came?', acceptedAnswers: ['4', 'four'] },
        { questionId: 'q3', prompt: 'What was the name of the dog?', acceptedAnswers: ['Buddy', 'buddy'] },
        { questionId: 'q4', prompt: 'What did they eat?', acceptedAnswers: ['sandwich', 'sandwiches', 'Sandwich'] },
        { questionId: 'q5', prompt: 'How long did they stay?', suffix: 'hours', acceptedAnswers: ['3', 'three'] },
      ],
    };
  }
  if (sceneIdx === 0) {
    return {
      type: 'listening_write',
      partId,
      audioKey,
      audioScript:
        `Read the question. Listen and write a name or a number. There are two examples. ` +
        `What is for dinner tonight? It is fish and chips. Fish. ` +
        `Who cooks the dinner? Mum cooks. Mum. M-U-M. ` +
        `Now listen and write the answers. ` +
        `One. How many people are in the family? Five people. Five. ` +
        `Two. What is the cat called? The cat is called Tiger. T-I-G-E-R. ` +
        `Three. What does Dad drink? Dad drinks juice. Juice. J-U-I-C-E. ` +
        `Four. What time do they eat? They eat at seven. Seven o'clock. ` +
        `Five. How many slices of pizza are left? Two slices. Two.`,
      sceneId: 'family_dinner',
      examples: [
        { question: 'What is for dinner?', answer: 'fish' },
        { question: 'Who cooks?', answer: 'Mum' },
      ],
      questions: [
        { questionId: 'q1', prompt: 'How many people in the family?', acceptedAnswers: ['5', 'five'] },
        { questionId: 'q2', prompt: 'What is the cat called?', acceptedAnswers: ['Tiger', 'tiger'] },
        { questionId: 'q3', prompt: 'What does Dad drink?', acceptedAnswers: ['juice', 'Juice'] },
        { questionId: 'q4', prompt: 'What time do they eat?', acceptedAnswers: ['7', '7:00', 'seven'] },
        { questionId: 'q5', prompt: 'Slices of pizza left?', acceptedAnswers: ['2', 'two'] },
      ],
    };
  }
  // sceneIdx === 2: same as Starter pet_girl but with past tense audio
  return {
    type: 'listening_write',
    partId,
    audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `What was the gift for? It was for Lucy's birthday. Birthday. ` +
      `What was the name of the cat? The name was Sun. S-U-N. Sun. ` +
      `Now listen and write the answers. ` +
      `One. How old was the cat last year? It was five weeks old. Five. ` +
      `Two. How many brothers did the cat have? It had three brothers. Three. ` +
      `Three. What was the name of the pet shop? The shop was called Lucky. L-U-C-K-Y. ` +
      `Four. Where was the pet shop? It was on Rose street. Rose. R-O-S-E. ` +
      `Five. How much milk did the cat drink? Four cups of milk. Four.`,
    sceneId: 'pet_girl',
    examples: [
      { question: 'What was the gift for?', answer: 'birthday' },
      { question: 'Cat name?', answer: 'SUN' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How old was the cat last year?', suffix: 'weeks old', acceptedAnswers: ['5', 'five'] },
      { questionId: 'q2', prompt: 'How many brothers?', acceptedAnswers: ['3', 'three'] },
      { questionId: 'q3', prompt: 'Pet shop name?', acceptedAnswers: ['Lucky', 'lucky'] },
      { questionId: 'q4', prompt: 'Where was the shop?', prefix: 'on', suffix: 'street', acceptedAnswers: ['Rose', 'rose'] },
      { questionId: 'q5', prompt: 'How much milk?', suffix: 'cups', acceptedAnswers: ['4', 'four'] },
    ],
  };
}

// ─── D-18 Phase 3: Movers per-level Write parts (L21-L30) ──────────────
// A1-A2: past simple narratives, "What time / How many / What ... called".
// Each reuses its level's drag sceneId as the context image.

function makeMoverWriteL21(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write', partId, audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `Where did the children go last week? They went to summer camp. Camp. ` +
      `Who was the camp leader? His name was Sam. S-A-M. Sam. ` +
      `Now listen and write the answers. ` +
      `One. What day did they arrive at camp? They arrived on Monday. Monday. ` +
      `Two. How many tents did they put up? They put up six tents. Six. ` +
      `Three. What was the lake called? It was called Blue Lake. Blue. B-L-U-E. ` +
      `Four. What did they cook on the fire? They cooked sausages. Sausages. ` +
      `Five. How many days did they stay? They stayed for five days. Five.`,
    sceneId: 'mover_l21_summer_camp',
    examples: [
      { question: 'Where did they go?', answer: 'camp' },
      { question: 'Leader name?', answer: 'Sam' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'What day did they arrive?', acceptedAnswers: ['Monday', 'monday'] },
      { questionId: 'q2', prompt: 'How many tents?', acceptedAnswers: ['6', 'six'] },
      { questionId: 'q3', prompt: 'What was the lake called?', suffix: 'Lake', acceptedAnswers: ['Blue', 'blue'] },
      { questionId: 'q4', prompt: 'What did they cook on the fire?', acceptedAnswers: ['sausages', 'sausage', 'Sausages'] },
      { questionId: 'q5', prompt: 'How many days did they stay?', suffix: 'days', acceptedAnswers: ['5', 'five'] },
    ],
  };
}

function makeMoverWriteL22(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write', partId, audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `What lesson did the class have? They had a music lesson. Music. ` +
      `Who was the music teacher? Her name was Mrs Lee. L-E-E. Lee. ` +
      `Now listen and write the answers. ` +
      `One. What instrument did Charlie play? He played the drums. Drums. ` +
      `Two. How many guitars were in the room? There were three guitars. Three. ` +
      `Three. What time did the lesson start? It started at two o'clock. Two. ` +
      `Four. What was the song called? The song was called Sunshine. S-U-N-S-H-I-N-E. ` +
      `Five. How many children sang? Seven children sang. Seven.`,
    sceneId: 'mover_l22_music_lesson',
    examples: [
      { question: 'What lesson?', answer: 'music' },
      { question: 'Teacher name?', answer: 'Lee' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'What did Charlie play?', acceptedAnswers: ['drums', 'the drums', 'drum'] },
      { questionId: 'q2', prompt: 'How many guitars?', acceptedAnswers: ['3', 'three'] },
      { questionId: 'q3', prompt: 'What time did it start?', acceptedAnswers: ['2', '2:00', 'two'] },
      { questionId: 'q4', prompt: 'Song name?', acceptedAnswers: ['Sunshine', 'sunshine'] },
      { questionId: 'q5', prompt: 'How many children sang?', acceptedAnswers: ['7', 'seven'] },
    ],
  };
}

function makeMoverWriteL23(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write', partId, audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `What game did the children play? They played football. Football. ` +
      `What was the team called? The team was called the Tigers. T-I-G-E-R-S. ` +
      `Now listen and write the answers. ` +
      `One. How many goals did they score? They scored four goals. Four. ` +
      `Two. Who scored the first goal? Daisy scored it. D-A-I-S-Y. Daisy. ` +
      `Three. What colour were the shirts? The shirts were red. Red. ` +
      `Four. What time did the match finish? It finished at five o'clock. Five. ` +
      `Five. How many people watched? Eight people watched. Eight.`,
    sceneId: 'mover_l23_football_match',
    examples: [
      { question: 'What game?', answer: 'football' },
      { question: 'Team name?', answer: 'Tigers' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How many goals?', acceptedAnswers: ['4', 'four'] },
      { questionId: 'q2', prompt: 'Who scored first?', acceptedAnswers: ['Daisy', 'daisy'] },
      { questionId: 'q3', prompt: 'Shirt colour?', acceptedAnswers: ['red', 'Red'] },
      { questionId: 'q4', prompt: 'What time did it finish?', acceptedAnswers: ['5', '5:00', 'five'] },
      { questionId: 'q5', prompt: 'How many people watched?', acceptedAnswers: ['8', 'eight'] },
    ],
  };
}

function makeMoverWriteL24(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write', partId, audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `What class did the children go to? They went to a dance class. Dance. ` +
      `Who was the dance teacher? Her name was Miss Ray. R-A-Y. Ray. ` +
      `Now listen and write the answers. ` +
      `One. What day was the class? It was on Friday. Friday. ` +
      `Two. How many girls wore tutus? Five girls wore tutus. Five. ` +
      `Three. What colour was Grace's ribbon? It was purple. Purple. P-U-R-P-L-E. ` +
      `Four. What did they do at the end? They did a big jump. Jump. ` +
      `Five. How many minutes did they dance? They danced for thirty minutes. Thirty.`,
    sceneId: 'mover_l24_dance_class',
    examples: [
      { question: 'What class?', answer: 'dance' },
      { question: 'Teacher name?', answer: 'Ray' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'What day was the class?', acceptedAnswers: ['Friday', 'friday'] },
      { questionId: 'q2', prompt: 'How many girls wore tutus?', acceptedAnswers: ['5', 'five'] },
      { questionId: 'q3', prompt: "Grace's ribbon colour?", acceptedAnswers: ['purple', 'Purple'] },
      { questionId: 'q4', prompt: 'What did they do at the end?', acceptedAnswers: ['jump', 'a jump', 'jumped'] },
      { questionId: 'q5', prompt: 'How many minutes did they dance?', suffix: 'minutes', acceptedAnswers: ['30', 'thirty'] },
    ],
  };
}

function makeMoverWriteL25(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write', partId, audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `Where did the family eat dinner? At a restaurant. Restaurant. ` +
      `What was the restaurant called? It was called Bella's. B-E-L-L-A-S. Bella's. ` +
      `Now listen and write the answers. ` +
      `One. What did Dad order? He ordered a pizza. Pizza. ` +
      `Two. How many drinks did they buy? They bought four drinks. Four. ` +
      `Three. What was the waiter's name? His name was Mark. M-A-R-K. Mark. ` +
      `Four. What did Mum have for pudding? She had ice cream. Ice cream. ` +
      `Five. How much was the meal? The meal cost twenty pounds. Twenty.`,
    sceneId: 'mover_l25_restaurant',
    examples: [
      { question: 'Where did they eat?', answer: 'restaurant' },
      { question: 'Restaurant name?', answer: "Bella's" },
    ],
    questions: [
      { questionId: 'q1', prompt: 'What did Dad order?', acceptedAnswers: ['pizza', 'a pizza', 'Pizza'] },
      { questionId: 'q2', prompt: 'How many drinks?', acceptedAnswers: ['4', 'four'] },
      { questionId: 'q3', prompt: "Waiter's name?", acceptedAnswers: ['Mark', 'mark'] },
      { questionId: 'q4', prompt: 'Mum had for pudding?', acceptedAnswers: ['ice cream', 'icecream', 'ice-cream'] },
      { questionId: 'q5', prompt: 'How much was the meal?', prefix: '£', acceptedAnswers: ['20', 'twenty'] },
    ],
  };
}

function makeMoverWriteL26(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write', partId, audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `How did the family travel to town? They went by bus. Bus. ` +
      `What number was the bus? It was bus number nine. Nine. ` +
      `Now listen and write the answers. ` +
      `One. Where did they get on the bus? At Park Street. Park. P-A-R-K. ` +
      `Two. How many stops did they go? They went seven stops. Seven. ` +
      `Three. What was the driver's name? His name was Joe. J-O-E. Joe. ` +
      `Four. How much was a ticket? A ticket cost two pounds. Two. ` +
      `Five. What time did the bus leave? It left at half past eight. Eight thirty.`,
    sceneId: 'mover_l26_bus_journey',
    examples: [
      { question: 'How did they travel?', answer: 'bus' },
      { question: 'Bus number?', answer: '9' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'Where did they get on?', prefix: 'at', suffix: 'Street', acceptedAnswers: ['Park', 'park'] },
      { questionId: 'q2', prompt: 'How many stops?', acceptedAnswers: ['7', 'seven'] },
      { questionId: 'q3', prompt: "Driver's name?", acceptedAnswers: ['Joe', 'joe'] },
      { questionId: 'q4', prompt: 'How much was a ticket?', prefix: '£', acceptedAnswers: ['2', 'two'] },
      { questionId: 'q5', prompt: 'What time did it leave?', acceptedAnswers: ['8:30', 'eight thirty', 'half past eight'] },
    ],
  };
}

function makeMoverWriteL27(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write', partId, audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `Where did the class go on the trip? They went to the zoo. Zoo. ` +
      `What was the biggest animal? The biggest animal was the elephant. Elephant. ` +
      `Now listen and write the answers. ` +
      `One. How many lions did they see? They saw two lions. Two. ` +
      `Two. What was the monkey called? It was called Coco. C-O-C-O. Coco. ` +
      `Three. What did the giraffe eat? It ate leaves. Leaves. ` +
      `Four. What time did they have lunch? They had lunch at twelve o'clock. Twelve. ` +
      `Five. How many penguins were there? There were nine penguins. Nine.`,
    sceneId: 'mover_l27_zoo_trip',
    examples: [
      { question: 'Where did they go?', answer: 'zoo' },
      { question: 'Biggest animal?', answer: 'elephant' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How many lions?', acceptedAnswers: ['2', 'two'] },
      { questionId: 'q2', prompt: 'Monkey name?', acceptedAnswers: ['Coco', 'coco'] },
      { questionId: 'q3', prompt: 'What did the giraffe eat?', acceptedAnswers: ['leaves', 'Leaves', 'leaf'] },
      { questionId: 'q4', prompt: 'What time was lunch?', acceptedAnswers: ['12', '12:00', 'twelve'] },
      { questionId: 'q5', prompt: 'How many penguins?', acceptedAnswers: ['9', 'nine'] },
    ],
  };
}

function makeMoverWriteL28(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write', partId, audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `Where did the children visit? They visited a museum. Museum. ` +
      `What was the museum guide called? Her name was Kate. K-A-T-E. Kate. ` +
      `Now listen and write the answers. ` +
      `One. What did they see first? They saw a dinosaur. Dinosaur. ` +
      `Two. How old was the dinosaur skeleton? It was a hundred years old. Hundred. ` +
      `Three. How many paintings were on the wall? There were six paintings. Six. ` +
      `Four. What colour was the old vase? It was green. Green. G-R-E-E-N. ` +
      `Five. How many rooms did they visit? They visited five rooms. Five.`,
    sceneId: 'mover_l28_museum_tour',
    examples: [
      { question: 'Where did they visit?', answer: 'museum' },
      { question: 'Guide name?', answer: 'Kate' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'What did they see first?', acceptedAnswers: ['dinosaur', 'a dinosaur', 'Dinosaur'] },
      { questionId: 'q2', prompt: 'How old was the skeleton?', suffix: 'years', acceptedAnswers: ['100', 'hundred', 'a hundred'] },
      { questionId: 'q3', prompt: 'How many paintings?', acceptedAnswers: ['6', 'six'] },
      { questionId: 'q4', prompt: 'Old vase colour?', acceptedAnswers: ['green', 'Green'] },
      { questionId: 'q5', prompt: 'How many rooms?', acceptedAnswers: ['5', 'five'] },
    ],
  };
}

function makeMoverWriteL29(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write', partId, audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `Where did the children go? They went to the fire station. Fire station. ` +
      `What was the firefighter called? His name was Dave. D-A-V-E. Dave. ` +
      `Now listen and write the answers. ` +
      `One. What colour was the fire engine? It was red. Red. ` +
      `Two. How long was the ladder? It was ten metres long. Ten. ` +
      `Three. How many firefighters worked there? Eight firefighters worked there. Eight. ` +
      `Four. What was the fire dog called? It was called Spot. S-P-O-T. Spot. ` +
      `Five. What time did the alarm ring? It rang at three o'clock. Three.`,
    sceneId: 'mover_l29_fire_station',
    examples: [
      { question: 'Where did they go?', answer: 'fire station' },
      { question: 'Firefighter name?', answer: 'Dave' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'Fire engine colour?', acceptedAnswers: ['red', 'Red'] },
      { questionId: 'q2', prompt: 'How long was the ladder?', suffix: 'metres', acceptedAnswers: ['10', 'ten'] },
      { questionId: 'q3', prompt: 'How many firefighters?', acceptedAnswers: ['8', 'eight'] },
      { questionId: 'q4', prompt: 'Fire dog name?', acceptedAnswers: ['Spot', 'spot'] },
      { questionId: 'q5', prompt: 'What time did the alarm ring?', acceptedAnswers: ['3', '3:00', 'three'] },
    ],
  };
}

function makeMoverWriteL30(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write', partId, audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `What did the children go to? They went to a pet competition. Pets. ` +
      `What was the winning pet? The winning pet was a dog. Dog. ` +
      `Now listen and write the answers. ` +
      `One. What was the winning dog called? It was called Rex. R-E-X. Rex. ` +
      `Two. How many cats were in the show? There were five cats. Five. ` +
      `Three. What colour was the first rosette? It was gold. Gold. G-O-L-D. ` +
      `Four. Who won the rabbit prize? Hannah won it. H-A-N-N-A-H. Hannah. ` +
      `Five. How many pets came to the show? Twelve pets came. Twelve.`,
    sceneId: 'mover_l30_pet_competition',
    examples: [
      { question: 'Went to a pet...?', answer: 'competition' },
      { question: 'Winning pet?', answer: 'dog' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'Winning dog name?', acceptedAnswers: ['Rex', 'rex'] },
      { questionId: 'q2', prompt: 'How many cats?', acceptedAnswers: ['5', 'five'] },
      { questionId: 'q3', prompt: 'First rosette colour?', acceptedAnswers: ['gold', 'Gold'] },
      { questionId: 'q4', prompt: 'Who won the rabbit prize?', acceptedAnswers: ['Hannah', 'hannah'] },
      { questionId: 'q5', prompt: 'How many pets came?', acceptedAnswers: ['12', 'twelve'] },
    ],
  };
}

function makeMoverWriteL31(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write', partId, audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `What did the children plant? They planted trees. Trees. ` +
      `Who led the green day? Miss Green led it. G-R-E-E-N. Green. ` +
      `Now listen and write the answers. ` +
      `One. How many trees did they plant? They planted ten trees. Ten. ` +
      `Two. What did they dig with? They dug with a spade. Spade. ` +
      `Three. What was the youngest tree called? It was called Sprout. S-P-R-O-U-T. ` +
      `Four. How many minutes did they water the plants? Five minutes. Five. ` +
      `Five. What day was it? It was on Saturday. Saturday.`,
    sceneId: 'mover_l31_tree_planting',
    examples: [
      { question: 'What did they plant?', answer: 'trees' },
      { question: 'Who led it?', answer: 'Green' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How many trees?', acceptedAnswers: ['10', 'ten'] },
      { questionId: 'q2', prompt: 'What did they dig with?', acceptedAnswers: ['spade', 'a spade', 'Spade'] },
      { questionId: 'q3', prompt: 'Youngest tree name?', acceptedAnswers: ['Sprout', 'sprout'] },
      { questionId: 'q4', prompt: 'How many minutes watering?', suffix: 'minutes', acceptedAnswers: ['5', 'five'] },
      { questionId: 'q5', prompt: 'What day?', acceptedAnswers: ['Saturday', 'saturday'] },
    ],
  };
}

function makeMoverWriteL32(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write', partId, audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `Where did the children go? They went to the cinema. Cinema. ` +
      `What was the film called? It was called Space Cats. Space. ` +
      `Now listen and write the answers. ` +
      `One. What time did the film start? At four o'clock. Four. ` +
      `Two. How many tickets did they buy? Six tickets. Six. ` +
      `Three. What did they eat? They ate popcorn. Popcorn. ` +
      `Four. Which row did they sit in? Row G. G. ` +
      `Five. How much was one ticket? A ticket cost five pounds. Five.`,
    sceneId: 'mover_l32_cinema_visit',
    examples: [
      { question: 'Where did they go?', answer: 'cinema' },
      { question: 'Film name?', answer: 'Space' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'What time did it start?', acceptedAnswers: ['4', '4:00', 'four'] },
      { questionId: 'q2', prompt: 'How many tickets?', acceptedAnswers: ['6', 'six'] },
      { questionId: 'q3', prompt: 'What did they eat?', acceptedAnswers: ['popcorn', 'Popcorn'] },
      { questionId: 'q4', prompt: 'Which row?', prefix: 'Row', acceptedAnswers: ['G', 'g'] },
      { questionId: 'q5', prompt: 'How much was a ticket?', prefix: '£', acceptedAnswers: ['5', 'five'] },
    ],
  };
}

function makeMoverWriteL33(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write', partId, audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `Where did they go shopping? At the bakery. Bakery. ` +
      `What was the baker called? His name was Tom. T-O-M. Tom. ` +
      `Now listen and write the answers. ` +
      `One. What did Daisy buy? She bought a cake. Cake. ` +
      `Two. How many buns did they buy? Eight buns. Eight. ` +
      `Three. How much was the bread? The bread cost two pounds. Two. ` +
      `Four. What shape was the cookie? It was a star. Star. S-T-A-R. ` +
      `Five. How many cupcakes were left? Three cupcakes. Three.`,
    sceneId: 'mover_l33_bakery_shopping',
    examples: [
      { question: 'Where did they shop?', answer: 'bakery' },
      { question: 'Baker name?', answer: 'Tom' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'What did Daisy buy?', acceptedAnswers: ['cake', 'a cake', 'Cake'] },
      { questionId: 'q2', prompt: 'How many buns?', acceptedAnswers: ['8', 'eight'] },
      { questionId: 'q3', prompt: 'How much was the bread?', prefix: '£', acceptedAnswers: ['2', 'two'] },
      { questionId: 'q4', prompt: 'Cookie shape?', acceptedAnswers: ['star', 'Star', 'a star'] },
      { questionId: 'q5', prompt: 'Cupcakes left?', acceptedAnswers: ['3', 'three'] },
    ],
  };
}

function makeMoverWriteL34(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write', partId, audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `Where did the family go? They went to the river. River. ` +
      `What was the boat called? It was called Duck. D-U-C-K. Duck. ` +
      `Now listen and write the answers. ` +
      `One. How many fish did they catch? Seven fish. Seven. ` +
      `Two. What colour was the biggest fish? It was gold. Gold. ` +
      `Three. What time did they start? At six o'clock. Six. ` +
      `Four. What was in the bucket? There were worms. Worms. ` +
      `Five. Who caught the most fish? Jack did. J-A-C-K. Jack.`,
    sceneId: 'mover_l34_fishing_trip',
    examples: [
      { question: 'Where did they go?', answer: 'river' },
      { question: 'Boat name?', answer: 'Duck' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How many fish?', acceptedAnswers: ['7', 'seven'] },
      { questionId: 'q2', prompt: 'Biggest fish colour?', acceptedAnswers: ['gold', 'Gold'] },
      { questionId: 'q3', prompt: 'What time did they start?', acceptedAnswers: ['6', '6:00', 'six'] },
      { questionId: 'q4', prompt: 'What was in the bucket?', acceptedAnswers: ['worms', 'worm', 'Worms'] },
      { questionId: 'q5', prompt: 'Who caught most?', acceptedAnswers: ['Jack', 'jack'] },
    ],
  };
}

function makeMoverWriteL35(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write', partId, audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `What kind of sale was it? A garage sale. Garage. ` +
      `Whose house was it at? Mr Bell's house. B-E-L-L. Bell. ` +
      `Now listen and write the answers. ` +
      `One. What did Sam sell? He sold a lamp. Lamp. ` +
      `Two. How much was the book? The book cost one pound. One. ` +
      `Three. How many toys were there? Nine toys. Nine. ` +
      `Four. What colour was the old chair? It was brown. Brown. ` +
      `Five. What time did the sale finish? At three o'clock. Three.`,
    sceneId: 'mover_l35_garage_sale',
    examples: [
      { question: 'Kind of sale?', answer: 'garage' },
      { question: 'Whose house?', answer: 'Bell' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'What did Sam sell?', acceptedAnswers: ['lamp', 'a lamp', 'Lamp'] },
      { questionId: 'q2', prompt: 'How much was the book?', prefix: '£', acceptedAnswers: ['1', 'one'] },
      { questionId: 'q3', prompt: 'How many toys?', acceptedAnswers: ['9', 'nine'] },
      { questionId: 'q4', prompt: 'Old chair colour?', acceptedAnswers: ['brown', 'Brown'] },
      { questionId: 'q5', prompt: 'What time did it finish?', acceptedAnswers: ['3', '3:00', 'three'] },
    ],
  };
}

function makeMoverWriteL36(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write', partId, audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `Where did they visit? The hospital. Hospital. ` +
      `What was the doctor called? Doctor Patel. P-A-T-E-L. Patel. ` +
      `Now listen and write the answers. ` +
      `One. Who was in the bed? Grandpa was. Grandpa. ` +
      `Two. How many nurses worked there? Four nurses. Four. ` +
      `Three. What did they bring? They brought flowers. Flowers. ` +
      `Four. What time did they visit? At two o'clock. Two. ` +
      `Five. What was the ward number? Ward five. Five.`,
    sceneId: 'mover_l36_hospital_visit',
    examples: [
      { question: 'Where did they visit?', answer: 'hospital' },
      { question: 'Doctor name?', answer: 'Patel' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'Who was in the bed?', acceptedAnswers: ['Grandpa', 'grandpa'] },
      { questionId: 'q2', prompt: 'How many nurses?', acceptedAnswers: ['4', 'four'] },
      { questionId: 'q3', prompt: 'What did they bring?', acceptedAnswers: ['flowers', 'flower', 'Flowers'] },
      { questionId: 'q4', prompt: 'What time did they visit?', acceptedAnswers: ['2', '2:00', 'two'] },
      { questionId: 'q5', prompt: 'Ward number?', prefix: 'Ward', acceptedAnswers: ['5', 'five'] },
    ],
  };
}

function makeMoverWriteL37(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write', partId, audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `Where did the children go? To the post office. Post office. ` +
      `What did they send? They sent a parcel. Parcel. ` +
      `Now listen and write the answers. ` +
      `One. How many stamps did they buy? Five stamps. Five. ` +
      `Two. How heavy was the parcel? Two kilos. Two. ` +
      `Three. Who was the letter for? It was for Grandma. Grandma. ` +
      `Four. What colour was the stamp? It was blue. Blue. ` +
      `Five. What time did the post office close? At five o'clock. Five.`,
    sceneId: 'mover_l37_post_office',
    examples: [
      { question: 'Where did they go?', answer: 'post office' },
      { question: 'What did they send?', answer: 'parcel' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How many stamps?', acceptedAnswers: ['5', 'five'] },
      { questionId: 'q2', prompt: 'Parcel weight?', suffix: 'kilos', acceptedAnswers: ['2', 'two'] },
      { questionId: 'q3', prompt: 'Letter for whom?', acceptedAnswers: ['Grandma', 'grandma'] },
      { questionId: 'q4', prompt: 'Stamp colour?', acceptedAnswers: ['blue', 'Blue'] },
      { questionId: 'q5', prompt: 'What time did it close?', acceptedAnswers: ['5', '5:00', 'five'] },
    ],
  };
}

function makeMoverWriteL38(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write', partId, audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `Where did they go camping? In the mountains. Mountains. ` +
      `What was the mountain called? It was called Snowtop. S-N-O-W-T-O-P. ` +
      `Now listen and write the answers. ` +
      `One. How many tents did they take? Three tents. Three. ` +
      `Two. What did they use to find the way? A map. Map. M-A-P. ` +
      `Three. What time did they wake up? At seven o'clock. Seven. ` +
      `Four. What was the weather like? It was sunny. Sunny. ` +
      `Five. How many days did they stay? Two days. Two.`,
    sceneId: 'mover_l38_camping_mountains',
    examples: [
      { question: 'Where did they camp?', answer: 'mountains' },
      { question: 'Mountain name?', answer: 'Snowtop' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How many tents?', acceptedAnswers: ['3', 'three'] },
      { questionId: 'q2', prompt: 'Used to find the way?', acceptedAnswers: ['map', 'a map', 'Map'] },
      { questionId: 'q3', prompt: 'What time did they wake?', acceptedAnswers: ['7', '7:00', 'seven'] },
      { questionId: 'q4', prompt: 'Weather?', acceptedAnswers: ['sunny', 'Sunny'] },
      { questionId: 'q5', prompt: 'How many days?', suffix: 'days', acceptedAnswers: ['2', 'two'] },
    ],
  };
}

function makeMoverWriteL39(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write', partId, audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `Where did the class go? To an art gallery. Gallery. ` +
      `What was the artist called? Her name was Rosa. R-O-S-A. Rosa. ` +
      `Now listen and write the answers. ` +
      `One. How many paintings were there? Twelve paintings. Twelve. ` +
      `Two. What did Leo paint? He painted a boat. Boat. B-O-A-T. ` +
      `Three. What colour was the statue? It was white. White. ` +
      `Four. What time did the gallery open? At ten o'clock. Ten. ` +
      `Five. What was in the best painting? A cat. Cat.`,
    sceneId: 'mover_l39_art_exhibition',
    examples: [
      { question: 'Where did they go?', answer: 'gallery' },
      { question: 'Artist name?', answer: 'Rosa' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How many paintings?', acceptedAnswers: ['12', 'twelve'] },
      { questionId: 'q2', prompt: 'What did Leo paint?', acceptedAnswers: ['boat', 'a boat', 'Boat'] },
      { questionId: 'q3', prompt: 'Statue colour?', acceptedAnswers: ['white', 'White'] },
      { questionId: 'q4', prompt: 'What time did it open?', acceptedAnswers: ['10', '10:00', 'ten'] },
      { questionId: 'q5', prompt: 'In the best painting?', acceptedAnswers: ['cat', 'a cat', 'Cat'] },
    ],
  };
}

function makeMoverWriteL40(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write', partId, audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `What came home? A new baby. Baby. ` +
      `What was the baby called? Her name was Rose. R-O-S-E. Rose. ` +
      `Now listen and write the answers. ` +
      `One. Was the baby a boy or a girl? A girl. Girl. ` +
      `Two. How old was the baby? Two weeks old. Two. ` +
      `Three. What colour was the blanket? It was pink. Pink. ` +
      `Four. Who held the baby first? Grandma did. Grandma. ` +
      `Five. How many presents did the baby get? Eight presents. Eight.`,
    sceneId: 'mover_l40_new_baby',
    examples: [
      { question: 'What came home?', answer: 'baby' },
      { question: 'Baby name?', answer: 'Rose' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'Boy or girl?', acceptedAnswers: ['girl', 'Girl', 'a girl'] },
      { questionId: 'q2', prompt: 'How old (weeks)?', suffix: 'weeks', acceptedAnswers: ['2', 'two'] },
      { questionId: 'q3', prompt: 'Blanket colour?', acceptedAnswers: ['pink', 'Pink'] },
      { questionId: 'q4', prompt: 'Who held first?', acceptedAnswers: ['Grandma', 'grandma'] },
      { questionId: 'q5', prompt: 'How many presents?', acceptedAnswers: ['8', 'eight'] },
    ],
  };
}

/** Dispatch Movers Write: per-level L21-L40, rotation fallback beyond. */
function makeMoverWriteByLevel(partId: string, audioKey: string, levelNumber: number): WritePart {
  switch (levelNumber) {
    case 21: return makeMoverWriteL21(partId, audioKey);
    case 22: return makeMoverWriteL22(partId, audioKey);
    case 23: return makeMoverWriteL23(partId, audioKey);
    case 24: return makeMoverWriteL24(partId, audioKey);
    case 25: return makeMoverWriteL25(partId, audioKey);
    case 26: return makeMoverWriteL26(partId, audioKey);
    case 27: return makeMoverWriteL27(partId, audioKey);
    case 28: return makeMoverWriteL28(partId, audioKey);
    case 29: return makeMoverWriteL29(partId, audioKey);
    case 30: return makeMoverWriteL30(partId, audioKey);
    case 31: return makeMoverWriteL31(partId, audioKey);
    case 32: return makeMoverWriteL32(partId, audioKey);
    case 33: return makeMoverWriteL33(partId, audioKey);
    case 34: return makeMoverWriteL34(partId, audioKey);
    case 35: return makeMoverWriteL35(partId, audioKey);
    case 36: return makeMoverWriteL36(partId, audioKey);
    case 37: return makeMoverWriteL37(partId, audioKey);
    case 38: return makeMoverWriteL38(partId, audioKey);
    case 39: return makeMoverWriteL39(partId, audioKey);
    case 40: return makeMoverWriteL40(partId, audioKey);
    default: return makeMoverWritePart(partId, audioKey, (levelNumber - 1) % 3);
  }
}

/**
 * Flyers write part: B1 difficulty. Uses future tense, conditionals,
 * relative clauses. Vocab pool ~1000 words.
 */
function makeFlyerWritePart(partId: string, audioKey: string, sceneIdx: number): WritePart {
  if (sceneIdx === 1) {
    return {
      type: 'listening_write',
      partId,
      audioKey,
      audioScript:
        `Read the question. Listen and write a name, a number, or a date. There are two examples. ` +
        `What will Sebastian do this weekend? He will go cycling. Cycling. ` +
        `Where will the cycling event take place? In Greenfield Park. Greenfield. ` +
        `Now listen and write the answers. ` +
        `One. What date is the event? It is on the seventeenth of June. Seventeenth. ` +
        `Two. How many cyclists will join? About thirty cyclists. Thirty. ` +
        `Three. What is the captain's surname? Her surname is Thompson. T-H-O-M-P-S-O-N. ` +
        `Four. How long is the route? Forty kilometers long. Forty. ` +
        `Five. What time does it start? At quarter past eight. Eight fifteen.`,
      sceneId: 'weekend_activities',
      examples: [
        { question: 'What will he do?', answer: 'cycling' },
        { question: 'Where?', answer: 'Greenfield' },
      ],
      questions: [
        { questionId: 'q1', prompt: 'Date of the event?', suffix: 'June', acceptedAnswers: ['17th', '17', 'seventeenth'] },
        { questionId: 'q2', prompt: 'Number of cyclists?', acceptedAnswers: ['30', 'thirty'] },
        { questionId: 'q3', prompt: 'Captain surname?', acceptedAnswers: ['Thompson', 'thompson'] },
        { questionId: 'q4', prompt: 'Route length?', suffix: 'km', acceptedAnswers: ['40', 'forty'] },
        { questionId: 'q5', prompt: 'Start time?', acceptedAnswers: ['8:15', 'quarter past eight', 'eight fifteen'] },
      ],
    };
  }
  if (sceneIdx === 0) {
    return {
      type: 'listening_write',
      partId,
      audioKey,
      audioScript:
        `Read the question. Listen and write a name, a number, or a date. There are two examples. ` +
        `What is Madeleine cooking tonight? She is cooking spaghetti. Spaghetti. ` +
        `Who is helping her? Her brother Sebastian. Sebastian. ` +
        `Now listen and write the answers. ` +
        `One. How many guests are coming? Eight guests. Eight. ` +
        `Two. What is the dessert? Chocolate mousse. Mousse. M-O-U-S-S-E. ` +
        `Three. What time will dinner be served? At half past seven. Seven thirty. ` +
        `Four. What is the chef's nickname? Maddy. M-A-D-D-Y. ` +
        `Five. How many courses? Three courses. Three.`,
      sceneId: 'family_dinner',
      examples: [
        { question: 'What is cooking?', answer: 'spaghetti' },
        { question: 'Helper?', answer: 'Sebastian' },
      ],
      questions: [
        { questionId: 'q1', prompt: 'How many guests?', acceptedAnswers: ['8', 'eight'] },
        { questionId: 'q2', prompt: 'What dessert?', acceptedAnswers: ['mousse', 'Mousse'] },
        { questionId: 'q3', prompt: 'Dinner time?', acceptedAnswers: ['7:30', 'seven thirty', 'half past seven'] },
        { questionId: 'q4', prompt: "Chef's nickname?", acceptedAnswers: ['Maddy', 'maddy'] },
        { questionId: 'q5', prompt: 'Courses?', acceptedAnswers: ['3', 'three'] },
      ],
    };
  }
  // sceneIdx === 2: pet scene with abstract/conditional questions
  return {
    type: 'listening_write',
    partId,
    audioKey,
    audioScript:
      `Read the question. Listen and write a name, a number, or a date. There are two examples. ` +
      `What is the pet's full name? Whiskers Junior. Junior. J-U-N-I-O-R. ` +
      `When was she adopted? On the third of May. May. ` +
      `Now listen and write the answers. ` +
      `One. What breed is she? She is a Persian. Persian. P-E-R-S-I-A-N. ` +
      `Two. How much does she weigh? Six kilograms. Six. ` +
      `Three. What is the vet's name? Doctor Bennett. B-E-N-N-E-T-T. ` +
      `Four. How often does she visit the vet? Every fortnight. Fortnight. ` +
      `Five. What is her favorite food? Tuna. Tuna. T-U-N-A.`,
    sceneId: 'pet_girl',
    examples: [
      { question: 'Full name?', answer: 'Junior' },
      { question: 'Adopted?', answer: '3 May' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'Breed?', acceptedAnswers: ['Persian', 'persian'] },
      { questionId: 'q2', prompt: 'Weight?', suffix: 'kg', acceptedAnswers: ['6', 'six'] },
      { questionId: 'q3', prompt: 'Vet surname?', acceptedAnswers: ['Bennett', 'bennett'] },
      { questionId: 'q4', prompt: 'Vet frequency?', acceptedAnswers: ['fortnight', 'Fortnight'] },
      { questionId: 'q5', prompt: 'Favorite food?', acceptedAnswers: ['Tuna', 'tuna'] },
    ],
  };
}

// ─── D-18 Phase 4: Flyers per-level Write parts (L41-L50) ──────────────
// B1: future tense + spelling of names; each reuses its drag sceneId.

function makeFlyerWriteL41(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write', partId, audioKey,
    audioScript:
      `Read the question. Listen and write a name, a number, or a date. There are two examples. ` +
      `What event is at the school? It is the science fair. Science. ` +
      `Who won the fair last year? A girl called Maya. M-A-Y-A. Maya. ` +
      `Now listen and write the answers. ` +
      `One. What will the winner get this year? A gold trophy. Trophy. ` +
      `Two. How many projects will there be? Fourteen projects. Fourteen. ` +
      `Three. What time will the judging start? At half past two. Two thirty. ` +
      `Four. What is Leo's project about? It is about volcanoes. Volcanoes. ` +
      `Five. What is the science teacher's surname? It is Brown. B-R-O-W-N. Brown.`,
    sceneId: 'flyer_l41_science_fair',
    examples: [
      { question: 'What event?', answer: 'science' },
      { question: 'Won last year?', answer: 'Maya' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'What will the winner get?', acceptedAnswers: ['trophy', 'a trophy', 'Trophy'] },
      { questionId: 'q2', prompt: 'How many projects?', acceptedAnswers: ['14', 'fourteen'] },
      { questionId: 'q3', prompt: 'Judging start time?', acceptedAnswers: ['2:30', 'two thirty', 'half past two'] },
      { questionId: 'q4', prompt: "Leo's project about?", acceptedAnswers: ['volcanoes', 'volcano', 'Volcanoes'] },
      { questionId: 'q5', prompt: 'Teacher surname?', acceptedAnswers: ['Brown', 'brown'] },
    ],
  };
}

function makeFlyerWriteL42(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write', partId, audioKey,
    audioScript:
      `Read the question. Listen and write a name, a number, or a date. There are two examples. ` +
      `What kind of event is it? A charity event. Charity. ` +
      `What are they raising money for? For the hospital. Hospital. ` +
      `Now listen and write the answers. ` +
      `One. How much money did they raise? One hundred pounds. Hundred. ` +
      `Two. Who organised the event? Mrs Hill. H-I-L-L. Hill. ` +
      `Three. What time will it finish? At five o'clock. Five. ` +
      `Four. What did they sell the most of? They sold the most cakes. Cakes. ` +
      `Five. When is the next event? On the fifth of May. Fifth.`,
    sceneId: 'flyer_l42_charity_event',
    examples: [
      { question: 'Kind of event?', answer: 'charity' },
      { question: 'Money for?', answer: 'hospital' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How much raised?', prefix: '£', acceptedAnswers: ['100', 'hundred', 'one hundred'] },
      { questionId: 'q2', prompt: 'Who organised it?', acceptedAnswers: ['Hill', 'hill'] },
      { questionId: 'q3', prompt: 'Finish time?', acceptedAnswers: ['5', '5:00', 'five'] },
      { questionId: 'q4', prompt: 'Sold most of?', acceptedAnswers: ['cakes', 'cake', 'Cakes'] },
      { questionId: 'q5', prompt: 'Next event date?', acceptedAnswers: ['5th', 'fifth', '5'] },
    ],
  };
}

function makeFlyerWriteL43(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write', partId, audioKey,
    audioScript:
      `Read the question. Listen and write a name, a number, or a date. There are two examples. ` +
      `Where do the children volunteer? At the animal shelter. Shelter. ` +
      `What is the oldest dog called? It is called Max. M-A-X. Max. ` +
      `Now listen and write the answers. ` +
      `One. How many cats are at the shelter? Eleven cats. Eleven. ` +
      `Two. What do they feed the rabbits? They feed them carrots. Carrots. ` +
      `Three. What day do they help? On Sunday. Sunday. ` +
      `Four. Who is the shelter manager? Miss Ford. F-O-R-D. Ford. ` +
      `Five. How many hours do they stay? Three hours. Three.`,
    sceneId: 'flyer_l43_volunteer_shelter',
    examples: [
      { question: 'Where volunteer?', answer: 'shelter' },
      { question: 'Oldest dog?', answer: 'Max' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How many cats?', acceptedAnswers: ['11', 'eleven'] },
      { questionId: 'q2', prompt: 'Feed the rabbits?', acceptedAnswers: ['carrots', 'carrot', 'Carrots'] },
      { questionId: 'q3', prompt: 'What day?', acceptedAnswers: ['Sunday', 'sunday'] },
      { questionId: 'q4', prompt: 'Manager?', acceptedAnswers: ['Ford', 'ford'] },
      { questionId: 'q5', prompt: 'How many hours?', suffix: 'hours', acceptedAnswers: ['3', 'three'] },
    ],
  };
}

function makeFlyerWriteL44(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write', partId, audioKey,
    audioScript:
      `Read the question. Listen and write a name, a number, or a date. There are two examples. ` +
      `What festival is in the park? A food festival. Food. ` +
      `What is the most popular food? It is pizza. Pizza. ` +
      `Now listen and write the answers. ` +
      `One. How many food stalls are there? Twenty stalls. Twenty. ` +
      `Two. What fruit is in the smoothie? There is mango. M-A-N-G-O. Mango. ` +
      `Three. What time does it open? At ten o'clock. Ten. ` +
      `Four. How much is a burger? It costs three pounds. Three. ` +
      `Five. What is the head chef called? Pablo. P-A-B-L-O. Pablo.`,
    sceneId: 'flyer_l44_food_festival',
    examples: [
      { question: 'What festival?', answer: 'food' },
      { question: 'Popular food?', answer: 'pizza' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How many stalls?', acceptedAnswers: ['20', 'twenty'] },
      { questionId: 'q2', prompt: 'Fruit in smoothie?', acceptedAnswers: ['mango', 'Mango'] },
      { questionId: 'q3', prompt: 'Open time?', acceptedAnswers: ['10', '10:00', 'ten'] },
      { questionId: 'q4', prompt: 'Burger cost?', prefix: '£', acceptedAnswers: ['3', 'three'] },
      { questionId: 'q5', prompt: 'Head chef?', acceptedAnswers: ['Pablo', 'pablo'] },
    ],
  };
}

function makeFlyerWriteL45(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write', partId, audioKey,
    audioScript:
      `Read the question. Listen and write a name, a number, or a date. There are two examples. ` +
      `What is the school project about? It is about recycling. Recycling. ` +
      `Who leads the project? Mr Green. G-R-E-E-N. Green. ` +
      `Now listen and write the answers. ` +
      `One. How many recycling bins are there? Six bins. Six. ` +
      `Two. What will they build with the bottles? A tower. Tower. ` +
      `Three. What day is the clean-up? On Saturday. Saturday. ` +
      `Four. How many trees will they plant? Thirty trees. Thirty. ` +
      `Five. What will power the new lights? The sun will. Sun. S-U-N.`,
    sceneId: 'flyer_l45_eco_project',
    examples: [
      { question: 'Project about?', answer: 'recycling' },
      { question: 'Leader?', answer: 'Green' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How many bins?', acceptedAnswers: ['6', 'six'] },
      { questionId: 'q2', prompt: 'Build with bottles?', acceptedAnswers: ['tower', 'a tower', 'Tower'] },
      { questionId: 'q3', prompt: 'Clean-up day?', acceptedAnswers: ['Saturday', 'saturday'] },
      { questionId: 'q4', prompt: 'How many trees?', acceptedAnswers: ['30', 'thirty'] },
      { questionId: 'q5', prompt: 'Power the lights?', acceptedAnswers: ['sun', 'the sun', 'Sun'] },
    ],
  };
}

function makeFlyerWriteL46(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write', partId, audioKey,
    audioScript:
      `Read the question. Listen and write a name, a number, or a date. There are two examples. ` +
      `Where did the class go? To a space exhibition. Space. ` +
      `What is the biggest model? It is a rocket. Rocket. ` +
      `Now listen and write the answers. ` +
      `One. How many planets are in the model? Eight planets. Eight. ` +
      `Two. What is the red planet called? It is called Mars. M-A-R-S. Mars. ` +
      `Three. What time will the space show start? At four o'clock. Four. ` +
      `Four. How heavy is the moon rock? It is two kilos. Two. ` +
      `Five. What is the guide called? Luna. L-U-N-A. Luna.`,
    sceneId: 'flyer_l46_space_exhibition',
    examples: [
      { question: 'Where?', answer: 'space' },
      { question: 'Biggest model?', answer: 'rocket' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How many planets?', acceptedAnswers: ['8', 'eight'] },
      { questionId: 'q2', prompt: 'Red planet?', acceptedAnswers: ['Mars', 'mars'] },
      { questionId: 'q3', prompt: 'Show start time?', acceptedAnswers: ['4', '4:00', 'four'] },
      { questionId: 'q4', prompt: 'Moon rock weight?', suffix: 'kilos', acceptedAnswers: ['2', 'two'] },
      { questionId: 'q5', prompt: 'Guide name?', acceptedAnswers: ['Luna', 'luna'] },
    ],
  };
}

function makeFlyerWriteL47(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write', partId, audioKey,
    audioScript:
      `Read the question. Listen and write a name, a number, or a date. There are two examples. ` +
      `What competition is it? A cooking competition. Cooking. ` +
      `What is the secret ingredient? It is lemon. Lemon. ` +
      `Now listen and write the answers. ` +
      `One. How many cooks are there? Twelve cooks. Twelve. ` +
      `Two. What time will the final start? At three o'clock. Three. ` +
      `Three. What did the winner make? She made a cake. Cake. ` +
      `Four. What is the head judge called? Maria. M-A-R-I-A. Maria. ` +
      `Five. What will the winner get? A silver trophy. Trophy.`,
    sceneId: 'flyer_l47_cooking_competition',
    examples: [
      { question: 'What competition?', answer: 'cooking' },
      { question: 'Secret ingredient?', answer: 'lemon' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How many cooks?', acceptedAnswers: ['12', 'twelve'] },
      { questionId: 'q2', prompt: 'Final start time?', acceptedAnswers: ['3', '3:00', 'three'] },
      { questionId: 'q3', prompt: 'Winner made?', acceptedAnswers: ['cake', 'a cake', 'Cake'] },
      { questionId: 'q4', prompt: 'Head judge?', acceptedAnswers: ['Maria', 'maria'] },
      { questionId: 'q5', prompt: 'Winner gets?', acceptedAnswers: ['trophy', 'a trophy', 'Trophy'] },
    ],
  };
}

function makeFlyerWriteL48(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write', partId, audioKey,
    audioScript:
      `Read the question. Listen and write a name, a number, or a date. There are two examples. ` +
      `What are the students making? A short film. Film. ` +
      `What is the film called? It is called Dragons. D-R-A-G-O-N-S. ` +
      `Now listen and write the answers. ` +
      `One. How many actors are in the film? Seven actors. Seven. ` +
      `Two. Where will they film the last scene? At the beach. Beach. ` +
      `Three. What time will filming start? At eight o'clock. Eight. ` +
      `Four. Who is the director? A boy called Sam. S-A-M. Sam. ` +
      `Five. How long is the film? Ten minutes long. Ten.`,
    sceneId: 'flyer_l48_film_making',
    examples: [
      { question: 'Making what?', answer: 'film' },
      { question: 'Film called?', answer: 'Dragons' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How many actors?', acceptedAnswers: ['7', 'seven'] },
      { questionId: 'q2', prompt: 'Last scene where?', acceptedAnswers: ['beach', 'the beach', 'Beach'] },
      { questionId: 'q3', prompt: 'Filming start time?', acceptedAnswers: ['8', '8:00', 'eight'] },
      { questionId: 'q4', prompt: 'Director?', acceptedAnswers: ['Sam', 'sam'] },
      { questionId: 'q5', prompt: 'Film length?', suffix: 'minutes', acceptedAnswers: ['10', 'ten'] },
    ],
  };
}

function makeFlyerWriteL49(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write', partId, audioKey,
    audioScript:
      `Read the question. Listen and write a name, a number, or a date. There are two examples. ` +
      `What class is it? A photography class. Photography. ` +
      `What will they photograph today? They will photograph birds. Birds. ` +
      `Now listen and write the answers. ` +
      `One. How many cameras are there? Nine cameras. Nine. ` +
      `Two. What colour is the bird in the best photo? It is blue. Blue. ` +
      `Three. What time does the class start? At two o'clock. Two. ` +
      `Four. What is the teacher called? Mr Day. D-A-Y. Day. ` +
      `Five. How many photos must they take? Five photos. Five.`,
    sceneId: 'flyer_l49_photography_class',
    examples: [
      { question: 'What class?', answer: 'photography' },
      { question: 'Photograph today?', answer: 'birds' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How many cameras?', acceptedAnswers: ['9', 'nine'] },
      { questionId: 'q2', prompt: 'Best photo bird colour?', acceptedAnswers: ['blue', 'Blue'] },
      { questionId: 'q3', prompt: 'Class start time?', acceptedAnswers: ['2', '2:00', 'two'] },
      { questionId: 'q4', prompt: 'Teacher?', acceptedAnswers: ['Day', 'day'] },
      { questionId: 'q5', prompt: 'Photos to take?', acceptedAnswers: ['5', 'five'] },
    ],
  };
}

function makeFlyerWriteL50(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write', partId, audioKey,
    audioScript:
      `Read the question. Listen and write a name, a number, or a date. There are two examples. ` +
      `Where are the friends hiking? In the mountains. Mountains. ` +
      `What is the mountain called? It is called Eagle Mountain. E-A-G-L-E. ` +
      `Now listen and write the answers. ` +
      `One. How many kilometres will they walk? Eight kilometres. Eight. ` +
      `Two. What will they see at the top? They will see a lake. Lake. ` +
      `Three. What time will they start? At seven o'clock. Seven. ` +
      `Four. What is the guide called? A man called Cliff. C-L-I-F-F. Cliff. ` +
      `Five. What must everyone take? A map. Map. M-A-P.`,
    sceneId: 'flyer_l50_mountain_hiking',
    examples: [
      { question: 'Where hiking?', answer: 'mountains' },
      { question: 'Mountain called?', answer: 'Eagle' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How many km?', acceptedAnswers: ['8', 'eight'] },
      { questionId: 'q2', prompt: 'See at the top?', acceptedAnswers: ['lake', 'a lake', 'Lake'] },
      { questionId: 'q3', prompt: 'Start time?', acceptedAnswers: ['7', '7:00', 'seven'] },
      { questionId: 'q4', prompt: 'Guide?', acceptedAnswers: ['Cliff', 'cliff'] },
      { questionId: 'q5', prompt: 'Must take?', acceptedAnswers: ['map', 'a map', 'Map'] },
    ],
  };
}

/** Dispatch Flyers Write: per-level L41-L50, rotation fallback beyond. */
function makeFlyerWriteByLevel(partId: string, audioKey: string, levelNumber: number): WritePart {
  switch (levelNumber) {
    case 41: return makeFlyerWriteL41(partId, audioKey);
    case 42: return makeFlyerWriteL42(partId, audioKey);
    case 43: return makeFlyerWriteL43(partId, audioKey);
    case 44: return makeFlyerWriteL44(partId, audioKey);
    case 45: return makeFlyerWriteL45(partId, audioKey);
    case 46: return makeFlyerWriteL46(partId, audioKey);
    case 47: return makeFlyerWriteL47(partId, audioKey);
    case 48: return makeFlyerWriteL48(partId, audioKey);
    case 49: return makeFlyerWriteL49(partId, audioKey);
    case 50: return makeFlyerWriteL50(partId, audioKey);
    default: return makeFlyerWritePart(partId, audioKey, (levelNumber - 1) % 3);
  }
}

// ─── Part 2: Listen & write — Starters difficulty (5 variants) ─────────

/**
 * Starters Write — variant 0: Pet shop (cat at Happy pet shop on Rose St).
 * The original template, kept stable for backward compat.
 */
function makeStarterWriteV0_Pet(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write',
    partId,
    audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `What is the gift for? It is for Lucy's twelfth birthday. The number is twelve. ` +
      `What is the name of the cat? The name is Sun. S-U-N. Sun. ` +
      `Now listen and write the answers. ` +
      `One. How old is the cat? The cat is six weeks old. Six. ` +
      `Two. How many sisters does the cat have? The cat has two sisters. Two. ` +
      `Three. What is the name of the pet shop? The shop is called Happy. H-A-P-P-Y. Happy. ` +
      `Four. Where is the pet shop? It is on Rose street. Rose. R-O-S-E. ` +
      `Five. How much milk does the cat drink a day? Three cups of milk. Three.`,
    sceneId: 'pet_girl',
    examples: [
      { question: "What is the gift for? for Lucy's", answer: '12th birthday' },
      { question: 'What is the name of the cat?', answer: 'SUN' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How old is the cat?', suffix: 'week old', acceptedAnswers: ['6', 'six'] },
      { questionId: 'q2', prompt: 'How many sisters does the cat have?', acceptedAnswers: ['2', 'two'] },
      { questionId: 'q3', prompt: "What's the name of the pet shop?", acceptedAnswers: ['Happy', 'happy'] },
      { questionId: 'q4', prompt: 'Where is the pet shop?', prefix: 'on', suffix: 'street', acceptedAnswers: ['Rose', 'rose'] },
      { questionId: 'q5', prompt: 'How much milk does the cat drink a day?', suffix: 'cups of milk', acceptedAnswers: ['3', 'three'] },
    ],
  };
}

/** Starters Write — variant 1: Family dinner (Mum cooks, Dad eats). */
function makeStarterWriteV1_Family(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write',
    partId,
    audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `Who cooks the dinner? Mum cooks. Mum. M-U-M. ` +
      `What is for dinner? Chicken and rice. Chicken. ` +
      `Now listen and write the answers. ` +
      `One. How many children are at the table? Two children. Two. ` +
      `Two. What is the dog called? The dog is called Max. M-A-X. Max. ` +
      `Three. What does Dad drink? Dad drinks milk. Milk. M-I-L-K. ` +
      `Four. What time do they eat? They eat at six o'clock. Six. ` +
      `Five. How many cakes are on the table? Four cakes. Four.`,
    sceneId: 'family_dinner',
    examples: [
      { question: 'Who cooks dinner?', answer: 'Mum' },
      { question: 'What is for dinner?', answer: 'chicken' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How many children at the table?', acceptedAnswers: ['2', 'two'] },
      { questionId: 'q2', prompt: 'What is the dog called?', acceptedAnswers: ['Max', 'max'] },
      { questionId: 'q3', prompt: 'What does Dad drink?', acceptedAnswers: ['milk', 'Milk'] },
      { questionId: 'q4', prompt: 'What time do they eat?', acceptedAnswers: ['6', '6:00', 'six'] },
      { questionId: 'q5', prompt: 'How many cakes?', acceptedAnswers: ['4', 'four'] },
    ],
  };
}

/** Starters Write — variant 2: Weekend at the park (Sam, dog Bob, kite). */
function makeStarterWriteV2_Weekend(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write',
    partId,
    audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `Where are they playing? They are playing in the park. Park. ` +
      `What is the dog called? The dog is called Bob. B-O-B. Bob. ` +
      `Now listen and write the answers. ` +
      `One. How old is Sam? Sam is nine years old. Nine. ` +
      `Two. What does Sam fly? Sam flies a kite. Kite. K-I-T-E. ` +
      `Three. How many trees are in the park? There are five trees. Five. ` +
      `Four. What is on the bench? An apple. Apple. A-P-P-L-E. ` +
      `Five. How many friends are with Sam? Two friends. Two.`,
    sceneId: 'weekend_activities',
    examples: [
      { question: 'Where are they playing?', answer: 'park' },
      { question: "Dog's name?", answer: 'Bob' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How old is Sam?', suffix: 'years old', acceptedAnswers: ['9', 'nine'] },
      { questionId: 'q2', prompt: 'What does Sam fly?', acceptedAnswers: ['kite', 'Kite'] },
      { questionId: 'q3', prompt: 'How many trees in the park?', acceptedAnswers: ['5', 'five'] },
      { questionId: 'q4', prompt: 'What is on the bench?', acceptedAnswers: ['apple', 'Apple'] },
      { questionId: 'q5', prompt: 'How many friends?', acceptedAnswers: ['2', 'two'] },
    ],
  };
}

/** Starters Write — variant 3: Birthday party (Lily, age 7, presents). */
function makeStarterWriteV3_Birthday(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write',
    partId,
    audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `Whose birthday is it? It is Lily's birthday. Lily. L-I-L-Y. ` +
      `How old is Lily? She is seven. Seven. ` +
      `Now listen and write the answers. ` +
      `One. How many friends come to the party? Six friends. Six. ` +
      `Two. What is the cake? It is a chocolate cake. Chocolate. ` +
      `Three. What time does the party start? At three o'clock. Three. ` +
      `Four. What is the present? A new doll. Doll. D-O-L-L. ` +
      `Five. What do they drink? They drink juice. Juice. J-U-I-C-E.`,
    sceneId: 'birthday_party',
    examples: [
      { question: 'Whose birthday?', answer: 'Lily' },
      { question: 'How old?', answer: '7' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How many friends come?', acceptedAnswers: ['6', 'six'] },
      { questionId: 'q2', prompt: 'What kind of cake?', acceptedAnswers: ['chocolate', 'Chocolate'] },
      { questionId: 'q3', prompt: 'Party time?', acceptedAnswers: ['3', '3:00', 'three'] },
      { questionId: 'q4', prompt: 'What is the present?', acceptedAnswers: ['doll', 'Doll'] },
      { questionId: 'q5', prompt: 'What do they drink?', acceptedAnswers: ['juice', 'Juice'] },
    ],
  };
}

/** Starters Write — variant 4: School day (Mrs Red, art class). */
function makeStarterWriteV4_School(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write',
    partId,
    audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `What is the teacher's name? Her name is Mrs Red. Red. R-E-D. ` +
      `What is the favourite subject? Art is the favourite. Art. ` +
      `Now listen and write the answers. ` +
      `One. How many students are in the class? Ten students. Ten. ` +
      `Two. What is the school called? Sun school. Sun. S-U-N. ` +
      `Three. What time does class start? At eight o'clock. Eight. ` +
      `Four. What colour is the book? The book is blue. Blue. B-L-U-E. ` +
      `Five. How many pencils does Tom have? Five pencils. Five.`,
    sceneId: 'classroom',
    examples: [
      { question: "Teacher's name?", answer: 'Red' },
      { question: 'Favourite subject?', answer: 'Art' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How many students?', acceptedAnswers: ['10', 'ten'] },
      { questionId: 'q2', prompt: 'School name?', acceptedAnswers: ['Sun', 'sun'] },
      { questionId: 'q3', prompt: 'Class start time?', acceptedAnswers: ['8', '8:00', 'eight'] },
      { questionId: 'q4', prompt: 'Book colour?', acceptedAnswers: ['blue', 'Blue'] },
      { questionId: 'q5', prompt: 'How many pencils?', acceptedAnswers: ['5', 'five'] },
    ],
  };
}

/** Starters Write — Level 6: Beach holiday (shells, swimming, Pat with red hat). */
function makeStarterWriteL6_Beach(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write',
    partId,
    audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `Where is the family today? At the beach. Beach. ` +
      `Who has a red hat? The boy with the red hat is Pat. P-A-T. Pat. ` +
      `Now listen and write the answers. ` +
      `One. How many shells has Lily found? She has found four shells. Four. ` +
      `Two. What is the dog called? The dog is called Spot. S-P-O-T. Spot. ` +
      `Three. What time do they swim? They swim at eleven o'clock. Eleven. ` +
      `Four. What does Mum read? She reads a book. Book. B-O-O-K. ` +
      `Five. How many ice creams do they eat? Three ice creams. Three.`,
    sceneId: 'beach_family',
    examples: [
      { question: 'Where today?', answer: 'beach' },
      { question: 'Red hat boy?', answer: 'Pat' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How many shells has Lily?', acceptedAnswers: ['4', 'four'] },
      { questionId: 'q2', prompt: "Dog's name?", acceptedAnswers: ['Spot', 'spot'] },
      { questionId: 'q3', prompt: 'Swim time?', acceptedAnswers: ['11', '11:00', 'eleven'] },
      { questionId: 'q4', prompt: 'What does Mum read?', acceptedAnswers: ['book', 'Book'] },
      { questionId: 'q5', prompt: 'How many ice creams?', acceptedAnswers: ['3', 'three'] },
    ],
  };
}

/** Starters Write — Level 7: Garden flowers (Lulu the cat, watering at 9am). */
function makeStarterWriteL7_Garden(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write',
    partId,
    audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `What is in the garden? Many flowers. Flowers. ` +
      `Who waters the plants? Mum waters them. Mum. M-U-M. ` +
      `Now listen and write the answers. ` +
      `One. How many flowers are red? Five red flowers. Five. ` +
      `Two. What is on the tree? A bird. Bird. B-I-R-D. ` +
      `Three. What is the cat called? The cat is called Lulu. L-U-L-U. Lulu. ` +
      `Four. What time do they water the garden? At nine o'clock. Nine. ` +
      `Five. How many cats are in the garden? Two cats. Two.`,
    sceneId: 'garden_objects_outline',
    examples: [
      { question: 'In the garden?', answer: 'flowers' },
      { question: 'Who waters?', answer: 'Mum' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How many red flowers?', acceptedAnswers: ['5', 'five'] },
      { questionId: 'q2', prompt: 'What is on the tree?', acceptedAnswers: ['bird', 'Bird'] },
      { questionId: 'q3', prompt: "Cat's name?", acceptedAnswers: ['Lulu', 'lulu'] },
      { questionId: 'q4', prompt: 'Water time?', acceptedAnswers: ['9', '9:00', 'nine'] },
      { questionId: 'q5', prompt: 'How many cats?', acceptedAnswers: ['2', 'two'] },
    ],
  };
}

/** Starters Write — Level 8: Toy shop (Mr Tom, Meg the doll, yellow kite). */
function makeStarterWriteL8_ToyShop(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write',
    partId,
    audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `What does the shop sell? It sells toys. Toy. T-O-Y. ` +
      `Who works in the shop? Mr Tom works there. Tom. ` +
      `Now listen and write the answers. ` +
      `One. How many dolls are on the shelf? Six dolls. Six. ` +
      `Two. What is the doll called? The doll is called Meg. M-E-G. Meg. ` +
      `Three. How much is the ball? Five pounds. Five. ` +
      `Four. What colour is the kite? It is yellow. Yellow. ` +
      `Five. How many books does May buy? Eight books. Eight.`,
    sceneId: 'classroom',
    examples: [
      { question: 'Shop sells?', answer: 'toys' },
      { question: 'Who works?', answer: 'Tom' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How many dolls?', acceptedAnswers: ['6', 'six'] },
      { questionId: 'q2', prompt: "Doll's name?", acceptedAnswers: ['Meg', 'meg'] },
      { questionId: 'q3', prompt: 'Ball price?', suffix: 'pounds', acceptedAnswers: ['5', 'five'] },
      { questionId: 'q4', prompt: 'Kite colour?', acceptedAnswers: ['yellow', 'Yellow'] },
      { questionId: 'q5', prompt: 'How many books?', acceptedAnswers: ['8', 'eight'] },
    ],
  };
}

/** Starters Write — Level 9: Sports day (Sam runs, Ben wins, blue team shirt). */
function makeStarterWriteL9_Sports(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write',
    partId,
    audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `What event is today? It is sports day. Sports. ` +
      `Who runs first? Sam runs first. S-A-M. Sam. ` +
      `Now listen and write the answers. ` +
      `One. How many children run in the race? Nine children. Nine. ` +
      `Two. Who wins the race? Ben wins. B-E-N. Ben. ` +
      `Three. What time does the race start? At ten o'clock. Ten. ` +
      `Four. What colour is the team shirt? It is blue. Blue. ` +
      `Five. How many trophies are there? Four trophies. Four.`,
    sceneId: 'playground',
    examples: [
      { question: 'Event today?', answer: 'sports' },
      { question: 'First runner?', answer: 'Sam' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How many run?', acceptedAnswers: ['9', 'nine'] },
      { questionId: 'q2', prompt: 'Race winner?', acceptedAnswers: ['Ben', 'ben'] },
      { questionId: 'q3', prompt: 'Race time?', acceptedAnswers: ['10', '10:00', 'ten'] },
      { questionId: 'q4', prompt: 'Team shirt colour?', acceptedAnswers: ['blue', 'Blue'] },
      { questionId: 'q5', prompt: 'How many trophies?', acceptedAnswers: ['4', 'four'] },
    ],
  };
}

/** Starters Write — Level 10: Picnic park (Mia, Rex dog, 7 sandwiches, pears). */
function makeStarterWriteL10_Picnic(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write',
    partId,
    audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `Where do they picnic? In the park. Park. ` +
      `Whose birthday is today? Mia's birthday. M-I-A. Mia. ` +
      `Now listen and write the answers. ` +
      `One. How many sandwiches are there? Seven sandwiches. Seven. ` +
      `Two. What is the dog called? The dog is called Rex. R-E-X. Rex. ` +
      `Three. What time do they eat lunch? At one o'clock. One. ` +
      `Four. What fruit does Mia like? She likes pears. Pear. P-E-A-R. ` +
      `Five. How many trees can they see? Four trees. Four.`,
    sceneId: 'weekend_activities',
    examples: [
      { question: 'Where picnic?', answer: 'park' },
      { question: 'Whose birthday?', answer: 'Mia' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How many sandwiches?', acceptedAnswers: ['7', 'seven'] },
      { questionId: 'q2', prompt: "Dog's name?", acceptedAnswers: ['Rex', 'rex'] },
      { questionId: 'q3', prompt: 'Lunch time?', acceptedAnswers: ['1', '1:00', 'one'] },
      { questionId: 'q4', prompt: 'Favourite fruit?', acceptedAnswers: ['pear', 'Pear', 'pears'] },
      { questionId: 'q5', prompt: 'How many trees?', acceptedAnswers: ['4', 'four'] },
    ],
  };
}

/** Starters Write — Level 11: Library books (Mrs Black, Anna borrows 4 books). */
function makeStarterWriteL11_Library(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write',
    partId,
    audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `Where is Anna today? At the library. Library. ` +
      `Who is the librarian? Mrs Black. B-L-A-C-K. Black. ` +
      `Now listen and write the answers. ` +
      `One. How many books does Anna take? Four books. Four. ` +
      `Two. What is the story about? It is about a cat. Cat. C-A-T. ` +
      `Three. What time does Anna read? At eleven o'clock. Eleven. ` +
      `Four. Who is Anna's friend? Sue. S-U-E. Sue. ` +
      `Five. How many pages does she read? Six pages. Six.`,
    sceneId: 'classroom',
    examples: [
      { question: 'Where today?', answer: 'library' },
      { question: 'Librarian?', answer: 'Black' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How many books?', acceptedAnswers: ['4', 'four'] },
      { questionId: 'q2', prompt: 'Story about?', acceptedAnswers: ['cat', 'Cat'] },
      { questionId: 'q3', prompt: 'Read time?', acceptedAnswers: ['11', '11:00', 'eleven'] },
      { questionId: 'q4', prompt: "Friend's name?", acceptedAnswers: ['Sue', 'sue'] },
      { questionId: 'q5', prompt: 'How many pages?', acceptedAnswers: ['6', 'six'] },
    ],
  };
}

/** Starters Write — Level 12: Bicycle ride (Ben, red bike, friend Lily). */
function makeStarterWriteL12_Bicycle(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write',
    partId,
    audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `Where does Ben ride? In the park. Park. ` +
      `What colour is the bike? It is red. Red. R-E-D. ` +
      `Now listen and write the answers. ` +
      `One. How many wheels does the bike have? Two wheels. Two. ` +
      `Two. Who is Ben's friend? Lily. L-I-L-Y. Lily. ` +
      `Three. What time do they ride? At three o'clock. Three. ` +
      `Four. What does the bike have? A bell. Bell. B-E-L-L. ` +
      `Five. How many minutes do they ride? Twenty minutes. Twenty.`,
    sceneId: 'playground',
    examples: [
      { question: 'Where ride?', answer: 'park' },
      { question: 'Bike colour?', answer: 'red' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How many wheels?', acceptedAnswers: ['2', 'two'] },
      { questionId: 'q2', prompt: "Friend's name?", acceptedAnswers: ['Lily', 'lily'] },
      { questionId: 'q3', prompt: 'Ride time?', acceptedAnswers: ['3', '3:00', 'three'] },
      { questionId: 'q4', prompt: 'On the bike?', acceptedAnswers: ['bell', 'Bell'] },
      { questionId: 'q5', prompt: 'How many minutes?', acceptedAnswers: ['20', 'twenty'] },
    ],
  };
}

/** Starters Write — Level 13: Cooking kitchen (Sam helps Mum bake lemon cake). */
function makeStarterWriteL13_Cooking(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write',
    partId,
    audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `What do they cook? A cake. Cake. C-A-K-E. ` +
      `Who helps Mum? Sam helps. S-A-M. Sam. ` +
      `Now listen and write the answers. ` +
      `One. How many eggs do they use? Three eggs. Three. ` +
      `Two. What flavour is the cake? Lemon. L-E-M-O-N. Lemon. ` +
      `Three. What time do they bake? At nine o'clock. Nine. ` +
      `Four. How many cups of flour? Two cups. Two. ` +
      `Five. What is the recipe book called? Joy. J-O-Y. Joy.`,
    sceneId: 'kitchen_baking',
    examples: [
      { question: 'What cook?', answer: 'cake' },
      { question: 'Helper?', answer: 'Sam' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How many eggs?', acceptedAnswers: ['3', 'three'] },
      { questionId: 'q2', prompt: 'Cake flavour?', acceptedAnswers: ['lemon', 'Lemon'] },
      { questionId: 'q3', prompt: 'Bake time?', acceptedAnswers: ['9', '9:00', 'nine'] },
      { questionId: 'q4', prompt: 'Cups of flour?', suffix: 'cups', acceptedAnswers: ['2', 'two'] },
      { questionId: 'q5', prompt: 'Recipe book name?', acceptedAnswers: ['Joy', 'joy'] },
    ],
  };
}

/** Starters Write — Level 14: Swimming pool (Mr Green teaches, blue floats). */
function makeStarterWriteL14_Swimming(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write',
    partId,
    audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `Where are the kids? At the pool. Pool. P-O-O-L. ` +
      `Who is the teacher? Mr Green. G-R-E-E-N. Green. ` +
      `Now listen and write the answers. ` +
      `One. How many kids are in the pool? Eight kids. Eight. ` +
      `Two. What toy do they play with? A ball. Ball. B-A-L-L. ` +
      `Three. What time is the lesson? At two o'clock. Two. ` +
      `Four. What colour is the float? It is blue. Blue. ` +
      `Five. How many lessons each week? Three lessons. Three.`,
    sceneId: 'beach_family',
    examples: [
      { question: 'Where?', answer: 'pool' },
      { question: 'Teacher?', answer: 'Green' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How many kids?', acceptedAnswers: ['8', 'eight'] },
      { questionId: 'q2', prompt: 'Pool toy?', acceptedAnswers: ['ball', 'Ball'] },
      { questionId: 'q3', prompt: 'Lesson time?', acceptedAnswers: ['2', '2:00', 'two'] },
      { questionId: 'q4', prompt: 'Float colour?', acceptedAnswers: ['blue', 'Blue'] },
      { questionId: 'q5', prompt: 'How many lessons?', acceptedAnswers: ['3', 'three'] },
    ],
  };
}

/** Starters Write — Level 15: Farm visit (Tim's farm, 7 cows, red barn). */
function makeStarterWriteL15_Farm(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write',
    partId,
    audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `Where is the school trip? At the farm. Farm. F-A-R-M. ` +
      `Who is the farmer? Tim. T-I-M. Tim. ` +
      `Now listen and write the answers. ` +
      `One. How many cows are on the farm? Seven cows. Seven. ` +
      `Two. What is the pig called? Pen. P-E-N. Pen. ` +
      `Three. What time do they arrive? At ten o'clock. Ten. ` +
      `Four. What colour is the barn? It is red. Red. ` +
      `Five. How many sheep are there? Five sheep. Five.`,
    sceneId: 'farm_outline',
    examples: [
      { question: 'Where trip?', answer: 'farm' },
      { question: 'Farmer?', answer: 'Tim' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How many cows?', acceptedAnswers: ['7', 'seven'] },
      { questionId: 'q2', prompt: "Pig's name?", acceptedAnswers: ['Pen', 'pen'] },
      { questionId: 'q3', prompt: 'Arrive time?', acceptedAnswers: ['10', '10:00', 'ten'] },
      { questionId: 'q4', prompt: 'Barn colour?', acceptedAnswers: ['red', 'Red'] },
      { questionId: 'q5', prompt: 'How many sheep?', acceptedAnswers: ['5', 'five'] },
    ],
  };
}

/** Starters Write — Level 16: Pets at home (Lily's house, 3 pets, Bob the dog). */
function makeStarterWriteL16_PetsHome(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write',
    partId,
    audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `Whose pets are these? Lily's pets. Lily. L-I-L-Y. ` +
      `What is the cat called? Pip. P-I-P. Pip. ` +
      `Now listen and write the answers. ` +
      `One. How many pets does Lily have? Three pets. Three. ` +
      `Two. What is the dog called? The dog is Bob. B-O-B. Bob. ` +
      `Three. What time does Lily feed them? At eight o'clock. Eight. ` +
      `Four. What colour is the fish bowl? It is blue. Blue. ` +
      `Five. How many fish are in the bowl? Four fish. Four.`,
    sceneId: 'pet_girl',
    examples: [
      { question: 'Whose pets?', answer: 'Lily' },
      { question: "Cat's name?", answer: 'Pip' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How many pets?', acceptedAnswers: ['3', 'three'] },
      { questionId: 'q2', prompt: "Dog's name?", acceptedAnswers: ['Bob', 'bob'] },
      { questionId: 'q3', prompt: 'Feed time?', acceptedAnswers: ['8', '8:00', 'eight'] },
      { questionId: 'q4', prompt: 'Fish bowl colour?', acceptedAnswers: ['blue', 'Blue'] },
      { questionId: 'q5', prompt: 'How many fish?', acceptedAnswers: ['4', 'four'] },
    ],
  };
}

/** Starters Write — Level 17: Sleepover at Eve's (Friday night, pink pillow, Ted). */
function makeStarterWriteL17_Sleepover(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write',
    partId,
    audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `Whose house is it? It is Eve's house. Eve. E-V-E. ` +
      `What night is the sleepover? Friday night. Friday. ` +
      `Now listen and write the answers. ` +
      `One. How many girls are at the sleepover? Two girls. Two. ` +
      `Two. What colour is the pillow? It is pink. Pink. P-I-N-K. ` +
      `Three. What time do they sleep? At nine o'clock. Nine. ` +
      `Four. What is the teddy called? Ted. T-E-D. Ted. ` +
      `Five. How many books do they read? Three books. Three.`,
    sceneId: 'bedroom_outline',
    examples: [
      { question: 'Whose house?', answer: 'Eve' },
      { question: 'What night?', answer: 'Friday' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How many girls?', acceptedAnswers: ['2', 'two'] },
      { questionId: 'q2', prompt: 'Pillow colour?', acceptedAnswers: ['pink', 'Pink'] },
      { questionId: 'q3', prompt: 'Sleep time?', acceptedAnswers: ['9', '9:00', 'nine'] },
      { questionId: 'q4', prompt: "Teddy's name?", acceptedAnswers: ['Ted', 'ted'] },
      { questionId: 'q5', prompt: 'How many books?', acceptedAnswers: ['3', 'three'] },
    ],
  };
}

/** Starters Write — Level 18: Garden play (Tim wins tag, 5 kids, cake prize). */
function makeStarterWriteL18_GardenPlay(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write',
    partId,
    audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `Where are the kids playing? In the garden. Garden. ` +
      `What game do they play? Tag. T-A-G. Tag. ` +
      `Now listen and write the answers. ` +
      `One. How many kids are playing? Five kids. Five. ` +
      `Two. What time does the game start? At four o'clock. Four. ` +
      `Three. Who wins the game? Tim wins. T-I-M. Tim. ` +
      `Four. What is the prize? A cake. Cake. C-A-K-E. ` +
      `Five. How many balls are in the garden? Two balls. Two.`,
    sceneId: 'garden_objects_outline',
    examples: [
      { question: 'Where play?', answer: 'garden' },
      { question: 'Game?', answer: 'tag' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How many kids?', acceptedAnswers: ['5', 'five'] },
      { questionId: 'q2', prompt: 'Game start?', acceptedAnswers: ['4', '4:00', 'four'] },
      { questionId: 'q3', prompt: 'Winner?', acceptedAnswers: ['Tim', 'tim'] },
      { questionId: 'q4', prompt: 'The prize?', acceptedAnswers: ['cake', 'Cake'] },
      { questionId: 'q5', prompt: 'How many balls?', acceptedAnswers: ['2', 'two'] },
    ],
  };
}

/** Starters Write — Level 19: Train ride (West station, family of 4, Amy sister). */
function makeStarterWriteL19_Train(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write',
    partId,
    audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `Where do they go? To grandma's house. Grandma. ` +
      `What colour is the train? It is red. Red. R-E-D. ` +
      `Now listen and write the answers. ` +
      `One. How many people in the family? Four people. Four. ` +
      `Two. What is the station called? West. W-E-S-T. West. ` +
      `Three. What time does the train leave? At seven o'clock. Seven. ` +
      `Four. What is the sister called? Amy. A-M-Y. Amy. ` +
      `Five. How many hours is the trip? Two hours. Two.`,
    sceneId: 'weekend_activities',
    examples: [
      { question: 'Where go?', answer: 'grandma' },
      { question: 'Train colour?', answer: 'red' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How many family members?', acceptedAnswers: ['4', 'four'] },
      { questionId: 'q2', prompt: 'Station name?', acceptedAnswers: ['West', 'west'] },
      { questionId: 'q3', prompt: 'Train time?', acceptedAnswers: ['7', '7:00', 'seven'] },
      { questionId: 'q4', prompt: "Sister's name?", acceptedAnswers: ['Amy', 'amy'] },
      { questionId: 'q5', prompt: 'Trip length?', suffix: 'hours', acceptedAnswers: ['2', 'two'] },
    ],
  };
}

/** Starters Write — Level 20: Snow day (Sam the snowman, pink scarf, 9 snowballs). */
function makeStarterWriteL20_Snow(partId: string, audioKey: string): WritePart {
  return {
    type: 'listening_write',
    partId,
    audioKey,
    audioScript:
      `Read the question. Listen and write a name or a number. There are two examples. ` +
      `What is the weather? Snow. S-N-O-W. Snow. ` +
      `What is the snowman called? Sam. S-A-M. Sam. ` +
      `Now listen and write the answers. ` +
      `One. How many kids play in the snow? Six kids. Six. ` +
      `Two. What colour is the scarf? It is pink. Pink. P-I-N-K. ` +
      `Three. What time do they go out? At eleven o'clock. Eleven. ` +
      `Four. What is the brother called? Tom. T-O-M. Tom. ` +
      `Five. How many snowballs do they make? Nine snowballs. Nine.`,
    sceneId: 'playground',
    examples: [
      { question: 'Weather?', answer: 'snow' },
      { question: 'Snowman?', answer: 'Sam' },
    ],
    questions: [
      { questionId: 'q1', prompt: 'How many kids?', acceptedAnswers: ['6', 'six'] },
      { questionId: 'q2', prompt: 'Scarf colour?', acceptedAnswers: ['pink', 'Pink'] },
      { questionId: 'q3', prompt: 'Go out time?', acceptedAnswers: ['11', '11:00', 'eleven'] },
      { questionId: 'q4', prompt: "Brother's name?", acceptedAnswers: ['Tom', 'tom'] },
      { questionId: 'q5', prompt: 'How many snowballs?', acceptedAnswers: ['9', 'nine'] },
    ],
  };
}

/**
 * Dispatch Starters Write template by level number (1-20).
 * All 20 levels now have unique content (Sessions 2.1 + 2.2 complete).
 */
function makeStarterWritePart(partId: string, audioKey: string, levelNumber: number): WritePart {
  switch (levelNumber) {
    case 1: return makeStarterWriteV0_Pet(partId, audioKey);
    case 2: return makeStarterWriteV1_Family(partId, audioKey);
    case 3: return makeStarterWriteV2_Weekend(partId, audioKey);
    case 4: return makeStarterWriteV3_Birthday(partId, audioKey);
    case 5: return makeStarterWriteV4_School(partId, audioKey);
    case 6: return makeStarterWriteL6_Beach(partId, audioKey);
    case 7: return makeStarterWriteL7_Garden(partId, audioKey);
    case 8: return makeStarterWriteL8_ToyShop(partId, audioKey);
    case 9: return makeStarterWriteL9_Sports(partId, audioKey);
    case 10: return makeStarterWriteL10_Picnic(partId, audioKey);
    case 11: return makeStarterWriteL11_Library(partId, audioKey);
    case 12: return makeStarterWriteL12_Bicycle(partId, audioKey);
    case 13: return makeStarterWriteL13_Cooking(partId, audioKey);
    case 14: return makeStarterWriteL14_Swimming(partId, audioKey);
    case 15: return makeStarterWriteL15_Farm(partId, audioKey);
    case 16: return makeStarterWriteL16_PetsHome(partId, audioKey);
    case 17: return makeStarterWriteL17_Sleepover(partId, audioKey);
    case 18: return makeStarterWriteL18_GardenPlay(partId, audioKey);
    case 19: return makeStarterWriteL19_Train(partId, audioKey);
    default: return makeStarterWriteL20_Snow(partId, audioKey);
  }
}

// ─── Part 3: Listen & tick — Starters difficulty (5 variants) ──────────

/**
 * Starters Tick — variant 0: Shopping items (bag, clock, doll, dog, apples).
 * The original template, kept stable for backward compat.
 */
function makeStarterTickV0_Shopping(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick',
    partId,
    audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `Which handbag does May want? She wants the red one with the bear. The red one. ` +
      `Now listen and tick the box. There are five questions. ` +
      `One. What time will Lucy learn English? At three o'clock. ` +
      `Two. What's in the car? In the car there is a teddy bear and a shirt. ` +
      `Three. Where is the doll? The doll is on the bed. ` +
      `Four. What does Tom have? Tom has a dog. ` +
      `Five. How many apples are there? There are three apples.`,
    example: {
      questionId: 'ex',
      prompt: 'Which handbag does May want?',
      options: [
        { id: 'A', iconId: 'bag_red' },
        { id: 'B', iconId: 'bag_blue' },
        { id: 'C', iconId: 'bag_blue_empty' },
      ],
      correctOptionId: 'A',
    },
    questions: [
      {
        questionId: 'q1',
        prompt: 'What time will Lucy learn English?',
        options: [
          { id: 'A', iconId: 'clock_3' },
          { id: 'B', iconId: 'clock_4' },
          { id: 'C', iconId: 'clock_6' },
        ],
        correctOptionId: 'A',
      },
      {
        questionId: 'q2',
        prompt: "What's in the car?",
        options: [
          { id: 'A', iconId: 'shirt_red' },
          { id: 'B', iconId: 'umbrella_green' },
          { id: 'C', iconId: 'umbrella_red' },
        ],
        correctOptionId: 'A',
      },
      {
        questionId: 'q3',
        prompt: 'Where is the doll?',
        options: [
          { id: 'A', iconId: 'doll_under_chair' },
          { id: 'B', iconId: 'doll_on_bed' },
          { id: 'C', iconId: 'doll_in_box' },
        ],
        correctOptionId: 'B',
      },
      {
        questionId: 'q4',
        prompt: 'What does Tom have?',
        options: [
          { id: 'A', iconId: 'cat' },
          { id: 'B', iconId: 'dog' },
          { id: 'C', iconId: 'fish' },
        ],
        correctOptionId: 'B',
      },
      {
        questionId: 'q5',
        prompt: 'How many apples are there?',
        options: [
          { id: 'A', iconId: 'count_2' },
          { id: 'B', iconId: 'count_3' },
          { id: 'C', iconId: 'count_4' },
        ],
        correctOptionId: 'B',
      },
    ],
  };
}

/** Starters Tick — variant 1: Animals at home (cat positions, pets). */
function makeStarterTickV1_Animals(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick',
    partId,
    audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `Where is the cat? The cat is on the table. ` +
      `Now listen and tick the box. There are five questions. ` +
      `One. What is in the box? A doll is in the box. ` +
      `Two. What pet does Sam have? Sam has a rabbit. ` +
      `Three. What can fly? A bird can fly. ` +
      `Four. How many rabbits are there? There are four rabbits. ` +
      `Five. What lives in water? A fish lives in water.`,
    example: {
      questionId: 'ex',
      prompt: 'Where is the cat?',
      options: [
        { id: 'A', iconId: 'cat_under_bed' },
        { id: 'B', iconId: 'cat_on_table' },
        { id: 'C', iconId: 'cat_in_box' },
      ],
      correctOptionId: 'B',
    },
    questions: [
      {
        questionId: 'q1',
        prompt: 'What is in the box?',
        options: [
          { id: 'A', iconId: 'cat_in_box' },
          { id: 'B', iconId: 'doll_in_box' },
          { id: 'C', iconId: 'bag_blue' },
        ],
        correctOptionId: 'B',
      },
      {
        questionId: 'q2',
        prompt: 'What pet does Sam have?',
        options: [
          { id: 'A', iconId: 'cat' },
          { id: 'B', iconId: 'rabbit' },
          { id: 'C', iconId: 'fish' },
        ],
        correctOptionId: 'B',
      },
      {
        questionId: 'q3',
        prompt: 'What can fly?',
        options: [
          { id: 'A', iconId: 'fish' },
          { id: 'B', iconId: 'bird' },
          { id: 'C', iconId: 'rabbit' },
        ],
        correctOptionId: 'B',
      },
      {
        questionId: 'q4',
        prompt: 'How many rabbits?',
        options: [
          { id: 'A', iconId: 'count_2' },
          { id: 'B', iconId: 'count_4' },
          { id: 'C', iconId: 'count_5' },
        ],
        correctOptionId: 'B',
      },
      {
        questionId: 'q5',
        prompt: 'What lives in water?',
        options: [
          { id: 'A', iconId: 'fish' },
          { id: 'B', iconId: 'bird' },
          { id: 'C', iconId: 'cat' },
        ],
        correctOptionId: 'A',
      },
    ],
  };
}

/** Starters Tick — variant 2: Food and snacks (fruits, cake, bread). */
function makeStarterTickV2_Food(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick',
    partId,
    audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What is on the table? There is bread on the table. ` +
      `Now listen and tick the box. There are five questions. ` +
      `One. What does Tom eat for breakfast? Tom eats a banana. ` +
      `Two. How many cakes are there? There are two cakes. ` +
      `Three. What is the dessert? The dessert is a cake. ` +
      `Four. What is orange? The orange is orange. ` +
      `Five. What is in the bowl? An apple is in the bowl.`,
    example: {
      questionId: 'ex',
      prompt: 'What is on the table?',
      options: [
        { id: 'A', iconId: 'cake' },
        { id: 'B', iconId: 'bread' },
        { id: 'C', iconId: 'banana' },
      ],
      correctOptionId: 'B',
    },
    questions: [
      {
        questionId: 'q1',
        prompt: 'What does Tom eat for breakfast?',
        options: [
          { id: 'A', iconId: 'apple' },
          { id: 'B', iconId: 'banana' },
          { id: 'C', iconId: 'orange' },
        ],
        correctOptionId: 'B',
      },
      {
        questionId: 'q2',
        prompt: 'How many cakes?',
        options: [
          { id: 'A', iconId: 'count_2' },
          { id: 'B', iconId: 'count_3' },
          { id: 'C', iconId: 'count_4' },
        ],
        correctOptionId: 'A',
      },
      {
        questionId: 'q3',
        prompt: 'What is the dessert?',
        options: [
          { id: 'A', iconId: 'bread' },
          { id: 'B', iconId: 'cake' },
          { id: 'C', iconId: 'apple' },
        ],
        correctOptionId: 'B',
      },
      {
        questionId: 'q4',
        prompt: 'Which fruit is orange?',
        options: [
          { id: 'A', iconId: 'apple' },
          { id: 'B', iconId: 'orange' },
          { id: 'C', iconId: 'banana' },
        ],
        correctOptionId: 'B',
      },
      {
        questionId: 'q5',
        prompt: 'What is in the bowl?',
        options: [
          { id: 'A', iconId: 'apple' },
          { id: 'B', iconId: 'bread' },
          { id: 'C', iconId: 'cake' },
        ],
        correctOptionId: 'A',
      },
    ],
  };
}

/** Starters Tick — variant 3: At school (books, pens, clocks). */
function makeStarterTickV3_School(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick',
    partId,
    audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What does Tom have? Tom has a book. ` +
      `Now listen and tick the box. There are five questions. ` +
      `One. What time is the maths class? The maths class is at four. ` +
      `Two. How many pens are there? There are three pens. ` +
      `Three. What is in the bag? A ball is in the bag. ` +
      `Four. What does May draw? May draws a kite. ` +
      `Five. How many books are there? There are five books.`,
    example: {
      questionId: 'ex',
      prompt: 'What does Tom have?',
      options: [
        { id: 'A', iconId: 'book' },
        { id: 'B', iconId: 'pen' },
        { id: 'C', iconId: 'ball' },
      ],
      correctOptionId: 'A',
    },
    questions: [
      {
        questionId: 'q1',
        prompt: 'What time is the maths class?',
        options: [
          { id: 'A', iconId: 'clock_3' },
          { id: 'B', iconId: 'clock_4' },
          { id: 'C', iconId: 'clock_6' },
        ],
        correctOptionId: 'B',
      },
      {
        questionId: 'q2',
        prompt: 'How many pens?',
        options: [
          { id: 'A', iconId: 'count_2' },
          { id: 'B', iconId: 'count_3' },
          { id: 'C', iconId: 'count_5' },
        ],
        correctOptionId: 'B',
      },
      {
        questionId: 'q3',
        prompt: 'What is in the bag?',
        options: [
          { id: 'A', iconId: 'ball' },
          { id: 'B', iconId: 'book' },
          { id: 'C', iconId: 'kite' },
        ],
        correctOptionId: 'A',
      },
      {
        questionId: 'q4',
        prompt: 'What does May draw?',
        options: [
          { id: 'A', iconId: 'ball' },
          { id: 'B', iconId: 'kite' },
          { id: 'C', iconId: 'doll_in_box' },
        ],
        correctOptionId: 'B',
      },
      {
        questionId: 'q5',
        prompt: 'How many books?',
        options: [
          { id: 'A', iconId: 'count_3' },
          { id: 'B', iconId: 'count_4' },
          { id: 'C', iconId: 'count_5' },
        ],
        correctOptionId: 'C',
      },
    ],
  };
}

/** Starters Tick — variant 4: Colours and clothes (shirt, umbrella, doll). */
function makeStarterTickV4_Colours(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick',
    partId,
    audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What does May wear? May wears a red shirt. ` +
      `Now listen and tick the box. There are five questions. ` +
      `One. What is blue? The shirt is blue. ` +
      `Two. Where is the doll? The doll is in the box. ` +
      `Three. What does Tom hold? Tom holds a green umbrella. ` +
      `Four. How many shirts are there? There are two shirts. ` +
      `Five. What is empty? The blue bag is empty.`,
    example: {
      questionId: 'ex',
      prompt: 'What does May wear?',
      options: [
        { id: 'A', iconId: 'shirt_red' },
        { id: 'B', iconId: 'shirt_blue' },
        { id: 'C', iconId: 'bag_red' },
      ],
      correctOptionId: 'A',
    },
    questions: [
      {
        questionId: 'q1',
        prompt: 'What is blue?',
        options: [
          { id: 'A', iconId: 'shirt_blue' },
          { id: 'B', iconId: 'umbrella_green' },
          { id: 'C', iconId: 'bag_red' },
        ],
        correctOptionId: 'A',
      },
      {
        questionId: 'q2',
        prompt: 'Where is the doll?',
        options: [
          { id: 'A', iconId: 'doll_on_bed' },
          { id: 'B', iconId: 'doll_in_box' },
          { id: 'C', iconId: 'doll_under_chair' },
        ],
        correctOptionId: 'B',
      },
      {
        questionId: 'q3',
        prompt: 'What does Tom hold?',
        options: [
          { id: 'A', iconId: 'umbrella_red' },
          { id: 'B', iconId: 'umbrella_green' },
          { id: 'C', iconId: 'kite' },
        ],
        correctOptionId: 'B',
      },
      {
        questionId: 'q4',
        prompt: 'How many shirts?',
        options: [
          { id: 'A', iconId: 'count_2' },
          { id: 'B', iconId: 'count_3' },
          { id: 'C', iconId: 'count_5' },
        ],
        correctOptionId: 'A',
      },
      {
        questionId: 'q5',
        prompt: 'What is empty?',
        options: [
          { id: 'A', iconId: 'bag_blue_empty' },
          { id: 'B', iconId: 'bag_blue' },
          { id: 'C', iconId: 'bag_red' },
        ],
        correctOptionId: 'A',
      },
    ],
  };
}

/** Starters Tick — Level 6: Beach trip (shirts, umbrellas, balls, swim time). */
function makeStarterTickL6_Beach(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick',
    partId,
    audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What does Tom wear at the beach? He wears a red shirt. ` +
      `Now listen and tick the box. There are five questions. ` +
      `One. What does May hold? She holds a red umbrella. ` +
      `Two. How many balls are on the sand? Three balls. ` +
      `Three. What time do they swim? At four o'clock. ` +
      `Four. What is in the beach bag? A book is in the bag. ` +
      `Five. How many blue shirts are there? Two blue shirts.`,
    example: {
      questionId: 'ex',
      prompt: 'What does Tom wear?',
      options: [
        { id: 'A', iconId: 'shirt_red' },
        { id: 'B', iconId: 'shirt_blue' },
        { id: 'C', iconId: 'umbrella_red' },
      ],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'What does May hold?',
        options: [
          { id: 'A', iconId: 'umbrella_red' },
          { id: 'B', iconId: 'umbrella_green' },
          { id: 'C', iconId: 'kite' },
        ], correctOptionId: 'A' },
      { questionId: 'q2', prompt: 'How many balls on the sand?',
        options: [
          { id: 'A', iconId: 'count_2' },
          { id: 'B', iconId: 'count_3' },
          { id: 'C', iconId: 'count_4' },
        ], correctOptionId: 'B' },
      { questionId: 'q3', prompt: 'Swim time?',
        options: [
          { id: 'A', iconId: 'clock_3' },
          { id: 'B', iconId: 'clock_4' },
          { id: 'C', iconId: 'clock_6' },
        ], correctOptionId: 'B' },
      { questionId: 'q4', prompt: 'What is in the beach bag?',
        options: [
          { id: 'A', iconId: 'ball' },
          { id: 'B', iconId: 'kite' },
          { id: 'C', iconId: 'book' },
        ], correctOptionId: 'C' },
      { questionId: 'q5', prompt: 'How many blue shirts?',
        options: [
          { id: 'A', iconId: 'count_2' },
          { id: 'B', iconId: 'count_3' },
          { id: 'C', iconId: 'count_5' },
        ], correctOptionId: 'A' },
    ],
  };
}

/** Starters Tick — Level 7: Garden pets (cat positions, bird, dog, rabbit). */
function makeStarterTickL7_GardenPets(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick',
    partId,
    audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `Where is the cat sleeping? The cat is under the chair. ` +
      `Now listen and tick the box. There are five questions. ` +
      `One. What flies in the garden? A bird flies. ` +
      `Two. How many rabbits are there? There are three rabbits. ` +
      `Three. What does the dog hold in its mouth? A ball. ` +
      `Four. Where is the other cat? On the table. ` +
      `Five. How many trees can you see? Five trees.`,
    example: {
      questionId: 'ex',
      prompt: 'Where is the cat sleeping?',
      options: [
        { id: 'A', iconId: 'cat_under_bed' },
        { id: 'B', iconId: 'cat_in_box' },
        { id: 'C', iconId: 'cat_on_table' },
      ],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'What flies?',
        options: [
          { id: 'A', iconId: 'bird' },
          { id: 'B', iconId: 'fish' },
          { id: 'C', iconId: 'rabbit' },
        ], correctOptionId: 'A' },
      { questionId: 'q2', prompt: 'How many rabbits?',
        options: [
          { id: 'A', iconId: 'count_2' },
          { id: 'B', iconId: 'count_3' },
          { id: 'C', iconId: 'count_4' },
        ], correctOptionId: 'B' },
      { questionId: 'q3', prompt: 'What does the dog hold?',
        options: [
          { id: 'A', iconId: 'ball' },
          { id: 'B', iconId: 'book' },
          { id: 'C', iconId: 'kite' },
        ], correctOptionId: 'A' },
      { questionId: 'q4', prompt: 'Where is the other cat?',
        options: [
          { id: 'A', iconId: 'cat_under_bed' },
          { id: 'B', iconId: 'cat_on_table' },
          { id: 'C', iconId: 'cat_in_box' },
        ], correctOptionId: 'B' },
      { questionId: 'q5', prompt: 'How many trees?',
        options: [
          { id: 'A', iconId: 'count_3' },
          { id: 'B', iconId: 'count_4' },
          { id: 'C', iconId: 'count_5' },
        ], correctOptionId: 'C' },
    ],
  };
}

/** Starters Tick — Level 8: Toy shop (dolls, bags, balls, kites). */
function makeStarterTickL8_ToyShop(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick',
    partId,
    audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What does May buy first? She buys a doll. ` +
      `Now listen and tick the box. There are five questions. ` +
      `One. How many balls are on the shelf? Four balls. ` +
      `Two. What colour is May's new bag? It is red. ` +
      `Three. Where does Tom put the doll? On the bed. ` +
      `Four. What does Tom want? Tom wants a kite. ` +
      `Five. What time does the shop close? At six o'clock.`,
    example: {
      questionId: 'ex',
      prompt: 'What does May buy first?',
      options: [
        { id: 'A', iconId: 'doll_in_box' },
        { id: 'B', iconId: 'ball' },
        { id: 'C', iconId: 'book' },
      ],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'How many balls?',
        options: [
          { id: 'A', iconId: 'count_3' },
          { id: 'B', iconId: 'count_4' },
          { id: 'C', iconId: 'count_5' },
        ], correctOptionId: 'B' },
      { questionId: 'q2', prompt: "May's new bag colour?",
        options: [
          { id: 'A', iconId: 'bag_red' },
          { id: 'B', iconId: 'bag_blue' },
          { id: 'C', iconId: 'bag_blue_empty' },
        ], correctOptionId: 'A' },
      { questionId: 'q3', prompt: 'Where does Tom put the doll?',
        options: [
          { id: 'A', iconId: 'doll_under_chair' },
          { id: 'B', iconId: 'doll_on_bed' },
          { id: 'C', iconId: 'doll_in_box' },
        ], correctOptionId: 'B' },
      { questionId: 'q4', prompt: 'What does Tom want?',
        options: [
          { id: 'A', iconId: 'ball' },
          { id: 'B', iconId: 'kite' },
          { id: 'C', iconId: 'book' },
        ], correctOptionId: 'B' },
      { questionId: 'q5', prompt: 'Shop closing time?',
        options: [
          { id: 'A', iconId: 'clock_3' },
          { id: 'B', iconId: 'clock_4' },
          { id: 'C', iconId: 'clock_6' },
        ], correctOptionId: 'C' },
    ],
  };
}

/** Starters Tick — Level 9: Sports day (ball, runners count, race time, trophies). */
function makeStarterTickL9_Sports(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick',
    partId,
    audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What does Tom kick? He kicks a ball. ` +
      `Now listen and tick the box. There are five questions. ` +
      `One. How many runners are in the race? Five runners. ` +
      `Two. What time does the race start? At four o'clock. ` +
      `Three. What colour is the winner's shirt? It is red. ` +
      `Four. What prize does the winner get? A red bag. ` +
      `Five. How many trophies are on the table? Three trophies.`,
    example: {
      questionId: 'ex',
      prompt: 'What does Tom kick?',
      options: [
        { id: 'A', iconId: 'ball' },
        { id: 'B', iconId: 'kite' },
        { id: 'C', iconId: 'doll_in_box' },
      ],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'How many runners?',
        options: [
          { id: 'A', iconId: 'count_3' },
          { id: 'B', iconId: 'count_5' },
          { id: 'C', iconId: 'count_4' },
        ], correctOptionId: 'B' },
      { questionId: 'q2', prompt: 'Race start time?',
        options: [
          { id: 'A', iconId: 'clock_3' },
          { id: 'B', iconId: 'clock_4' },
          { id: 'C', iconId: 'clock_6' },
        ], correctOptionId: 'B' },
      { questionId: 'q3', prompt: "Winner's shirt?",
        options: [
          { id: 'A', iconId: 'shirt_red' },
          { id: 'B', iconId: 'shirt_blue' },
          { id: 'C', iconId: 'bag_red' },
        ], correctOptionId: 'A' },
      { questionId: 'q4', prompt: 'Winner prize?',
        options: [
          { id: 'A', iconId: 'bag_red' },
          { id: 'B', iconId: 'bag_blue' },
          { id: 'C', iconId: 'bag_blue_empty' },
        ], correctOptionId: 'A' },
      { questionId: 'q5', prompt: 'How many trophies?',
        options: [
          { id: 'A', iconId: 'count_2' },
          { id: 'B', iconId: 'count_3' },
          { id: 'C', iconId: 'count_4' },
        ], correctOptionId: 'B' },
    ],
  };
}

/** Starters Tick — Level 10: Picnic food (sandwiches, fruits, drinks, cakes). */
function makeStarterTickL10_Picnic(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick',
    partId,
    audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What does Mum bring to the picnic? She brings a cake. ` +
      `Now listen and tick the box. There are five questions. ` +
      `One. How many sandwiches are there? Five sandwiches. ` +
      `Two. What does Sam eat? Sam eats a banana. ` +
      `Three. How many cakes are on the cloth? Three cakes. ` +
      `Four. What time do they eat? At one o'clock. ` +
      `Five. How many oranges are in the basket? Four oranges.`,
    example: {
      questionId: 'ex',
      prompt: 'What does Mum bring?',
      options: [
        { id: 'A', iconId: 'bread' },
        { id: 'B', iconId: 'cake' },
        { id: 'C', iconId: 'apple' },
      ],
      correctOptionId: 'B',
    },
    questions: [
      { questionId: 'q1', prompt: 'How many sandwiches?',
        options: [
          { id: 'A', iconId: 'count_3' },
          { id: 'B', iconId: 'count_5' },
          { id: 'C', iconId: 'count_2' },
        ], correctOptionId: 'B' },
      { questionId: 'q2', prompt: 'What does Sam eat?',
        options: [
          { id: 'A', iconId: 'apple' },
          { id: 'B', iconId: 'banana' },
          { id: 'C', iconId: 'orange' },
        ], correctOptionId: 'B' },
      { questionId: 'q3', prompt: 'How many cakes?',
        options: [
          { id: 'A', iconId: 'count_2' },
          { id: 'B', iconId: 'count_3' },
          { id: 'C', iconId: 'count_4' },
        ], correctOptionId: 'B' },
      { questionId: 'q4', prompt: 'Eat time?',
        options: [
          { id: 'A', iconId: 'clock_3' },
          { id: 'B', iconId: 'clock_4' },
          { id: 'C', iconId: 'clock_6' },
        ], correctOptionId: 'A' },
      { questionId: 'q5', prompt: 'How many oranges?',
        options: [
          { id: 'A', iconId: 'count_3' },
          { id: 'B', iconId: 'count_4' },
          { id: 'C', iconId: 'count_5' },
        ], correctOptionId: 'B' },
    ],
  };
}

/** Starters Tick — Level 11: Library (books, pens, reading time). */
function makeStarterTickL11_Library(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick',
    partId,
    audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What is Anna reading? Anna is reading a book. ` +
      `Now listen and tick the box. There are five questions. ` +
      `One. How many books are on the shelf? Five books. ` +
      `Two. What is in Anna's bag? A book is in the bag. ` +
      `Three. What time does Anna read? At three o'clock. ` +
      `Four. What does Anna draw? A kite. ` +
      `Five. How many pens does Sue have? Four pens.`,
    example: {
      questionId: 'ex',
      prompt: 'What is Anna reading?',
      options: [
        { id: 'A', iconId: 'book' },
        { id: 'B', iconId: 'pen' },
        { id: 'C', iconId: 'ball' },
      ],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'How many books?',
        options: [
          { id: 'A', iconId: 'count_3' },
          { id: 'B', iconId: 'count_4' },
          { id: 'C', iconId: 'count_5' },
        ], correctOptionId: 'C' },
      { questionId: 'q2', prompt: "In Anna's bag?",
        options: [
          { id: 'A', iconId: 'book' },
          { id: 'B', iconId: 'ball' },
          { id: 'C', iconId: 'kite' },
        ], correctOptionId: 'A' },
      { questionId: 'q3', prompt: 'Read time?',
        options: [
          { id: 'A', iconId: 'clock_3' },
          { id: 'B', iconId: 'clock_4' },
          { id: 'C', iconId: 'clock_6' },
        ], correctOptionId: 'A' },
      { questionId: 'q4', prompt: 'What does Anna draw?',
        options: [
          { id: 'A', iconId: 'ball' },
          { id: 'B', iconId: 'kite' },
          { id: 'C', iconId: 'book' },
        ], correctOptionId: 'B' },
      { questionId: 'q5', prompt: 'How many pens?',
        options: [
          { id: 'A', iconId: 'count_3' },
          { id: 'B', iconId: 'count_4' },
          { id: 'C', iconId: 'count_5' },
        ], correctOptionId: 'B' },
    ],
  };
}

/** Starters Tick — Level 12: Bicycle ride (red shirt, 2 wheels, kite, umbrella). */
function makeStarterTickL12_Bicycle(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick',
    partId,
    audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What does Ben wear? Ben wears a red shirt. ` +
      `Now listen and tick the box. There are five questions. ` +
      `One. What colour is blue? The shirt is blue. ` +
      `Two. How many wheels does the bike have? Two wheels. ` +
      `Three. What does Ben hold? A kite. ` +
      `Four. What colour is Lily's umbrella? Green. ` +
      `Five. What time do they go home? At six o'clock.`,
    example: {
      questionId: 'ex',
      prompt: 'What does Ben wear?',
      options: [
        { id: 'A', iconId: 'shirt_red' },
        { id: 'B', iconId: 'shirt_blue' },
        { id: 'C', iconId: 'bag_red' },
      ],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'What is blue?',
        options: [
          { id: 'A', iconId: 'shirt_blue' },
          { id: 'B', iconId: 'umbrella_green' },
          { id: 'C', iconId: 'bag_red' },
        ], correctOptionId: 'A' },
      { questionId: 'q2', prompt: 'How many wheels?',
        options: [
          { id: 'A', iconId: 'count_2' },
          { id: 'B', iconId: 'count_3' },
          { id: 'C', iconId: 'count_4' },
        ], correctOptionId: 'A' },
      { questionId: 'q3', prompt: 'What does Ben hold?',
        options: [
          { id: 'A', iconId: 'ball' },
          { id: 'B', iconId: 'kite' },
          { id: 'C', iconId: 'book' },
        ], correctOptionId: 'B' },
      { questionId: 'q4', prompt: "Lily's umbrella colour?",
        options: [
          { id: 'A', iconId: 'umbrella_red' },
          { id: 'B', iconId: 'umbrella_green' },
          { id: 'C', iconId: 'bag_blue' },
        ], correctOptionId: 'B' },
      { questionId: 'q5', prompt: 'Home time?',
        options: [
          { id: 'A', iconId: 'clock_3' },
          { id: 'B', iconId: 'clock_4' },
          { id: 'C', iconId: 'clock_6' },
        ], correctOptionId: 'C' },
    ],
  };
}

/** Starters Tick — Level 13: Cooking (eggs, ingredients, baking time). */
function makeStarterTickL13_Cooking(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick',
    partId,
    audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What is in the bowl? An apple is in the bowl. ` +
      `Now listen and tick the box. There are five questions. ` +
      `One. How many eggs are there? Three eggs. ` +
      `Two. What does Mum need? Bread. ` +
      `Three. What time do they bake? At four o'clock. ` +
      `Four. What drink does Sam have? An orange. ` +
      `Five. How many cakes do they bake? Four cakes.`,
    example: {
      questionId: 'ex',
      prompt: 'What is in the bowl?',
      options: [
        { id: 'A', iconId: 'apple' },
        { id: 'B', iconId: 'banana' },
        { id: 'C', iconId: 'orange' },
      ],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'How many eggs?',
        options: [
          { id: 'A', iconId: 'count_2' },
          { id: 'B', iconId: 'count_3' },
          { id: 'C', iconId: 'count_4' },
        ], correctOptionId: 'B' },
      { questionId: 'q2', prompt: 'What does Mum need?',
        options: [
          { id: 'A', iconId: 'bread' },
          { id: 'B', iconId: 'cake' },
          { id: 'C', iconId: 'apple' },
        ], correctOptionId: 'A' },
      { questionId: 'q3', prompt: 'Bake time?',
        options: [
          { id: 'A', iconId: 'clock_3' },
          { id: 'B', iconId: 'clock_4' },
          { id: 'C', iconId: 'clock_6' },
        ], correctOptionId: 'B' },
      { questionId: 'q4', prompt: 'What does Sam have?',
        options: [
          { id: 'A', iconId: 'apple' },
          { id: 'B', iconId: 'banana' },
          { id: 'C', iconId: 'orange' },
        ], correctOptionId: 'C' },
      { questionId: 'q5', prompt: 'How many cakes?',
        options: [
          { id: 'A', iconId: 'count_2' },
          { id: 'B', iconId: 'count_3' },
          { id: 'C', iconId: 'count_4' },
        ], correctOptionId: 'C' },
    ],
  };
}

/** Starters Tick — Level 14: Swimming pool (ball, kids count, blue, umbrella). */
function makeStarterTickL14_Swimming(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick',
    partId,
    audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What does Tom play with? A ball. ` +
      `Now listen and tick the box. There are five questions. ` +
      `One. How many kids are in the pool? Five kids. ` +
      `Two. What colour is the float? Blue. ` +
      `Three. What time is the lesson? At three o'clock. ` +
      `Four. What is on the poolside? A red umbrella. ` +
      `Five. How many laps does Tom swim? Four laps.`,
    example: {
      questionId: 'ex',
      prompt: 'What does Tom play with?',
      options: [
        { id: 'A', iconId: 'ball' },
        { id: 'B', iconId: 'kite' },
        { id: 'C', iconId: 'book' },
      ],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'How many kids?',
        options: [
          { id: 'A', iconId: 'count_3' },
          { id: 'B', iconId: 'count_5' },
          { id: 'C', iconId: 'count_4' },
        ], correctOptionId: 'B' },
      { questionId: 'q2', prompt: 'Float colour?',
        options: [
          { id: 'A', iconId: 'shirt_blue' },
          { id: 'B', iconId: 'umbrella_green' },
          { id: 'C', iconId: 'bag_red' },
        ], correctOptionId: 'A' },
      { questionId: 'q3', prompt: 'Lesson time?',
        options: [
          { id: 'A', iconId: 'clock_3' },
          { id: 'B', iconId: 'clock_4' },
          { id: 'C', iconId: 'clock_6' },
        ], correctOptionId: 'A' },
      { questionId: 'q4', prompt: 'On poolside?',
        options: [
          { id: 'A', iconId: 'umbrella_red' },
          { id: 'B', iconId: 'umbrella_green' },
          { id: 'C', iconId: 'shirt_red' },
        ], correctOptionId: 'A' },
      { questionId: 'q5', prompt: 'How many laps?',
        options: [
          { id: 'A', iconId: 'count_3' },
          { id: 'B', iconId: 'count_4' },
          { id: 'C', iconId: 'count_5' },
        ], correctOptionId: 'B' },
    ],
  };
}

/** Starters Tick — Level 15: Farm visit (dog, cows count, bird, red bag). */
function makeStarterTickL15_Farm(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick',
    partId,
    audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What does Tim see first? A dog. ` +
      `Now listen and tick the box. There are five questions. ` +
      `One. Where is the farm cat? Under the bed. ` +
      `Two. How many cows are there? Five cows. ` +
      `Three. What flies above the farm? A bird. ` +
      `Four. What colour is the farm bag? Red. ` +
      `Five. How many pigs are there? Three pigs.`,
    example: {
      questionId: 'ex',
      prompt: 'What does Tim see?',
      options: [
        { id: 'A', iconId: 'dog' },
        { id: 'B', iconId: 'cat' },
        { id: 'C', iconId: 'fish' },
      ],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'Where is the cat?',
        options: [
          { id: 'A', iconId: 'cat_under_bed' },
          { id: 'B', iconId: 'cat_on_table' },
          { id: 'C', iconId: 'cat_in_box' },
        ], correctOptionId: 'A' },
      { questionId: 'q2', prompt: 'How many cows?',
        options: [
          { id: 'A', iconId: 'count_3' },
          { id: 'B', iconId: 'count_4' },
          { id: 'C', iconId: 'count_5' },
        ], correctOptionId: 'C' },
      { questionId: 'q3', prompt: 'What flies?',
        options: [
          { id: 'A', iconId: 'bird' },
          { id: 'B', iconId: 'fish' },
          { id: 'C', iconId: 'rabbit' },
        ], correctOptionId: 'A' },
      { questionId: 'q4', prompt: 'Bag colour?',
        options: [
          { id: 'A', iconId: 'bag_red' },
          { id: 'B', iconId: 'bag_blue' },
          { id: 'C', iconId: 'bag_blue_empty' },
        ], correctOptionId: 'A' },
      { questionId: 'q5', prompt: 'How many pigs?',
        options: [
          { id: 'A', iconId: 'count_2' },
          { id: 'B', iconId: 'count_3' },
          { id: 'C', iconId: 'count_4' },
        ], correctOptionId: 'B' },
    ],
  };
}

/** Starters Tick — Level 16: Pets at home (cat positions, fish, feeding time). */
function makeStarterTickL16_PetsHome(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick',
    partId,
    audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What does Lily feed first? The cat. ` +
      `Now listen and tick the box. There are five questions. ` +
      `One. Where is the cat now? On the table. ` +
      `Two. How many fish are there? Two fish. ` +
      `Three. What time does Lily feed them? At four o'clock. ` +
      `Four. What does the dog hold? A book. ` +
      `Five. How many pets does Lily have? Four pets.`,
    example: {
      questionId: 'ex',
      prompt: 'What does Lily feed first?',
      options: [
        { id: 'A', iconId: 'cat' },
        { id: 'B', iconId: 'dog' },
        { id: 'C', iconId: 'fish' },
      ],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'Where is the cat?',
        options: [
          { id: 'A', iconId: 'cat_under_bed' },
          { id: 'B', iconId: 'cat_on_table' },
          { id: 'C', iconId: 'cat_in_box' },
        ], correctOptionId: 'B' },
      { questionId: 'q2', prompt: 'How many fish?',
        options: [
          { id: 'A', iconId: 'count_2' },
          { id: 'B', iconId: 'count_3' },
          { id: 'C', iconId: 'count_4' },
        ], correctOptionId: 'A' },
      { questionId: 'q3', prompt: 'Feed time?',
        options: [
          { id: 'A', iconId: 'clock_3' },
          { id: 'B', iconId: 'clock_4' },
          { id: 'C', iconId: 'clock_6' },
        ], correctOptionId: 'B' },
      { questionId: 'q4', prompt: 'What does dog hold?',
        options: [
          { id: 'A', iconId: 'ball' },
          { id: 'B', iconId: 'book' },
          { id: 'C', iconId: 'kite' },
        ], correctOptionId: 'B' },
      { questionId: 'q5', prompt: 'How many pets?',
        options: [
          { id: 'A', iconId: 'count_3' },
          { id: 'B', iconId: 'count_4' },
          { id: 'C', iconId: 'count_5' },
        ], correctOptionId: 'B' },
    ],
  };
}

/** Starters Tick — Level 17: Sleepover (doll on bed, pillows, bedtime, teddy). */
function makeStarterTickL17_Sleepover(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick',
    partId,
    audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `Where is the doll? On the bed. ` +
      `Now listen and tick the box. There are five questions. ` +
      `One. What is on the floor? A ball. ` +
      `Two. How many pillows are there? Two pillows. ` +
      `Three. What time is bedtime? At six o'clock. ` +
      `Four. What colour is Eve's pyjama? Red. ` +
      `Five. How many books do they read? Three books.`,
    example: {
      questionId: 'ex',
      prompt: 'Where is the doll?',
      options: [
        { id: 'A', iconId: 'doll_on_bed' },
        { id: 'B', iconId: 'doll_in_box' },
        { id: 'C', iconId: 'doll_under_chair' },
      ],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'On the floor?',
        options: [
          { id: 'A', iconId: 'ball' },
          { id: 'B', iconId: 'doll_under_chair' },
          { id: 'C', iconId: 'cat_under_bed' },
        ], correctOptionId: 'A' },
      { questionId: 'q2', prompt: 'How many pillows?',
        options: [
          { id: 'A', iconId: 'count_2' },
          { id: 'B', iconId: 'count_3' },
          { id: 'C', iconId: 'count_4' },
        ], correctOptionId: 'A' },
      { questionId: 'q3', prompt: 'Bedtime?',
        options: [
          { id: 'A', iconId: 'clock_3' },
          { id: 'B', iconId: 'clock_4' },
          { id: 'C', iconId: 'clock_6' },
        ], correctOptionId: 'C' },
      { questionId: 'q4', prompt: "Eve's pyjama colour?",
        options: [
          { id: 'A', iconId: 'shirt_red' },
          { id: 'B', iconId: 'shirt_blue' },
          { id: 'C', iconId: 'umbrella_red' },
        ], correctOptionId: 'A' },
      { questionId: 'q5', prompt: 'How many books?',
        options: [
          { id: 'A', iconId: 'count_2' },
          { id: 'B', iconId: 'count_3' },
          { id: 'C', iconId: 'count_4' },
        ], correctOptionId: 'B' },
    ],
  };
}

/** Starters Tick — Level 18: Garden play (ball, kids count, game time, kite). */
function makeStarterTickL18_GardenPlay(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick',
    partId,
    audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What does Tom kick? A ball. ` +
      `Now listen and tick the box. There are five questions. ` +
      `One. How many kids are playing? Five kids. ` +
      `Two. What time does the game start? At three o'clock. ` +
      `Three. What does Lily fly? A kite. ` +
      `Four. What is the prize? A red bag. ` +
      `Five. How many trees are in the garden? Four trees.`,
    example: {
      questionId: 'ex',
      prompt: 'What does Tom kick?',
      options: [
        { id: 'A', iconId: 'ball' },
        { id: 'B', iconId: 'kite' },
        { id: 'C', iconId: 'doll_in_box' },
      ],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'How many kids?',
        options: [
          { id: 'A', iconId: 'count_3' },
          { id: 'B', iconId: 'count_5' },
          { id: 'C', iconId: 'count_4' },
        ], correctOptionId: 'B' },
      { questionId: 'q2', prompt: 'Game start?',
        options: [
          { id: 'A', iconId: 'clock_3' },
          { id: 'B', iconId: 'clock_4' },
          { id: 'C', iconId: 'clock_6' },
        ], correctOptionId: 'A' },
      { questionId: 'q3', prompt: 'What does Lily fly?',
        options: [
          { id: 'A', iconId: 'kite' },
          { id: 'B', iconId: 'ball' },
          { id: 'C', iconId: 'bird' },
        ], correctOptionId: 'A' },
      { questionId: 'q4', prompt: 'The prize?',
        options: [
          { id: 'A', iconId: 'bag_red' },
          { id: 'B', iconId: 'bag_blue' },
          { id: 'C', iconId: 'bag_blue_empty' },
        ], correctOptionId: 'A' },
      { questionId: 'q5', prompt: 'How many trees?',
        options: [
          { id: 'A', iconId: 'count_3' },
          { id: 'B', iconId: 'count_4' },
          { id: 'C', iconId: 'count_5' },
        ], correctOptionId: 'B' },
    ],
  };
}

/** Starters Tick — Level 19: Train ride (red bag, family count, departure, sandwiches). */
function makeStarterTickL19_Train(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick',
    partId,
    audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What does Mum carry? A red bag. ` +
      `Now listen and tick the box. There are five questions. ` +
      `One. How many family members go? Four members. ` +
      `Two. What time does the train leave? At six o'clock. ` +
      `Three. What is in the bag? A book. ` +
      `Four. What colour is sister's umbrella? Green. ` +
      `Five. How many sandwiches do they bring? Three sandwiches.`,
    example: {
      questionId: 'ex',
      prompt: 'What does Mum carry?',
      options: [
        { id: 'A', iconId: 'bag_red' },
        { id: 'B', iconId: 'bag_blue' },
        { id: 'C', iconId: 'umbrella_red' },
      ],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'How many family members?',
        options: [
          { id: 'A', iconId: 'count_3' },
          { id: 'B', iconId: 'count_4' },
          { id: 'C', iconId: 'count_5' },
        ], correctOptionId: 'B' },
      { questionId: 'q2', prompt: 'Train time?',
        options: [
          { id: 'A', iconId: 'clock_3' },
          { id: 'B', iconId: 'clock_4' },
          { id: 'C', iconId: 'clock_6' },
        ], correctOptionId: 'C' },
      { questionId: 'q3', prompt: 'In the bag?',
        options: [
          { id: 'A', iconId: 'apple' },
          { id: 'B', iconId: 'book' },
          { id: 'C', iconId: 'ball' },
        ], correctOptionId: 'B' },
      { questionId: 'q4', prompt: "Sister's umbrella?",
        options: [
          { id: 'A', iconId: 'umbrella_red' },
          { id: 'B', iconId: 'umbrella_green' },
          { id: 'C', iconId: 'shirt_blue' },
        ], correctOptionId: 'B' },
      { questionId: 'q5', prompt: 'How many sandwiches?',
        options: [
          { id: 'A', iconId: 'count_2' },
          { id: 'B', iconId: 'count_3' },
          { id: 'C', iconId: 'count_4' },
        ], correctOptionId: 'B' },
    ],
  };
}

/** Starters Tick — Level 20: Snow day (red coat, umbrella, snowballs count). */
function makeStarterTickL20_Snow(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick',
    partId,
    audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What does Tom wear? A red shirt. ` +
      `Now listen and tick the box. There are five questions. ` +
      `One. What does sister hold? A red umbrella. ` +
      `Two. How many snowballs are there? Five snowballs. ` +
      `Three. What time do they play? At four o'clock. ` +
      `Four. What colour is brother's bag? Red. ` +
      `Five. How many friends are in the snow? Three friends.`,
    example: {
      questionId: 'ex',
      prompt: 'What does Tom wear?',
      options: [
        { id: 'A', iconId: 'shirt_red' },
        { id: 'B', iconId: 'shirt_blue' },
        { id: 'C', iconId: 'bag_red' },
      ],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'Sister holds?',
        options: [
          { id: 'A', iconId: 'umbrella_red' },
          { id: 'B', iconId: 'umbrella_green' },
          { id: 'C', iconId: 'kite' },
        ], correctOptionId: 'A' },
      { questionId: 'q2', prompt: 'How many snowballs?',
        options: [
          { id: 'A', iconId: 'count_3' },
          { id: 'B', iconId: 'count_4' },
          { id: 'C', iconId: 'count_5' },
        ], correctOptionId: 'C' },
      { questionId: 'q3', prompt: 'Play time?',
        options: [
          { id: 'A', iconId: 'clock_3' },
          { id: 'B', iconId: 'clock_4' },
          { id: 'C', iconId: 'clock_6' },
        ], correctOptionId: 'B' },
      { questionId: 'q4', prompt: "Brother's bag colour?",
        options: [
          { id: 'A', iconId: 'bag_red' },
          { id: 'B', iconId: 'bag_blue' },
          { id: 'C', iconId: 'bag_blue_empty' },
        ], correctOptionId: 'A' },
      { questionId: 'q5', prompt: 'How many friends?',
        options: [
          { id: 'A', iconId: 'count_2' },
          { id: 'B', iconId: 'count_3' },
          { id: 'C', iconId: 'count_4' },
        ], correctOptionId: 'B' },
    ],
  };
}

/**
 * Dispatch Starters Tick template by level number (1-20).
 * All 20 levels now have unique content (Sessions 2.1 + 2.2 complete).
 */
function makeStarterTickPart(partId: string, audioKey: string, levelNumber: number): TickPart {
  switch (levelNumber) {
    case 1: return makeStarterTickV0_Shopping(partId, audioKey);
    case 2: return makeStarterTickV1_Animals(partId, audioKey);
    case 3: return makeStarterTickV2_Food(partId, audioKey);
    case 4: return makeStarterTickV3_School(partId, audioKey);
    case 5: return makeStarterTickV4_Colours(partId, audioKey);
    case 6: return makeStarterTickL6_Beach(partId, audioKey);
    case 7: return makeStarterTickL7_GardenPets(partId, audioKey);
    case 8: return makeStarterTickL8_ToyShop(partId, audioKey);
    case 9: return makeStarterTickL9_Sports(partId, audioKey);
    case 10: return makeStarterTickL10_Picnic(partId, audioKey);
    case 11: return makeStarterTickL11_Library(partId, audioKey);
    case 12: return makeStarterTickL12_Bicycle(partId, audioKey);
    case 13: return makeStarterTickL13_Cooking(partId, audioKey);
    case 14: return makeStarterTickL14_Swimming(partId, audioKey);
    case 15: return makeStarterTickL15_Farm(partId, audioKey);
    case 16: return makeStarterTickL16_PetsHome(partId, audioKey);
    case 17: return makeStarterTickL17_Sleepover(partId, audioKey);
    case 18: return makeStarterTickL18_GardenPlay(partId, audioKey);
    case 19: return makeStarterTickL19_Train(partId, audioKey);
    default: return makeStarterTickL20_Snow(partId, audioKey);
  }
}

/**
 * Movers tick part: A2 difficulty. Slightly more complex prompts (with
 * past simple, comparatives) using the same icon set. Same option
 * complexity (3 picture choices each) but harder discrimination.
 */
function makeMoverTickPart(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick',
    partId,
    audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `Which bag did Daisy take to school yesterday? She took the red one with the bear pattern. The red one. ` +
      `Now listen. There are five questions. ` +
      `One. Which class did Charlie have first? He had English at quarter past three. ` +
      `Two. What was in the car last weekend? There was a teddy bear and a striped shirt. ` +
      `Three. Where did Sophie put the doll? She put it on the bed, not on the chair. ` +
      `Four. What does Oliver have at home? Oliver has a big spotty dog. ` +
      `Five. How many apples did Hannah buy? She bought three apples and two oranges.`,
    example: {
      questionId: 'ex',
      prompt: 'Which bag did Daisy take?',
      options: [
        { id: 'A', iconId: 'bag_red' },
        { id: 'B', iconId: 'bag_blue' },
        { id: 'C', iconId: 'bag_blue_empty' },
      ],
      correctOptionId: 'A',
    },
    questions: [
      {
        questionId: 'q1',
        prompt: 'Which class did Charlie have first?',
        options: [
          { id: 'A', iconId: 'clock_3' },
          { id: 'B', iconId: 'clock_4' },
          { id: 'C', iconId: 'clock_5' },
        ],
        correctOptionId: 'A',
      },
      {
        questionId: 'q2',
        prompt: 'What was in the car last weekend?',
        options: [
          { id: 'A', iconId: 'car_teddy' },
          { id: 'B', iconId: 'car_shirt' },
          { id: 'C', iconId: 'car_book' },
        ],
        correctOptionId: 'B',
      },
      {
        questionId: 'q3',
        prompt: 'Where did Sophie put the doll?',
        options: [
          { id: 'A', iconId: 'doll_bed' },
          { id: 'B', iconId: 'doll_chair' },
          { id: 'C', iconId: 'doll_floor' },
        ],
        correctOptionId: 'A',
      },
      {
        questionId: 'q4',
        prompt: 'What does Oliver have at home?',
        options: [
          { id: 'A', iconId: 'pet_cat' },
          { id: 'B', iconId: 'pet_dog' },
          { id: 'C', iconId: 'pet_fish' },
        ],
        correctOptionId: 'B',
      },
      {
        questionId: 'q5',
        prompt: 'How many apples did Hannah buy?',
        options: [
          { id: 'A', iconId: 'apple_2' },
          { id: 'B', iconId: 'apple_3' },
          { id: 'C', iconId: 'apple_4' },
        ],
        correctOptionId: 'B',
      },
    ],
  };
}

// ─── D-18 Phase 3: Movers per-level Tick parts (L21-L30) ───────────────
// A2 prompts (past simple) with thematic icon options. Icons added in
// examIcons.tsx as part of this phase.

function makeMoverTickL21(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick', partId, audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What did the children put up first at camp? They put up the tent. The tent. ` +
      `Now listen. There are five questions. ` +
      `One. What did Sam carry on his back? He carried a backpack. ` +
      `Two. What did they catch in the lake? They caught a fish. ` +
      `Three. What did they sit around at night? They sat around the campfire. ` +
      `Four. How did they cross the lake? They crossed in a canoe. ` +
      `Five. How many tents did they put up? They put up six tents.`,
    example: {
      questionId: 'ex', prompt: 'What did they put up first?',
      options: [{ id: 'A', iconId: 'tent' }, { id: 'B', iconId: 'campfire' }, { id: 'C', iconId: 'canoe' }],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'What did Sam carry?', options: [{ id: 'A', iconId: 'backpack' }, { id: 'B', iconId: 'book' }, { id: 'C', iconId: 'ball' }], correctOptionId: 'A' },
      { questionId: 'q2', prompt: 'What did they catch in the lake?', options: [{ id: 'A', iconId: 'bird' }, { id: 'B', iconId: 'fish' }, { id: 'C', iconId: 'rabbit' }], correctOptionId: 'B' },
      { questionId: 'q3', prompt: 'What did they sit around?', options: [{ id: 'A', iconId: 'tent' }, { id: 'B', iconId: 'canoe' }, { id: 'C', iconId: 'campfire' }], correctOptionId: 'C' },
      { questionId: 'q4', prompt: 'How did they cross the lake?', options: [{ id: 'A', iconId: 'canoe' }, { id: 'B', iconId: 'kite' }, { id: 'C', iconId: 'ball' }], correctOptionId: 'A' },
      { questionId: 'q5', prompt: 'How many tents?', options: [{ id: 'A', iconId: 'count_4' }, { id: 'B', iconId: 'count_5' }, { id: 'C', iconId: 'count_6' }], correctOptionId: 'C' },
    ],
  };
}

function makeMoverTickL22(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick', partId, audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What did Charlie play in the lesson? He played the drums. The drums. ` +
      `Now listen. There are five questions. ` +
      `One. What did Daisy play? She played the guitar. ` +
      `Two. What did the teacher play? She played the piano. ` +
      `Three. What did Sophie blow? She blew the trumpet. ` +
      `Four. How many guitars were in the room? There were three guitars. ` +
      `Five. What did Grace sing into? She sang into the microphone.`,
    example: {
      questionId: 'ex', prompt: 'What did Charlie play?',
      options: [{ id: 'A', iconId: 'drum' }, { id: 'B', iconId: 'guitar' }, { id: 'C', iconId: 'piano' }],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'What did Daisy play?', options: [{ id: 'A', iconId: 'guitar' }, { id: 'B', iconId: 'violin' }, { id: 'C', iconId: 'trumpet' }], correctOptionId: 'A' },
      { questionId: 'q2', prompt: 'What did the teacher play?', options: [{ id: 'A', iconId: 'drum' }, { id: 'B', iconId: 'piano' }, { id: 'C', iconId: 'guitar' }], correctOptionId: 'B' },
      { questionId: 'q3', prompt: 'What did Sophie blow?', options: [{ id: 'A', iconId: 'violin' }, { id: 'B', iconId: 'microphone' }, { id: 'C', iconId: 'trumpet' }], correctOptionId: 'C' },
      { questionId: 'q4', prompt: 'How many guitars?', options: [{ id: 'A', iconId: 'count_2' }, { id: 'B', iconId: 'count_3' }, { id: 'C', iconId: 'count_4' }], correctOptionId: 'B' },
      { questionId: 'q5', prompt: 'What did Grace sing into?', options: [{ id: 'A', iconId: 'microphone' }, { id: 'B', iconId: 'trumpet' }, { id: 'C', iconId: 'book' }], correctOptionId: 'A' },
    ],
  };
}

function makeMoverTickL23(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick', partId, audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What did the children kick on the field? They kicked the football. The football. ` +
      `Now listen. There are five questions. ` +
      `One. What did the referee blow? He blew the whistle. ` +
      `Two. What did the winners hold up? They held up the trophy. ` +
      `Three. What colour were the shirts? The shirts were red. ` +
      `Four. How many goals did they score? They scored four goals. ` +
      `Five. What time did the match finish? It finished at five o'clock.`,
    example: {
      questionId: 'ex', prompt: 'What did they kick?',
      options: [{ id: 'A', iconId: 'soccer_ball' }, { id: 'B', iconId: 'ball' }, { id: 'C', iconId: 'kite' }],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'What did the referee blow?', options: [{ id: 'A', iconId: 'trumpet' }, { id: 'B', iconId: 'whistle' }, { id: 'C', iconId: 'microphone' }], correctOptionId: 'B' },
      { questionId: 'q2', prompt: 'What did the winners hold?', options: [{ id: 'A', iconId: 'medal' }, { id: 'B', iconId: 'cake' }, { id: 'C', iconId: 'trophy' }], correctOptionId: 'C' },
      { questionId: 'q3', prompt: 'Shirt colour?', options: [{ id: 'A', iconId: 'shirt_red' }, { id: 'B', iconId: 'shirt_blue' }, { id: 'C', iconId: 'umbrella_red' }], correctOptionId: 'A' },
      { questionId: 'q4', prompt: 'How many goals?', options: [{ id: 'A', iconId: 'count_3' }, { id: 'B', iconId: 'count_4' }, { id: 'C', iconId: 'count_5' }], correctOptionId: 'B' },
      { questionId: 'q5', prompt: 'What time did it finish?', options: [{ id: 'A', iconId: 'clock_4' }, { id: 'B', iconId: 'clock_5' }, { id: 'C', iconId: 'clock_6' }], correctOptionId: 'B' },
    ],
  };
}

function makeMoverTickL24(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick', partId, audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What did Grace wear on her feet? She wore ballet shoes. Ballet shoes. ` +
      `Now listen. There are five questions. ` +
      `One. What did the girls wear? They wore tutus. ` +
      `Two. What did Lily wave? She waved a dance ribbon. ` +
      `Three. What did they listen to? They listened to music. ` +
      `Four. How many girls wore tutus? Five girls wore tutus. ` +
      `Five. What played the music? The piano played the music.`,
    example: {
      questionId: 'ex', prompt: 'What did Grace wear on her feet?',
      options: [{ id: 'A', iconId: 'ballet_shoe' }, { id: 'B', iconId: 'ball' }, { id: 'C', iconId: 'shirt_red' }],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'What did the girls wear?', options: [{ id: 'A', iconId: 'tutu' }, { id: 'B', iconId: 'shirt_blue' }, { id: 'C', iconId: 'backpack' }], correctOptionId: 'A' },
      { questionId: 'q2', prompt: 'What did Lily wave?', options: [{ id: 'A', iconId: 'kite' }, { id: 'B', iconId: 'dance_ribbon' }, { id: 'C', iconId: 'whistle' }], correctOptionId: 'B' },
      { questionId: 'q3', prompt: 'What did they listen to?', options: [{ id: 'A', iconId: 'book' }, { id: 'B', iconId: 'pen' }, { id: 'C', iconId: 'music_note' }], correctOptionId: 'C' },
      { questionId: 'q4', prompt: 'How many girls wore tutus?', options: [{ id: 'A', iconId: 'count_4' }, { id: 'B', iconId: 'count_5' }, { id: 'C', iconId: 'count_6' }], correctOptionId: 'B' },
      { questionId: 'q5', prompt: 'What played the music?', options: [{ id: 'A', iconId: 'piano' }, { id: 'B', iconId: 'drum' }, { id: 'C', iconId: 'guitar' }], correctOptionId: 'A' },
    ],
  };
}

function makeMoverTickL25(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick', partId, audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What did Dad order at the restaurant? He ordered a pizza. A pizza. ` +
      `Now listen. There are five questions. ` +
      `One. What did Mum have? She had a bowl of soup. ` +
      `Two. What did the children drink? They drank orange juice. ` +
      `Three. What did they have for pudding? They had ice cream. ` +
      `Four. What did Tom eat? Tom ate a burger. ` +
      `Five. How many drinks did they buy? They bought four drinks.`,
    example: {
      questionId: 'ex', prompt: 'What did Dad order?',
      options: [{ id: 'A', iconId: 'pizza' }, { id: 'B', iconId: 'burger' }, { id: 'C', iconId: 'soup_bowl' }],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'What did Mum have?', options: [{ id: 'A', iconId: 'salad' }, { id: 'B', iconId: 'soup_bowl' }, { id: 'C', iconId: 'pizza' }], correctOptionId: 'B' },
      { questionId: 'q2', prompt: 'What did the children drink?', options: [{ id: 'A', iconId: 'juice_glass' }, { id: 'B', iconId: 'cake' }, { id: 'C', iconId: 'banana' }], correctOptionId: 'A' },
      { questionId: 'q3', prompt: 'What for pudding?', options: [{ id: 'A', iconId: 'bread' }, { id: 'B', iconId: 'cake' }, { id: 'C', iconId: 'ice_cream' }], correctOptionId: 'C' },
      { questionId: 'q4', prompt: 'What did Tom eat?', options: [{ id: 'A', iconId: 'burger' }, { id: 'B', iconId: 'sandwich' }, { id: 'C', iconId: 'pizza' }], correctOptionId: 'A' },
      { questionId: 'q5', prompt: 'How many drinks?', options: [{ id: 'A', iconId: 'count_3' }, { id: 'B', iconId: 'count_4' }, { id: 'C', iconId: 'count_5' }], correctOptionId: 'B' },
    ],
  };
}

function makeMoverTickL26(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick', partId, audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `How did the family travel to town? They went by bus. By bus. ` +
      `Now listen. There are five questions. ` +
      `One. What did they show the driver? They showed a ticket. ` +
      `Two. What did Grace carry? She carried a suitcase. ` +
      `Three. What did they see from the window? They saw the traffic lights. ` +
      `Four. How many stops did they go? They went seven stops. ` +
      `Five. What time did the bus leave? It left at eight o'clock.`,
    example: {
      questionId: 'ex', prompt: 'How did they travel?',
      options: [{ id: 'A', iconId: 'bus' }, { id: 'B', iconId: 'bag_red' }, { id: 'C', iconId: 'book' }],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'What did they show the driver?', options: [{ id: 'A', iconId: 'book' }, { id: 'B', iconId: 'ticket' }, { id: 'C', iconId: 'pen' }], correctOptionId: 'B' },
      { questionId: 'q2', prompt: 'What did Grace carry?', options: [{ id: 'A', iconId: 'suitcase' }, { id: 'B', iconId: 'backpack' }, { id: 'C', iconId: 'bag_red' }], correctOptionId: 'A' },
      { questionId: 'q3', prompt: 'What did they see from the window?', options: [{ id: 'A', iconId: 'bird' }, { id: 'B', iconId: 'kite' }, { id: 'C', iconId: 'traffic_light' }], correctOptionId: 'C' },
      { questionId: 'q4', prompt: 'How many stops?', options: [{ id: 'A', iconId: 'count_5' }, { id: 'B', iconId: 'count_6' }, { id: 'C', iconId: 'count_7' }], correctOptionId: 'C' },
      { questionId: 'q5', prompt: 'What time did it leave?', options: [{ id: 'A', iconId: 'clock_6' }, { id: 'B', iconId: 'clock_8' }, { id: 'C', iconId: 'clock_4' }], correctOptionId: 'B' },
    ],
  };
}

function makeMoverTickL27(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick', partId, audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What was the biggest animal at the zoo? It was the elephant. The elephant. ` +
      `Now listen. There are five questions. ` +
      `One. How many lions did they see? They saw two lions. ` +
      `Two. What did they feed? They fed the giraffe. ` +
      `Three. What climbed up the tree? The monkey climbed up. ` +
      `Four. What animal was long and thin? The snake was long and thin. ` +
      `Five. What did they watch swimming? They watched the penguins.`,
    example: {
      questionId: 'ex', prompt: 'What was the biggest animal?',
      options: [{ id: 'A', iconId: 'elephant' }, { id: 'B', iconId: 'lion' }, { id: 'C', iconId: 'monkey' }],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'How many lions?', options: [{ id: 'A', iconId: 'count_2' }, { id: 'B', iconId: 'count_3' }, { id: 'C', iconId: 'count_4' }], correctOptionId: 'A' },
      { questionId: 'q2', prompt: 'What did they feed?', options: [{ id: 'A', iconId: 'monkey' }, { id: 'B', iconId: 'giraffe' }, { id: 'C', iconId: 'penguin' }], correctOptionId: 'B' },
      { questionId: 'q3', prompt: 'What climbed the tree?', options: [{ id: 'A', iconId: 'snake' }, { id: 'B', iconId: 'lion' }, { id: 'C', iconId: 'monkey' }], correctOptionId: 'C' },
      { questionId: 'q4', prompt: 'What was long and thin?', options: [{ id: 'A', iconId: 'snake' }, { id: 'B', iconId: 'fish' }, { id: 'C', iconId: 'bird' }], correctOptionId: 'A' },
      { questionId: 'q5', prompt: 'What did they watch swim?', options: [{ id: 'A', iconId: 'fish' }, { id: 'B', iconId: 'penguin' }, { id: 'C', iconId: 'cat' }], correctOptionId: 'B' },
    ],
  };
}

function makeMoverTickL28(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick', partId, audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What did the children see first at the museum? They saw a dinosaur. A dinosaur. ` +
      `Now listen. There are five questions. ` +
      `One. What was on the wall? There was a painting. ` +
      `Two. What was made of stone? The statue was made of stone. ` +
      `Three. What did Kate point at? She pointed at an old vase. ` +
      `Four. How many paintings were there? There were six paintings. ` +
      `Five. What did they write with? They wrote with a pen.`,
    example: {
      questionId: 'ex', prompt: 'What did they see first?',
      options: [{ id: 'A', iconId: 'dinosaur' }, { id: 'B', iconId: 'statue' }, { id: 'C', iconId: 'vase' }],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'What was on the wall?', options: [{ id: 'A', iconId: 'painting' }, { id: 'B', iconId: 'book' }, { id: 'C', iconId: 'clock_6' }], correctOptionId: 'A' },
      { questionId: 'q2', prompt: 'What was made of stone?', options: [{ id: 'A', iconId: 'vase' }, { id: 'B', iconId: 'statue' }, { id: 'C', iconId: 'dinosaur' }], correctOptionId: 'B' },
      { questionId: 'q3', prompt: 'What did Kate point at?', options: [{ id: 'A', iconId: 'painting' }, { id: 'B', iconId: 'statue' }, { id: 'C', iconId: 'vase' }], correctOptionId: 'C' },
      { questionId: 'q4', prompt: 'How many paintings?', options: [{ id: 'A', iconId: 'count_4' }, { id: 'B', iconId: 'count_5' }, { id: 'C', iconId: 'count_6' }], correctOptionId: 'C' },
      { questionId: 'q5', prompt: 'What did they write with?', options: [{ id: 'A', iconId: 'pen' }, { id: 'B', iconId: 'book' }, { id: 'C', iconId: 'banana' }], correctOptionId: 'A' },
    ],
  };
}

function makeMoverTickL29(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick', partId, audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What did the children sit in at the fire station? They sat in the fire engine. The fire engine. ` +
      `Now listen. There are five questions. ` +
      `One. What did Dave wear on his head? He wore a fire helmet. ` +
      `Two. What did they climb? They climbed the ladder. ` +
      `Three. What did the firefighter hold? He held the hose. ` +
      `Four. What was the fire station pet? It was a dog. ` +
      `Five. What time did the alarm ring? It rang at three o'clock.`,
    example: {
      questionId: 'ex', prompt: 'What did they sit in?',
      options: [{ id: 'A', iconId: 'fire_engine' }, { id: 'B', iconId: 'bus' }, { id: 'C', iconId: 'canoe' }],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'What did Dave wear on his head?', options: [{ id: 'A', iconId: 'fire_helmet' }, { id: 'B', iconId: 'book' }, { id: 'C', iconId: 'ball' }], correctOptionId: 'A' },
      { questionId: 'q2', prompt: 'What did they climb?', options: [{ id: 'A', iconId: 'kite' }, { id: 'B', iconId: 'ladder' }, { id: 'C', iconId: 'canoe' }], correctOptionId: 'B' },
      { questionId: 'q3', prompt: 'What did the firefighter hold?', options: [{ id: 'A', iconId: 'pen' }, { id: 'B', iconId: 'ball' }, { id: 'C', iconId: 'hose' }], correctOptionId: 'C' },
      { questionId: 'q4', prompt: 'What was the fire pet?', options: [{ id: 'A', iconId: 'dog' }, { id: 'B', iconId: 'cat' }, { id: 'C', iconId: 'rabbit' }], correctOptionId: 'A' },
      { questionId: 'q5', prompt: 'What time did the alarm ring?', options: [{ id: 'A', iconId: 'clock_3' }, { id: 'B', iconId: 'clock_4' }, { id: 'C', iconId: 'clock_6' }], correctOptionId: 'A' },
    ],
  };
}

function makeMoverTickL30(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick', partId, audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What was the winning pet at the show? The winning pet was a dog. A dog. ` +
      `Now listen. There are five questions. ` +
      `One. What did the first winner get? They got a rosette. ` +
      `Two. What did the dog chew? The dog chewed a bone. ` +
      `Three. What was in the cage? There was a bird in the cage. ` +
      `Four. What did the girl carry the goldfish in? In a fish bowl. ` +
      `Five. How many cats were in the show? There were five cats.`,
    example: {
      questionId: 'ex', prompt: 'What was the winning pet?',
      options: [{ id: 'A', iconId: 'dog' }, { id: 'B', iconId: 'cat' }, { id: 'C', iconId: 'rabbit' }],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'What did the first winner get?', options: [{ id: 'A', iconId: 'rosette' }, { id: 'B', iconId: 'trophy' }, { id: 'C', iconId: 'medal' }], correctOptionId: 'A' },
      { questionId: 'q2', prompt: 'What did the dog chew?', options: [{ id: 'A', iconId: 'ball' }, { id: 'B', iconId: 'bone' }, { id: 'C', iconId: 'fish' }], correctOptionId: 'B' },
      { questionId: 'q3', prompt: 'What was in the cage?', options: [{ id: 'A', iconId: 'fishbowl' }, { id: 'B', iconId: 'cat' }, { id: 'C', iconId: 'bird_cage' }], correctOptionId: 'C' },
      { questionId: 'q4', prompt: 'What held the goldfish?', options: [{ id: 'A', iconId: 'fishbowl' }, { id: 'B', iconId: 'bird_cage' }, { id: 'C', iconId: 'bag_blue' }], correctOptionId: 'A' },
      { questionId: 'q5', prompt: 'How many cats?', options: [{ id: 'A', iconId: 'count_4' }, { id: 'B', iconId: 'count_5' }, { id: 'C', iconId: 'count_6' }], correctOptionId: 'B' },
    ],
  };
}

function makeMoverTickL31(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick', partId, audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What did the children dig with? They dug with a spade. The spade. ` +
      `Now listen. There are five questions. ` +
      `One. What did they plant? They planted a tree. ` +
      `Two. What did they water the plants with? A watering can. ` +
      `Three. What did they push? They pushed a wheelbarrow. ` +
      `Four. What did they carry? They carried a flowerpot. ` +
      `Five. How many trees did they plant? They planted six trees.`,
    example: {
      questionId: 'ex', prompt: 'What did they dig with?',
      options: [{ id: 'A', iconId: 'spade' }, { id: 'B', iconId: 'wheelbarrow' }, { id: 'C', iconId: 'watering_can' }],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'What did they plant?', options: [{ id: 'A', iconId: 'tree' }, { id: 'B', iconId: 'flowerpot' }, { id: 'C', iconId: 'fish' }], correctOptionId: 'A' },
      { questionId: 'q2', prompt: 'What did they water with?', options: [{ id: 'A', iconId: 'spade' }, { id: 'B', iconId: 'watering_can' }, { id: 'C', iconId: 'flowerpot' }], correctOptionId: 'B' },
      { questionId: 'q3', prompt: 'What did they push?', options: [{ id: 'A', iconId: 'canoe' }, { id: 'B', iconId: 'bus' }, { id: 'C', iconId: 'wheelbarrow' }], correctOptionId: 'C' },
      { questionId: 'q4', prompt: 'What did they carry?', options: [{ id: 'A', iconId: 'flowerpot' }, { id: 'B', iconId: 'tree' }, { id: 'C', iconId: 'backpack' }], correctOptionId: 'A' },
      { questionId: 'q5', prompt: 'How many trees?', options: [{ id: 'A', iconId: 'count_5' }, { id: 'B', iconId: 'count_6' }, { id: 'C', iconId: 'count_7' }], correctOptionId: 'B' },
    ],
  };
}

function makeMoverTickL32(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick', partId, audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What did the children hold at the cinema? They held some popcorn. The popcorn. ` +
      `Now listen. There are five questions. ` +
      `One. What did they wear to watch the film? They wore 3D glasses. ` +
      `Two. What did they show to get in? They showed a ticket. ` +
      `Three. What did they drink? They drank a fizzy drink. ` +
      `Four. What did they watch? They watched the big screen. ` +
      `Five. How many tickets did they buy? They bought six tickets.`,
    example: {
      questionId: 'ex', prompt: 'What did they hold?',
      options: [{ id: 'A', iconId: 'popcorn' }, { id: 'B', iconId: 'juice_glass' }, { id: 'C', iconId: 'ice_cream' }],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'What did they wear?', options: [{ id: 'A', iconId: 'glasses_3d' }, { id: 'B', iconId: 'kite' }, { id: 'C', iconId: 'ball' }], correctOptionId: 'A' },
      { questionId: 'q2', prompt: 'What did they show?', options: [{ id: 'A', iconId: 'book' }, { id: 'B', iconId: 'ticket' }, { id: 'C', iconId: 'pen' }], correctOptionId: 'B' },
      { questionId: 'q3', prompt: 'What did they drink?', options: [{ id: 'A', iconId: 'soup_bowl' }, { id: 'B', iconId: 'ice_cream' }, { id: 'C', iconId: 'juice_glass' }], correctOptionId: 'C' },
      { questionId: 'q4', prompt: 'What did they watch?', options: [{ id: 'A', iconId: 'film_screen' }, { id: 'B', iconId: 'painting' }, { id: 'C', iconId: 'book' }], correctOptionId: 'A' },
      { questionId: 'q5', prompt: 'How many tickets?', options: [{ id: 'A', iconId: 'count_4' }, { id: 'B', iconId: 'count_5' }, { id: 'C', iconId: 'count_6' }], correctOptionId: 'C' },
    ],
  };
}

function makeMoverTickL33(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick', partId, audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What did the baker bake? He baked some bread. The bread. ` +
      `Now listen. There are five questions. ` +
      `One. What did Daisy buy? She bought a cake. ` +
      `Two. What did Tom hold? He held a croissant. ` +
      `Three. What did they eat? They ate a cookie. ` +
      `Four. What did they pay for? They paid for a pie. ` +
      `Five. How many cupcakes were left? Three cupcakes.`,
    example: {
      questionId: 'ex', prompt: 'What did the baker bake?',
      options: [{ id: 'A', iconId: 'bread' }, { id: 'B', iconId: 'cake' }, { id: 'C', iconId: 'pizza' }],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'What did Daisy buy?', options: [{ id: 'A', iconId: 'cake' }, { id: 'B', iconId: 'pie' }, { id: 'C', iconId: 'croissant' }], correctOptionId: 'A' },
      { questionId: 'q2', prompt: 'What did Tom hold?', options: [{ id: 'A', iconId: 'cookie' }, { id: 'B', iconId: 'croissant' }, { id: 'C', iconId: 'cupcake' }], correctOptionId: 'B' },
      { questionId: 'q3', prompt: 'What did they eat?', options: [{ id: 'A', iconId: 'cupcake' }, { id: 'B', iconId: 'pie' }, { id: 'C', iconId: 'cookie' }], correctOptionId: 'C' },
      { questionId: 'q4', prompt: 'What did they pay for?', options: [{ id: 'A', iconId: 'pie' }, { id: 'B', iconId: 'cake' }, { id: 'C', iconId: 'bread' }], correctOptionId: 'A' },
      { questionId: 'q5', prompt: 'How many cupcakes?', options: [{ id: 'A', iconId: 'count_3' }, { id: 'B', iconId: 'count_4' }, { id: 'C', iconId: 'count_5' }], correctOptionId: 'A' },
    ],
  };
}

function makeMoverTickL34(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick', partId, audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What did Dad hold by the river? He held a fishing rod. The fishing rod. ` +
      `Now listen. There are five questions. ` +
      `One. What did they catch? They caught a fish. ` +
      `Two. What did they row? They rowed a canoe. ` +
      `Three. What did they fill? They filled a bucket. ` +
      `Four. What went on the hook? A worm went on the hook. ` +
      `Five. What did they hold to catch fish? They held a net.`,
    example: {
      questionId: 'ex', prompt: 'What did Dad hold?',
      options: [{ id: 'A', iconId: 'fishing_rod' }, { id: 'B', iconId: 'fishing_net' }, { id: 'C', iconId: 'canoe' }],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'What did they catch?', options: [{ id: 'A', iconId: 'fish' }, { id: 'B', iconId: 'bird' }, { id: 'C', iconId: 'bone' }], correctOptionId: 'A' },
      { questionId: 'q2', prompt: 'What did they row?', options: [{ id: 'A', iconId: 'bus' }, { id: 'B', iconId: 'canoe' }, { id: 'C', iconId: 'fire_engine' }], correctOptionId: 'B' },
      { questionId: 'q3', prompt: 'What did they fill?', options: [{ id: 'A', iconId: 'fishbowl' }, { id: 'B', iconId: 'suitcase' }, { id: 'C', iconId: 'bucket' }], correctOptionId: 'C' },
      { questionId: 'q4', prompt: 'What went on the hook?', options: [{ id: 'A', iconId: 'worm' }, { id: 'B', iconId: 'fish' }, { id: 'C', iconId: 'bone' }], correctOptionId: 'A' },
      { questionId: 'q5', prompt: 'What caught the fish?', options: [{ id: 'A', iconId: 'ladder' }, { id: 'B', iconId: 'fishing_net' }, { id: 'C', iconId: 'fishing_rod' }], correctOptionId: 'B' },
    ],
  };
}

function makeMoverTickL35(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick', partId, audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What did Sam sell at the garage sale? He sold a lamp. The lamp. ` +
      `Now listen. There are five questions. ` +
      `One. What did they look at? They looked at some books. ` +
      `Two. What did they buy? They bought a teddy bear. ` +
      `Three. What did they stick on? They stuck on a price tag. ` +
      `Four. What did they carry? They carried a box. ` +
      `Five. What did they sit on? They sat on an old chair.`,
    example: {
      questionId: 'ex', prompt: 'What did Sam sell?',
      options: [{ id: 'A', iconId: 'lamp' }, { id: 'B', iconId: 'chair' }, { id: 'C', iconId: 'box' }],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'What did they look at?', options: [{ id: 'A', iconId: 'book' }, { id: 'B', iconId: 'painting' }, { id: 'C', iconId: 'ticket' }], correctOptionId: 'A' },
      { questionId: 'q2', prompt: 'What did they buy?', options: [{ id: 'A', iconId: 'teddy' }, { id: 'B', iconId: 'ball' }, { id: 'C', iconId: 'kite' }], correctOptionId: 'A' },
      { questionId: 'q3', prompt: 'What did they stick on?', options: [{ id: 'A', iconId: 'pen' }, { id: 'B', iconId: 'price_tag' }, { id: 'C', iconId: 'ticket' }], correctOptionId: 'B' },
      { questionId: 'q4', prompt: 'What did they carry?', options: [{ id: 'A', iconId: 'suitcase' }, { id: 'B', iconId: 'backpack' }, { id: 'C', iconId: 'box' }], correctOptionId: 'C' },
      { questionId: 'q5', prompt: 'What did they sit on?', options: [{ id: 'A', iconId: 'chair' }, { id: 'B', iconId: 'bus' }, { id: 'C', iconId: 'canoe' }], correctOptionId: 'A' },
    ],
  };
}

function makeMoverTickL36(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick', partId, audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `Where was Grandpa? He was in a bed. The bed. ` +
      `Now listen. There are five questions. ` +
      `One. What did the nurse give? She gave some medicine. ` +
      `Two. What did they bring? They brought a flower. ` +
      `Three. What did they put on? They put on a bandage. ` +
      `Four. What checked the temperature? A thermometer did. ` +
      `Five. What did the patient arrive in? An ambulance.`,
    example: {
      questionId: 'ex', prompt: 'Where was Grandpa?',
      options: [{ id: 'A', iconId: 'bed' }, { id: 'B', iconId: 'chair' }, { id: 'C', iconId: 'canoe' }],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'What did the nurse give?', options: [{ id: 'A', iconId: 'pill' }, { id: 'B', iconId: 'flower' }, { id: 'C', iconId: 'bone' }], correctOptionId: 'A' },
      { questionId: 'q2', prompt: 'What did they bring?', options: [{ id: 'A', iconId: 'cake' }, { id: 'B', iconId: 'flower' }, { id: 'C', iconId: 'ball' }], correctOptionId: 'B' },
      { questionId: 'q3', prompt: 'What did they put on?', options: [{ id: 'A', iconId: 'ticket' }, { id: 'B', iconId: 'price_tag' }, { id: 'C', iconId: 'bandage' }], correctOptionId: 'C' },
      { questionId: 'q4', prompt: 'What checked the temperature?', options: [{ id: 'A', iconId: 'thermometer' }, { id: 'B', iconId: 'pen' }, { id: 'C', iconId: 'whistle' }], correctOptionId: 'A' },
      { questionId: 'q5', prompt: 'What did they arrive in?', options: [{ id: 'A', iconId: 'bus' }, { id: 'B', iconId: 'ambulance' }, { id: 'C', iconId: 'fire_engine' }], correctOptionId: 'B' },
    ],
  };
}

function makeMoverTickL37(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick', partId, audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What did the children send? They sent a parcel. The parcel. ` +
      `Now listen. There are five questions. ` +
      `One. What did they post? They posted a letter. ` +
      `Two. What did they buy? They bought a stamp. ` +
      `Three. What weighed the parcel? The scales did. ` +
      `Four. Where did they post the letter? In the postbox. ` +
      `Five. What did they write with? They wrote with a pen.`,
    example: {
      questionId: 'ex', prompt: 'What did they send?',
      options: [{ id: 'A', iconId: 'parcel' }, { id: 'B', iconId: 'envelope' }, { id: 'C', iconId: 'box' }],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'What did they post?', options: [{ id: 'A', iconId: 'envelope' }, { id: 'B', iconId: 'parcel' }, { id: 'C', iconId: 'book' }], correctOptionId: 'A' },
      { questionId: 'q2', prompt: 'What did they buy?', options: [{ id: 'A', iconId: 'ticket' }, { id: 'B', iconId: 'stamp' }, { id: 'C', iconId: 'price_tag' }], correctOptionId: 'B' },
      { questionId: 'q3', prompt: 'What weighed the parcel?', options: [{ id: 'A', iconId: 'clock_6' }, { id: 'B', iconId: 'bucket' }, { id: 'C', iconId: 'scales' }], correctOptionId: 'C' },
      { questionId: 'q4', prompt: 'Where did they post it?', options: [{ id: 'A', iconId: 'postbox' }, { id: 'B', iconId: 'bird_cage' }, { id: 'C', iconId: 'fishbowl' }], correctOptionId: 'A' },
      { questionId: 'q5', prompt: 'What did they write with?', options: [{ id: 'A', iconId: 'pen' }, { id: 'B', iconId: 'stamp' }, { id: 'C', iconId: 'book' }], correctOptionId: 'A' },
    ],
  };
}

function makeMoverTickL38(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick', partId, audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What did the children put up in the mountains? They put up a tent. The tent. ` +
      `Now listen. There are five questions. ` +
      `One. What did they read to find the way? They read a compass. ` +
      `Two. What showed the path? A map showed the path. ` +
      `Three. What did they climb? They climbed the mountain. ` +
      `Four. What did they look through? They looked through binoculars. ` +
      `Five. What did they light? They lit a campfire.`,
    example: {
      questionId: 'ex', prompt: 'What did they put up?',
      options: [{ id: 'A', iconId: 'tent' }, { id: 'B', iconId: 'backpack' }, { id: 'C', iconId: 'campfire' }],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'What did they read?', options: [{ id: 'A', iconId: 'compass' }, { id: 'B', iconId: 'map' }, { id: 'C', iconId: 'book' }], correctOptionId: 'A' },
      { questionId: 'q2', prompt: 'What showed the path?', options: [{ id: 'A', iconId: 'painting' }, { id: 'B', iconId: 'map' }, { id: 'C', iconId: 'ticket' }], correctOptionId: 'B' },
      { questionId: 'q3', prompt: 'What did they climb?', options: [{ id: 'A', iconId: 'ladder' }, { id: 'B', iconId: 'tree' }, { id: 'C', iconId: 'mountain' }], correctOptionId: 'C' },
      { questionId: 'q4', prompt: 'What did they look through?', options: [{ id: 'A', iconId: 'binoculars' }, { id: 'B', iconId: 'glasses_3d' }, { id: 'C', iconId: 'microphone' }], correctOptionId: 'A' },
      { questionId: 'q5', prompt: 'What did they light?', options: [{ id: 'A', iconId: 'lamp' }, { id: 'B', iconId: 'campfire' }, { id: 'C', iconId: 'fire_helmet' }], correctOptionId: 'B' },
    ],
  };
}

function makeMoverTickL39(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick', partId, audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What did the children look at first? They looked at a painting. The painting. ` +
      `Now listen. There are five questions. ` +
      `One. What did Rosa paint at? She painted at an easel. ` +
      `Two. What did they hold? They held a paintbrush. ` +
      `Three. What did they mix paint on? They mixed it on a palette. ` +
      `Four. What did they admire? They admired a statue. ` +
      `Five. What did they hang up? They hung up a frame.`,
    example: {
      questionId: 'ex', prompt: 'What did they look at?',
      options: [{ id: 'A', iconId: 'painting' }, { id: 'B', iconId: 'statue' }, { id: 'C', iconId: 'vase' }],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'What did Rosa paint at?', options: [{ id: 'A', iconId: 'easel' }, { id: 'B', iconId: 'ladder' }, { id: 'C', iconId: 'chair' }], correctOptionId: 'A' },
      { questionId: 'q2', prompt: 'What did they hold?', options: [{ id: 'A', iconId: 'pen' }, { id: 'B', iconId: 'paintbrush' }, { id: 'C', iconId: 'fishing_rod' }], correctOptionId: 'B' },
      { questionId: 'q3', prompt: 'What did they mix paint on?', options: [{ id: 'A', iconId: 'soup_bowl' }, { id: 'B', iconId: 'salad' }, { id: 'C', iconId: 'palette' }], correctOptionId: 'C' },
      { questionId: 'q4', prompt: 'What did they admire?', options: [{ id: 'A', iconId: 'statue' }, { id: 'B', iconId: 'vase' }, { id: 'C', iconId: 'dinosaur' }], correctOptionId: 'A' },
      { questionId: 'q5', prompt: 'What did they hang up?', options: [{ id: 'A', iconId: 'frame' }, { id: 'B', iconId: 'painting' }, { id: 'C', iconId: 'box' }], correctOptionId: 'A' },
    ],
  };
}

function makeMoverTickL40(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick', partId, audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What came home with the family? A new baby. The baby. ` +
      `Now listen. There are five questions. ` +
      `One. What did they rock? They rocked the cot. ` +
      `Two. What did they give the baby? They gave a bottle. ` +
      `Three. What did they shake? They shook a rattle. ` +
      `Four. What did they push? They pushed a pram. ` +
      `Five. What toy did the baby get? The baby got a teddy bear.`,
    example: {
      questionId: 'ex', prompt: 'What came home?',
      options: [{ id: 'A', iconId: 'baby' }, { id: 'B', iconId: 'teddy' }, { id: 'C', iconId: 'doll_on_bed' }],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'What did they rock?', options: [{ id: 'A', iconId: 'cot' }, { id: 'B', iconId: 'pram' }, { id: 'C', iconId: 'chair' }], correctOptionId: 'A' },
      { questionId: 'q2', prompt: 'What did they give the baby?', options: [{ id: 'A', iconId: 'juice_glass' }, { id: 'B', iconId: 'bottle' }, { id: 'C', iconId: 'soup_bowl' }], correctOptionId: 'B' },
      { questionId: 'q3', prompt: 'What did they shake?', options: [{ id: 'A', iconId: 'whistle' }, { id: 'B', iconId: 'ball' }, { id: 'C', iconId: 'rattle' }], correctOptionId: 'C' },
      { questionId: 'q4', prompt: 'What did they push?', options: [{ id: 'A', iconId: 'pram' }, { id: 'B', iconId: 'wheelbarrow' }, { id: 'C', iconId: 'bus' }], correctOptionId: 'A' },
      { questionId: 'q5', prompt: 'What toy did the baby get?', options: [{ id: 'A', iconId: 'teddy' }, { id: 'B', iconId: 'ball' }, { id: 'C', iconId: 'kite' }], correctOptionId: 'A' },
    ],
  };
}

/** Dispatch Movers Tick: per-level L21-L40, rotation fallback beyond. */
function makeMoverTickByLevel(partId: string, audioKey: string, levelNumber: number): TickPart {
  switch (levelNumber) {
    case 21: return makeMoverTickL21(partId, audioKey);
    case 22: return makeMoverTickL22(partId, audioKey);
    case 23: return makeMoverTickL23(partId, audioKey);
    case 24: return makeMoverTickL24(partId, audioKey);
    case 25: return makeMoverTickL25(partId, audioKey);
    case 26: return makeMoverTickL26(partId, audioKey);
    case 27: return makeMoverTickL27(partId, audioKey);
    case 28: return makeMoverTickL28(partId, audioKey);
    case 29: return makeMoverTickL29(partId, audioKey);
    case 30: return makeMoverTickL30(partId, audioKey);
    case 31: return makeMoverTickL31(partId, audioKey);
    case 32: return makeMoverTickL32(partId, audioKey);
    case 33: return makeMoverTickL33(partId, audioKey);
    case 34: return makeMoverTickL34(partId, audioKey);
    case 35: return makeMoverTickL35(partId, audioKey);
    case 36: return makeMoverTickL36(partId, audioKey);
    case 37: return makeMoverTickL37(partId, audioKey);
    case 38: return makeMoverTickL38(partId, audioKey);
    case 39: return makeMoverTickL39(partId, audioKey);
    case 40: return makeMoverTickL40(partId, audioKey);
    default: return makeMoverTickPart(partId, audioKey);
  }
}

/**
 * Flyers tick part: B1 difficulty. Future tense, conditionals,
 * abstract topics. Most challenging discrimination between options.
 */
function makeFlyerTickPart(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick',
    partId,
    audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `Which handbag will Madeleine choose if she goes shopping? She will choose the red one with the bear. The red one. ` +
      `Now listen. There are five questions. ` +
      `One. What time will Sebastian study tomorrow if it rains? He will study at three o'clock instead of going outside. ` +
      `Two. What would Charlie pack if he were going on a picnic? He would pack a teddy bear toy and a striped shirt for fun. ` +
      `Three. Where might Penelope keep the antique doll? She might keep it on the bed where it is safe. ` +
      `Four. What kind of pet is Christopher thinking of getting next year? He is thinking of getting a friendly dog. ` +
      `Five. How many apples will Genevieve need for the recipe? She will need exactly three apples for the cake.`,
    example: {
      questionId: 'ex',
      prompt: 'Which handbag will Madeleine choose?',
      options: [
        { id: 'A', iconId: 'bag_red' },
        { id: 'B', iconId: 'bag_blue' },
        { id: 'C', iconId: 'bag_blue_empty' },
      ],
      correctOptionId: 'A',
    },
    questions: [
      {
        questionId: 'q1',
        prompt: 'What time will Sebastian study if it rains?',
        options: [
          { id: 'A', iconId: 'clock_3' },
          { id: 'B', iconId: 'clock_4' },
          { id: 'C', iconId: 'clock_5' },
        ],
        correctOptionId: 'A',
      },
      {
        questionId: 'q2',
        prompt: 'What would Charlie pack for a picnic?',
        options: [
          { id: 'A', iconId: 'car_teddy' },
          { id: 'B', iconId: 'car_shirt' },
          { id: 'C', iconId: 'car_book' },
        ],
        correctOptionId: 'B',
      },
      {
        questionId: 'q3',
        prompt: 'Where might Penelope keep the doll?',
        options: [
          { id: 'A', iconId: 'doll_bed' },
          { id: 'B', iconId: 'doll_chair' },
          { id: 'C', iconId: 'doll_floor' },
        ],
        correctOptionId: 'A',
      },
      {
        questionId: 'q4',
        prompt: 'What pet is Christopher thinking of getting?',
        options: [
          { id: 'A', iconId: 'pet_cat' },
          { id: 'B', iconId: 'pet_dog' },
          { id: 'C', iconId: 'pet_fish' },
        ],
        correctOptionId: 'B',
      },
      {
        questionId: 'q5',
        prompt: 'How many apples for the recipe?',
        options: [
          { id: 'A', iconId: 'apple_2' },
          { id: 'B', iconId: 'apple_3' },
          { id: 'C', iconId: 'apple_4' },
        ],
        correctOptionId: 'B',
      },
    ],
  };
}

// ─── D-18 Phase 4: Flyers per-level Tick parts (L41-L50) ───────────────

function makeFlyerTickL41(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick', partId, audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What did the students look through at the fair? A microscope. The microscope. ` +
      `Now listen. There are five questions. ` +
      `One. What did they mix in the experiment? They mixed it in a test tube. ` +
      `Two. What did Maya hold up? She held a small robot. ` +
      `Three. What did they measure with? They measured with a ruler. ` +
      `Four. What won first prize? The trophy went to the best project. ` +
      `Five. What did they use to pick up metal? They used a magnet.`,
    example: {
      questionId: 'ex', prompt: 'What did they look through?',
      options: [{ id: 'A', iconId: 'microscope' }, { id: 'B', iconId: 'telescope' }, { id: 'C', iconId: 'camera' }],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'What did they mix in?', options: [{ id: 'A', iconId: 'test_tube' }, { id: 'B', iconId: 'juice_glass' }, { id: 'C', iconId: 'soup_bowl' }], correctOptionId: 'A' },
      { questionId: 'q2', prompt: 'What did Maya hold?', options: [{ id: 'A', iconId: 'planet' }, { id: 'B', iconId: 'robot' }, { id: 'C', iconId: 'rocket' }], correctOptionId: 'B' },
      { questionId: 'q3', prompt: 'What did they measure with?', options: [{ id: 'A', iconId: 'pen' }, { id: 'B', iconId: 'book' }, { id: 'C', iconId: 'ruler' }], correctOptionId: 'C' },
      { questionId: 'q4', prompt: 'What won first prize?', options: [{ id: 'A', iconId: 'trophy' }, { id: 'B', iconId: 'medal' }, { id: 'C', iconId: 'rosette' }], correctOptionId: 'A' },
      { questionId: 'q5', prompt: 'Used to pick up metal?', options: [{ id: 'A', iconId: 'spade' }, { id: 'B', iconId: 'whisk' }, { id: 'C', iconId: 'magnet' }], correctOptionId: 'C' },
    ],
  };
}

function makeFlyerTickL42(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick', partId, audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What did they sell at the charity stall? Cakes. The cakes. ` +
      `Now listen. There are five questions. ` +
      `One. Where did they put the coins? In a donation box. ` +
      `Two. What did they count at the end? They counted the coins. ` +
      `Three. What did they hand out? They handed out flowers. ` +
      `Four. What did they paint? They painted a poster. ` +
      `Five. How many cakes were left? Five cakes.`,
    example: {
      questionId: 'ex', prompt: 'What did they sell?',
      options: [{ id: 'A', iconId: 'cake' }, { id: 'B', iconId: 'pizza' }, { id: 'C', iconId: 'burger' }],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'Where did the coins go?', options: [{ id: 'A', iconId: 'donation_box' }, { id: 'B', iconId: 'box' }, { id: 'C', iconId: 'suitcase' }], correctOptionId: 'A' },
      { questionId: 'q2', prompt: 'What did they count?', options: [{ id: 'A', iconId: 'ticket' }, { id: 'B', iconId: 'coin' }, { id: 'C', iconId: 'stamp' }], correctOptionId: 'B' },
      { questionId: 'q3', prompt: 'What did they hand out?', options: [{ id: 'A', iconId: 'kite' }, { id: 'B', iconId: 'ball' }, { id: 'C', iconId: 'flower' }], correctOptionId: 'C' },
      { questionId: 'q4', prompt: 'What did they paint?', options: [{ id: 'A', iconId: 'poster' }, { id: 'B', iconId: 'painting' }, { id: 'C', iconId: 'frame' }], correctOptionId: 'A' },
      { questionId: 'q5', prompt: 'How many cakes left?', options: [{ id: 'A', iconId: 'count_4' }, { id: 'B', iconId: 'count_5' }, { id: 'C', iconId: 'count_6' }], correctOptionId: 'B' },
    ],
  };
}

function makeFlyerTickL43(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick', partId, audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What did the volunteers feed first? A dog. The dog. ` +
      `Now listen. There are five questions. ` +
      `One. What did they wash? They washed a cat. ` +
      `Two. What did they brush? They brushed a rabbit. ` +
      `Three. What did they fill? They filled a bucket. ` +
      `Four. What did the dog chew? The dog chewed a bone. ` +
      `Five. What lives in the bowl? A fish lives in the bowl.`,
    example: {
      questionId: 'ex', prompt: 'What did they feed?',
      options: [{ id: 'A', iconId: 'dog' }, { id: 'B', iconId: 'cat' }, { id: 'C', iconId: 'rabbit' }],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'What did they wash?', options: [{ id: 'A', iconId: 'cat' }, { id: 'B', iconId: 'dog' }, { id: 'C', iconId: 'fish' }], correctOptionId: 'A' },
      { questionId: 'q2', prompt: 'What did they brush?', options: [{ id: 'A', iconId: 'bird' }, { id: 'B', iconId: 'rabbit' }, { id: 'C', iconId: 'cat' }], correctOptionId: 'B' },
      { questionId: 'q3', prompt: 'What did they fill?', options: [{ id: 'A', iconId: 'bottle' }, { id: 'B', iconId: 'fishbowl' }, { id: 'C', iconId: 'bucket' }], correctOptionId: 'C' },
      { questionId: 'q4', prompt: 'What did the dog chew?', options: [{ id: 'A', iconId: 'bone' }, { id: 'B', iconId: 'ball' }, { id: 'C', iconId: 'fish' }], correctOptionId: 'A' },
      { questionId: 'q5', prompt: 'What lives in the bowl?', options: [{ id: 'A', iconId: 'rabbit' }, { id: 'B', iconId: 'fish' }, { id: 'C', iconId: 'bird' }], correctOptionId: 'B' },
    ],
  };
}

function makeFlyerTickL44(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick', partId, audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What was the most popular food? Pizza. The pizza. ` +
      `Now listen. There are five questions. ` +
      `One. What did they grill? They grilled burgers. ` +
      `Two. What did they drink? They drank a fruit smoothie. ` +
      `Three. What was served in a bowl? A bowl of noodles. ` +
      `Four. What did they taste? They tasted some cheese. ` +
      `Five. What did they hold at the end? An ice cream.`,
    example: {
      questionId: 'ex', prompt: 'Most popular food?',
      options: [{ id: 'A', iconId: 'pizza' }, { id: 'B', iconId: 'burger' }, { id: 'C', iconId: 'noodles' }],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'What did they grill?', options: [{ id: 'A', iconId: 'burger' }, { id: 'B', iconId: 'pizza' }, { id: 'C', iconId: 'cake' }], correctOptionId: 'A' },
      { questionId: 'q2', prompt: 'What did they drink?', options: [{ id: 'A', iconId: 'soup_bowl' }, { id: 'B', iconId: 'juice_glass' }, { id: 'C', iconId: 'ice_cream' }], correctOptionId: 'B' },
      { questionId: 'q3', prompt: 'Served in a bowl?', options: [{ id: 'A', iconId: 'noodles' }, { id: 'B', iconId: 'salad' }, { id: 'C', iconId: 'pizza' }], correctOptionId: 'A' },
      { questionId: 'q4', prompt: 'What did they taste?', options: [{ id: 'A', iconId: 'bread' }, { id: 'B', iconId: 'apple' }, { id: 'C', iconId: 'cheese' }], correctOptionId: 'C' },
      { questionId: 'q5', prompt: 'Held at the end?', options: [{ id: 'A', iconId: 'ice_cream' }, { id: 'B', iconId: 'cake' }, { id: 'C', iconId: 'banana' }], correctOptionId: 'A' },
    ],
  };
}

function makeFlyerTickL45(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick', partId, audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What did the students sort? The recycling bin. The bin. ` +
      `Now listen. There are five questions. ` +
      `One. What did they plant? They planted a tree. ` +
      `Two. What did they hold up? They held a solar panel. ` +
      `Three. What rubbish did they pick up? They picked up a bottle. ` +
      `Four. What did they water with? A watering can. ` +
      `Five. What did they carry the compost in? A wheelbarrow.`,
    example: {
      questionId: 'ex', prompt: 'What did they sort?',
      options: [{ id: 'A', iconId: 'recycle_bin' }, { id: 'B', iconId: 'box' }, { id: 'C', iconId: 'bucket' }],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'What did they plant?', options: [{ id: 'A', iconId: 'tree' }, { id: 'B', iconId: 'flower' }, { id: 'C', iconId: 'flowerpot' }], correctOptionId: 'A' },
      { questionId: 'q2', prompt: 'What did they hold up?', options: [{ id: 'A', iconId: 'painting' }, { id: 'B', iconId: 'solar_panel' }, { id: 'C', iconId: 'frame' }], correctOptionId: 'B' },
      { questionId: 'q3', prompt: 'Rubbish picked up?', options: [{ id: 'A', iconId: 'ball' }, { id: 'B', iconId: 'kite' }, { id: 'C', iconId: 'bottle' }], correctOptionId: 'C' },
      { questionId: 'q4', prompt: 'Water with?', options: [{ id: 'A', iconId: 'watering_can' }, { id: 'B', iconId: 'bucket' }, { id: 'C', iconId: 'juice_glass' }], correctOptionId: 'A' },
      { questionId: 'q5', prompt: 'Carry compost in?', options: [{ id: 'A', iconId: 'wheelbarrow' }, { id: 'B', iconId: 'box' }, { id: 'C', iconId: 'bucket' }], correctOptionId: 'A' },
    ],
  };
}

function makeFlyerTickL46(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick', partId, audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What was the biggest model at the space show? A rocket. The rocket. ` +
      `Now listen. There are five questions. ` +
      `One. What did they look through? A telescope. ` +
      `Two. What did they hold? They held a model planet. ` +
      `Three. What did they wear on their head? An astronaut helmet. ` +
      `Four. What did they see in the sky model? They saw a star. ` +
      `Five. What did they touch? They touched the moon rock.`,
    example: {
      questionId: 'ex', prompt: 'Biggest model?',
      options: [{ id: 'A', iconId: 'rocket' }, { id: 'B', iconId: 'planet' }, { id: 'C', iconId: 'star' }],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'Looked through?', options: [{ id: 'A', iconId: 'telescope' }, { id: 'B', iconId: 'microscope' }, { id: 'C', iconId: 'binoculars' }], correctOptionId: 'A' },
      { questionId: 'q2', prompt: 'What did they hold?', options: [{ id: 'A', iconId: 'ball' }, { id: 'B', iconId: 'planet' }, { id: 'C', iconId: 'rocket' }], correctOptionId: 'B' },
      { questionId: 'q3', prompt: 'Wore on their head?', options: [{ id: 'A', iconId: 'fire_helmet' }, { id: 'B', iconId: 'chef_hat' }, { id: 'C', iconId: 'astronaut_helmet' }], correctOptionId: 'C' },
      { questionId: 'q4', prompt: 'Saw in the sky model?', options: [{ id: 'A', iconId: 'star' }, { id: 'B', iconId: 'moon' }, { id: 'C', iconId: 'planet' }], correctOptionId: 'A' },
      { questionId: 'q5', prompt: 'What did they touch?', options: [{ id: 'A', iconId: 'star' }, { id: 'B', iconId: 'moon' }, { id: 'C', iconId: 'rocket' }], correctOptionId: 'B' },
    ],
  };
}

function makeFlyerTickL47(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick', partId, audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What did the cooks use to mix? A whisk. The whisk. ` +
      `Now listen. There are five questions. ` +
      `One. What did they decorate? They decorated a cake. ` +
      `Two. What did they chop with? They chopped with a knife. ` +
      `Three. What did they taste? They tasted the soup. ` +
      `Four. What did the chef wear? A chef hat. ` +
      `Five. What did the winner get? A silver trophy.`,
    example: {
      questionId: 'ex', prompt: 'Used to mix?',
      options: [{ id: 'A', iconId: 'whisk' }, { id: 'B', iconId: 'spade' }, { id: 'C', iconId: 'paintbrush' }],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'What did they decorate?', options: [{ id: 'A', iconId: 'cake' }, { id: 'B', iconId: 'pie' }, { id: 'C', iconId: 'cupcake' }], correctOptionId: 'A' },
      { questionId: 'q2', prompt: 'Chopped with?', options: [{ id: 'A', iconId: 'spade' }, { id: 'B', iconId: 'knife' }, { id: 'C', iconId: 'ruler' }], correctOptionId: 'B' },
      { questionId: 'q3', prompt: 'What did they taste?', options: [{ id: 'A', iconId: 'salad' }, { id: 'B', iconId: 'pizza' }, { id: 'C', iconId: 'soup_bowl' }], correctOptionId: 'C' },
      { questionId: 'q4', prompt: 'Chef wore?', options: [{ id: 'A', iconId: 'chef_hat' }, { id: 'B', iconId: 'fire_helmet' }, { id: 'C', iconId: 'astronaut_helmet' }], correctOptionId: 'A' },
      { questionId: 'q5', prompt: 'Winner got?', options: [{ id: 'A', iconId: 'trophy' }, { id: 'B', iconId: 'medal' }, { id: 'C', iconId: 'rosette' }], correctOptionId: 'A' },
    ],
  };
}

function makeFlyerTickL48(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick', partId, audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What did they hold to start filming? A clapperboard. The clapperboard. ` +
      `Now listen. There are five questions. ` +
      `One. What did they film with? A video camera. ` +
      `Two. What did they speak into? A microphone. ` +
      `Three. What did they read? They read the script. ` +
      `Four. What lit the film set? A big light. ` +
      `Five. What did the director sit in? A chair.`,
    example: {
      questionId: 'ex', prompt: 'Held to start filming?',
      options: [{ id: 'A', iconId: 'clapperboard' }, { id: 'B', iconId: 'book' }, { id: 'C', iconId: 'frame' }],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'Filmed with?', options: [{ id: 'A', iconId: 'video_camera' }, { id: 'B', iconId: 'microphone' }, { id: 'C', iconId: 'telescope' }], correctOptionId: 'A' },
      { questionId: 'q2', prompt: 'Spoke into?', options: [{ id: 'A', iconId: 'trumpet' }, { id: 'B', iconId: 'microphone' }, { id: 'C', iconId: 'whistle' }], correctOptionId: 'B' },
      { questionId: 'q3', prompt: 'What did they read?', options: [{ id: 'A', iconId: 'map' }, { id: 'B', iconId: 'book' }, { id: 'C', iconId: 'script_paper' }], correctOptionId: 'C' },
      { questionId: 'q4', prompt: 'What lit the set?', options: [{ id: 'A', iconId: 'light_bulb' }, { id: 'B', iconId: 'lamp' }, { id: 'C', iconId: 'campfire' }], correctOptionId: 'A' },
      { questionId: 'q5', prompt: 'Director sat in?', options: [{ id: 'A', iconId: 'chair' }, { id: 'B', iconId: 'bed' }, { id: 'C', iconId: 'canoe' }], correctOptionId: 'A' },
    ],
  };
}

function makeFlyerTickL49(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick', partId, audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What did the students take photos with? A camera. The camera. ` +
      `Now listen. There are five questions. ` +
      `One. What held the camera steady? A tripod. ` +
      `Two. What did they photograph? They photographed a bird. ` +
      `Three. What did they change on the camera? The lens. ` +
      `Four. What did they hang up? A framed photo. ` +
      `Five. How many photos must they take? Five photos.`,
    example: {
      questionId: 'ex', prompt: 'Took photos with?',
      options: [{ id: 'A', iconId: 'camera' }, { id: 'B', iconId: 'video_camera' }, { id: 'C', iconId: 'telescope' }],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'Held the camera steady?', options: [{ id: 'A', iconId: 'tripod' }, { id: 'B', iconId: 'easel' }, { id: 'C', iconId: 'ladder' }], correctOptionId: 'A' },
      { questionId: 'q2', prompt: 'What did they photograph?', options: [{ id: 'A', iconId: 'cat' }, { id: 'B', iconId: 'bird' }, { id: 'C', iconId: 'fish' }], correctOptionId: 'B' },
      { questionId: 'q3', prompt: 'Changed on the camera?', options: [{ id: 'A', iconId: 'pen' }, { id: 'B', iconId: 'ball' }, { id: 'C', iconId: 'lens' }], correctOptionId: 'C' },
      { questionId: 'q4', prompt: 'What did they hang up?', options: [{ id: 'A', iconId: 'photo' }, { id: 'B', iconId: 'painting' }, { id: 'C', iconId: 'frame' }], correctOptionId: 'A' },
      { questionId: 'q5', prompt: 'How many photos?', options: [{ id: 'A', iconId: 'count_4' }, { id: 'B', iconId: 'count_5' }, { id: 'C', iconId: 'count_6' }], correctOptionId: 'B' },
    ],
  };
}

function makeFlyerTickL50(partId: string, audioKey: string): TickPart {
  return {
    type: 'listening_tick', partId, audioKey,
    audioScript:
      `Listen and tick the box. There is one example. ` +
      `What did the hikers climb with? A rope. The rope. ` +
      `Now listen. There are five questions. ` +
      `One. What did they read to find the way? A map. ` +
      `Two. What did they look through? Binoculars. ` +
      `Three. What did they drink from? A flask. ` +
      `Four. What did they plant at the top? A flag. ` +
      `Five. What did they carry? A backpack.`,
    example: {
      questionId: 'ex', prompt: 'Climbed with?',
      options: [{ id: 'A', iconId: 'rope' }, { id: 'B', iconId: 'ladder' }, { id: 'C', iconId: 'fishing_rod' }],
      correctOptionId: 'A',
    },
    questions: [
      { questionId: 'q1', prompt: 'Read to find the way?', options: [{ id: 'A', iconId: 'map' }, { id: 'B', iconId: 'compass' }, { id: 'C', iconId: 'book' }], correctOptionId: 'A' },
      { questionId: 'q2', prompt: 'Looked through?', options: [{ id: 'A', iconId: 'glasses_3d' }, { id: 'B', iconId: 'binoculars' }, { id: 'C', iconId: 'telescope' }], correctOptionId: 'B' },
      { questionId: 'q3', prompt: 'Drank from?', options: [{ id: 'A', iconId: 'juice_glass' }, { id: 'B', iconId: 'bottle' }, { id: 'C', iconId: 'flask' }], correctOptionId: 'C' },
      { questionId: 'q4', prompt: 'Planted at the top?', options: [{ id: 'A', iconId: 'flag' }, { id: 'B', iconId: 'tent' }, { id: 'C', iconId: 'tree' }], correctOptionId: 'A' },
      { questionId: 'q5', prompt: 'What did they carry?', options: [{ id: 'A', iconId: 'backpack' }, { id: 'B', iconId: 'suitcase' }, { id: 'C', iconId: 'box' }], correctOptionId: 'A' },
    ],
  };
}

/** Dispatch Flyers Tick: per-level L41-L50, rotation fallback beyond. */
function makeFlyerTickByLevel(partId: string, audioKey: string, levelNumber: number): TickPart {
  switch (levelNumber) {
    case 41: return makeFlyerTickL41(partId, audioKey);
    case 42: return makeFlyerTickL42(partId, audioKey);
    case 43: return makeFlyerTickL43(partId, audioKey);
    case 44: return makeFlyerTickL44(partId, audioKey);
    case 45: return makeFlyerTickL45(partId, audioKey);
    case 46: return makeFlyerTickL46(partId, audioKey);
    case 47: return makeFlyerTickL47(partId, audioKey);
    case 48: return makeFlyerTickL48(partId, audioKey);
    case 49: return makeFlyerTickL49(partId, audioKey);
    case 50: return makeFlyerTickL50(partId, audioKey);
    default: return makeFlyerTickPart(partId, audioKey);
  }
}

// ─── Part 4: Listen & colour ───────────────────────────────────────────

function makeGardenColourPart(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour',
    partId,
    audioKey,
    audioScript:
      `Listen and colour. There is one example. ` +
      `Colour the ball red. The ball is red. Red. ` +
      `Now you listen and colour. ` +
      `Colour the bicycle blue. ` +
      `Colour the cat orange. ` +
      `Colour the dog brown. ` +
      `Colour the yarn purple. ` +
      `Colour the tree green.`,
    sceneId: 'garden_objects_outline',
    example: { regionId: 'ball', color: 'red', x: 0.45, y: 0.62, width: 0.10, height: 0.18 },
    regions: [
      // Sprint 4.9.2: coords moved from getRegionHotspot into data so admin
      // can calibrate. Defaults match what was previously hardcoded for the
      // garden_objects_outline scene; admin overrides via D1 if AI-rendered
      // image places objects differently.
      { id: 'bike',  label: 'xe đạp',  x: 0.21, y: 0.50, width: 0.20, height: 0.36 },
      { id: 'cat',   label: 'con mèo', x: 0.10, y: 0.74, width: 0.20, height: 0.22 },
      { id: 'dog',   label: 'con chó', x: 0.70, y: 0.75, width: 0.20, height: 0.20 },
      { id: 'yarn',  label: 'cuộn len', x: 0.04, y: 0.86, width: 0.10, height: 0.12 },
      { id: 'tree',  label: 'cái cây', x: 0.04, y: 0.20, width: 0.16, height: 0.50 },
    ],
    correctColors: {
      bike: 'blue',
      cat: 'orange',
      dog: 'brown',
      yarn: 'purple',
      tree: 'green',
    },
    palette: ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown'],
  };
}

function makeBedroomColourPart(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour',
    partId,
    audioKey,
    audioScript:
      `Listen and colour. There is one example. ` +
      `Colour the bed pink. The bed is pink. Pink. ` +
      `Now you listen and colour. ` +
      `Colour the teddy bear brown. ` +
      `Colour the lamp yellow. ` +
      `Colour the books blue. ` +
      `Colour the window green. ` +
      `Colour the toy box red.`,
    sceneId: 'bedroom_outline',
    example: { regionId: 'bed', color: 'pink', x: 0.05, y: 0.65, width: 0.25, height: 0.25 },
    regions: [
      // Sprint 4.9.2: default coords spread across scene. Admin must
      // calibrate per actual AI-rendered bedroom layout.
      { id: 'teddy',  label: 'gấu bông',     x: 0.05, y: 0.30, width: 0.18, height: 0.35 },
      { id: 'lamp',   label: 'đèn',          x: 0.28, y: 0.10, width: 0.14, height: 0.30 },
      { id: 'books',  label: 'sách',         x: 0.46, y: 0.40, width: 0.18, height: 0.25 },
      { id: 'window', label: 'cửa sổ',       x: 0.66, y: 0.10, width: 0.20, height: 0.40 },
      { id: 'toybox', label: 'hộp đồ chơi',  x: 0.30, y: 0.65, width: 0.30, height: 0.30 },
    ],
    correctColors: {
      teddy: 'brown',
      lamp: 'yellow',
      books: 'blue',
      window: 'green',
      toybox: 'red',
    },
    palette: ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown'],
  };
}

function makeFarmColourPart(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour',
    partId,
    audioKey,
    audioScript:
      `Listen and colour. There is one example. ` +
      `Colour the cow brown. The cow is brown. Brown. ` +
      `Now you listen and colour. ` +
      `Colour the pig pink. ` +
      `Colour the chicken yellow. ` +
      `Colour the barn red. ` +
      `Colour the tree green. ` +
      `Colour the sun orange.`,
    sceneId: 'farm_outline',
    example: { regionId: 'cow', color: 'brown', x: 0.10, y: 0.55, width: 0.20, height: 0.30 },
    regions: [
      // Sprint 4.9.2: default coords; admin calibrates per scene.
      { id: 'pig',     label: 'con heo',   x: 0.30, y: 0.65, width: 0.18, height: 0.25 },
      { id: 'chicken', label: 'con gà',    x: 0.50, y: 0.70, width: 0.12, height: 0.22 },
      { id: 'barn',    label: 'kho thóc',  x: 0.10, y: 0.30, width: 0.30, height: 0.45 },
      { id: 'tree',    label: 'cái cây',   x: 0.65, y: 0.20, width: 0.18, height: 0.55 },
      { id: 'sun',     label: 'mặt trời',  x: 0.80, y: 0.05, width: 0.15, height: 0.20 },
    ],
    correctColors: {
      pig: 'pink',
      chicken: 'yellow',
      barn: 'red',
      tree: 'green',
      sun: 'orange',
    },
    palette: ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown'],
  };
}

// ─── D-18 Phase 6: 20 unique Starters Colour parts (L1-L20) ──────────
// Each level has its OWN outline scene + unique 5-region color set.
// Scene image generation (Flux) admin-triggered; UI shows warning until
// generated. Each scene has 5 distinct objects with unique color assignments
// so no two Starters levels share Part 4 content.

function makeStarterColourL1(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the cat black. The cat is black. Black. Now you listen and colour. Colour the fish orange. Colour the bird yellow. Colour the rabbit brown. Colour the dog grey. Colour the turtle green.`,
    sceneId: 'starter_l1_petshop_outline' as SceneId,
    example: { regionId: 'cat', color: 'black', x: 0.10, y: 0.45, width: 0.18, height: 0.25 },
    regions: [
      { id: 'fish',   label: 'con cá',    x: 0.30, y: 0.30, width: 0.16, height: 0.20 },
      { id: 'bird',   label: 'con chim',  x: 0.50, y: 0.20, width: 0.14, height: 0.18 },
      { id: 'rabbit', label: 'con thỏ',   x: 0.68, y: 0.40, width: 0.18, height: 0.28 },
      { id: 'dog',    label: 'con chó',   x: 0.20, y: 0.72, width: 0.20, height: 0.22 },
      { id: 'turtle', label: 'con rùa',   x: 0.60, y: 0.72, width: 0.20, height: 0.20 },
    ],
    correctColors: { fish: 'orange', bird: 'yellow', rabbit: 'brown', dog: 'grey', turtle: 'green' },
    palette: ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown', 'black', 'grey'],
  };
}

function makeStarterColourL2(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the plate red. The plate is red. Red. Now you listen and colour. Colour the bread brown. Colour the cup blue. Colour the chicken yellow. Colour the apple green. Colour the lamp orange.`,
    sceneId: 'starter_l2_family_dinner_outline' as SceneId,
    example: { regionId: 'plate', color: 'red', x: 0.40, y: 0.55, width: 0.20, height: 0.15 },
    regions: [
      { id: 'bread',   label: 'bánh mì',  x: 0.15, y: 0.45, width: 0.18, height: 0.20 },
      { id: 'cup',     label: 'cái cốc',  x: 0.65, y: 0.50, width: 0.12, height: 0.18 },
      { id: 'chicken', label: 'gà',       x: 0.40, y: 0.30, width: 0.20, height: 0.18 },
      { id: 'apple',   label: 'táo',      x: 0.20, y: 0.20, width: 0.14, height: 0.16 },
      { id: 'lamp',    label: 'đèn',      x: 0.72, y: 0.10, width: 0.16, height: 0.30 },
    ],
    correctColors: { bread: 'brown', cup: 'blue', chicken: 'yellow', apple: 'green', lamp: 'orange' },
    palette: ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown'],
  };
}

function makeStarterColourL3(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the kite blue. The kite is blue. Blue. Now you listen and colour. Colour the bench green. Colour the duck yellow. Colour the dog brown. Colour the bicycle red. Colour the slide pink.`,
    sceneId: 'starter_l3_weekend_park_outline' as SceneId,
    example: { regionId: 'kite', color: 'blue', x: 0.65, y: 0.10, width: 0.18, height: 0.20 },
    regions: [
      { id: 'bench',   label: 'ghế dài',  x: 0.40, y: 0.65, width: 0.30, height: 0.15 },
      { id: 'duck',    label: 'con vịt',  x: 0.15, y: 0.55, width: 0.16, height: 0.18 },
      { id: 'dog',     label: 'con chó',  x: 0.10, y: 0.78, width: 0.20, height: 0.18 },
      { id: 'bicycle', label: 'xe đạp',   x: 0.70, y: 0.55, width: 0.22, height: 0.30 },
      { id: 'slide',   label: 'cầu trượt', x: 0.05, y: 0.20, width: 0.25, height: 0.30 },
    ],
    correctColors: { bench: 'green', duck: 'yellow', dog: 'brown', bicycle: 'red', slide: 'pink' },
    palette: ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown'],
  };
}

function makeStarterColourL4(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the cake pink. The cake is pink. Pink. Now you listen and colour. Colour the balloon red. Colour the candle yellow. Colour the present blue. Colour the hat purple. Colour the cup orange.`,
    sceneId: 'starter_l4_birthday_outline' as SceneId,
    example: { regionId: 'cake', color: 'pink', x: 0.40, y: 0.50, width: 0.20, height: 0.20 },
    regions: [
      { id: 'balloon', label: 'bóng bay',  x: 0.10, y: 0.10, width: 0.15, height: 0.20 },
      { id: 'candle',  label: 'nến',       x: 0.46, y: 0.42, width: 0.08, height: 0.12 },
      { id: 'present', label: 'quà tặng',  x: 0.65, y: 0.55, width: 0.20, height: 0.20 },
      { id: 'hat',     label: 'mũ',        x: 0.20, y: 0.30, width: 0.16, height: 0.18 },
      { id: 'cup',     label: 'cốc',       x: 0.70, y: 0.35, width: 0.14, height: 0.18 },
    ],
    correctColors: { balloon: 'red', candle: 'yellow', present: 'blue', hat: 'purple', cup: 'orange' },
    palette: ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown'],
  };
}

function makeStarterColourL5(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the book blue. The book is blue. Blue. Now you listen and colour. Colour the pencil red. Colour the bag green. Colour the chair brown. Colour the board black. Colour the clock yellow.`,
    sceneId: 'starter_l5_school_outline' as SceneId,
    example: { regionId: 'book', color: 'blue', x: 0.35, y: 0.55, width: 0.18, height: 0.15 },
    regions: [
      { id: 'pencil', label: 'bút chì', x: 0.55, y: 0.55, width: 0.10, height: 0.15 },
      { id: 'bag',    label: 'cặp',     x: 0.10, y: 0.70, width: 0.20, height: 0.22 },
      { id: 'chair',  label: 'ghế',     x: 0.65, y: 0.62, width: 0.20, height: 0.30 },
      { id: 'board',  label: 'bảng',    x: 0.30, y: 0.10, width: 0.40, height: 0.25 },
      { id: 'clock',  label: 'đồng hồ', x: 0.78, y: 0.15, width: 0.15, height: 0.20 },
    ],
    correctColors: { pencil: 'red', bag: 'green', chair: 'brown', board: 'black', clock: 'yellow' },
    palette: ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown', 'black'],
  };
}

function makeStarterColourL6(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the ball yellow. The ball is yellow. Yellow. Now you listen and colour. Colour the bucket red. Colour the shell pink. Colour the umbrella blue. Colour the fish orange. Colour the boat green.`,
    sceneId: 'starter_l6_beach_outline' as SceneId,
    example: { regionId: 'ball', color: 'yellow', x: 0.40, y: 0.55, width: 0.15, height: 0.15 },
    regions: [
      { id: 'bucket',   label: 'xô',       x: 0.15, y: 0.65, width: 0.15, height: 0.20 },
      { id: 'shell',    label: 'vỏ sò',    x: 0.10, y: 0.85, width: 0.10, height: 0.10 },
      { id: 'umbrella', label: 'ô',        x: 0.60, y: 0.20, width: 0.25, height: 0.30 },
      { id: 'fish',     label: 'cá',       x: 0.70, y: 0.70, width: 0.18, height: 0.15 },
      { id: 'boat',     label: 'thuyền',   x: 0.30, y: 0.20, width: 0.25, height: 0.18 },
    ],
    correctColors: { bucket: 'red', shell: 'pink', umbrella: 'blue', fish: 'orange', boat: 'green' },
    palette: ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown'],
  };
}

function makeStarterColourL7(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the rose red. The rose is red. Red. Now you listen and colour. Colour the tulip yellow. Colour the butterfly purple. Colour the watering can green. Colour the daisy white. Colour the bench brown.`,
    sceneId: 'starter_l7_garden_outline' as SceneId,
    example: { regionId: 'rose', color: 'red', x: 0.15, y: 0.50, width: 0.15, height: 0.20 },
    regions: [
      { id: 'tulip',     label: 'hoa tulip',   x: 0.35, y: 0.50, width: 0.15, height: 0.22 },
      { id: 'butterfly', label: 'bươm bướm',   x: 0.55, y: 0.25, width: 0.16, height: 0.14 },
      { id: 'wateringcan', label: 'bình tưới', x: 0.75, y: 0.60, width: 0.18, height: 0.25 },
      { id: 'daisy',     label: 'hoa cúc',     x: 0.55, y: 0.55, width: 0.13, height: 0.18 },
      { id: 'bench',     label: 'ghế dài',     x: 0.10, y: 0.80, width: 0.30, height: 0.12 },
    ],
    correctColors: { tulip: 'yellow', butterfly: 'purple', wateringcan: 'green', daisy: 'white', bench: 'brown' },
    palette: ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown', 'white'],
  };
}

function makeStarterColourL8(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the doll pink. The doll is pink. Pink. Now you listen and colour. Colour the ball red. Colour the teddy bear brown. Colour the kite yellow. Colour the car blue. Colour the robot grey.`,
    sceneId: 'starter_l8_toyshop_outline' as SceneId,
    example: { regionId: 'doll', color: 'pink', x: 0.10, y: 0.40, width: 0.18, height: 0.30 },
    regions: [
      { id: 'ball',  label: 'quả bóng',  x: 0.35, y: 0.55, width: 0.14, height: 0.16 },
      { id: 'teddy', label: 'gấu bông',  x: 0.55, y: 0.45, width: 0.18, height: 0.30 },
      { id: 'kite',  label: 'diều',      x: 0.75, y: 0.20, width: 0.18, height: 0.22 },
      { id: 'car',   label: 'xe hơi',    x: 0.18, y: 0.75, width: 0.22, height: 0.18 },
      { id: 'robot', label: 'người máy', x: 0.65, y: 0.70, width: 0.20, height: 0.25 },
    ],
    correctColors: { ball: 'red', teddy: 'brown', kite: 'yellow', car: 'blue', robot: 'grey' },
    palette: ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown', 'grey'],
  };
}

function makeStarterColourL9(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the shirt red. The shirt is red. Red. Now you listen and colour. Colour the medal yellow. Colour the shoes white. Colour the flag blue. Colour the cone orange. Colour the ball green.`,
    sceneId: 'starter_l9_sports_outline' as SceneId,
    example: { regionId: 'shirt', color: 'red', x: 0.10, y: 0.30, width: 0.18, height: 0.30 },
    regions: [
      { id: 'medal', label: 'huy chương', x: 0.32, y: 0.42, width: 0.12, height: 0.18 },
      { id: 'shoes', label: 'giày',       x: 0.48, y: 0.78, width: 0.20, height: 0.10 },
      { id: 'flag',  label: 'cờ',         x: 0.72, y: 0.10, width: 0.20, height: 0.30 },
      { id: 'cone',  label: 'cọc',        x: 0.18, y: 0.78, width: 0.10, height: 0.18 },
      { id: 'ball',  label: 'bóng',       x: 0.55, y: 0.55, width: 0.15, height: 0.18 },
    ],
    correctColors: { medal: 'yellow', shoes: 'white', flag: 'blue', cone: 'orange', ball: 'green' },
    palette: ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown', 'white'],
  };
}

function makeStarterColourL10(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the blanket red. The blanket is red. Red. Now you listen and colour. Colour the sandwich brown. Colour the apple green. Colour the cake pink. Colour the basket yellow. Colour the dog grey.`,
    sceneId: 'starter_l10_picnic_outline' as SceneId,
    example: { regionId: 'blanket', color: 'red', x: 0.10, y: 0.65, width: 0.45, height: 0.30 },
    regions: [
      { id: 'sandwich', label: 'bánh mì',   x: 0.20, y: 0.55, width: 0.15, height: 0.10 },
      { id: 'apple',    label: 'táo',       x: 0.40, y: 0.60, width: 0.12, height: 0.14 },
      { id: 'cake',     label: 'bánh kem',  x: 0.60, y: 0.55, width: 0.18, height: 0.15 },
      { id: 'basket',   label: 'giỏ',       x: 0.78, y: 0.55, width: 0.18, height: 0.22 },
      { id: 'dog',      label: 'chó',       x: 0.70, y: 0.78, width: 0.20, height: 0.18 },
    ],
    correctColors: { sandwich: 'brown', apple: 'green', cake: 'pink', basket: 'yellow', dog: 'grey' },
    palette: ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown', 'grey'],
  };
}

function makeStarterColourL11(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the book blue. The book is blue. Blue. Now you listen and colour. Colour the chair brown. Colour the lamp yellow. Colour the bag red. Colour the pen green. Colour the rug purple.`,
    sceneId: 'starter_l11_library_outline' as SceneId,
    example: { regionId: 'book', color: 'blue', x: 0.40, y: 0.40, width: 0.18, height: 0.18 },
    regions: [
      { id: 'chair', label: 'ghế',     x: 0.10, y: 0.55, width: 0.20, height: 0.30 },
      { id: 'lamp',  label: 'đèn',     x: 0.65, y: 0.10, width: 0.18, height: 0.30 },
      { id: 'bag',   label: 'cặp',     x: 0.62, y: 0.60, width: 0.18, height: 0.25 },
      { id: 'pen',   label: 'bút',     x: 0.42, y: 0.70, width: 0.08, height: 0.14 },
      { id: 'rug',   label: 'thảm',    x: 0.20, y: 0.82, width: 0.55, height: 0.12 },
    ],
    correctColors: { chair: 'brown', lamp: 'yellow', bag: 'red', pen: 'green', rug: 'purple' },
    palette: ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown'],
  };
}

function makeStarterColourL12(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the bike red. The bike is red. Red. Now you listen and colour. Colour the helmet blue. Colour the bell yellow. Colour the basket green. Colour the bottle orange. Colour the path grey.`,
    sceneId: 'starter_l12_bicycle_outline' as SceneId,
    example: { regionId: 'bike', color: 'red', x: 0.15, y: 0.40, width: 0.30, height: 0.40 },
    regions: [
      { id: 'helmet', label: 'mũ bảo hiểm', x: 0.55, y: 0.25, width: 0.18, height: 0.18 },
      { id: 'bell',   label: 'chuông',      x: 0.30, y: 0.30, width: 0.08, height: 0.10 },
      { id: 'basket', label: 'giỏ',         x: 0.20, y: 0.35, width: 0.14, height: 0.12 },
      { id: 'bottle', label: 'chai nước',   x: 0.75, y: 0.40, width: 0.10, height: 0.22 },
      { id: 'path',   label: 'đường',       x: 0.05, y: 0.85, width: 0.90, height: 0.10 },
    ],
    correctColors: { helmet: 'blue', bell: 'yellow', basket: 'green', bottle: 'orange', path: 'grey' },
    palette: ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown', 'grey'],
  };
}

function makeStarterColourL13(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the cake yellow. The cake is yellow. Yellow. Now you listen and colour. Colour the bowl blue. Colour the spoon grey. Colour the apron pink. Colour the lemon green. Colour the oven red.`,
    sceneId: 'starter_l13_cooking_outline' as SceneId,
    example: { regionId: 'cake', color: 'yellow', x: 0.40, y: 0.45, width: 0.20, height: 0.20 },
    regions: [
      { id: 'bowl',  label: 'tô',     x: 0.15, y: 0.50, width: 0.18, height: 0.20 },
      { id: 'spoon', label: 'muỗng',  x: 0.38, y: 0.55, width: 0.06, height: 0.18 },
      { id: 'apron', label: 'tạp dề', x: 0.62, y: 0.45, width: 0.16, height: 0.30 },
      { id: 'lemon', label: 'chanh',  x: 0.25, y: 0.30, width: 0.10, height: 0.12 },
      { id: 'oven',  label: 'lò',     x: 0.70, y: 0.65, width: 0.25, height: 0.30 },
    ],
    correctColors: { bowl: 'blue', spoon: 'grey', apron: 'pink', lemon: 'green', oven: 'red' },
    palette: ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown', 'grey'],
  };
}

function makeStarterColourL14(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the pool blue. The pool is blue. Blue. Now you listen and colour. Colour the float orange. Colour the goggles yellow. Colour the towel pink. Colour the cap green. Colour the ball red.`,
    sceneId: 'starter_l14_swimming_outline' as SceneId,
    example: { regionId: 'pool', color: 'blue', x: 0.10, y: 0.50, width: 0.80, height: 0.40 },
    regions: [
      { id: 'float',   label: 'phao',         x: 0.20, y: 0.55, width: 0.18, height: 0.18 },
      { id: 'goggles', label: 'kính bơi',     x: 0.42, y: 0.30, width: 0.18, height: 0.10 },
      { id: 'towel',   label: 'khăn',         x: 0.05, y: 0.30, width: 0.20, height: 0.18 },
      { id: 'cap',     label: 'mũ bơi',       x: 0.72, y: 0.30, width: 0.16, height: 0.12 },
      { id: 'ball',    label: 'bóng',         x: 0.55, y: 0.55, width: 0.12, height: 0.14 },
    ],
    correctColors: { float: 'orange', goggles: 'yellow', towel: 'pink', cap: 'green', ball: 'red' },
    palette: ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown'],
  };
}

function makeStarterColourL15(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the barn red. The barn is red. Red. Now you listen and colour. Colour the sheep white. Colour the chicken yellow. Colour the tractor green. Colour the duck orange. Colour the haystack brown.`,
    sceneId: 'starter_l15_farm_outline' as SceneId,
    example: { regionId: 'barn', color: 'red', x: 0.10, y: 0.30, width: 0.30, height: 0.45 },
    regions: [
      { id: 'sheep',    label: 'cừu',     x: 0.45, y: 0.55, width: 0.16, height: 0.20 },
      { id: 'chicken',  label: 'gà',      x: 0.60, y: 0.70, width: 0.12, height: 0.18 },
      { id: 'tractor',  label: 'máy cày', x: 0.72, y: 0.55, width: 0.22, height: 0.25 },
      { id: 'duck',     label: 'vịt',     x: 0.30, y: 0.78, width: 0.14, height: 0.15 },
      { id: 'haystack', label: 'rơm',     x: 0.05, y: 0.78, width: 0.20, height: 0.18 },
    ],
    correctColors: { sheep: 'white', chicken: 'yellow', tractor: 'green', duck: 'orange', haystack: 'brown' },
    palette: ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown', 'white'],
  };
}

function makeStarterColourL16(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the cat orange. The cat is orange. Orange. Now you listen and colour. Colour the dog brown. Colour the fish red. Colour the rabbit grey. Colour the bird blue. Colour the bowl pink.`,
    sceneId: 'starter_l16_pets_home_outline' as SceneId,
    example: { regionId: 'cat', color: 'orange', x: 0.10, y: 0.40, width: 0.20, height: 0.30 },
    regions: [
      { id: 'dog',    label: 'chó',  x: 0.32, y: 0.55, width: 0.20, height: 0.25 },
      { id: 'fish',   label: 'cá',   x: 0.58, y: 0.30, width: 0.16, height: 0.18 },
      { id: 'rabbit', label: 'thỏ',  x: 0.75, y: 0.55, width: 0.18, height: 0.25 },
      { id: 'bird',   label: 'chim', x: 0.45, y: 0.15, width: 0.14, height: 0.15 },
      { id: 'bowl',   label: 'tô',   x: 0.15, y: 0.78, width: 0.18, height: 0.12 },
    ],
    correctColors: { dog: 'brown', fish: 'red', rabbit: 'grey', bird: 'blue', bowl: 'pink' },
    palette: ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown', 'grey'],
  };
}

function makeStarterColourL17(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the bed pink. The bed is pink. Pink. Now you listen and colour. Colour the pillow purple. Colour the teddy brown. Colour the slippers red. Colour the clock yellow. Colour the curtain blue.`,
    sceneId: 'starter_l17_sleepover_outline' as SceneId,
    example: { regionId: 'bed', color: 'pink', x: 0.10, y: 0.50, width: 0.40, height: 0.35 },
    regions: [
      { id: 'pillow',   label: 'gối',     x: 0.15, y: 0.42, width: 0.18, height: 0.12 },
      { id: 'teddy',    label: 'gấu bông', x: 0.30, y: 0.62, width: 0.14, height: 0.20 },
      { id: 'slippers', label: 'dép',     x: 0.55, y: 0.80, width: 0.18, height: 0.10 },
      { id: 'clock',    label: 'đồng hồ', x: 0.70, y: 0.15, width: 0.16, height: 0.18 },
      { id: 'curtain',  label: 'rèm',     x: 0.78, y: 0.30, width: 0.18, height: 0.45 },
    ],
    correctColors: { pillow: 'purple', teddy: 'brown', slippers: 'red', clock: 'yellow', curtain: 'blue' },
    palette: ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown'],
  };
}

function makeStarterColourL18(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the swing green. The swing is green. Green. Now you listen and colour. Colour the slide red. Colour the flower yellow. Colour the butterfly purple. Colour the cake brown. Colour the ball orange.`,
    sceneId: 'starter_l18_garden_play_outline' as SceneId,
    example: { regionId: 'swing', color: 'green', x: 0.60, y: 0.30, width: 0.20, height: 0.45 },
    regions: [
      { id: 'slide',     label: 'cầu trượt',  x: 0.10, y: 0.30, width: 0.25, height: 0.45 },
      { id: 'flower',    label: 'hoa',        x: 0.38, y: 0.65, width: 0.14, height: 0.20 },
      { id: 'butterfly', label: 'bươm bướm',  x: 0.45, y: 0.20, width: 0.14, height: 0.12 },
      { id: 'cake',      label: 'bánh',       x: 0.82, y: 0.65, width: 0.14, height: 0.15 },
      { id: 'ball',      label: 'bóng',       x: 0.22, y: 0.80, width: 0.12, height: 0.14 },
    ],
    correctColors: { slide: 'red', flower: 'yellow', butterfly: 'purple', cake: 'brown', ball: 'orange' },
    palette: ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown'],
  };
}

function makeStarterColourL19(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the train red. The train is red. Red. Now you listen and colour. Colour the bag green. Colour the window blue. Colour the suitcase brown. Colour the ticket yellow. Colour the cap pink.`,
    sceneId: 'starter_l19_train_outline' as SceneId,
    example: { regionId: 'train', color: 'red', x: 0.10, y: 0.50, width: 0.55, height: 0.30 },
    regions: [
      { id: 'bag',      label: 'túi',     x: 0.70, y: 0.55, width: 0.18, height: 0.20 },
      { id: 'window',   label: 'cửa sổ',  x: 0.20, y: 0.55, width: 0.18, height: 0.16 },
      { id: 'suitcase', label: 'va li',   x: 0.40, y: 0.80, width: 0.20, height: 0.15 },
      { id: 'ticket',   label: 'vé',      x: 0.05, y: 0.25, width: 0.14, height: 0.10 },
      { id: 'cap',      label: 'mũ',      x: 0.78, y: 0.25, width: 0.16, height: 0.15 },
    ],
    correctColors: { bag: 'green', window: 'blue', suitcase: 'brown', ticket: 'yellow', cap: 'pink' },
    palette: ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown'],
  };
}

function makeStarterColourL20(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the snowman white. The snowman is white. White. Now you listen and colour. Colour the hat black. Colour the scarf red. Colour the carrot orange. Colour the mittens pink. Colour the sled blue.`,
    sceneId: 'starter_l20_snow_outline' as SceneId,
    example: { regionId: 'snowman', color: 'white', x: 0.40, y: 0.30, width: 0.20, height: 0.50 },
    regions: [
      { id: 'hat',     label: 'mũ',     x: 0.43, y: 0.20, width: 0.14, height: 0.12 },
      { id: 'scarf',   label: 'khăn',   x: 0.40, y: 0.50, width: 0.20, height: 0.08 },
      { id: 'carrot',  label: 'cà rốt', x: 0.46, y: 0.40, width: 0.08, height: 0.06 },
      { id: 'mittens', label: 'găng',   x: 0.32, y: 0.58, width: 0.10, height: 0.12 },
      { id: 'sled',    label: 'xe trượt', x: 0.70, y: 0.78, width: 0.25, height: 0.15 },
    ],
    correctColors: { hat: 'black', scarf: 'red', carrot: 'orange', mittens: 'pink', sled: 'blue' },
    palette: ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown', 'white', 'black'],
  };
}

/**
 * D-18 Phase 6: Dispatch per-level Starters Colour template.
 * All 20 levels have UNIQUE scene + unique color script.
 */
function makeStarterColourPart(partId: string, audioKey: string, levelNumber: number): ColourPart {
  switch (levelNumber) {
    case 1: return makeStarterColourL1(partId, audioKey);
    case 2: return makeStarterColourL2(partId, audioKey);
    case 3: return makeStarterColourL3(partId, audioKey);
    case 4: return makeStarterColourL4(partId, audioKey);
    case 5: return makeStarterColourL5(partId, audioKey);
    case 6: return makeStarterColourL6(partId, audioKey);
    case 7: return makeStarterColourL7(partId, audioKey);
    case 8: return makeStarterColourL8(partId, audioKey);
    case 9: return makeStarterColourL9(partId, audioKey);
    case 10: return makeStarterColourL10(partId, audioKey);
    case 11: return makeStarterColourL11(partId, audioKey);
    case 12: return makeStarterColourL12(partId, audioKey);
    case 13: return makeStarterColourL13(partId, audioKey);
    case 14: return makeStarterColourL14(partId, audioKey);
    case 15: return makeStarterColourL15(partId, audioKey);
    case 16: return makeStarterColourL16(partId, audioKey);
    case 17: return makeStarterColourL17(partId, audioKey);
    case 18: return makeStarterColourL18(partId, audioKey);
    case 19: return makeStarterColourL19(partId, audioKey);
    default: return makeStarterColourL20(partId, audioKey);
  }
}

// ─── D-18 Phase 3: Movers per-level Colour parts (L21-L30) ─────────────
// Each level has its OWN outline scene (mover_lN_*_outline) with 5 colorable
// regions + 1 example. Scene image gen admin-triggered; UI shows warning
// until generated.

const MOVER_COLOUR_PALETTE = ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown', 'black', 'grey'];

// Shared 6-slot layout (example + 5 regions). Admin calibrates per scene.
const MC_EX = { x: 0.10, y: 0.45, width: 0.18, height: 0.25 };
const MC_R = [
  { x: 0.30, y: 0.28, width: 0.16, height: 0.22 },
  { x: 0.52, y: 0.20, width: 0.16, height: 0.20 },
  { x: 0.70, y: 0.40, width: 0.18, height: 0.24 },
  { x: 0.22, y: 0.72, width: 0.18, height: 0.22 },
  { x: 0.60, y: 0.72, width: 0.20, height: 0.22 },
];

function makeMoverColourL21(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the tent red. The tent is red. Red. Now you listen and colour. Colour the canoe blue. Colour the backpack green. Colour the fish orange. Colour the tree brown. Colour the campfire yellow.`,
    sceneId: 'mover_l21_summer_camp_outline' as SceneId,
    example: { regionId: 'tent', color: 'red', ...MC_EX },
    regions: [
      { id: 'canoe',    label: 'thuyền',   ...MC_R[0] },
      { id: 'backpack', label: 'ba lô',    ...MC_R[1] },
      { id: 'fish',     label: 'con cá',   ...MC_R[2] },
      { id: 'tree',     label: 'cái cây',  ...MC_R[3] },
      { id: 'campfire', label: 'lửa trại', ...MC_R[4] },
    ],
    correctColors: { canoe: 'blue', backpack: 'green', fish: 'orange', tree: 'brown', campfire: 'yellow' },
    palette: MOVER_COLOUR_PALETTE,
  };
}

function makeMoverColourL22(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the piano black. The piano is black. Black. Now you listen and colour. Colour the guitar brown. Colour the drum red. Colour the violin yellow. Colour the trumpet orange. Colour the music note blue.`,
    sceneId: 'mover_l22_music_lesson_outline' as SceneId,
    example: { regionId: 'piano', color: 'black', ...MC_EX },
    regions: [
      { id: 'guitar',  label: 'đàn ghi-ta',    ...MC_R[0] },
      { id: 'drum',    label: 'cái trống',     ...MC_R[1] },
      { id: 'violin',  label: 'đàn vi-ô-lông', ...MC_R[2] },
      { id: 'trumpet', label: 'cái kèn',       ...MC_R[3] },
      { id: 'note',    label: 'nốt nhạc',      ...MC_R[4] },
    ],
    correctColors: { guitar: 'brown', drum: 'red', violin: 'yellow', trumpet: 'orange', note: 'blue' },
    palette: MOVER_COLOUR_PALETTE,
  };
}

function makeMoverColourL23(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the ball black. The ball is black. Black. Now you listen and colour. Colour the shirt red. Colour the trophy yellow. Colour the flag blue. Colour the boot brown. Colour the net green.`,
    sceneId: 'mover_l23_football_match_outline' as SceneId,
    example: { regionId: 'ball', color: 'black', ...MC_EX },
    regions: [
      { id: 'shirt',  label: 'áo đấu',  ...MC_R[0] },
      { id: 'trophy', label: 'cúp',     ...MC_R[1] },
      { id: 'flag',   label: 'lá cờ',   ...MC_R[2] },
      { id: 'boot',   label: 'giày',    ...MC_R[3] },
      { id: 'net',    label: 'lưới',    ...MC_R[4] },
    ],
    correctColors: { shirt: 'red', trophy: 'yellow', flag: 'blue', boot: 'brown', net: 'green' },
    palette: MOVER_COLOUR_PALETTE,
  };
}

function makeMoverColourL24(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the tutu pink. The tutu is pink. Pink. Now you listen and colour. Colour the shoes red. Colour the ribbon purple. Colour the dress yellow. Colour the flower orange. Colour the star blue.`,
    sceneId: 'mover_l24_dance_class_outline' as SceneId,
    example: { regionId: 'tutu', color: 'pink', ...MC_EX },
    regions: [
      { id: 'shoes',  label: 'giày múa',      ...MC_R[0] },
      { id: 'ribbon', label: 'dải ruy băng',  ...MC_R[1] },
      { id: 'dress',  label: 'váy',           ...MC_R[2] },
      { id: 'flower', label: 'bông hoa',      ...MC_R[3] },
      { id: 'star',   label: 'ngôi sao',      ...MC_R[4] },
    ],
    correctColors: { shoes: 'red', ribbon: 'purple', dress: 'yellow', flower: 'orange', star: 'blue' },
    palette: MOVER_COLOUR_PALETTE,
  };
}

function makeMoverColourL25(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the pizza yellow. The pizza is yellow. Yellow. Now you listen and colour. Colour the cup blue. Colour the plate green. Colour the cake pink. Colour the apple red. Colour the bowl orange.`,
    sceneId: 'mover_l25_restaurant_outline' as SceneId,
    example: { regionId: 'pizza', color: 'yellow', ...MC_EX },
    regions: [
      { id: 'cup',   label: 'cái cốc',  ...MC_R[0] },
      { id: 'plate', label: 'cái đĩa',  ...MC_R[1] },
      { id: 'cake',  label: 'bánh ngọt', ...MC_R[2] },
      { id: 'apple', label: 'quả táo',  ...MC_R[3] },
      { id: 'bowl',  label: 'cái bát',  ...MC_R[4] },
    ],
    correctColors: { cup: 'blue', plate: 'green', cake: 'pink', apple: 'red', bowl: 'orange' },
    palette: MOVER_COLOUR_PALETTE,
  };
}

function makeMoverColourL26(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the bus red. The bus is red. Red. Now you listen and colour. Colour the ticket yellow. Colour the suitcase brown. Colour the sign green. Colour the wheel black. Colour the window blue.`,
    sceneId: 'mover_l26_bus_journey_outline' as SceneId,
    example: { regionId: 'bus', color: 'red', ...MC_EX },
    regions: [
      { id: 'ticket',   label: 'vé xe',    ...MC_R[0] },
      { id: 'suitcase', label: 'va li',    ...MC_R[1] },
      { id: 'sign',     label: 'biển báo', ...MC_R[2] },
      { id: 'wheel',    label: 'bánh xe',  ...MC_R[3] },
      { id: 'window',   label: 'cửa sổ',   ...MC_R[4] },
    ],
    correctColors: { ticket: 'yellow', suitcase: 'brown', sign: 'green', wheel: 'black', window: 'blue' },
    palette: MOVER_COLOUR_PALETTE,
  };
}

function makeMoverColourL27(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the elephant grey. The elephant is grey. Grey. Now you listen and colour. Colour the lion orange. Colour the monkey brown. Colour the giraffe yellow. Colour the snake green. Colour the penguin black.`,
    sceneId: 'mover_l27_zoo_trip_outline' as SceneId,
    example: { regionId: 'elephant', color: 'grey', ...MC_EX },
    regions: [
      { id: 'lion',    label: 'sư tử',         ...MC_R[0] },
      { id: 'monkey',  label: 'con khỉ',       ...MC_R[1] },
      { id: 'giraffe', label: 'hươu cao cổ',   ...MC_R[2] },
      { id: 'snake',   label: 'con rắn',       ...MC_R[3] },
      { id: 'penguin', label: 'chim cánh cụt', ...MC_R[4] },
    ],
    correctColors: { lion: 'orange', monkey: 'brown', giraffe: 'yellow', snake: 'green', penguin: 'black' },
    palette: MOVER_COLOUR_PALETTE,
  };
}

function makeMoverColourL28(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the dinosaur green. The dinosaur is green. Green. Now you listen and colour. Colour the painting blue. Colour the statue grey. Colour the vase orange. Colour the pot brown. Colour the mask yellow.`,
    sceneId: 'mover_l28_museum_tour_outline' as SceneId,
    example: { regionId: 'dinosaur', color: 'green', ...MC_EX },
    regions: [
      { id: 'painting', label: 'bức tranh', ...MC_R[0] },
      { id: 'statue',   label: 'bức tượng', ...MC_R[1] },
      { id: 'vase',     label: 'bình hoa',  ...MC_R[2] },
      { id: 'pot',      label: 'cái lọ',    ...MC_R[3] },
      { id: 'mask',     label: 'mặt nạ',    ...MC_R[4] },
    ],
    correctColors: { painting: 'blue', statue: 'grey', vase: 'orange', pot: 'brown', mask: 'yellow' },
    palette: MOVER_COLOUR_PALETTE,
  };
}

function makeMoverColourL29(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the fire engine red. The fire engine is red. Red. Now you listen and colour. Colour the helmet yellow. Colour the ladder brown. Colour the hose green. Colour the boot black. Colour the bucket blue.`,
    sceneId: 'mover_l29_fire_station_outline' as SceneId,
    example: { regionId: 'engine', color: 'red', ...MC_EX },
    regions: [
      { id: 'helmet', label: 'mũ cứu hỏa', ...MC_R[0] },
      { id: 'ladder', label: 'cái thang',  ...MC_R[1] },
      { id: 'hose',   label: 'vòi nước',   ...MC_R[2] },
      { id: 'boot',   label: 'ủng',        ...MC_R[3] },
      { id: 'bucket', label: 'cái xô',     ...MC_R[4] },
    ],
    correctColors: { helmet: 'yellow', ladder: 'brown', hose: 'green', boot: 'black', bucket: 'blue' },
    palette: MOVER_COLOUR_PALETTE,
  };
}

function makeMoverColourL30(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the dog brown. The dog is brown. Brown. Now you listen and colour. Colour the cat orange. Colour the rabbit grey. Colour the bird yellow. Colour the fish blue. Colour the rosette red.`,
    sceneId: 'mover_l30_pet_competition_outline' as SceneId,
    example: { regionId: 'dog', color: 'brown', ...MC_EX },
    regions: [
      { id: 'cat',     label: 'con mèo',  ...MC_R[0] },
      { id: 'rabbit',  label: 'con thỏ',  ...MC_R[1] },
      { id: 'bird',    label: 'con chim', ...MC_R[2] },
      { id: 'fish',    label: 'con cá',   ...MC_R[3] },
      { id: 'rosette', label: 'hoa thưởng', ...MC_R[4] },
    ],
    correctColors: { cat: 'orange', rabbit: 'grey', bird: 'yellow', fish: 'blue', rosette: 'red' },
    palette: MOVER_COLOUR_PALETTE,
  };
}

function makeMoverColourL31(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the tree green. The tree is green. Green. Now you listen and colour. Colour the spade grey. Colour the watering can blue. Colour the flowerpot brown. Colour the wheelbarrow red. Colour the flower pink.`,
    sceneId: 'mover_l31_tree_planting_outline' as SceneId,
    example: { regionId: 'tree', color: 'green', ...MC_EX },
    regions: [
      { id: 'spade',     label: 'cái xẻng',   ...MC_R[0] },
      { id: 'can',       label: 'bình tưới',  ...MC_R[1] },
      { id: 'flowerpot', label: 'chậu cây',   ...MC_R[2] },
      { id: 'barrow',    label: 'xe cút kít', ...MC_R[3] },
      { id: 'flower',    label: 'bông hoa',   ...MC_R[4] },
    ],
    correctColors: { spade: 'grey', can: 'blue', flowerpot: 'brown', barrow: 'red', flower: 'pink' },
    palette: MOVER_COLOUR_PALETTE,
  };
}

function makeMoverColourL32(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the screen blue. The screen is blue. Blue. Now you listen and colour. Colour the popcorn yellow. Colour the ticket red. Colour the seat purple. Colour the drink orange. Colour the glasses green.`,
    sceneId: 'mover_l32_cinema_visit_outline' as SceneId,
    example: { regionId: 'screen', color: 'blue', ...MC_EX },
    regions: [
      { id: 'popcorn', label: 'bỏng ngô',  ...MC_R[0] },
      { id: 'ticket',  label: 'vé',        ...MC_R[1] },
      { id: 'seat',    label: 'ghế',       ...MC_R[2] },
      { id: 'drink',   label: 'ly nước',   ...MC_R[3] },
      { id: 'glasses', label: 'kính',      ...MC_R[4] },
    ],
    correctColors: { popcorn: 'yellow', ticket: 'red', seat: 'purple', drink: 'orange', glasses: 'green' },
    palette: MOVER_COLOUR_PALETTE,
  };
}

function makeMoverColourL33(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the cake pink. The cake is pink. Pink. Now you listen and colour. Colour the bread brown. Colour the croissant orange. Colour the cupcake purple. Colour the pie red. Colour the cookie yellow.`,
    sceneId: 'mover_l33_bakery_shopping_outline' as SceneId,
    example: { regionId: 'cake', color: 'pink', ...MC_EX },
    regions: [
      { id: 'bread',     label: 'bánh mì',     ...MC_R[0] },
      { id: 'croissant', label: 'bánh sừng bò', ...MC_R[1] },
      { id: 'cupcake',   label: 'bánh cupcake', ...MC_R[2] },
      { id: 'pie',       label: 'bánh nướng',  ...MC_R[3] },
      { id: 'cookie',    label: 'bánh quy',    ...MC_R[4] },
    ],
    correctColors: { bread: 'brown', croissant: 'orange', cupcake: 'purple', pie: 'red', cookie: 'yellow' },
    palette: MOVER_COLOUR_PALETTE,
  };
}

function makeMoverColourL34(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the fish orange. The fish is orange. Orange. Now you listen and colour. Colour the boat brown. Colour the bucket blue. Colour the net green. Colour the rod red. Colour the worm pink.`,
    sceneId: 'mover_l34_fishing_trip_outline' as SceneId,
    example: { regionId: 'fish', color: 'orange', ...MC_EX },
    regions: [
      { id: 'boat',   label: 'thuyền',  ...MC_R[0] },
      { id: 'bucket', label: 'cái xô',  ...MC_R[1] },
      { id: 'net',    label: 'cái lưới', ...MC_R[2] },
      { id: 'rod',    label: 'cần câu',  ...MC_R[3] },
      { id: 'worm',   label: 'con giun', ...MC_R[4] },
    ],
    correctColors: { boat: 'brown', bucket: 'blue', net: 'green', rod: 'red', worm: 'pink' },
    palette: MOVER_COLOUR_PALETTE,
  };
}

function makeMoverColourL35(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the lamp yellow. The lamp is yellow. Yellow. Now you listen and colour. Colour the chair brown. Colour the box orange. Colour the book blue. Colour the clock red. Colour the teddy purple.`,
    sceneId: 'mover_l35_garage_sale_outline' as SceneId,
    example: { regionId: 'lamp', color: 'yellow', ...MC_EX },
    regions: [
      { id: 'chair', label: 'cái ghế',   ...MC_R[0] },
      { id: 'box',   label: 'cái hộp',   ...MC_R[1] },
      { id: 'book',  label: 'quyển sách', ...MC_R[2] },
      { id: 'clock', label: 'đồng hồ',   ...MC_R[3] },
      { id: 'teddy', label: 'gấu bông',  ...MC_R[4] },
    ],
    correctColors: { chair: 'brown', box: 'orange', book: 'blue', clock: 'red', teddy: 'purple' },
    palette: MOVER_COLOUR_PALETTE,
  };
}

function makeMoverColourL36(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the bed blue. The bed is blue. Blue. Now you listen and colour. Colour the flower red. Colour the bottle green. Colour the bandage yellow. Colour the thermometer orange. Colour the heart pink.`,
    sceneId: 'mover_l36_hospital_visit_outline' as SceneId,
    example: { regionId: 'bed', color: 'blue', ...MC_EX },
    regions: [
      { id: 'flower',      label: 'bông hoa',  ...MC_R[0] },
      { id: 'bottle',      label: 'lọ thuốc',  ...MC_R[1] },
      { id: 'bandage',     label: 'băng gạc',  ...MC_R[2] },
      { id: 'thermometer', label: 'nhiệt kế',  ...MC_R[3] },
      { id: 'heart',       label: 'trái tim',  ...MC_R[4] },
    ],
    correctColors: { flower: 'red', bottle: 'green', bandage: 'yellow', thermometer: 'orange', heart: 'pink' },
    palette: MOVER_COLOUR_PALETTE,
  };
}

function makeMoverColourL37(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the postbox red. The postbox is red. Red. Now you listen and colour. Colour the parcel brown. Colour the envelope yellow. Colour the stamp blue. Colour the scales grey. Colour the pen green.`,
    sceneId: 'mover_l37_post_office_outline' as SceneId,
    example: { regionId: 'postbox', color: 'red', ...MC_EX },
    regions: [
      { id: 'parcel',   label: 'bưu kiện', ...MC_R[0] },
      { id: 'envelope', label: 'phong bì', ...MC_R[1] },
      { id: 'stamp',    label: 'con tem',  ...MC_R[2] },
      { id: 'scales',   label: 'cái cân',  ...MC_R[3] },
      { id: 'pen',      label: 'cây bút',  ...MC_R[4] },
    ],
    correctColors: { parcel: 'brown', envelope: 'yellow', stamp: 'blue', scales: 'grey', pen: 'green' },
    palette: MOVER_COLOUR_PALETTE,
  };
}

function makeMoverColourL38(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the tent red. The tent is red. Red. Now you listen and colour. Colour the mountain grey. Colour the campfire orange. Colour the backpack blue. Colour the compass yellow. Colour the tree green.`,
    sceneId: 'mover_l38_camping_mountains_outline' as SceneId,
    example: { regionId: 'tent', color: 'red', ...MC_EX },
    regions: [
      { id: 'mountain', label: 'ngọn núi',  ...MC_R[0] },
      { id: 'campfire', label: 'lửa trại',  ...MC_R[1] },
      { id: 'backpack', label: 'ba lô',     ...MC_R[2] },
      { id: 'compass',  label: 'la bàn',    ...MC_R[3] },
      { id: 'tree',     label: 'cái cây',   ...MC_R[4] },
    ],
    correctColors: { mountain: 'grey', campfire: 'orange', backpack: 'blue', compass: 'yellow', tree: 'green' },
    palette: MOVER_COLOUR_PALETTE,
  };
}

function makeMoverColourL39(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the easel brown. The easel is brown. Brown. Now you listen and colour. Colour the painting blue. Colour the palette orange. Colour the paintbrush red. Colour the statue grey. Colour the frame yellow.`,
    sceneId: 'mover_l39_art_exhibition_outline' as SceneId,
    example: { regionId: 'easel', color: 'brown', ...MC_EX },
    regions: [
      { id: 'painting',   label: 'bức tranh', ...MC_R[0] },
      { id: 'palette',    label: 'bảng màu',  ...MC_R[1] },
      { id: 'paintbrush', label: 'cọ vẽ',     ...MC_R[2] },
      { id: 'statue',     label: 'bức tượng', ...MC_R[3] },
      { id: 'frame',      label: 'khung tranh', ...MC_R[4] },
    ],
    correctColors: { painting: 'blue', palette: 'orange', paintbrush: 'red', statue: 'grey', frame: 'yellow' },
    palette: MOVER_COLOUR_PALETTE,
  };
}

function makeMoverColourL40(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the cot blue. The cot is blue. Blue. Now you listen and colour. Colour the pram pink. Colour the bottle yellow. Colour the rattle red. Colour the teddy brown. Colour the blanket purple.`,
    sceneId: 'mover_l40_new_baby_outline' as SceneId,
    example: { regionId: 'cot', color: 'blue', ...MC_EX },
    regions: [
      { id: 'pram',    label: 'xe nôi',   ...MC_R[0] },
      { id: 'bottle',  label: 'bình sữa', ...MC_R[1] },
      { id: 'rattle',  label: 'lục lạc',  ...MC_R[2] },
      { id: 'teddy',   label: 'gấu bông', ...MC_R[3] },
      { id: 'blanket', label: 'cái chăn', ...MC_R[4] },
    ],
    correctColors: { pram: 'pink', bottle: 'yellow', rattle: 'red', teddy: 'brown', blanket: 'purple' },
    palette: MOVER_COLOUR_PALETTE,
  };
}

/** Dispatch Movers Colour: per-level L21-L40, rotation fallback beyond. */
function makeMoverColourByLevel(partId: string, audioKey: string, levelNumber: number): ColourPart {
  switch (levelNumber) {
    case 21: return makeMoverColourL21(partId, audioKey);
    case 22: return makeMoverColourL22(partId, audioKey);
    case 23: return makeMoverColourL23(partId, audioKey);
    case 24: return makeMoverColourL24(partId, audioKey);
    case 25: return makeMoverColourL25(partId, audioKey);
    case 26: return makeMoverColourL26(partId, audioKey);
    case 27: return makeMoverColourL27(partId, audioKey);
    case 28: return makeMoverColourL28(partId, audioKey);
    case 29: return makeMoverColourL29(partId, audioKey);
    case 30: return makeMoverColourL30(partId, audioKey);
    case 31: return makeMoverColourL31(partId, audioKey);
    case 32: return makeMoverColourL32(partId, audioKey);
    case 33: return makeMoverColourL33(partId, audioKey);
    case 34: return makeMoverColourL34(partId, audioKey);
    case 35: return makeMoverColourL35(partId, audioKey);
    case 36: return makeMoverColourL36(partId, audioKey);
    case 37: return makeMoverColourL37(partId, audioKey);
    case 38: return makeMoverColourL38(partId, audioKey);
    case 39: return makeMoverColourL39(partId, audioKey);
    case 40: return makeMoverColourL40(partId, audioKey);
    default: {
      const idx = (levelNumber - 1) % 3;
      if (idx === 1) return makeBedroomColourPart(partId, audioKey);
      if (idx === 2) return makeFarmColourPart(partId, audioKey);
      return makeGardenColourPart(partId, audioKey);
    }
  }
}

// ─── D-18 Phase 4: Flyers per-level Colour parts (L41-L50) ─────────────

function makeFlyerColourL41(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the microscope grey. The microscope is grey. Grey. Now you listen and colour. Colour the test tube blue. Colour the robot red. Colour the ruler yellow. Colour the magnet orange. Colour the light bulb green.`,
    sceneId: 'flyer_l41_science_fair_outline' as SceneId,
    example: { regionId: 'microscope', color: 'grey', ...MC_EX },
    regions: [
      { id: 'testtube', label: 'ống nghiệm', ...MC_R[0] },
      { id: 'robot',    label: 'robot',      ...MC_R[1] },
      { id: 'ruler',    label: 'thước kẻ',   ...MC_R[2] },
      { id: 'magnet',   label: 'nam châm',   ...MC_R[3] },
      { id: 'bulb',     label: 'bóng đèn',   ...MC_R[4] },
    ],
    correctColors: { testtube: 'blue', robot: 'red', ruler: 'yellow', magnet: 'orange', bulb: 'green' },
    palette: MOVER_COLOUR_PALETTE,
  };
}

function makeFlyerColourL42(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the balloon red. The balloon is red. Red. Now you listen and colour. Colour the cake pink. Colour the coin yellow. Colour the box brown. Colour the poster blue. Colour the jar green.`,
    sceneId: 'flyer_l42_charity_event_outline' as SceneId,
    example: { regionId: 'balloon', color: 'red', ...MC_EX },
    regions: [
      { id: 'cake',   label: 'bánh ngọt',  ...MC_R[0] },
      { id: 'coin',   label: 'đồng xu',    ...MC_R[1] },
      { id: 'box',    label: 'hộp quyên góp', ...MC_R[2] },
      { id: 'poster', label: 'áp phích',   ...MC_R[3] },
      { id: 'jar',    label: 'lọ tiền',    ...MC_R[4] },
    ],
    correctColors: { cake: 'pink', coin: 'yellow', box: 'brown', poster: 'blue', jar: 'green' },
    palette: MOVER_COLOUR_PALETTE,
  };
}

function makeFlyerColourL43(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the dog brown. The dog is brown. Brown. Now you listen and colour. Colour the cat orange. Colour the rabbit pink. Colour the bird yellow. Colour the fish blue. Colour the bowl green.`,
    sceneId: 'flyer_l43_volunteer_shelter_outline' as SceneId,
    example: { regionId: 'dog', color: 'brown', ...MC_EX },
    regions: [
      { id: 'cat',    label: 'con mèo',  ...MC_R[0] },
      { id: 'rabbit', label: 'con thỏ',  ...MC_R[1] },
      { id: 'bird',   label: 'con chim', ...MC_R[2] },
      { id: 'fish',   label: 'con cá',   ...MC_R[3] },
      { id: 'bowl',   label: 'bát ăn',   ...MC_R[4] },
    ],
    correctColors: { cat: 'orange', rabbit: 'pink', bird: 'yellow', fish: 'blue', bowl: 'green' },
    palette: MOVER_COLOUR_PALETTE,
  };
}

function makeFlyerColourL44(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the pizza red. The pizza is red. Red. Now you listen and colour. Colour the burger brown. Colour the smoothie pink. Colour the noodles orange. Colour the cheese yellow. Colour the flag blue.`,
    sceneId: 'flyer_l44_food_festival_outline' as SceneId,
    example: { regionId: 'pizza', color: 'red', ...MC_EX },
    regions: [
      { id: 'burger',   label: 'bánh kẹp',  ...MC_R[0] },
      { id: 'smoothie', label: 'sinh tố',   ...MC_R[1] },
      { id: 'noodles',  label: 'mì',        ...MC_R[2] },
      { id: 'cheese',   label: 'phô mai',   ...MC_R[3] },
      { id: 'flag',     label: 'lá cờ',     ...MC_R[4] },
    ],
    correctColors: { burger: 'brown', smoothie: 'pink', noodles: 'orange', cheese: 'yellow', flag: 'blue' },
    palette: MOVER_COLOUR_PALETTE,
  };
}

function makeFlyerColourL45(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the tree green. The tree is green. Green. Now you listen and colour. Colour the recycling bin blue. Colour the solar panel black. Colour the bottle orange. Colour the watering can yellow. Colour the flower pink.`,
    sceneId: 'flyer_l45_eco_project_outline' as SceneId,
    example: { regionId: 'tree', color: 'green', ...MC_EX },
    regions: [
      { id: 'bin',    label: 'thùng tái chế', ...MC_R[0] },
      { id: 'panel',  label: 'tấm pin mặt trời', ...MC_R[1] },
      { id: 'bottle', label: 'chai nhựa',   ...MC_R[2] },
      { id: 'can',    label: 'bình tưới',   ...MC_R[3] },
      { id: 'flower', label: 'bông hoa',    ...MC_R[4] },
    ],
    correctColors: { bin: 'blue', panel: 'black', bottle: 'orange', can: 'yellow', flower: 'pink' },
    palette: MOVER_COLOUR_PALETTE,
  };
}

function makeFlyerColourL46(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the rocket red. The rocket is red. Red. Now you listen and colour. Colour the planet blue. Colour the star yellow. Colour the moon grey. Colour the telescope green. Colour the helmet orange.`,
    sceneId: 'flyer_l46_space_exhibition_outline' as SceneId,
    example: { regionId: 'rocket', color: 'red', ...MC_EX },
    regions: [
      { id: 'planet',    label: 'hành tinh', ...MC_R[0] },
      { id: 'star',      label: 'ngôi sao',  ...MC_R[1] },
      { id: 'moon',      label: 'mặt trăng', ...MC_R[2] },
      { id: 'telescope', label: 'kính viễn vọng', ...MC_R[3] },
      { id: 'helmet',    label: 'mũ phi hành', ...MC_R[4] },
    ],
    correctColors: { planet: 'blue', star: 'yellow', moon: 'grey', telescope: 'green', helmet: 'orange' },
    palette: MOVER_COLOUR_PALETTE,
  };
}

function makeFlyerColourL47(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the cake pink. The cake is pink. Pink. Now you listen and colour. Colour the whisk grey. Colour the knife blue. Colour the pot red. Colour the chef hat yellow. Colour the bowl orange.`,
    sceneId: 'flyer_l47_cooking_competition_outline' as SceneId,
    example: { regionId: 'cake', color: 'pink', ...MC_EX },
    regions: [
      { id: 'whisk',   label: 'cái đánh trứng', ...MC_R[0] },
      { id: 'knife',   label: 'con dao',  ...MC_R[1] },
      { id: 'pot',     label: 'cái nồi',  ...MC_R[2] },
      { id: 'chefhat', label: 'mũ đầu bếp', ...MC_R[3] },
      { id: 'bowl',    label: 'cái bát',  ...MC_R[4] },
    ],
    correctColors: { whisk: 'grey', knife: 'blue', pot: 'red', chefhat: 'yellow', bowl: 'orange' },
    palette: MOVER_COLOUR_PALETTE,
  };
}

function makeFlyerColourL48(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the camera black. The camera is black. Black. Now you listen and colour. Colour the clapperboard red. Colour the microphone blue. Colour the light yellow. Colour the script green. Colour the chair brown.`,
    sceneId: 'flyer_l48_film_making_outline' as SceneId,
    example: { regionId: 'camera', color: 'black', ...MC_EX },
    regions: [
      { id: 'clapper', label: 'bảng đánh dấu', ...MC_R[0] },
      { id: 'mic',     label: 'micro',     ...MC_R[1] },
      { id: 'light',   label: 'đèn',       ...MC_R[2] },
      { id: 'script',  label: 'kịch bản',  ...MC_R[3] },
      { id: 'chair',   label: 'cái ghế',   ...MC_R[4] },
    ],
    correctColors: { clapper: 'red', mic: 'blue', light: 'yellow', script: 'green', chair: 'brown' },
    palette: MOVER_COLOUR_PALETTE,
  };
}

function makeFlyerColourL49(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the camera black. The camera is black. Black. Now you listen and colour. Colour the tripod grey. Colour the photo blue. Colour the lens green. Colour the frame brown. Colour the bird yellow.`,
    sceneId: 'flyer_l49_photography_class_outline' as SceneId,
    example: { regionId: 'camera', color: 'black', ...MC_EX },
    regions: [
      { id: 'tripod', label: 'chân máy', ...MC_R[0] },
      { id: 'photo',  label: 'tấm ảnh',  ...MC_R[1] },
      { id: 'lens',   label: 'ống kính', ...MC_R[2] },
      { id: 'frame',  label: 'khung ảnh', ...MC_R[3] },
      { id: 'bird',   label: 'con chim', ...MC_R[4] },
    ],
    correctColors: { tripod: 'grey', photo: 'blue', lens: 'green', frame: 'brown', bird: 'yellow' },
    palette: MOVER_COLOUR_PALETTE,
  };
}

function makeFlyerColourL50(partId: string, audioKey: string): ColourPart {
  return {
    type: 'listening_colour', partId, audioKey,
    audioScript: `Listen and colour. There is one example. Colour the mountain grey. The mountain is grey. Grey. Now you listen and colour. Colour the tent red. Colour the flag blue. Colour the backpack green. Colour the rope brown. Colour the flask orange.`,
    sceneId: 'flyer_l50_mountain_hiking_outline' as SceneId,
    example: { regionId: 'mountain', color: 'grey', ...MC_EX },
    regions: [
      { id: 'tent',     label: 'cái lều',  ...MC_R[0] },
      { id: 'flag',     label: 'lá cờ',    ...MC_R[1] },
      { id: 'backpack', label: 'ba lô',    ...MC_R[2] },
      { id: 'rope',     label: 'dây thừng', ...MC_R[3] },
      { id: 'flask',    label: 'bình giữ nhiệt', ...MC_R[4] },
    ],
    correctColors: { tent: 'red', flag: 'blue', backpack: 'green', rope: 'brown', flask: 'orange' },
    palette: MOVER_COLOUR_PALETTE,
  };
}

/** Dispatch Flyers Colour: per-level L41-L50, rotation fallback beyond. */
function makeFlyerColourByLevel(partId: string, audioKey: string, levelNumber: number): ColourPart {
  switch (levelNumber) {
    case 41: return makeFlyerColourL41(partId, audioKey);
    case 42: return makeFlyerColourL42(partId, audioKey);
    case 43: return makeFlyerColourL43(partId, audioKey);
    case 44: return makeFlyerColourL44(partId, audioKey);
    case 45: return makeFlyerColourL45(partId, audioKey);
    case 46: return makeFlyerColourL46(partId, audioKey);
    case 47: return makeFlyerColourL47(partId, audioKey);
    case 48: return makeFlyerColourL48(partId, audioKey);
    case 49: return makeFlyerColourL49(partId, audioKey);
    case 50: return makeFlyerColourL50(partId, audioKey);
    default: {
      const idx = (levelNumber - 1) % 3;
      if (idx === 1) return makeBedroomColourPart(partId, audioKey);
      if (idx === 2) return makeFarmColourPart(partId, audioKey);
      return makeGardenColourPart(partId, audioKey);
    }
  }
}

// ─── Level builder ─────────────────────────────────────────────────────

/**
 * Sprint 4.8: Difficulty enum drives content scaling across 60 levels.
 *
 * - Starters (1-20): Pre-A1 — basic vocab, simple present, single-clause sentences
 * - Movers   (21-40): A1-A2 — past tense, comparatives, ~600 word vocab
 * - Flyers   (41-60): A2-B1 — future, conditionals, abstract topics, ~1000 vocab
 *
 * The 4-part structure (drag, write, tick, colour) stays constant across
 * all difficulties — Cambridge YLE keeps consistent format. What changes:
 *   1. Name pool (longer/harder spellings at higher difficulty)
 *   2. Scene rotation (different scenes for variety across 60 levels)
 *   3. Audio script complexity (handled inside each makePart function)
 *   4. Time limit (Movers/Flyers slightly longer due to more reading)
 */
type Difficulty = 'starters' | 'movers' | 'flyers';

function difficultyForLevel(levelNumber: number): Difficulty {
  if (levelNumber >= 41) return 'flyers';
  if (levelNumber >= 21) return 'movers';
  return 'starters';
}

function namesPoolForDifficulty(difficulty: Difficulty, idx: number): string[] {
  if (difficulty === 'flyers') return FLYER_NAMES[idx % FLYER_NAMES.length];
  if (difficulty === 'movers') return MOVER_NAMES[idx % MOVER_NAMES.length];
  return STARTER_NAMES[idx % STARTER_NAMES.length];
}

/**
 * Build a single level. Scene rotation pattern across the 60 levels is
 * designed so adjacent levels feel different but the same scene only
 * needs ~5 unique R2-cached generations to cover the catalog.
 *
 * Drag scenes (rotated): park_kids, beach_family, classroom, playground,
 *   kitchen_baking, birthday_party
 * Write scenes (rotated): pet_girl, family_dinner, weekend_activities
 * Colour scenes (rotated): garden_objects_outline, bedroom_outline, farm_outline
 */
function makeLevel(levelNumber: number): ExamLevel {
  const difficulty = difficultyForLevel(levelNumber);
  const namePool = namesPoolForDifficulty(difficulty, levelNumber);
  const exampleName = namePool[0];
  const names = namePool.slice(1, 6) as [string, string, string, string, string];

  // Drag scene rotation — Movers/Flyers rotate 6 scenes (~7 levels per scene).
  // Starters (L1-L20): D-18 Phase 5 — per-level unique scene via makeStarterDragPart.
  const dragSceneIdx = (levelNumber - 1) % 6;
  const part1 = (() => {
    const audioKey = `level${levelNumber}/p1.mp3`;
    const partId = `lvl${levelNumber}_p1`;
    if (difficulty === 'starters') {
      return makeStarterDragPart(partId, audioKey, exampleName, names, levelNumber);
    }
    if (difficulty === 'movers' && MOVERS_CHARS_BY_LEVEL[levelNumber]) {
      return makeMoverDragPart(partId, audioKey, exampleName, names, levelNumber);
    }
    if (difficulty === 'flyers' && FLYERS_CHARS_BY_LEVEL[levelNumber]) {
      return makeFlyerDragPart(partId, audioKey, exampleName, names, levelNumber);
    }
    switch (dragSceneIdx) {
      case 0: return makeParkDragPart(partId, audioKey, exampleName, names);
      case 1: return makeBeachDragPart(partId, audioKey, exampleName, names);
      case 2: return makeClassroomDragPart(partId, audioKey, exampleName, names);
      case 3: return makePlaygroundDragPart(partId, audioKey, exampleName, names);
      case 4: return makeKitchenDragPart(partId, audioKey, exampleName, names);
      default: return makeBirthdayDragPart(partId, audioKey, exampleName, names);
    }
  })();

  // Write scene + difficulty-specific narrative.
  // Starters: per-level unique content (L1-L10), rotation fallback (L11-L20 TODO).
  // Movers/Flyers (3 variants): rotate via levelNumber % 3
  const part2 = (() => {
    const audioKey = `level${levelNumber}/p2.mp3`;
    const partId = `lvl${levelNumber}_p2`;
    if (difficulty === 'flyers') return makeFlyerWriteByLevel(partId, audioKey, levelNumber);
    if (difficulty === 'movers') return makeMoverWriteByLevel(partId, audioKey, levelNumber);
    return makeStarterWritePart(partId, audioKey, levelNumber);
  })();

  // Tick part: difficulty-scaled vocabulary.
  // Starters: per-level unique content (L1-L10), rotation fallback (L11-L20 TODO).
  const part3 = (() => {
    const audioKey = `level${levelNumber}/p3.mp3`;
    const partId = `lvl${levelNumber}_p3`;
    if (difficulty === 'flyers') return makeFlyerTickByLevel(partId, audioKey, levelNumber);
    if (difficulty === 'movers') return makeMoverTickByLevel(partId, audioKey, levelNumber);
    return makeStarterTickPart(partId, audioKey, levelNumber);
  })();

  // Colour scene: Starters per-level (L1-L20 unique). Movers/Flyers rotate.
  const colourSceneIdx = (levelNumber - 1) % 3;
  const part4 = (() => {
    const audioKey = `level${levelNumber}/p4.mp3`;
    const partId = `lvl${levelNumber}_p4`;
    if (difficulty === 'starters') {
      return makeStarterColourPart(partId, audioKey, levelNumber);
    }
    if (difficulty === 'movers') {
      return makeMoverColourByLevel(partId, audioKey, levelNumber);
    }
    if (difficulty === 'flyers') {
      return makeFlyerColourByLevel(partId, audioKey, levelNumber);
    }
    if (colourSceneIdx === 1) return makeBedroomColourPart(partId, audioKey);
    if (colourSceneIdx === 2) return makeFarmColourPart(partId, audioKey);
    return makeGardenColourPart(partId, audioKey);
  })();

  // Time limits scale up gently with difficulty (more reading + thinking)
  const timeLimitSec = difficulty === 'flyers' ? 40 * 60
                     : difficulty === 'movers' ? 35 * 60
                     : 30 * 60;

  // Title shows the within-difficulty index (1-20 within each planet)
  const idxInDifficulty =
    difficulty === 'flyers' ? levelNumber - 40
    : difficulty === 'movers' ? levelNumber - 20
    : levelNumber;

  const planetName =
    difficulty === 'flyers' ? 'Flyers'
    : difficulty === 'movers' ? 'Movers'
    : 'Starters';

  return {
    levelNumber,
    difficulty,
    title: `${planetName} ${idxInDifficulty}`,
    description: 'Bài thi luyện kỹ năng nghe — nghe hiểu, ghép tên, viết, chọn tranh, tô màu.',
    timeLimitSec,
    parts: [part1, part2, part3, part4],
  };
}

// ─── All 60 levels: 20 Starters + 20 Movers + 20 Flyers ───────────────

export const allLevels: ExamLevel[] = Array.from(
  { length: 60 },
  (_, i) => makeLevel(i + 1),
);

/** Get the level with a specific number, or undefined if not generated. */
export function getLevel(levelNumber: number): ExamLevel | undefined {
  return allLevels.find((l) => l.levelNumber === levelNumber);
}
