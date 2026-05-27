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
  // D-18 Phase 4: Flyers per-level drag scenes (L41-L50)
  'flyer_l41_science_fair',
  'flyer_l42_charity_event',
  'flyer_l43_volunteer_shelter',
  'flyer_l44_food_festival',
  'flyer_l45_eco_project',
  'flyer_l46_space_exhibition',
  'flyer_l47_cooking_competition',
  'flyer_l48_film_making',
  'flyer_l49_photography_class',
  'flyer_l50_mountain_hiking',
  // D-18 Phase 4: Flyers per-level colour outline scenes (L41-L50)
  'flyer_l41_science_fair_outline',
  'flyer_l42_charity_event_outline',
  'flyer_l43_volunteer_shelter_outline',
  'flyer_l44_food_festival_outline',
  'flyer_l45_eco_project_outline',
  'flyer_l46_space_exhibition_outline',
  'flyer_l47_cooking_competition_outline',
  'flyer_l48_film_making_outline',
  'flyer_l49_photography_class_outline',
  'flyer_l50_mountain_hiking_outline',
  // D-18 Phase 4b: Flyers per-level drag scenes (L51-L60)
  'flyer_l51_sailing_course',
  'flyer_l52_ancient_museum',
  'flyer_l53_drama_festival',
  'flyer_l54_news_reporter',
  'flyer_l55_job_shadowing',
  'flyer_l56_time_capsule',
  'flyer_l57_future_career',
  'flyer_l58_pen_pals',
  'flyer_l59_school_olympics',
  'flyer_l60_graduation',
  // D-18 Phase 4b: Flyers per-level colour outline scenes (L51-L60)
  'flyer_l51_sailing_course_outline',
  'flyer_l52_ancient_museum_outline',
  'flyer_l53_drama_festival_outline',
  'flyer_l54_news_reporter_outline',
  'flyer_l55_job_shadowing_outline',
  'flyer_l56_time_capsule_outline',
  'flyer_l57_future_career_outline',
  'flyer_l58_pen_pals_outline',
  'flyer_l59_school_olympics_outline',
  'flyer_l60_graduation_outline',
  // D-23: Chinese HSK1 curated scenes (L101-L105) — drag + colour outline
  'zh_hsk1_l101_park',
  'zh_hsk1_l102_home',
  'zh_hsk1_l103_clothes',
  'zh_hsk1_l104_animals',
  'zh_hsk1_l105_food',
  'zh_hsk1_l101_park_outline',
  'zh_hsk1_l102_home_outline',
  'zh_hsk1_l103_clothes_outline',
  'zh_hsk1_l104_animals_outline',
  'zh_hsk1_l105_food_outline',
  // HSK1 batch 2 (L106-110)
  'zh_hsk1_l106_school',
  'zh_hsk1_l107_birthday',
  'zh_hsk1_l108_daily',
  'zh_hsk1_l109_livingroom',
  'zh_hsk1_l110_kitchen',
  'zh_hsk1_l106_school_outline',
  'zh_hsk1_l107_birthday_outline',
  'zh_hsk1_l108_daily_outline',
  'zh_hsk1_l109_livingroom_outline',
  'zh_hsk1_l110_kitchen_outline',
  // HSK1 batch 3 (L111-115)
  'zh_hsk1_l111_station',
  'zh_hsk1_l112_toyshop',
  'zh_hsk1_l113_zoo',
  'zh_hsk1_l114_picnic',
  'zh_hsk1_l115_shop',
  'zh_hsk1_l111_station_outline',
  'zh_hsk1_l112_toyshop_outline',
  'zh_hsk1_l113_zoo_outline',
  'zh_hsk1_l114_picnic_outline',
  'zh_hsk1_l115_shop_outline',
  // HSK1 batch 4 (L116-120, review)
  'zh_hsk1_l116_schoolfair',
  'zh_hsk1_l117_myroom',
  'zh_hsk1_l118_market',
  'zh_hsk1_l119_weekend',
  'zh_hsk1_l120_party',
  'zh_hsk1_l116_schoolfair_outline',
  'zh_hsk1_l117_myroom_outline',
  'zh_hsk1_l118_market_outline',
  'zh_hsk1_l119_weekend_outline',
  'zh_hsk1_l120_party_outline',
  // HSK2 batch 1 (L121-125)
  'zh_hsk2_l121_sportsday',
  'zh_hsk2_l122_music',
  'zh_hsk2_l123_zoo',
  'zh_hsk2_l124_restaurant',
  'zh_hsk2_l125_travel',
  'zh_hsk2_l121_sportsday_outline',
  'zh_hsk2_l122_music_outline',
  'zh_hsk2_l123_zoo_outline',
  'zh_hsk2_l124_restaurant_outline',
  'zh_hsk2_l125_travel_outline',
  // HSK2 batch 2 (L126-130)
  'zh_hsk2_l126_week',
  'zh_hsk2_l127_doctor',
  'zh_hsk2_l128_cooking',
  'zh_hsk2_l129_space',
  'zh_hsk2_l130_seaside',
  'zh_hsk2_l126_week_outline',
  'zh_hsk2_l127_doctor_outline',
  'zh_hsk2_l128_cooking_outline',
  'zh_hsk2_l129_space_outline',
  'zh_hsk2_l130_seaside_outline',
  // HSK2 batch 3 (L131-135)
  'zh_hsk2_l131_petshop',
  'zh_hsk2_l132_artclass',
  'zh_hsk2_l133_photo',
  'zh_hsk2_l134_garden',
  'zh_hsk2_l135_postoffice',
  'zh_hsk2_l131_petshop_outline',
  'zh_hsk2_l132_artclass_outline',
  'zh_hsk2_l133_photo_outline',
  'zh_hsk2_l134_garden_outline',
  'zh_hsk2_l135_postoffice_outline',
  // HSK2 batch 4 (L136-140)
  'zh_hsk2_l136_fixing',
  'zh_hsk2_l137_birthday',
  'zh_hsk2_l138_cinema',
  'zh_hsk2_l139_airport',
  'zh_hsk2_l140_review',
  'zh_hsk2_l136_fixing_outline',
  'zh_hsk2_l137_birthday_outline',
  'zh_hsk2_l138_cinema_outline',
  'zh_hsk2_l139_airport_outline',
  'zh_hsk2_l140_review_outline',
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

  // ─── D-18 Phase 4: Flyers per-level drag scenes (L41-L50) ───────────
  flyer_l41_science_fair: {
    prompt:
      'Wide horizontal cartoon illustration of students at a school science fair. ' +
      'COMPOSITION: Six students arranged in a clean 3×2 grid. ' +
      'Top row left to right: student wearing a red lab coat presenting an experiment; ' +
      'student wearing blue safety goggles mixing two chemicals; student wearing a green jumper showing a model volcano. ' +
      'Bottom row left to right: student wearing a yellow shirt looking through a microscope; ' +
      'student wearing a pink cardigan holding a small robot; student wearing an orange tie measuring with a ruler. ' +
      'School hall with science stalls, posters, a model volcano. Wide 16:9. Flat cartoon, vibrant colors, no text.',
    aspect: 'landscape',
  },
  flyer_l42_charity_event: {
    prompt:
      'Wide horizontal cartoon illustration of people raising money at a charity event. ' +
      'COMPOSITION: Six people arranged in a clean 3×2 grid. ' +
      'Top row left to right: person wearing a red apron selling homemade cakes; ' +
      'person wearing a blue t-shirt collecting coins in a box; person wearing a green vest giving out balloons. ' +
      'Bottom row left to right: person wearing a yellow dress counting the money; ' +
      'person wearing a pink shirt painting a charity poster; person wearing an orange cap carrying a donation jar. ' +
      'Charity fair with stalls, banners, balloons, a donation box. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  flyer_l43_volunteer_shelter: {
    prompt:
      'Wide horizontal cartoon illustration of volunteers helping at an animal shelter. ' +
      'COMPOSITION: Six people arranged in a clean 3×2 grid. ' +
      'Top row left to right: person wearing a red jumper feeding a hungry dog; ' +
      'person wearing a blue apron washing a fluffy cat; person wearing a green shirt walking a puppy. ' +
      'Bottom row left to right: person wearing a yellow vest filling the water bowls; ' +
      'person wearing a pink cardigan brushing a rabbit; person wearing orange gloves cleaning a cage. ' +
      'Animal shelter with kennels, pet bowls, a play area. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  flyer_l44_food_festival: {
    prompt:
      'Wide horizontal cartoon illustration of people enjoying an outdoor food festival. ' +
      'COMPOSITION: Six people arranged in a clean 3×2 grid. ' +
      'Top row left to right: person wearing a red apron grilling burgers; ' +
      'person wearing a blue shirt selling fruit smoothies; person wearing a green hat serving a bowl of noodles. ' +
      'Bottom row left to right: person wearing a yellow dress tasting some cheese; ' +
      'person wearing a pink scarf making a pizza; person wearing an orange cap holding an ice cream cone. ' +
      'Outdoor food festival with stalls, flags, picnic tables. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  flyer_l45_eco_project: {
    prompt:
      'Wide horizontal cartoon illustration of students working on a green eco project. ' +
      'COMPOSITION: Six students arranged in a clean 3×2 grid. ' +
      'Top row left to right: student wearing red gloves sorting the recycling; ' +
      'student wearing a blue shirt planting a young tree; student wearing a green vest holding a solar panel. ' +
      'Bottom row left to right: student wearing yellow boots picking up litter; ' +
      'student wearing a pink cap watering the plants; student wearing an orange jumper carrying a compost bin. ' +
      'School garden with recycling bins, young trees, solar panels. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  flyer_l46_space_exhibition: {
    prompt:
      'Wide horizontal cartoon illustration of children exploring a space exhibition. ' +
      'COMPOSITION: Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: child wearing a red spacesuit pointing at a rocket; ' +
      'child wearing a blue jumper looking through a telescope; child wearing a green t-shirt holding a model planet. ' +
      'Bottom row left to right: child wearing a yellow shirt touching a moon rock; ' +
      'child wearing a pink cardigan reading a star map; child wearing an astronaut helmet pressing a control button. ' +
      'Space museum with a rocket model, hanging planets, a telescope. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  flyer_l47_cooking_competition: {
    prompt:
      'Wide horizontal cartoon illustration of young chefs in a cooking competition. ' +
      'COMPOSITION: Six chefs arranged in a clean 3×2 grid. ' +
      'Top row left to right: chef wearing a red chef hat whisking some eggs; ' +
      'chef wearing a blue apron rolling out dough; chef wearing a green shirt decorating a cake. ' +
      'Bottom row left to right: chef wearing a yellow apron chopping vegetables; ' +
      'chef wearing a pink hat tasting the soup; chef wearing an orange scarf presenting a dish to the judges. ' +
      'Competition kitchen with workstations and a judges table. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  flyer_l48_film_making: {
    prompt:
      'Wide horizontal cartoon illustration of a team making a short film on set. ' +
      'COMPOSITION: Six people arranged in a clean 3×2 grid. ' +
      'Top row left to right: person wearing a red cap holding a clapperboard; ' +
      'person wearing a blue jumper filming with a camera; person wearing a green shirt holding a microphone boom. ' +
      'Bottom row left to right: person wearing a yellow vest directing the actors; ' +
      'person wearing a pink scarf adjusting a big light; person wearing an orange t-shirt reading the script. ' +
      'Film set with cameras, lights, a director chair. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  flyer_l49_photography_class: {
    prompt:
      'Wide horizontal cartoon illustration of students learning in a photography class. ' +
      'COMPOSITION: Six students arranged in a clean 3×2 grid. ' +
      'Top row left to right: student wearing a red jumper taking a photo with a camera; ' +
      'student wearing a blue shirt setting up a tripod; student wearing a green cap looking at photos on a screen. ' +
      'Bottom row left to right: student wearing a yellow vest changing a camera lens; ' +
      'student wearing a pink cardigan framing a picture; student wearing an orange scarf printing a photo. ' +
      'Photography studio with cameras, tripods, framed photos. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  flyer_l50_mountain_hiking: {
    prompt:
      'Wide horizontal cartoon illustration of hikers on a long mountain trail. ' +
      'COMPOSITION: Six hikers arranged in a clean 3×2 grid. ' +
      'Top row left to right: hiker wearing a red anorak climbing with a rope; ' +
      'hiker wearing a blue backpack reading a trail map; hiker wearing green boots crossing a rope bridge. ' +
      'Bottom row left to right: hiker wearing a yellow hat looking through binoculars; ' +
      'hiker wearing a pink scarf drinking from a flask; hiker wearing an orange jacket planting a flag at the top. ' +
      'Mountain trail with peaks, a rope bridge, pine trees. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },

  // ─── D-18 Phase 4: Flyers per-level colour outline scenes (L41-L50) ──
  flyer_l41_science_fair_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a science fair scene with 6 elements spread across the wide image: a microscope, a test tube, a robot, a ruler, a magnet, a light bulb. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  flyer_l42_charity_event_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a charity event scene with 6 elements spread across the wide image: a balloon, a cake, a coin, a donation box, a poster, a money jar. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  flyer_l43_volunteer_shelter_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of an animal shelter scene with 6 elements spread across the wide image: a dog, a cat, a rabbit, a bird, a fish, a pet bowl. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  flyer_l44_food_festival_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a food festival scene with 6 elements spread across the wide image: a pizza, a burger, a smoothie cup, a bowl of noodles, a wedge of cheese, a flag. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  flyer_l45_eco_project_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of an eco project scene with 6 elements spread across the wide image: a tree, a recycling bin, a solar panel, a plastic bottle, a watering can, a flower. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  flyer_l46_space_exhibition_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a space scene with 6 elements spread across the wide image: a rocket, a planet with a ring, a star, a moon, a telescope, an astronaut helmet. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  flyer_l47_cooking_competition_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a cooking scene with 6 elements spread across the wide image: a cake, a whisk, a knife, a cooking pot, a chef hat, a mixing bowl. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  flyer_l48_film_making_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a film set scene with 6 elements spread across the wide image: a film camera, a clapperboard, a microphone, a studio light, a script, a director chair. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  flyer_l49_photography_class_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a photography scene with 6 elements spread across the wide image: a camera, a tripod, a framed photo, a camera lens, a picture frame, a bird. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  flyer_l50_mountain_hiking_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a mountain hiking scene with 6 elements spread across the wide image: a mountain, a tent, a flag, a backpack, a coil of rope, a flask. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },

  // ─── D-18 Phase 4b: Flyers per-level drag scenes (L51-L60) ──────────
  flyer_l51_sailing_course: {
    prompt:
      'Wide horizontal cartoon illustration of students learning to sail at a marina. ' +
      'COMPOSITION: Six students arranged in a clean 3×2 grid. ' +
      'Top row left to right: student wearing a red life jacket steering a small boat; ' +
      'student wearing a blue cap raising the sail; student wearing a green shirt tying a rope knot. ' +
      'Bottom row left to right: student wearing a yellow jacket rowing with an oar; ' +
      'student wearing a pink hat checking a compass; student wearing an orange vest throwing a life ring. ' +
      'Marina with sailboats, blue water, a wooden jetty. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  flyer_l52_ancient_museum: {
    prompt:
      'Wide horizontal cartoon illustration of children touring an ancient history museum. ' +
      'COMPOSITION: Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: child wearing a red jumper looking at a mummy; ' +
      'child wearing a blue cardigan studying an old pot; child wearing a green shirt drawing a fossil. ' +
      'Bottom row left to right: child wearing a yellow vest reading a stone tablet; ' +
      'child wearing a pink scarf pointing at a gold mask; child wearing orange glasses examining an old coin. ' +
      'Ancient museum with a mummy case, pottery, stone tablets. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  flyer_l53_drama_festival: {
    prompt:
      'Wide horizontal cartoon illustration of students performing at a drama festival. ' +
      'COMPOSITION: Six students arranged in a clean 3×2 grid. ' +
      'Top row left to right: student wearing a red costume acting on the stage; ' +
      'student wearing a blue cape holding a drama mask; student wearing a green shirt pulling the curtain. ' +
      'Bottom row left to right: student wearing a yellow dress singing into a microphone; ' +
      'student wearing a pink tutu dancing on stage; student wearing an orange shirt reading a script. ' +
      'Theatre stage with red curtains, spotlights, an audience. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  flyer_l54_news_reporter: {
    prompt:
      'Wide horizontal cartoon illustration of a young news team in a TV studio. ' +
      'COMPOSITION: Six people arranged in a clean 3×2 grid. ' +
      'Top row left to right: person wearing a red blazer reading the news; ' +
      'person wearing a blue shirt holding a microphone; person wearing a green jumper filming with a camera. ' +
      'Bottom row left to right: person wearing a yellow vest typing on a laptop; ' +
      'person wearing a pink scarf pointing at a weather map; person wearing an orange tie writing in a notebook. ' +
      'TV news studio with a desk, screens, a camera. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  flyer_l55_job_shadowing: {
    prompt:
      'Wide horizontal cartoon illustration of students shadowing different jobs for a day. ' +
      'COMPOSITION: Six students arranged in a clean 3×2 grid. ' +
      'Top row left to right: student wearing a red apron baking with a chef; ' +
      'student wearing a blue coat helping a doctor; student wearing green overalls fixing a car with a mechanic. ' +
      'Bottom row left to right: student wearing a yellow helmet building with a builder; ' +
      'student wearing a pink shirt teaching with a teacher; student wearing an orange uniform serving with a waiter. ' +
      'Split workplace scene — kitchen, clinic, garage, classroom. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  flyer_l56_time_capsule: {
    prompt:
      'Wide horizontal cartoon illustration of children burying a time capsule in the garden. ' +
      'COMPOSITION: Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: child wearing a red jumper writing a letter; ' +
      'child wearing a blue shirt putting a toy in a box; child wearing a green cap burying the capsule. ' +
      'Bottom row left to right: child wearing a yellow dress holding an old photo; ' +
      'child wearing a pink scarf sealing the lid; child wearing orange gloves digging a hole. ' +
      'Garden with a metal capsule box, a dug hole, a spade. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  flyer_l57_future_career: {
    prompt:
      'Wide horizontal cartoon illustration of children dressed up as their future jobs. ' +
      'COMPOSITION: Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: child wearing a red astronaut suit pretending to be an astronaut; ' +
      'child wearing a blue lab coat pretending to be a scientist; child wearing a green apron pretending to be a chef. ' +
      'Bottom row left to right: child wearing a yellow helmet pretending to be a firefighter; ' +
      'child wearing a pink uniform pretending to be a nurse; child wearing an orange vest pretending to be a pilot. ' +
      'Classroom with a "future jobs" board and drawings. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  flyer_l58_pen_pals: {
    prompt:
      'Wide horizontal cartoon illustration of children writing to pen pals around the world. ' +
      'COMPOSITION: Six children arranged in a clean 3×2 grid. ' +
      'Top row left to right: child wearing a red jumper writing a letter; ' +
      'child wearing a blue shirt reading a postcard; child wearing a green cardigan sticking on a stamp. ' +
      'Bottom row left to right: child wearing a yellow scarf opening an envelope; ' +
      'child wearing a pink hat finding a country on a map; child wearing an orange shirt posting a parcel. ' +
      'Desk with letters, postcards, a world map, stamps. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  flyer_l59_school_olympics: {
    prompt:
      'Wide horizontal cartoon illustration of students competing at the school olympics. ' +
      'COMPOSITION: Six students arranged in a clean 3×2 grid. ' +
      'Top row left to right: student wearing a red kit running a race; ' +
      'student wearing blue shorts jumping over a high bar; student wearing a green vest throwing a javelin. ' +
      'Bottom row left to right: student wearing a yellow shirt winning a gold medal; ' +
      'student wearing a pink headband cheering for the team; student wearing an orange shirt carrying the olympic torch. ' +
      'Sports stadium with a running track, flags, a podium. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },
  flyer_l60_graduation: {
    prompt:
      'Wide horizontal cartoon illustration of students celebrating their graduation day. ' +
      'COMPOSITION: Six students arranged in a clean 3×2 grid. ' +
      'Top row left to right: student wearing a red gown wearing a graduation cap; ' +
      'student wearing a blue gown holding a diploma; student wearing a green gown throwing a cap in the air. ' +
      'Bottom row left to right: student wearing a yellow dress carrying flowers; ' +
      'student wearing a pink scarf taking a photo; student wearing an orange tie shaking hands with the teacher. ' +
      'School hall with a stage, banners, balloons, a podium. Wide 16:9. Flat cartoon, no text.',
    aspect: 'landscape',
  },

  // ─── D-18 Phase 4b: Flyers per-level colour outline scenes (L51-L60) ──
  flyer_l51_sailing_course_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a sailing scene with 6 elements spread across the wide image: a sailing boat, a sail, an oar, a life ring, a flag, a fish. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  flyer_l52_ancient_museum_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of an ancient museum scene with 6 elements spread across the wide image: a mummy, an old vase, a gold mask, a coin, a fossil, a stone tablet. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  flyer_l53_drama_festival_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a theatre scene with 6 elements spread across the wide image: a theatre mask, a stage curtain, a microphone, a ticket, a star, a trophy. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  flyer_l54_news_reporter_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a TV studio scene with 6 elements spread across the wide image: a television, a video camera, a laptop, a microphone, a map, a pen. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  flyer_l55_job_shadowing_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a jobs scene with 6 elements spread across the wide image: a chef hat, a stethoscope, a wrench, a hammer, a safety helmet, a serving tray. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  flyer_l56_time_capsule_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a time capsule scene with 6 elements spread across the wide image: a metal box, a teddy bear, a letter, a photo, a spade, a star. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  flyer_l57_future_career_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a future jobs scene with 6 elements spread across the wide image: a rocket, an aeroplane, a safety helmet, a stethoscope, a microscope, a chef hat. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  flyer_l58_pen_pals_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a pen pals scene with 6 elements spread across the wide image: an envelope, a stamp, a postbox, a parcel, a globe, a pen. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  flyer_l59_school_olympics_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a school olympics scene with 6 elements spread across the wide image: an olympic torch, a medal, a trophy, a flag, a ball, a whistle. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  flyer_l60_graduation_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a graduation scene with 6 elements spread across the wide image: a graduation cap, a diploma scroll, a flower, a balloon, a camera, a cake. Each element well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },

  // ─── D-23: Chinese HSK1 curated drag scenes (L101-L105) ──────────────────
  // Clothing colours MUST follow the 3×2 grid order the audio narrates:
  // top row red/blue/green, bottom row yellow/pink/orange (orange decorative).
  zh_hsk1_l101_park: {
    prompt:
      'Wide horizontal cartoon illustration of Chinese children playing in a sunny park. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt flying a kite; child wearing a blue shirt reading a book; child wearing a green shirt kicking a ball. Bottom row left to right: child wearing a yellow shirt riding a bicycle; child wearing a pink shirt eating an ice cream; child wearing an orange shirt drawing a picture. Park background with green grass, trees, blue sky. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },
  zh_hsk1_l102_home: {
    prompt:
      'Wide horizontal cartoon illustration of a Chinese family at home in the living room. COMPOSITION (most important): Six people arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: person wearing a red shirt cooking; person wearing a blue shirt watching television; person wearing a green shirt reading a book. Bottom row left to right: person wearing a yellow shirt drawing a picture; person wearing a pink shirt playing with a ball; person wearing an orange shirt eating an apple. Cozy living room background with a sofa and a window. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },
  zh_hsk1_l103_clothes: {
    prompt:
      'Wide horizontal cartoon illustration of children at a clothing shop. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red dress holding a hat; child wearing a blue shirt holding a folded shirt; child wearing a green shirt holding a pair of shoes. Bottom row left to right: child wearing a yellow shirt holding a bag; child wearing a pink dress holding an umbrella; child wearing an orange shirt looking at a mirror. Clothing shop background with racks of colorful clothes. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },
  zh_hsk1_l104_animals: {
    prompt:
      'Wide horizontal cartoon illustration of children with pet animals. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt holding a cat; child wearing a blue shirt walking a dog; child wearing a green shirt looking at a fish bowl. Bottom row left to right: child wearing a yellow shirt feeding a bird; child wearing a pink shirt holding a rabbit; child wearing an orange shirt holding a puppy. Friendly pet-corner background with green plants. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },
  zh_hsk1_l105_food: {
    prompt:
      'Wide horizontal cartoon illustration of children at a food market. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt eating an apple; child wearing a blue shirt holding a loaf of bread; child wearing a green shirt drinking water. Bottom row left to right: child wearing a yellow shirt eating a slice of cake; child wearing a pink shirt holding a banana; child wearing an orange shirt holding an orange fruit. Food market background with fruit stalls. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },

  // ─── D-23: Chinese HSK1 colour outline scenes (L101-L105) ────────────────
  zh_hsk1_l101_park_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a park scene with 6 objects spread across the wide image: a ball, a tree, a cat, a bird, a bicycle, a flower. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  zh_hsk1_l102_home_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of a bedroom and living room scene with 6 objects spread across the wide image: a bed, a chair, a table, a lamp, a teddy bear, a window. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  zh_hsk1_l103_clothes_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of clothes spread across the wide image: a shirt, a hat, a dress, an umbrella, a bag, a pair of shoes. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  zh_hsk1_l104_animals_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of animals spread across the wide image: a cat, a dog, a fish, a bird, a rabbit, a tree. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  zh_hsk1_l105_food_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of food spread across the wide image: an apple, a banana, a slice of cake, a loaf of bread, an orange, a bunch of grapes. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },

  // ─── D-23: HSK1 batch 2 drag scenes (L106-110) ───────────────────────────
  zh_hsk1_l106_school: {
    prompt:
      'Wide horizontal cartoon illustration of Chinese children in a school classroom. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt writing in a book; child wearing a blue shirt holding a pen; child wearing a green shirt carrying a schoolbag. Bottom row left to right: child wearing a yellow shirt sitting on a chair; child wearing a pink shirt reading a book; child wearing an orange shirt holding a ball. Classroom background with a blackboard and desks. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },
  zh_hsk1_l107_birthday: {
    prompt:
      'Wide horizontal cartoon illustration of Chinese children at a birthday party. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt holding a birthday cake; child wearing a blue shirt holding balloons; child wearing a green shirt holding a present. Bottom row left to right: child wearing a yellow shirt eating cake; child wearing a pink shirt blowing a party horn; child wearing an orange shirt clapping hands. Party background with balloons and bunting. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },
  zh_hsk1_l108_daily: {
    prompt:
      'Wide horizontal cartoon illustration of Chinese children doing their morning routine. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing red pyjamas waking up by a clock; child wearing a blue shirt brushing teeth; child wearing a green shirt eating breakfast. Bottom row left to right: child wearing a yellow shirt getting dressed; child wearing a pink shirt putting on shoes; child wearing an orange shirt carrying a schoolbag. Home background with a big wall clock. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },
  zh_hsk1_l109_livingroom: {
    prompt:
      'Wide horizontal cartoon illustration of a Chinese family in the living room. COMPOSITION (most important): Six people arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: person wearing a red shirt sitting on a sofa; person wearing a blue shirt watching television; person wearing a green shirt reading at a table. Bottom row left to right: person wearing a yellow shirt turning on a lamp; person wearing a pink shirt using a computer; person wearing an orange shirt sitting on a chair. Cosy living room background. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },
  zh_hsk1_l110_kitchen: {
    prompt:
      'Wide horizontal cartoon illustration of Chinese children eating and drinking in a kitchen. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt holding a bowl of rice; child wearing a blue shirt drinking a glass of water; child wearing a green shirt holding bread. Bottom row left to right: child wearing a yellow shirt eating an apple; child wearing a pink shirt holding a slice of cake; child wearing an orange shirt drinking juice. Kitchen background with a table. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },

  // ─── D-23: HSK1 batch 2 colour outline scenes (L106-110) ─────────────────
  zh_hsk1_l106_school_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of school objects spread across the wide image: a book, a pen, a chair, a ball, a schoolbag, a clock. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  zh_hsk1_l107_birthday_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of objects spread across the wide image: an apple, a ball, a book, a cat, a bird, a flower. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  zh_hsk1_l108_daily_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of objects spread across the wide image: a clock, a sun, a moon, a star, a bed, a lamp. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  zh_hsk1_l109_livingroom_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of living room furniture spread across the wide image: a bed, a chair, a table, a television, a lamp, a computer. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  zh_hsk1_l110_kitchen_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of food and drink spread across the wide image: an apple, a banana, a loaf of bread, a slice of cake, a bowl of rice, a glass of juice. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },

  // ─── D-23: HSK1 batch 3 drag scenes (L111-115) ───────────────────────────
  zh_hsk1_l111_station: {
    prompt:
      'Wide horizontal cartoon illustration of Chinese children at a busy bus and train station. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt waving at a bus; child wearing a blue shirt pointing at a plane in the sky; child wearing a green shirt looking at a boat. Bottom row left to right: child wearing a yellow shirt holding a ticket; child wearing a pink shirt pulling a suitcase; child wearing an orange shirt waiting on a bench. Station background with a clock. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },
  zh_hsk1_l112_toyshop: {
    prompt:
      'Wide horizontal cartoon illustration of Chinese children in a toy shop. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt holding a ball; child wearing a blue shirt flying a kite; child wearing a green shirt hugging a teddy bear. Bottom row left to right: child wearing a yellow shirt banging a drum; child wearing a pink shirt holding a doll; child wearing an orange shirt reading a picture book. Toy shop background with colourful shelves. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },
  zh_hsk1_l113_zoo: {
    prompt:
      'Wide horizontal cartoon illustration of Chinese children visiting the zoo. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt looking at a lion; child wearing a blue shirt watching a monkey; child wearing a green shirt feeding an elephant. Bottom row left to right: child wearing a yellow shirt pointing at a giraffe; child wearing a pink shirt looking at a snake; child wearing an orange shirt watching a penguin. Zoo background with cages and trees. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },
  zh_hsk1_l114_picnic: {
    prompt:
      'Wide horizontal cartoon illustration of Chinese children having a picnic in the park. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt holding a slice of pizza; child wearing a blue shirt eating a burger; child wearing a green shirt holding an ice cream. Bottom row left to right: child wearing a yellow shirt holding a slice of cake; child wearing a pink shirt holding bread; child wearing an orange shirt holding a banana. Park picnic background with a blanket. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },
  zh_hsk1_l115_shop: {
    prompt:
      'Wide horizontal cartoon illustration of Chinese children shopping in a small shop. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt holding some coins; child wearing a blue shirt holding a shopping bag; child wearing a green shirt carrying a box. Bottom row left to right: child wearing a yellow shirt holding a book; child wearing a pink shirt looking at a price tag; child wearing an orange shirt holding a ticket. Shop background with shelves and a counter. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },

  // ─── D-23: HSK1 batch 3 colour outline scenes (L111-115) ─────────────────
  zh_hsk1_l111_station_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of vehicles spread across the wide image: a bus, a plane, a boat, a train, a balloon, a sun. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  zh_hsk1_l112_toyshop_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of toys spread across the wide image: a ball, a kite, a teddy bear, a drum, a doll, a book. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  zh_hsk1_l113_zoo_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of zoo animals spread across the wide image: a lion, a monkey, an elephant, a giraffe, a snake, a penguin. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  zh_hsk1_l114_picnic_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of picnic food spread across the wide image: a slice of pizza, a burger, an ice cream, a slice of cake, a loaf of bread, a banana. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  zh_hsk1_l115_shop_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of shopping items spread across the wide image: a shopping bag, a box, a book, a ticket, some coins, a price tag. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },

  // ─── D-23: HSK1 batch 4 drag scenes (L116-120, review) ───────────────────
  zh_hsk1_l116_schoolfair: {
    prompt:
      'Wide horizontal cartoon illustration of Chinese children at a school fair. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt holding a book; child wearing a blue shirt holding a ball; child wearing a green shirt holding a cat. Bottom row left to right: child wearing a yellow shirt holding an apple; child wearing a pink shirt pointing at a bus; child wearing an orange shirt standing by a tree. School playground background with stalls. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },
  zh_hsk1_l117_myroom: {
    prompt:
      'Wide horizontal cartoon illustration of Chinese children in a tidy bedroom. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt sitting on a bed; child wearing a blue shirt sitting on a chair; child wearing a green shirt turning on a lamp. Bottom row left to right: child wearing a yellow shirt watching television; child wearing a pink shirt holding a teddy bear; child wearing an orange shirt reading a book. Cosy bedroom background. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },
  zh_hsk1_l118_market: {
    prompt:
      'Wide horizontal cartoon illustration of Chinese children at a fruit market. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt holding an apple; child wearing a blue shirt holding a banana; child wearing a green shirt holding bread. Bottom row left to right: child wearing a yellow shirt holding a slice of cake; child wearing a pink shirt holding a glass of juice; child wearing an orange shirt holding some coins. Market stalls background. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },
  zh_hsk1_l119_weekend: {
    prompt:
      'Wide horizontal cartoon illustration of Chinese children on a weekend outing. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt waving at a bus; child wearing a blue shirt pointing at a plane; child wearing a green shirt looking at a boat. Bottom row left to right: child wearing a yellow shirt playing with a ball; child wearing a pink shirt flying a kite; child wearing an orange shirt under the sun. Sunny outdoor background. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },
  zh_hsk1_l120_party: {
    prompt:
      'Wide horizontal cartoon illustration of Chinese children at a celebration party. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt holding a cake; child wearing a blue shirt holding a present; child wearing a green shirt holding a ball. Bottom row left to right: child wearing a yellow shirt holding a cat; child wearing a pink shirt holding a dog; child wearing an orange shirt holding a balloon. Party background with bunting and balloons. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },

  // ─── D-23: HSK1 batch 4 colour outline scenes (L116-120) ─────────────────
  zh_hsk1_l116_schoolfair_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of objects spread across the wide image: a book, a ball, a cat, an apple, a bus, a tree. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  zh_hsk1_l117_myroom_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of bedroom objects spread across the wide image: a bed, a chair, a lamp, a television, a teddy bear, a book. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  zh_hsk1_l118_market_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of market food spread across the wide image: an apple, a banana, a loaf of bread, a slice of cake, a glass of juice, a purse with coins. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  zh_hsk1_l119_weekend_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of objects spread across the wide image: a bus, a plane, a boat, a ball, a kite, a sun. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  zh_hsk1_l120_party_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of party objects spread across the wide image: a cake, a present box, a ball, a cat, a dog, a balloon. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },

  // ─── D-23: HSK2 batch 1 drag scenes (L121-125) ───────────────────────────
  zh_hsk2_l121_sportsday: {
    prompt:
      'Wide horizontal cartoon illustration of Chinese children at a school sports day. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt kicking a football; child wearing a blue shirt holding a basketball; child wearing a green shirt holding a trophy. Bottom row left to right: child wearing a yellow shirt wearing a medal; child wearing a pink shirt blowing a whistle; child wearing an orange shirt running. Sports field background with a running track. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },
  zh_hsk2_l122_music: {
    prompt:
      'Wide horizontal cartoon illustration of Chinese children in a music lesson. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt playing a guitar; child wearing a blue shirt playing a piano; child wearing a green shirt playing drums. Bottom row left to right: child wearing a yellow shirt playing a violin; child wearing a pink shirt playing a trumpet; child wearing an orange shirt singing into a microphone. Music classroom background. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },
  zh_hsk2_l123_zoo: {
    prompt:
      'Wide horizontal cartoon illustration of Chinese children at a zoo. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt looking at a lion; child wearing a blue shirt feeding an elephant; child wearing a green shirt watching a monkey. Bottom row left to right: child wearing a yellow shirt pointing at a giraffe; child wearing a pink shirt looking at a snake; child wearing an orange shirt watching a penguin. Zoo background with enclosures and trees. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },
  zh_hsk2_l124_restaurant: {
    prompt:
      'Wide horizontal cartoon illustration of a Chinese family eating at a restaurant. COMPOSITION (most important): Six people arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: person wearing a red shirt eating pizza; person wearing a blue shirt eating a burger; person wearing a green shirt eating noodles. Bottom row left to right: person wearing a yellow shirt drinking juice; person wearing a pink shirt eating an ice cream; person wearing an orange shirt eating soup. Restaurant background with tables. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },
  zh_hsk2_l125_travel: {
    prompt:
      'Wide horizontal cartoon illustration of Chinese children going travelling at an airport. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt boarding a plane; child wearing a blue shirt getting on a bus; child wearing a green shirt on a boat. Bottom row left to right: child wearing a yellow shirt pulling a suitcase; child wearing a pink shirt holding a ticket; child wearing an orange shirt reading a map. Airport background. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },

  // ─── D-23: HSK2 batch 1 colour outline scenes (L121-125) ─────────────────
  zh_hsk2_l121_sportsday_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of sports objects spread across the wide image: a football, a basketball, a trophy, a medal, a whistle, a flag. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  zh_hsk2_l122_music_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of musical instruments spread across the wide image: a guitar, a piano, a drum, a violin, a trumpet, a music note. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  zh_hsk2_l123_zoo_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of zoo animals spread across the wide image: a lion, an elephant, a monkey, a giraffe, a snake, a penguin. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  zh_hsk2_l124_restaurant_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of restaurant food spread across the wide image: a slice of pizza, a burger, a bowl of noodles, a glass of juice, an ice cream, a bowl of soup. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  zh_hsk2_l125_travel_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of travel objects spread across the wide image: a plane, a bus, a boat, a suitcase, a ticket, a map. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },

  // ─── D-23: HSK2 batch 2 drag scenes (L126-130) ───────────────────────────
  zh_hsk2_l126_week: {
    prompt:
      'Wide horizontal cartoon illustration of Chinese children during a school week. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt getting on a bus; child wearing a blue shirt playing with a ball; child wearing a green shirt reading a book. Bottom row left to right: child wearing a yellow shirt eating an apple; child wearing a pink shirt sleeping in a bed; child wearing an orange shirt waking up by a clock. Simple home and street background. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },
  zh_hsk2_l127_doctor: {
    prompt:
      'Wide horizontal cartoon illustration of Chinese children at a doctor\'s clinic. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt seeing a doctor with a stethoscope; child wearing a blue shirt taking a pill; child wearing a green shirt with a bandage. Bottom row left to right: child wearing a yellow shirt holding a thermometer; child wearing a pink shirt lying on a bed; child wearing an orange shirt near an ambulance. Clinic background. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },
  zh_hsk2_l128_cooking: {
    prompt:
      'Wide horizontal cartoon illustration of Chinese children cooking in a kitchen. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt wearing a chef hat; child wearing a blue shirt using a whisk; child wearing a green shirt holding a knife. Bottom row left to right: child wearing a yellow shirt making a pizza; child wearing a pink shirt making a cake; child wearing an orange shirt cooking soup. Kitchen background. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },
  zh_hsk2_l129_space: {
    prompt:
      'Wide horizontal cartoon illustration of Chinese children at a space exhibition. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt holding a model rocket; child wearing a blue shirt looking through a telescope; child wearing a green shirt holding a planet model. Bottom row left to right: child wearing a yellow shirt wearing an astronaut helmet; child wearing a pink shirt pointing at a star; child wearing an orange shirt pointing at the moon. Space museum background. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },
  zh_hsk2_l130_seaside: {
    prompt:
      'Wide horizontal cartoon illustration of Chinese children at the seaside. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt on a small boat; child wearing a blue shirt holding a life ring; child wearing a green shirt holding an oar. Bottom row left to right: child wearing a yellow shirt holding a fish; child wearing a pink shirt holding a bucket; child wearing an orange shirt holding a fishing rod. Beach and sea background. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },

  // ─── D-23: HSK2 batch 2 colour outline scenes (L126-130) ─────────────────
  zh_hsk2_l126_week_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of objects spread across the wide image: a bus, a ball, a book, an apple, a bed, a clock. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  zh_hsk2_l127_doctor_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of objects spread across the wide image: a hospital bed, a pill, a bandage, a thermometer, an ambulance, a flower. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  zh_hsk2_l128_cooking_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of objects spread across the wide image: a chef hat, a whisk, a knife, a pizza, a cake, a bowl of soup. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  zh_hsk2_l129_space_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of objects spread across the wide image: a rocket, a telescope, a planet, an astronaut helmet, a star, a moon. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  zh_hsk2_l130_seaside_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of objects spread across the wide image: a boat, a life ring, an oar, a fish, a bucket, a fishing rod. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },

  // ─── D-23: HSK2 batch 3 drag scenes (L131-135) ───────────────────────────
  zh_hsk2_l131_petshop: {
    prompt:
      'Wide horizontal cartoon illustration of Chinese children at a pet shop. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt holding a cat; child wearing a blue shirt with a dog; child wearing a green shirt holding a rabbit. Bottom row left to right: child wearing a yellow shirt looking at a bird; child wearing a pink shirt by a fish bowl; child wearing an orange shirt holding a bone. Pet shop background. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },
  zh_hsk2_l132_artclass: {
    prompt:
      'Wide horizontal cartoon illustration of Chinese children in an art class. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt at an easel; child wearing a blue shirt with a paintbrush; child wearing a green shirt holding a palette. Bottom row left to right: child wearing a yellow shirt holding a picture frame; child wearing a pink shirt looking at a painting; child wearing an orange shirt looking at a statue. Art studio background. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },
  zh_hsk2_l133_photo: {
    prompt:
      'Wide horizontal cartoon illustration of Chinese children in a photography class. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt holding a camera; child wearing a blue shirt holding a video camera; child wearing a green shirt holding a photo. Bottom row left to right: child wearing a yellow shirt with a tripod; child wearing a pink shirt holding a camera lens; child wearing an orange shirt holding a clapperboard. Photo studio background. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },
  zh_hsk2_l134_garden: {
    prompt:
      'Wide horizontal cartoon illustration of Chinese children working in a garden. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt holding a spade; child wearing a blue shirt with a watering can; child wearing a green shirt pushing a wheelbarrow. Bottom row left to right: child wearing a yellow shirt holding a flowerpot; child wearing a pink shirt planting a tree; child wearing an orange shirt holding a flower. Garden background. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },
  zh_hsk2_l135_postoffice: {
    prompt:
      'Wide horizontal cartoon illustration of Chinese children at a post office. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt holding a parcel; child wearing a blue shirt holding an envelope; child wearing a green shirt sticking on a stamp. Bottom row left to right: child wearing a yellow shirt using a weighing scale; child wearing a pink shirt by a postbox; child wearing an orange shirt holding a pen. Post office background. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },

  // ─── D-23: HSK2 batch 3 colour outline scenes (L131-135) ─────────────────
  zh_hsk2_l131_petshop_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of objects spread across the wide image: a cat, a dog, a rabbit, a bird, a fish, a bone. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  zh_hsk2_l132_artclass_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of objects spread across the wide image: an easel, a paintbrush, a paint palette, a picture frame, a painting, a statue. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  zh_hsk2_l133_photo_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of objects spread across the wide image: a camera, a video camera, a photo, a tripod, a camera lens, a clapperboard. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  zh_hsk2_l134_garden_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of objects spread across the wide image: a spade, a watering can, a wheelbarrow, a flowerpot, a tree, a flower. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  zh_hsk2_l135_postoffice_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of objects spread across the wide image: a parcel, an envelope, a stamp, a weighing scale, a postbox, a pen. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },

  // ─── D-23: HSK2 batch 4 drag scenes (L136-140) ───────────────────────────
  zh_hsk2_l136_fixing: {
    prompt:
      'Wide horizontal cartoon illustration of Chinese children fixing and building things. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt holding a wrench; child wearing a blue shirt holding a hammer; child wearing a green shirt climbing a ladder. Bottom row left to right: child wearing a yellow shirt carrying a bucket; child wearing a pink shirt holding a paintbrush; child wearing an orange shirt carrying a box. Workshop background. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },
  zh_hsk2_l137_birthday: {
    prompt:
      'Wide horizontal cartoon illustration of Chinese children at a birthday party. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt holding a cake; child wearing a blue shirt holding a present; child wearing a green shirt banging a drum. Bottom row left to right: child wearing a yellow shirt waving a flag; child wearing a pink shirt with a star lantern; child wearing an orange shirt playing with a ball. Party background with decorations. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },
  zh_hsk2_l138_cinema: {
    prompt:
      'Wide horizontal cartoon illustration of Chinese children at a cinema. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt holding popcorn; child wearing a blue shirt wearing 3D glasses; child wearing a green shirt looking at a big screen. Bottom row left to right: child wearing a yellow shirt holding a ticket; child wearing a pink shirt drinking juice; child wearing an orange shirt eating an ice cream. Cinema background with seats. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },
  zh_hsk2_l139_airport: {
    prompt:
      'Wide horizontal cartoon illustration of Chinese children at an airport. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt boarding a plane; child wearing a blue shirt pulling a suitcase; child wearing a green shirt holding a ticket. Bottom row left to right: child wearing a yellow shirt reading a map; child wearing a pink shirt holding a globe; child wearing an orange shirt using a compass. Airport terminal background. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },
  zh_hsk2_l140_review: {
    prompt:
      'Wide horizontal cartoon illustration of Chinese children with many different hobbies. COMPOSITION (most important): Six children arranged in a clean 3×2 grid (three columns, two rows), each in their own area with empty space around them so they do not overlap. Top row left to right: child wearing a red shirt kicking a football; child wearing a blue shirt playing a guitar; child wearing a green shirt looking at a toy lion. Bottom row left to right: child wearing a yellow shirt holding a pizza; child wearing a pink shirt holding a toy plane; child wearing an orange shirt holding a camera. Playful background. Wide 16:9 aspect ratio. Flat cartoon design, vibrant colors, kid-friendly style, thick outlines, no text, no words.',
    aspect: 'landscape',
  },

  // ─── D-23: HSK2 batch 4 colour outline scenes (L136-140) ─────────────────
  zh_hsk2_l136_fixing_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of objects spread across the wide image: a wrench, a hammer, a ladder, a bucket, a paintbrush, a box. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  zh_hsk2_l137_birthday_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of objects spread across the wide image: a cake, a present box, a drum, a flag, a star, a ball. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  zh_hsk2_l138_cinema_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of objects spread across the wide image: a bucket of popcorn, 3D glasses, a cinema screen, a ticket, a glass of juice, an ice cream. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  zh_hsk2_l139_airport_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of objects spread across the wide image: a plane, a suitcase, a ticket, a map, a globe, a compass. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
  zh_hsk2_l140_review_outline: {
    prompt:
      'Wide horizontal black and white line art coloring page for kids. Simple outline drawing of objects spread across the wide image: a football, a guitar, a lion, a pizza, a plane, a camera. Each object well separated, no overlap. Thick black outlines on pure white background. Wide 16:9 aspect ratio. No fills, no shading, no text. Coloring book style.',
    aspect: 'landscape',
  },
};

/** Validate that a sceneId is in the registry. */
export function isValidSceneId(id: string): id is SceneId {
  return (SCENE_IDS as readonly string[]).includes(id);
}
