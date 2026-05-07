import { useState } from 'react';
import {
  PLANETS,
  getPlanetProgress,
  type Planet,
  type PlanetId,
} from '../../data/exam/planets';

/**
 * PlanetsScreen — Sprint 4.8.4 robust flex-flow layout.
 *
 * Why complete rewrite vs v1.3.3:
 *   v1.3.3 used absolute positioning for planets within a min-h carousel
 *   container. Math said no overlap with the card below, but screenshots
 *   showed overlap consistently. Either the float animation pushed planets
 *   beyond container, or transform-scale didn't reduce DOM space, or some
 *   parent constraint interfered. Rather than debug further, this version
 *   uses ONLY flex flow:
 *     - Planets are flex children with REAL size differences (not just CSS
 *       scale). Center is 340px DOM-wise; sides are 180px.
 *     - The flex container's height is determined by the tallest child
 *       (the center planet). No absolute positioning means no overflow
 *       outside container, period.
 *     - Card is a separate sibling block. Normal flow guarantees it sits
 *       BELOW planets with the gap defined by margin-top.
 *     - Arrow buttons are the only absolutely-positioned elements (they
 *       sit on top of planets, but don't affect layout).
 *
 * Layout flow:
 *   ┌────────── full viewport width ──────────┐
 *   │                                          │
 *   │    [heading + subtitle]                  │
 *   │                                          │
 *   │  ◀  [side]  [CENTER LARGE]  [side]  ▶   │  ← flex row, real sizes
 *   │                                          │
 *   │           [INFO CARD]                    │  ← separate block, mt-8
 *   │                                          │
 *   │              ● ○ ○                       │  ← dots
 *   │                                          │
 *   └──────────────────────────────────────────┘
 */
interface Props {
  onSelectPlanet: (planetId: PlanetId) => void;
}

