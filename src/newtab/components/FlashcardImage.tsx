import { useRef } from 'react';
import { useCustomImage } from '../hooks/useCustomImage';
import { useAuth } from '../hooks/useAuth';
import { getAnkiImageUrl } from '../hooks/useAnkiData';
import type { Language } from '../../types';

interface FlashcardImageProps {
  wordId: string;
  lang: Language;
}

/**
 * Flashcard image slot — three-tier resolution:
 *
 *   1. Custom upload (Google Drive) — user's personal image, priority 1.
 *      Loaded via useCustomImage hook (Drive sync, offline cache).
 *
 *   2. Anki HSK+ deck image — fallback, priority 2.
 *      ~52% of HSK 1-6 words have a real photograph from the deck. Bundled
 *      under /public/images/zh/words-anki/{wordId}.{jpg|png}. Treated as
 *      read-only — user can still upload their own to override.
 *
 *   3. Upload prompt — only when neither custom nor Anki image exists.
 *
 * Clicking the image must NOT flip the card (the card has an outer onClick),
 * so all interactive children stopPropagation.
 */
export function FlashcardImage({ wordId, lang }: FlashcardImageProps) {
  const { signedIn } = useAuth();
  const { imageUrl, loading, uploading, error, uploadImage, removeImage } =
    useCustomImage(wordId, lang);

  // Anki image is only available for Chinese words (deck is HSK-specific).
  // For other langs the URL stays null.
  const ankiImageUrl = lang === 'zh' ? getAnkiImageUrl(wordId) : null;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const pickFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadImage(file);
    }
    // Reset so selecting the same file again triggers change event
    e.target.value = '';
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Xoá ảnh này khỏi flashcard?')) {
      await removeImage();
    }
  };

  // Hidden file input — shared across all render branches
  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif"
      className="hidden"
      onChange={handleFileChange}
      onClick={(e) => e.stopPropagation()}
    />
  );

  if (loading) {
    return (
      <div className="flex h-32 w-full items-center justify-center rounded-chunk border-2 border-dashed border-ink-200 bg-ink-50">
        <div className="text-xs text-ink-400">Đang tải…</div>
      </div>
    );
  }

  // Image exists — show it with hover overlay.
  // We use object-contain inside a fixed-aspect container so:
  //   - Portrait photos don't get top/bottom cropped
  //   - Landscape photos don't get left/right cropped
  //   - All images render at consistent height for layout stability
  // Background is cream so letterboxed empty space doesn't look broken.
  if (imageUrl) {
    return (
      <div
        className="group relative overflow-hidden rounded-chunk border-2 border-ink-100 bg-cream"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt="Flashcard hình ảnh"
          className="block h-48 w-full object-contain"
        />
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-ink-700/0 opacity-0 transition-all group-hover:bg-ink-700/60 group-hover:opacity-100">
          <button
            onClick={pickFile}
            disabled={uploading}
            className="rounded-pill border-2 border-white bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-white disabled:opacity-50"
          >
            🔄 Đổi
          </button>
          <button
            onClick={handleRemove}
            disabled={uploading}
            className="rounded-pill border-2 border-white bg-coral-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-coral-600 disabled:opacity-50"
          >
            🗑️ Xoá
          </button>
        </div>
        {fileInput}
        {error && (
          <div className="absolute inset-x-0 bottom-0 bg-coral-500 px-3 py-1.5 text-xs font-semibold text-white">
            {error}
          </div>
        )}
      </div>
    );
  }

  // Anki image fallback — Chinese words only, when no custom upload exists.
  // We render with a small badge so users know it's the deck's photo (not
  // their personal upload), and they can hover to upload their own if signed in.
  if (ankiImageUrl) {
    return (
      <div
        className="group relative overflow-hidden rounded-chunk border-2 border-ink-100"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={ankiImageUrl}
          alt="Hình minh họa từ vựng"
          className="block h-40 w-full object-cover"
        />
        {/* Subtle "Anki" badge so users know this isn't their custom image */}
        <div className="absolute left-2 top-2 rounded-pill border border-ink-200 bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-ink-600">
          📚 Anki HSK+
        </div>
        {/* Allow upload override if signed in — hover to reveal */}
        {signedIn === true && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-700/0 opacity-0 transition-all group-hover:bg-ink-700/60 group-hover:opacity-100">
            <button
              onClick={pickFile}
              disabled={uploading}
              className="rounded-pill border-2 border-white bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-white disabled:opacity-50"
            >
              🖼️ Thay bằng ảnh của bạn
            </button>
          </div>
        )}
        {fileInput}
      </div>
    );
  }

  // Not signed in — show hint
  if (signedIn === false) {
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-32 flex-col items-center justify-center gap-1 rounded-chunk border-2 border-dashed border-ink-200 bg-ink-50 px-4 text-center"
      >
        <div className="text-2xl opacity-50">🖼️</div>
        <p className="text-xs text-ink-500">
          Đăng nhập Google để thêm ảnh cá nhân hoá
        </p>
      </div>
    );
  }

  // Signed in, no image — upload prompt
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="rounded-chunk border-2 border-dashed border-ink-200 bg-ink-50"
    >
      <button
        onClick={pickFile}
        disabled={uploading || signedIn === null}
        className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-chunk px-4 text-center transition-all hover:bg-mint-50 disabled:opacity-50"
      >
        <div className="text-3xl">{uploading ? '⏳' : '➕'}</div>
        <p className="text-xs font-semibold text-ink-600">
          {uploading ? 'Đang upload…' : 'Thêm ảnh cho flashcard này'}
        </p>
        <p className="text-[10px] text-ink-400">JPEG · PNG · WebP · tối đa 5MB</p>
      </button>
      {fileInput}
      {error && (
        <div className="border-t-2 border-coral-200 bg-coral-50 px-3 py-2 text-xs font-semibold text-coral-700">
          {error}
        </div>
      )}
    </div>
  );
}
