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

  // Sprint D-18 (audio polish): scene-setting opener + varied sentence frames.
  // Replaces the old monotonous "{Name} is wearing X and is Ying." x5 template
  // which read robotically. Each line still gives TWO identification cues
  // (clothing + activity) so a child can match even if the AI image rendered
  // one trait imperfectly. "the one ..." stays age/gender-neutral (some scenes
  // have adults). Frames rotate to break the repetition.
  const frames: ((clo: string, act: string, name: string) => string)[] = [
    (clo, act, name) => `The one ${clo} is ${act}. That is ${name}.`,
    (clo, act, name) => `Can you see the one ${act}? That one is ${clo}. Write ${name}.`,
    (clo, act, name) => `Now find the one ${clo}. That one is ${act}. That is ${name}.`,
  ];

  const lines: string[] = [
    `Look at the picture of ${scene.setting}. Listen and look. There is one example.`,
    `Can you see the one ${exampleChar.clothing}? That one is ${exampleChar.activity}. That is ${exampleName}. Can you see ${exampleName}?`,
    `Now you listen and write the names.`,
  ];
  others.forEach((c, i) => {
    const name = nameForZone[c.zoneId]!;
    lines.push(frames[i % frames.length](c.clothing, c.activity, name));
  });
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

// ─── Starters L1-L20 per-level character sets ──────────────────────────
// Each level has its OWN scene with unique characters + activities.
// Scene image generation (Flux) is admin-triggered: until generated, the
// extension shows a "Hình chưa được tạo" warning placeholder.

/** L1 Pet shop — kids choosing pets. */
export const STARTERS_L1_CHARS: SceneCharacterSet = {
  setting: 'kids visiting a friendly pet shop',
  background: 'Pet shop interior with cages, fish tank, plants on shelves.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red shirt',    activity: 'holding a black cat' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue dress',   activity: 'looking at a fish tank' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green hat',    activity: 'feeding a yellow bird' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow t-shirt', activity: 'petting a brown rabbit' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink sweater', activity: 'walking a small dog' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing orange shorts',  activity: 'choosing a turtle' },
  ],
};

/** L2 Family dinner — family at the dining table. */
export const STARTERS_L2_CHARS: SceneCharacterSet = {
  setting: 'a family enjoying dinner together',
  background: 'Cozy dining room with wooden table, lamp, family pictures on the wall.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red apron',     activity: 'serving chicken' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue shirt',    activity: 'drinking milk' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green sweater', activity: 'cutting bread' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow dress',  activity: 'eating rice' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink hat',      activity: 'pouring juice' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange shirt', activity: 'feeding a baby brother' },
  ],
};

/** L3 Weekend park — playful afternoon outside. */
export const STARTERS_L3_CHARS: SceneCharacterSet = {
  setting: 'a busy park on a sunny weekend',
  background: 'Green park with paths, benches, a small pond, flowers.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red cap',       activity: 'running with a kite' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue jacket',   activity: 'walking a small dog' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green scarf',   activity: 'feeding ducks' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow t-shirt', activity: 'riding a scooter' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink coat',     activity: 'eating an apple' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing orange shorts',   activity: 'sitting on a bench' },
  ],
};

/** L4 Birthday party — kids celebrating. */
export const STARTERS_L4_CHARS: SceneCharacterSet = {
  setting: "a happy birthday party for Lily who is seven",
  background: 'Decorated room with balloons, streamers, a big birthday cake on a table.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red party hat', activity: 'blowing out candles' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue dress',    activity: 'holding a present' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green bow tie', activity: 'eating chocolate cake' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow shirt',  activity: 'drinking juice' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink skirt',    activity: 'playing with balloons' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing orange overalls', activity: 'singing happy birthday' },
  ],
};

/** L5 School day — kids in classroom. */
export const STARTERS_L5_CHARS: SceneCharacterSet = {
  setting: 'children at school in a bright classroom',
  background: 'Classroom with desks, a green board, books on shelves, alphabet poster on the wall.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red uniform',   activity: 'reading a book' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue cardigan', activity: 'drawing a picture' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green tie',     activity: 'writing on paper' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow shirt',  activity: 'opening a pencil case' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink ribbon',   activity: 'raising her hand' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing orange shoes',    activity: 'carrying a school bag' },
  ],
};

/** L6 Beach holiday — family at the beach. */
export const STARTERS_L6_CHARS: SceneCharacterSet = {
  setting: 'a family on a sunny beach holiday',
  background: 'Beach with golden sand, blue sea, umbrellas, seagulls, a sandcastle.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red swimsuit',   activity: 'building a sandcastle' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue sun hat',   activity: 'collecting seashells' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing green swim shorts', activity: 'flying a kite' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow towel',   activity: 'reading a book' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink swim cap',  activity: 'swimming in shallow water' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'holding an orange ball',   activity: 'playing volleyball' },
  ],
};

/** L7 Garden flowers — kids in a flower garden. */
export const STARTERS_L7_CHARS: SceneCharacterSet = {
  setting: 'children helping in a colorful flower garden',
  background: 'Garden with flower beds, tree, watering can, butterflies.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing red gloves',      activity: 'watering red roses' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue apron',    activity: 'planting yellow tulips' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green hat',     activity: 'picking white daisies' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow dress',  activity: 'holding a watering can' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing pink boots',      activity: 'looking at a butterfly' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing orange overalls', activity: 'pulling a small wagon' },
  ],
};

