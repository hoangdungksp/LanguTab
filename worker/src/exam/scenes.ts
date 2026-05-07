/**
 * Scene prompt registry for AI-generated exam illustrations.
 *
 * Every scene used by `levels.ts` must have a prompt here. The prompt is
 * fed to `@cf/black-forest-labs/flux-1-schnell` to generate a 1024×1024
 * JPEG illustration, then cached in R2 forever.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Prompt design principles (Cambridge YLE Listening style)
 * ─────────────────────────────────────────────────────────────────────────
 *
 * 1. **Cartoon/flat illustration style** — not photorealistic. Soft shapes,
 *    bright colors, thick outlines work best for kid-level content and read
 *    well at small thumbnail sizes.
 *
 * 2. **White or simple background** — drop zones overlay the scene, so a
 *    busy background hurts readability. "white background" or "soft pastel
 *    background" usually works.
 *
 * 3. **Distinct characters** — for drag-name scenes, each character must
 *    have a UNIQUE feature the audio script can describe (red shirt vs blue
 *    dress, glasses vs hat, etc.). Repeat the differentiating features in
 *    the prompt.
 *
 * 4. **No text in image** — Flux is bad at rendering coherent text. Always
 *    include "no text" or "no words" in negative descriptors.
 *
 * 5. **Even composition** — for drag-name, characters spread evenly so
 *    drop zones don't overlap. Phrases like "evenly spaced", "in a row",
 *    "spread across the scene" help.
 *
 * 6. **Outline style for colour parts** — include "black and white line
 *    art coloring page", "no fills", "thick outlines", "white background"
 *    so kids can color regions.
 */
export interface ScenePromptSpec {
  prompt: string;
  /** Aspect description appended to prompt for layout hints. */
  aspect?: 'landscape' | 'square' | 'portrait';
}

/** All recognized scene IDs. Keep in sync with frontend SceneId type. */
export const SCENE_IDS = [
  // Drag-name scenes (colored, multi-character)
  'park_kids',
  'beach_family',
  'classroom',
  'playground',
  'kitchen_baking',
  'birthday_party',
  // Write-part scenes (single subject, narrative context)
  'pet_girl',
  'family_dinner',
  'weekend_activities',
  // Colour-part scenes (outline only)
  'garden_objects_outline',
  'bedroom_outline',
  'farm_outline',
] as const;

export type SceneId = typeof SCENE_IDS[number];

