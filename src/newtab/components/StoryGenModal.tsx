import { useEffect, useState } from 'react';
import {
  generateStory,
  getQuota,
  StoryGenError,
  MAX_SENTENCES,
  MIN_SENTENCES,
  type StoryGenParams,
  type QuotaInfo,
} from '../../services/storyGenService';
import type { HskLevel, UserStory } from '../../types';
import { UpgradeModal } from './UpgradeModal';
import { StoryGenProgress } from './StoryGenProgress';

/**
 * AI story generator modal.
 *
 * Form fields:
 *   - HSK level (1-6)
 *   - Genre (12 preset chips + free-text "or custom")
 *   - Description (textarea, ≤500 chars)
 *   - Sentence count (slider, MIN_SENTENCES to MAX_SENTENCES[hskLevel])
 *   - Include dialogue (checkbox)
 *
 * On submit:
 *   - Disables form, shows spinner with status text
 *   - On success: closes modal, returns the new UserStory via onCreated
 *   - On failure: shows error inline, keeps form filled so user can retry
 *
 * Quota display: shown below the submit button so users always know how many
 * generations they have left BEFORE clicking. Refreshed once on mount.
 */

/**
 * Preset genre chips. Order chosen so the most-loved-by-Jason genres
 * (xianxia/fantasy/mystery) sit in the middle row where the eye lands first
 * on a 4-column grid; everyday genres (daily/comedy) flank for balance.
 */
const PRESET_GENRES: Array<{ id: string; emoji: string; label: string }> = [
  { id: 'daily',      emoji: '🏠', label: 'Đời thường' },
  { id: 'comedy',     emoji: '😂', label: 'Hài hước' },
  { id: 'horror',     emoji: '👻', label: 'Kinh dị' },
  { id: 'sad',        emoji: '😢', label: 'Cảm động' },
  { id: 'xianxia',    emoji: '⚔️', label: 'Tiên hiệp' },
  { id: 'fantasy',    emoji: '🧚', label: 'Cổ tích' },
  { id: 'mystery',    emoji: '🔍', label: 'Trinh thám' },
  { id: 'romance',    emoji: '💕', label: 'Tình yêu' },
  { id: 'sci-fi',     emoji: '🚀', label: 'Khoa học' },
  { id: 'adventure',  emoji: '🏃', label: 'Phiêu lưu' },
  { id: 'mythology',  emoji: '🐉', label: 'Thần thoại' },
  { id: 'historical', emoji: '📜', label: 'Lịch sử' },
];

interface StoryGenModalProps {
  /** Initial HSK level — pre-selected from the active filter when modal opens */
  initialHskLevel: HskLevel;
  onClose: () => void;
  /** Called after successful generation — caller refreshes story list */
  onCreated: (story: UserStory) => void;
}

