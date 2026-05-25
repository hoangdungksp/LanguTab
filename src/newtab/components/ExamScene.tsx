import { useState, useEffect } from 'react';
import {
  getSceneUrl,
  ExamSceneError,
} from '../../services/examSceneService';

/**
 * Renders a scene image fetched from the worker (via R2 cache or Flux gen).
 *
 * Lifecycle:
 *   1. Mount → start fetch via examSceneService
 *   2. Show skeleton (gradient placeholder + scene-themed emoji) while loading
 *   3. On success → render <img> with blob URL
 *   4. On error → show fallback with retry button
 *
 * The blob URL is cached in the service Map, so subsequent mounts of the
 * same sceneId resolve instantly. Browser also caches the actual image
 * data behind the blob URL for free re-renders within the same session.
 *
 * className prop is forwarded to the outer container — caller decides
 * aspect ratio and sizing. Common patterns:
 *   - <ExamScene sceneId="park_kids" className="aspect-[2/1]" />  (drag scenes)
 *   - <ExamScene sceneId="pet_girl" className="aspect-square" />  (write scenes)
 */
interface Props {
  sceneId: string;
  className?: string;
  /**
   * Sprint 4.9.5.6: Bump this number to force ExamScene to refetch the
   * image (after admin regenerates via vision recaption with regenerateImage:true).
   * Without this, blob cache + useEffect deps prevent re-render.
   */
  refreshKey?: number;
}

