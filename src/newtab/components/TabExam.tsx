import { useMemo, useEffect, useState } from 'react';
import { getLevelsForLang } from '../../data/exam';
import { useAppStore } from '../../stores/useAppStore';
import {
  getPlanet,
  getPlanetsForLang,
  type PlanetId,
} from '../../data/exam/planets';
import { clearAudioCache } from '../../services/examAudioService';
import { clearSceneCache } from '../../services/examSceneService';
import {
  countCompletedInRange,
  isLevelCompleted,
} from '../../services/examProgressService';
import type { ExamLevel } from '../../types';
import { ExamSession } from './ExamSession';
import { PlanetsScreen } from './PlanetsScreen';

/**
 * Phòng thi (Exam Room) — Sprint 4.8 redesign with 3 Planets navigation.
 *
 * Three-screen flow:
 *   1. PlanetsScreen — landing, 3 hero cards (Starters/Movers/Flyers)
 *   2. Roadmap — game-style snaking path within selected planet
 *   3. ExamSession — actual exam UI when a level is picked
 *
 * Back navigation:
 *   - Roadmap → click "← Hành tinh" returns to PlanetsScreen
 *   - ExamSession → exit returns to Roadmap (stays in current planet)
 *
 * Progress persisted via examProgressService (localStorage MVP, will add
 * D1 sync in Sprint 5+ once exam_attempts table exists).
 */
export function TabExam() {
  // D-23: exam follows the app's target language. English = Cambridge YLE
  // (Starters/Movers/Flyers); Chinese = HSK (HSK1/2/3).
  const targetLang = useAppStore((s) => s.targetLang);
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetId | null>(null);
  const [activeLevel, setActiveLevel] = useState<ExamLevel | null>(null);

  // Force re-render after exam completion so progress stars update.
  // Bumped by ExamSession via the onExit prop after attempts persist.
  const [progressBump, setProgressBump] = useState(0);

  // Free audio + scene blob URLs when the user leaves the exam tab.
  useEffect(() => {
    return () => {
      clearAudioCache();
      clearSceneCache();
    };
  }, []);

  // Switching language resets exam navigation (planet ids differ per lang).
  useEffect(() => {
    setSelectedPlanet(null);
    setActiveLevel(null);
  }, [targetLang]);

  // ─── Active exam session ────────────────────────────────────────────
  if (activeLevel) {
    return (
      <ExamSession
        level={activeLevel}
        onExit={() => {
          setActiveLevel(null);
          // Trigger re-render so completion stars in the roadmap update
          setProgressBump((n) => n + 1);
        }}
      />
    );
  }

  // ─── Roadmap within a selected planet ───────────────────────────────
  if (selectedPlanet) {
    const planet = getPlanet(selectedPlanet);
    const planetLevels = getLevelsForLang(targetLang).filter(
      (l) => l.levelNumber >= planet.levelStart && l.levelNumber <= planet.levelEnd,
    );
    return (
      <Roadmap
        key={`${targetLang}:${progressBump}` /* re-mount on completion / lang switch */}
        planetId={selectedPlanet}
        levels={planetLevels}
        onPickLevel={setActiveLevel}
        onBack={() => setSelectedPlanet(null)}
      />
    );
  }

  // ─── Landing: planets for the current language ──────────────────────
  return (
    <PlanetsScreen
      planets={getPlanetsForLang(targetLang)}
      onSelectPlanet={setSelectedPlanet}
    />
  );
}

// ─── Roadmap colour theme per planet ────────────────────────────────────

/**
 * Roadmap visuals (background SVG, snake path, level nodes) are tinted to
 * match the planet: Starters green, Movers blue, Flyers purple. Node classes
 * are full static Tailwind strings (so the JIT compiler keeps them).
 */
interface RoadmapTheme {
  groundFrom: string;
  groundTo: string;
  foliage: [string, string, string];
  pathMain: string;
  pathLight: string;
  /** Tailwind classes for an incomplete node circle. */
  nodeIdle: string;
  /** Tailwind classes for an incomplete node label. */
  labelIdle: string;
}