export function StoryGenModal({
  initialHskLevel,
  onClose,
  onCreated,
}: StoryGenModalProps) {
  // Form state — all fields needed by StoryGenParams plus the chip-vs-custom
  // genre toggle so the UI knows which to send.
  const [hskLevel, setHskLevel] = useState<HskLevel>(initialHskLevel);
  const [selectedGenreChip, setSelectedGenreChip] = useState<string>('daily');
  const [customGenre, setCustomGenre] = useState('');
  const [description, setDescription] = useState('');
  const [sentenceCount, setSentenceCount] = useState(10);
  const [includeDialogue, setIncludeDialogue] = useState(true);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quota — fetched on mount, refreshed after successful generation
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Clamp sentence count when HSK level changes — different caps per level.
  // Without this, switching from HSK 6 (max 25) → HSK 1 (max 15) would
  // leave the slider invalid.
  useEffect(() => {
    const max = MAX_SENTENCES[hskLevel];
    if (sentenceCount > max) setSentenceCount(max);
    if (sentenceCount < MIN_SENTENCES) setSentenceCount(MIN_SENTENCES);
  }, [hskLevel, sentenceCount]);

  // Fetch quota on mount
  useEffect(() => {
    let cancelled = false;
    getQuota().then((q) => {
      if (!cancelled) setQuota(q);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Close on Escape — keyboard accessibility, mirrors GoogleAppsMenu pattern
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose, submitting]);

  const effectiveGenre = customGenre.trim() || selectedGenreChip;
  const maxSentences = MAX_SENTENCES[hskLevel];
  const canSubmit =
    !submitting &&
    description.trim().length > 0 &&
    description.length <= 500 &&
    effectiveGenre.length > 0 &&
    sentenceCount >= MIN_SENTENCES &&
    sentenceCount <= maxSentences;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    const params: StoryGenParams = {
      hskLevel,
      genre: effectiveGenre,
      description: description.trim(),
      sentenceCount,
      includeDialogue,
    };
    try {
      const story = await generateStory(params);
      onCreated(story);
      onClose();
    } catch (err) {
      if (err instanceof StoryGenError) {
        setError(err.message);
        // Refresh quota — it may have changed even on failure (Worker
        // refunds Gemini failures but not validation failures, so showing
        // the current count helps user understand)
        getQuota().then(setQuota);
      } else {
        setError('Có lỗi không xác định. Vui lòng thử lại.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-700/50 p-4"
      onClick={(e) => {
        // Click backdrop closes modal — but not while generating since the
        // request is still in flight and we'd lose progress.
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-chunk border-2 border-ink-700 bg-paper p-6 shadow-chunky-ink">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink-700">
              ✨ Tạo truyện AI
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              AI sẽ viết truyện riêng theo yêu cầu của bạn
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            aria-label="Đóng"
            className="rounded-full p-2 text-ink-400 hover:bg-ink-100 hover:text-ink-700 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* When generating, show the animated phase indicator instead of
            the form. The form state is preserved (just hidden), so if the
            user cancels mid-flight they don't lose their HSK / genre /
            description selections. */}
        {submitting ? (
          <StoryGenProgress />
        ) : (
        <>

        {/* HSK Level */}
        <div className="mb-5">
          <label className="mb-2 block text-sm font-semibold text-ink-700">
            Trình độ HSK
          </label>
          <div className="flex flex-wrap gap-2">
            {([1, 2, 3, 4, 5, 6] as HskLevel[]).map((lv) => (
              <button
                key={lv}
                onClick={() => setHskLevel(lv)}
                disabled={submitting}
                className={[
                  'rounded-pill border-2 px-4 py-1.5 text-sm font-semibold transition-all',
                  hskLevel === lv
                    ? 'border-ink-700 bg-ink-700 text-cream'
                    : 'border-ink-200 bg-paper text-ink-500 hover:border-ink-400',
                ].join(' ')}
              >
                HSK {lv}
              </button>
            ))}
          </div>
        </div>

        {/* Genre */}
        <div className="mb-5">
          <label className="mb-2 block text-sm font-semibold text-ink-700">
            Thể loại
          </label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {PRESET_GENRES.map((g) => {
              const isActive = !customGenre.trim() && selectedGenreChip === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => {
                    setSelectedGenreChip(g.id);
                    setCustomGenre('');
                  }}
                  disabled={submitting}
                  className={[
                    'flex flex-col items-center gap-1 rounded-chunk border-2 px-2 py-3 transition-all',
                    isActive
                      ? 'border-coral-500 bg-coral-50 text-coral-700'
                      : 'border-ink-200 bg-paper text-ink-500 hover:border-ink-400',
                  ].join(' ')}
                >
                  <span className="text-2xl">{g.emoji}</span>
                  <span className="text-xs font-semibold">{g.label}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-xs text-ink-500">
              Hoặc tự nhập thể loại khác
            </label>
            <input
              type="text"
              value={customGenre}
              onChange={(e) => setCustomGenre(e.target.value)}
              disabled={submitting}
              maxLength={50}
              placeholder="vd: trinh thám phòng kín, võ hiệp..."
              className="w-full rounded-pill border-2 border-ink-200 bg-paper px-4 py-2 text-sm focus:border-ink-700 focus:outline-none disabled:opacity-50"
            />
          </div>
        </div>

        {/* Description */}
        <div className="mb-5">
          <label className="mb-2 block text-sm font-semibold text-ink-700">
            Mô tả câu chuyện bạn muốn{' '}
            <span className="text-xs font-normal text-ink-400">
              ({description.length}/500)
            </span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
            maxLength={500}
            rows={3}
            placeholder="Ví dụ: Một học sinh tìm thấy chú mèo đi lạc và quyết định mang nó về nuôi..."
            className="w-full rounded-chunk border-2 border-ink-200 bg-paper px-4 py-3 text-sm focus:border-ink-700 focus:outline-none disabled:opacity-50"
          />
        </div>

        {/* Sentence count */}
        <div className="mb-5">
          <label className="mb-2 flex items-center justify-between text-sm font-semibold text-ink-700">
            <span>Số câu</span>
            <span className="rounded-pill bg-coral-100 px-3 py-0.5 font-mono text-coral-700">
              {sentenceCount} câu
            </span>
          </label>
          <input
            type="range"
            min={MIN_SENTENCES}
            max={maxSentences}
            value={sentenceCount}
            onChange={(e) => setSentenceCount(parseInt(e.target.value, 10))}
            disabled={submitting}
            className="w-full accent-coral-500 disabled:opacity-50"
          />
          <div className="mt-1 flex justify-between text-xs text-ink-400">
            <span>{MIN_SENTENCES} câu</span>
            <span>tối đa {maxSentences} câu cho HSK {hskLevel}</span>
          </div>
        </div>

        {/* Dialogue toggle */}
        <div className="mb-5">
          <label className="flex cursor-pointer items-center gap-3 rounded-chunk border-2 border-ink-200 bg-paper p-4 hover:border-ink-400">
            <input
              type="checkbox"
              checked={includeDialogue}
              onChange={(e) => setIncludeDialogue(e.target.checked)}
              disabled={submitting}
              className="h-5 w-5 accent-coral-500"
            />
            <div>
              <div className="text-sm font-semibold text-ink-700">
                Có đối thoại giữa các nhân vật
              </div>
              <div className="text-xs text-ink-500">
                Truyện sẽ có lời nói trực tiếp trong dấu ngoặc kép ""
              </div>
            </div>
          </label>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-4 rounded-chunk border-2 border-coral-300 bg-coral-50 p-3 text-sm text-coral-700">
            ⚠️ {error}
          </div>
        )}

        {/* Submit + quota */}
        <div className="flex items-center justify-between gap-3 border-t-2 border-ink-100 pt-4">
          <div className="text-xs text-ink-500">
            {quota === null ? (
              <span>Đang kiểm tra số lượt...</span>
            ) : (
              <div className="flex items-center gap-2">
                <span>
                  Còn{' '}
                  <strong className={quota.remaining === 0 ? 'text-coral-600' : 'text-ink-700'}>
                    {quota.remaining}/{quota.limit}
                  </strong>{' '}
                  lượt hôm nay
                </span>
                {quota.tier && quota.tier !== 'free' && (
                  <span className="rounded-pill bg-sun-100 px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-sun-500">
                    ✨ {quota.tier === 'lifetime' ? 'Pro ∞' : 'Pro'}
                  </span>
                )}
                {(!quota.tier || quota.tier === 'free') && (
                  <button
                    onClick={() => setShowUpgrade(true)}
                    className="font-semibold text-coral-600 underline hover:text-coral-700"
                  >
                    Nâng cấp Pro để có nhiều hơn →
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={submitting}
              className="rounded-pill border-2 border-ink-200 bg-paper px-5 py-2 text-sm font-semibold text-ink-500 hover:border-ink-400 hover:text-ink-700 disabled:opacity-50"
            >
              Huỷ
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="rounded-pill border-2 border-coral-600 bg-coral-500 px-6 py-2 text-sm font-semibold text-white shadow-chunky-soft hover:bg-coral-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? '⏳ Đang viết truyện...' : '✨ Tạo truyện'}
            </button>
          </div>
        </div>
        </>
        )}
      </div>

      {/* Upgrade modal overlay. On close, re-fetch quota so the UI flips
          to "30/30" the moment payment lands without needing a reload. */}
      {showUpgrade && (
        <UpgradeModal
          onClose={() => {
            setShowUpgrade(false);
            getQuota().then(setQuota);
          }}
        />
      )}
    </div>
  );
}
