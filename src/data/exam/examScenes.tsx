/**
 * SVG scene library for exam questions.
 *
 * Each scene is a JSX component returning an inline SVG with:
 *   - A consistent viewBox of "0 0 1000 500"
 *   - Painted cartoon characters/objects (where the scene is colored)
 *   - OR outline-only versions (where the scene is for the colour part)
 *
 * Why inline SVG instead of image files:
 *   - No asset bundling — extension stays small (no static images to ship)
 *   - Scenes scale crisply at any size
 *   - Drop zones / colorable regions can reference SVG element IDs directly
 *   - Future: animations on hover, dynamic recoloring, etc.
 *
 * Trade-off: scenes are simpler than what professional Cambridge artwork
 * looks like. We use bold geometric shapes, emoji-as-faces, and saturated
 * colors to keep visual density high enough that kids can identify each
 * character without needing pixel-perfect anatomy.
 */

import type { ReactNode } from 'react';

/** All scene IDs declared in this file. Used by data files for safe refs. */
export type SceneId =
  | 'park_kids'
  | 'park_kids_outline'
  | 'beach_family'
  | 'beach_family_outline'
  | 'classroom'
  | 'classroom_outline'
  | 'kitchen'
  | 'pet_girl'
  | 'farm_scene'
  | 'farm_scene_outline'
  | 'bedroom'
  | 'garden_objects'
  | 'garden_objects_outline';

/**
 * Fetch the JSX for a given scene. Returns null if scene unknown — caller
 * shows a placeholder. We don't throw because data files are user-editable
 * and we want graceful degradation rather than a white screen.
 */
export function getScene(id: string): ReactNode | null {
  switch (id) {
    case 'park_kids':            return <ParkKidsScene />;
    case 'park_kids_outline':    return <ParkKidsScene outline />;
    case 'beach_family':         return <BeachFamilyScene />;
    case 'beach_family_outline': return <BeachFamilyScene outline />;
    case 'classroom':            return <ClassroomScene />;
    case 'classroom_outline':    return <ClassroomScene outline />;
    case 'kitchen':              return <KitchenScene />;
    case 'pet_girl':             return <PetGirlScene />;
    case 'farm_scene':           return <FarmScene />;
    case 'farm_scene_outline':   return <FarmScene outline />;
    case 'bedroom':              return <BedroomScene />;
    case 'garden_objects':       return <GardenObjectsScene />;
    case 'garden_objects_outline': return <GardenObjectsScene outline />;
    default:                     return null;
  }
}

// ─── Helpers for outline mode ───────────────────────────────────────────

/**
 * Stroke-only attributes for outline (colour-the-picture) variants.
 *
 * Only returns stroke + strokeWidth — `fill` is left for the caller to
 * specify per-element via `fill={outline ? 'none' : '#color'}`. Returning
 * `fill` here would conflict with the explicit fill attribute on each SVG
 * element when spread (TS2783 "specified more than once").
 */
function strokes(outline: boolean) {
  return {
    stroke: outline ? '#1f2937' : undefined,
    strokeWidth: outline ? 2 : undefined,
  } as const;
}

// ─── Scene 1: Park with 6 kids playing ─────────────────────────────────

/**
 * Park scene — 6 distinct characters spread across the scene:
 *   - kid1 (left, by tree, with kite, gray hair, red shirt)
 *   - kid2 (center-left, with bicycle, blue shirt)
 *   - kid3 (center, walking with red ball)
 *   - kid4 (center-right, on a bench reading, blonde)
 *   - kid5 (right, with cat, pink hat)
 *   - kid6 (far-left bottom, drawing, green hair)
 *
 * Scene also has decoration: trees, sun, clouds, kite, dog. Drop zones for
 * the drag-name part overlay each kid's location (see the data file).
 */
