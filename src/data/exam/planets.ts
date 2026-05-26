import { countCompletedInRange } from '../../services/examProgressService';

/**
 * 3 planets representing the 3 Cambridge YLE difficulty bands.
 *
 * Visual theme per planet (Sprint 4.8 launch):
 *   - Starters: green (mint), dinosaur 🦕, basic learner vibe
 *   - Movers:   blue/teal, mushroom 🍄, water/forest theme
 *   - Flyers:   purple/pink, planet 🪐, space/cosmic theme
 *
 * Gating:
 *   - Starters: always unlocked
 *   - Movers: unlocks at 12/20 Starters complete (60% pass rate)
 *   - Flyers: unlocks at 12/20 Movers complete
 *
 * Threshold of 12/20 is intentionally moderate — kids don't have to
 * 100% Starters to advance, but enough to demonstrate baseline skill.
 */
export type PlanetId = 'starters' | 'movers' | 'flyers';

export interface Planet {
  id: PlanetId;
  /** English heading shown in Sour Gummy. */
  name: string;
  /** Vietnamese subtitle in Be Vietnam Pro. */
  subtitle: string;
  /** Vietnamese description. */
  description: string;
  /** First level number in the planet's range (inclusive). */
  levelStart: number;
  /** Last level number in the planet's range (inclusive). */
  levelEnd: number;
  /** CEFR level badges shown on the info card (e.g. ['A1'] or ['A1', 'A2']) */
  cefrBadges: string[];
  /** Tailwind color theme for this planet's card. */
  theme: PlanetTheme;
  /** Gating requirement, or null if always unlocked. */
  unlockRequirement: { planetId: PlanetId; minCompleted: number } | null;
}

export interface PlanetTheme {
  /** Card border color */
  border: string;
  /** Card background gradient (Tailwind classes) */
  bg: string;
  /** Heading text color */
  heading: string;
  /** Subtitle text color */
  subtitle: string;
  /** Decoration emoji rendered on the card */
  emoji: string;
  /** Decoration label for screen readers */
  emojiLabel: string;
  /** CSS background gradient for the round planet body (Sprint 4.8.1) */
  bodyGradient: string;
  /** CSS background color for the atmospheric glow (Sprint 4.8.1) */
  glowColor: string;
  /** Tailwind class for difficulty badge background (Sprint 4.8.1) */
  badgeBg: string;
  /** Tailwind class for the START button background (Sprint 4.8.1) */
  buttonBg: string;
  /** Sprint 4.8.5: Full-bleed page background gradient (Tailwind classes).
   *  Used by Roadmap + ExamSession pages so each planet has a consistent
   *  visual identity across navigation + exam UI. */
  pageBg: string;
}

