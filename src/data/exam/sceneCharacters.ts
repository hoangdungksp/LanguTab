/**
 * Scene character registry — Sprint 4.9.2 (v1.5.0)
 *
 * Source of truth for what each character in a drag-name scene LOOKS LIKE
 * and is DOING. Used to generate BOTH:
 *   1. Scene prompts (sent to AI Flux) — describe traits so AI renders matching characters
 *   2. Audio scripts (sent to TTS) — describe same traits so kids hear "Tom is wearing
 *      a red shirt and flying a kite" instead of "Tom is in the top-left"
 *
 * By keeping both derivations from the same data, scene + audio stay in sync.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Pedagogical design
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Each character has TWO descriptive traits combined in audio:
 *   1. Clothing: "wearing a red shirt", "in a blue dress", "with a green hat"
 *   2. Activity: "flying a kite", "reading a book", "kicking a soccer ball"
 *
 * Audio template: "{Name} is {clothing} and {activity}."
 *   e.g., "Tom is wearing a red shirt and flying a kite."
 *
 * This teaches Cambridge YLE Starters vocabulary:
 *   - Colors (red/blue/green/yellow/pink/orange/purple/brown)
 *   - Clothing (shirt, dress, hat, sweater, t-shirt)
 *   - Verbs+ing (playing, reading, running, eating, drawing)
 *   - Common nouns (kite, book, ball, bicycle, ice cream, crayons)
 *
 * Position info is intentionally NOT in audio — kids identify characters by
 * APPEARANCE, which builds vocabulary. Position is only in the scene prompt
 * to control AI Flux composition.
 */

/** One character in a 3×2 grid drag-name scene. */
export interface SceneCharacter {
  /** Grid position. Used for scene prompt composition. */
  gridPosition: 'top-left' | 'top-middle' | 'top-right' | 'bottom-left' | 'bottom-middle' | 'bottom-right';
  /** Drop zone ID this character corresponds to. */
  zoneId: string;
  /** Clothing description. Format: "wearing X" or "in X". E.g., "wearing a red shirt". */
  clothing: string;
  /** Activity description. Format: "Xing Y". E.g., "flying a red kite". */
  activity: string;
}

/** Drag-name scene definition with all 6 characters. */
export interface SceneCharacterSet {
  /** Brief setting description for the scene prompt opening. */
  setting: string;
  /** Background description for scene prompt. */
  background: string;
  /** All 6 characters in the 3×2 grid. */
  characters: SceneCharacter[];
}

/**
 * Helper to build the AI Flux scene prompt from a character set. Caller can
 * combine with style suffix (cartoon, no text, etc.) for the full prompt.
 */
export function buildScenePrompt(scene: SceneCharacterSet): string {
  const charsByPosition = new Map<string, SceneCharacter>();
  for (const c of scene.characters) charsByPosition.set(c.gridPosition, c);
  const get = (pos: SceneCharacter['gridPosition']) => {
    const c = charsByPosition.get(pos);
    return c ? `child ${c.clothing} ${c.activity}` : 'child playing';
  };
  return (
    `Wide horizontal cartoon illustration of ${scene.setting}. ` +
    `COMPOSITION (most important): Six children arranged in a clean 3×2 grid ` +
    `(three columns, two rows). Top row contains three children spaced evenly ` +
    `across the top half of the image. Bottom row contains three children spaced ` +
    `evenly across the bottom half. Each child is in their own area with empty ` +
    `space around them so they do not overlap. ` +
    `Top row left to right: ${get('top-left')}; ${get('top-middle')}; ${get('top-right')}. ` +
    `Bottom row left to right: ${get('bottom-left')}; ${get('bottom-middle')}; ${get('bottom-right')}. ` +
    `${scene.background} Wide 16:9 aspect ratio. ` +
    `Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, ` +
    `no text, no words.`
  );
}

/**
 * Helper to build the audio script from a character set + name assignments.
 * `nameForZone` maps zone_id → character name (e.g., {zone_tl: "Ben", zone_tm: "Sue"}).
 * `exampleZoneId` indicates which zone is the pre-placed example (gets "There is one example" treatment).
 */