function getRoadmapTheme(planetId: PlanetId): RoadmapTheme {
  if (planetId === 'movers') {
    return {
      groundFrom: '#bfdbfe', groundTo: '#93c5fd',
      foliage: ['#1e40af', '#2563eb', '#3b82f6'],
      pathMain: '#2563eb', pathLight: '#bfdbfe',
      nodeIdle: 'border-blue-700 bg-gradient-to-b from-blue-300 to-blue-500 text-white shadow-chunky-ink hover:from-blue-400 hover:to-blue-600',
      labelIdle: 'border-blue-700 bg-blue-600 text-white shadow-chunky-soft',
    };
  }
  if (planetId === 'flyers') {
    return {
      groundFrom: '#e9d5ff', groundTo: '#d8b4fe',
      foliage: ['#6b21a8', '#7e22ce', '#9333ea'],
      pathMain: '#9333ea', pathLight: '#e9d5ff',
      nodeIdle: 'border-purple-700 bg-gradient-to-b from-purple-300 to-purple-500 text-white shadow-chunky-ink hover:from-purple-400 hover:to-purple-600',
      labelIdle: 'border-purple-700 bg-purple-600 text-white shadow-chunky-soft',
    };
  }
  // starters (default) — green
  return {
    groundFrom: '#86efac', groundTo: '#4ade80',
    foliage: ['#15803d', '#16a34a', '#22c55e'],
    pathMain: '#22c55e', pathLight: '#bbf7d0',
    nodeIdle: 'border-mint-700 bg-gradient-to-b from-mint-300 to-mint-500 text-white shadow-chunky-ink hover:from-mint-400 hover:to-mint-600',
    labelIdle: 'border-mint-700 bg-mint-600 text-white shadow-chunky-soft',
  };
}

// ─── Roadmap (the path with level nodes) ────────────────────────────────