export const PLANETS: Planet[] = [
  {
    id: 'starters',
    name: 'STARTERS',
    subtitle: 'Mức độ cơ bản — Pre-A1',
    description: 'Bắt đầu hành trình tiếng Anh với từ vựng và câu cơ bản!',
    levelStart: 1,
    levelEnd: 20,
    cefrBadges: ['A1'],
    theme: {
      border: 'border-mint-700',
      bg: 'from-mint-100 to-green-50',
      heading: 'text-mint-700',
      subtitle: 'text-mint-800',
      emoji: '🦕',
      emojiLabel: 'dinosaur',
      // Lush green planet — like a forest moon
      bodyGradient: 'radial-gradient(circle at 35% 30%, #6ee7b7 0%, #10b981 40%, #047857 80%, #064e3b 100%)',
      glowColor: '#34d399',
      badgeBg: 'bg-emerald-600',
      buttonBg: 'bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600',
      pageBg: 'bg-gradient-to-b from-emerald-200 via-mint-100 to-green-50',
    },
    unlockRequirement: null,
  },
  {
    id: 'movers',
    name: 'MOVERS',
    subtitle: 'Mức độ trung cấp — A1/A2',
    description: 'Bước tiến mới với thì quá khứ và so sánh!',
    levelStart: 21,
    levelEnd: 40,
    cefrBadges: ['A1', 'A2'],
    theme: {
      border: 'border-sky-700',
      bg: 'from-sky-100 to-blue-50',
      heading: 'text-sky-700',
      subtitle: 'text-sky-800',
      emoji: '🍄',
      emojiLabel: 'mushroom',
      // Ocean blue planet — water world vibe
      bodyGradient: 'radial-gradient(circle at 35% 30%, #93c5fd 0%, #3b82f6 40%, #1d4ed8 80%, #1e3a8a 100%)',
      glowColor: '#60a5fa',
      badgeBg: 'bg-blue-600',
      buttonBg: 'bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600',
      pageBg: 'bg-gradient-to-b from-sky-300 via-sky-100 to-blue-50',
    },
    unlockRequirement: { planetId: 'starters', minCompleted: 12 },
  },
  {
    id: 'flyers',
    name: 'FLYERS',
    subtitle: 'Mức độ nâng cao — A2/B1',
    description: 'Thử thách tiếng Anh với thì tương lai và điều kiện!',
    levelStart: 41,
    levelEnd: 60,
    cefrBadges: ['A2', 'B1'],
    theme: {
      border: 'border-purple-700',
      bg: 'from-purple-100 to-pink-50',
      heading: 'text-purple-700',
      subtitle: 'text-purple-800',
      emoji: '🪐',
      emojiLabel: 'planet',
      // Cosmic purple-pink planet
      bodyGradient: 'radial-gradient(circle at 35% 30%, #f0abfc 0%, #c084fc 40%, #7e22ce 80%, #581c87 100%)',
      glowColor: '#d8b4fe',
      badgeBg: 'bg-purple-600',
      buttonBg: 'bg-gradient-to-b from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600',
      pageBg: 'bg-gradient-to-b from-purple-300 via-pink-100 to-fuchsia-50',
    },
    unlockRequirement: { planetId: 'movers', minCompleted: 12 },
  },
];

/** Get a planet by its ID. */
export function getPlanet(planetId: PlanetId): Planet {
  const p = PLANETS.find((p) => p.id === planetId);
  if (!p) throw new Error(`Unknown planet: ${planetId}`);
  return p;
}

/**
 * Check whether a planet is unlocked given current progress.
 * Always returns true for Starters.
 */
export function isPlanetUnlocked(planetId: PlanetId): boolean {
  const planet = getPlanet(planetId);
  if (!planet.unlockRequirement) return true;
  // Admin bypass: super admin can open any planet to test / generate assets
  // for all levels without grinding through the progression gate. Normal
  // users still must meet the unlock requirement. Mirrors isAdminMode()
  // (presence of admin_token in sessionStorage).
  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('admin_token')) {
    return true;
  }
  const req = planet.unlockRequirement;
  const reqPlanet = getPlanet(req.planetId);
  const completed = countCompletedInRange(reqPlanet.levelStart, reqPlanet.levelEnd);
  return completed >= req.minCompleted;
}

/**
 * Get progress summary for a planet (X completed out of N total).
 */
export interface PlanetProgress {
  planetId: PlanetId;
  completed: number;
  total: number;
  unlocked: boolean;
}

export function getPlanetProgress(planetId: PlanetId): PlanetProgress {
  const planet = getPlanet(planetId);
  const total = planet.levelEnd - planet.levelStart + 1;
  const completed = countCompletedInRange(planet.levelStart, planet.levelEnd);
  return {
    planetId,
    completed,
    total,
    unlocked: isPlanetUnlocked(planetId),
  };
}

/**
 * Determine which planet contains a level number. Used by ExamSession
 * for "next level" navigation and by the breadcrumb back button.
 */
export function planetForLevel(levelNumber: number): PlanetId {
  if (levelNumber >= 41) return 'flyers';
  if (levelNumber >= 21) return 'movers';
  return 'starters';
}