/** L8 Toy shop — kids browsing toys. */
export const STARTERS_L8_CHARS: SceneCharacterSet = {
  setting: 'children visiting a toy shop',
  background: 'Toy shop with colorful shelves of toys, balloons hanging from the ceiling.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red sweater',   activity: 'holding a teddy bear' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue t-shirt',  activity: 'looking at toy cars' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green cap',     activity: 'choosing a doll' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow scarf',  activity: 'playing with blocks' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing pink pyjamas',    activity: 'pushing a stroller' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing orange trousers', activity: 'flying a toy plane' },
  ],
};

/** L9 Sports day — school sports event. */
export const STARTERS_L9_CHARS: SceneCharacterSet = {
  setting: 'children competing on school sports day',
  background: 'Sports field with running track, flags, finish line, blue sky.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red running shirt', activity: 'running fast on the track' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing blue shorts',    activity: 'jumping over a hurdle' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green tracksuit', activity: 'throwing a small ball' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing yellow trainers', activity: 'holding a trophy' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink headband', activity: 'cheering with pom-poms' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing orange shoes',   activity: 'drinking from a water bottle' },
  ],
};

/** L10 Picnic park — picnic celebration. */
export const STARTERS_L10_CHARS: SceneCharacterSet = {
  setting: "a picnic for Mia's birthday in a green park",
  background: 'Park with picnic blanket, basket, trees, a small dog watching.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red sun hat',  activity: 'spreading a picnic blanket' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue dress',   activity: 'opening a picnic basket' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green shirt',  activity: 'pouring lemonade' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing yellow sandals', activity: 'eating a sandwich' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink ribbon',  activity: 'cutting a fruit cake' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing orange shorts',  activity: 'playing with a small dog' },
  ],
};

/** L11 Library — children at the library. */
export const STARTERS_L11_CHARS: SceneCharacterSet = {
  setting: 'children visiting the library on a quiet afternoon',
  background: 'Library with tall bookshelves, reading tables, lamps, big windows.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red cardigan', activity: 'reading a thick book' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue shirt',   activity: 'choosing books from a shelf' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green vest',   activity: 'sitting on a beanbag with a comic' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow scarf', activity: 'borrowing books at the desk' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing pink glasses',   activity: 'writing in a notebook' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing orange shoes',   activity: 'pushing a book cart' },
  ],
};

/** L12 Bicycle ride — kids on bikes. */
export const STARTERS_L12_CHARS: SceneCharacterSet = {
  setting: 'children riding bicycles in the park',
  background: 'Park bike path with trees, benches, a small pond on one side.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red helmet',   activity: 'riding a red bicycle' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue jacket',  activity: 'riding a blue scooter' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green t-shirt', activity: 'fixing a bike chain' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing yellow shorts',  activity: 'ringing a bicycle bell' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink hoodie',  activity: 'cycling with a basket' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing orange trainers', activity: 'pushing a small bike' },
  ],
};

/** L13 Cooking — kids helping in the kitchen. */
export const STARTERS_L13_CHARS: SceneCharacterSet = {
  setting: 'children baking a lemon cake with mum',
  background: 'Bright kitchen with bowls, flour, eggs, a wooden table, oven.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red apron',    activity: 'mixing the cake batter' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue chef hat', activity: 'cracking an egg' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green shirt',  activity: 'measuring flour' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow apron', activity: 'squeezing a lemon' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing pink oven mitts', activity: 'putting the cake in the oven' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing orange overalls', activity: 'licking a spoon' },
  ],
};

/** L14 Swimming pool — kids swimming. */
export const STARTERS_L14_CHARS: SceneCharacterSet = {
  setting: 'children at a swimming lesson',
  background: 'Indoor pool with blue water, swim lanes, lifebuoy on the wall.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red swim cap',  activity: 'jumping into the pool' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing blue goggles',    activity: 'swimming with a float' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing green flippers',  activity: 'kicking water' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow swimsuit', activity: 'sitting on the pool edge' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink towel',    activity: 'drying off with a towel' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing orange armbands', activity: 'learning to float' },
  ],
};

/** L15 Farm visit — school trip to a farm. */
export const STARTERS_L15_CHARS: SceneCharacterSet = {
  setting: "children visiting Tim's farm",
  background: 'Farm with red barn, fields, animals grazing, a tractor.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red jumper',   activity: 'feeding a brown cow' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing blue overalls',  activity: 'patting a small sheep' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green farm hat', activity: 'carrying a basket of eggs' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing yellow wellies', activity: 'feeding a pig' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink scarf',   activity: 'watching chickens' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing orange gloves',  activity: 'milking a cow' },
  ],
};

/** L16 Pets at home — Lily's pets. */
export const STARTERS_L16_CHARS: SceneCharacterSet = {
  setting: "kids at Lily's house with her pets",
  background: 'Living room with sofa, pet bowls, fish tank on a stand, cat tree.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red shirt',     activity: 'feeding a cat called Pip' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue jumper',   activity: 'walking the dog Bob' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green dress',   activity: 'watching fish in a bowl' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow hoodie', activity: 'brushing a small rabbit' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink ribbon',   activity: 'cleaning the fish tank' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing orange slippers', activity: 'filling a pet bowl' },
  ],
};