function ParkKidsScene({ outline = false }: { outline?: boolean }) {
  const s = strokes(outline);
  return (
    <svg viewBox="0 0 1000 500" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Sky */}
      <rect x="0" y="0" width="1000" height="320" fill={outline ? 'transparent' : '#a3d9ff'} />
      {/* Ground */}
      <rect x="0" y="320" width="1000" height="180" fill={outline ? 'transparent' : '#8fd47a'} />
      {/* Path */}
      <path d="M 460 500 Q 500 400 600 380 T 800 320 L 850 320 L 850 500 Z"
        fill={outline ? 'none' : '#d4a574'} {...s} />

      {/* Sun */}
      <circle cx="850" cy="80" r="40" fill={outline ? 'none' : '#ffd54a'} {...s} />
      {/* Clouds */}
      <ellipse cx="200" cy="80" rx="55" ry="22" fill={outline ? 'none' : '#fff'} {...s} />
      <ellipse cx="600" cy="60" rx="45" ry="18" fill={outline ? 'none' : '#fff'} {...s} />

      {/* Big tree left */}
      <rect x="60" y="240" width="20" height="100" fill={outline ? 'none' : '#7c4a2f'} {...s} />
      <circle cx="70" cy="220" r="55" fill={outline ? 'none' : '#3d8b3d'} {...s} />

      {/* Big tree right */}
      <rect x="900" y="220" width="22" height="120" fill={outline ? 'none' : '#7c4a2f'} {...s} />
      <circle cx="911" cy="200" r="60" fill={outline ? 'none' : '#3d8b3d'} {...s} />

      {/* Kite (held by kid1) */}
      <polygon points="180,100 200,140 180,180 160,140" fill={outline ? 'none' : '#e85a8c'} {...s} />
      <line x1="180" y1="180" x2="155" y2="265" stroke="#444" strokeWidth="1.5" />

      {/* ────── Characters ────── */}

      {/* kid1 — gray hair, red shirt, holding kite (left) */}
      <g id="kid1">
        <circle cx="155" cy="270" r="18" fill={outline ? 'none' : '#fce5c0'} {...s} />
        <path d="M 137 264 Q 155 240 173 264 Z" fill={outline ? 'none' : '#7a7a7a'} {...s} />
        <rect x="142" y="288" width="26" height="40" fill={outline ? 'none' : '#dc2626'} {...s} />
        <rect x="142" y="328" width="11" height="28" fill={outline ? 'none' : '#1e3a8a'} {...s} />
        <rect x="157" y="328" width="11" height="28" fill={outline ? 'none' : '#1e3a8a'} {...s} />
      </g>

      {/* kid2 — orange hair, on bicycle, yellow shirt (mid-left) */}
      <g id="kid2">
        {/* Bike */}
        <circle cx="290" cy="320" r="22" fill="none" stroke={outline ? '#1f2937' : '#222'} strokeWidth="3" />
        <circle cx="345" cy="320" r="22" fill="none" stroke={outline ? '#1f2937' : '#222'} strokeWidth="3" />
        <line x1="290" y1="320" x2="320" y2="290" stroke={outline ? '#1f2937' : '#222'} strokeWidth="3" />
        <line x1="345" y1="320" x2="325" y2="285" stroke={outline ? '#1f2937' : '#222'} strokeWidth="3" />
        {/* Body on bike */}
        <circle cx="320" cy="252" r="16" fill={outline ? 'none' : '#fce5c0'} {...s} />
        <path d="M 305 244 Q 320 224 335 244 Z" fill={outline ? 'none' : '#e87a3e'} {...s} />
        <rect x="308" y="268" width="24" height="22" fill={outline ? 'none' : '#facc15'} {...s} />
      </g>

      {/* kid3 — blue hair, with red ball (center, walking on path) */}
      <g id="kid3">
        <circle cx="500" cy="335" r="17" fill={outline ? 'none' : '#fce5c0'} {...s} />
        <path d="M 484 327 Q 500 308 516 327 Z" fill={outline ? 'none' : '#3b82f6'} {...s} />
        <rect x="488" y="350" width="24" height="36" fill={outline ? 'none' : '#dc2626'} {...s} />
        <rect x="488" y="386" width="10" height="22" fill={outline ? 'none' : '#facc15'} {...s} />
        <rect x="502" y="386" width="10" height="22" fill={outline ? 'none' : '#facc15'} {...s} />
        {/* Ball in hand */}
        <circle cx="525" cy="362" r="10" fill={outline ? 'none' : '#dc2626'} {...s} />
      </g>

      {/* kid4 — blonde hair, on bench, blue overalls (mid-right) */}
      <g id="kid4">
        {/* Bench */}
        <rect x="700" y="305" width="100" height="8" fill={outline ? 'none' : '#a16f3a'} {...s} />
        <rect x="708" y="313" width="6" height="35" fill={outline ? 'none' : '#a16f3a'} {...s} />
        <rect x="786" y="313" width="6" height="35" fill={outline ? 'none' : '#a16f3a'} {...s} />
        {/* Kid */}
        <circle cx="755" cy="280" r="16" fill={outline ? 'none' : '#fce5c0'} {...s} />
        <path d="M 740 274 Q 755 254 770 274 Z" fill={outline ? 'none' : '#fde047'} {...s} />
        <rect x="744" y="296" width="22" height="32" fill={outline ? 'none' : '#3b82f6'} {...s} />
      </g>

      {/* kid5 — pink hat, by water (far right) */}
      <g id="kid5">
        <circle cx="900" cy="370" r="16" fill={outline ? 'none' : '#fce5c0'} {...s} />
        <ellipse cx="900" cy="356" rx="18" ry="8" fill={outline ? 'none' : '#ec4899'} {...s} />
        <rect x="888" y="386" width="24" height="32" fill={outline ? 'none' : '#a78bfa'} {...s} />
        <rect x="888" y="418" width="10" height="22" fill={outline ? 'none' : '#1e3a8a'} {...s} />
        <rect x="902" y="418" width="10" height="22" fill={outline ? 'none' : '#1e3a8a'} {...s} />
        {/* Pond */}
        <ellipse cx="940" cy="450" rx="55" ry="14" fill={outline ? 'none' : '#3b82f6'} {...s} />
      </g>

      {/* kid6 — green hair, drawing on paper (bottom-left) */}
      <g id="kid6">
        {/* Paper */}
        <rect x="100" y="425" width="60" height="42" fill={outline ? 'none' : '#fff'} {...s} />
        {/* Kid */}
        <circle cx="80" cy="395" r="16" fill={outline ? 'none' : '#fce5c0'} {...s} />
        <path d="M 64 388 Q 80 366 96 388 Z" fill={outline ? 'none' : '#10b981'} {...s} />
        <rect x="68" y="411" width="24" height="32" fill={outline ? 'none' : '#a78bfa'} {...s} />
      </g>

      {/* Dog running */}
      <g id="dog">
        <ellipse cx="630" cy="380" rx="24" ry="14" fill={outline ? 'none' : '#fff'} {...s} />
        <circle cx="650" cy="370" r="10" fill={outline ? 'none' : '#fff'} {...s} />
        <circle cx="652" cy="367" r="2" fill="#222" />
        <line x1="610" y1="380" x2="600" y2="386" stroke={outline ? '#1f2937' : '#444'} strokeWidth="2" />
      </g>
    </svg>
  );
}

