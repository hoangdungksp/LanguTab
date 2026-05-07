import { useState, useEffect, useRef, useMemo } from 'react';
import type {
  ExamAnswer,
  DragNamePart,
  WritePart,
  TickPart,
  ColourPart,
} from '../../types';
import {
  getAudioUrl,
  ExamAudioError,
} from '../../services/examAudioService';
import {
  getEffectiveAudioScript,
  getAudioScriptRaw,
  saveAudioScript,
  deleteAudioScript,
} from '../../services/examAudioScriptService';
import {
  getCalibration,
  saveCalibration,
  isAdminMode,
  type ZoneOverride,
} from '../../services/examCalibrationService';
import { getIcon } from '../../data/exam/examIcons';
import { ExamScene } from './ExamScene';
import { invalidateScene } from '../../services/examSceneService';
import type { ExamPage } from './ExamSession';

interface Props {
  page: ExamPage;
  currentAnswers: ExamAnswer[];
  onAnswer: (answer: ExamAnswer) => void;
  /** Sprint 4.9: Used to fetch calibration overrides for drop zones. */
  levelId: string;
}

export function ExamPartView({ page, currentAnswers, onAnswer, levelId }: Props) {
  // Sprint 4.9.5.6: Bumped when admin regenerates scene via vision recaption
  // (regenerateImage:true). Forces DragNameView/ColourView → ExamScene to
  // refetch instead of showing stale blob cache.
  const [sceneRefreshKey, setSceneRefreshKey] = useState(0);

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Audio player (top, full width) */}
      <AudioPlayer
        audioKey={page.part.audioKey}
        audioScript={page.part.audioScript}
        levelId={levelId}
        partId={page.part.partId}
        page={page}
        onSceneRegenerated={() => {
          // Force ExamScene to reload by invalidating service cache + bumping key.
          // Only drag/colour/write parts have sceneId; tick parts use icons.
          if ('sceneId' in page.part) {
            invalidateScene(page.part.sceneId);
          }
          setSceneRefreshKey((k) => k + 1);
        }}
      />

      {/* Instruction banner */}
      <InstructionBanner page={page} />

      {/* Main activity */}
      <div className="flex-1 overflow-y-auto">
        {page.kind === 'drag' && (
          <DragNameView
            part={page.part}
            answer={findDragAnswer(currentAnswers, page.part.partId)}
            onAnswer={onAnswer}
            levelId={levelId}
            sceneRefreshKey={sceneRefreshKey}
          />
        )}
        {page.kind === 'write' && (
          <WriteView
            part={page.part}
            answers={currentAnswers}
            onAnswer={onAnswer}
          />
        )}
        {page.kind === 'tick' && (
          <TickView
            part={page.part}
            answers={currentAnswers}
            onAnswer={onAnswer}
          />
        )}
        {page.kind === 'colour' && (
          <ColourView
            part={page.part}
            answer={findColourAnswer(currentAnswers, page.part.partId)}
            onAnswer={onAnswer}
            levelId={levelId}
            sceneRefreshKey={sceneRefreshKey}
          />
        )}
      </div>
    </div>
  );
}

// ─── Helper: instruction banner ────────────────────────────────────────

function InstructionBanner({ page }: { page: ExamPage }) {
  const partNum = page.partIndex + 1;
  let title = '';
  let instruction = '';
  let questionsLabel: string | null = null;

  switch (page.kind) {
    case 'drag':
      title = `Part ${partNum}`;
      instruction = 'LISTEN. DRAG THE NAME AND DROP IT ONTO THE CORRECT PERSON IN THE PICTURE. THERE IS ONE EXAMPLE.';
      break;
    case 'write':
      title = `Part ${partNum}`;
      instruction = 'READ THE QUESTION. LISTEN AND WRITE A NAME OR A NUMBER. THERE ARE TWO EXAMPLES.';
      questionsLabel = `(${page.part.questions.length} QUESTIONS)`;
      break;
    case 'tick':
      title = `Part ${partNum}`;
      instruction = 'LISTEN AND TICK THE BOX. THERE IS ONE EXAMPLE.';
      questionsLabel = `(${page.part.questions.length} QUESTIONS)`;
      break;
    case 'colour':
      title = `Part ${partNum}`;
      instruction = 'LISTEN AND COLOUR. THERE IS ONE EXAMPLE.';
      break;
  }

  return (
    <div className="flex items-center gap-3 rounded-chunk border-2 border-coral-300 bg-coral-50 px-4 py-2">
      <span className="rounded-md bg-amber-700 px-3 py-1 font-display text-sm font-bold text-white shadow-chunky-soft">
        {title}
      </span>
      {questionsLabel && (
        <span className="font-display text-sm font-bold text-coral-700">{questionsLabel}</span>
      )}
      <span className="flex-1 text-xs font-bold text-ink-700 sm:text-sm">{instruction}</span>
    </div>
  );
}

// ─── Audio player ──────────────────────────────────────────────────────