/** L17 Sleepover — girls at Eve's. */
export const STARTERS_L17_CHARS: SceneCharacterSet = {
  setting: "girls having a sleepover at Eve's house",
  background: 'Bedroom with two beds, pink curtains, pillows, books on the floor.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing red pyjamas',    activity: 'reading a bedtime story' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing blue pyjamas',   activity: 'eating popcorn' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green nightie', activity: 'holding a teddy bear' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing yellow socks',   activity: 'brushing her teeth' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing pink slippers',  activity: 'watching a movie' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange robe', activity: 'arranging pillows' },
  ],
};

/** L18 Garden play — game in the garden. */
export const STARTERS_L18_CHARS: SceneCharacterSet = {
  setting: 'children playing tag in the garden',
  background: 'Sunny garden with grass, flower beds, swing, picnic table.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red t-shirt',  activity: 'chasing a friend' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing blue shorts',    activity: 'hiding behind a tree' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green cap',    activity: 'jumping on a swing' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing yellow trainers', activity: 'rolling on the grass' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink dress',   activity: 'counting to ten' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing orange overalls', activity: 'pointing at the winner' },
  ],
};

/** L19 Train ride — family travelling. */
export const STARTERS_L19_CHARS: SceneCharacterSet = {
  setting: 'a family travelling on a train to grandma',
  background: 'Train carriage interior with seats, window showing countryside, luggage rack.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red coat',     activity: 'putting bags on the rack' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue scarf',   activity: 'looking out the window' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green jumper', activity: 'reading a magazine' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow hat',   activity: 'eating a sandwich' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing pink mittens',   activity: 'holding a train ticket' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing orange boots',   activity: 'sleeping with a teddy' },
  ],
};

/** L20 Snow day — winter snow play. */
export const STARTERS_L20_CHARS: SceneCharacterSet = {
  setting: 'children playing in fresh snow on a winter day',
  background: 'Snowy park with bare trees, snowman, snow-covered houses in the distance.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red winter coat', activity: 'building a snowman' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue beanie',   activity: 'throwing a snowball' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing green mittens',   activity: 'pulling a sled' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow scarf',  activity: 'making a snow angel' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink ski jacket', activity: 'skating on ice' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing orange snow boots', activity: 'sipping hot chocolate' },
  ],
};

/**
 * Per-level Starters character sets (L1-L20). Each level has its own
 * scene image (gen via admin "Generate scene" button when budget allows).
 * Lookup pattern: `STARTERS_CHARS_BY_LEVEL[levelNumber]`
 */
export const STARTERS_CHARS_BY_LEVEL: Record<number, SceneCharacterSet> = {
  1: STARTERS_L1_CHARS,
  2: STARTERS_L2_CHARS,
  3: STARTERS_L3_CHARS,
  4: STARTERS_L4_CHARS,
  5: STARTERS_L5_CHARS,
  6: STARTERS_L6_CHARS,
  7: STARTERS_L7_CHARS,
  8: STARTERS_L8_CHARS,
  9: STARTERS_L9_CHARS,
  10: STARTERS_L10_CHARS,
  11: STARTERS_L11_CHARS,
  12: STARTERS_L12_CHARS,
  13: STARTERS_L13_CHARS,
  14: STARTERS_L14_CHARS,
  15: STARTERS_L15_CHARS,
  16: STARTERS_L16_CHARS,
  17: STARTERS_L17_CHARS,
  18: STARTERS_L18_CHARS,
  19: STARTERS_L19_CHARS,
  20: STARTERS_L20_CHARS,
};

/**
 * Per-level scene IDs for Starters L1-L20.
 * sceneId = unique key for R2 cache lookup. If the scene hasn't been
 * generated yet, the worker returns 404 and the client shows a warning
 * banner "Hình chưa được tạo cho bài thi này".
 */
export const STARTERS_SCENE_IDS_BY_LEVEL: Record<number, string> = {
  1: 'starter_l1_petshop',
  2: 'starter_l2_family_dinner',
  3: 'starter_l3_weekend_park',
  4: 'starter_l4_birthday',
  5: 'starter_l5_school',
  6: 'starter_l6_beach',
  7: 'starter_l7_garden',
  8: 'starter_l8_toyshop',
  9: 'starter_l9_sports',
  10: 'starter_l10_picnic',
  11: 'starter_l11_library',
  12: 'starter_l12_bicycle',
  13: 'starter_l13_cooking',
  14: 'starter_l14_swimming',
  15: 'starter_l15_farm',
  16: 'starter_l16_pets_home',
  17: 'starter_l17_sleepover',
  18: 'starter_l18_garden_play',
  19: 'starter_l19_train',
  20: 'starter_l20_snow',
};

// ─── D-18 Phase 3: Movers L21-L30 per-level character sets ─────────────
// Movers (A1-A2). Same 3×2 drag structure as Starters but richer activity
// vocabulary (sports, music, transport, animals) and contexts suited to
// 8-10 year-olds. Each level has its OWN scene + unique characters.

/** L21 Summer camp — children at an outdoor camp. */
export const MOVERS_L21_CHARS: SceneCharacterSet = {
  setting: 'children having fun at a summer camp by the lake',
  background: 'Campsite with tents, a lake, tall pine trees, a campfire.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red cap',        activity: 'putting up a tent' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue life jacket', activity: 'paddling a canoe' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green backpack',  activity: 'reading a map' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow raincoat', activity: 'toasting marshmallows' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing pink shorts',       activity: 'fishing by the lake' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange hat',     activity: 'climbing a rope wall' },
  ],
};