/** Canonical prompts for each scene. */
export const SCENE_PROMPTS: Record<SceneId, ScenePromptSpec> = {
  // ─── Drag-name scenes ──────────────────────────────────────────────
  // Sprint 4.7.4: 16:9 wide format (1280×720) with 3×2 grid of characters.
  // Wide format gives more horizontal breathing room between grid cells →
  // cleaner character separation than square format.
  // Sprint 4.9.2: Each character now has a clothing trait + activity verb
  // matching the audio script descriptions in sceneCharacters.ts. This way
  // the kid hears "Tom is wearing a red shirt and is flying a kite" and can
  // identify Tom by either trait. SCENE_CACHE_VERSION bumped to v4 to force
  // regeneration of all prior cached scenes.
  park_kids: {
    prompt:
      'Wide horizontal cartoon illustration of children playing at a sunny park. ' +
      'COMPOSITION (most important): Six children arranged in a clean 3×2 grid ' +
      '(three columns, two rows). Top row contains three children spaced evenly ' +
      'across the top half of the image. Bottom row contains three children spaced ' +
      'evenly across the bottom half. Each child is in their own area with empty ' +
      'space around them so they do not overlap. ' +
      'Top row left to right: ' +
      'child wearing a red shirt flying a yellow kite; ' +
      'child wearing a blue dress reading a book; ' +
      'child wearing a green hat kicking a soccer ball. ' +
      'Bottom row left to right: ' +
      'child wearing a yellow t-shirt riding a bicycle; ' +
      'child wearing a pink sweater eating an ice cream; ' +
      'child wearing an orange shirt drawing with crayons. ' +
      'Park background with green grass, trees, blue sky. Wide 16:9 aspect ratio. ' +
      'Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, ' +
      'no text, no words.',
    aspect: 'landscape',
  },
  beach_family: {
    prompt:
      'Wide horizontal cartoon illustration of a family enjoying a sunny day at the beach. ' +
      'COMPOSITION (most important): Six people arranged in a clean 3×2 grid ' +
      '(three columns, two rows). Top row contains three people spaced evenly ' +
      'across the top half of the image. Bottom row contains three people spaced ' +
      'evenly across the bottom half. Each person is in their own area with empty ' +
      'space around them so they do not overlap. ' +
      'Top row left to right: ' +
      'child wearing a red swimsuit building a sandcastle; ' +
      'person wearing a blue sun hat reading on a towel; ' +
      'child wearing green swim shorts flying a kite. ' +
      'Bottom row left to right: ' +
      'child wearing a yellow swimsuit collecting seashells; ' +
      'child wearing a pink swim cap swimming in the sea; ' +
      'person holding an orange umbrella eating an ice cream. ' +
      'Beach background with yellow sand, blue sea, sunny sky. Wide 16:9 aspect ratio. ' +
      'Flat cartoon design, bright colors, kid-friendly style, thick outlines, ' +
      'no text, no words.',
    aspect: 'landscape',
  },
  classroom: {
    prompt:
      'Wide horizontal cartoon illustration of children in a school classroom. ' +
      'COMPOSITION (most important): Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: ' +
      'child with grey hair in a red shirt writing on the blackboard; ' +
      'child with blonde hair in a green shirt reading a textbook; ' +
      'child with brown hair in a purple shirt raising her hand. ' +
      'Bottom row left to right: ' +
      'child wearing glasses and a yellow shirt drawing in a notebook; ' +
      'child with curly hair in a pink shirt using a tablet; ' +
      'child with black hair in a blue shirt eating a sandwich. ' +
      'Classroom background with yellow walls, green blackboard, wooden desks. ' +
      'Wide 16:9 aspect ratio. Flat cartoon design, bright colors, kid-friendly ' +
      'style, thick outlines, no text on blackboard, no words.',
    aspect: 'landscape',
  },
  playground: {
    prompt:
      'Wide horizontal cartoon illustration of children playing at a school playground. ' +
      'COMPOSITION (most important): Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: ' +
      'child wearing a red jumper going down a slide; ' +
      'child wearing a blue cap swinging on a swing; ' +
      'child wearing a green jacket climbing a ladder. ' +
      'Bottom row left to right: ' +
      'child wearing a yellow dress jumping rope; ' +
      'child wearing pink shoes playing hopscotch; ' +
      'child wearing a purple shirt kicking a soccer ball. ' +
      'Playground with green grass, blue sky, slide and swings in background. ' +
      'Wide 16:9 aspect ratio. Flat design, vibrant colors, kid-friendly ' +
      'cartoon style, no text.',
    aspect: 'landscape',
  },
  kitchen_baking: {
    prompt:
      'Wide horizontal cartoon illustration of a family baking together in the kitchen. ' +
      'COMPOSITION (most important): Six people arranged in a clean 3×2 grid. ' +
      'Top row left to right: ' +
      'child with red hair in a striped apron cracking an egg; ' +
      'child with blonde hair and a chef hat pouring flour; ' +
      'child with black hair in a green apron stirring with a wooden spoon. ' +
      'Bottom row left to right: ' +
      'child with curly hair in a yellow shirt cutting cookies with a cookie cutter; ' +
      'child with brown braids in a pink dress decorating cupcakes; ' +
      'child wearing a blue chef hat holding a tray of cookies. ' +
      'Kitchen background with white cabinets, a stove, and a big mixing bowl on the counter. ' +
      'Wide 16:9 aspect ratio. Flat design, warm colors, kid-friendly cartoon style, ' +
      'no text, no words.',
    aspect: 'landscape',
  },
  birthday_party: {
    prompt:
      'Wide horizontal cartoon birthday party scene with six children around a big birthday cake. ' +
      'COMPOSITION (most important): Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: ' +
      'child wearing a red party hat blowing out candles; ' +
      'child wearing a blue dress holding a balloon; ' +
      'child wearing a green bow tie opening a present. ' +
      'Bottom row left to right: ' +
      'child wearing a yellow ribbon eating a slice of cake; ' +
      'child wearing a pink hair bow drinking juice; ' +
      'child wearing a purple t-shirt playing with a party horn. ' +
      'Background: big cake, colorful balloons floating, presents on the floor. ' +
      'Wide 16:9 aspect ratio. Flat design, very vibrant colors, kid-friendly cartoon ' +
      'style, happy expressions, no text on banner, no words.',
    aspect: 'landscape',
  },

  // ─── Write-part scenes ─────────────────────────────────────────────
  // Single subject or simple scene that complements the audio narrative.
  // Sprint 4.7.4: 16:9 wide format with subject centered; surrounding
  // space holds related context (food bowl beside cat, etc.).
  pet_girl: {
    prompt:
      'Wide horizontal cartoon illustration of a young girl with brown braided hair ' +
      'and a yellow hair bow, sitting on the floor cuddling her pet orange tabby cat. ' +
      'A blue food bowl with kibble next to her on the right. She wears a teal dress. ' +
      'Soft blue background spanning wide. Wide 16:9 aspect ratio. ' +
      'Flat cartoon design, soft colors, kid-friendly storybook style, ' +
      'warm cozy mood, no text, no words.',
    aspect: 'landscape',
  },
  family_dinner: {
    prompt:
      'Wide horizontal cartoon family of four eating dinner together at a long wooden table. ' +
      'Father with glasses on the left, mother with blonde hair next to him, ' +
      'son with red hair, daughter with brown hair. Each has a plate of food. ' +
      'Warm dining room with hanging lamp. Wide 16:9 aspect ratio. ' +
      'Flat cartoon design, kid-friendly style, happy mood, no text.',
    aspect: 'landscape',
  },
  weekend_activities: {
    prompt:
      'Wide horizontal cartoon collage showing 6 small panels of children doing weekend ' +
      'activities arranged left to right: reading a book, drawing with crayons, ' +
      'riding a bicycle, kicking a soccer ball, flying a kite, building blocks. ' +
      'Each scene in its own panel separated by thin lines. Wide 16:9 aspect ratio. ' +
      'Flat design, vibrant colors, kid-friendly cartoon style, no text in any panel.',
    aspect: 'landscape',
  },

  // ─── Colour-part scenes (outline only) ─────────────────────────────
  // Sprint 4.7.4: 16:9 wide format with 6+ objects spread horizontally.
  garden_objects_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline ' +
      'drawing of a garden scene with 6 objects spread across the wide image: ' +
      'a cat sitting, a dog running, a soccer ball, a tree with leaves, a bicycle, ' +
      'a ball of yarn. Each object well separated, no overlap. ' +
      'Thick black outlines on pure white background. Wide 16:9 aspect ratio. ' +
      'No fills, no shading, no text. Coloring book style for children.',
    aspect: 'landscape',
  },
  bedroom_outline: {
    // Sprint 4.9.5.4: Reworded to avoid Flux NSFW false-positive on
    // "bedroom" keyword (error 3030). Same scene contents (bed, teddy,
    // lamp, books, window, toy box) but framed as "kid's room" / "child's
    // play area" which doesn't trigger the filter.
    prompt:
      'Wide horizontal black and white line art coloring page for children. Simple outline ' +
      'drawing of a kid\'s play room with 6 distinct objects spread across the wide image: ' +
      'a small child bed with pillow, a teddy bear toy, a desk lamp, a stack of books, ' +
      'a window with curtains, a toy box. ' +
      'Each object well separated. Thick black outlines on pure white background. ' +
      'Wide 16:9 aspect ratio. No fills, no shading, no text. Children coloring book style.',
    aspect: 'landscape',
  },
  farm_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline ' +
      'drawing of a farm scene with 6 elements spread across the wide image: ' +
      'a cow, a pig, a chicken, a barn building, a tree, a sun. ' +
      'Each element well separated, no overlap. Thick black outlines on pure white ' +
      'background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
};

/** Validate that a sceneId is in the registry. */
export function isValidSceneId(id: string): id is SceneId {
  return (SCENE_IDS as readonly string[]).includes(id);
}