export function buildDragNameAudioScript(
  scene: SceneCharacterSet,
  nameForZone: Record<string, string>,
  exampleZoneId: string,
): string {
  const exampleChar = scene.characters.find((c) => c.zoneId === exampleZoneId);
  const exampleName = nameForZone[exampleZoneId];
  if (!exampleChar || !exampleName) {
    throw new Error(`buildDragNameAudioScript: example zone ${exampleZoneId} not found in scene`);
  }
  // Other characters in narrative order (skip example)
  const others = scene.characters.filter((c) => c.zoneId !== exampleZoneId && nameForZone[c.zoneId]);
  const lines: string[] = [
    `Look at the picture. Listen and look. There is one example.`,
    // Example uses appearance-based description so kids learn vocabulary
    `${exampleName} is ${exampleChar.clothing} and is ${exampleChar.activity}. Can you see ${exampleName}?`,
    `Now you listen and write the names.`,
  ];
  for (const c of others) {
    const name = nameForZone[c.zoneId]!;
    lines.push(`${name} is ${c.clothing} and is ${c.activity}.`);
  }
  return lines.join(' ');
}

// ─── Scene definitions ──────────────────────────────────────────────────

/**
 * Park scene — kids playing outdoors with diverse activities.
 * Each character has DISTINCT clothing color + DISTINCT activity so kids
 * can identify by either trait.
 */