/** L22 Music lesson — children playing instruments. */
export const MOVERS_L22_CHARS: SceneCharacterSet = {
  setting: 'children in a music lesson with their teacher',
  background: 'Music room with a piano, music stands, posters of notes on the wall.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red bow tie',    activity: 'playing the piano' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue waistcoat', activity: 'playing a guitar' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green shirt',    activity: 'banging a drum' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow dress',   activity: 'playing a violin' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink jumper',    activity: 'blowing a trumpet' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange scarf',  activity: 'singing into a microphone' },
  ],
};

/** L23 Football match — children playing a match. */
export const MOVERS_L23_CHARS: SceneCharacterSet = {
  setting: 'children playing a football match on a sunny field',
  background: 'Football pitch with green grass, a goal net, white lines, a crowd.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red football kit', activity: 'kicking the ball' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing green goalkeeper gloves', activity: 'saving a goal' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a blue kit',        activity: 'running with the ball' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow referee shirt', activity: 'blowing a whistle' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink headband',   activity: 'holding a trophy' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange scarf',   activity: 'cheering in the crowd' },
  ],
};

/** L24 Dance class — children dancing. */
export const MOVERS_L24_CHARS: SceneCharacterSet = {
  setting: 'children practising in a dance class',
  background: 'Dance studio with a big mirror, a wooden barre, bright wooden floor.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red leotard',    activity: 'spinning on her toes' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue tracksuit', activity: 'doing a street dance move' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green tutu',     activity: 'jumping in the air' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing yellow ballet shoes', activity: 'stretching at the barre' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink ribbon',    activity: 'waving a dance ribbon' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange t-shirt', activity: 'clapping to the music' },
  ],
};

/** L25 Restaurant — family eating out. */
export const MOVERS_L25_CHARS: SceneCharacterSet = {
  setting: 'a family enjoying a meal at a busy restaurant',
  background: 'Restaurant with round tables, a waiter, plants, a kitchen at the back.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red apron',      activity: 'carrying a tray of food' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue shirt',     activity: 'eating a pizza' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green jumper',   activity: 'drinking orange juice' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow dress',   activity: 'reading the menu' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink cardigan',  activity: 'eating a bowl of soup' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange tie',    activity: 'cutting a slice of cake' },
  ],
};

/** L26 Bus journey — passengers on a bus. */
export const MOVERS_L26_CHARS: SceneCharacterSet = {
  setting: 'children and their families travelling on a city bus',
  background: 'Bus interior with seats, windows showing the city, a driver at the front.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red driver cap', activity: 'driving the bus' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue coat',      activity: 'showing a bus ticket' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green hat',      activity: 'looking out of the window' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow scarf',   activity: 'holding a suitcase' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink backpack',  activity: 'reading a city map' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing orange headphones', activity: 'listening to music' },
  ],
};

/** L27 Zoo trip — children visiting the zoo. */
export const MOVERS_L27_CHARS: SceneCharacterSet = {
  setting: 'a school group visiting the zoo on a sunny day',
  background: 'Zoo with animal enclosures, leafy trees, a path, signposts.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red sun hat',    activity: 'watching a lion' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue t-shirt',   activity: 'feeding a giraffe' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing green shorts',     activity: 'photographing a monkey' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow cap',     activity: 'pointing at an elephant' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink jacket',    activity: 'looking at the penguins' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange backpack', activity: 'buying an ice cream' },
  ],
};

/** L28 Museum tour — children on a museum visit. */
export const MOVERS_L28_CHARS: SceneCharacterSet = {
  setting: 'children on a guided tour of a history museum',
  background: 'Museum hall with a dinosaur skeleton, paintings, glass cases, a statue.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red jumper',     activity: 'looking at a dinosaur skeleton' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue cardigan',  activity: 'studying a painting' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green shirt',    activity: 'taking notes on a clipboard' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow vest',    activity: 'pointing at an old statue' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink scarf',     activity: 'reading an information sign' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing orange glasses',   activity: 'looking in a glass case' },
  ],
};

/** L29 Fire station — children visiting firefighters. */
export const MOVERS_L29_CHARS: SceneCharacterSet = {
  setting: 'children visiting a busy fire station',
  background: 'Fire station with a red fire engine, a tall ladder, hoses, a sliding pole.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red fire helmet', activity: 'holding a fire hose' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue uniform',   activity: 'sitting in the fire engine' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing green boots',      activity: 'climbing the long ladder' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow jacket',  activity: 'polishing the fire engine' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink shirt',     activity: 'sliding down the pole' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing orange gloves',    activity: 'rolling up a hose' },
  ],
};

/** L30 Pet competition — children showing their pets. */
export const MOVERS_L30_CHARS: SceneCharacterSet = {
  setting: 'children showing their pets at a pet competition',
  background: 'Show ring with a judging table, rosettes, a banner, a row of pet baskets.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red rosette',    activity: 'holding a fluffy cat' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue cap',       activity: 'walking a spotty dog' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green jumper',   activity: 'showing a white rabbit' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow shirt',   activity: 'carrying a bird cage' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink dress',     activity: 'holding a goldfish bowl' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange judge badge', activity: 'giving out a gold trophy' },
  ],
};

// ─── D-18 Phase 3b: Movers L31-L40 per-level character sets ────────────

