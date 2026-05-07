import type { ExamLevel, DragNamePart, WritePart, TickPart, ColourPart } from '../../types';
import { DRAG_SCENE_CHARS, buildDragNameAudioScript } from './sceneCharacters';

/**
 * Scene IDs that match the backend `worker/src/exam/scenes.ts` registry.
 * Keep in sync — the backend is authoritative for AI generation prompts;
 * this frontend type exists just for compile-time safety on level config.
 */
type SceneId =
  | 'park_kids' | 'beach_family' | 'classroom' | 'playground'
  | 'kitchen_baking' | 'birthday_party'
  | 'pet_girl' | 'family_dinner' | 'weekend_activities'
  | 'garden_objects_outline' | 'bedroom_outline' | 'farm_outline';

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

// ─── Part 2: Listen & write — Starters difficulty ──────────────────────

function makePetWritePart(partId: string, audioKey: string): WritePart {
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

// ─── Part 3: Listen & tick ─────────────────────────────────────────────

function makeStandardTickPart(partId: string, audioKey: string): TickPart {
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

  // Drag scene rotation — 6 scenes cycle through 60 levels = each scene
  // appears in ~10 levels. Audio scripts vary by difficulty so the same
  // scene image hosts different content per level.
  const dragSceneIdx = (levelNumber - 1) % 6;
  const part1 = (() => {
    const audioKey = `level${levelNumber}/p1.mp3`;
    const partId = `lvl${levelNumber}_p1`;
    switch (dragSceneIdx) {
      case 0: return makeParkDragPart(partId, audioKey, exampleName, names);
      case 1: return makeBeachDragPart(partId, audioKey, exampleName, names);
      case 2: return makeClassroomDragPart(partId, audioKey, exampleName, names);
      case 3: return makePlaygroundDragPart(partId, audioKey, exampleName, names);
      case 4: return makeKitchenDragPart(partId, audioKey, exampleName, names);
      default: return makeBirthdayDragPart(partId, audioKey, exampleName, names);
    }
  })();

  // Write scene + difficulty-specific narrative (3 scenes × 3 difficulties = 9 unique parts)
  const writeSceneIdx = (levelNumber - 1) % 3;
  const part2 = (() => {
    const audioKey = `level${levelNumber}/p2.mp3`;
    const partId = `lvl${levelNumber}_p2`;
    if (difficulty === 'flyers') return makeFlyerWritePart(partId, audioKey, writeSceneIdx);
    if (difficulty === 'movers') return makeMoverWritePart(partId, audioKey, writeSceneIdx);
    return makePetWritePart(partId, audioKey);
  })();

  // Tick part: difficulty-scaled vocabulary
  const part3 = (() => {
    const audioKey = `level${levelNumber}/p3.mp3`;
    const partId = `lvl${levelNumber}_p3`;
    if (difficulty === 'flyers') return makeFlyerTickPart(partId, audioKey);
    if (difficulty === 'movers') return makeMoverTickPart(partId, audioKey);
    return makeStandardTickPart(partId, audioKey);
  })();

  // Colour scene rotation
  const colourSceneIdx = (levelNumber - 1) % 3;
  const part4 = (() => {
    const audioKey = `level${levelNumber}/p4.mp3`;
    const partId = `lvl${levelNumber}_p4`;
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
