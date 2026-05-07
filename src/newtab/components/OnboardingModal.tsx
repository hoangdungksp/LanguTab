import { useState } from 'react';
import { updateSettings } from '../../services/db';

/**
 * First-run onboarding modal.
 *
 * Shows 4 slides introducing the 4 main features:
 *   1. Welcome — what is LinguTab
 *   2. Phonetics — pinyin chart + phoneme audio
 *   3. Flashcards — FSRS spaced repetition
 *   4. Stories — comprehensible input reading
 *
 * Dismissed by either "Bắt đầu" button on last slide or X close button on
 * any slide. Persisted to settings.hasSeenOnboarding so it never reappears.
 *
 * Why modal not full-page: keeps the dashboard accessible behind so users
 * can peek and get a sense of the layout. Lower commitment than a hard wall.
 */

interface Slide {
  emoji: string;
  title: string;
  body: string;
  highlight: string;
}

const SLIDES: Slide[] = [
  {
    emoji: '🦉',
    title: 'Chào mừng đến với LinguTab!',
    body: 'Mỗi tab mới = một cơ hội học tiếng Trung. Bạn sẽ học từ vựng HSK1, luyện phát âm pinyin, và đọc truyện ngắn — tất cả miễn phí.',
    highlight: 'Học mỗi tab · Mỗi ngày một chút',
  },
  {
    emoji: '🎧',
    title: 'Luyện phát âm chuẩn',
    body: 'Tab "Phát âm" có bảng pinyin đầy đủ với audio chuẩn từ DigMandarin. Click vào âm đầu, âm vận, hoặc thanh điệu để nghe + xem ví dụ.',
    highlight: '21 âm đầu · 38 âm vận · 4 thanh điệu',
  },
  {
    emoji: '🃏',
    title: 'Ôn từ vựng thông minh',
    body: 'Tab "Flashcard" dùng thuật toán FSRS để chọn đúng từ cần ôn vào đúng lúc. Click 👨/👩 để chọn giọng đọc nam/nữ. Hệ thống tự động lên lịch.',
    highlight: '150 từ HSK1 · Audio Cherry/CosyVoice',
  },
  {
    emoji: '📖',
    title: 'Đọc truyện học từ',
    body: 'Tab "Truyện kể" có 5 thể loại: Đời sống, Hài, Kinh dị, Tiên hiệp, Buồn. Hover từ HSK1 để xem flashcard mini, click để mở thẻ học chi tiết.',
    highlight: 'Học từ trong ngữ cảnh tự nhiên',
  },
];

export function OnboardingModal({ onDismiss }: { onDismiss: () => void }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const isLast = slideIndex === SLIDES.length - 1;

  const dismiss = async () => {
    await updateSettings({ hasSeenOnboarding: true });
    onDismiss();
  };

  const next = () => {
    if (isLast) {
      dismiss();
    } else {
      setSlideIndex((i) => i + 1);
    }
  };

  const prev = () => {
    setSlideIndex((i) => Math.max(0, i - 1));
  };

  const slide = SLIDES[slideIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-700/60 backdrop-blur-sm p-4">
      <div className="card-chunky relative w-full max-w-lg overflow-hidden">
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
          aria-label="Đóng"
        >
          ✕
        </button>

        {/* Decorative blobs (purely visual) */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-coral-100 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-mint-100 blur-3xl" />

        {/* Content */}
        <div className="relative p-8 text-center">
          <div className="text-6xl">{slide.emoji}</div>

          <h2 className="mt-4 font-display text-2xl font-bold text-ink-700">
            {slide.title}
          </h2>

          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-500">
            {slide.body}
          </p>

          <div className="mt-4 inline-block rounded-pill border-2 border-coral-300 bg-coral-50 px-4 py-1.5 font-display text-xs font-semibold text-coral-700">
            {slide.highlight}
          </div>

          {/* Slide indicator dots */}
          <div className="mt-6 flex items-center justify-center gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlideIndex(i)}
                aria-label={`Slide ${i + 1}`}
                className={[
                  'h-2 rounded-full transition-all',
                  i === slideIndex
                    ? 'w-8 bg-coral-500'
                    : 'w-2 bg-ink-200 hover:bg-ink-300',
                ].join(' ')}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              onClick={prev}
              disabled={slideIndex === 0}
              className="rounded-pill border-2 border-ink-200 bg-paper px-5 py-2 font-display text-sm font-semibold text-ink-500 transition-colors hover:border-ink-400 disabled:cursor-not-allowed disabled:opacity-30"
            >
              ← Trước
            </button>

            <button
              onClick={dismiss}
              className="text-xs text-ink-400 underline hover:text-ink-600"
            >
              Bỏ qua giới thiệu
            </button>

            <button
              onClick={next}
              className="btn-coral"
            >
              {isLast ? (
                <>
                  <span>🚀</span>
                  <span>Bắt đầu học</span>
                </>
              ) : (
                <>
                  <span>Tiếp</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