/** L31 Tree planting — children planting trees on a green day. */
export const MOVERS_L31_CHARS: SceneCharacterSet = {
  setting: 'children planting trees on a sunny green day',
  background: 'Open field with young trees, soil, a wheelbarrow, blue sky.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing red gloves',     activity: 'digging a hole with a spade' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue cap',      activity: 'planting a small tree' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green apron',   activity: 'watering a plant' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing yellow boots',    activity: 'pushing a wheelbarrow' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink hat',      activity: 'carrying a flowerpot' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange shirt', activity: 'raking the soil' },
  ],
};

/** L32 Cinema visit — children at the cinema. */
export const MOVERS_L32_CHARS: SceneCharacterSet = {
  setting: 'children watching a film at the cinema',
  background: 'Cinema with a big screen, rows of red seats, dim lights.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red jumper',    activity: 'holding a box of popcorn' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing blue 3D glasses',  activity: 'watching the screen' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green t-shirt',  activity: 'drinking a fizzy drink' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow scarf',   activity: 'showing a cinema ticket' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink dress',     activity: 'eating sweets' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange cap',    activity: 'finding a seat' },
  ],
};

/** L33 Bakery shopping — children at the bakery. */
export const MOVERS_L33_CHARS: SceneCharacterSet = {
  setting: 'children buying treats at a busy bakery',
  background: 'Bakery with shelves of bread, a glass counter, a baker, an oven.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red apron',     activity: 'baking a loaf of bread' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue coat',     activity: 'choosing a cupcake' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green jumper',  activity: 'holding a croissant' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow hat',    activity: 'paying for a pie' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink scarf',    activity: 'eating a cookie' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange shirt', activity: 'carrying a cake box' },
  ],
};

/** L34 Fishing trip — family fishing by a river. */
export const MOVERS_L34_CHARS: SceneCharacterSet = {
  setting: 'a family on a fishing trip by the river',
  background: 'River bank with reeds, a small wooden boat, green hills.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red life jacket', activity: 'holding a fishing rod' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue hat',        activity: 'catching a big fish' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing green boots',       activity: 'rowing the boat' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow raincoat', activity: 'filling a bucket with fish' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink scarf',      activity: 'putting a worm on a hook' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange cap',     activity: 'holding a fishing net' },
  ],
};

/** L35 Garage sale — neighbours at a garage sale. */
export const MOVERS_L35_CHARS: SceneCharacterSet = {
  setting: 'children and neighbours at a busy garage sale',
  background: 'Driveway with tables of old toys, books, a lamp, price tags.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red shirt',     activity: 'selling an old lamp' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue cardigan', activity: 'looking at old books' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green cap',     activity: 'buying a toy' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow dress',  activity: 'sticking on price tags' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink jumper',   activity: 'carrying a cardboard box' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange scarf', activity: 'sitting on an old chair' },
  ],
};

/** L36 Hospital visit — children visiting a hospital. */
export const MOVERS_L36_CHARS: SceneCharacterSet = {
  setting: 'children visiting a friendly hospital ward',
  background: 'Hospital ward with beds, a window, medicine trolley, get-well cards.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a white doctor coat', activity: 'checking a chart' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue nurse uniform', activity: 'giving some medicine' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green jumper',   activity: 'lying in a hospital bed' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow shirt',   activity: 'holding some flowers' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink cardigan',  activity: 'reading a get-well card' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange cap',    activity: 'putting on a bandage' },
  ],
};

/** L37 Post office — children at the post office. */
export const MOVERS_L37_CHARS: SceneCharacterSet = {
  setting: 'children posting letters at the post office',
  background: 'Post office with a counter, a red postbox, shelves of parcels, scales.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red uniform',   activity: 'weighing a parcel' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue coat',     activity: 'posting a letter' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green jumper',  activity: 'buying a stamp' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow scarf',  activity: 'carrying a big parcel' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink hat',      activity: 'writing an address' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange shirt', activity: 'sticking on a stamp' },
  ],
};

/** L38 Camping in the mountains — children on a mountain camp. */
export const MOVERS_L38_CHARS: SceneCharacterSet = {
  setting: 'children camping high in the mountains',
  background: 'Mountain campsite with tents, tall peaks, pine trees, a winding path.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red anorak',    activity: 'putting up a tent' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue backpack',  activity: 'reading a compass' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing green walking boots', activity: 'climbing the mountain' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow scarf',  activity: 'looking through binoculars' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink woolly hat', activity: 'lighting a campfire' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange jacket', activity: 'unrolling a map' },
  ],
};

/** L39 Art exhibition — children at an art gallery. */
export const MOVERS_L39_CHARS: SceneCharacterSet = {
  setting: 'children at a colourful art exhibition',
  background: 'Art gallery with framed paintings on white walls, an easel, a statue.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red smock',     activity: 'painting at an easel' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue beret',    activity: 'looking at a painting' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green jumper',  activity: 'holding a paintbrush' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow apron',  activity: 'mixing paint on a palette' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink scarf',    activity: 'admiring a statue' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange shirt', activity: 'hanging up a frame' },
  ],
};