// ─── Scene 2: Beach with family ─────────────────────────────────────────

function BeachFamilyScene({ outline = false }: { outline?: boolean }) {
  const s = strokes(outline);
  return (
    <svg viewBox="0 0 1000 500" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Sky */}
      <rect x="0" y="0" width="1000" height="280" fill={outline ? 'transparent' : '#87ceeb'} />
      {/* Sea */}
      <rect x="0" y="280" width="1000" height="80" fill={outline ? 'transparent' : '#1e90ff'} />
      {/* Sand */}
      <rect x="0" y="360" width="1000" height="140" fill={outline ? 'transparent' : '#f4d3a8'} />

      {/* Sun */}
      <circle cx="850" cy="90" r="42" fill={outline ? 'none' : '#fbbf24'} {...s} />
      {/* Cloud */}
      <ellipse cx="200" cy="80" rx="60" ry="22" fill={outline ? 'none' : '#fff'} {...s} />

      {/* Boat far on sea */}
      <polygon points="700,290 760,290 750,310 710,310" fill={outline ? 'none' : '#92400e'} {...s} />
      <polygon points="730,260 730,290 760,290" fill={outline ? 'none' : '#fff'} {...s} />

      {/* Umbrella */}
      <line x1="500" y1="380" x2="500" y2="280" stroke={outline ? '#1f2937' : '#444'} strokeWidth="3" />
      <path d="M 430 280 Q 500 240 570 280 Z" fill={outline ? 'none' : '#dc2626'} {...s} />

      {/* Person 1 — under umbrella, reading */}
      <g id="person1">
        <circle cx="500" cy="395" r="15" fill={outline ? 'none' : '#fce5c0'} {...s} />
        <path d="M 485 390 Q 500 372 515 390 Z" fill={outline ? 'none' : '#5d4037'} {...s} />
        <rect x="488" y="410" width="24" height="34" fill={outline ? 'none' : '#fbbf24'} {...s} />
        <rect x="475" y="432" width="40" height="6" fill={outline ? 'none' : '#fff'} {...s} />
      </g>

      {/* Person 2 — building sandcastle */}
      <g id="person2">
        <circle cx="220" cy="400" r="14" fill={outline ? 'none' : '#fce5c0'} {...s} />
        <path d="M 207 395 Q 220 379 233 395 Z" fill={outline ? 'none' : '#fbbf24'} {...s} />
        <rect x="208" y="414" width="22" height="28" fill={outline ? 'none' : '#3b82f6'} {...s} />
        {/* Sandcastle */}
        <rect x="170" y="432" width="40" height="30" fill={outline ? 'none' : '#a16207'} {...s} />
        <polygon points="170,432 190,415 210,432" fill={outline ? 'none' : '#a16207'} {...s} />
      </g>

      {/* Person 3 — playing with ball */}
      <g id="person3">
        <circle cx="370" cy="395" r="14" fill={outline ? 'none' : '#fce5c0'} {...s} />
        <path d="M 357 390 Q 370 374 383 390 Z" fill={outline ? 'none' : '#1f2937'} {...s} />
        <rect x="358" y="409" width="22" height="30" fill={outline ? 'none' : '#10b981'} {...s} />
        {/* Ball */}
        <circle cx="395" cy="430" r="10" fill={outline ? 'none' : '#dc2626'} {...s} />
      </g>

      {/* Person 4 — swimming in sea */}
      <g id="person4">
        <circle cx="700" cy="320" r="12" fill={outline ? 'none' : '#fce5c0'} {...s} />
        <path d="M 690 316 Q 700 304 710 316 Z" fill={outline ? 'none' : '#a78bfa'} {...s} />
      </g>

      {/* Person 5 — sitting on towel */}
      <g id="person5">
        <rect x="60" y="430" width="80" height="40" fill={outline ? 'none' : '#ec4899'} {...s} />
        <circle cx="100" cy="410" r="14" fill={outline ? 'none' : '#fce5c0'} {...s} />
        <path d="M 86 405 Q 100 388 114 405 Z" fill={outline ? 'none' : '#facc15'} {...s} />
      </g>

      {/* Bird */}
      <path d="M 620 130 Q 630 122 640 130 Q 650 122 660 130" fill="none" stroke="#1f2937" strokeWidth="2" />
    </svg>
  );
}