function Roadmap({
  planetId,
  levels,
  onPickLevel,
  onBack,
}: {
  planetId: PlanetId;
  levels: ExamLevel[];
  onPickLevel: (level: ExamLevel) => void;
  onBack: () => void;
}) {
  const planet = getPlanet(planetId);
  const rtheme = getRoadmapTheme(planetId);
  // Compute node positions on a snaking path. Each "row" holds 3 nodes,
  // alternating left-to-right and right-to-left to create the wave shape.
  const layout = useMemo(() => computeLayout(levels), [levels]);

  // Live progress count for this planet (refreshed on Roadmap mount via key prop)
  const completed = countCompletedInRange(planet.levelStart, planet.levelEnd);

  return (
    // Sprint 4.8.7: Vertical layout — centered max-w-5xl container with
    // overflow visible (no horizontal scroll). Snake path goes top to
    // bottom matching roadmap.png reference.
    <div className={`full-bleed -mt-2 min-h-screen ${planet.theme.pageBg}`}>
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
        {/* Plain heading — same style as PlanetsScreen "CHOOSE YOUR PLANET":
            centered Sour Gummy big, no card/border/background. Back button
            and progress are floating bare elements (no card around them). */}
        <div className="relative mb-6 text-center">
          {/* Back button — floats top-left, no card around it */}
          <button
            onClick={onBack}
            className={`absolute left-0 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1 text-sm font-bold transition-colors hover:opacity-70 ${planet.theme.heading}`}
            aria-label="Quay lại danh sách hành tinh"
          >
            ← <span className="hidden sm:inline">Hành tinh</span>
          </button>
          {/* Planet name — big Sour Gummy heading like PlanetsScreen */}
          <h1 className={`font-heading text-5xl font-black tracking-wide drop-shadow-sm sm:text-6xl ${planet.theme.heading}`}>
            {planet.name}
          </h1>
          {/* Progress — text-only, top-right */}
          <div className={`absolute right-0 top-1/2 -translate-y-1/2 font-heading text-xl font-black ${planet.theme.heading}`}>
            ⭐ {completed}/{levels.length}
          </div>
        </div>

        {/* Vertical snake path canvas — centered, no border, scrolls vertically
            inside the page (page itself scrolls if content > viewport). */}
        <div className="flex justify-center">
          <div
            className="relative"
            style={{
              width: `${layout.width}px`,
              height: `${layout.height}px`,
            }}
          >
            {/* Background decorations (trees, clouds, characters) */}
            <BackgroundDecorations width={layout.width} height={layout.height} theme={rtheme} />

            {/* SVG path connecting nodes */}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              preserveAspectRatio="none"
            >
              <path
                d={layout.pathD}
                fill="none"
                stroke={rtheme.pathMain}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray="0,0"
                opacity="0.85"
              />
              <path
                d={layout.pathD}
                fill="none"
                stroke={rtheme.pathLight}
                strokeWidth="6"
                strokeLinecap="round"
              />
            </svg>

            {/* Level nodes */}
            {layout.nodes.map((node) => {
              const completed = isLevelCompleted(node.level.levelNumber);
              return (
                <LevelNode
                  key={node.level.levelNumber}
                  level={node.level}
                  x={node.x}
                  y={node.y}
                  completed={completed}
                  idleCircle={rtheme.nodeIdle}
                  idleLabel={rtheme.labelIdle}
                  onClick={() => onPickLevel(node.level)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Path layout math ───────────────────────────────────────────────────

interface NodeLayout {
  level: ExamLevel;
  x: number;
  y: number;
}
interface Layout {
  nodes: NodeLayout[];
  pathD: string;
  width: number;
  height: number;
}

/**
 * Snake-shaped layout. Levels are laid out 4 per "row", alternating L→R
 * and R→L. Within a row the y-coordinate offset zig-zags up and down to
 * give a wavy feel.
 */
/**
 * Sprint 4.8.7: Vertical snake path layout (reverted from horizontal).
 *
 * Per Jason's roadmap.png reference: levels flow top-to-bottom in 4
 * columns. Each row of 4 alternates direction (left-to-right on even
 * rows, right-to-left on odd rows) creating the classic Cambridge YLE
 * "snake" zigzag.
 *
 * Layout pattern (visualized for 12 levels at 4 cols × 3 rows):
 *
 *     col 0   col 1   col 2   col 3
 *   ┌─────────────────────────────────┐
 *   │ 1 ──── 2 ──── 3 ──── 4          │  row 0 (left → right)
 *   │                       │          │
 *   │ 8 ──── 7 ──── 6 ──── 5          │  row 1 (right → left)
 *   │ │                                │
 *   │ 9 ───10 ──── 11 ─── 12          │  row 2 (left → right)
 *   └─────────────────────────────────┘
 *
 * The yWiggle offset within a row gives a more natural wave shape than
 * pure horizontal lines — nodes alternate slightly above/below the row's
 * baseline, like a waveform.
 *
 * Page-level scroll behavior: container is overflow-y-auto so user
 * scrolls down to see later levels.
 */
function computeLayout(levels: ExamLevel[]): Layout {
  const nodesPerRow = 4;
  const colSpacing = 200;
  const rowHeight = 220;
  const startX = 130;
  const startY = 130;
  const yWiggle = 50; // up-down offset within a row for wave shape

  const nodes: NodeLayout[] = [];
  levels.forEach((level, i) => {
    const row = Math.floor(i / nodesPerRow);
    const colInRow = i % nodesPerRow;
    const goingRight = row % 2 === 0;
    const col = goingRight ? colInRow : nodesPerRow - 1 - colInRow;
    const x = startX + col * colSpacing;
    const y =
      startY + row * rowHeight + (col % 2 === 0 ? -yWiggle : yWiggle);
    nodes.push({ level, x, y });
  });

  // Build SVG path: line segments connecting nodes in order
  const pathD = nodes
    .map((n, i) => (i === 0 ? `M ${n.x} ${n.y}` : `L ${n.x} ${n.y}`))
    .join(' ');

  // Width fits 4 columns; height grows with level count
  const width = nodesPerRow * colSpacing + 100;
  const lastRow = Math.floor((levels.length - 1) / nodesPerRow);
  const height = startY + lastRow * rowHeight + yWiggle + 150;

  return { nodes, pathD, width, height };
}

// ─── Single level node ──────────────────────────────────────────────────

function LevelNode({
  level,
  x,
  y,
  completed,
  idleCircle,
  idleLabel,
  onClick,
}: {
  level: ExamLevel;
  x: number;
  y: number;
  completed: boolean;
  idleCircle: string;
  idleLabel: string;
  onClick: () => void;
}) {
  const num = level.levelNumber;
  // Title shows just the within-planet index (e.g. "Movers 5") since the
  // planet header above already contextualizes which planet we're in.
  const title = level.title;
  return (
    <button
      onClick={onClick}
      style={{ left: `${x}px`, top: `${y}px` }}
      className="absolute -translate-x-1/2 -translate-y-1/2 transform transition-all hover:scale-105"
    >
      {/* Node circle — Sprint 4.8: completed nodes get gold border + star */}
      <div
        className={[
          'relative flex h-20 w-20 items-center justify-center rounded-full border-[6px] font-display text-3xl font-bold transition-all',
          completed
            ? 'border-amber-500 bg-gradient-to-b from-amber-300 to-amber-500 text-white shadow-chunky-ink'
            : idleCircle,
        ].join(' ')}
      >
        {num}
        {completed && (
          <div className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-amber-700 bg-paper text-sm shadow-chunky-soft">
            ⭐
          </div>
        )}
      </div>
      {/* Label below */}
      <div
        className={[
          'mt-1 max-w-[140px] rounded-md border-2 px-2 py-1 text-center text-[11px] font-bold leading-tight',
          completed
            ? 'border-amber-700 bg-amber-500 text-white shadow-chunky-soft'
            : idleLabel,
        ].join(' ')}
      >
        {title}
      </div>
    </button>
  );
}

// ─── Background decorations ─────────────────────────────────────────────

/**
 * Decorative SVG layered behind the path. Draws clouds, trees, and
 * cute critters in fixed positions across the canvas to fill empty space
 * and make the map feel alive (like Cambridge's "STARTERS" map).
 */
function BackgroundDecorations({ width, height, theme }: { width: number; height: number; theme: RoadmapTheme }) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      {/* Ground gradient — tinted per planet */}
      <defs>
        <linearGradient id="grass" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={theme.groundFrom} />
          <stop offset="100%" stopColor={theme.groundTo} />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={width} height={height} fill="url(#grass)" opacity="0.5" />

      {/* Trees/bushes scattered — foliage tinted per planet */}
      {[0.06, 0.18, 0.32, 0.48, 0.62, 0.78, 0.92].map((px, i) => {
        const px2 = (i % 3 === 0 ? px - 0.02 : px + 0.04);
        const py = 0.15 + (i % 3) * 0.25;
        return (
          <g key={`t${i}`} transform={`translate(${width * px2} ${height * py})`}>
            <rect x="-6" y="0" width="12" height="40" fill="#7c3a0e" />
            <circle cx="0" cy="-10" r="32" fill={theme.foliage[0]} />
            <circle cx="-12" cy="-25" r="22" fill={theme.foliage[1]} />
            <circle cx="14" cy="-20" r="20" fill={theme.foliage[2]} />
          </g>
        );
      })}

      {/* Clouds */}
      {[
        [0.15, 0.04],
        [0.55, 0.03],
        [0.85, 0.06],
      ].map(([px, py], i) => (
        <g key={`c${i}`} transform={`translate(${width * px} ${height * py})`}>
          <ellipse cx="0" cy="0" rx="60" ry="18" fill="#fff" opacity="0.85" />
          <ellipse cx="-20" cy="-10" rx="30" ry="14" fill="#fff" opacity="0.85" />
          <ellipse cx="22" cy="-8" rx="32" ry="15" fill="#fff" opacity="0.85" />
        </g>
      ))}

      {/* Cute critters */}
      {[
        { x: 0.07, y: 0.42, color: '#a78bfa' }, // purple
        { x: 0.42, y: 0.62, color: '#fde047' }, // yellow
        { x: 0.74, y: 0.30, color: '#f472b6' }, // pink
        { x: 0.28, y: 0.85, color: '#60a5fa' }, // blue
      ].map((c, i) => (
        <g key={`cr${i}`} transform={`translate(${width * c.x} ${height * c.y})`}>
          <ellipse cx="0" cy="0" rx="22" ry="18" fill={c.color} />
          <circle cx="-8" cy="-3" r="3" fill="#1f2937" />
          <circle cx="8" cy="-3" r="3" fill="#1f2937" />
          <path d="M -6 6 Q 0 10 6 6" fill="none" stroke="#1f2937" strokeWidth="2" />
        </g>
      ))}

      {/* Slide / playground (bottom-right ish) */}
      <g transform={`translate(${width * 0.88} ${height * 0.78})`}>
        <rect x="-30" y="-50" width="6" height="50" fill="#ef4444" />
        <path d="M -28 -50 Q -18 -20 30 0" fill="none" stroke="#facc15" strokeWidth="8" />
      </g>
    </svg>
  );
}