export function ExamScene({ sceneId, className = '', refreshKey = 0 }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setUrl(null);

    getSceneUrl(sceneId)
      .then((u) => {
        if (!cancelled) {
          setUrl(u);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const msg =
          err instanceof ExamSceneError
            ? err.message
            : 'Không tải được hình ảnh';
        setError(msg);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sceneId, refreshKey]);

  if (loading) {
    return <SceneSkeleton sceneId={sceneId} className={className} />;
  }
  if (error) {
    return (
      <SceneFallback sceneId={sceneId} error={error} className={className} />
    );
  }
  if (!url) {
    return <SceneFallback sceneId={sceneId} className={className} />;
  }

  return (
    <div className={`overflow-hidden bg-cream ${className}`}>
      <img
        src={url}
        alt={sceneIdToAlt(sceneId)}
        // Sprint 4.7.3: container matches AI image aspect (1:1 for 1024×1024
        // Flux output), so object-cover fills edge-to-edge without
        // cropping. Drop zone relative coords (0-1) map directly onto
        // image pixels — no letterbox correction needed.
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </div>
  );
}

// ─── Loading skeleton ───────────────────────────────────────────────────

function SceneSkeleton({ sceneId, className = '' }: { sceneId: string; className?: string }) {
  // Pick a themed emoji + tint based on sceneId category for visual hint
  // while the AI generates / R2 cache loads.
  const theme = themeFor(sceneId);
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${theme.bg} ${className}`}
    >
      <div className="flex flex-col items-center gap-2 opacity-80">
        <div className="text-6xl">{theme.emoji}</div>
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-600">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-ink-400 border-t-transparent" />
          Đang tạo tranh...
        </div>
        <div className="text-xs text-ink-400">Lần đầu mất 5-10 giây</div>
      </div>
      {/* Animated shimmer overlay */}
      <div className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
    </div>
  );
}

// ─── Error/missing fallback ─────────────────────────────────────────────

function SceneFallback({
  sceneId,
  error,
  className = '',
}: {
  sceneId: string;
  error?: string;
  className?: string;
}) {
  const theme = themeFor(sceneId);
  // D-18 Phase 5+6: Starters per-level scenes (starter_lN_*) are admin-triggered.
  // Until generated, show a clear "image not yet created" message so users
  // (and admin) know it's expected, not a bug.
  const isPerLevelStarterScene = sceneId.startsWith('starter_l');
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 ${theme.bg} ${className}`}
    >
      <div className="text-6xl opacity-50">{theme.emoji}</div>
      {isPerLevelStarterScene ? (
        <>
          <div className="max-w-md px-4 text-center text-sm font-medium text-amber-700">
            📸 Hình chưa được tạo cho bài thi này
          </div>
          <div className="max-w-md px-4 text-center text-xs text-ink-500">
            Admin cần bấm <span className="font-semibold">Gen hình</span> để tạo ảnh.
            Nội dung text + audio đã sẵn sàng để luyện thi.
          </div>
        </>
      ) : (
        <>
          {error && (
            <div className="max-w-md px-4 text-center text-xs text-coral-700">
              ⚠️ {error}
            </div>
          )}
          <div className="text-xs text-ink-400">Tranh sẽ tải lại lần sau</div>
        </>
      )}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────

/** Theme emoji + bg color per scene category. Used in skeletons/fallbacks. */
function themeFor(sceneId: string): { emoji: string; bg: string } {
  // D-18 Phase 5+6 Starters per-level scenes
  if (sceneId.includes('petshop')) return { emoji: '🐾', bg: 'bg-gradient-to-br from-blue-100 to-pink-100' };
  if (sceneId.includes('toyshop')) return { emoji: '🧸', bg: 'bg-gradient-to-br from-yellow-100 to-orange-100' };
  if (sceneId.includes('sports')) return { emoji: '🏃', bg: 'bg-gradient-to-br from-red-100 to-orange-100' };
  if (sceneId.includes('picnic')) return { emoji: '🧺', bg: 'bg-gradient-to-br from-green-100 to-yellow-100' };
  if (sceneId.includes('library')) return { emoji: '📚', bg: 'bg-gradient-to-br from-amber-100 to-brown-100' };
  if (sceneId.includes('bicycle')) return { emoji: '🚲', bg: 'bg-gradient-to-br from-sky-100 to-mint-100' };
  if (sceneId.includes('cooking')) return { emoji: '🍰', bg: 'bg-gradient-to-br from-orange-100 to-rose-100' };
  if (sceneId.includes('swimming')) return { emoji: '🏊', bg: 'bg-gradient-to-br from-cyan-100 to-blue-100' };
  if (sceneId.includes('sleepover')) return { emoji: '🌙', bg: 'bg-gradient-to-br from-indigo-100 to-pink-100' };
  if (sceneId.includes('train')) return { emoji: '🚂', bg: 'bg-gradient-to-br from-slate-100 to-blue-100' };
  if (sceneId.includes('snow')) return { emoji: '❄️', bg: 'bg-gradient-to-br from-sky-100 to-white' };
  // Existing categories
  if (sceneId.includes('park')) return { emoji: '🌳', bg: 'bg-gradient-to-br from-green-100 to-blue-100' };
  if (sceneId.includes('beach')) return { emoji: '🏖️', bg: 'bg-gradient-to-br from-sky-100 to-amber-100' };
  if (sceneId.includes('classroom') || sceneId.includes('school')) return { emoji: '🏫', bg: 'bg-gradient-to-br from-amber-100 to-yellow-100' };
  if (sceneId.includes('playground')) return { emoji: '🎢', bg: 'bg-gradient-to-br from-pink-100 to-purple-100' };
  if (sceneId.includes('kitchen')) return { emoji: '🍳', bg: 'bg-gradient-to-br from-rose-100 to-orange-100' };
  if (sceneId.includes('birthday')) return { emoji: '🎂', bg: 'bg-gradient-to-br from-pink-100 to-purple-100' };
  if (sceneId.includes('pet')) return { emoji: '🐱', bg: 'bg-gradient-to-br from-blue-100 to-indigo-100' };
  if (sceneId.includes('family_dinner') || sceneId.includes('dinner')) return { emoji: '🍽️', bg: 'bg-gradient-to-br from-orange-100 to-amber-100' };
  if (sceneId.includes('weekend')) return { emoji: '🎨', bg: 'bg-gradient-to-br from-purple-100 to-pink-100' };
  if (sceneId.includes('garden')) return { emoji: '🌷', bg: 'bg-gradient-to-br from-green-100 to-yellow-100' };
  if (sceneId.includes('bedroom')) return { emoji: '🛏️', bg: 'bg-gradient-to-br from-indigo-100 to-purple-100' };
  if (sceneId.includes('farm')) return { emoji: '🐄', bg: 'bg-gradient-to-br from-green-100 to-amber-100' };
  return { emoji: '🎨', bg: 'bg-gradient-to-br from-mint-100 to-sky-100' };
}

/** Human-readable alt text for accessibility. */
function sceneIdToAlt(sceneId: string): string {
  return sceneId.replace(/_/g, ' ').replace(/-/g, ' ');
}