/** L40 New baby — family welcoming a new baby. */
export const MOVERS_L40_CHARS: SceneCharacterSet = {
  setting: 'a family welcoming a new baby at home',
  background: 'Cosy living room with a cot, baby toys, a pram, balloons.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red cardigan',  activity: 'holding the new baby' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue jumper',   activity: 'rocking the cot' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green shirt',   activity: 'giving a baby bottle' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow dress',  activity: 'shaking a rattle' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink hat',      activity: 'pushing a pram' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange jumper', activity: 'folding a baby blanket' },
  ],
};

/** Per-level Movers character sets (L21-L40). */
export const MOVERS_CHARS_BY_LEVEL: Record<number, SceneCharacterSet> = {
  21: MOVERS_L21_CHARS,
  22: MOVERS_L22_CHARS,
  23: MOVERS_L23_CHARS,
  24: MOVERS_L24_CHARS,
  25: MOVERS_L25_CHARS,
  26: MOVERS_L26_CHARS,
  27: MOVERS_L27_CHARS,
  28: MOVERS_L28_CHARS,
  29: MOVERS_L29_CHARS,
  30: MOVERS_L30_CHARS,
  31: MOVERS_L31_CHARS,
  32: MOVERS_L32_CHARS,
  33: MOVERS_L33_CHARS,
  34: MOVERS_L34_CHARS,
  35: MOVERS_L35_CHARS,
  36: MOVERS_L36_CHARS,
  37: MOVERS_L37_CHARS,
  38: MOVERS_L38_CHARS,
  39: MOVERS_L39_CHARS,
  40: MOVERS_L40_CHARS,
};

/** Per-level scene IDs for Movers L21-L40 (R2 cache keys). */
export const MOVERS_SCENE_IDS_BY_LEVEL: Record<number, string> = {
  21: 'mover_l21_summer_camp',
  22: 'mover_l22_music_lesson',
  23: 'mover_l23_football_match',
  24: 'mover_l24_dance_class',
  25: 'mover_l25_restaurant',
  26: 'mover_l26_bus_journey',
  27: 'mover_l27_zoo_trip',
  28: 'mover_l28_museum_tour',
  29: 'mover_l29_fire_station',
  30: 'mover_l30_pet_competition',
  31: 'mover_l31_tree_planting',
  32: 'mover_l32_cinema_visit',
  33: 'mover_l33_bakery_shopping',
  34: 'mover_l34_fishing_trip',
  35: 'mover_l35_garage_sale',
  36: 'mover_l36_hospital_visit',
  37: 'mover_l37_post_office',
  38: 'mover_l38_camping_mountains',
  39: 'mover_l39_art_exhibition',
  40: 'mover_l40_new_baby',
};

// ─── D-18 Phase 4: Flyers L41-L50 per-level character sets ─────────────
// Flyers (A2-B1). Same 3×2 drag structure; richer/abstract activities.

/** L41 Science fair. */
export const FLYERS_L41_CHARS: SceneCharacterSet = {
  setting: 'students showing projects at a school science fair',
  background: 'School hall with science stalls, posters, a model volcano.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red lab coat',   activity: 'presenting an experiment' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing blue safety goggles', activity: 'mixing two chemicals' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green jumper',   activity: 'showing a model volcano' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow shirt',   activity: 'looking through a microscope' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink cardigan',  activity: 'holding a small robot' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange tie',    activity: 'measuring with a ruler' },
  ],
};

/** L42 Charity event. */
export const FLYERS_L42_CHARS: SceneCharacterSet = {
  setting: 'people raising money at a charity event',
  background: 'Charity fair with stalls, banners, balloons, a donation box.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red apron',      activity: 'selling homemade cakes' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue t-shirt',   activity: 'collecting coins in a box' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green vest',     activity: 'giving out balloons' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow dress',   activity: 'counting the money' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink shirt',     activity: 'painting a charity poster' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange cap',    activity: 'carrying a donation jar' },
  ],
};

/** L43 Volunteer animal shelter. */
export const FLYERS_L43_CHARS: SceneCharacterSet = {
  setting: 'volunteers helping at an animal shelter',
  background: 'Animal shelter with kennels, pet bowls, a play area.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red jumper',     activity: 'feeding a hungry dog' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue apron',     activity: 'washing a fluffy cat' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green shirt',    activity: 'walking a puppy' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow vest',    activity: 'filling the water bowls' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink cardigan',  activity: 'brushing a rabbit' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing orange gloves',    activity: 'cleaning a cage' },
  ],
};

/** L44 Food festival. */
export const FLYERS_L44_CHARS: SceneCharacterSet = {
  setting: 'people enjoying an outdoor food festival',
  background: 'Outdoor food festival with stalls, flags, picnic tables.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red apron',      activity: 'grilling burgers' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue shirt',     activity: 'selling fruit smoothies' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green hat',      activity: 'serving a bowl of noodles' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow dress',   activity: 'tasting some cheese' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink scarf',     activity: 'making a pizza' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange cap',    activity: 'holding an ice cream cone' },
  ],
};

/** L45 Eco project. */
export const FLYERS_L45_CHARS: SceneCharacterSet = {
  setting: 'students working on a green eco project',
  background: 'School garden with recycling bins, young trees, solar panels.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing red gloves',       activity: 'sorting the recycling' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue shirt',     activity: 'planting a young tree' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green vest',     activity: 'holding a solar panel' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing yellow boots',     activity: 'picking up litter' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink cap',       activity: 'watering the plants' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange jumper', activity: 'carrying a compost bin' },
  ],
};

