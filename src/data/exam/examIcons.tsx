/**
 * Icon library for Part 3 (listen & tick) options.
 *
 * Each tick question shows 3 picture options. Instead of bundling images
 * we render inline SVG icons. Icons are 120x120 viewBox, centered, and
 * styled to read at small thumbnail sizes.
 *
 * Adding a new icon:
 *   1. Add ID to `IconId` union
 *   2. Add JSX case in `getIcon`
 *   3. Reference by ID from data files (level generator)
 */

import type { ReactNode } from 'react';

export type IconId =
  // Bags
  | 'bag_red'
  | 'bag_blue'
  | 'bag_blue_empty'
  // Clocks
  | 'clock_3'
  | 'clock_4'
  | 'clock_6'
  // Animals
  | 'cat'
  | 'dog'
  | 'fish'
  | 'rabbit'
  | 'bird'
  // Food
  | 'apple'
  | 'banana'
  | 'orange'
  | 'cake'
  | 'bread'
  // Items
  | 'book'
  | 'ball'
  | 'pen'
  | 'umbrella_green'
  | 'umbrella_red'
  | 'shirt_red'
  | 'shirt_blue'
  | 'kite'
  // Scenes
  | 'doll_in_box'
  | 'doll_on_bed'
  | 'doll_under_chair'
  | 'cat_on_table'
  | 'cat_under_bed'
  | 'cat_in_box'
  // Numbers
  | 'count_2'
  | 'count_3'
  | 'count_4'
  | 'count_5'
  | 'count_6'
  | 'count_7'
  // D-18 Phase 3: extra clocks
  | 'clock_5'
  | 'clock_8'
  // D-18 Phase 3: Movers thematic icons
  // Camp
  | 'tent'
  | 'campfire'
  | 'backpack'
  | 'canoe'
  // Music
  | 'guitar'
  | 'drum'
  | 'piano'
  | 'violin'
  | 'trumpet'
  | 'microphone'
  | 'music_note'
  // Sport
  | 'soccer_ball'
  | 'whistle'
  | 'trophy'
  | 'medal'
  // Dance
  | 'ballet_shoe'
  | 'tutu'
  | 'dance_ribbon'
  // Restaurant
  | 'pizza'
  | 'burger'
  | 'soup_bowl'
  | 'salad'
  | 'juice_glass'
  | 'ice_cream'
  | 'sandwich'
  // Transport / bus
  | 'bus'
  | 'ticket'
  | 'suitcase'
  | 'traffic_light'
  // Zoo animals
  | 'lion'
  | 'monkey'
  | 'elephant'
  | 'giraffe'
  | 'snake'
  | 'penguin'
  // Museum
  | 'dinosaur'
  | 'painting'
  | 'statue'
  | 'vase'
  // Fire station
  | 'fire_engine'
  | 'fire_helmet'
  | 'ladder'
  | 'hose'
  // Pet competition
  | 'rosette'
  | 'bone'
  | 'bird_cage'
  | 'fishbowl'
  // D-18 Phase 3: fixes for previously-broken rotation icon ids
  | 'car_teddy'
  | 'car_shirt'
  | 'car_book'
  | 'doll_bed'
  | 'doll_chair'
  | 'doll_floor'
  | 'pet_cat'
  | 'pet_dog'
  | 'pet_fish'
  | 'apple_2'
  | 'apple_3'
  | 'apple_4'
  // D-18 Phase 3b: Movers L31-L40 thematic icons
  // Tree planting
  | 'spade'
  | 'tree'
  | 'watering_can'
  | 'wheelbarrow'
  | 'flowerpot'
  // Cinema
  | 'popcorn'
  | 'glasses_3d'
  | 'film_screen'
  // Bakery
  | 'croissant'
  | 'cookie'
  | 'pie'
  | 'cupcake'
  // Fishing
  | 'fishing_rod'
  | 'fishing_net'
  | 'bucket'
  | 'worm'
  // Garage sale
  | 'lamp'
  | 'teddy'
  | 'price_tag'
  | 'box'
  | 'chair'
  // Hospital
  | 'bed'
  | 'pill'
  | 'flower'
  | 'bandage'
  | 'thermometer'
  | 'ambulance'
  // Post office
  | 'parcel'
  | 'envelope'
  | 'stamp'
  | 'scales'
  | 'postbox'
  // Camping mountains
  | 'compass'
  | 'map'
  | 'mountain'
  | 'binoculars'
  // Art exhibition
  | 'easel'
  | 'paintbrush'
  | 'palette'
  | 'frame'
  // New baby
  | 'baby'
  | 'cot'
  | 'bottle'
  | 'rattle'
  | 'pram'
  // D-18 Phase 4: Flyers L41-L50 thematic icons
  | 'microscope'
  | 'test_tube'
  | 'robot'
  | 'ruler'
  | 'magnet'
  | 'coin'
  | 'donation_box'
  | 'poster'
  | 'noodles'
  | 'cheese'
  | 'recycle_bin'
  | 'solar_panel'
  | 'rocket'
  | 'telescope'
  | 'planet'
  | 'astronaut_helmet'
  | 'star'
  | 'moon'
  | 'whisk'
  | 'knife'
  | 'chef_hat'
  | 'clapperboard'
  | 'video_camera'
  | 'script_paper'
  | 'light_bulb'
  | 'camera'
  | 'tripod'
  | 'lens'
  | 'photo'
  | 'rope'
  | 'flask'
  | 'flag';

const SIZE = 120;

