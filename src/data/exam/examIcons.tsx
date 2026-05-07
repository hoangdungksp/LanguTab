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
  | 'count_5';

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
    case 'clock_6': return wrap(<ClockIcon h={6} />);

    // ─── Animals ────────────────────────────────────────────────────
    case 'cat':
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
      return wrap(<>
        <rect x="14" y="60" width="92" height="40" fill="#3b82f6" stroke="#1f2937" strokeWidth="2" />
        <circle cx="60" cy="55" r="14" fill="#fce5c0" stroke="#1f2937" strokeWidth="2" />
        <path d="M 48 51 Q 60 36 72 51" fill="#ec4899" stroke="#1f2937" strokeWidth="2" />
      </>);
    case 'doll_under_chair':
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
