import { useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { langLabels } from '../../data';
import type { Language } from '../../types';
import { AuthButton } from './AuthButton';
import { SyncButton } from './SyncButton';
import { FirstSyncModal } from './FirstSyncModal';
import { UpgradeModal } from './UpgradeModal';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { useTier } from '../hooks/useTier';

export function Header() {
  const { targetLang, setLang } = useAppStore();
  const sync = useSyncStatus();
  const { isPro, tier, loading: tierLoading } = useTier();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const switchTo = (lang: Language) => {
    if (lang !== targetLang) setLang(lang);
  };

  // Show the badge only after the tier has actually loaded — avoids the
  // flicker where signed-in Pro users see "Free" for ~200ms on every new tab.
  const showBadge = sync.signedIn && !tierLoading;

  return (
    <>
      <header className="flex items-center justify-between gap-4 pb-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-chunk bg-coral-500 text-2xl shadow-chunky-coral">
            <span className="drop-shadow-sm">🦉</span>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold leading-none text-ink-700">
              LinguTab
            </h1>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-widest text-ink-400">
              Học mỗi tab · Mỗi ngày một chút
            </p>
          </div>
        </div>

        {/* Right side: lang switcher + tier badge + sync + auth */}
        <div className="flex items-center gap-3">
          {/* Language segmented switcher */}
          <div className="flex items-center gap-1 rounded-pill border-2 border-ink-700 bg-paper p-1 shadow-chunky-soft">
            {(Object.keys(langLabels) as Language[]).map((lang) => {
              const active = targetLang === lang;
              return (
                <button
                  key={lang}
                  onClick={() => switchTo(lang)}
                  className={[
                    'flex items-center gap-2 rounded-pill px-4 py-1.5 font-display text-sm font-semibold uppercase tracking-wider transition-all',
                    active
                      ? 'bg-ink-700 text-cream shadow-sm'
                      : 'text-ink-500 hover:text-ink-700',
                  ].join(' ')}
                >
                  <span className="text-base leading-none">{langLabels[lang].flag}</span>
                  <span>{lang === 'zh' ? '中文' : 'EN'}</span>
                </button>
              );
            })}
          </div>

          {/* Tier badge — Pro/Lifetime gold pill, Free → Upgrade CTA */}
          {showBadge && (
            isPro ? (
              <div
                title={tier === 'lifetime' ? 'Pro trọn đời' : 'Pro'}
                className="rounded-pill border-2 border-sun-300 bg-sun-100 px-3 py-1 font-display text-xs font-bold uppercase tracking-widest text-sun-500 shadow-chunky-sun"
              >
                ✨ {tier === 'lifetime' ? 'Pro ∞' : 'Pro'}
              </div>
            ) : (
              <button
                onClick={() => setShowUpgrade(true)}
                className="rounded-pill border-2 border-coral-500 bg-coral-50 px-3 py-1 font-display text-xs font-bold uppercase tracking-widest text-coral-700 transition-all hover:bg-coral-100"
              >
                ⚡ Nâng cấp Pro
              </button>
            )
          )}

          {/* Sync button — Anki-style manual trigger. Hidden when signed-out. */}
          <SyncButton
            state={sync.state}
            signedIn={sync.signedIn}
            hasPending={sync.hasPending}
            lastSyncAt={sync.lastSyncAt}
            onClick={sync.triggerSync}
          />

          {/* Google auth */}
          <AuthButton />
        </div>
      </header>

      {/* First-sync popup — overlay rendered above app when needed */}
      {sync.state.kind === 'first_sync' && (
        <FirstSyncModal
          decision={sync.state.decision}
          onResolved={sync.reset}
          onCancel={sync.cancelFirstSync}
        />
      )}

      {/* Upgrade modal — shown when Free user clicks "Nâng cấp Pro" */}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </>
  );
}
