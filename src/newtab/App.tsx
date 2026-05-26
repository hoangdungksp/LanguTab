import { useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { Header } from './components/Header';
import { GoogleAppsMenu } from './components/GoogleAppsMenu';
import { TabNav } from './components/TabNav';
import { Dashboard } from './components/Dashboard';
import { TabPhonetics } from './components/TabPhonetics';
import { TabFlashcards } from './components/TabFlashcards';
import { TabStories } from './components/TabStories';
import { TabTranslate } from './components/TabTranslate';
import { TabExam } from './components/TabExam';
import { OnboardingModal } from './components/OnboardingModal';
import { syncPendingImages } from '../services/imageService';
import { onAuthChange } from '../services/authService';
import { refreshAdminRole, clearAdminRole } from '../services/adminModeService';

export default function App() {
  const { init, isInitialized, activeTab, hasSeenOnboarding, dismissOnboarding } = useAppStore();

  useEffect(() => {
    init();
  }, [init]);

  // Sync any pending image uploads/deletes:
  //   1. Once on mount (handles app reload after offline editing)
  //   2. Whenever auth state changes to signed-in (handles fresh sign-in)
  useEffect(() => {
    // Fire and forget — failures are logged inside syncPendingImages
    syncPendingImages();

    // D-19: resolve admin role from D1 (via /exam/me) so admin UI shows for
    // editors/admins. Runs on mount + whenever auth changes.
    refreshAdminRole();

    const unsubscribe = onAuthChange((signedIn) => {
      if (signedIn) {
        syncPendingImages();
        refreshAdminRole();
      } else {
        clearAdminRole();
      }
    });
    return unsubscribe;
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="font-display text-ink-400">Đang tải...</div>
      </div>
    );
  }

  return (
    // Sprint 4.8.6: removed bottom padding (py-4 → pt-4) and footer so
    // full-bleed pages like Phòng thi extend to viewport bottom without
    // a cream gap below them.
    <div className="mx-auto min-h-screen w-full max-w-6xl px-6 pt-4 md:px-8 md:pt-5">
      {/* Fixed top-right Google apps quick-launch — sits above all content */}
      <GoogleAppsMenu />
      <Header />
      <TabNav />

      <main>
        {/* Use display:none to preserve tab state across switches.
            EXCEPTION: Stats tab uses conditional mount (not display:none)
            because Recharts' ResponsiveContainer can't measure a hidden DOM
            element — it would log "width(0) and height(0)" warnings every
            time the tab is inactive. Conditional render means charts only
            initialise when actually visible. Trade-off: stats reload on every
            tab switch, but the cost is ~30ms which is imperceptible. */}
        <div style={{ display: activeTab === 'dashboard' ? 'block' : 'none' }}>
          <Dashboard />
        </div>
        <div style={{ display: activeTab === 'phonetics' ? 'block' : 'none' }}>
          <TabPhonetics />
        </div>
        <div style={{ display: activeTab === 'flashcards' ? 'block' : 'none' }}>
          <TabFlashcards />
        </div>
        <div style={{ display: activeTab === 'stories' ? 'block' : 'none' }}>
          <TabStories />
        </div>
        <div style={{ display: activeTab === 'translate' ? 'block' : 'none' }}>
          <TabTranslate />
        </div>
        {activeTab === 'exam' && <TabExam />}
      </main>

      {/* Sprint 4.8.6: footer removed at user request — full-bleed pages
          (especially Phòng thi tab) now extend to viewport bottom without
          the cream gap from a footer below. Version + credit moved into
          the LinguTab Header dropdown / settings if needed. */}

      {/* First-run onboarding — shown once, dismissed via the modal's own
          "Bắt đầu" button which writes hasSeenOnboarding=true to settings. */}
      {!hasSeenOnboarding && (
        <OnboardingModal onDismiss={dismissOnboarding} />
      )}
    </div>
  );
}