/** L46 Space exhibition. */
export const FLYERS_L46_CHARS: SceneCharacterSet = {
  setting: 'children exploring a space exhibition',
  background: 'Space museum with a rocket model, hanging planets, a telescope.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red spacesuit',  activity: 'pointing at a rocket' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue jumper',    activity: 'looking through a telescope' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green t-shirt',  activity: 'holding a model planet' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow shirt',   activity: 'touching a moon rock' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink cardigan',  activity: 'reading a star map' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an astronaut helmet', activity: 'pressing a control button' },
  ],
};

/** L47 Cooking competition. */
export const FLYERS_L47_CHARS: SceneCharacterSet = {
  setting: 'young chefs in a cooking competition',
  background: 'Competition kitchen with workstations and a judges table.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red chef hat',   activity: 'whisking some eggs' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue apron',     activity: 'rolling out dough' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green shirt',    activity: 'decorating a cake' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow apron',   activity: 'chopping vegetables' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink hat',       activity: 'tasting the soup' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange scarf',  activity: 'presenting a dish to the judges' },
  ],
};

/** L48 Film making. */
export const FLYERS_L48_CHARS: SceneCharacterSet = {
  setting: 'a team making a short film on set',
  background: 'Film set with cameras, lights, a director\'s chair.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red cap',        activity: 'holding a clapperboard' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue jumper',    activity: 'filming with a camera' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green shirt',    activity: 'holding a microphone boom' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow vest',    activity: 'directing the actors' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink scarf',     activity: 'adjusting a big light' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange t-shirt', activity: 'reading the script' },
  ],
};

/** L49 Photography class. */
export const FLYERS_L49_CHARS: SceneCharacterSet = {
  setting: 'students learning in a photography class',
  background: 'Photography studio with cameras, tripods, framed photos.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red jumper',     activity: 'taking a photo with a camera' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue shirt',     activity: 'setting up a tripod' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green cap',      activity: 'looking at photos on a screen' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow vest',    activity: 'changing a camera lens' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink cardigan',  activity: 'framing a picture' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange scarf',  activity: 'printing a photo' },
  ],
};

/** L50 Mountain hiking. */
export const FLYERS_L50_CHARS: SceneCharacterSet = {
  setting: 'hikers on a long mountain trail',
  background: 'Mountain trail with peaks, a rope bridge, pine trees.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red anorak',     activity: 'climbing with a rope' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue backpack',  activity: 'reading a trail map' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing green boots',      activity: 'crossing a rope bridge' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow hat',     activity: 'looking through binoculars' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink scarf',     activity: 'drinking from a flask' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange jacket', activity: 'planting a flag at the top' },
  ],
};

// ─── D-18 Phase 4b: Flyers L51-L60 per-level character sets ────────────

/** L51 Sailing course. */
export const FLYERS_L51_CHARS: SceneCharacterSet = {
  setting: 'students learning to sail at a marina',
  background: 'Marina with sailboats, blue water, a wooden jetty.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red life jacket', activity: 'steering a small boat' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue cap',        activity: 'raising the sail' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green shirt',     activity: 'tying a rope knot' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow jacket',   activity: 'rowing with an oar' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink hat',        activity: 'checking a compass' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange vest',    activity: 'throwing a life ring' },
  ],
};

/** L52 Ancient museum. */
export const FLYERS_L52_CHARS: SceneCharacterSet = {
  setting: 'children touring an ancient history museum',
  background: 'Ancient museum with a mummy case, pottery, stone tablets.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red jumper',     activity: 'looking at a mummy' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue cardigan',  activity: 'studying an old pot' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green shirt',    activity: 'drawing a fossil' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow vest',    activity: 'reading a stone tablet' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink scarf',     activity: 'pointing at a gold mask' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing orange glasses',   activity: 'examining an old coin' },
  ],
};

/** L53 Drama festival. */
export const FLYERS_L53_CHARS: SceneCharacterSet = {
  setting: 'students performing at a drama festival',
  background: 'Theatre stage with red curtains, spotlights, an audience.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red costume',    activity: 'acting on the stage' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue cape',      activity: 'holding a drama mask' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green shirt',    activity: 'pulling the curtain' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow dress',   activity: 'singing into a microphone' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink tutu',      activity: 'dancing on stage' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange shirt',  activity: 'reading a script' },
  ],
};

/** L54 News reporter. */
export const FLYERS_L54_CHARS: SceneCharacterSet = {
  setting: 'a young news team in a TV studio',
  background: 'TV news studio with a desk, screens, a camera.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red blazer',     activity: 'reading the news' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue shirt',     activity: 'holding a microphone' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green jumper',   activity: 'filming with a camera' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow vest',    activity: 'typing on a laptop' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink scarf',     activity: 'pointing at a weather map' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange tie',    activity: 'writing in a notebook' },
  ],
};

/** L55 Job shadowing. */
export const FLYERS_L55_CHARS: SceneCharacterSet = {
  setting: 'students shadowing different jobs for a day',
  background: 'Split workplace scene — kitchen, clinic, garage, classroom.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red apron',      activity: 'baking with a chef' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue coat',      activity: 'helping a doctor' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing green overalls',   activity: 'fixing a car with a mechanic' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow helmet',  activity: 'building with a builder' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink shirt',     activity: 'teaching with a teacher' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange uniform', activity: 'serving with a waiter' },
  ],
};

