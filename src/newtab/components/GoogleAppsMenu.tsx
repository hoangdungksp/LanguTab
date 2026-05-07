import { useEffect, useRef, useState } from 'react';

/**
 * Google Apps quick-launch menu — fixed top-right corner.
 *
 * Mirrors Chrome's default new tab "apps grid" UX: a 3×3 icon button (waffle
 * icon) opens a popup with shortcuts to Gmail, Drive, Calendar, etc. Jason's
 * use case: LinguTab replaces the default new tab, so users still need quick
 * access to Google services without typing URLs.
 *
 * Position: `fixed` top-right with z-50 so it sits above the main app header
 * regardless of scroll position. Doesn't disturb the existing Header layout.
 *
 * Apps shown match Google's own apps grid order. Each link opens in a new
 * tab (`target="_blank"`) so the user stays on LinguTab if they want to
 * keep studying.
 */

interface GoogleApp {
  name: string;
  url: string;
  /**
   * Emoji "icon" — keeps the menu offline-resilient (no CDN dependency)
   * and avoids any chance Manifest V3 CSP blocks gstatic.com loads.
   * The emojis are visually loose but immediately recognisable.
   */
  icon: string;
  /** Optional brand colour for the icon background tile. */
  bg: string;
}

// Curated list — matches Chrome's default Google apps grid for parity.
// Emoji + brand colour combos chosen for instant recognition. Background
// tiles reuse LinguTab's palette (coral/mint/sun) for visual cohesion
// rather than each app's actual brand colour, since Tailwind defaults
// like 'red-100' aren't in the custom config.
const GOOGLE_APPS: GoogleApp[] = [
  { name: 'Gmail', url: 'https://mail.google.com', icon: '✉️', bg: 'bg-coral-100' },
  { name: 'Drive', url: 'https://drive.google.com', icon: '📁', bg: 'bg-sun-100' },
  { name: 'Lịch', url: 'https://calendar.google.com', icon: '📅', bg: 'bg-mint-100' },
  { name: 'Docs', url: 'https://docs.google.com', icon: '📄', bg: 'bg-ink-100' },
  { name: 'Sheets', url: 'https://sheets.google.com', icon: '📊', bg: 'bg-mint-100' },
  { name: 'Slides', url: 'https://slides.google.com', icon: '📽️', bg: 'bg-sun-100' },
  { name: 'YouTube', url: 'https://youtube.com', icon: '📺', bg: 'bg-coral-100' },
  { name: 'Maps', url: 'https://maps.google.com', icon: '🗺️', bg: 'bg-mint-100' },
  { name: 'Photos', url: 'https://photos.google.com', icon: '🖼️', bg: 'bg-coral-100' },
  { name: 'Translate', url: 'https://translate.google.com', icon: '🌐', bg: 'bg-mint-100' },
  { name: 'Tin tức', url: 'https://news.google.com', icon: '📰', bg: 'bg-ink-100' },
  { name: 'Meet', url: 'https://meet.google.com', icon: '🎥', bg: 'bg-mint-100' },
];

export function GoogleAppsMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click. Standard popover dismiss behaviour — without it,
  // the menu would hang around forever after the user clicks anywhere else.
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    // Use 'mousedown' (not 'click') so the toggle button's own click event
    // still works — by the time 'click' fires, our state has already updated.
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Close on Escape — keyboard-friendly dismiss.
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open]);

  return (
    <div ref={containerRef} className="fixed right-4 top-4 z-50">
      {/* Hamburger / waffle icon — clicking toggles the apps grid */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Ứng dụng Google"
        title="Ứng dụng Google"
        className={[
          'flex h-10 w-10 items-center justify-center rounded-full transition-all',
          'hover:bg-ink-100',
          open && 'bg-ink-100',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* 3×3 dot grid — same waffle icon Chrome uses */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="text-ink-500"
        >
          <circle cx="5" cy="5" r="2" />
          <circle cx="12" cy="5" r="2" />
          <circle cx="19" cy="5" r="2" />
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
          <circle cx="5" cy="19" r="2" />
          <circle cx="12" cy="19" r="2" />
          <circle cx="19" cy="19" r="2" />
        </svg>
      </button>

      {/* Apps grid popup — anchored to the button's right edge so it doesn't
          overflow the viewport when LinguTab opens in a narrow window. */}
      {open && (
        <div className="absolute right-0 top-12 w-80 rounded-chunk border-2 border-ink-700 bg-paper p-4 shadow-chunky-soft">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-400">
            Ứng dụng Google
          </div>
          <div className="grid grid-cols-3 gap-2">
            {GOOGLE_APPS.map((app) => (
              <a
                key={app.name}
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 rounded-chunk p-3 text-center transition-all hover:bg-ink-100"
                onClick={() => setOpen(false)}
              >
                <div
                  className={[
                    'flex h-10 w-10 items-center justify-center rounded-chunk text-2xl',
                    app.bg,
                  ].join(' ')}
                >
                  <span>{app.icon}</span>
                </div>
                <span className="text-xs font-medium text-ink-600">
                  {app.name}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