// ─── Scene 3: Classroom ─────────────────────────────────────────────────

function ClassroomScene({ outline = false }: { outline?: boolean }) {
  const s = strokes(outline);
  return (
    <svg viewBox="0 0 1000 500" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Wall */}
      <rect x="0" y="0" width="1000" height="320" fill={outline ? 'transparent' : '#fef3c7'} />
      {/* Floor */}
      <rect x="0" y="320" width="1000" height="180" fill={outline ? 'transparent' : '#a16207'} />

      {/* Blackboard */}
      <rect x="380" y="60" width="240" height="140" fill={outline ? 'none' : '#166534'} {...s} />
      <rect x="376" y="56" width="248" height="148" fill="none" stroke={outline ? '#1f2937' : '#7c3a0e'} strokeWidth="6" />
      <text x="500" y="135" fontSize="40" fill={outline ? '#1f2937' : '#fff'} textAnchor="middle">ABC</text>

      {/* Teacher (right of board) */}
      <g id="teacher">
        <circle cx="700" cy="240" r="20" fill={outline ? 'none' : '#fce5c0'} {...s} />
        <path d="M 680 232 Q 700 208 720 232 Z" fill={outline ? 'none' : '#7c3a0e'} {...s} />
        <rect x="685" y="262" width="30" height="50" fill={outline ? 'none' : '#3b82f6'} {...s} />
        <rect x="685" y="312" width="14" height="34" fill={outline ? 'none' : '#1e3a8a'} {...s} />
        <rect x="701" y="312" width="14" height="34" fill={outline ? 'none' : '#1e3a8a'} {...s} />
      </g>

      {/* Desks + students (3 rows) */}
      {[
        { id: 'student1', x: 130, hair: '#7a7a7a', shirt: '#dc2626' },
        { id: 'student2', x: 250, hair: '#fbbf24', shirt: '#10b981' },
        { id: 'student3', x: 370, hair: '#7c3a0e', shirt: '#a78bfa' },
      ].map((stu) => (
        <g id={stu.id} key={stu.id}>
          {/* Desk */}
          <rect x={stu.x - 30} y="380" width="60" height="40" fill={outline ? 'none' : '#d6a675'} {...s} />
          {/* Student */}
          <circle cx={stu.x} cy="350" r="14" fill={outline ? 'none' : '#fce5c0'} {...s} />
          <path d={`M ${stu.x - 14} 345 Q ${stu.x} 327 ${stu.x + 14} 345 Z`} fill={outline ? 'none' : stu.hair} {...s} />
          <rect x={stu.x - 12} y="365" width="24" height="20" fill={outline ? 'none' : stu.shirt} {...s} />
        </g>
      ))}
    </svg>
  );
}