/** L56 Time capsule. */
export const FLYERS_L56_CHARS: SceneCharacterSet = {
  setting: 'children burying a time capsule in the garden',
  background: 'Garden with a metal capsule box, a dug hole, a spade.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red jumper',     activity: 'writing a letter to the future' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue shirt',     activity: 'putting a toy in the box' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green cap',      activity: 'burying the capsule' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow dress',   activity: 'holding an old photo' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink scarf',     activity: 'sealing the lid' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing orange gloves',    activity: 'digging a hole' },
  ],
};

/** L57 Future career day. */
export const FLYERS_L57_CHARS: SceneCharacterSet = {
  setting: 'children dressing up as their future jobs',
  background: 'Classroom with a "My future job" board and drawings.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red astronaut suit', activity: 'pretending to be an astronaut' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue lab coat',  activity: 'pretending to be a scientist' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green apron',    activity: 'pretending to be a chef' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow helmet',  activity: 'pretending to be a firefighter' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink uniform',   activity: 'pretending to be a nurse' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange vest',   activity: 'pretending to be a pilot' },
  ],
};

/** L58 Pen pals. */
export const FLYERS_L58_CHARS: SceneCharacterSet = {
  setting: 'children writing to pen pals around the world',
  background: 'Desk with letters, postcards, a world map, stamps.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red jumper',     activity: 'writing a letter' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue shirt',     activity: 'reading a postcard' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green cardigan', activity: 'sticking on a stamp' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow scarf',   activity: 'opening an envelope' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink hat',       activity: 'finding a country on a map' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange shirt',  activity: 'posting a parcel' },
  ],
};

/** L59 School olympics. */
export const FLYERS_L59_CHARS: SceneCharacterSet = {
  setting: 'students competing at the school olympics',
  background: 'Sports stadium with a running track, flags, a podium.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red kit',        activity: 'running a race' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing blue shorts',      activity: 'jumping over a high bar' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green vest',     activity: 'throwing a javelin' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow shirt',   activity: 'winning a gold medal' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink headband',  activity: 'cheering for the team' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange shirt',  activity: 'carrying the olympic torch' },
  ],
};

/** L60 Graduation. */
export const FLYERS_L60_CHARS: SceneCharacterSet = {
  setting: 'students celebrating their graduation day',
  background: 'School hall with a stage, banners, balloons, a podium.',
  characters: [
    { gridPosition: 'top-left',      zoneId: 'zone_tl', clothing: 'wearing a red gown',       activity: 'wearing a graduation cap' },
    { gridPosition: 'top-middle',    zoneId: 'zone_tm', clothing: 'wearing a blue gown',      activity: 'holding a diploma' },
    { gridPosition: 'top-right',     zoneId: 'zone_tr', clothing: 'wearing a green gown',     activity: 'throwing a cap in the air' },
    { gridPosition: 'bottom-left',   zoneId: 'zone_bl', clothing: 'wearing a yellow dress',   activity: 'carrying flowers' },
    { gridPosition: 'bottom-middle', zoneId: 'zone_bm', clothing: 'wearing a pink scarf',     activity: 'taking a photo' },
    { gridPosition: 'bottom-right',  zoneId: 'zone_br', clothing: 'wearing an orange tie',    activity: 'shaking hands with the teacher' },
  ],
};

/** Per-level Flyers character sets (L41-L60). */
export const FLYERS_CHARS_BY_LEVEL: Record<number, SceneCharacterSet> = {
  41: FLYERS_L41_CHARS,
  42: FLYERS_L42_CHARS,
  43: FLYERS_L43_CHARS,
  44: FLYERS_L44_CHARS,
  45: FLYERS_L45_CHARS,
  46: FLYERS_L46_CHARS,
  47: FLYERS_L47_CHARS,
  48: FLYERS_L48_CHARS,
  49: FLYERS_L49_CHARS,
  50: FLYERS_L50_CHARS,
  51: FLYERS_L51_CHARS,
  52: FLYERS_L52_CHARS,
  53: FLYERS_L53_CHARS,
  54: FLYERS_L54_CHARS,
  55: FLYERS_L55_CHARS,
  56: FLYERS_L56_CHARS,
  57: FLYERS_L57_CHARS,
  58: FLYERS_L58_CHARS,
  59: FLYERS_L59_CHARS,
  60: FLYERS_L60_CHARS,
};

/** Per-level scene IDs for Flyers L41-L60 (R2 cache keys). */
export const FLYERS_SCENE_IDS_BY_LEVEL: Record<number, string> = {
  41: 'flyer_l41_science_fair',
  42: 'flyer_l42_charity_event',
  43: 'flyer_l43_volunteer_shelter',
  44: 'flyer_l44_food_festival',
  45: 'flyer_l45_eco_project',
  46: 'flyer_l46_space_exhibition',
  47: 'flyer_l47_cooking_competition',
  48: 'flyer_l48_film_making',
  49: 'flyer_l49_photography_class',
  50: 'flyer_l50_mountain_hiking',
  51: 'flyer_l51_sailing_course',
  52: 'flyer_l52_ancient_museum',
  53: 'flyer_l53_drama_festival',
  54: 'flyer_l54_news_reporter',
  55: 'flyer_l55_job_shadowing',
  56: 'flyer_l56_time_capsule',
  57: 'flyer_l57_future_career',
  58: 'flyer_l58_pen_pals',
  59: 'flyer_l59_school_olympics',
  60: 'flyer_l60_graduation',
};
