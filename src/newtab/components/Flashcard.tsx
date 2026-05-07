import { useEffect, type ReactNode } from 'react';
import { FlashcardImage } from './FlashcardImage';
import type { AudioScope, AudioSpeed } from '../../services/audioService';
import type {
  BackFieldId,
  FlashcardLayout,
  FrontFieldId,
  Word,
} from '../../types';

interface FlashcardProps {
  word: Word;
  flipped: boolean;
  onFlip: () => void;
  /**
   * Unified play handler. Called for both mouse clicks and keyboard shortcuts
   * fired from the parent (TabFlashcards). Lifting this up lets the pulse
   * animation react to keyboard input too.
   *
   * Voice selects which TTS source to play:
   *   - 'native' → Anki HSK+ deck human MP3 (only when available)
   *   - 'male'   → CosyVoice longanyang AI (words-male/, sentences-male/)
   *   - 'female' → Cherry / Qwen-TTS AI (Cherry IS female-sounding)
   *
   * `customText` — optional Web Speech fallback text override. Use this when
   * the audio button is for an alternative example sentence (e.g. Ví dụ 2
   * from Anki) so AI fallback reads that text instead of word.example.
   */
  onPlay: (scope: AudioScope, speed: AudioSpeed, voice: 'native' | 'male' | 'female', customText?: string) => void;
  isSpeaking: boolean;
  supported: boolean;
  /**
   * User-configurable order of blocks on each face. See types/index.ts for
   * the complete list of field IDs.
   */
  layout: FlashcardLayout;
  /**
   * Whether this word has a native human MP3 from Anki for the term itself.
   * Lifted into props (not derived from word.id inside Flashcard) so the
   * parent can also use it elsewhere — and so Flashcard stays a pure render
   * component without coupling to the Anki data hook directly.
   */
  hasNativeWord: boolean;
  /** Same as above but for the example sentence audio. */
  hasNativeSentence: boolean;
  /**
   * Anki HSK+ supplemental data for this word (sentence + meaning + POS).
   * Null when the deck doesn't cover this word, or while lazy-loading.
   * Parent uses useAnkiData(word.id) to populate this.
   */
  ankiData: AnkiData | null;
}

/**
 * Tiny monospace keyboard hint, e.g. "Space" or "⇧".
 */
function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[1.25rem] items-center justify-center rounded-md border border-ink-200 bg-white px-1 py-0 font-mono text-[0.65rem] font-semibold text-ink-500 shadow-sm">
      {children}
    </kbd>
  );
}

/**
 * Small icon-button for a single audio action (normal or slow playback).
 * Used both for the word term and the example sentence.
 */