/** Returns SVG element for the given icon ID. Falls back to a "?" mark. */
export function getIcon(id: string): ReactNode {
  const wrap = (children: ReactNode) => (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
      {children}
    </svg>
  );

  switch (id) {
    // ─── Bags ───────────────────────────────────────────────────────
    case 'bag_red':
      return wrap(<>
        <rect x="20" y="40" width="80" height="60" rx="6" fill="#dc2626" stroke="#1f2937" strokeWidth="2" />
        <path d="M 35 40 Q 35 20 60 20 Q 85 20 85 40" fill="none" stroke="#1f2937" strokeWidth="3" />
        <circle cx="55" cy="70" r="10" fill="#fbbf24" />
        <circle cx="55" cy="65" r="3" fill="#1f2937" />
        <circle cx="65" cy="65" r="3" fill="#1f2937" />
      </>);
    case 'bag_blue':
      return wrap(<>
        <rect x="20" y="40" width="80" height="60" rx="6" fill="#3b82f6" stroke="#1f2937" strokeWidth="2" />
        <path d="M 35 40 Q 35 20 60 20 Q 85 20 85 40" fill="none" stroke="#1f2937" strokeWidth="3" />
        <circle cx="55" cy="70" r="10" fill="#a16207" />
        <circle cx="55" cy="65" r="3" fill="#1f2937" />
        <circle cx="65" cy="65" r="3" fill="#1f2937" />
      </>);
    case 'bag_blue_empty':
      return wrap(<>
        <rect x="20" y="40" width="80" height="60" rx="6" fill="#3b82f6" stroke="#1f2937" strokeWidth="2" />
        <path d="M 35 40 Q 35 20 60 20 Q 85 20 85 40" fill="none" stroke="#1f2937" strokeWidth="3" />
      </>);

    // ─── Clocks ─────────────────────────────────────────────────────
    case 'clock_3': return wrap(<ClockIcon h={3} />);
    case 'clock_4': return wrap(<ClockIcon h={4} />);
    case 'clock_5': return wrap(<ClockIcon h={5} />);
    case 'clock_6': return wrap(<ClockIcon h={6} />);
    case 'clock_8': return wrap(<ClockIcon h={8} />);

    // ─── Animals ────────────────────────────────────────────────────
    case 'cat':
    case 'pet_cat':
      return wrap(<>
        <ellipse cx="60" cy="80" rx="32" ry="22" fill="#f97316" stroke="#1f2937" strokeWidth="2" />
        <circle cx="60" cy="55" r="22" fill="#f97316" stroke="#1f2937" strokeWidth="2" />
        <polygon points="42,40 48,22 56,40" fill="#f97316" stroke="#1f2937" strokeWidth="2" />
        <polygon points="64,40 72,22 78,40" fill="#f97316" stroke="#1f2937" strokeWidth="2" />
        <circle cx="52" cy="55" r="3" fill="#1f2937" />
        <circle cx="68" cy="55" r="3" fill="#1f2937" />
        <path d="M 56 64 Q 60 68 64 64" fill="none" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'dog':
    case 'pet_dog':
      return wrap(<>
        <ellipse cx="60" cy="80" rx="36" ry="22" fill="#fbbf24" stroke="#1f2937" strokeWidth="2" />
        <circle cx="60" cy="50" r="20" fill="#fbbf24" stroke="#1f2937" strokeWidth="2" />
        <ellipse cx="44" cy="36" rx="6" ry="12" fill="#92400e" stroke="#1f2937" strokeWidth="2" />
        <ellipse cx="76" cy="36" rx="6" ry="12" fill="#92400e" stroke="#1f2937" strokeWidth="2" />
        <circle cx="52" cy="50" r="3" fill="#1f2937" />
        <circle cx="68" cy="50" r="3" fill="#1f2937" />
        <ellipse cx="60" cy="60" rx="3" ry="2" fill="#1f2937" />
      </>);
    case 'fish':
    case 'pet_fish':
      return wrap(<>
        <ellipse cx="55" cy="60" rx="32" ry="20" fill="#3b82f6" stroke="#1f2937" strokeWidth="2" />
        <polygon points="80,60 105,40 105,80" fill="#3b82f6" stroke="#1f2937" strokeWidth="2" />
        <circle cx="38" cy="55" r="3" fill="#fff" />
        <circle cx="38" cy="55" r="2" fill="#1f2937" />
      </>);
    case 'rabbit':
      return wrap(<>
        <ellipse cx="60" cy="85" rx="28" ry="20" fill="#fff" stroke="#1f2937" strokeWidth="2" />
        <circle cx="60" cy="60" r="20" fill="#fff" stroke="#1f2937" strokeWidth="2" />
        <ellipse cx="48" cy="35" rx="5" ry="18" fill="#fff" stroke="#1f2937" strokeWidth="2" />
        <ellipse cx="72" cy="35" rx="5" ry="18" fill="#fff" stroke="#1f2937" strokeWidth="2" />
        <circle cx="52" cy="60" r="2" fill="#1f2937" />
        <circle cx="68" cy="60" r="2" fill="#1f2937" />
        <circle cx="60" cy="68" r="3" fill="#fbcfe8" />
      </>);
    case 'bird':
      return wrap(<>
        <circle cx="60" cy="60" r="25" fill="#fbbf24" stroke="#1f2937" strokeWidth="2" />
        <polygon points="35,60 22,55 22,65" fill="#f97316" stroke="#1f2937" strokeWidth="2" />
        <circle cx="48" cy="55" r="3" fill="#1f2937" />
        <ellipse cx="70" cy="65" rx="14" ry="10" fill="#f97316" stroke="#1f2937" strokeWidth="2" />
      </>);

    // ─── Food ───────────────────────────────────────────────────────
    case 'apple':
      return wrap(<>
        <circle cx="60" cy="65" r="32" fill="#dc2626" stroke="#1f2937" strokeWidth="2" />
        <path d="M 60 33 Q 65 25 70 28" fill="none" stroke="#22c55e" strokeWidth="3" />
        <line x1="60" y1="33" x2="60" y2="42" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'banana':
      return wrap(<>
        <path d="M 30 80 Q 30 30 80 30 Q 75 70 30 80 Z" fill="#facc15" stroke="#1f2937" strokeWidth="2" />
        <line x1="78" y1="32" x2="82" y2="22" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'orange':
      return wrap(<>
        <circle cx="60" cy="60" r="32" fill="#f97316" stroke="#1f2937" strokeWidth="2" />
        <path d="M 60 30 Q 65 22 70 26" fill="none" stroke="#22c55e" strokeWidth="3" />
      </>);
    case 'cake':
      return wrap(<>
        <rect x="20" y="55" width="80" height="35" fill="#fbcfe8" stroke="#1f2937" strokeWidth="2" />
        <rect x="20" y="55" width="80" height="8" fill="#dc2626" stroke="#1f2937" strokeWidth="2" />
        <line x1="60" y1="55" x2="60" y2="35" stroke="#facc15" strokeWidth="2" />
        <ellipse cx="60" cy="33" rx="3" ry="6" fill="#fbbf24" />
      </>);
    case 'bread':
      return wrap(<>
        <ellipse cx="60" cy="60" rx="42" ry="24" fill="#d6a675" stroke="#1f2937" strokeWidth="2" />
        <path d="M 25 55 Q 60 65 95 55" fill="none" stroke="#92400e" strokeWidth="2" />
      </>);

    // ─── Items ──────────────────────────────────────────────────────
    case 'book':
      return wrap(<>
        <rect x="22" y="30" width="76" height="60" fill="#3b82f6" stroke="#1f2937" strokeWidth="2" />
        <line x1="60" y1="30" x2="60" y2="90" stroke="#fff" strokeWidth="2" />
        <line x1="35" y1="50" x2="55" y2="50" stroke="#fff" strokeWidth="1" />
        <line x1="35" y1="60" x2="55" y2="60" stroke="#fff" strokeWidth="1" />
      </>);
    case 'ball':
      return wrap(<>
        <circle cx="60" cy="60" r="32" fill="#dc2626" stroke="#1f2937" strokeWidth="2" />
        <path d="M 35 50 Q 60 60 85 50" fill="none" stroke="#fff" strokeWidth="2" />
        <path d="M 35 70 Q 60 80 85 70" fill="none" stroke="#fff" strokeWidth="2" />
      </>);
    case 'pen':
      return wrap(<>
        <rect x="44" y="20" width="14" height="80" fill="#3b82f6" stroke="#1f2937" strokeWidth="2" />
        <polygon points="44,20 58,20 51,8" fill="#1f2937" />
      </>);
    case 'umbrella_green':
      return wrap(<>
        <path d="M 20 60 Q 60 25 100 60 Z" fill="#22c55e" stroke="#1f2937" strokeWidth="2" />
        <line x1="60" y1="60" x2="60" y2="100" stroke="#1f2937" strokeWidth="3" />
        <path d="M 60 100 Q 70 100 70 90" fill="none" stroke="#1f2937" strokeWidth="3" />
      </>);
    case 'umbrella_red':
      return wrap(<>
        <path d="M 20 60 Q 60 25 100 60 Z" fill="#dc2626" stroke="#1f2937" strokeWidth="2" />
        <line x1="60" y1="60" x2="60" y2="100" stroke="#1f2937" strokeWidth="3" />
        <path d="M 60 100 Q 70 100 70 90" fill="none" stroke="#1f2937" strokeWidth="3" />
      </>);
    case 'shirt_red':
      return wrap(<>
        <path d="M 20 40 L 35 25 L 50 30 L 70 30 L 85 25 L 100 40 L 90 55 L 80 50 L 80 95 L 40 95 L 40 50 L 30 55 Z"
          fill="#dc2626" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'shirt_blue':
      return wrap(<>
        <path d="M 20 40 L 35 25 L 50 30 L 70 30 L 85 25 L 100 40 L 90 55 L 80 50 L 80 95 L 40 95 L 40 50 L 30 55 Z"
          fill="#3b82f6" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'kite':
      return wrap(<>
        <polygon points="60,15 95,55 60,95 25,55" fill="#a78bfa" stroke="#1f2937" strokeWidth="2" />
        <line x1="60" y1="15" x2="60" y2="95" stroke="#1f2937" strokeWidth="1" />
        <line x1="25" y1="55" x2="95" y2="55" stroke="#1f2937" strokeWidth="1" />
      </>);

    // ─── Scenes ─────────────────────────────────────────────────────
    case 'doll_in_box':
      return wrap(<>
        <rect x="20" y="50" width="80" height="50" fill="#92400e" stroke="#1f2937" strokeWidth="2" />
        <circle cx="60" cy="55" r="18" fill="#fce5c0" stroke="#1f2937" strokeWidth="2" />
        <path d="M 45 50 Q 60 30 75 50" fill="#fbbf24" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'doll_on_bed':
    case 'doll_bed':
      return wrap(<>
        <rect x="14" y="60" width="92" height="40" fill="#3b82f6" stroke="#1f2937" strokeWidth="2" />
        <circle cx="60" cy="55" r="14" fill="#fce5c0" stroke="#1f2937" strokeWidth="2" />
        <path d="M 48 51 Q 60 36 72 51" fill="#ec4899" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'doll_under_chair':
    case 'doll_chair':
      return wrap(<>
        <rect x="30" y="20" width="60" height="50" fill="#a16207" stroke="#1f2937" strokeWidth="2" />
        <line x1="30" y1="70" x2="30" y2="105" stroke="#1f2937" strokeWidth="3" />
        <line x1="90" y1="70" x2="90" y2="105" stroke="#1f2937" strokeWidth="3" />
        <circle cx="60" cy="88" r="12" fill="#fbcfe8" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'cat_on_table':
      return wrap(<>
        <rect x="14" y="55" width="92" height="14" fill="#a16207" stroke="#1f2937" strokeWidth="2" />
        <line x1="20" y1="69" x2="20" y2="105" stroke="#1f2937" strokeWidth="3" />
        <line x1="100" y1="69" x2="100" y2="105" stroke="#1f2937" strokeWidth="3" />
        <ellipse cx="60" cy="48" rx="20" ry="8" fill="#f97316" stroke="#1f2937" strokeWidth="2" />
        <circle cx="78" cy="42" r="10" fill="#f97316" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'cat_under_bed':
      return wrap(<>
        <rect x="14" y="35" width="92" height="35" fill="#3b82f6" stroke="#1f2937" strokeWidth="2" />
        <line x1="20" y1="70" x2="20" y2="100" stroke="#1f2937" strokeWidth="3" />
        <line x1="100" y1="70" x2="100" y2="100" stroke="#1f2937" strokeWidth="3" />
        <ellipse cx="55" cy="92" rx="14" ry="7" fill="#f97316" stroke="#1f2937" strokeWidth="2" />
        <circle cx="68" cy="88" r="8" fill="#f97316" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'cat_in_box':
      return wrap(<>
        <rect x="20" y="40" width="80" height="60" fill="#92400e" stroke="#1f2937" strokeWidth="2" />
        <circle cx="60" cy="55" r="14" fill="#f97316" stroke="#1f2937" strokeWidth="2" />
        <polygon points="50,42 56,32 60,46" fill="#f97316" stroke="#1f2937" strokeWidth="2" />
        <polygon points="60,46 64,32 70,42" fill="#f97316" stroke="#1f2937" strokeWidth="2" />
      </>);

    // ─── Numbers ────────────────────────────────────────────────────
    case 'count_2':  return wrap(<NumberIcon n={2} />);
    case 'count_3':  return wrap(<NumberIcon n={3} />);
    case 'count_4':  return wrap(<NumberIcon n={4} />);
    case 'count_5':  return wrap(<NumberIcon n={5} />);
    case 'count_6':  return wrap(<NumberIcon n={6} />);
    case 'count_7':  return wrap(<NumberIcon n={7} />);

    // ─── Apples (count of apples) ───────────────────────────────────
    case 'apple_2':  return wrap(<AppleCountIcon n={2} />);
    case 'apple_3':  return wrap(<AppleCountIcon n={3} />);
    case 'apple_4':  return wrap(<AppleCountIcon n={4} />);

    // ─── Cars carrying an object (fixes broken rotation icons) ──────
    case 'car_teddy': return wrap(<CarIcon cargo="teddy" />);
    case 'car_shirt': return wrap(<CarIcon cargo="shirt" />);
    case 'car_book':  return wrap(<CarIcon cargo="book" />);

    // ─── Doll on the floor ──────────────────────────────────────────
    case 'doll_floor':
      return wrap(<>
        <line x1="14" y1="98" x2="106" y2="98" stroke="#1f2937" strokeWidth="3" />
        <circle cx="60" cy="78" r="14" fill="#fce5c0" stroke="#1f2937" strokeWidth="2" />
        <path d="M 48 74 Q 60 58 72 74" fill="#ec4899" stroke="#1f2937" strokeWidth="2" />
      </>);

    // ─── Camp ───────────────────────────────────────────────────────
    case 'tent':
      return wrap(<>
        <polygon points="60,25 100,95 20,95" fill="#22c55e" stroke="#1f2937" strokeWidth="2" />
        <polygon points="60,25 70,95 50,95" fill="#15803d" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'campfire':
      return wrap(<>
        <line x1="30" y1="95" x2="90" y2="80" stroke="#92400e" strokeWidth="5" />
        <line x1="90" y1="95" x2="30" y2="80" stroke="#a16207" strokeWidth="5" />
        <path d="M 60 30 Q 78 55 60 75 Q 42 55 60 30 Z" fill="#f97316" stroke="#1f2937" strokeWidth="2" />
        <path d="M 60 45 Q 70 60 60 72 Q 50 60 60 45 Z" fill="#facc15" />
      </>);
    case 'backpack':
      return wrap(<>
        <rect x="32" y="35" width="56" height="65" rx="12" fill="#3b82f6" stroke="#1f2937" strokeWidth="2" />
        <rect x="44" y="50" width="32" height="26" rx="4" fill="#bfdbfe" stroke="#1f2937" strokeWidth="2" />
        <path d="M 44 35 Q 44 22 60 22 Q 76 22 76 35" fill="none" stroke="#1f2937" strokeWidth="3" />
      </>);
    case 'canoe':
      return wrap(<>
        <path d="M 12 55 Q 60 100 108 55 Q 60 72 12 55 Z" fill="#d6a675" stroke="#1f2937" strokeWidth="2" />
        <line x1="78" y1="30" x2="50" y2="80" stroke="#92400e" strokeWidth="4" />
      </>);

    // ─── Music ──────────────────────────────────────────────────────
    case 'guitar':
      return wrap(<>
        <circle cx="50" cy="75" r="28" fill="#d6a675" stroke="#1f2937" strokeWidth="2" />
        <circle cx="50" cy="75" r="9" fill="#92400e" />
        <rect x="62" y="20" width="10" height="45" fill="#92400e" stroke="#1f2937" strokeWidth="2" transform="rotate(35 67 42)" />
      </>);
    case 'drum':
      return wrap(<>
        <ellipse cx="60" cy="45" rx="34" ry="12" fill="#fef3c7" stroke="#1f2937" strokeWidth="2" />
        <path d="M 26 45 L 26 78 Q 60 92 94 78 L 94 45" fill="#dc2626" stroke="#1f2937" strokeWidth="2" />
        <line x1="40" y1="100" x2="60" y2="55" stroke="#92400e" strokeWidth="3" />
        <line x1="80" y1="100" x2="60" y2="55" stroke="#92400e" strokeWidth="3" />
      </>);
    case 'piano':
      return wrap(<>
        <rect x="20" y="40" width="80" height="50" fill="#1f2937" stroke="#1f2937" strokeWidth="2" />
        <rect x="24" y="62" width="72" height="26" fill="#fff" stroke="#1f2937" strokeWidth="2" />
        <line x1="36" y1="62" x2="36" y2="88" stroke="#1f2937" strokeWidth="2" />
        <line x1="48" y1="62" x2="48" y2="88" stroke="#1f2937" strokeWidth="2" />
        <line x1="60" y1="62" x2="60" y2="88" stroke="#1f2937" strokeWidth="2" />
        <line x1="72" y1="62" x2="72" y2="88" stroke="#1f2937" strokeWidth="2" />
        <line x1="84" y1="62" x2="84" y2="88" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'violin':
      return wrap(<>
        <path d="M 60 20 C 44 30 44 55 56 60 C 40 64 40 92 60 100 C 80 92 80 64 64 60 C 76 55 76 30 60 20 Z"
          fill="#b45309" stroke="#1f2937" strokeWidth="2" />
        <line x1="60" y1="22" x2="60" y2="98" stroke="#1f2937" strokeWidth="1" />
      </>);
    case 'trumpet':
      return wrap(<>
        <rect x="20" y="52" width="55" height="14" rx="4" fill="#facc15" stroke="#1f2937" strokeWidth="2" />
        <polygon points="72,46 100,38 100,80 72,72" fill="#facc15" stroke="#1f2937" strokeWidth="2" />
        <rect x="34" y="40" width="6" height="14" fill="#1f2937" />
        <rect x="46" y="40" width="6" height="14" fill="#1f2937" />
      </>);
    case 'microphone':
      return wrap(<>
        <rect x="50" y="60" width="10" height="35" fill="#1f2937" />
        <ellipse cx="55" cy="40" rx="20" ry="26" fill="#9ca3af" stroke="#1f2937" strokeWidth="2" />
        <line x1="40" y1="34" x2="70" y2="34" stroke="#1f2937" strokeWidth="1" />
        <line x1="40" y1="44" x2="70" y2="44" stroke="#1f2937" strokeWidth="1" />
      </>);
    case 'music_note':
      return wrap(<>
        <ellipse cx="42" cy="86" rx="14" ry="10" fill="#7c3aed" stroke="#1f2937" strokeWidth="2" />
        <rect x="54" y="26" width="6" height="60" fill="#1f2937" />
        <path d="M 60 26 Q 86 30 84 52 Q 70 40 60 46 Z" fill="#1f2937" />
      </>);

    // ─── Sport ──────────────────────────────────────────────────────
    case 'soccer_ball':
      return wrap(<>
        <circle cx="60" cy="60" r="34" fill="#fff" stroke="#1f2937" strokeWidth="2" />
        <polygon points="60,42 72,52 67,68 53,68 48,52" fill="#1f2937" />
        <line x1="60" y1="26" x2="60" y2="42" stroke="#1f2937" strokeWidth="2" />
        <line x1="90" y1="52" x2="72" y2="52" stroke="#1f2937" strokeWidth="2" />
        <line x1="78" y1="86" x2="67" y2="68" stroke="#1f2937" strokeWidth="2" />
        <line x1="42" y1="86" x2="53" y2="68" stroke="#1f2937" strokeWidth="2" />
        <line x1="30" y1="52" x2="48" y2="52" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'whistle':
      return wrap(<>
        <circle cx="50" cy="65" r="22" fill="#9ca3af" stroke="#1f2937" strokeWidth="2" />
        <rect x="66" y="50" width="34" height="18" rx="4" fill="#9ca3af" stroke="#1f2937" strokeWidth="2" />
        <circle cx="50" cy="65" r="7" fill="#fff" stroke="#1f2937" strokeWidth="2" />
        <path d="M 88 50 Q 100 44 104 30" fill="none" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'trophy':
      return wrap(<>
        <path d="M 40 28 L 80 28 L 78 55 Q 60 70 42 55 Z" fill="#facc15" stroke="#1f2937" strokeWidth="2" />
        <path d="M 40 32 Q 22 32 26 48 Q 30 56 42 52" fill="none" stroke="#1f2937" strokeWidth="2" />
        <path d="M 80 32 Q 98 32 94 48 Q 90 56 78 52" fill="none" stroke="#1f2937" strokeWidth="2" />
        <rect x="54" y="66" width="12" height="16" fill="#facc15" stroke="#1f2937" strokeWidth="2" />
        <rect x="42" y="82" width="36" height="10" fill="#a16207" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'medal':
      return wrap(<>
        <path d="M 48 22 L 40 55 L 56 50 Z" fill="#3b82f6" stroke="#1f2937" strokeWidth="2" />
        <path d="M 72 22 L 80 55 L 64 50 Z" fill="#dc2626" stroke="#1f2937" strokeWidth="2" />
        <circle cx="60" cy="74" r="24" fill="#facc15" stroke="#1f2937" strokeWidth="2" />
        <circle cx="60" cy="74" r="14" fill="#fde68a" stroke="#a16207" strokeWidth="2" />
      </>);

    // ─── Dance ──────────────────────────────────────────────────────
    case 'ballet_shoe':
      return wrap(<>
        <ellipse cx="50" cy="70" rx="28" ry="16" fill="#fbcfe8" stroke="#1f2937" strokeWidth="2" />
        <path d="M 50 56 Q 60 56 64 64" fill="none" stroke="#ec4899" strokeWidth="2" />
        <path d="M 36 60 Q 30 40 44 36" fill="none" stroke="#ec4899" strokeWidth="2" />
        <path d="M 64 60 Q 70 40 56 36" fill="none" stroke="#ec4899" strokeWidth="2" />
      </>);
    case 'tutu':
      return wrap(<>
        <rect x="46" y="34" width="28" height="22" fill="#ec4899" stroke="#1f2937" strokeWidth="2" />
        <path d="M 30 56 Q 60 44 90 56 L 100 84 Q 60 70 20 84 Z" fill="#fbcfe8" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'dance_ribbon':
      return wrap(<>
        <line x1="24" y1="92" x2="40" y2="40" stroke="#92400e" strokeWidth="4" />
        <path d="M 40 40 Q 80 20 70 50 Q 100 50 78 70 Q 100 88 64 82 Q 60 100 48 78"
          fill="none" stroke="#a78bfa" strokeWidth="5" />
      </>);

    // ─── Restaurant ─────────────────────────────────────────────────
    case 'pizza':
      return wrap(<>
        <polygon points="60,20 96,92 24,92" fill="#facc15" stroke="#1f2937" strokeWidth="2" />
        <polygon points="60,20 70,40 50,40" fill="#fcd34d" />
        <circle cx="54" cy="60" r="5" fill="#dc2626" />
        <circle cx="70" cy="70" r="5" fill="#dc2626" />
        <circle cx="48" cy="80" r="5" fill="#dc2626" />
      </>);
    case 'burger':
      return wrap(<>
        <path d="M 24 44 Q 60 18 96 44 Z" fill="#d6a675" stroke="#1f2937" strokeWidth="2" />
        <rect x="24" y="44" width="72" height="10" fill="#22c55e" stroke="#1f2937" strokeWidth="2" />
        <rect x="24" y="54" width="72" height="14" fill="#92400e" stroke="#1f2937" strokeWidth="2" />
        <path d="M 24 68 Q 60 92 96 68 Z" fill="#d6a675" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'soup_bowl':
      return wrap(<>
        <path d="M 22 56 Q 60 96 98 56 Z" fill="#fde68a" stroke="#1f2937" strokeWidth="2" />
        <ellipse cx="60" cy="56" rx="38" ry="10" fill="#f97316" stroke="#1f2937" strokeWidth="2" />
        <path d="M 50 40 Q 56 32 50 26" fill="none" stroke="#9ca3af" strokeWidth="2" />
        <path d="M 70 40 Q 76 32 70 26" fill="none" stroke="#9ca3af" strokeWidth="2" />
      </>);
    case 'salad':
      return wrap(<>
        <path d="M 22 58 Q 60 92 98 58 Z" fill="#fff" stroke="#1f2937" strokeWidth="2" />
        <circle cx="46" cy="56" r="12" fill="#22c55e" stroke="#15803d" strokeWidth="2" />
        <circle cx="66" cy="54" r="11" fill="#4ade80" stroke="#15803d" strokeWidth="2" />
        <circle cx="58" cy="62" r="7" fill="#dc2626" />
      </>);
    case 'juice_glass':
      return wrap(<>
        <path d="M 40 34 L 80 34 L 74 96 L 46 96 Z" fill="#fdba74" stroke="#1f2937" strokeWidth="2" />
        <rect x="42" y="34" width="36" height="10" fill="#fb923c" stroke="#1f2937" strokeWidth="2" />
        <rect x="64" y="22" width="6" height="30" fill="#ef4444" transform="rotate(12 67 37)" />
      </>);
    case 'ice_cream':
      return wrap(<>
        <polygon points="44,60 76,60 60,100" fill="#d6a675" stroke="#1f2937" strokeWidth="2" />
        <circle cx="50" cy="50" r="14" fill="#fbcfe8" stroke="#1f2937" strokeWidth="2" />
        <circle cx="70" cy="50" r="14" fill="#fcd34d" stroke="#1f2937" strokeWidth="2" />
        <circle cx="60" cy="38" r="14" fill="#f9a8d4" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'sandwich':
      return wrap(<>
        <polygon points="24,90 60,30 96,90" fill="#fde68a" stroke="#1f2937" strokeWidth="2" />
        <polygon points="36,80 60,42 84,80" fill="#22c55e" stroke="#15803d" strokeWidth="1" />
        <polygon points="44,80 60,52 76,80" fill="#dc2626" />
      </>);

    // ─── Transport / bus ────────────────────────────────────────────
    case 'bus':
      return wrap(<>
        <rect x="16" y="34" width="88" height="50" rx="8" fill="#dc2626" stroke="#1f2937" strokeWidth="2" />
        <rect x="24" y="42" width="20" height="18" fill="#bfdbfe" stroke="#1f2937" strokeWidth="2" />
        <rect x="50" y="42" width="20" height="18" fill="#bfdbfe" stroke="#1f2937" strokeWidth="2" />
        <rect x="76" y="42" width="20" height="18" fill="#bfdbfe" stroke="#1f2937" strokeWidth="2" />
        <circle cx="38" cy="88" r="9" fill="#1f2937" />
        <circle cx="84" cy="88" r="9" fill="#1f2937" />
      </>);
    case 'ticket':
      return wrap(<>
        <rect x="20" y="42" width="80" height="36" rx="6" fill="#fde68a" stroke="#1f2937" strokeWidth="2" />
        <line x1="64" y1="42" x2="64" y2="78" stroke="#1f2937" strokeWidth="2" strokeDasharray="4 3" />
        <circle cx="64" cy="42" r="4" fill="#fff" stroke="#1f2937" strokeWidth="1" />
        <circle cx="64" cy="78" r="4" fill="#fff" stroke="#1f2937" strokeWidth="1" />
      </>);
    case 'suitcase':
      return wrap(<>
        <rect x="28" y="44" width="64" height="52" rx="6" fill="#b45309" stroke="#1f2937" strokeWidth="2" />
        <rect x="48" y="30" width="24" height="14" rx="4" fill="none" stroke="#1f2937" strokeWidth="3" />
        <line x1="28" y1="60" x2="92" y2="60" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'traffic_light':
      return wrap(<>
        <rect x="44" y="20" width="32" height="80" rx="8" fill="#1f2937" />
        <circle cx="60" cy="38" r="9" fill="#dc2626" />
        <circle cx="60" cy="60" r="9" fill="#facc15" />
        <circle cx="60" cy="82" r="9" fill="#22c55e" />
      </>);

    // ─── Zoo animals ────────────────────────────────────────────────
    case 'lion':
      return wrap(<>
        <circle cx="60" cy="60" r="34" fill="#f59e0b" stroke="#1f2937" strokeWidth="2" />
        <circle cx="60" cy="60" r="22" fill="#fbbf24" stroke="#1f2937" strokeWidth="2" />
        <circle cx="52" cy="56" r="3" fill="#1f2937" />
        <circle cx="68" cy="56" r="3" fill="#1f2937" />
        <path d="M 54 66 Q 60 72 66 66" fill="none" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'monkey':
      return wrap(<>
        <circle cx="60" cy="62" r="28" fill="#92400e" stroke="#1f2937" strokeWidth="2" />
        <circle cx="60" cy="66" r="18" fill="#d6a675" stroke="#1f2937" strokeWidth="2" />
        <circle cx="34" cy="50" r="9" fill="#92400e" stroke="#1f2937" strokeWidth="2" />
        <circle cx="86" cy="50" r="9" fill="#92400e" stroke="#1f2937" strokeWidth="2" />
        <circle cx="53" cy="60" r="3" fill="#1f2937" />
        <circle cx="67" cy="60" r="3" fill="#1f2937" />
      </>);
    case 'elephant':
      return wrap(<>
        <ellipse cx="56" cy="62" rx="34" ry="28" fill="#9ca3af" stroke="#1f2937" strokeWidth="2" />
        <path d="M 30 70 Q 18 80 24 96 L 34 92 Q 32 80 40 76 Z" fill="#9ca3af" stroke="#1f2937" strokeWidth="2" />
        <circle cx="62" cy="54" r="3" fill="#1f2937" />
        <path d="M 84 50 Q 100 50 96 70" fill="#9ca3af" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'giraffe':
      return wrap(<>
        <rect x="52" y="40" width="16" height="56" fill="#fcd34d" stroke="#1f2937" strokeWidth="2" />
        <circle cx="60" cy="32" r="14" fill="#fcd34d" stroke="#1f2937" strokeWidth="2" />
        <circle cx="55" cy="30" r="2.5" fill="#1f2937" />
        <circle cx="58" cy="52" r="4" fill="#b45309" />
        <circle cx="62" cy="68" r="4" fill="#b45309" />
        <circle cx="57" cy="82" r="4" fill="#b45309" />
      </>);
    case 'snake':
      return wrap(<>
        <path d="M 24 86 Q 60 86 56 60 Q 52 40 76 40 Q 96 40 92 58"
          fill="none" stroke="#22c55e" strokeWidth="10" strokeLinecap="round" />
        <circle cx="92" cy="58" r="3" fill="#1f2937" />
      </>);
    case 'penguin':
      return wrap(<>
        <ellipse cx="60" cy="62" rx="26" ry="34" fill="#1f2937" />
        <ellipse cx="60" cy="68" rx="16" ry="26" fill="#fff" />
        <circle cx="52" cy="44" r="3" fill="#1f2937" />
        <circle cx="68" cy="44" r="3" fill="#1f2937" />
        <polygon points="60,48 52,56 68,56" fill="#f97316" />
        <polygon points="44,96 60,90 50,98" fill="#f97316" />
        <polygon points="76,96 60,90 70,98" fill="#f97316" />
      </>);

    // ─── Museum ─────────────────────────────────────────────────────
    case 'dinosaur':
      return wrap(<>
        <path d="M 20 88 Q 24 64 44 64 Q 48 38 70 40 Q 92 42 92 64 Q 100 70 96 80"
          fill="#22c55e" stroke="#1f2937" strokeWidth="2" />
        <ellipse cx="46" cy="80" rx="30" ry="16" fill="#22c55e" stroke="#1f2937" strokeWidth="2" />
        <circle cx="80" cy="52" r="3" fill="#1f2937" />
        <line x1="40" y1="92" x2="40" y2="100" stroke="#1f2937" strokeWidth="3" />
        <line x1="56" y1="94" x2="56" y2="100" stroke="#1f2937" strokeWidth="3" />
      </>);
    case 'painting':
      return wrap(<>
        <rect x="22" y="26" width="76" height="68" fill="#a16207" stroke="#1f2937" strokeWidth="3" />
        <rect x="32" y="36" width="56" height="48" fill="#bfdbfe" stroke="#1f2937" strokeWidth="1" />
        <polygon points="32,84 52,56 64,70 78,50 88,84" fill="#22c55e" />
        <circle cx="74" cy="46" r="6" fill="#facc15" />
      </>);
    case 'statue':
      return wrap(<>
        <rect x="44" y="86" width="32" height="12" fill="#9ca3af" stroke="#1f2937" strokeWidth="2" />
        <rect x="52" y="50" width="16" height="36" fill="#d1d5db" stroke="#1f2937" strokeWidth="2" />
        <circle cx="60" cy="38" r="14" fill="#d1d5db" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'vase':
      return wrap(<>
        <path d="M 44 26 L 76 26 L 72 44 Q 90 60 84 84 Q 80 96 60 96 Q 40 96 36 84 Q 30 60 48 44 Z"
          fill="#3b82f6" stroke="#1f2937" strokeWidth="2" />
        <path d="M 44 64 Q 60 70 76 64" fill="none" stroke="#1e3a8a" strokeWidth="2" />
      </>);

    // ─── Fire station ───────────────────────────────────────────────
    case 'fire_engine':
      return wrap(<>
        <rect x="14" y="50" width="56" height="34" fill="#dc2626" stroke="#1f2937" strokeWidth="2" />
        <rect x="70" y="60" width="36" height="24" fill="#dc2626" stroke="#1f2937" strokeWidth="2" />
        <rect x="74" y="64" width="18" height="14" fill="#bfdbfe" stroke="#1f2937" strokeWidth="2" />
        <line x1="20" y1="58" x2="64" y2="58" stroke="#facc15" strokeWidth="3" />
        <circle cx="36" cy="88" r="9" fill="#1f2937" />
        <circle cx="86" cy="88" r="9" fill="#1f2937" />
      </>);
    case 'fire_helmet':
      return wrap(<>
        <path d="M 26 78 Q 30 42 60 42 Q 90 42 94 78 Z" fill="#dc2626" stroke="#1f2937" strokeWidth="2" />
        <rect x="20" y="78" width="80" height="10" rx="4" fill="#b91c1c" stroke="#1f2937" strokeWidth="2" />
        <polygon points="60,48 68,66 52,66" fill="#fde68a" stroke="#1f2937" strokeWidth="1" />
      </>);
    case 'ladder':
      return wrap(<>
        <line x1="40" y1="20" x2="40" y2="100" stroke="#a16207" strokeWidth="5" />
        <line x1="80" y1="20" x2="80" y2="100" stroke="#a16207" strokeWidth="5" />
        <line x1="40" y1="34" x2="80" y2="34" stroke="#a16207" strokeWidth="4" />
        <line x1="40" y1="52" x2="80" y2="52" stroke="#a16207" strokeWidth="4" />
        <line x1="40" y1="70" x2="80" y2="70" stroke="#a16207" strokeWidth="4" />
        <line x1="40" y1="88" x2="80" y2="88" stroke="#a16207" strokeWidth="4" />
      </>);
    case 'hose':
      return wrap(<>
        <path d="M 24 92 Q 24 50 60 50 Q 92 50 92 30"
          fill="none" stroke="#facc15" strokeWidth="9" strokeLinecap="round" />
        <polygon points="92,22 104,30 92,38" fill="#9ca3af" stroke="#1f2937" strokeWidth="2" />
      </>);

    // ─── Pet competition ────────────────────────────────────────────
    case 'rosette':
      return wrap(<>
        <circle cx="60" cy="48" r="24" fill="#3b82f6" stroke="#1f2937" strokeWidth="2" />
        <circle cx="60" cy="48" r="11" fill="#fde68a" stroke="#1f2937" strokeWidth="2" />
        <polygon points="48,66 44,98 60,84 76,98 72,66" fill="#3b82f6" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'bone':
      return wrap(<>
        <circle cx="32" cy="42" r="11" fill="#fff" stroke="#1f2937" strokeWidth="2" />
        <circle cx="32" cy="60" r="11" fill="#fff" stroke="#1f2937" strokeWidth="2" />
        <circle cx="88" cy="60" r="11" fill="#fff" stroke="#1f2937" strokeWidth="2" />
        <circle cx="88" cy="78" r="11" fill="#fff" stroke="#1f2937" strokeWidth="2" />
        <rect x="32" y="46" width="56" height="22" fill="#fff" stroke="#1f2937" strokeWidth="2" transform="rotate(18 60 57)" />
      </>);
    case 'bird_cage':
      return wrap(<>
        <ellipse cx="60" cy="22" rx="8" ry="5" fill="none" stroke="#1f2937" strokeWidth="2" />
        <path d="M 32 30 Q 60 18 88 30 L 88 92 L 32 92 Z" fill="#fffbeb" stroke="#1f2937" strokeWidth="2" />
        <line x1="46" y1="26" x2="46" y2="92" stroke="#1f2937" strokeWidth="1.5" />
        <line x1="60" y1="23" x2="60" y2="92" stroke="#1f2937" strokeWidth="1.5" />
        <line x1="74" y1="26" x2="74" y2="92" stroke="#1f2937" strokeWidth="1.5" />
        <circle cx="60" cy="62" r="8" fill="#facc15" stroke="#1f2937" strokeWidth="1.5" />
      </>);
    case 'fishbowl':
      return wrap(<>
        <path d="M 30 50 Q 30 96 60 96 Q 90 96 90 50 Q 78 40 60 40 Q 42 40 30 50 Z"
          fill="#bfdbfe" stroke="#1f2937" strokeWidth="2" />
        <ellipse cx="56" cy="68" rx="14" ry="9" fill="#f97316" stroke="#1f2937" strokeWidth="1.5" />
        <polygon points="68,68 80,60 80,76" fill="#f97316" stroke="#1f2937" strokeWidth="1.5" />
      </>);

    // ─── Tree planting ──────────────────────────────────────────────
    case 'spade':
      return wrap(<>
        <rect x="54" y="20" width="12" height="55" fill="#a16207" stroke="#1f2937" strokeWidth="2" />
        <rect x="44" y="14" width="32" height="10" fill="#a16207" stroke="#1f2937" strokeWidth="2" />
        <path d="M 44 75 L 76 75 L 70 100 L 50 100 Z" fill="#9ca3af" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'tree':
      return wrap(<>
        <rect x="54" y="64" width="12" height="34" fill="#92400e" stroke="#1f2937" strokeWidth="2" />
        <circle cx="60" cy="46" r="30" fill="#22c55e" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'watering_can':
      return wrap(<>
        <rect x="34" y="48" width="44" height="38" rx="6" fill="#3b82f6" stroke="#1f2937" strokeWidth="2" />
        <path d="M 78 56 L 100 40 L 100 48 L 84 64 Z" fill="#3b82f6" stroke="#1f2937" strokeWidth="2" />
        <path d="M 34 52 Q 22 52 26 70" fill="none" stroke="#1f2937" strokeWidth="3" />
        <line x1="100" y1="40" x2="92" y2="28" stroke="#9ca3af" strokeWidth="2" />
      </>);
    case 'wheelbarrow':
      return wrap(<>
        <path d="M 28 50 L 92 50 L 80 76 L 40 76 Z" fill="#dc2626" stroke="#1f2937" strokeWidth="2" />
        <line x1="28" y1="50" x2="14" y2="62" stroke="#1f2937" strokeWidth="3" />
        <circle cx="52" cy="90" r="10" fill="#1f2937" />
        <line x1="80" y1="76" x2="96" y2="86" stroke="#1f2937" strokeWidth="3" />
      </>);
    case 'flowerpot':
      return wrap(<>
        <circle cx="60" cy="36" r="10" fill="#ec4899" stroke="#1f2937" strokeWidth="2" />
        <line x1="60" y1="46" x2="60" y2="62" stroke="#22c55e" strokeWidth="3" />
        <path d="M 38 62 L 82 62 L 74 96 L 46 96 Z" fill="#b45309" stroke="#1f2937" strokeWidth="2" />
      </>);

    // ─── Cinema ─────────────────────────────────────────────────────
    case 'popcorn':
      return wrap(<>
        <path d="M 38 50 L 82 50 L 76 98 L 44 98 Z" fill="#dc2626" stroke="#1f2937" strokeWidth="2" />
        <path d="M 38 50 L 82 50 L 80 60 L 40 60 Z" fill="#fff" stroke="#1f2937" strokeWidth="1" />
        <circle cx="48" cy="40" r="10" fill="#fde68a" stroke="#1f2937" strokeWidth="2" />
        <circle cx="64" cy="34" r="10" fill="#fde68a" stroke="#1f2937" strokeWidth="2" />
        <circle cx="74" cy="44" r="9" fill="#fde68a" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'glasses_3d':
      return wrap(<>
        <rect x="18" y="46" width="38" height="28" rx="6" fill="#dc2626" stroke="#1f2937" strokeWidth="2" />
        <rect x="64" y="46" width="38" height="28" rx="6" fill="#3b82f6" stroke="#1f2937" strokeWidth="2" />
        <line x1="56" y1="52" x2="64" y2="52" stroke="#1f2937" strokeWidth="3" />
      </>);
    case 'film_screen':
      return wrap(<>
        <rect x="16" y="24" width="88" height="56" rx="3" fill="#1e3a8a" stroke="#1f2937" strokeWidth="2" />
        <rect x="24" y="32" width="72" height="40" fill="#bfdbfe" />
        <rect x="16" y="84" width="88" height="6" fill="#9ca3af" stroke="#1f2937" strokeWidth="1" />
      </>);

    // ─── Bakery ─────────────────────────────────────────────────────
    case 'croissant':
      return wrap(<>
        <path d="M 24 76 Q 30 44 60 44 Q 90 44 96 76 Q 80 64 60 64 Q 40 64 24 76 Z"
          fill="#f59e0b" stroke="#1f2937" strokeWidth="2" />
        <path d="M 40 60 L 46 72 M 60 56 L 60 70 M 80 60 L 74 72" stroke="#92400e" strokeWidth="2" />
      </>);
    case 'cookie':
      return wrap(<>
        <circle cx="60" cy="60" r="32" fill="#d6a675" stroke="#1f2937" strokeWidth="2" />
        <circle cx="50" cy="52" r="4" fill="#5b3a1a" />
        <circle cx="70" cy="56" r="4" fill="#5b3a1a" />
        <circle cx="58" cy="72" r="4" fill="#5b3a1a" />
        <circle cx="72" cy="72" r="3" fill="#5b3a1a" />
      </>);
    case 'pie':
      return wrap(<>
        <path d="M 22 60 Q 60 96 98 60 Z" fill="#f59e0b" stroke="#1f2937" strokeWidth="2" />
        <ellipse cx="60" cy="60" rx="38" ry="9" fill="#fcd34d" stroke="#1f2937" strokeWidth="2" />
        <path d="M 44 60 L 50 52 M 60 60 L 60 50 M 76 60 L 70 52" stroke="#92400e" strokeWidth="2" />
      </>);
    case 'cupcake':
      return wrap(<>
        <path d="M 36 56 L 84 56 L 78 92 L 42 92 Z" fill="#fcd34d" stroke="#1f2937" strokeWidth="2" />
        <path d="M 30 56 Q 60 28 90 56 Z" fill="#ec4899" stroke="#1f2937" strokeWidth="2" />
        <circle cx="60" cy="34" r="5" fill="#dc2626" />
      </>);

    // ─── Fishing ────────────────────────────────────────────────────
    case 'fishing_rod':
      return wrap(<>
        <line x1="22" y1="96" x2="86" y2="22" stroke="#a16207" strokeWidth="4" />
        <path d="M 86 22 Q 96 40 84 56" fill="none" stroke="#1f2937" strokeWidth="1.5" />
        <path d="M 84 56 l -4 8 l 8 0 z" fill="#9ca3af" stroke="#1f2937" strokeWidth="1.5" />
      </>);
    case 'fishing_net':
      return wrap(<>
        <line x1="20" y1="96" x2="48" y2="56" stroke="#a16207" strokeWidth="4" />
        <path d="M 40 50 Q 78 40 92 64 Q 84 90 56 88 Q 38 76 40 50 Z" fill="#e5e7eb" stroke="#1f2937" strokeWidth="2" />
        <path d="M 48 54 L 80 80 M 70 48 L 56 84 M 40 66 L 90 70" stroke="#9ca3af" strokeWidth="1.5" />
      </>);
    case 'bucket':
      return wrap(<>
        <path d="M 30 44 L 90 44 L 82 96 L 38 96 Z" fill="#3b82f6" stroke="#1f2937" strokeWidth="2" />
        <path d="M 34 44 Q 60 26 86 44" fill="none" stroke="#1f2937" strokeWidth="3" />
        <ellipse cx="60" cy="44" rx="30" ry="6" fill="#60a5fa" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'worm':
      return wrap(<>
        <path d="M 26 80 Q 40 56 56 70 Q 72 84 86 60 Q 96 44 88 34"
          fill="none" stroke="#ec4899" strokeWidth="10" strokeLinecap="round" />
        <circle cx="88" cy="34" r="3" fill="#1f2937" />
      </>);

    // ─── Garage sale ────────────────────────────────────────────────
    case 'lamp':
      return wrap(<>
        <path d="M 40 24 L 80 24 L 90 52 L 30 52 Z" fill="#facc15" stroke="#1f2937" strokeWidth="2" />
        <rect x="56" y="52" width="8" height="40" fill="#9ca3af" stroke="#1f2937" strokeWidth="2" />
        <rect x="42" y="92" width="36" height="8" rx="3" fill="#9ca3af" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'teddy':
      return wrap(<>
        <circle cx="60" cy="44" r="20" fill="#b45309" stroke="#1f2937" strokeWidth="2" />
        <circle cx="44" cy="30" r="8" fill="#b45309" stroke="#1f2937" strokeWidth="2" />
        <circle cx="76" cy="30" r="8" fill="#b45309" stroke="#1f2937" strokeWidth="2" />
        <circle cx="54" cy="42" r="3" fill="#1f2937" />
        <circle cx="66" cy="42" r="3" fill="#1f2937" />
        <ellipse cx="60" cy="82" rx="24" ry="18" fill="#b45309" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'price_tag':
      return wrap(<>
        <path d="M 30 40 L 66 40 L 96 70 L 66 100 L 30 100 Z" fill="#fde68a" stroke="#1f2937" strokeWidth="2" />
        <circle cx="44" cy="56" r="6" fill="#fff" stroke="#1f2937" strokeWidth="2" />
        <text x="62" y="82" fontSize="22" textAnchor="middle" fill="#1f2937" fontWeight="bold">$</text>
      </>);
    case 'box':
      return wrap(<>
        <rect x="26" y="46" width="68" height="48" fill="#b45309" stroke="#1f2937" strokeWidth="2" />
        <path d="M 26 46 L 40 30 L 108 30 L 94 46 Z" fill="#d6a675" stroke="#1f2937" strokeWidth="2" />
        <path d="M 94 46 L 108 30 L 108 78 L 94 94 Z" fill="#92400e" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'chair':
      return wrap(<>
        <rect x="40" y="20" width="14" height="80" fill="#a16207" stroke="#1f2937" strokeWidth="2" />
        <rect x="40" y="58" width="48" height="12" fill="#a16207" stroke="#1f2937" strokeWidth="2" />
        <rect x="76" y="58" width="12" height="42" fill="#a16207" stroke="#1f2937" strokeWidth="2" />
      </>);

    // ─── Hospital ───────────────────────────────────────────────────
    case 'bed':
      return wrap(<>
        <rect x="14" y="58" width="92" height="24" fill="#3b82f6" stroke="#1f2937" strokeWidth="2" />
        <rect x="18" y="48" width="26" height="16" rx="4" fill="#fff" stroke="#1f2937" strokeWidth="2" />
        <line x1="16" y1="82" x2="16" y2="98" stroke="#1f2937" strokeWidth="3" />
        <line x1="104" y1="58" x2="104" y2="98" stroke="#1f2937" strokeWidth="3" />
      </>);
    case 'pill':
      return wrap(<>
        <rect x="30" y="44" width="60" height="32" rx="16" fill="#ef4444" stroke="#1f2937" strokeWidth="2" transform="rotate(-20 60 60)" />
        <rect x="30" y="44" width="30" height="32" rx="16" fill="#fff" stroke="#1f2937" strokeWidth="2" transform="rotate(-20 60 60)" />
      </>);
    case 'flower':
      return wrap(<>
        <circle cx="60" cy="40" r="9" fill="#facc15" stroke="#1f2937" strokeWidth="2" />
        <circle cx="44" cy="40" r="9" fill="#ec4899" stroke="#1f2937" strokeWidth="2" />
        <circle cx="76" cy="40" r="9" fill="#ec4899" stroke="#1f2937" strokeWidth="2" />
        <circle cx="60" cy="24" r="9" fill="#ec4899" stroke="#1f2937" strokeWidth="2" />
        <circle cx="60" cy="56" r="9" fill="#ec4899" stroke="#1f2937" strokeWidth="2" />
        <circle cx="60" cy="40" r="6" fill="#fff" />
        <line x1="60" y1="64" x2="60" y2="98" stroke="#22c55e" strokeWidth="3" />
      </>);
    case 'bandage':
      return wrap(<>
        <rect x="22" y="48" width="76" height="24" rx="12" fill="#fde68a" stroke="#1f2937" strokeWidth="2" transform="rotate(-30 60 60)" />
        <rect x="48" y="48" width="24" height="24" fill="#fcd34d" stroke="#1f2937" strokeWidth="1.5" transform="rotate(-30 60 60)" />
      </>);
    case 'thermometer':
      return wrap(<>
        <rect x="54" y="18" width="12" height="64" rx="6" fill="#fff" stroke="#1f2937" strokeWidth="2" />
        <circle cx="60" cy="88" r="12" fill="#dc2626" stroke="#1f2937" strokeWidth="2" />
        <rect x="57" y="50" width="6" height="34" fill="#dc2626" />
      </>);
    case 'ambulance':
      return wrap(<>
        <rect x="14" y="46" width="60" height="34" fill="#fff" stroke="#1f2937" strokeWidth="2" />
        <path d="M 74 56 L 96 56 L 104 80 L 74 80 Z" fill="#fff" stroke="#1f2937" strokeWidth="2" />
        <rect x="80" y="60" width="16" height="12" fill="#bfdbfe" stroke="#1f2937" strokeWidth="1.5" />
        <line x1="38" y1="56" x2="38" y2="72" stroke="#dc2626" strokeWidth="4" />
        <line x1="30" y1="64" x2="46" y2="64" stroke="#dc2626" strokeWidth="4" />
        <circle cx="36" cy="88" r="9" fill="#1f2937" />
        <circle cx="88" cy="88" r="9" fill="#1f2937" />
      </>);

    // ─── Post office ────────────────────────────────────────────────
    case 'parcel':
      return wrap(<>
        <rect x="28" y="40" width="64" height="54" fill="#d6a675" stroke="#1f2937" strokeWidth="2" />
        <line x1="60" y1="40" x2="60" y2="94" stroke="#92400e" strokeWidth="3" />
        <line x1="28" y1="64" x2="92" y2="64" stroke="#92400e" strokeWidth="3" />
        <path d="M 50 40 Q 60 26 70 40" fill="none" stroke="#dc2626" strokeWidth="2" />
      </>);
    case 'envelope':
      return wrap(<>
        <rect x="20" y="38" width="80" height="56" fill="#fff" stroke="#1f2937" strokeWidth="2" />
        <path d="M 20 38 L 60 70 L 100 38" fill="none" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'stamp':
      return wrap(<>
        <rect x="30" y="30" width="60" height="60" fill="#fde68a" stroke="#1f2937" strokeWidth="2" strokeDasharray="4 3" />
        <rect x="40" y="40" width="40" height="40" fill="#86efac" stroke="#1f2937" strokeWidth="1.5" />
        <circle cx="60" cy="58" r="9" fill="#15803d" />
      </>);
    case 'scales':
      return wrap(<>
        <rect x="34" y="70" width="52" height="26" rx="4" fill="#9ca3af" stroke="#1f2937" strokeWidth="2" />
        <path d="M 40 70 Q 60 44 80 70 Z" fill="#e5e7eb" stroke="#1f2937" strokeWidth="2" />
        <line x1="60" y1="70" x2="60" y2="82" stroke="#1f2937" strokeWidth="3" />
        <circle cx="60" cy="58" r="3" fill="#1f2937" />
      </>);
    case 'postbox':
      return wrap(<>
        <rect x="36" y="34" width="48" height="62" rx="22" fill="#dc2626" stroke="#1f2937" strokeWidth="2" />
        <rect x="46" y="44" width="28" height="6" rx="3" fill="#1f2937" />
        <rect x="54" y="60" width="12" height="20" fill="#7f1d1d" />
      </>);

    // ─── Camping mountains ──────────────────────────────────────────
    case 'compass':
      return wrap(<>
        <circle cx="60" cy="60" r="36" fill="#fff" stroke="#1f2937" strokeWidth="3" />
        <polygon points="60,30 68,60 60,54 52,60" fill="#dc2626" stroke="#1f2937" strokeWidth="1" />
        <polygon points="60,90 52,60 60,66 68,60" fill="#9ca3af" stroke="#1f2937" strokeWidth="1" />
        <circle cx="60" cy="60" r="4" fill="#1f2937" />
      </>);
    case 'map':
      return wrap(<>
        <path d="M 20 34 L 46 28 L 74 34 L 100 28 L 100 90 L 74 96 L 46 90 L 20 96 Z"
          fill="#fef3c7" stroke="#1f2937" strokeWidth="2" />
        <line x1="46" y1="28" x2="46" y2="90" stroke="#1f2937" strokeWidth="1.5" />
        <line x1="74" y1="34" x2="74" y2="96" stroke="#1f2937" strokeWidth="1.5" />
        <path d="M 28 50 Q 60 60 92 48" fill="none" stroke="#dc2626" strokeWidth="2" strokeDasharray="3 3" />
      </>);
    case 'mountain':
      return wrap(<>
        <polygon points="14,92 44,40 64,72 80,48 106,92" fill="#9ca3af" stroke="#1f2937" strokeWidth="2" />
        <polygon points="34,62 44,40 54,62" fill="#fff" stroke="#1f2937" strokeWidth="1" />
        <polygon points="72,60 80,48 88,60" fill="#fff" stroke="#1f2937" strokeWidth="1" />
      </>);
    case 'binoculars':
      return wrap(<>
        <rect x="24" y="42" width="28" height="44" rx="10" fill="#1f2937" />
        <rect x="68" y="42" width="28" height="44" rx="10" fill="#1f2937" />
        <rect x="50" y="50" width="20" height="12" fill="#1f2937" />
        <circle cx="38" cy="80" r="11" fill="#3b82f6" stroke="#1f2937" strokeWidth="2" />
        <circle cx="82" cy="80" r="11" fill="#3b82f6" stroke="#1f2937" strokeWidth="2" />
      </>);

    // ─── Art exhibition ─────────────────────────────────────────────
    case 'easel':
      return wrap(<>
        <line x1="34" y1="100" x2="48" y2="30" stroke="#92400e" strokeWidth="4" />
        <line x1="86" y1="100" x2="72" y2="30" stroke="#92400e" strokeWidth="4" />
        <line x1="60" y1="34" x2="60" y2="104" stroke="#92400e" strokeWidth="4" />
        <rect x="38" y="36" width="44" height="34" fill="#fff" stroke="#1f2937" strokeWidth="2" />
        <polygon points="44,66 56,50 64,60 72,46 76,66" fill="#22c55e" />
      </>);
    case 'paintbrush':
      return wrap(<>
        <line x1="30" y1="96" x2="74" y2="42" stroke="#a16207" strokeWidth="6" />
        <polygon points="74,42 88,30 96,40 84,54 Z" fill="#9ca3af" stroke="#1f2937" strokeWidth="1.5" />
        <polygon points="84,54 96,40 104,52 92,64 Z" fill="#dc2626" stroke="#1f2937" strokeWidth="1.5" />
      </>);
    case 'palette':
      return wrap(<>
        <path d="M 24 60 Q 24 30 60 30 Q 96 30 96 58 Q 96 76 76 74 Q 64 73 64 84 Q 64 96 46 94 Q 24 90 24 60 Z"
          fill="#fde68a" stroke="#1f2937" strokeWidth="2" />
        <circle cx="44" cy="48" r="6" fill="#dc2626" />
        <circle cx="62" cy="44" r="6" fill="#3b82f6" />
        <circle cx="78" cy="52" r="6" fill="#22c55e" />
        <circle cx="46" cy="68" r="7" fill="#fff" stroke="#1f2937" strokeWidth="1.5" />
      </>);
    case 'frame':
      return wrap(<>
        <rect x="24" y="24" width="72" height="72" fill="#a16207" stroke="#1f2937" strokeWidth="3" />
        <rect x="36" y="36" width="48" height="48" fill="#fff" stroke="#1f2937" strokeWidth="2" />
      </>);

    // ─── New baby ───────────────────────────────────────────────────
    case 'baby':
      return wrap(<>
        <circle cx="60" cy="52" r="26" fill="#fce5c0" stroke="#1f2937" strokeWidth="2" />
        <path d="M 40 40 Q 60 24 80 40" fill="#bfdbfe" stroke="#1f2937" strokeWidth="2" />
        <circle cx="52" cy="52" r="3" fill="#1f2937" />
        <circle cx="68" cy="52" r="3" fill="#1f2937" />
        <path d="M 54 62 Q 60 66 66 62" fill="none" stroke="#1f2937" strokeWidth="2" />
        <path d="M 40 84 Q 60 96 80 84" fill="#fbcfe8" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'cot':
      return wrap(<>
        <rect x="22" y="44" width="76" height="40" fill="#bfdbfe" stroke="#1f2937" strokeWidth="2" />
        <line x1="34" y1="44" x2="34" y2="84" stroke="#1f2937" strokeWidth="2" />
        <line x1="48" y1="44" x2="48" y2="84" stroke="#1f2937" strokeWidth="2" />
        <line x1="62" y1="44" x2="62" y2="84" stroke="#1f2937" strokeWidth="2" />
        <line x1="76" y1="44" x2="76" y2="84" stroke="#1f2937" strokeWidth="2" />
        <line x1="88" y1="44" x2="88" y2="84" stroke="#1f2937" strokeWidth="2" />
        <line x1="26" y1="84" x2="26" y2="98" stroke="#1f2937" strokeWidth="3" />
        <line x1="94" y1="84" x2="94" y2="98" stroke="#1f2937" strokeWidth="3" />
      </>);
    case 'bottle':
      return wrap(<>
        <rect x="46" y="20" width="28" height="10" rx="3" fill="#fbcfe8" stroke="#1f2937" strokeWidth="2" />
        <path d="M 52 30 L 68 30 L 74 50 L 74 92 Q 74 98 60 98 Q 46 98 46 92 L 46 50 Z"
          fill="#e0f2fe" stroke="#1f2937" strokeWidth="2" />
        <line x1="50" y1="60" x2="70" y2="60" stroke="#9ca3af" strokeWidth="1.5" />
        <line x1="50" y1="72" x2="70" y2="72" stroke="#9ca3af" strokeWidth="1.5" />
      </>);
    case 'rattle':
      return wrap(<>
        <circle cx="56" cy="44" r="24" fill="#f9a8d4" stroke="#1f2937" strokeWidth="2" />
        <circle cx="50" cy="40" r="4" fill="#fff" />
        <rect x="52" y="66" width="10" height="32" rx="5" fill="#a78bfa" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'pram':
      return wrap(<>
        <path d="M 30 64 Q 30 30 64 30 L 64 64 Z" fill="#fbcfe8" stroke="#1f2937" strokeWidth="2" />
        <rect x="30" y="64" width="58" height="8" fill="#9ca3af" stroke="#1f2937" strokeWidth="2" />
        <line x1="64" y1="40" x2="92" y2="34" stroke="#1f2937" strokeWidth="3" />
        <circle cx="42" cy="88" r="10" fill="#1f2937" />
        <circle cx="78" cy="88" r="10" fill="#1f2937" />
      </>);

    // ─── Science fair ───────────────────────────────────────────────
    case 'microscope':
      return wrap(<>
        <rect x="40" y="92" width="48" height="8" rx="3" fill="#9ca3af" stroke="#1f2937" strokeWidth="2" />
        <rect x="54" y="40" width="10" height="40" fill="#9ca3af" stroke="#1f2937" strokeWidth="2" transform="rotate(20 59 60)" />
        <circle cx="48" cy="34" r="8" fill="#3b82f6" stroke="#1f2937" strokeWidth="2" />
        <rect x="44" y="78" width="36" height="8" fill="#1f2937" />
      </>);
    case 'test_tube':
      return wrap(<>
        <path d="M 50 20 L 70 20 L 70 84 Q 70 96 60 96 Q 50 96 50 84 Z" fill="#bbf7d0" stroke="#1f2937" strokeWidth="2" />
        <path d="M 50 64 L 70 64 L 70 84 Q 70 96 60 96 Q 50 96 50 84 Z" fill="#22c55e" stroke="#1f2937" strokeWidth="2" />
        <line x1="46" y1="20" x2="74" y2="20" stroke="#1f2937" strokeWidth="3" />
      </>);
    case 'robot':
      return wrap(<>
        <rect x="36" y="44" width="48" height="42" rx="6" fill="#9ca3af" stroke="#1f2937" strokeWidth="2" />
        <circle cx="50" cy="60" r="6" fill="#3b82f6" />
        <circle cx="70" cy="60" r="6" fill="#3b82f6" />
        <rect x="50" y="74" width="20" height="5" fill="#1f2937" />
        <line x1="60" y1="44" x2="60" y2="32" stroke="#1f2937" strokeWidth="2" />
        <circle cx="60" cy="28" r="5" fill="#dc2626" />
      </>);
    case 'ruler':
      return wrap(<>
        <rect x="24" y="48" width="72" height="24" fill="#fcd34d" stroke="#1f2937" strokeWidth="2" />
        <line x1="36" y1="48" x2="36" y2="58" stroke="#1f2937" strokeWidth="2" />
        <line x1="48" y1="48" x2="48" y2="60" stroke="#1f2937" strokeWidth="2" />
        <line x1="60" y1="48" x2="60" y2="58" stroke="#1f2937" strokeWidth="2" />
        <line x1="72" y1="48" x2="72" y2="60" stroke="#1f2937" strokeWidth="2" />
        <line x1="84" y1="48" x2="84" y2="58" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'magnet':
      return wrap(<>
        <path d="M 36 30 L 36 70 Q 36 90 60 90 Q 84 90 84 70 L 84 30 L 68 30 L 68 70 Q 68 74 60 74 Q 52 74 52 70 L 52 30 Z"
          fill="#dc2626" stroke="#1f2937" strokeWidth="2" />
        <rect x="36" y="30" width="16" height="14" fill="#9ca3af" stroke="#1f2937" strokeWidth="2" />
        <rect x="68" y="30" width="16" height="14" fill="#9ca3af" stroke="#1f2937" strokeWidth="2" />
      </>);

    // ─── Charity ────────────────────────────────────────────────────
    case 'coin':
      return wrap(<>
        <circle cx="60" cy="60" r="32" fill="#facc15" stroke="#1f2937" strokeWidth="2" />
        <circle cx="60" cy="60" r="24" fill="#fde68a" stroke="#a16207" strokeWidth="2" />
        <text x="60" y="72" fontSize="28" textAnchor="middle" fill="#a16207" fontWeight="bold">$</text>
      </>);
    case 'donation_box':
      return wrap(<>
        <rect x="26" y="50" width="68" height="46" fill="#d6a675" stroke="#1f2937" strokeWidth="2" />
        <rect x="26" y="42" width="68" height="12" fill="#b45309" stroke="#1f2937" strokeWidth="2" />
        <rect x="52" y="46" width="16" height="4" fill="#1f2937" />
        <path d="M 60 30 Q 56 38 60 42 Q 64 38 60 30" fill="#dc2626" />
      </>);
    case 'poster':
      return wrap(<>
        <rect x="28" y="22" width="64" height="76" fill="#fff" stroke="#1f2937" strokeWidth="2" />
        <circle cx="60" cy="44" r="12" fill="#f59e0b" />
        <line x1="38" y1="68" x2="82" y2="68" stroke="#3b82f6" strokeWidth="3" />
        <line x1="38" y1="78" x2="82" y2="78" stroke="#9ca3af" strokeWidth="2" />
        <line x1="38" y1="86" x2="70" y2="86" stroke="#9ca3af" strokeWidth="2" />
      </>);

    // ─── Food festival ──────────────────────────────────────────────
    case 'noodles':
      return wrap(<>
        <path d="M 24 56 Q 60 96 96 56 Z" fill="#fde68a" stroke="#1f2937" strokeWidth="2" />
        <path d="M 36 56 Q 48 36 60 56 Q 72 36 84 56" fill="none" stroke="#f59e0b" strokeWidth="3" />
        <line x1="70" y1="30" x2="58" y2="54" stroke="#92400e" strokeWidth="3" />
        <line x1="80" y1="30" x2="66" y2="54" stroke="#92400e" strokeWidth="3" />
      </>);
    case 'cheese':
      return wrap(<>
        <path d="M 24 80 L 24 56 L 92 44 L 92 80 Z" fill="#facc15" stroke="#1f2937" strokeWidth="2" />
        <circle cx="44" cy="68" r="5" fill="#fde68a" stroke="#a16207" strokeWidth="1" />
        <circle cx="64" cy="62" r="4" fill="#fde68a" stroke="#a16207" strokeWidth="1" />
        <circle cx="78" cy="68" r="4" fill="#fde68a" stroke="#a16207" strokeWidth="1" />
      </>);

    // ─── Eco project ────────────────────────────────────────────────
    case 'recycle_bin':
      return wrap(<>
        <path d="M 34 40 L 86 40 L 80 96 L 40 96 Z" fill="#22c55e" stroke="#1f2937" strokeWidth="2" />
        <rect x="28" y="32" width="64" height="10" rx="3" fill="#15803d" stroke="#1f2937" strokeWidth="2" />
        <path d="M 52 56 L 60 50 L 60 70 M 50 60 L 70 60 L 64 70" fill="none" stroke="#fff" strokeWidth="3" />
      </>);
    case 'solar_panel':
      return wrap(<>
        <rect x="24" y="34" width="72" height="48" fill="#1e3a8a" stroke="#1f2937" strokeWidth="2" />
        <line x1="48" y1="34" x2="48" y2="82" stroke="#60a5fa" strokeWidth="2" />
        <line x1="72" y1="34" x2="72" y2="82" stroke="#60a5fa" strokeWidth="2" />
        <line x1="24" y1="58" x2="96" y2="58" stroke="#60a5fa" strokeWidth="2" />
        <rect x="56" y="82" width="8" height="14" fill="#9ca3af" />
      </>);

    // ─── Space ──────────────────────────────────────────────────────
    case 'rocket':
      return wrap(<>
        <path d="M 60 16 Q 76 40 76 72 L 44 72 Q 44 40 60 16 Z" fill="#e5e7eb" stroke="#1f2937" strokeWidth="2" />
        <circle cx="60" cy="46" r="8" fill="#3b82f6" stroke="#1f2937" strokeWidth="2" />
        <path d="M 44 64 L 30 84 L 44 78 Z" fill="#dc2626" stroke="#1f2937" strokeWidth="2" />
        <path d="M 76 64 L 90 84 L 76 78 Z" fill="#dc2626" stroke="#1f2937" strokeWidth="2" />
        <path d="M 52 72 Q 60 96 68 72 Z" fill="#f97316" stroke="#1f2937" strokeWidth="1" />
      </>);
    case 'telescope':
      return wrap(<>
        <rect x="30" y="44" width="56" height="16" rx="6" fill="#9ca3af" stroke="#1f2937" strokeWidth="2" transform="rotate(-20 58 52)" />
        <ellipse cx="84" cy="40" rx="7" ry="11" fill="#bfdbfe" stroke="#1f2937" strokeWidth="2" transform="rotate(-20 84 40)" />
        <line x1="52" y1="68" x2="44" y2="96" stroke="#1f2937" strokeWidth="3" />
        <line x1="52" y1="68" x2="68" y2="92" stroke="#1f2937" strokeWidth="3" />
      </>);
    case 'planet':
      return wrap(<>
        <circle cx="60" cy="58" r="26" fill="#f59e0b" stroke="#1f2937" strokeWidth="2" />
        <ellipse cx="60" cy="58" rx="42" ry="12" fill="none" stroke="#7c3aed" strokeWidth="4" transform="rotate(-20 60 58)" />
      </>);
    case 'astronaut_helmet':
      return wrap(<>
        <circle cx="60" cy="58" r="34" fill="#e5e7eb" stroke="#1f2937" strokeWidth="2" />
        <rect x="40" y="44" width="40" height="32" rx="10" fill="#1e3a8a" stroke="#1f2937" strokeWidth="2" />
        <ellipse cx="50" cy="54" rx="6" ry="8" fill="#bfdbfe" />
      </>);
    case 'star':
      return wrap(<>
        <polygon points="60,18 70,46 100,46 76,64 85,94 60,76 35,94 44,64 20,46 50,46"
          fill="#facc15" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'moon':
      return wrap(<>
        <path d="M 72 22 A 38 38 0 1 0 72 98 A 30 30 0 1 1 72 22 Z" fill="#e5e7eb" stroke="#1f2937" strokeWidth="2" />
        <circle cx="52" cy="44" r="5" fill="#9ca3af" />
        <circle cx="44" cy="64" r="4" fill="#9ca3af" />
      </>);

    // ─── Cooking competition ────────────────────────────────────────
    case 'whisk':
      return wrap(<>
        <rect x="54" y="20" width="12" height="30" rx="4" fill="#9ca3af" stroke="#1f2937" strokeWidth="2" />
        <path d="M 60 50 Q 40 70 50 98 M 60 50 Q 60 74 60 98 M 60 50 Q 80 70 70 98" fill="none" stroke="#9ca3af" strokeWidth="3" />
      </>);
    case 'knife':
      return wrap(<>
        <path d="M 30 70 L 78 30 Q 88 38 80 50 L 44 80 Z" fill="#d1d5db" stroke="#1f2937" strokeWidth="2" />
        <rect x="26" y="70" width="22" height="10" rx="3" fill="#92400e" stroke="#1f2937" strokeWidth="2" transform="rotate(40 37 75)" />
      </>);
    case 'chef_hat':
      return wrap(<>
        <path d="M 38 60 Q 24 60 28 46 Q 28 32 44 34 Q 48 22 60 22 Q 72 22 76 34 Q 92 32 92 46 Q 96 60 82 60 Z"
          fill="#fff" stroke="#1f2937" strokeWidth="2" />
        <rect x="40" y="60" width="40" height="20" fill="#fff" stroke="#1f2937" strokeWidth="2" />
      </>);

    // ─── Film making ────────────────────────────────────────────────
    case 'clapperboard':
      return wrap(<>
        <rect x="24" y="52" width="72" height="40" fill="#1f2937" />
        <path d="M 24 52 L 36 40 L 50 52 L 62 40 L 76 52 L 88 40 L 96 48 L 96 52 Z" fill="#fff" stroke="#1f2937" strokeWidth="2" />
        <line x1="36" y1="46" x2="44" y2="52" stroke="#1f2937" strokeWidth="2" />
        <line x1="62" y1="46" x2="70" y2="52" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'video_camera':
      return wrap(<>
        <rect x="26" y="44" width="50" height="36" rx="5" fill="#1f2937" />
        <polygon points="76,54 96,44 96,80 76,70" fill="#374151" stroke="#1f2937" strokeWidth="2" />
        <circle cx="44" cy="62" r="9" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
        <circle cx="40" cy="38" r="6" fill="#1f2937" />
      </>);
    case 'script_paper':
      return wrap(<>
        <rect x="34" y="22" width="52" height="76" fill="#fff" stroke="#1f2937" strokeWidth="2" />
        <line x1="44" y1="38" x2="76" y2="38" stroke="#9ca3af" strokeWidth="2" />
        <line x1="44" y1="50" x2="76" y2="50" stroke="#9ca3af" strokeWidth="2" />
        <line x1="44" y1="62" x2="68" y2="62" stroke="#9ca3af" strokeWidth="2" />
        <line x1="44" y1="74" x2="76" y2="74" stroke="#9ca3af" strokeWidth="2" />
      </>);
    case 'light_bulb':
      return wrap(<>
        <circle cx="60" cy="48" r="26" fill="#fde68a" stroke="#1f2937" strokeWidth="2" />
        <rect x="50" y="72" width="20" height="14" fill="#9ca3af" stroke="#1f2937" strokeWidth="2" />
        <line x1="52" y1="90" x2="68" y2="90" stroke="#1f2937" strokeWidth="2" />
        <path d="M 54 44 L 60 54 L 66 44" fill="none" stroke="#f59e0b" strokeWidth="2" />
      </>);

    // ─── Photography ────────────────────────────────────────────────
    case 'camera':
      return wrap(<>
        <rect x="22" y="42" width="76" height="48" rx="6" fill="#1f2937" />
        <rect x="40" y="34" width="24" height="10" fill="#1f2937" />
        <circle cx="60" cy="66" r="16" fill="#374151" stroke="#9ca3af" strokeWidth="2" />
        <circle cx="60" cy="66" r="8" fill="#3b82f6" />
        <circle cx="86" cy="52" r="3" fill="#facc15" />
      </>);
    case 'tripod':
      return wrap(<>
        <rect x="46" y="22" width="28" height="16" rx="3" fill="#1f2937" />
        <line x1="60" y1="38" x2="60" y2="70" stroke="#9ca3af" strokeWidth="3" />
        <line x1="60" y1="66" x2="34" y2="98" stroke="#1f2937" strokeWidth="3" />
        <line x1="60" y1="66" x2="86" y2="98" stroke="#1f2937" strokeWidth="3" />
        <line x1="60" y1="66" x2="60" y2="98" stroke="#1f2937" strokeWidth="3" />
      </>);
    case 'lens':
      return wrap(<>
        <circle cx="60" cy="60" r="32" fill="#374151" stroke="#1f2937" strokeWidth="2" />
        <circle cx="60" cy="60" r="22" fill="#1f2937" stroke="#9ca3af" strokeWidth="2" />
        <circle cx="60" cy="60" r="12" fill="#3b82f6" />
        <circle cx="54" cy="54" r="4" fill="#bfdbfe" />
      </>);
    case 'photo':
      return wrap(<>
        <rect x="24" y="28" width="72" height="64" fill="#fff" stroke="#1f2937" strokeWidth="2" />
        <polygon points="32,84 52,56 64,70 78,50 88,84" fill="#22c55e" />
        <circle cx="74" cy="46" r="7" fill="#facc15" />
      </>);

    // ─── Mountain hiking ────────────────────────────────────────────
    case 'rope':
      return wrap(<>
        <circle cx="60" cy="56" r="34" fill="none" stroke="#a16207" strokeWidth="8" />
        <circle cx="60" cy="56" r="20" fill="none" stroke="#92400e" strokeWidth="8" />
        <line x1="84" y1="78" x2="98" y2="96" stroke="#a16207" strokeWidth="6" />
      </>);
    case 'flask':
      return wrap(<>
        <rect x="46" y="22" width="28" height="12" rx="3" fill="#9ca3af" stroke="#1f2937" strokeWidth="2" />
        <rect x="42" y="34" width="36" height="62" rx="10" fill="#dc2626" stroke="#1f2937" strokeWidth="2" />
        <rect x="42" y="50" width="36" height="8" fill="#fff" opacity="0.5" />
      </>);
    case 'flag':
      return wrap(<>
        <line x1="38" y1="20" x2="38" y2="98" stroke="#92400e" strokeWidth="4" />
        <path d="M 38 24 L 88 34 L 38 56 Z" fill="#dc2626" stroke="#1f2937" strokeWidth="2" />
      </>);

    default:
      return wrap(<text x="60" y="68" fontSize="40" textAnchor="middle" fill="#9ca3af">?</text>);
  }
}

// ─── Sub-icon helpers ──────────────────────────────────────────────────

function ClockIcon({ h }: { h: number }) {
  const angle = (h * 30) - 90;
  const x = 60 + 30 * Math.cos((angle * Math.PI) / 180);
  const y = 60 + 30 * Math.sin((angle * Math.PI) / 180);
  return (
    <>
      <circle cx="60" cy="60" r="44" fill="#fff" stroke="#1f2937" strokeWidth="3" />
      <text x="60" y="22" fontSize="10" textAnchor="middle" fill="#1f2937" fontWeight="bold">12</text>
      <text x="100" y="64" fontSize="10" textAnchor="middle" fill="#1f2937" fontWeight="bold">3</text>
      <text x="60" y="105" fontSize="10" textAnchor="middle" fill="#1f2937" fontWeight="bold">6</text>
      <text x="20" y="64" fontSize="10" textAnchor="middle" fill="#1f2937" fontWeight="bold">9</text>
      <line x1="60" y1="60" x2="60" y2="35" stroke="#1f2937" strokeWidth="3" /> {/* minute = 12 */}
      <line x1="60" y1="60" x2={x} y2={y} stroke="#1f2937" strokeWidth="4" /> {/* hour */}
      <circle cx="60" cy="60" r="3" fill="#1f2937" />
    </>
  );
}

function NumberIcon({ n }: { n: number }) {
  const dots = [];
  for (let i = 0; i < n; i++) {
    const cx = 30 + (i % 3) * 30;
    const cy = 40 + Math.floor(i / 3) * 30;
    dots.push(<circle key={i} cx={cx} cy={cy} r="10" fill="#dc2626" stroke="#1f2937" strokeWidth="2" />);
  }
  return <>{dots}</>;
}

/** Row(s) of apples — used by apple_2 / apple_3 / apple_4 (fixes broken ids). */
function AppleCountIcon({ n }: { n: number }) {
  const apples = [];
  for (let i = 0; i < n; i++) {
    const cx = 28 + (i % 3) * 30;
    const cy = 48 + Math.floor(i / 3) * 34;
    apples.push(
      <g key={i}>
        <circle cx={cx} cy={cy} r="13" fill="#dc2626" stroke="#1f2937" strokeWidth="2" />
        <line x1={cx} y1={cy - 13} x2={cx} y2={cy - 19} stroke="#92400e" strokeWidth="2" />
        <path d={`M ${cx} ${cy - 17} Q ${cx + 6} ${cy - 23} ${cx + 9} ${cy - 18}`} fill="none" stroke="#22c55e" strokeWidth="2" />
      </g>,
    );
  }
  return <>{apples}</>;
}

/** Car carrying a small object — fixes broken car_teddy / car_shirt / car_book ids. */
function CarIcon({ cargo }: { cargo: 'teddy' | 'shirt' | 'book' }) {
  const cargoEl =
    cargo === 'teddy' ? (
      <>
        <circle cx="60" cy="34" r="11" fill="#92400e" stroke="#1f2937" strokeWidth="2" />
        <circle cx="51" cy="25" r="5" fill="#92400e" stroke="#1f2937" strokeWidth="2" />
        <circle cx="69" cy="25" r="5" fill="#92400e" stroke="#1f2937" strokeWidth="2" />
      </>
    ) : cargo === 'shirt' ? (
      <path d="M 44 26 L 52 20 L 68 20 L 76 26 L 71 34 L 68 32 L 68 44 L 52 44 L 52 32 L 49 34 Z"
        fill="#dc2626" stroke="#1f2937" strokeWidth="2" />
    ) : (
      <rect x="48" y="24" width="24" height="20" fill="#3b82f6" stroke="#1f2937" strokeWidth="2" />
    );
  return (
    <>
      {cargoEl}
      <rect x="18" y="52" width="84" height="26" rx="8" fill="#f97316" stroke="#1f2937" strokeWidth="2" />
      <path d="M 34 52 Q 40 44 60 44 L 60 52 Z" fill="#f97316" stroke="#1f2937" strokeWidth="2" />
      <circle cx="38" cy="82" r="9" fill="#1f2937" />
      <circle cx="84" cy="82" r="9" fill="#1f2937" />
    </>
  );
}