// ─── Scene 4: Kitchen ───────────────────────────────────────────────────

function KitchenScene({ outline = false }: { outline?: boolean }) {
  const s = strokes(outline);
  return (
    <svg viewBox="0 0 1000 500" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="0" y="0" width="1000" height="320" fill={outline ? 'transparent' : '#fce7f3'} />
      <rect x="0" y="320" width="1000" height="180" fill={outline ? 'transparent' : '#fed7aa'} />

      {/* Window */}
      <rect x="120" y="60" width="160" height="120" fill={outline ? 'none' : '#bae6fd'} {...s} />
      <line x1="200" y1="60" x2="200" y2="180" stroke={outline ? '#1f2937' : '#1f2937'} strokeWidth="3" />
      <line x1="120" y1="120" x2="280" y2="120" stroke={outline ? '#1f2937' : '#1f2937'} strokeWidth="3" />

      {/* Countertop */}
      <rect x="100" y="280" width="800" height="20" fill={outline ? 'none' : '#92400e'} {...s} />

      {/* Fridge */}
      <rect x="120" y="200" width="120" height="80" fill={outline ? 'none' : '#e5e7eb'} {...s} />
      <line x1="120" y1="240" x2="240" y2="240" stroke={outline ? '#1f2937' : '#1f2937'} strokeWidth="2" />

      {/* Stove */}
      <rect x="380" y="240" width="120" height="40" fill={outline ? 'none' : '#1f2937'} {...s} />
      <circle cx="420" cy="260" r="10" fill={outline ? 'none' : '#dc2626'} {...s} />
      <circle cx="460" cy="260" r="10" fill={outline ? 'none' : '#dc2626'} {...s} />

      {/* Cake on counter */}
      <rect x="640" y="250" width="60" height="30" fill={outline ? 'none' : '#fbcfe8'} {...s} />
      <circle cx="660" cy="245" r="3" fill={outline ? 'none' : '#dc2626'} {...s} />
      <circle cx="680" cy="245" r="3" fill={outline ? 'none' : '#dc2626'} {...s} />

      {/* Person cooking */}
      <g id="cook">
        <circle cx="800" cy="240" r="18" fill={outline ? 'none' : '#fce5c0'} {...s} />
        <ellipse cx="800" cy="223" rx="20" ry="8" fill={outline ? 'none' : '#fff'} {...s} />
        <rect x="785" y="262" width="30" height="50" fill={outline ? 'none' : '#fff'} {...s} />
      </g>
    </svg>
  );
}