export const PARK_KIDS_CHARS: SceneCharacterSet = {
  setting: 'children playing at a sunny park',
  background: 'Park background with green grass, trees, blue sky.',
  characters: [
    { gridPosition: 'top-left',     zoneId: 'zone_tl', clothing: 'wearing a red shirt',     activity: 'flying a yellow kite' },
    { gridPosition: 'top-middle',   zoneId: 'zone_tm', clothing: 'wearing a blue dress',    activity: 'reading a book' },
    { gridPosition: 'top-right',    zoneId: 'zone_tr', clothing: 'wearing a green hat',     activity: 'kicking a soccer ball' },
    { gridPosition: 'bottom-left',  zoneId: 'zone_bl', clothing: 'wearing a yellow t-shirt', activity: 'riding a bicycle' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink sweater', activity: 'eating an ice cream' },
    { gridPosition: 'bottom-right', zoneId: 'zone_br', clothing: 'wearing an orange shirt', activity: 'drawing with crayons' },
  ],
};

export const BEACH_FAMILY_CHARS: SceneCharacterSet = {
  setting: 'a family enjoying a sunny day at the beach',
  background: 'Beach background with yellow sand, blue sea, sunny sky.',
  characters: [
    { gridPosition: 'top-left',     zoneId: 'zone_tl', clothing: 'wearing a red swimsuit',  activity: 'building a sandcastle' },
    { gridPosition: 'top-middle',   zoneId: 'zone_tm', clothing: 'wearing a blue sun hat',   activity: 'reading on a towel' },
    { gridPosition: 'top-right',    zoneId: 'zone_tr', clothing: 'wearing green swim shorts', activity: 'flying a kite' },
    { gridPosition: 'bottom-left',  zoneId: 'zone_bl', clothing: 'wearing a yellow swimsuit', activity: 'collecting seashells' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink swim cap', activity: 'swimming in the sea' },
    { gridPosition: 'bottom-right', zoneId: 'zone_br', clothing: 'holding an orange umbrella', activity: 'eating an ice cream' },
  ],
};

export const CLASSROOM_CHARS: SceneCharacterSet = {
  setting: 'children in a school classroom',
  background: 'Classroom with yellow walls, green blackboard, wooden desks.',
  characters: [
    { gridPosition: 'top-left',     zoneId: 'zone_tl', clothing: 'with grey hair in a red shirt',   activity: 'writing on the blackboard' },
    { gridPosition: 'top-middle',   zoneId: 'zone_tm', clothing: 'with blonde hair in a green shirt', activity: 'reading a textbook' },
    { gridPosition: 'top-right',    zoneId: 'zone_tr', clothing: 'with brown hair in a purple shirt', activity: 'raising her hand' },
    { gridPosition: 'bottom-left',  zoneId: 'zone_bl', clothing: 'wearing glasses and a yellow shirt', activity: 'drawing in a notebook' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'with curly hair in a pink shirt',  activity: 'using a tablet' },
    { gridPosition: 'bottom-right', zoneId: 'zone_br', clothing: 'with black hair in a blue shirt',   activity: 'eating a sandwich' },
  ],
};

export const PLAYGROUND_CHARS: SceneCharacterSet = {
  setting: 'children playing at a school playground',
  background: 'Playground with green grass, blue sky, slide and swings in background.',
  characters: [
    { gridPosition: 'top-left',     zoneId: 'zone_tl', clothing: 'wearing a red jumper',    activity: 'going down a slide' },
    { gridPosition: 'top-middle',   zoneId: 'zone_tm', clothing: 'wearing a blue cap',      activity: 'swinging on a swing' },
    { gridPosition: 'top-right',    zoneId: 'zone_tr', clothing: 'wearing a green jacket',  activity: 'climbing a ladder' },
    { gridPosition: 'bottom-left',  zoneId: 'zone_bl', clothing: 'wearing a yellow dress',  activity: 'jumping rope' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing pink shoes',     activity: 'playing hopscotch' },
    { gridPosition: 'bottom-right', zoneId: 'zone_br', clothing: 'wearing a purple shirt',  activity: 'kicking a soccer ball' },
  ],
};

export const KITCHEN_BAKING_CHARS: SceneCharacterSet = {
  setting: 'a family baking together in the kitchen',
  background: 'Kitchen with white cabinets, a stove, and a big mixing bowl on the counter.',
  characters: [
    { gridPosition: 'top-left',     zoneId: 'zone_tl', clothing: 'with red hair in a striped apron', activity: 'cracking an egg' },
    { gridPosition: 'top-middle',   zoneId: 'zone_tm', clothing: 'with blonde hair and a chef hat',  activity: 'pouring flour' },
    { gridPosition: 'top-right',    zoneId: 'zone_tr', clothing: 'with black hair in a green apron', activity: 'stirring with a wooden spoon' },
    { gridPosition: 'bottom-left',  zoneId: 'zone_bl', clothing: 'with curly hair in a yellow shirt', activity: 'cutting cookies with a cookie cutter' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'with brown braids in a pink dress', activity: 'decorating cupcakes' },
    { gridPosition: 'bottom-right', zoneId: 'zone_br', clothing: 'wearing a blue chef hat',           activity: 'holding a tray of cookies' },
  ],
};

export const BIRTHDAY_PARTY_CHARS: SceneCharacterSet = {
  setting: 'children at a birthday party around a big cake',
  background: 'Birthday party with a big cake, colorful balloons floating, presents on the floor.',
  characters: [
    { gridPosition: 'top-left',     zoneId: 'zone_tl', clothing: 'wearing a red party hat',     activity: 'blowing out candles' },
    { gridPosition: 'top-middle',   zoneId: 'zone_tm', clothing: 'wearing a blue dress',         activity: 'holding a balloon' },
    { gridPosition: 'top-right',    zoneId: 'zone_tr', clothing: 'wearing a green bow tie',      activity: 'opening a present' },
    { gridPosition: 'bottom-left',  zoneId: 'zone_bl', clothing: 'wearing a yellow ribbon',      activity: 'eating a slice of cake' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink hair bow',     activity: 'drinking juice' },
    { gridPosition: 'bottom-right', zoneId: 'zone_br', clothing: 'wearing a purple t-shirt',     activity: 'playing with a party horn' },
  ],
};

/** Lookup by sceneId. */
export const DRAG_SCENE_CHARS: Record<string, SceneCharacterSet> = {
  park_kids: PARK_KIDS_CHARS,
  beach_family: BEACH_FAMILY_CHARS,
  classroom: CLASSROOM_CHARS,
  playground: PLAYGROUND_CHARS,
  kitchen_baking: KITCHEN_BAKING_CHARS,
  birthday_party: BIRTHDAY_PARTY_CHARS,
};