export function PlanetsScreen({ onSelectPlanet }: Props) {
  const [centerIdx, setCenterIdx] = useState(0);
  const totalPlanets = PLANETS.length;
  const wrap = (i: number) => ((i % totalPlanets) + totalPlanets) % totalPlanets;
  const goPrev = () => setCenterIdx(wrap(centerIdx - 1));
  const goNext = () => setCenterIdx(wrap(centerIdx + 1));

  const centerPlanet = PLANETS[centerIdx];
  const leftPlanet = PLANETS[wrap(centerIdx - 1)];
  const rightPlanet = PLANETS[wrap(centerIdx + 1)];

  return (
    <div className="full-bleed relative mt-6 overflow-hidden">
      {/* Cosmic gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900 via-purple-800 to-pink-700">
        <Starfield />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-12">
        {/* Heading */}
        <div className="mb-8 text-center">
          <h1 className="font-heading text-5xl font-black tracking-wide text-white drop-shadow-lg sm:text-6xl">
            CHOOSE YOUR PLANET
          </h1>
          <p className="mt-2 font-display text-base text-pink-200">
            Chọn hành tinh để bắt đầu hành trình tiếng Anh
          </p>
        </div>

        {/* Carousel — flex flow with REAL sizes (no absolute positioning).
            The relative wrapper hosts arrow buttons on top of the row. */}
        <div className="relative">
          {/* Arrow buttons: absolute, but only OVERLAY — they don't push the row */}
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/40 bg-white/10 text-2xl text-white backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/20 sm:left-4 sm:h-14 sm:w-14"
            aria-label="Hành tinh trước"
          >
            ◀
          </button>
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/40 bg-white/10 text-2xl text-white backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/20 sm:right-4 sm:h-14 sm:w-14"
            aria-label="Hành tinh sau"
          >
            ▶
          </button>

          {/* Planets in flex flow — sizes are responsive but REAL DOM sizes,
              so they push the layout naturally. No overlap with card below. */}
          <div className="flex items-center justify-center gap-4 px-16 py-4 sm:gap-6 sm:px-20">
            <PlanetItem planet={leftPlanet} variant="side" onClick={goPrev} />
            <PlanetItem
              planet={centerPlanet}
              variant="center"
              onClick={() => {
                const progress = getPlanetProgress(centerPlanet.id);
                if (progress.unlocked) onSelectPlanet(centerPlanet.id);
              }}
            />
            <PlanetItem planet={rightPlanet} variant="side" onClick={goNext} />
          </div>
        </div>

        {/* Info card — sibling block. Normal flow → guaranteed below planets. */}
        <div className="mt-8 flex justify-center">
          <PlanetInfoCard
            planet={centerPlanet}
            onLaunch={() => onSelectPlanet(centerPlanet.id)}
          />
        </div>

        {/* Pagination dots */}
        <div className="mt-6 flex justify-center gap-2">
          {PLANETS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCenterIdx(i)}
              className={[
                'h-2.5 rounded-full transition-all',
                i === centerIdx ? 'w-8 bg-white' : 'w-2.5 bg-white/40',
              ].join(' ')}
              aria-label={`Hành tinh ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Planet flex item ──────────────────────────────────────────────────

/**
 * One planet in the flex carousel. Center variant is bigger and floats
 * faster; side variants are smaller, dimmed, slower float.
 *
 * REAL DOM sizes (via Tailwind w-[]/h-[] classes) — not transform: scale.
 * This way the flex container's height is correctly determined by the
 * tallest child, and the card below sits naturally without overlap.
 *
 * Responsive sizing for mobile/tablet/desktop:
 *   - Mobile (default): center 200px, side 80px → row width ~360px
 *   - Tablet (sm:):     center 280px, side 140px → row width ~560px
 *   - Desktop (md:):    center 320px, side 160px → row width ~640px
 */
function PlanetItem({
  planet,
  variant,
  onClick,
}: {
  planet: Planet;
  variant: 'center' | 'side';
  onClick: () => void;
}) {
  const progress = getPlanetProgress(planet.id);
  const locked = !progress.unlocked;

  const sizeClass =
    variant === 'center'
      ? 'h-[200px] w-[200px] sm:h-[280px] sm:w-[280px] md:h-[320px] md:w-[320px]'
      : 'h-[80px] w-[80px] sm:h-[140px] sm:w-[140px] md:h-[160px] md:w-[160px]';

  const opacityClass = variant === 'side' ? 'opacity-50' : '';
  const animClass = variant === 'center' ? 'animate-float-medium' : 'animate-float-slow';

  return (
    <button
      onClick={onClick}
      className={`shrink-0 transition-all hover:scale-105 ${opacityClass} ${animClass}`}
      aria-label={`${planet.name}`}
    >
      <div className={`relative ${sizeClass}`}>
        <PlanetCircle planet={planet} />
        {locked && variant === 'center' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-black/60 text-3xl shadow-2xl sm:h-20 sm:w-20 sm:text-4xl">
              🔒
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Round planet visual (size-agnostic — fills parent) ────────────────

/**
 * Renders into the parent's full bounds. Caller decides size via parent
 * width/height. SVG uses viewBox so internals scale proportionally to
 * any size.
 */
function PlanetCircle({ planet }: { planet: Planet }) {
  return (
    <div className="relative h-full w-full">
      {/* Atmospheric glow */}
      <div
        className="absolute -inset-3 rounded-full opacity-50 blur-2xl"
        style={{ background: planet.theme.glowColor }}
      />

      {/* Planet body */}
      <div
        className="relative h-full w-full overflow-hidden rounded-full border-4 border-white/30 shadow-2xl"
        style={{ background: planet.theme.bodyGradient }}
      >
        {/* Slow rotating decorations */}
        <div className="absolute inset-0 animate-rotate-slow">
          <PlanetDecorations planetId={planet.id} />
        </div>

        {/* Static foreground icon (centered) */}
        <PlanetForegroundIcon planetId={planet.id} />

        {/* Fake 3D shading */}
        <div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background:
              'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 40%), radial-gradient(circle at 70% 80%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 50%)',
          }}
        />
      </div>
    </div>
  );
}

function PlanetDecorations({ planetId }: { planetId: PlanetId }) {
  if (planetId === 'starters') {
    return (
      <svg viewBox="0 0 340 340" className="h-full w-full">
        <Tree cx={70} cy={110} size={18} />
        <Tree cx={250} cy={130} size={15} />
        <Tree cx={170} cy={75} size={20} />
        <Tree cx={280} cy={220} size={16} />
        <Tree cx={55} cy={240} size={14} />
        <Tree cx={130} cy={260} size={17} />
      </svg>
    );
  }
  if (planetId === 'movers') {
    return (
      <svg viewBox="0 0 340 340" className="h-full w-full">
        <Mushroom cx={95} cy={120} size={1.4} />
        <Mushroom cx={240} cy={160} size={1.2} />
        <Mushroom cx={165} cy={250} size={1.3} />
        <Mushroom cx={275} cy={245} size={1.0} />
        <Mushroom cx={60} cy={210} size={1.1} />
        <ellipse cx="70" cy="80" rx="28" ry="6" fill="white" opacity="0.5" />
        <ellipse cx="270" cy="285" rx="32" ry="7" fill="white" opacity="0.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 340 340" className="h-full w-full">
      <g fill="#fbbf24">
        <SVGStar cx={80} cy={95} size={8} />
        <SVGStar cx={250} cy={120} size={6} />
        <SVGStar cx={210} cy={235} size={5} />
        <SVGStar cx={95} cy={250} size={6} />
        <SVGStar cx={270} cy={245} size={4} />
        <SVGStar cx={170} cy={75} size={7} />
      </g>
      <g fill="#a78bfa">
        <circle cx="60" cy="170" r="7" />
        <circle cx="285" cy="180" r="9" />
        <circle cx="160" cy="285" r="6" />
      </g>
    </svg>
  );
}

function Tree({ cx, cy, size }: { cx: number; cy: number; size: number }) {
  // Trunk extends fully below foliage (no overlap)
  const trunkTop = cy + size * 0.85;
  const trunkHeight = size * 0.7;
  const trunkWidth = size * 0.35;
  return (
    <g>
      <rect
        x={cx - trunkWidth / 2}
        y={trunkTop}
        width={trunkWidth}
        height={trunkHeight}
        fill="#5a3a1a"
      />
      <circle cx={cx} cy={cy} r={size} fill="#1f7d3a" />
      <circle cx={cx - size * 0.3} cy={cy - size * 0.2} r={size * 0.55} fill="#22c55e" />
      <circle cx={cx - size * 0.45} cy={cy - size * 0.4} r={size * 0.2} fill="#86efac" />
    </g>
  );
}

function Mushroom({ cx, cy, size }: { cx: number; cy: number; size: number }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={16 * size} ry={9 * size} fill="#dc2626" />
      <ellipse cx={cx} cy={cy + 3 * size} rx={16 * size} ry={3 * size} fill="#991b1b" />
      <circle cx={cx - 5 * size} cy={cy - 1 * size} r={2 * size} fill="white" />
      <circle cx={cx + 6 * size} cy={cy + 2 * size} r={1.7 * size} fill="white" />
      <circle cx={cx - 1 * size} cy={cy - 4 * size} r={1.3 * size} fill="white" />
      <rect
        x={cx - 3 * size}
        y={cy + 5 * size}
        width={6 * size}
        height={11 * size}
        fill="#fde68a"
      />
    </g>
  );
}

function SVGStar({ cx, cy, size }: { cx: number; cy: number; size: number }) {
  const points = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 === 0 ? size : size / 2;
    points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return <polygon points={points.join(' ')} />;
}

/**
 * Centered foreground emoji. Sized responsively to match the planet's
 * actual rendered size — text-5xl on small planets, text-8xl on big ones.
 */
function PlanetForegroundIcon({ planetId }: { planetId: PlanetId }) {
  const emoji = planetId === 'starters' ? '🦕' : planetId === 'movers' ? '🍄' : '🪐';
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span className="select-none text-5xl drop-shadow-2xl sm:text-7xl md:text-8xl">
        {emoji}
      </span>
    </div>
  );
}

// ─── Info card ─────────────────────────────────────────────────────────

function PlanetInfoCard({
  planet,
  onLaunch,
}: {
  planet: Planet;
  onLaunch: () => void;
}) {
  const progress = getPlanetProgress(planet.id);
  const locked = !progress.unlocked;

  return (
    <div className="relative w-full max-w-md">
      <div className="relative rounded-chunk border-[3px] border-ink-700 bg-paper px-6 py-5 shadow-chunky-ink">
        <div className={`text-center font-heading text-5xl font-black leading-none tracking-wide ${planet.theme.heading} sm:text-6xl`}>
          {planet.name}
        </div>
        <div className="mt-2 text-center font-display text-base font-bold text-ink-700">
          {planet.subtitle}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {locked ? (
            <div className="text-center text-sm text-ink-600">
              🔒 Cần hoàn thành{' '}
              <span className="font-bold">
                {planet.unlockRequirement?.minCompleted}
              </span>{' '}
              bài{' '}
              <span className="font-heading text-base font-bold uppercase">
                {planet.unlockRequirement?.planetId}
              </span>
            </div>
          ) : (
            <>
              <div className={`font-heading text-3xl font-black ${planet.theme.heading}`}>
                ⭐ {progress.completed}/{progress.total}
              </div>
              <div className="flex gap-1.5">
                {planet.cefrBadges.map((badge) => (
                  <span
                    key={badge}
                    className={`rounded-md px-2.5 py-1 text-sm font-bold text-white ${planet.theme.badgeBg}`}
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {!locked && (
          <button
            onClick={onLaunch}
            className={`mt-4 w-full rounded-chunk border-2 border-ink-700 py-3 font-heading text-xl font-black tracking-wide text-white shadow-chunky-soft hover:shadow-chunky-ink active:translate-y-0.5 ${planet.theme.buttonBg}`}
          >
            START →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Twinkling starfield ───────────────────────────────────────────────

function Starfield() {
  const stars = [
    { x: 3, y: 8, size: 2, delay: 0 },
    { x: 12, y: 25, size: 1, delay: 0.3 },
    { x: 22, y: 6, size: 2, delay: 0.6 },
    { x: 33, y: 45, size: 1, delay: 0.9 },
    { x: 42, y: 15, size: 1.5, delay: 1.2 },
    { x: 52, y: 65, size: 2, delay: 1.5 },
    { x: 62, y: 12, size: 1, delay: 0.2 },
    { x: 72, y: 38, size: 1.5, delay: 0.5 },
    { x: 82, y: 22, size: 2, delay: 0.8 },
    { x: 92, y: 55, size: 1, delay: 1.1 },
    { x: 8, y: 70, size: 1.5, delay: 1.4 },
    { x: 18, y: 88, size: 1, delay: 0.1 },
    { x: 38, y: 82, size: 2, delay: 0.4 },
    { x: 58, y: 92, size: 1, delay: 0.7 },
    { x: 78, y: 75, size: 1.5, delay: 1.0 },
    { x: 88, y: 4, size: 1, delay: 1.3 },
    { x: 28, y: 60, size: 1, delay: 0.4 },
    { x: 48, y: 30, size: 1, delay: 1.1 },
    { x: 68, y: 70, size: 1.5, delay: 0.6 },
    { x: 5, y: 50, size: 1, delay: 1.2 },
    { x: 95, y: 88, size: 2, delay: 0.3 },
    { x: 50, y: 5, size: 1.5, delay: 0.9 },
  ];
  return (
    <div className="absolute inset-0">
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute animate-twinkle rounded-full bg-white"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