// ─── Scene 5: Pet girl ──────────────────────────────────────────────────

/** Single character holding a pet — used for write/listen examples. */
function PetGirlScene() {
  return (
    <svg viewBox="0 0 1000 500" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="0" y="0" width="1000" height="500" fill="#dbeafe" />
      <ellipse cx="500" cy="500" rx="400" ry="80" fill="#a3a3a3" opacity="0.3" />

      {/* Girl sitting */}
      <g id="girl">
        <circle cx="500" cy="220" r="55" fill="#fce5c0" />
        <path d="M 446 230 Q 500 130 555 230 L 545 240 L 460 240 Z" fill="#7c3a0e" />
        {/* Eyes */}
        <circle cx="485" cy="220" r="4" fill="#1f2937" />
        <circle cx="515" cy="220" r="4" fill="#1f2937" />
        {/* Smile */}
        <path d="M 480 240 Q 500 252 520 240" fill="none" stroke="#1f2937" strokeWidth="2" />
        {/* Hair bow */}
        <circle cx="540" cy="180" r="8" fill="#facc15" />
        {/* Body — dress */}
        <path d="M 440 280 L 560 280 L 590 460 L 410 460 Z" fill="#06b6d4" />
        {/* Legs */}
        <rect x="450" y="430" width="30" height="40" fill="#fce5c0" />
        <rect x="520" y="430" width="30" height="40" fill="#fce5c0" />
        {/* Cat in lap */}
        <ellipse cx="500" cy="380" rx="55" ry="40" fill="#f97316" />
        <circle cx="465" cy="370" r="22" fill="#f97316" />
        <polygon points="448,358 458,340 468,360" fill="#f97316" />
        <polygon points="478,358 488,340 470,360" fill="#f97316" />
        <circle cx="458" cy="370" r="3" fill="#1f2937" />
        <circle cx="472" cy="370" r="3" fill="#1f2937" />
        {/* Stripes on cat */}
        <path d="M 480 380 L 510 380 M 485 392 L 515 392" stroke="#92400e" strokeWidth="2" />
        {/* Cat food bowl */}
        <ellipse cx="380" cy="430" rx="30" ry="10" fill="#3b82f6" />
        <ellipse cx="380" cy="425" rx="25" ry="6" fill="#fbbf24" />
      </g>
    </svg>
  );
}

// ─── Scene 6: Farm ──────────────────────────────────────────────────────

