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
  // D-18 Phase 5: Starters per-level drag scenes (L1-L20)
  'starter_l1_petshop',
  'starter_l2_family_dinner',
  'starter_l3_weekend_park',
  'starter_l4_birthday',
  'starter_l5_school',
  'starter_l6_beach',
  'starter_l7_garden',
  'starter_l8_toyshop',
  'starter_l9_sports',
  'starter_l10_picnic',
  'starter_l11_library',
  'starter_l12_bicycle',
  'starter_l13_cooking',
  'starter_l14_swimming',
  'starter_l15_farm',
  'starter_l16_pets_home',
  'starter_l17_sleepover',
  'starter_l18_garden_play',
  'starter_l19_train',
  'starter_l20_snow',
  // D-18 Phase 6: Starters per-level colour outline scenes (L1-L20)
  'starter_l1_petshop_outline',
  'starter_l2_family_dinner_outline',
  'starter_l3_weekend_park_outline',
  'starter_l4_birthday_outline',
  'starter_l5_school_outline',
  'starter_l6_beach_outline',
  'starter_l7_garden_outline',
  'starter_l8_toyshop_outline',
  'starter_l9_sports_outline',
  'starter_l10_picnic_outline',
  'starter_l11_library_outline',
  'starter_l12_bicycle_outline',
  'starter_l13_cooking_outline',
  'starter_l14_swimming_outline',
  'starter_l15_farm_outline',
  'starter_l16_pets_home_outline',
  'starter_l17_sleepover_outline',
  'starter_l18_garden_play_outline',
  'starter_l19_train_outline',
  'starter_l20_snow_outline',
  // D-18 Phase 3: Movers per-level drag scenes (L21-L30)
  'mover_l21_summer_camp',
  'mover_l22_music_lesson',
  'mover_l23_football_match',
  'mover_l24_dance_class',
  'mover_l25_restaurant',
  'mover_l26_bus_journey',
  'mover_l27_zoo_trip',
  'mover_l28_museum_tour',
  'mover_l29_fire_station',
  'mover_l30_pet_competition',
  // D-18 Phase 3: Movers per-level colour outline scenes (L21-L30)
  'mover_l21_summer_camp_outline',
  'mover_l22_music_lesson_outline',
  'mover_l23_football_match_outline',
  'mover_l24_dance_class_outline',
  'mover_l25_restaurant_outline',
  'mover_l26_bus_journey_outline',
  'mover_l27_zoo_trip_outline',
  'mover_l28_museum_tour_outline',
  'mover_l29_fire_station_outline',
  'mover_l30_pet_competition_outline',
  // D-18 Phase 3b: Movers per-level drag scenes (L31-L40)
  'mover_l31_tree_planting',
  'mover_l32_cinema_visit',
  'mover_l33_bakery_shopping',
  'mover_l34_fishing_trip',
  'mover_l35_garage_sale',
  'mover_l36_hospital_visit',
  'mover_l37_post_office',
  'mover_l38_camping_mountains',
  'mover_l39_art_exhibition',
  'mover_l40_new_baby',
  // D-18 Phase 3b: Movers per-level colour outline scenes (L31-L40)
  'mover_l31_tree_planting_outline',
  'mover_l32_cinema_visit_outline',
  'mover_l33_bakery_shopping_outline',
  'mover_l34_fishing_trip_outline',
  'mover_l35_garage_sale_outline',
  'mover_l36_hospital_visit_outline',
  'mover_l37_post_office_outline',
  'mover_l38_camping_mountains_outline',
  'mover_l39_art_exhibition_outline',
  'mover_l40_new_baby_outline',
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

  // ─── D-18 Phase 5: Starters per-level drag scenes (L1-L20) ──────────
  // Wide 16:9 cartoon, 3×2 grid of 6 children, each with distinct clothing
  // color + activity matching audio script. Style suffix is appended via
  // composeScenePrompt() helper at call site (matches existing drag scenes).
  starter_l1_petshop: {
    prompt:
      'Wide horizontal cartoon illustration of kids visiting a friendly pet shop. ' +
      'COMPOSITION: Six children arranged in a clean 3×2 grid (three columns, two rows). ' +
      'Top row left to right: child wearing a red shirt holding a black cat; ' +
      'child wearing a blue dress looking at a fish tank; child wearing a green hat feeding a yellow bird. ' +
      'Bottom row left to right: child wearing a yellow t-shirt petting a brown rabbit; ' +
      'child wearing a pink sweater walking a small dog; child wearing orange shorts choosing a turtle. ' +
      'Pet shop interior with cages, fish tank, plants on shelves. Wide 16:9. Flat cartoon, vibrant colors, no text.',
    aspect: 'landscape',
  },
  starter_l2_family_dinner: {
    prompt:
      'Wide horizontal cartoon illustration of a family enjoying dinner together. ' +
      'COMPOSITION: Six people arranged in a clean 3×2 grid. ' +
      'Top row left to right: person wearing a red apron serving chicken; ' +
      'person wearing a blue shirt drinking milk; person wearing a green sweater cutting bread. ' +
      'Bottom row left to right: person wearing a yellow dress eating rice; ' +
      'person wearing a pink hat pouring juice; person wearing an orange shirt feeding a baby brother. ' +
      'Cozy dining room with wooden table, lamp, family pictures on the wall. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  starter_l3_weekend_park: {
    prompt:
      'Wide horizontal cartoon illustration of a busy park on a sunny weekend. ' +
      'COMPOSITION: Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: child wearing a red cap running with a kite; ' +
      'child wearing a blue jacket walking a small dog; child wearing a green scarf feeding ducks. ' +
      'Bottom row left to right: child wearing a yellow t-shirt riding a scooter; ' +
      'child wearing a pink coat eating an apple; child wearing orange shorts sitting on a bench. ' +
      'Green park with paths, benches, a small pond, flowers. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  starter_l4_birthday: {
    prompt:
      'Wide horizontal cartoon illustration of a happy birthday party for Lily who is seven. ' +
      'COMPOSITION: Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: child wearing a red party hat blowing out candles; ' +
      'child wearing a blue dress holding a present; child wearing a green bow tie eating chocolate cake. ' +
      'Bottom row left to right: child wearing a yellow shirt drinking juice; ' +
      'child wearing a pink skirt playing with balloons; child wearing orange overalls singing happy birthday. ' +
      'Decorated room with balloons, streamers, a big birthday cake on a table. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  starter_l5_school: {
    prompt:
      'Wide horizontal cartoon illustration of children at school in a bright classroom. ' +
      'COMPOSITION: Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: child wearing a red uniform reading a book; ' +
      'child wearing a blue cardigan drawing a picture; child wearing a green tie writing on paper. ' +
      'Bottom row left to right: child wearing a yellow shirt opening a pencil case; ' +
      'child wearing a pink ribbon raising her hand; child wearing orange shoes carrying a school bag. ' +
      'Classroom with desks, a green board, books on shelves, alphabet poster. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  starter_l6_beach: {
    prompt:
      'Wide horizontal cartoon illustration of a family on a sunny beach holiday. ' +
      'COMPOSITION: Six people arranged in a clean 3×2 grid. ' +
      'Top row left to right: person wearing a red swimsuit building a sandcastle; ' +
      'person wearing a blue sun hat collecting seashells; person wearing green swim shorts flying a kite. ' +
      'Bottom row left to right: person wearing a yellow towel reading a book; ' +
      'person wearing a pink swim cap swimming in shallow water; person holding an orange ball playing volleyball. ' +
      'Beach with golden sand, blue sea, umbrellas, seagulls, a sandcastle. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  starter_l7_garden: {
    prompt:
      'Wide horizontal cartoon illustration of children helping in a colorful flower garden. ' +
      'COMPOSITION: Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: child wearing red gloves watering red roses; ' +
      'child wearing a blue apron planting yellow tulips; child wearing a green hat picking white daisies. ' +
      'Bottom row left to right: child wearing a yellow dress holding a watering can; ' +
      'child wearing pink boots looking at a butterfly; child wearing orange overalls pulling a small wagon. ' +
      'Garden with flower beds, tree, watering can, butterflies. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  starter_l8_toyshop: {
    prompt:
      'Wide horizontal cartoon illustration of children visiting a toy shop. ' +
      'COMPOSITION: Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: child wearing a red sweater holding a teddy bear; ' +
      'child wearing a blue t-shirt looking at toy cars; child wearing a green cap choosing a doll. ' +
      'Bottom row left to right: child wearing a yellow scarf playing with blocks; ' +
      'child wearing pink pyjamas pushing a stroller; child wearing orange trousers flying a toy plane. ' +
      'Toy shop with colorful shelves of toys, balloons hanging from the ceiling. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  starter_l9_sports: {
    prompt:
      'Wide horizontal cartoon illustration of children competing on school sports day. ' +
      'COMPOSITION: Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: child wearing a red running shirt running fast on the track; ' +
      'child wearing blue shorts jumping over a hurdle; child wearing a green tracksuit throwing a small ball. ' +
      'Bottom row left to right: child wearing yellow trainers holding a trophy; ' +
      'child wearing a pink headband cheering with pom-poms; child wearing orange shoes drinking from a water bottle. ' +
      'Sports field with running track, flags, finish line, blue sky. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  starter_l10_picnic: {
    prompt:
      "Wide horizontal cartoon illustration of a picnic for Mia's birthday in a green park. " +
      'COMPOSITION: Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: child wearing a red sun hat spreading a picnic blanket; ' +
      'child wearing a blue dress opening a picnic basket; child wearing a green shirt pouring lemonade. ' +
      'Bottom row left to right: child wearing yellow sandals eating a sandwich; ' +
      'child wearing a pink ribbon cutting a fruit cake; child wearing orange shorts playing with a small dog. ' +
      'Park with picnic blanket, basket, trees, a small dog watching. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  starter_l11_library: {
    prompt:
      'Wide horizontal cartoon illustration of children visiting the library on a quiet afternoon. ' +
      'COMPOSITION: Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: child wearing a red cardigan reading a thick book; ' +
      'child wearing a blue shirt choosing books from a shelf; child wearing a green vest sitting on a beanbag with a comic. ' +
      'Bottom row left to right: child wearing a yellow scarf borrowing books at the desk; ' +
      'child wearing pink glasses writing in a notebook; child wearing orange shoes pushing a book cart. ' +
      'Library with tall bookshelves, reading tables, lamps, big windows. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  starter_l12_bicycle: {
    prompt:
      'Wide horizontal cartoon illustration of children riding bicycles in the park. ' +
      'COMPOSITION: Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: child wearing a red helmet riding a red bicycle; ' +
      'child wearing a blue jacket riding a blue scooter; child wearing a green t-shirt fixing a bike chain. ' +
      'Bottom row left to right: child wearing yellow shorts ringing a bicycle bell; ' +
      'child wearing a pink hoodie cycling with a basket; child wearing orange trainers pushing a small bike. ' +
      'Park bike path with trees, benches, a small pond on one side. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  starter_l13_cooking: {
    prompt:
      'Wide horizontal cartoon illustration of children baking a lemon cake with mum. ' +
      'COMPOSITION: Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: child wearing a red apron mixing the cake batter; ' +
      'child wearing a blue chef hat cracking an egg; child wearing a green shirt measuring flour. ' +
      'Bottom row left to right: child wearing a yellow apron squeezing a lemon; ' +
      'child wearing pink oven mitts putting the cake in the oven; child wearing orange overalls licking a spoon. ' +
      'Bright kitchen with bowls, flour, eggs, a wooden table, oven. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  starter_l14_swimming: {
    prompt:
      'Wide horizontal cartoon illustration of children at a swimming lesson. ' +
      'COMPOSITION: Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: child wearing a red swim cap jumping into the pool; ' +
      'child wearing blue goggles swimming with a float; child wearing green flippers kicking water. ' +
      'Bottom row left to right: child wearing a yellow swimsuit sitting on the pool edge; ' +
      'child wearing a pink towel drying off; child wearing orange armbands learning to float. ' +
      'Indoor pool with blue water, swim lanes, lifebuoy on the wall. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  starter_l15_farm: {
    prompt:
      "Wide horizontal cartoon illustration of children visiting Tim's farm. " +
      'COMPOSITION: Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: child wearing a red jumper feeding a brown cow; ' +
      'child wearing blue overalls patting a small sheep; child wearing a green farm hat carrying a basket of eggs. ' +
      'Bottom row left to right: child wearing yellow wellies feeding a pig; ' +
      'child wearing a pink scarf watching chickens; child wearing orange gloves milking a cow. ' +
      'Farm with red barn, fields, animals grazing, a tractor. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  starter_l16_pets_home: {
    prompt:
      "Wide horizontal cartoon illustration of kids at Lily's house with her pets. " +
      'COMPOSITION: Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: child wearing a red shirt feeding a cat called Pip; ' +
      'child wearing a blue jumper walking the dog Bob; child wearing a green dress watching fish in a bowl. ' +
      'Bottom row left to right: child wearing a yellow hoodie brushing a small rabbit; ' +
      'child wearing a pink ribbon cleaning the fish tank; child wearing orange slippers filling a pet bowl. ' +
      'Living room with sofa, pet bowls, fish tank on a stand, cat tree. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  starter_l17_sleepover: {
    prompt:
      "Wide horizontal cartoon illustration of girls having a sleepover at Eve's house. " +
      'COMPOSITION: Six girls arranged in a clean 3×2 grid. ' +
      'Top row left to right: girl wearing red pyjamas reading a bedtime story; ' +
      'girl wearing blue pyjamas eating popcorn; girl wearing a green nightie holding a teddy bear. ' +
      'Bottom row left to right: girl wearing yellow socks brushing her teeth; ' +
      'girl wearing pink slippers watching a movie; girl wearing an orange robe arranging pillows. ' +
      'Bedroom with two beds, pink curtains, pillows, books on the floor. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  starter_l18_garden_play: {
    prompt:
      'Wide horizontal cartoon illustration of children playing tag in the garden. ' +
      'COMPOSITION: Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: child wearing a red t-shirt chasing a friend; ' +
      'child wearing blue shorts hiding behind a tree; child wearing a green cap jumping on a swing. ' +
      'Bottom row left to right: child wearing yellow trainers rolling on the grass; ' +
      'child wearing a pink dress counting to ten; child wearing orange overalls pointing at the winner. ' +
      'Sunny garden with grass, flower beds, swing, picnic table. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  starter_l19_train: {
    prompt:
      'Wide horizontal cartoon illustration of a family travelling on a train to grandma. ' +
      'COMPOSITION: Six people arranged in a clean 3×2 grid. ' +
      'Top row left to right: person wearing a red coat putting bags on the rack; ' +
      'person wearing a blue scarf looking out the window; person wearing a green jumper reading a magazine. ' +
      'Bottom row left to right: person wearing a yellow hat eating a sandwich; ' +
      'person wearing pink mittens holding a train ticket; person wearing orange boots sleeping with a teddy. ' +
      'Train carriage interior with seats, window showing countryside, luggage rack. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  starter_l20_snow: {
    prompt:
      'Wide horizontal cartoon illustration of children playing in fresh snow on a winter day. ' +
      'COMPOSITION: Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: child wearing a red winter coat building a snowman; ' +
      'child wearing a blue beanie throwing a snowball; child wearing green mittens pulling a sled. ' +
      'Bottom row left to right: child wearing a yellow scarf making a snow angel; ' +
      'child wearing a pink ski jacket skating on ice; child wearing orange snow boots sipping hot chocolate. ' +
      'Snowy park with bare trees, snowman, snow-covered houses in the distance. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },

  // ─── D-18 Phase 6: Starters per-level colour outline scenes (L1-L20) ───
  // Black and white line art coloring pages. 5 distinct objects per scene
  // matching the regions defined in levels.ts (makeStarterColourL*).
  starter_l1_petshop_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a pet shop scene with 6 elements spread across the wide image: a cat, a fish, a bird, a rabbit, a dog, a turtle. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  starter_l2_family_dinner_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a family dinner scene with 6 elements spread across the wide image: a plate, a slice of bread, a cup, a roast chicken, an apple, a hanging lamp. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  starter_l3_weekend_park_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a park scene with 6 elements spread across the wide image: a kite, a bench, a duck, a dog, a bicycle, a playground slide. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  starter_l4_birthday_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a birthday party scene with 6 elements spread across the wide image: a birthday cake, a balloon, a candle, a wrapped present, a party hat, a cup. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  starter_l5_school_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a classroom scene with 6 elements spread across the wide image: a book, a pencil, a school bag, a chair, a chalkboard, a wall clock. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  starter_l6_beach_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a beach scene with 6 elements spread across the wide image: a beach ball, a sand bucket, a seashell, a beach umbrella, a fish, a small boat. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  starter_l7_garden_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a flower garden scene with 6 elements spread across the wide image: a rose, a tulip, a butterfly, a watering can, a daisy, a wooden bench. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  starter_l8_toyshop_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a toy shop scene with 6 elements spread across the wide image: a doll, a ball, a teddy bear, a kite, a toy car, a robot. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  starter_l9_sports_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a sports day scene with 6 elements spread across the wide image: a sports shirt, a medal with ribbon, running shoes, a flag on a pole, a sports cone, a ball. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  starter_l10_picnic_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a picnic scene with 6 elements spread across the wide image: a picnic blanket, a sandwich, an apple, a slice of cake, a picnic basket, a small dog. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  starter_l11_library_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a library scene with 6 elements spread across the wide image: an open book, a wooden chair, a reading lamp, a school bag, a pen, a floor rug. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  starter_l12_bicycle_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a bicycle scene with 6 elements spread across the wide image: a bicycle, a bike helmet, a small bell, a bike basket, a water bottle, a wide pathway. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  starter_l13_cooking_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a kitchen baking scene with 6 elements spread across the wide image: a round cake, a mixing bowl, a wooden spoon, an apron, a lemon, an oven. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  starter_l14_swimming_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a swimming pool scene with 6 elements spread across the wide image: a rectangular pool, a swim float ring, swim goggles, a towel, a swim cap, a beach ball. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  starter_l15_farm_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a farm scene with 6 elements spread across the wide image: a barn building, a sheep, a chicken, a tractor, a duck, a haystack. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  starter_l16_pets_home_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a pets at home scene with 6 elements spread across the wide image: a cat, a dog, a fish, a rabbit, a bird, a pet food bowl. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  starter_l17_sleepover_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a bedroom sleepover scene with 6 elements spread across the wide image: a bed, a pillow, a teddy bear, a pair of slippers, a wall clock, a window curtain. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  starter_l18_garden_play_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a garden playground scene with 6 elements spread across the wide image: a swing, a slide, a flower, a butterfly, a slice of cake, a ball. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  starter_l19_train_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a train travel scene with 6 elements spread across the wide image: a train locomotive, a travel bag, a train window, a suitcase, a train ticket, a cap. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  starter_l20_snow_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a snow day scene with 6 elements spread across the wide image: a snowman, a winter hat, a scarf, a carrot, a pair of mittens, a sled. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },

  // ─── D-18 Phase 3: Movers per-level drag scenes (L21-L30) ───────────
  mover_l21_summer_camp: {
    prompt:
      'Wide horizontal cartoon illustration of children having fun at a summer camp by the lake. ' +
      'COMPOSITION: Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: child wearing a red cap putting up a tent; ' +
      'child wearing a blue life jacket paddling a canoe; child wearing a green backpack reading a map. ' +
      'Bottom row left to right: child wearing a yellow raincoat toasting marshmallows; ' +
      'child wearing pink shorts fishing by the lake; child wearing an orange hat climbing a rope wall. ' +
      'Campsite with tents, a lake, tall pine trees, a campfire. Wide 16:9. Flat cartoon, vibrant colors, no text.',
    aspect: 'landscape',
  },
  mover_l22_music_lesson: {
    prompt:
      'Wide horizontal cartoon illustration of children in a music lesson with their teacher. ' +
      'COMPOSITION: Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: child wearing a red bow tie playing the piano; ' +
      'child wearing a blue waistcoat playing a guitar; child wearing a green shirt banging a drum. ' +
      'Bottom row left to right: child wearing a yellow dress playing a violin; ' +
      'child wearing a pink jumper blowing a trumpet; child wearing an orange scarf singing into a microphone. ' +
      'Music room with a piano, music stands, posters of notes on the wall. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  mover_l23_football_match: {
    prompt:
      'Wide horizontal cartoon illustration of children playing a football match on a sunny field. ' +
      'COMPOSITION: Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: child wearing a red football kit kicking the ball; ' +
      'child wearing green goalkeeper gloves saving a goal; child wearing a blue kit running with the ball. ' +
      'Bottom row left to right: child wearing a yellow referee shirt blowing a whistle; ' +
      'child wearing a pink headband holding a trophy; child wearing an orange scarf cheering in the crowd. ' +
      'Football pitch with green grass, a goal net, white lines, a crowd. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  mover_l24_dance_class: {
    prompt:
      'Wide horizontal cartoon illustration of children practising in a dance class. ' +
      'COMPOSITION: Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: child wearing a red leotard spinning on her toes; ' +
      'child wearing a blue tracksuit doing a street dance move; child wearing a green tutu jumping in the air. ' +
      'Bottom row left to right: child wearing yellow ballet shoes stretching at the barre; ' +
      'child wearing a pink ribbon waving a dance ribbon; child wearing an orange t-shirt clapping to the music. ' +
      'Dance studio with a big mirror, a wooden barre, bright wooden floor. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  mover_l25_restaurant: {
    prompt:
      'Wide horizontal cartoon illustration of a family enjoying a meal at a busy restaurant. ' +
      'COMPOSITION: Six people arranged in a clean 3×2 grid. ' +
      'Top row left to right: person wearing a red apron carrying a tray of food; ' +
      'person wearing a blue shirt eating a pizza; person wearing a green jumper drinking orange juice. ' +
      'Bottom row left to right: person wearing a yellow dress reading the menu; ' +
      'person wearing a pink cardigan eating a bowl of soup; person wearing an orange tie cutting a slice of cake. ' +
      'Restaurant with round tables, a waiter, plants, a kitchen at the back. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  mover_l26_bus_journey: {
    prompt:
      'Wide horizontal cartoon illustration of children and families travelling on a city bus. ' +
      'COMPOSITION: Six people arranged in a clean 3×2 grid. ' +
      'Top row left to right: person wearing a red driver cap driving the bus; ' +
      'person wearing a blue coat showing a bus ticket; person wearing a green hat looking out of the window. ' +
      'Bottom row left to right: person wearing a yellow scarf holding a suitcase; ' +
      'person wearing a pink backpack reading a city map; person wearing orange headphones listening to music. ' +
      'Bus interior with seats, windows showing the city, a driver at the front. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  mover_l27_zoo_trip: {
    prompt:
      'Wide horizontal cartoon illustration of a school group visiting the zoo on a sunny day. ' +
      'COMPOSITION: Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: child wearing a red sun hat watching a lion; ' +
      'child wearing a blue t-shirt feeding a giraffe; child wearing green shorts photographing a monkey. ' +
      'Bottom row left to right: child wearing a yellow cap pointing at an elephant; ' +
      'child wearing a pink jacket looking at the penguins; child wearing an orange backpack buying an ice cream. ' +
      'Zoo with animal enclosures, leafy trees, a path, signposts. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  mover_l28_museum_tour: {
    prompt:
      'Wide horizontal cartoon illustration of children on a guided tour of a history museum. ' +
      'COMPOSITION: Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: child wearing a red jumper looking at a dinosaur skeleton; ' +
      'child wearing a blue cardigan studying a painting; child wearing a green shirt taking notes on a clipboard. ' +
      'Bottom row left to right: child wearing a yellow vest pointing at an old statue; ' +
      'child wearing a pink scarf reading an information sign; child wearing orange glasses looking in a glass case. ' +
      'Museum hall with a dinosaur skeleton, paintings, glass cases, a statue. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  mover_l29_fire_station: {
    prompt:
      'Wide horizontal cartoon illustration of children visiting a busy fire station. ' +
      'COMPOSITION: Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: child wearing a red fire helmet holding a fire hose; ' +
      'child wearing a blue uniform sitting in the fire engine; child wearing green boots climbing the long ladder. ' +
      'Bottom row left to right: child wearing a yellow jacket polishing the fire engine; ' +
      'child wearing a pink shirt sliding down the pole; child wearing orange gloves rolling up a hose. ' +
      'Fire station with a red fire engine, a tall ladder, hoses, a sliding pole. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  mover_l30_pet_competition: {
    prompt:
      'Wide horizontal cartoon illustration of children showing their pets at a pet competition. ' +
      'COMPOSITION: Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: child wearing a red rosette holding a fluffy cat; ' +
      'child wearing a blue cap walking a spotty dog; child wearing a green jumper showing a white rabbit. ' +
      'Bottom row left to right: child wearing a yellow shirt carrying a bird cage; ' +
      'child wearing a pink dress holding a goldfish bowl; child wearing an orange judge badge giving out a gold trophy. ' +
      'Show ring with a judging table, rosettes, a banner, a row of pet baskets. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },

  // ─── D-18 Phase 3: Movers per-level colour outline scenes (L21-L30) ──
  mover_l21_summer_camp_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a summer camp scene with 6 elements spread across the wide image: a tent, a canoe, a backpack, a fish, a tree, a campfire. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  mover_l22_music_lesson_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a music lesson scene with 6 elements spread across the wide image: a piano, a guitar, a drum, a violin, a trumpet, a music note. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  mover_l23_football_match_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a football match scene with 6 elements spread across the wide image: a football, a sports shirt, a trophy, a flag, a football boot, a goal net. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  mover_l24_dance_class_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a dance class scene with 6 elements spread across the wide image: a tutu, a pair of ballet shoes, a dance ribbon, a dress, a flower, a star. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  mover_l25_restaurant_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a restaurant table scene with 6 elements spread across the wide image: a pizza, a cup, a plate, a slice of cake, an apple, a bowl. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  mover_l26_bus_journey_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a bus journey scene with 6 elements spread across the wide image: a bus, a ticket, a suitcase, a road sign, a wheel, a window. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  mover_l27_zoo_trip_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a zoo scene with 6 animals spread across the wide image: an elephant, a lion, a monkey, a giraffe, a snake, a penguin. Each animal well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  mover_l28_museum_tour_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a museum scene with 6 elements spread across the wide image: a dinosaur, a framed painting, a statue, a vase, a clay pot, a mask. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  mover_l29_fire_station_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a fire station scene with 6 elements spread across the wide image: a fire engine, a fire helmet, a ladder, a hose, a boot, a bucket. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  mover_l30_pet_competition_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a pet competition scene with 6 elements spread across the wide image: a dog, a cat, a rabbit, a bird, a fish, a rosette ribbon. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },

  // ─── D-18 Phase 3b: Movers per-level drag scenes (L31-L40) ──────────
  mover_l31_tree_planting: {
    prompt:
      'Wide horizontal cartoon illustration of children planting trees on a sunny green day. ' +
      'COMPOSITION: Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: child wearing red gloves digging a hole with a spade; ' +
      'child wearing a blue cap planting a small tree; child wearing a green apron watering a plant. ' +
      'Bottom row left to right: child wearing yellow boots pushing a wheelbarrow; ' +
      'child wearing a pink hat carrying a flowerpot; child wearing an orange shirt raking the soil. ' +
      'Open field with young trees, soil, a wheelbarrow, blue sky. Wide 16:9. Flat cartoon, vibrant colors, no text.',
    aspect: 'landscape',
  },
  mover_l32_cinema_visit: {
    prompt:
      'Wide horizontal cartoon illustration of children watching a film at the cinema. ' +
      'COMPOSITION: Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: child wearing a red jumper holding a box of popcorn; ' +
      'child wearing blue 3D glasses watching the screen; child wearing a green t-shirt drinking a fizzy drink. ' +
      'Bottom row left to right: child wearing a yellow scarf showing a cinema ticket; ' +
      'child wearing a pink dress eating sweets; child wearing an orange cap finding a seat. ' +
      'Cinema with a big screen, rows of red seats, dim lights. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  mover_l33_bakery_shopping: {
    prompt:
      'Wide horizontal cartoon illustration of children buying treats at a busy bakery. ' +
      'COMPOSITION: Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: child wearing a red apron baking a loaf of bread; ' +
      'child wearing a blue coat choosing a cupcake; child wearing a green jumper holding a croissant. ' +
      'Bottom row left to right: child wearing a yellow hat paying for a pie; ' +
      'child wearing a pink scarf eating a cookie; child wearing an orange shirt carrying a cake box. ' +
      'Bakery with shelves of bread, a glass counter, a baker, an oven. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  mover_l34_fishing_trip: {
    prompt:
      'Wide horizontal cartoon illustration of a family on a fishing trip by the river. ' +
      'COMPOSITION: Six people arranged in a clean 3×2 grid. ' +
      'Top row left to right: person wearing a red life jacket holding a fishing rod; ' +
      'person wearing a blue hat catching a big fish; person wearing green boots rowing a boat. ' +
      'Bottom row left to right: person wearing a yellow raincoat filling a bucket with fish; ' +
      'person wearing a pink scarf putting a worm on a hook; person wearing an orange cap holding a fishing net. ' +
      'River bank with reeds, a small wooden boat, green hills. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  mover_l35_garage_sale: {
    prompt:
      'Wide horizontal cartoon illustration of children and neighbours at a busy garage sale. ' +
      'COMPOSITION: Six people arranged in a clean 3×2 grid. ' +
      'Top row left to right: person wearing a red shirt selling an old lamp; ' +
      'person wearing a blue cardigan looking at old books; person wearing a green cap buying a toy. ' +
      'Bottom row left to right: person wearing a yellow dress sticking on price tags; ' +
      'person wearing a pink jumper carrying a cardboard box; person wearing an orange scarf sitting on an old chair. ' +
      'Driveway with tables of old toys, books, a lamp, price tags. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  mover_l36_hospital_visit: {
    prompt:
      'Wide horizontal cartoon illustration of children visiting a friendly hospital ward. ' +
      'COMPOSITION: Six people arranged in a clean 3×2 grid. ' +
      'Top row left to right: person wearing a white doctor coat checking a chart; ' +
      'person wearing a blue nurse uniform giving some medicine; child wearing a green jumper lying in a hospital bed. ' +
      'Bottom row left to right: child wearing a yellow shirt holding some flowers; ' +
      'child wearing a pink cardigan reading a get-well card; child wearing an orange cap putting on a bandage. ' +
      'Hospital ward with beds, a window, a medicine trolley, get-well cards. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  mover_l37_post_office: {
    prompt:
      'Wide horizontal cartoon illustration of children posting letters at the post office. ' +
      'COMPOSITION: Six people arranged in a clean 3×2 grid. ' +
      'Top row left to right: person wearing a red uniform weighing a parcel; ' +
      'person wearing a blue coat posting a letter; person wearing a green jumper buying a stamp. ' +
      'Bottom row left to right: person wearing a yellow scarf carrying a big parcel; ' +
      'person wearing a pink hat writing an address; person wearing an orange shirt sticking on a stamp. ' +
      'Post office with a counter, a red postbox, shelves of parcels, scales. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  mover_l38_camping_mountains: {
    prompt:
      'Wide horizontal cartoon illustration of children camping high in the mountains. ' +
      'COMPOSITION: Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: child wearing a red anorak putting up a tent; ' +
      'child wearing a blue backpack reading a compass; child wearing green walking boots climbing the mountain. ' +
      'Bottom row left to right: child wearing a yellow scarf looking through binoculars; ' +
      'child wearing a pink woolly hat lighting a campfire; child wearing an orange jacket unrolling a map. ' +
      'Mountain campsite with tents, tall peaks, pine trees, a winding path. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  mover_l39_art_exhibition: {
    prompt:
      'Wide horizontal cartoon illustration of children at a colourful art exhibition. ' +
      'COMPOSITION: Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: child wearing a red smock painting at an easel; ' +
      'child wearing a blue beret looking at a painting; child wearing a green jumper holding a paintbrush. ' +
      'Bottom row left to right: child wearing a yellow apron mixing paint on a palette; ' +
      'child wearing a pink scarf admiring a statue; child wearing an orange shirt hanging up a frame. ' +
      'Art gallery with framed paintings on white walls, an easel, a statue. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  mover_l40_new_baby: {
    prompt:
      'Wide horizontal cartoon illustration of a family welcoming a new baby at home. ' +
      'COMPOSITION: Six people arranged in a clean 3×2 grid. ' +
      'Top row left to right: person wearing a red cardigan holding the new baby; ' +
      'person wearing a blue jumper rocking the cot; person wearing a green shirt giving a baby bottle. ' +
      'Bottom row left to right: child wearing a yellow dress shaking a rattle; ' +
      'person wearing a pink hat pushing a pram; child wearing an orange jumper folding a baby blanket. ' +
      'Cosy living room with a cot, baby toys, a pram, balloons. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },

  // ─── D-18 Phase 3b: Movers per-level colour outline scenes (L31-L40) ──
  mover_l31_tree_planting_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a tree planting scene with 6 elements spread across the wide image: a tree, a spade, a watering can, a flowerpot, a wheelbarrow, a flower. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  mover_l32_cinema_visit_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a cinema scene with 6 elements spread across the wide image: a cinema screen, a box of popcorn, a ticket, a cinema seat, a drink cup, a pair of 3D glasses. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  mover_l33_bakery_shopping_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a bakery scene with 6 elements spread across the wide image: a cake, a loaf of bread, a croissant, a cupcake, a pie, a cookie. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  mover_l34_fishing_trip_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a fishing scene with 6 elements spread across the wide image: a fish, a small boat, a bucket, a fishing net, a fishing rod, a worm. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  mover_l35_garage_sale_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a garage sale scene with 6 elements spread across the wide image: a lamp, a chair, a cardboard box, a book, a clock, a teddy bear. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  mover_l36_hospital_visit_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a hospital scene with 6 elements spread across the wide image: a hospital bed, a flower, a medicine bottle, a bandage, a thermometer, a heart. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  mover_l37_post_office_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a post office scene with 6 elements spread across the wide image: a postbox, a parcel, an envelope, a stamp, a weighing scale, a pen. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  mover_l38_camping_mountains_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a mountain camping scene with 6 elements spread across the wide image: a tent, a mountain, a campfire, a backpack, a compass, a tree. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  mover_l39_art_exhibition_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of an art studio scene with 6 elements spread across the wide image: an easel, a framed painting, a paint palette, a paintbrush, a statue, an empty frame. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  mover_l40_new_baby_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a baby nursery scene with 6 elements spread across the wide image: a cot, a pram, a baby bottle, a rattle, a teddy bear, a blanket. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
};

/** Validate that a sceneId is in the registry. */
export function isValidSceneId(id: string): id is SceneId {
  return (SCENE_IDS as readonly string[]).includes(id);
}