function AudioIconButton(props: {
  label: string;
  icon: string;
  onClick: (e: React.MouseEvent) => void;
  isSpeaking?: boolean;
  size?: 'sm' | 'md';
  tone?: 'primary' | 'ghost';
}) {
  const { label, icon, onClick, isSpeaking, size = 'md', tone = 'primary' } = props;
  const sizeClass = size === 'sm' ? 'h-9 w-9 text-sm' : 'h-11 w-11 text-lg';
  const toneClass =
    tone === 'primary'
      ? 'border-coral-500 bg-white text-coral-700 hover:bg-coral-500 hover:text-white'
      : 'border-ink-200 bg-white text-ink-500 hover:border-coral-500 hover:text-coral-700';

  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={[
        'flex shrink-0 items-center justify-center rounded-pill border-2 transition-all',
        sizeClass,
        toneClass,
        isSpeaking && 'is-speaking',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {icon}
    </button>
  );
}

/**
 * Pill-style large button — for the front face of the card where we have
 * space for icon + label ("🔊 Nghe" / "🐢 Chậm") plus an optional keyboard hint.
 */
function AudioPillButton(props: {
  label: string;
  icon: string;
  onClick: (e: React.MouseEvent) => void;
  isSpeaking?: boolean;
  variant: 'primary' | 'secondary';
  kbdHint?: ReactNode;
}) {
  const { label, icon, onClick, isSpeaking, variant, kbdHint } = props;
  const classes =
    variant === 'primary'
      ? 'border-coral-500 bg-white text-coral-700 hover:bg-coral-500 hover:text-white'
      : 'border-ink-200 bg-white text-ink-600 hover:border-ink-400';

  return (
    <button
      onClick={onClick}
      className={[
        'flex items-center gap-2 rounded-pill border-2 px-5 py-2.5 font-display font-semibold transition-all',
        classes,
        isSpeaking && 'is-speaking',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span>{icon}</span>
      <span>{label}</span>
      {kbdHint && <span className="ml-1 flex items-center gap-0.5">{kbdHint}</span>}
    </button>
  );
}

// —————————————————————————————————————————————————————————
// Field renderers
//
// Each face is rendered by walking the user's layout array and calling the
// matching renderer. This is what makes the field order configurable.
//
// Renderers return null for blocks that don't apply (e.g. `audio` when
// the Web Speech + bundled MP3 layer is completely unavailable, or
// `example` when a word has no example sentence).
// —————————————————————————————————————————————————————————

interface FieldCtx {
  word: Word;
  supported: boolean;
  isSpeaking: boolean;
  /**
   * Unified handler. Each audio button in the field renderers calls this
   * with the scope (term vs example), speed (normal vs slow), and voice
   * ('native' | 'male' | 'female') it represents.
   *
   * `customText` — optional override for Web Speech fallback text. Used by
   * Ví dụ 2 buttons (Anki sentence) so AI/Web Speech reads ankiData.s
   * instead of word.example when Native MP3 is missing or AI is selected.
   */
  onPlay: (scope: AudioScope, speed: AudioSpeed, voice: 'native' | 'male' | 'female', customText?: string) => void;
  /** Whether Anki has a native MP3 for this word's term. */
  hasNativeWord: boolean;
  /** Whether Anki has a native MP3 for this word's example sentence. */
  hasNativeSentence: boolean;
  /**
   * Anki HSK+ deck supplemental data (sentence + meaning + POS) when
   * available for this word, else null. Lazy-loaded by the parent.
   */
  ankiData: AnkiData | null;
}

/**
 * Subset of Anki data shape consumed by Flashcard. Keep this minimal so the
 * component doesn't pull in the full hook types — parent passes only what's
 * needed.
 */
interface AnkiData {
  /** Meaning (English) */
  m: string;
  /** Part of speech (English, e.g. "noun", "verb") */
  p: string;
  /** Example sentence in Chinese */
  s: string;
  /** Sentence pinyin with tone marks. Sometimes null when source missing. */
  sp: string | null;
  /** Sentence English translation. Sometimes null when source missing. */
  se: string | null;
}

/**
 * Three-button audio control: [🎙️] [👨] [👩].
 *
 * - 🎙️ Native — shown only when Anki has a recording for this word/sentence.
 *   Plays the human MP3 from the HSK+ deck (~92% words / 61% sentences).
 * - 👨 Male AI — CosyVoice longanyang
 * - 👩 Female AI — Cherry / Qwen-TTS
 *
 * Native gets visual emphasis (coral fill on hover, slight scale on active)
 * because it's the higher-quality option; AI buttons stay neutral.
 *
 * Per Jason: default click on the card body plays AI male — these explicit
 * buttons let users compare AI vs native side-by-side.
 */
function VoiceAudioButtons(props: {
  onPlay: (voice: 'native' | 'male' | 'female') => void;
  isSpeaking?: boolean;
  variant: 'pill' | 'icon-md' | 'icon-sm';
  hasNative: boolean;
}) {
  const { onPlay, isSpeaking, variant, hasNative } = props;

  // Shared style logic
  const baseClasses =
    'flex items-center justify-center rounded-pill border-2 transition-all';
  const aiActive =
    'border-coral-500 bg-white text-coral-700 hover:bg-coral-500 hover:text-white';
  // Native gets a distinct fill so users notice it's the human recording.
  // Coral background on idle, deeper coral on hover — invites a click.
  const nativeActive =
    'border-coral-600 bg-coral-50 text-coral-700 hover:bg-coral-600 hover:text-white';

  let sizeClasses = '';
  if (variant === 'pill') {
    sizeClasses = 'h-11 w-12 text-2xl';
  } else if (variant === 'icon-md') {
    sizeClasses = 'h-11 w-11 text-lg';
  } else {
    sizeClasses = 'h-9 w-9 text-sm';
  }

  return (
    <>
      {hasNative && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay('native');
          }}
          aria-label="Nghe giọng người thật (Anki)"
          title="Giọng người thật"
          className={[
            baseClasses,
            sizeClasses,
            nativeActive,
            isSpeaking && 'is-speaking',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <span>🎙️</span>
        </button>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPlay('male');
        }}
        aria-label="Nghe giọng AI Nam"
        title="Giọng AI Nam (CosyVoice)"
        className={[
          baseClasses,
          sizeClasses,
          aiActive,
          isSpeaking && 'is-speaking',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span>👨</span>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPlay('female');
        }}
        aria-label="Nghe giọng AI Nữ"
        title="Giọng AI Nữ (CosyVoice)"
        className={[
          baseClasses,
          sizeClasses,
          aiActive,
          isSpeaking && 'is-speaking',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span>👩</span>
      </button>
    </>
  );
}

function renderFrontField(id: FrontFieldId, ctx: FieldCtx): ReactNode {
  const { word, supported, isSpeaking, onPlay } = ctx;

  switch (id) {
    case 'pos':
      return (
        <div
          key="pos"
          className="text-xs font-semibold uppercase tracking-widest text-ink-400"
        >
          {word.pos ?? 'Từ vựng'}
        </div>
      );

    case 'term':
      return (
        <div
          key="term"
          className={[
            'font-display font-bold leading-none text-ink-700',
            word.lang === 'zh' ? 'text-zh text-[7rem]' : 'text-7xl',
          ].join(' ')}
        >
          {word.term}
        </div>
      );

    case 'audio':
      if (!supported) return null;
      return (
        <div key="audio" className="flex flex-wrap items-center gap-2">
          <VoiceAudioButtons
            variant="pill"
            isSpeaking={isSpeaking}
            hasNative={ctx.hasNativeWord}
            onPlay={(voice) => onPlay('word', 'normal', voice)}
          />
          {/* Slow button — single, defaults male voice. Keeping one slow
              button (not two) avoids a 4-button row that overflows on mobile
              screens. Power users can use Shift+Space for keyboard slow. */}
          <AudioPillButton
            icon="🐢"
            label="Chậm"
            onClick={(e) => {
              e.stopPropagation();
              onPlay('word', 'slow', 'male');
            }}
            isSpeaking={isSpeaking}
            variant="secondary"
            kbdHint={
              <>
                <Kbd>⇧</Kbd>
                <Kbd>Space</Kbd>
              </>
            }
          />
        </div>
      );

    case 'flipHint':
      return (
        <div
          key="flipHint"
          className="flex items-center gap-2 text-sm font-semibold text-ink-300"
        >
          <span>👆</span>
          <span>Chạm để lật</span>
          <span className="ml-1 flex items-center gap-1">
            <span className="text-ink-400">hoặc</span>
            <Kbd>↵</Kbd>
          </span>
        </div>
      );
  }
}

function renderBackField(id: BackFieldId, ctx: FieldCtx): ReactNode {
  const { word, supported, isSpeaking, onPlay } = ctx;

  switch (id) {
    case 'term':
      return (
        <div key="term" className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div
                className={[
                  'font-display font-bold text-ink-700',
                  word.lang === 'zh' ? 'text-zh text-5xl' : 'text-5xl',
                ].join(' ')}
              >
                {word.term}
              </div>
              {word.hint && <div className="text-3xl">{word.hint}</div>}
            </div>
            <div className="mt-2 font-mono-ipa text-xl text-coral-600">
              {word.phonetic}
            </div>
          </div>

          {supported && (
            <div className="flex shrink-0 items-center gap-2">
              <VoiceAudioButtons
                variant="icon-md"
                isSpeaking={isSpeaking}
                hasNative={ctx.hasNativeWord}
                onPlay={(voice) => onPlay('word', 'normal', voice)}
              />
              <AudioIconButton
                icon="🐢"
                label="Nghe chậm (Shift+Space)"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay('word', 'slow', 'male');
                }}
                isSpeaking={isSpeaking}
                tone="ghost"
              />
            </div>
          )}
        </div>
      );

    case 'translation':
      return (
        <div
          key="translation"
          className="rounded-chunk border-2 border-mint-200 bg-mint-50 p-5"
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-mint-700">
            Nghĩa tiếng Việt
          </div>
          <div className="mt-1 font-display text-2xl font-bold text-ink-700">
            {word.translation}
          </div>
        </div>
      );

    case 'image':
      return (
        <div key="image">
          <FlashcardImage wordId={word.id} lang={word.lang} />
        </div>
      );

    case 'example':
      if (!word.example) return null;
      return (
        <div
          key="example"
          className="rounded-chunk border-2 border-ink-100 bg-cream p-5"
        >
          {/* Ví dụ 1 — extension's curated example sentence (from hsk1.ts).
              This text is OUR data, not Anki's. Anki native MP3 audio does NOT
              match this text — it's the Anki source's own sentence. So we only
              show the 🔊 AI button + 🐢 slow here, which TTS-reads word.example.
              The 🎙️ Native button moves to Ví dụ 2 where the audio actually
              matches the displayed text. */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                {ctx.ankiData ? 'Ví dụ 1' : 'Ví dụ'}
              </div>
              <div
                className={[
                  'mt-1 font-medium text-ink-700',
                  word.lang === 'zh' ? 'text-zh text-xl' : 'text-lg',
                ].join(' ')}
              >
                {word.example}
              </div>
              {word.exampleTranslation && (
                <div className="mt-1 text-sm italic text-ink-500">
                  {word.exampleTranslation}
                </div>
              )}
            </div>
            {supported && (
              <div className="flex shrink-0 items-center gap-2">
                {/* AI-only buttons for Ví dụ 1 — TTS reads word.example text.
                    No 🎙️ Native here because Anki MP3 doesn't match this text. */}
                <VoiceAudioButtons
                  variant="icon-sm"
                  isSpeaking={isSpeaking}
                  hasNative={false}
                  onPlay={(voice) => onPlay('sentence', 'normal', voice)}
                />
                <AudioIconButton
                  icon="🐢"
                  label="Nghe chậm ví dụ"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlay('sentence', 'slow', 'male');
                  }}
                  isSpeaking={isSpeaking}
                  size="sm"
                  tone="ghost"
                />
              </div>
            )}
          </div>
          {/* Ví dụ 2 — Anki HSK deck's example sentence. Native MP3 audio
              matches this text (it's the actual Anki recording). Audio buttons
              live HERE (not above) so the 🎙️ Native button plays the audio
              that matches what the user sees. */}
          {ctx.ankiData && (
            <div className="mt-4 border-t-2 border-ink-100 pt-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                    Ví dụ 2
                  </div>
                  <div
                    className={[
                      'mt-1 font-medium text-ink-700',
                      word.lang === 'zh' ? 'text-zh text-xl' : 'text-lg',
                    ].join(' ')}
                  >
                    {ctx.ankiData.s}
                  </div>
                  {ctx.ankiData.sp && (
                    <div className="mt-1 text-sm italic text-ink-500">
                      {ctx.ankiData.sp}
                    </div>
                  )}
                  {ctx.ankiData.se && (
                    <div className="mt-1 text-sm italic text-ink-500">
                      {ctx.ankiData.se}
                    </div>
                  )}
                </div>
                {supported && (
                  <div className="flex shrink-0 items-center gap-2">
                    {/* Native + AI buttons for Ví dụ 2 — Native plays Anki MP3
                        (matches displayed text); AI reads ctx.ankiData.s via TTS. */}
                    <VoiceAudioButtons
                      variant="icon-sm"
                      isSpeaking={isSpeaking}
                      hasNative={ctx.hasNativeSentence}
                      onPlay={(voice) => onPlay('sentence', 'normal', voice, ctx.ankiData?.s)}
                    />
                    <AudioIconButton
                      icon="🐢"
                      label="Nghe chậm ví dụ"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlay('sentence', 'slow', ctx.hasNativeSentence ? 'native' : 'male', ctx.ankiData?.s);
                      }}
                      isSpeaking={isSpeaking}
                      size="sm"
                      tone="ghost"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
  }
}

// —————————————————————————————————————————————————————————
// Main component
// —————————————————————————————————————————————————————————

export function Flashcard({
  word,
  flipped,
  onFlip,
  onPlay,
  isSpeaking,
  supported,
  layout,
  hasNativeWord,
  hasNativeSentence,
  ankiData,
}: FlashcardProps) {
  const ctx: FieldCtx = {
    word,
    supported,
    isSpeaking,
    onPlay,
    hasNativeWord,
    hasNativeSentence,
    ankiData,
  };

  // Auto-speak when card flips to back (normal speed, term, male voice).
  // Always fires on flip regardless of field order. Uses male voice as
  // default since auto-speak is non-interactive — user didn't pick a gender.
  useEffect(() => {
    if (flipped && supported) {
      const t = setTimeout(() => onPlay('word', 'normal', 'male'), 250);
      return () => clearTimeout(t);
    }
  }, [flipped, word.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flip-container mx-auto w-full max-w-2xl">
      <div
        onClick={onFlip}
        className={['flip-inner flip-grid relative cursor-pointer', flipped && 'flipped']
          .filter(Boolean)
          .join(' ')}
      >
        {/* ——————— Front face ———————
            flex-col with gap-6 gives even spacing regardless of which blocks
            the user ordered. Centered both axes so reordered content still
            looks balanced. */}
        <div className="flip-face flip-cell card-chunky flex flex-col items-center justify-center gap-6 p-10 text-center">
          {layout.front.map((id) => renderFrontField(id, ctx))}
        </div>

        {/* ——————— Back face ———————
            space-y-4 → consistent vertical gap between blocks. */}
        <div className="flip-face flip-back flip-cell card-chunky space-y-4 p-8">
          {layout.back.map((id) => renderBackField(id, ctx))}
        </div>
      </div>
    </div>
  );
}