function FarmScene({ outline = false }: { outline?: boolean }) {
  const s = strokes(outline);
  return (
    <svg viewBox="0 0 1000 500" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="0" y="0" width="1000" height="280" fill={outline ? 'transparent' : '#a3d9ff'} />
      <rect x="0" y="280" width="1000" height="220" fill={outline ? 'transparent' : '#84cc16'} />

      {/* Sun */}
      <circle cx="850" cy="80" r="40" fill={outline ? 'none' : '#fbbf24'} {...s} />

      {/* Barn */}
      <rect x="100" y="180" width="200" height="160" fill={outline ? 'none' : '#dc2626'} {...s} />
      <polygon points="100,180 200,100 300,180" fill={outline ? 'none' : '#7f1d1d'} {...s} />
      <rect x="170" y="240" width="60" height="100" fill={outline ? 'none' : '#92400e'} {...s} />

      {/* Cow */}
      <g id="cow">
        <ellipse cx="500" cy="380" rx="60" ry="32" fill={outline ? 'none' : '#fff'} {...s} />
        <circle cx="555" cy="365" r="22" fill={outline ? 'none' : '#fff'} {...s} />
        <ellipse cx="500" cy="380" rx="20" ry="14" fill={outline ? 'none' : '#1f2937'} {...s} />
        <line x1="450" y1="406" x2="450" y2="430" stroke={outline ? '#1f2937' : '#1f2937'} strokeWidth="3" />
        <line x1="540" y1="406" x2="540" y2="430" stroke={outline ? '#1f2937' : '#1f2937'} strokeWidth="3" />
      </g>

      {/* Pig */}
      <g id="pig">
        <ellipse cx="700" cy="395" rx="42" ry="22" fill={outline ? 'none' : '#fbcfe8'} {...s} />
        <circle cx="735" cy="385" r="14" fill={outline ? 'none' : '#fbcfe8'} {...s} />
        <line x1="680" y1="412" x2="680" y2="430" stroke={outline ? '#1f2937' : '#1f2937'} strokeWidth="3" />
      </g>

      {/* Chicken */}
      <g id="chicken">
        <ellipse cx="380" cy="410" rx="20" ry="16" fill={outline ? 'none' : '#fff'} {...s} />
        <circle cx="395" cy="395" r="10" fill={outline ? 'none' : '#fff'} {...s} />
        <polygon points="403,392 410,395 403,398" fill={outline ? 'none' : '#facc15'} {...s} />
        <polygon points="395,386 397,378 393,378" fill={outline ? 'none' : '#dc2626'} {...s} />
      </g>

      {/* Tree */}
      <rect x="850" y="280" width="20" height="80" fill={outline ? 'none' : '#7c3a0e'} {...s} />
      <circle cx="860" cy="265" r="40" fill={outline ? 'none' : '#22c55e'} {...s} />
    </svg>
  );
}

// ─── Scene 7: Bedroom ───────────────────────────────────────────────────

function BedroomScene() {
  return (
    <svg viewBox="0 0 1000 500" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="0" y="0" width="1000" height="320" fill="#fef9c3" />
      <rect x="0" y="320" width="1000" height="180" fill="#a78bfa" />

      {/* Bed */}
      <rect x="100" y="280" width="300" height="100" fill="#3b82f6" />
      <rect x="100" y="280" width="300" height="20" fill="#1e3a8a" />
      <rect x="120" y="260" width="60" height="40" fill="#fff" />

      {/* Window */}
      <rect x="500" y="80" width="180" height="140" fill="#bae6fd" />
      <line x1="590" y1="80" x2="590" y2="220" stroke="#1f2937" strokeWidth="3" />
      <line x1="500" y1="150" x2="680" y2="150" stroke="#1f2937" strokeWidth="3" />

      {/* Toy box */}
      <rect x="780" y="280" width="120" height="80" fill="#dc2626" />
      <ellipse cx="820" cy="280" rx="14" ry="8" fill="#fbbf24" />

      {/* Doll on bed */}
      <g id="doll">
        <circle cx="350" cy="270" r="14" fill="#fce5c0" />
        <path d="M 336 264 Q 350 248 364 264 Z" fill="#fbbf24" />
        <rect x="338" y="284" width="24" height="20" fill="#ec4899" />
      </g>
    </svg>
  );
}

// ─── Scene 8: Garden objects (colour scene) ─────────────────────────────

/**
 * Garden scene with 5 distinct colorable items: cat, bicycle, ball, dog,
 * yarn ball. Outline-only by design (used for the colour-the-picture part).
 * Each item has an SVG `id` attribute matching the data file's region IDs.
 */