function AudioPlayer({
  audioKey,
  audioScript,
  levelId,
  partId,
  page,
  onSceneRegenerated,
}: {
  audioKey: string;
  audioScript: string;
  /** Sprint 4.9.4: needed to fetch admin-edited script override from D1. */
  levelId: string;
  partId: string;
  /** Sprint 4.9.5: needed for vision auto-caption to know sceneId + names. */
  page: ExamPage;
  /** Sprint 4.9.5.6: called when admin uses "Regenerate image + caption"
   *  so the parent can refetch ExamScene. */
  onSceneRegenerated?: () => void;
}) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset state when audioKey changes (new question)
  useEffect(() => {
    setAudioUrl(null);
    setPlaying(false);
    setDuration(0);
    setCurrentTime(0);
    setError(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
    }
  }, [audioKey]);

  async function ensureUrl(): Promise<string | null> {
    if (audioUrl) return audioUrl;
    setLoading(true);
    setError(null);
    try {
      // Sprint 4.9.4: fetch admin-edited script override (or fall back to
      // hardcoded). Hash of effective script becomes part of cache key in
      // worker (Sprint 4.9.3) so editing the script auto-invalidates audio.
      const effectiveScript = await getEffectiveAudioScript(
        levelId,
        partId,
        audioScript,
      );
      const url = await getAudioUrl(audioKey, effectiveScript);
      setAudioUrl(url);
      return url;
    } catch (err) {
      setError(err instanceof ExamAudioError ? err.message : 'Lỗi tải audio.');
      return null;
    } finally {
      setLoading(false);
    }
  }

  // Replay restarts from beginning. Calling .play() while paused at 0 just
  // starts. While paused mid-track, calling play() resumes — but kids
  // expect ▶ to mean "play from start". We honor that on transition from
  // ended state, but allow resume from pause if mid-track (more natural).
  async function togglePlay() {
    const url = await ensureUrl();
    if (!url || !audioRef.current) return;
    if (audioRef.current.src !== url) {
      audioRef.current.src = url;
    }
    if (playing) {
      audioRef.current.pause();
    } else {
      try {
        await audioRef.current.play();
      } catch {
        setError('Trình duyệt chặn phát audio. Bấm lại để thử.');
      }
    }
  }

  /**
   * Seek to a specific time. Used by both the slider (drag) and the
   * skip buttons (−10s / +10s). Clamps to [0, duration] so we never seek
   * past the end (which would auto-fire `ended` event prematurely).
   */
  function seekTo(seconds: number) {
    if (!audioRef.current || !duration) return;
    const clamped = Math.max(0, Math.min(duration, seconds));
    audioRef.current.currentTime = clamped;
    setCurrentTime(clamped);
  }

  function fmt(s: number): string {
    if (!isFinite(s)) return '00:00';
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  }

  const ready = !!audioUrl && duration > 0;
  const adminMode = isAdminMode();

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-chunk border-2 border-ink-200 bg-paper p-2 sm:gap-3">
      {/* −10s skip button — only enabled when audio is loaded */}
      <button
        onClick={() => seekTo(currentTime - 10)}
        disabled={!ready}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-ink-300 bg-paper text-xs font-bold text-ink-700 shadow-chunky-soft hover:border-ink-500 hover:bg-cream disabled:cursor-not-allowed disabled:opacity-30"
        aria-label="Tua lùi 10 giây"
        title="Tua lùi 10 giây"
      >
        ⏪10
      </button>

      {/* Play/pause button */}
      <button
        onClick={togglePlay}
        disabled={loading}
        className={[
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-lg shadow-chunky-soft transition-all',
          loading
            ? 'border-ink-300 bg-ink-100 text-ink-400'
            : playing
              ? 'border-amber-700 bg-amber-500 text-white hover:bg-amber-600'
              : 'border-mint-700 bg-mint-500 text-white hover:bg-mint-600',
        ].join(' ')}
        aria-label={playing ? 'Tạm dừng' : 'Phát audio'}
      >
        {loading ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : playing ? (
          '⏸'
        ) : (
          '▶'
        )}
      </button>

      {/* +10s skip button */}
      <button
        onClick={() => seekTo(currentTime + 10)}
        disabled={!ready}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-ink-300 bg-paper text-xs font-bold text-ink-700 shadow-chunky-soft hover:border-ink-500 hover:bg-cream disabled:cursor-not-allowed disabled:opacity-30"
        aria-label="Tua tới 10 giây"
        title="Tua tới 10 giây"
      >
        10⏩
      </button>

      <span className="hidden text-xs text-ink-500 tabular-nums sm:inline">
        {fmt(currentTime)} / {fmt(duration)}
      </span>

      {/*
        Seek slider — native <input type="range"> for accessibility +
        keyboard support (arrow keys nudge ±1s automatically). We style it
        cross-browser via Tailwind utilities targeting WebKit/Mozilla
        thumb pseudo-elements (defined in src/newtab/index.css).
        Disabled when audio not loaded so dragging doesn't NaN-seek.
      */}
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={currentTime}
        onChange={(e) => seekTo(Number(e.currentTarget.value))}
        disabled={!ready}
        className="exam-audio-slider flex-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Vị trí phát audio"
        // CSS var drives the WebKit track gradient fill (Mozilla uses
        // ::-moz-range-progress instead, no JS var needed).
        style={
          {
            '--progress': `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
          } as React.CSSProperties
        }
      />

      <span className="text-[10px] text-ink-400 tabular-nums sm:hidden">
        {fmt(currentTime)}/{fmt(duration)}
      </span>

      <audio
        ref={audioRef}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
      />

      {error && <span className="text-xs text-coral-700">{error}</span>}
      </div>

      {/* Sprint 4.9.4: Admin audio script editor — only visible in admin
          mode. Lets admin edit the script that drives TTS so audio matches
          the actual generated image. */}
      {adminMode && (
        <AdminAudioScriptEditor
          levelId={levelId}
          partId={partId}
          defaultScript={audioScript}
          recaptionContext={
            page.kind === 'drag'
              ? {
                  sceneId: page.part.sceneId,
                  exampleZoneId: page.part.exampleZoneId,
                  nameForZone: buildNameForZone(page.part),
                }
              : null
          }
          onSaved={() => {
            // Force audio reload with new script
            setAudioUrl(null);
            setPlaying(false);
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.removeAttribute('src');
            }
          }}
          onSceneRegenerated={onSceneRegenerated}
        />
      )}
    </div>
  );
}

// ─── Sprint 4.9.4: Admin audio script editor ────────────────────────────

/**
 * Sprint 4.9.5: Helper to build {zone_id: name} map from a DragNamePart.
 * Used to feed the vision recaption endpoint so it knows which name goes
 * in which zone position.
 */
function buildNameForZone(part: DragNamePart): Record<string, string> {
  const m: Record<string, string> = { [part.exampleZoneId]: part.exampleName };
  for (const [name, zoneId] of Object.entries(part.correctMapping)) {
    m[zoneId] = name;
  }
  return m;
}

interface RecaptionContext {
  sceneId: string;
  exampleZoneId: string;
  nameForZone: Record<string, string>;
}

/**
 * Inline editor for admin to override the audio script per (level, part).
 * Sprint 4.9.5 added "Auto-caption" button — calls vision model on the
 * actual generated image and rebuilds the script from what the AI sees,
 * eliminating manual transcription work.
 */
function AdminAudioScriptEditor({
  levelId,
  partId,
  defaultScript,
  recaptionContext,
  onSaved,
  onSceneRegenerated,
}: {
  levelId: string;
  partId: string;
  defaultScript: string;
  recaptionContext: RecaptionContext | null;
  onSaved: () => void;
  /** Sprint 4.9.5.6: Called when admin clicks "Tạo image mới + auto-caption"
   *  and image was regenerated. Parent uses this to invalidate scene blob
   *  cache + force ExamScene refetch. */
  onSceneRegenerated?: () => void;
}) {
  const [script, setScript] = useState<string>('');
  const [override, setOverride] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recaptioning, setRecaptioning] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  // Sprint 4.9.5.1: auto-expand by default so admin sees the vision auto-
  // caption button without having to click "expand". Less hidden = better
  // UX. Admin can collapse manually if textarea takes too much space.
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAudioScriptRaw(levelId, partId).then((raw) => {
      if (cancelled) return;
      setOverride(raw);
      setScript(raw ?? defaultScript);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [levelId, partId, defaultScript]);

  const dirty = script.trim() !== (override ?? defaultScript).trim();

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    try {
      const result = await saveAudioScript(levelId, partId, script);
      setOverride(script);
      setMsg(`✓ Đã lưu (${result.length} ký tự). Audio sẽ generate lại.`);
      onSaved();
    } catch (err) {
      setMsg('❌ ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 4000);
    }
  }

  async function handleReset() {
    if (!confirm('Xóa override? Audio sẽ dùng script mặc định trong code.')) return;
    setSaving(true);
    setMsg(null);
    try {
      await deleteAudioScript(levelId, partId);
      setOverride(null);
      setScript(defaultScript);
      setMsg('✓ Đã xóa override. Đang dùng script mặc định.');
      onSaved();
    } catch (err) {
      setMsg('❌ ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 4000);
    }
  }

  /**
   * Sprint 4.9.5: Vision auto-caption.
   * Calls worker endpoint that:
   *   1. Fetches scene image from R2 (or regenerates if requested)
   *   2. Asks vision model to describe each grid position
   *   3. Builds Cambridge-style script from descriptions
   *   4. Saves to D1 exam_audio_scripts
   * Updates textarea with the new script for review/manual tweaks.
   */
  async function handleAutoCaption(regenerateImage: boolean) {
    if (!recaptionContext) return;
    const confirmMsg = regenerateImage
      ? 'Tạo lại hình mới + auto-caption?\n\nFlux sẽ render lại scene (~5-10s) rồi vision model mô tả → script mới. Cũ override (nếu có) bị ghi đè.'
      : 'Auto-caption từ hình hiện tại?\n\nVision model sẽ mô tả image trong R2 → script mới. Cũ override (nếu có) bị ghi đè.';
    if (!confirm(confirmMsg)) return;

    setRecaptioning(true);
    setMsg('🧠 Vision model đang phân tích image...');
    try {
      const token = sessionStorage.getItem('admin_token');
      if (!token) throw new Error('admin_token missing');
      // Sprint 4.9.5.2: hardcoded URL (was using undefined env var)
      const WORKER_URL = 'https://lingua-newtab-worker.kspstudio.workers.dev';
      const url = `${WORKER_URL}/admin/exam/scenes/${encodeURIComponent(recaptionContext.sceneId)}/recaption`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          levelId,
          partId,
          nameForZone: recaptionContext.nameForZone,
          exampleZoneId: recaptionContext.exampleZoneId,
          regenerateImage,
        }),
      });
      if (!resp.ok) {
        const body = await resp.text().catch(() => '');
        throw new Error(`${resp.status}: ${body}`);
      }
      const data = await resp.json() as { script: string; ms: number };
      setOverride(data.script);
      setScript(data.script);
      setMsg(`✓ Auto-caption xong (${data.ms}ms). Script đã lưu vào D1.`);
      onSaved();
      // Sprint 4.9.5.6: If image was regenerated, signal parent to refetch
      // ExamScene (otherwise admin won't see the new image until next page load)
      if (regenerateImage && onSceneRegenerated) {
        onSceneRegenerated();
      }
    } catch (err) {
      setMsg('❌ ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setRecaptioning(false);
      setTimeout(() => setMsg(null), 6000);
    }
  }

  return (
    <div className="rounded-md border-2 border-amber-500 bg-amber-50 p-2">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="font-display text-xs font-bold text-amber-800 hover:underline"
        >
          {expanded ? '▾' : '▸'} 📝 ADMIN: Edit audio script
          {override && <span className="ml-2 rounded bg-amber-300 px-1.5 py-0.5 text-[10px] text-amber-900">override active</span>}
          {dirty && <span className="ml-2 text-coral-600">● Chưa lưu</span>}
        </button>
        {msg && <span className="font-display text-xs text-amber-800">{msg}</span>}
      </div>
      {expanded && (
        <div className="mt-2 space-y-2">
          {/* Sprint 4.9.5: Auto-caption section — only for drag parts */}
          {recaptionContext && (
            <div className="rounded border-2 border-purple-400 bg-purple-50 p-2">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="font-display text-xs font-bold text-purple-800">
                  🧠 Vision auto-caption
                </span>
                <span className="font-mono text-[10px] text-purple-700">
                  scene: {recaptionContext.sceneId}
                </span>
              </div>
              <p className="mb-2 text-[11px] text-purple-700">
                AI vision model sẽ xem image thực tế trong R2 và tạo script mô tả những gì nó thấy.
                Khắc phục triệt để vấn đề audio không match hình.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleAutoCaption(false)}
                  disabled={recaptioning || saving}
                  className="rounded border-2 border-purple-700 bg-purple-500 px-2.5 py-1 font-display text-xs font-bold text-white shadow-chunky-soft hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Vision đọc image hiện tại trong R2"
                >
                  {recaptioning ? '⏳ Đang phân tích...' : '🧠 Auto-caption từ image hiện tại'}
                </button>
                <button
                  onClick={() => handleAutoCaption(true)}
                  disabled={recaptioning || saving}
                  className="rounded border-2 border-fuchsia-700 bg-fuchsia-500 px-2.5 py-1 font-display text-xs font-bold text-white shadow-chunky-soft hover:bg-fuchsia-600 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Tạo lại image với Flux rồi auto-caption (~10s thêm)"
                >
                  🎨 Tạo image mới + auto-caption
                </button>
              </div>
            </div>
          )}

          <p className="text-[11px] text-amber-700">
            Hoặc sửa text bên dưới thủ công để mô tả đúng hình ảnh thực tế.
            Sau khi lưu, audio sẽ tự động generate lại từ script mới này.
          </p>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            disabled={loading || saving || recaptioning}
            rows={6}
            className="w-full rounded border-2 border-amber-300 bg-white p-2 font-mono text-xs text-ink-700 focus:border-amber-500 focus:outline-none"
            placeholder="Loading..."
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] text-amber-700">
              {script.length} chars · {override ? 'override saved in D1' : 'using levels.ts default'}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setScript(defaultScript)}
                disabled={saving || recaptioning}
                className="rounded border-2 border-ink-400 bg-white px-2 py-1 font-display text-xs font-bold text-ink-700 hover:bg-cream disabled:opacity-50"
                title="Reset textbox về script mặc định (chưa save)"
              >
                ↺ Default
              </button>
              {override && (
                <button
                  onClick={handleReset}
                  disabled={saving || recaptioning}
                  className="rounded border-2 border-coral-700 bg-coral-100 px-2 py-1 font-display text-xs font-bold text-coral-800 hover:bg-coral-200 disabled:opacity-50"
                  title="Xóa override khỏi D1, dùng script trong code"
                >
                  🗑 Xóa override
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving || recaptioning || !dirty || !script.trim()}
                className="rounded border-2 border-amber-700 bg-amber-500 px-3 py-1 font-display text-xs font-bold text-white shadow-chunky-soft hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : '💾 Lưu script'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Find-helpers ──────────────────────────────────────────────────────

function findDragAnswer(answers: ExamAnswer[], partId: string) {
  return answers.find(
    (a): a is Extract<ExamAnswer, { type: 'listening_drag_name' }> =>
      a.type === 'listening_drag_name' && a.partId === partId,
  );
}
function findColourAnswer(answers: ExamAnswer[], partId: string) {
  return answers.find(
    (a): a is Extract<ExamAnswer, { type: 'listening_colour' }> =>
      a.type === 'listening_colour' && a.partId === partId,
  );
}
function findWriteAnswer(answers: ExamAnswer[], partId: string, questionId: string) {
  return answers.find(
    (a): a is Extract<ExamAnswer, { type: 'listening_write' }> =>
      a.type === 'listening_write' && a.partId === partId && a.questionId === questionId,
  );
}
function findTickAnswer(answers: ExamAnswer[], partId: string, questionId: string) {
  return answers.find(
    (a): a is Extract<ExamAnswer, { type: 'listening_tick' }> =>
      a.type === 'listening_tick' && a.partId === partId && a.questionId === questionId,
  );
}

// ─── Drag-name view ────────────────────────────────────────────────────

function DragNameView({
  part,
  answer,
  onAnswer,
  levelId,
  sceneRefreshKey = 0,
}: {
  part: DragNamePart;
  answer: ReturnType<typeof findDragAnswer>;
  onAnswer: (a: ExamAnswer) => void;
  levelId: string;
  /** Sprint 4.9.5.6: bumped by parent when admin regenerates the scene
   *  image. Forwarded to ExamScene so it refetches. */
  sceneRefreshKey?: number;
}) {
  const [mapping, setMapping] = useState<Record<string, string>>(answer?.mapping ?? {});
  const [draggedName, setDraggedName] = useState<string | null>(null);

  // Sprint 4.9: Calibration override state.
  // - `overrides` is the fetched/edited zone coords (merged with hardcoded defaults below)
  // - `adminMode` only enables drag-resize handles when admin token is present
  // - `dirty` indicates unsaved local edits — triggers Save button visibility
  const [overrides, setOverrides] = useState<Record<string, ZoneOverride> | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const adminMode = isAdminMode();

  useEffect(() => {
    let cancelled = false;
    getCalibration(levelId, part.partId).then((zones) => {
      if (cancelled) return;
      const map: Record<string, ZoneOverride> = {};
      for (const z of zones) map[z.zone_id] = z;
      setOverrides(map);
    });
    return () => { cancelled = true; };
  }, [levelId, part.partId]);

  // Merged zones: override coords win over hardcoded; labels always come
  // from levels.ts. If override missing for a zone, use hardcoded coords.
  const mergedZones = useMemo(() => {
    return part.dropZones.map((z) => {
      const ov = overrides?.[z.id];
      if (ov) return { ...z, x: ov.x, y: ov.y, width: ov.width, height: ov.height };
      return z;
    });
  }, [part.dropZones, overrides]);

  // Sprint 4.9.1: Build zone_id → character name lookup so admin sees
  // "Sue" / "Dan" / "Pat" / "Bob" labels instead of cryptic "zone_tl"
  // IDs while calibrating. Without this, admin can't tell which zone
  // corresponds to which person in the audio script.
  // - Example zone uses `exampleName` (e.g., "Ben")
  // - Other zones reverse-lookup from `correctMapping` (name → zone_id)
  const zoneNameLookup = useMemo(() => {
    const m: Record<string, string> = {};
    m[part.exampleZoneId] = part.exampleName;
    for (const [name, zoneId] of Object.entries(part.correctMapping)) {
      m[zoneId] = name;
    }
    return m;
  }, [part.exampleZoneId, part.exampleName, part.correctMapping]);

  function commit(next: Record<string, string>) {
    setMapping(next);
    onAnswer({ type: 'listening_drag_name', partId: part.partId, mapping: next });
  }

  function handleDrop(zoneId: string) {
    if (!draggedName) return;
    const next: Record<string, string> = {};
    for (const [name, z] of Object.entries(mapping)) {
      if (name !== draggedName && z !== zoneId) next[name] = z;
    }
    next[draggedName] = zoneId;
    commit(next);
    setDraggedName(null);
  }

  function updateZoneCoords(
    zoneId: string,
    coords: { x: number; y: number; width: number; height: number },
  ) {
    setOverrides((prev) => ({
      ...(prev ?? {}),
      [zoneId]: { zone_id: zoneId, ...coords },
    }));
    setDirty(true);
  }

  async function handleSaveCalibration() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const toSave: ZoneOverride[] = mergedZones.map((z) => ({
        zone_id: z.id, x: z.x, y: z.y, width: z.width, height: z.height,
      }));
      const result = await saveCalibration(levelId, part.partId, toSave);
      setSaveMsg(`✓ Đã lưu ${result.saved} zones`);
      setDirty(false);
    } catch (err) {
      setSaveMsg('❌ ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 3000);
    }
  }

  const placedNames = new Set(Object.keys(mapping));
  const unplacedNames = part.names.filter((n) => !placedNames.has(n));

  return (
    <div className="space-y-3">
      {/* Sprint 4.9: Admin calibration toolbar */}
      {adminMode && (
        <div className="space-y-1.5 rounded-md border-2 border-purple-500 bg-purple-50 px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="font-display text-xs font-bold text-purple-700">
              🛠️ ADMIN CALIBRATION · {levelId} / {part.partId}
              {dirty && <span className="ml-2 text-coral-600">● Chưa lưu</span>}
            </span>
            <div className="flex items-center gap-2">
              {saveMsg && <span className="font-display text-xs text-purple-700">{saveMsg}</span>}
              <button
                onClick={handleSaveCalibration}
                disabled={saving || !dirty}
                className="rounded-md border-2 border-purple-700 bg-purple-500 px-3 py-1 font-display text-xs font-bold text-white shadow-chunky-soft hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : 'Lưu calibration'}
              </button>
            </div>
          </div>
          {/* Sprint 4.9.1: Quick reference of which zone belongs to which
              character. Admin scans this row + audio script to know where
              to drag each zone. Example zone tagged with (Ví dụ). */}
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <span className="font-display font-bold text-purple-700">Đáp án:</span>
            {Object.entries(zoneNameLookup).map(([zoneId, name]) => {
              const isEx = zoneId === part.exampleZoneId;
              return (
                <span
                  key={zoneId}
                  className={`rounded px-1.5 py-0.5 font-mono ${isEx ? 'bg-coral-200 text-coral-800' : 'bg-purple-200 text-purple-800'}`}
                >
                  <span className="font-display font-bold">{name}</span>
                  {' = '}
                  {zoneId}
                  {isEx && ' (ví dụ)'}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Names row at top */}
      <div className="flex flex-wrap items-center justify-center gap-2 px-2">
        {unplacedNames.length === 0 ? (
          <span className="rounded-pill bg-mint-50 px-3 py-1 text-sm font-bold text-mint-700">
            ✅ Đã đặt hết
          </span>
        ) : (
          unplacedNames.map((name) => (
            <button
              key={name}
              draggable={!adminMode}
              onDragStart={() => setDraggedName(name)}
              onDragEnd={() => setDraggedName(null)}
              className={[
                'cursor-grab rounded-pill border-2 border-dashed px-5 py-1.5 font-display text-base font-bold transition-all',
                draggedName === name
                  ? 'border-coral-700 bg-coral-100 text-coral-700'
                  : 'border-coral-400 bg-white text-ink-700 hover:bg-coral-50',
              ].join(' ')}
            >
              {name}
            </button>
          ))
        )}
      </div>

      {/* Scene with drop zones */}
      <div
        data-cal-container
        className="relative aspect-video w-full overflow-hidden rounded-chunk border-2 border-coral-300"
      >
        <div className="absolute inset-0">
          <ExamScene sceneId={part.sceneId} className="h-full w-full" refreshKey={sceneRefreshKey} />
        </div>

        {mergedZones
          .filter((z) => z.id === part.exampleZoneId)
          .map((zone) =>
            adminMode ? (
              <CalibrationZone
                key={zone.id}
                zone={zone}
                displayName={zoneNameLookup[zone.id]}
                isExample
                onChange={(c) => updateZoneCoords(zone.id, c)}
              />
            ) : (
              <div
                key={zone.id}
                className="pointer-events-none absolute flex items-center justify-center"
                style={{
                  left: `${zone.x * 100}%`,
                  top: `${zone.y * 100}%`,
                  width: `${zone.width * 100}%`,
                  height: `${zone.height * 100}%`,
                }}
              >
                <span className="rounded-md bg-coral-500 px-3 py-0.5 font-display text-base font-bold text-white shadow-chunky-soft">
                  {part.exampleName}
                </span>
              </div>
            ),
          )}

        {mergedZones
          .filter((z) => z.id !== part.exampleZoneId)
          .map((zone) => {
            if (adminMode) {
              return (
                <CalibrationZone
                  key={zone.id}
                  zone={zone}
                  displayName={zoneNameLookup[zone.id]}
                  isExample={false}
                  onChange={(c) => updateZoneCoords(zone.id, c)}
                />
              );
            }
            const placedName = Object.entries(mapping).find(
              ([, z]) => z === zone.id,
            )?.[0];
            return (
              <div
                key={zone.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(zone.id)}
                className={[
                  'absolute flex items-center justify-center rounded-md border-2 border-dashed transition-all',
                  placedName
                    ? 'border-mint-700 bg-mint-200/40'
                    : 'border-coral-500 bg-white/30 hover:bg-white/60',
                ].join(' ')}
                style={{
                  left: `${zone.x * 100}%`,
                  top: `${zone.y * 100}%`,
                  width: `${zone.width * 100}%`,
                  height: `${zone.height * 100}%`,
                }}
                title={zone.label}
              >
                {placedName && (
                  <button
                    draggable
                    onDragStart={() => setDraggedName(placedName)}
                    onClick={() => {
                      const next = { ...mapping };
                      delete next[placedName];
                      commit(next);
                    }}
                    className="rounded-md bg-mint-500 px-3 py-0.5 font-display text-base font-bold text-white shadow-chunky-soft hover:bg-mint-600"
                  >
                    {placedName}
                  </button>
                )}
              </div>
            );
          })}
      </div>

      <p className="text-center text-xs text-ink-400">
        {adminMode
          ? '🛠️ ADMIN: Kéo giữa zone để di chuyển. Kéo 4 góc để resize. Nhấn "Lưu calibration" sau khi xong.'
          : '💡 Kéo thẻ tên thả vào đúng người trong tranh. Nhấn vào tên đã đặt để gỡ ra.'}
      </p>
    </div>
  );
}

// ─── Sprint 4.9: Admin calibration zone (drag-resize) ──────────────────

function CalibrationZone({
  zone,
  displayName,
  isExample,
  onChange,
}: {
  zone: { id: string; label?: string; x: number; y: number; width: number; height: number };
  /** Sprint 4.9.1: Character name for this zone (e.g., "Sue") so admin
   *  knows which person to position this zone over. Falls back to zone.id
   *  if undefined (shouldn't happen with valid level data). */
  displayName?: string;
  isExample: boolean;
  onChange: (coords: { x: number; y: number; width: number; height: number }) => void;
}) {
  type DragMode = 'move' | 'tl' | 'tr' | 'bl' | 'br' | null;
  const [mode, setMode] = useState<DragMode>(null);
  const startRef = useRef<{
    px: number; py: number; x: number; y: number; w: number; h: number;
  } | null>(null);

  function findContainer(target: EventTarget | null): HTMLElement | null {
    let el = target as HTMLElement | null;
    while (el && !el.hasAttribute('data-cal-container')) el = el.parentElement;
    return el;
  }

  function onPointerDown(e: React.PointerEvent, m: DragMode) {
    e.stopPropagation();
    e.preventDefault();
    setMode(m);
    startRef.current = {
      px: e.clientX, py: e.clientY,
      x: zone.x, y: zone.y, w: zone.width, h: zone.height,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!mode || !startRef.current) return;
    const container = findContainer(e.target);
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const dx = (e.clientX - startRef.current.px) / rect.width;
    const dy = (e.clientY - startRef.current.py) / rect.height;
    const s = startRef.current;
    const minSize = 0.04;
    let nx = s.x, ny = s.y, nw = s.w, nh = s.h;
    switch (mode) {
      case 'move':
        nx = clamp(s.x + dx, 0, 1 - s.w);
        ny = clamp(s.y + dy, 0, 1 - s.h);
        break;
      case 'br':
        nw = clamp(s.w + dx, minSize, 1 - s.x);
        nh = clamp(s.h + dy, minSize, 1 - s.y);
        break;
      case 'tr':
        nw = clamp(s.w + dx, minSize, 1 - s.x);
        ny = clamp(s.y + dy, 0, s.y + s.h - minSize);
        nh = s.y + s.h - ny;
        break;
      case 'bl':
        nx = clamp(s.x + dx, 0, s.x + s.w - minSize);
        nw = s.x + s.w - nx;
        nh = clamp(s.h + dy, minSize, 1 - s.y);
        break;
      case 'tl':
        nx = clamp(s.x + dx, 0, s.x + s.w - minSize);
        nw = s.x + s.w - nx;
        ny = clamp(s.y + dy, 0, s.y + s.h - minSize);
        nh = s.y + s.h - ny;
        break;
    }
    onChange({ x: nx, y: ny, width: nw, height: nh });
  }

  function onPointerUp(e: React.PointerEvent) {
    setMode(null);
    startRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch { /* ignore */ }
  }

  const borderColor = isExample ? 'border-coral-600' : 'border-purple-600';
  const bgColor = isExample ? 'bg-coral-200/30' : 'bg-purple-200/30';

  return (
    <div
      onPointerDown={(e) => onPointerDown(e, 'move')}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className={`absolute cursor-move border-2 ${borderColor} ${bgColor}`}
      style={{
        left: `${zone.x * 100}%`,
        top: `${zone.y * 100}%`,
        width: `${zone.width * 100}%`,
        height: `${zone.height * 100}%`,
        touchAction: 'none',
      }}
      title={`${displayName ?? zone.id} (${zone.id}) — x=${zone.x.toFixed(2)} y=${zone.y.toFixed(2)} w=${zone.width.toFixed(2)} h=${zone.height.toFixed(2)}`}
    >
      {/* Sprint 4.9.1: Character name (Sue/Dan/Pat/Bob) shown big so admin
          knows where to position this zone. zone_id below as small reference. */}
      <div className="pointer-events-none flex h-full flex-col items-center justify-center gap-0.5">
        <span className={`rounded px-2.5 py-1 font-display text-base font-black shadow-chunky-soft ${isExample ? 'bg-coral-500 text-white' : 'bg-purple-600 text-white'}`}>
          {displayName ?? '?'}
        </span>
        <span className="rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-white/90">
          {zone.id}
        </span>
      </div>
      <ResizeHandle pos="tl" onPointerDown={(e) => onPointerDown(e, 'tl')} />
      <ResizeHandle pos="tr" onPointerDown={(e) => onPointerDown(e, 'tr')} />
      <ResizeHandle pos="bl" onPointerDown={(e) => onPointerDown(e, 'bl')} />
      <ResizeHandle pos="br" onPointerDown={(e) => onPointerDown(e, 'br')} />
    </div>
  );
}

function ResizeHandle({
  pos,
  onPointerDown,
}: {
  pos: 'tl' | 'tr' | 'bl' | 'br';
  onPointerDown: (e: React.PointerEvent) => void;
}) {
  const positions: Record<string, string> = {
    tl: 'top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nw-resize',
    tr: 'top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-ne-resize',
    bl: 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-sw-resize',
    br: 'bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-se-resize',
  };
  return (
    <div
      onPointerDown={onPointerDown}
      className={`absolute h-4 w-4 rounded-full border-2 border-purple-700 bg-white ${positions[pos]}`}
      style={{ touchAction: 'none' }}
    />
  );
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// ─── Write view ────────────────────────────────────────────────────────

/**
 * WriteView — Cambridge YLE Listening Part 2 layout
 *
 * Sprint 4.7.2: Renders ALL 5 sub-questions on one page (no carousel).
 * Layout: shared scene + examples on left, vertical list of 5 questions
 * on right. Audio plays once for the whole part — kid hears all 5
 * questions in sequence and writes answers in real-time without losing
 * focus to navigate dots.
 *
 * Each question is its own row with: number badge, prompt, fill-in
 * input. Filled answers visually distinct via mint outline so kid can
 * see progress. No more "current/total" indicator since everything is
 * visible at once.
 */
function WriteView({
  part,
  answers,
  onAnswer,
}: {
  part: WritePart;
  answers: ExamAnswer[];
  onAnswer: (a: ExamAnswer) => void;
}) {
  return (
    <div className="grid h-full gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      {/* Left: shared scene + examples */}
      <div className="space-y-3">
        <div className="aspect-video overflow-hidden rounded-chunk border-2 border-coral-300">
          <ExamScene sceneId={part.sceneId} className="h-full w-full" />
        </div>
        <div className="rounded-chunk border-2 border-ink-200 bg-cream p-3">
          <div className="text-xs font-bold uppercase tracking-wide text-ink-400">
            Examples:
          </div>
          {part.examples.map((ex, i) => (
            <div key={i} className="mt-1 text-sm text-ink-700">
              {ex.question}{' '}
              <span className="font-bold underline decoration-coral-500 decoration-2">
                {ex.answer}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: ALL 5 questions stacked vertically */}
      <div className="flex flex-col gap-2.5 overflow-y-auto pr-1">
        {part.questions.map((question, i) => (
          <WriteQuestionRow
            key={question.questionId}
            partId={part.partId}
            question={question}
            index={i}
            answers={answers}
            onAnswer={onAnswer}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Single fill-in question row. Owns its own input state to avoid lifting
 * 5 inputs into WriteView and re-rendering on every keystroke. Syncs
 * back to parent via onAnswer on each change.
 */
function WriteQuestionRow({
  partId,
  question,
  index,
  answers,
  onAnswer,
}: {
  partId: string;
  question: WritePart['questions'][number];
  index: number;
  answers: ExamAnswer[];
  onAnswer: (a: ExamAnswer) => void;
}) {
  const existing = findWriteAnswer(answers, partId, question.questionId);
  const [value, setValue] = useState(existing?.answer ?? '');
  const filled = value.trim().length > 0;

  function update(v: string) {
    setValue(v);
    onAnswer({
      type: 'listening_write',
      partId,
      questionId: question.questionId,
      answer: v,
    });
  }

  return (
    <div
      className={[
        'rounded-chunk border-2 p-3 transition-colors',
        filled
          ? 'border-mint-400 bg-mint-50'
          : 'border-coral-200 bg-coral-50',
      ].join(' ')}
    >
      <div className="flex items-baseline gap-2">
        <span
          className={[
            'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
            filled ? 'bg-mint-500' : 'bg-coral-500',
          ].join(' ')}
        >
          {index + 1}
        </span>
        <div className="flex-1 text-sm font-bold text-ink-700 sm:text-base">
          {question.prompt}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-baseline gap-2 pl-8 font-display text-base text-ink-700 sm:text-lg">
        {question.prefix && <span>{question.prefix}</span>}
        <input
          type="text"
          value={value}
          onChange={(e) => update(e.target.value)}
          placeholder="..."
          autoComplete="off"
          spellCheck={false}
          className="w-32 rounded-md border-b-2 border-coral-500 bg-transparent px-2 py-1 text-center font-bold text-coral-700 focus:border-coral-700 focus:outline-none"
        />
        {question.suffix && <span>{question.suffix}</span>}
      </div>
    </div>
  );
}

// ─── Tick view ─────────────────────────────────────────────────────────

/**
 * TickView — Cambridge YLE Listening Part 3 layout
 *
 * Sprint 4.7.2: Renders ALL 5 sub-questions on one page (no carousel).
 * Header shows the example with checkmark; below it is a vertical list
 * of 5 graded questions, each with 3 picture options A/B/C. Kid hears
 * audio once, ticks one option per question while listening.
 *
 * Layout: example block at top (smaller, just for reference), then 5
 * question rows below. Each row: question prompt + 3 small option cards.
 * Filled rows visually distinct via mint outline.
 */
function TickView({
  part,
  answers,
  onAnswer,
}: {
  part: TickPart;
  answers: ExamAnswer[];
  onAnswer: (a: ExamAnswer) => void;
}) {
  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto pr-1">
      {/* Example block at top — compact reference */}
      <div className="rounded-chunk border-2 border-ink-200 bg-cream p-3">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-ink-500">
            Example:
          </span>
          <span className="text-sm font-bold text-ink-700">
            {part.example.prompt}
          </span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {part.example.options.map((opt) => {
            const isExampleCorrect = opt.id === part.example.correctOptionId;
            return (
              <div
                key={opt.id}
                className={[
                  'flex items-center gap-2 rounded-md border-2 p-1.5',
                  isExampleCorrect ? 'border-mint-500 bg-mint-50' : 'border-ink-200',
                ].join(' ')}
              >
                <div className="h-8 w-8 shrink-0">{getIcon(opt.iconId)}</div>
                <div className="rounded bg-coral-200 px-1.5 text-[10px] font-bold text-coral-800">
                  {opt.id}
                </div>
                {isExampleCorrect && (
                  <span className="ml-auto text-mint-700">✓</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* All 5 graded questions stacked */}
      {part.questions.map((question, i) => (
        <TickQuestionRow
          key={question.questionId}
          partId={part.partId}
          question={question}
          index={i}
          answers={answers}
          onAnswer={onAnswer}
        />
      ))}
    </div>
  );
}

/** Single graded tick question with 3 picture options. */
function TickQuestionRow({
  partId,
  question,
  index,
  answers,
  onAnswer,
}: {
  partId: string;
  question: TickPart['questions'][number];
  index: number;
  answers: ExamAnswer[];
  onAnswer: (a: ExamAnswer) => void;
}) {
  const existing = findTickAnswer(answers, partId, question.questionId);
  const selected = existing?.selectedOptionId;
  const filled = !!selected;

  return (
    <div
      className={[
        'rounded-chunk border-2 p-3 transition-colors',
        filled
          ? 'border-mint-400 bg-mint-50'
          : 'border-coral-200 bg-coral-50',
      ].join(' ')}
    >
      <div className="flex items-baseline gap-2">
        <span
          className={[
            'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
            filled ? 'bg-mint-500' : 'bg-coral-500',
          ].join(' ')}
        >
          {index + 1}
        </span>
        <div className="flex-1 text-sm font-bold text-ink-700 sm:text-base">
          {question.prompt}
        </div>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2 pl-8">
        {question.options.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() =>
                onAnswer({
                  type: 'listening_tick',
                  partId,
                  questionId: question.questionId,
                  selectedOptionId: opt.id,
                })
              }
              className={[
                'flex flex-col items-center gap-1 rounded-chunk border-2 p-2 transition-all',
                isSelected
                  ? 'border-mint-700 bg-mint-50 shadow-chunky-ink'
                  : 'border-ink-200 bg-paper hover:border-ink-400',
              ].join(' ')}
            >
              <div className="aspect-square w-full max-w-[80px]">
                {getIcon(opt.iconId)}
              </div>
              <div className="rounded-md bg-coral-200 px-2 text-[10px] font-bold text-coral-800">
                {opt.id}
              </div>
              <div className="text-sm">
                {isSelected ? (
                  <span className="text-mint-700">✓</span>
                ) : (
                  <span className="text-ink-300">○</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Colour view ───────────────────────────────────────────────────────

function ColourView({
  part,
  answer,
  onAnswer,
  levelId,
  sceneRefreshKey = 0,
}: {
  part: ColourPart;
  answer: ReturnType<typeof findColourAnswer>;
  onAnswer: (a: ExamAnswer) => void;
  levelId: string;
  sceneRefreshKey?: number;
}) {
  const [colors, setColors] = useState<Record<string, string>>(answer?.colors ?? {});
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  // Sprint 4.9.2: Calibration override state — same flow as DragNameView.
  const [overrides, setOverrides] = useState<Record<string, ZoneOverride> | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const adminMode = isAdminMode();

  useEffect(() => {
    let cancelled = false;
    getCalibration(levelId, part.partId).then((zones) => {
      if (cancelled) return;
      const map: Record<string, ZoneOverride> = {};
      for (const z of zones) map[z.zone_id] = z;
      setOverrides(map);
    });
    return () => { cancelled = true; };
  }, [levelId, part.partId]);

  const colorMap: Record<string, string> = {
    red: '#dc2626',
    blue: '#3b82f6',
    green: '#22c55e',
    yellow: '#facc15',
    pink: '#ec4899',
    purple: '#a855f7',
    orange: '#f97316',
    brown: '#92400e',
  };

  // Build full region list including the example as one of them. Each
  // region carries its own coords (default from levels.ts, override-able).
  // The example region renders pre-colored and is read-only for kid mode;
  // in admin mode it's calibratable like any other zone.
  const allRegions = useMemo(() => {
    const regions = [
      {
        id: part.example.regionId,
        label: part.example.regionId,
        x: part.example.x,
        y: part.example.y,
        width: part.example.width,
        height: part.example.height,
        isExample: true,
      },
      ...part.regions.map((r) => ({ ...r, isExample: false })),
    ];
    // Apply overrides if any
    return regions.map((r) => {
      const ov = overrides?.[r.id];
      if (ov) return { ...r, x: ov.x, y: ov.y, width: ov.width, height: ov.height };
      return r;
    });
  }, [part.regions, part.example, overrides]);

  function applyColor(color: string) {
    if (!selectedRegion) return;
    const next = { ...colors, [selectedRegion]: color };
    setColors(next);
    onAnswer({ type: 'listening_colour', partId: part.partId, colors: next });
  }

  function updateZoneCoords(
    regionId: string,
    coords: { x: number; y: number; width: number; height: number },
  ) {
    setOverrides((prev) => ({
      ...(prev ?? {}),
      [regionId]: { zone_id: regionId, ...coords },
    }));
    setDirty(true);
  }

  async function handleSaveCalibration() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const toSave: ZoneOverride[] = allRegions.map((r) => ({
        zone_id: r.id, x: r.x, y: r.y, width: r.width, height: r.height,
      }));
      const result = await saveCalibration(levelId, part.partId, toSave);
      setSaveMsg(`✓ Đã lưu ${result.saved} regions`);
      setDirty(false);
    } catch (err) {
      setSaveMsg('❌ ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 3000);
    }
  }

  const allColors: Record<string, string> = {
    [part.example.regionId]: part.example.color,
    ...colors,
  };

  // Build region label lookup for admin display
  const regionLabel = (r: typeof allRegions[number]) => {
    if (r.isExample) return part.example.regionId;
    return part.regions.find((reg) => reg.id === r.id)?.label || r.id;
  };

  return (
    <div className="space-y-3">
      {/* Sprint 4.9.2: Admin calibration toolbar (Part 4 = colour) */}
      {adminMode && (
        <div className="space-y-1.5 rounded-md border-2 border-purple-500 bg-purple-50 px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="font-display text-xs font-bold text-purple-700">
              🛠️ ADMIN CALIBRATION · {levelId} / {part.partId} (Part 4 — Colour)
              {dirty && <span className="ml-2 text-coral-600">● Chưa lưu</span>}
            </span>
            <div className="flex items-center gap-2">
              {saveMsg && <span className="font-display text-xs text-purple-700">{saveMsg}</span>}
              <button
                onClick={handleSaveCalibration}
                disabled={saving || !dirty}
                className="rounded-md border-2 border-purple-700 bg-purple-500 px-3 py-1 font-display text-xs font-bold text-white shadow-chunky-soft hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : 'Lưu calibration'}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <span className="font-display font-bold text-purple-700">Đáp án:</span>
            {allRegions.map((r) => (
              <span
                key={r.id}
                className={`rounded px-1.5 py-0.5 font-mono ${r.isExample ? 'bg-coral-200 text-coral-800' : 'bg-purple-200 text-purple-800'}`}
              >
                <span className="font-display font-bold">{regionLabel(r)}</span>
                {' = '}
                {r.id}
                {r.isExample && ` (ví dụ — ${part.example.color})`}
                {!r.isExample && part.correctColors[r.id] && ` (${part.correctColors[r.id]})`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Color palette at top — hidden in admin mode (admin doesn't color) */}
      {!adminMode && (
        <div className="rounded-chunk border-2 border-coral-300 bg-coral-50 p-3">
          <div className="mb-2 text-xs font-bold text-ink-500">
            {selectedRegion ? (
              <>
                👆 Chọn màu cho{' '}
                <span className="font-bold text-coral-700">
                  {part.regions.find((r) => r.id === selectedRegion)?.label}
                </span>
              </>
            ) : (
              <>👆 Bấm vào vật bên dưới rồi chọn màu</>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {part.palette.map((color) => (
              <button
                key={color}
                onClick={() => applyColor(color)}
                disabled={!selectedRegion}
                className="h-12 w-20 rounded-md border-2 border-ink-700 transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-30"
                style={{ backgroundColor: colorMap[color] }}
                aria-label={color}
              />
            ))}
          </div>
        </div>
      )}

      {/* Outline scene with colorable regions */}
      <div
        data-cal-container
        className="relative aspect-video w-full overflow-hidden rounded-chunk border-2 border-coral-300 bg-white"
      >
        <ColouredScene
          sceneId={part.sceneId}
          regionColors={allColors}
          colorMap={colorMap}
          refreshKey={sceneRefreshKey}
        />

        {allRegions.map((r) => {
          if (adminMode) {
            // Admin mode: render calibration zone with name pill
            return (
              <CalibrationZone
                key={r.id}
                zone={r}
                displayName={regionLabel(r)}
                isExample={r.isExample}
                onChange={(c) => updateZoneCoords(r.id, c)}
              />
            );
          }
          // Skip example in normal kid mode (it's already pre-colored on the scene)
          if (r.isExample) return null;
          const isSelected = selectedRegion === r.id;
          const colored = !!colors[r.id];
          return (
            <button
              key={r.id}
              onClick={() => setSelectedRegion(r.id)}
              className={[
                'absolute flex items-center justify-center rounded-md border-2 transition-all',
                isSelected
                  ? 'border-coral-700 bg-coral-200/30'
                  : colored
                    ? 'border-mint-500 bg-mint-100/20'
                    : 'border-coral-400 border-dashed bg-white/0 hover:bg-coral-50/30',
              ].join(' ')}
              style={{
                left: `${r.x * 100}%`,
                top: `${r.y * 100}%`,
                width: `${r.width * 100}%`,
                height: `${r.height * 100}%`,
              }}
              title={regionLabel(r)}
            >
              <span
                className={[
                  'rounded-md px-1.5 py-0.5 text-[10px] font-bold',
                  isSelected
                    ? 'bg-coral-500 text-white'
                    : colored
                      ? 'bg-mint-500 text-white'
                      : 'bg-coral-100 text-coral-700',
                ].join(' ')}
              >
                {regionLabel(r)}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-ink-400">
        {adminMode
          ? '🛠️ ADMIN: Kéo giữa region để di chuyển. Kéo 4 góc để resize. Nhấn "Lưu calibration" sau khi xong.'
          : '💡 Bấm vào một vật trong tranh, sau đó chọn màu từ bảng màu phía trên.'}
      </p>
    </div>
  );
}

/** Wraps the outline scene + applies fills to colored regions via overlay. */
function ColouredScene({
  sceneId,
  regionColors,
  colorMap,
  refreshKey = 0,
}: {
  sceneId: string;
  regionColors: Record<string, string>;
  colorMap: Record<string, string>;
  refreshKey?: number;
}) {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0">
        <ExamScene sceneId={sceneId} className="h-full w-full" refreshKey={refreshKey} />
      </div>
      {Object.entries(regionColors).map(([regionId, colorName]) => {
        const pos = getRegionHotspot(sceneId, regionId);
        if (!pos) return null;
        return (
          <div
            key={regionId}
            className="pointer-events-none absolute mix-blend-multiply"
            style={{
              left: `${pos.x * 100}%`,
              top: `${pos.y * 100}%`,
              width: `${pos.w * 100}%`,
              height: `${pos.h * 100}%`,
              backgroundColor: colorMap[colorName] ?? '#999',
              opacity: 0.5,
              borderRadius: '8px',
            }}
          />
        );
      })}
    </div>
  );
}

/**
 * Hardcoded hotspot positions for each (scene, region) pair. These match
 * the SVG layout in examScenes.tsx. When new scenes are added, add their
 * hotspot maps here.
 */
function getRegionHotspot(
  sceneId: string,
  regionId: string,
): { x: number; y: number; w: number; h: number } | null {
  const map: Record<string, Record<string, { x: number; y: number; w: number; h: number }>> = {
    garden_objects_outline: {
      tree:  { x: 0.04, y: 0.20, w: 0.16, h: 0.50 },
      bike:  { x: 0.21, y: 0.50, w: 0.20, h: 0.36 },
      ball:  { x: 0.45, y: 0.62, w: 0.10, h: 0.18 },
      cat:   { x: 0.10, y: 0.74, w: 0.20, h: 0.22 },
      dog:   { x: 0.70, y: 0.75, w: 0.20, h: 0.20 },
      yarn:  { x: 0.04, y: 0.86, w: 0.10, h: 0.12 },
      bench: { x: 0.62, y: 0.46, w: 0.16, h: 0.14 },
    },
  };
  return map[sceneId]?.[regionId] ?? null;
}