function GardenObjectsScene({ outline = false }: { outline?: boolean }) {
  const stroke = outline ? '#1f2937' : '#1f2937';
  const sw = 2.5;
  return (
    <svg viewBox="0 0 1000 500" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Background — optional grass tint */}
      <rect x="0" y="0" width="1000" height="500" fill={outline ? 'transparent' : '#f0fdf4'} />

      {/* Big tree left */}
      <g id="tree" data-region="tree">
        <rect x="80" y="200" width="30" height="180" fill={outline ? 'none' : 'transparent'} stroke={stroke} strokeWidth={sw} />
        <circle cx="95" cy="180" r="65" fill={outline ? 'none' : 'transparent'} stroke={stroke} strokeWidth={sw} />
      </g>

      {/* Bicycle (center-left) */}
      <g id="bike" data-region="bike">
        <circle cx="280" cy="320" r="40" fill="none" stroke={stroke} strokeWidth={sw} />
        <circle cx="380" cy="320" r="40" fill="none" stroke={stroke} strokeWidth={sw} />
        <line x1="280" y1="320" x2="340" y2="260" stroke={stroke} strokeWidth={sw} />
        <line x1="380" y1="320" x2="350" y2="255" stroke={stroke} strokeWidth={sw} />
        <line x1="340" y1="260" x2="380" y2="260" stroke={stroke} strokeWidth={sw} />
        <rect x="335" y="240" width="20" height="14" fill="none" stroke={stroke} strokeWidth={sw} />
      </g>

      {/* Ball (center) */}
      <g id="ball" data-region="ball">
        <circle cx="500" cy="350" r="28" fill="none" stroke={stroke} strokeWidth={sw} />
        <path d="M 472 350 Q 500 335 528 350" fill="none" stroke={stroke} strokeWidth={sw - 1} />
      </g>

      {/* Cat (bottom-left) */}
      <g id="cat" data-region="cat">
        <ellipse cx="180" cy="420" rx="40" ry="22" fill="none" stroke={stroke} strokeWidth={sw} />
        <circle cx="220" cy="405" r="18" fill="none" stroke={stroke} strokeWidth={sw} />
        <polygon points="208,392 215,378 222,392" fill="none" stroke={stroke} strokeWidth={sw} />
        <polygon points="225,392 230,378 235,392" fill="none" stroke={stroke} strokeWidth={sw} />
        <circle cx="216" cy="405" r="2" fill={stroke} />
        <circle cx="226" cy="405" r="2" fill={stroke} />
        {/* Tail */}
        <path d="M 140 415 Q 100 420 120 440" fill="none" stroke={stroke} strokeWidth={sw} />
      </g>

      {/* Dog (bottom-right) */}
      <g id="dog" data-region="dog">
        <ellipse cx="800" cy="425" rx="50" ry="25" fill="none" stroke={stroke} strokeWidth={sw} />
        <circle cx="755" cy="410" r="22" fill="none" stroke={stroke} strokeWidth={sw} />
        <ellipse cx="745" cy="392" rx="6" ry="12" fill="none" stroke={stroke} strokeWidth={sw} />
        <ellipse cx="765" cy="392" rx="6" ry="12" fill="none" stroke={stroke} strokeWidth={sw} />
        <circle cx="751" cy="408" r="2" fill={stroke} />
        <circle cx="761" cy="408" r="2" fill={stroke} />
        {/* Tail */}
        <path d="M 850 410 Q 880 395 875 425" fill="none" stroke={stroke} strokeWidth={sw} />
      </g>

      {/* Yarn ball (bottom-far-left) */}
      <g id="yarn" data-region="yarn">
        <circle cx="80" cy="460" r="25" fill="none" stroke={stroke} strokeWidth={sw} />
        <path d="M 60 450 Q 80 440 100 450 M 60 462 Q 80 452 100 462 M 60 474 Q 80 464 100 474"
          fill="none" stroke={stroke} strokeWidth={sw - 1} />
      </g>

      {/* Bench (top-right) */}
      <g id="bench" data-region="bench">
        <rect x="640" y="240" width="120" height="12" fill="none" stroke={stroke} strokeWidth={sw} />
        <rect x="650" y="252" width="6" height="40" fill="none" stroke={stroke} strokeWidth={sw} />
        <rect x="744" y="252" width="6" height="40" fill="none" stroke={stroke} strokeWidth={sw} />
      </g>

      {/* Lollipop (decoration) */}
      <circle cx="400" cy="200" r="20" fill="none" stroke={stroke} strokeWidth={sw} />
      <circle cx="400" cy="200" r="8" fill="none" stroke={stroke} strokeWidth={sw - 1} />
      <line x1="400" y1="220" x2="400" y2="280" stroke={stroke} strokeWidth={sw} />
    </svg>
  );
}
