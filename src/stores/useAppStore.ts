import { create } from 'zustand';
import type { FlashcardLayout, Language, PhonemeVoiceGender, TabId } from '../types';
import { DEFAULT_CARD_LAYOUT, sanitizeCardLayout } from '../types';
import { getSettings, updateSettings } from '../services/db';

interface AppState {
  targetLang: Language;
  activeTab: TabId;
  soundEnabled: boolean;
  streak: number;
  totalReviewsToday: number;
  dailyGoal: number;
  cardLayout: FlashcardLayout;
  phonemeVoiceGender: PhonemeVoiceGender;
  /**
   * Active story id when reading. Cleared when user leaves Stories tab.
   * Used by the story detail view + the "back to story" breadcrumb in
   * Flashcards when the user clicked through from a story word.
   */
  activeStoryId: string | null;
  /**
   * If the user clicked an HSK1 word inside a story, we stash the story id
   * + the wordId here so Flashcards can show a "← Back to story" button
   * and the user can return to exactly where they were. Cleared when they
   * actually use the back button or change tabs through other means.
   */
  storyReturnContext: { storyId: string; wordId: string } | null;
  /**
   * Set when the user clicks a card in WordCatalog (lives in Dashboard).
   * Lets Flashcards render a "← Back to vocabulary list" button that
   * jumps back to Dashboard. Distinct from storyReturnContext because
   * the back destination is a different tab.
   *
   * Stores tierId so we can scroll back to the right section after return
   * (future enhancement — Dashboard's WordCatalog can read this and
   * auto-expand the same tier).
   */
  catalogReturnContext: { tierId: string; wordId: string } | null;
  /**
   * Whether the user has dismissed the welcome onboarding modal.
   * Defaults true once they complete or skip the slides; persisted to
   * Settings so it doesn't reappear on reload.
   */
  hasSeenOnboarding: boolean;
  isInitialized: boolean;

  init: () => Promise<void>;
  setLang: (lang: Language) => Promise<void>;
  setTab: (tab: TabId) => void;
  toggleSound: () => Promise<void>;
  bumpReviewCount: () => Promise<void>;
  setDailyGoal: (goal: number) => Promise<void>;
  setCardLayout: (layout: FlashcardLayout) => Promise<void>;
  resetCardLayout: () => Promise<void>;
  setPhonemeVoiceGender: (gender: PhonemeVoiceGender) => Promise<void>;
  /** Mark the onboarding modal as dismissed (also sets in Settings). */
  dismissOnboarding: () => Promise<void>;
  /** Open a story for reading. */
  openStory: (storyId: string) => void;
  /** Leave the story reader (back to story list). */
  closeStory: () => void;
  /**
   * Navigate from a story to a flashcard. Stashes return context so the
   * flashcard view can render a "back to story" button.
   */
  navigateToWordFromStory: (storyId: string, wordId: string) => void;
  /**
   * Navigate to a flashcard from a non-story context (e.g. Translate tab).
   * Doesn't set return context — user just lands in Flashcards normally.
   */
  navigateToWord: (wordId: string) => void;
  /**
   * Navigate from WordCatalog (in Dashboard) to a flashcard.
   * Stashes catalogReturnContext so Flashcards renders a back button
   * that returns the user to Dashboard.
   */
  navigateToWordFromCatalog: (tierId: string, wordId: string) => void;
  /** Clear story return context (called by the back button). */
  clearStoryReturnContext: () => void;
  /** Clear catalog return context (called by the back button). */
  clearCatalogReturnContext: () => void;
  /**
   * Re-hydrate state from Dexie. Called after destructive actions
   * (delete account, force download, clear local) so the UI reflects
   * the fresh DB state — otherwise Zustand keeps the stale values
   * and the dashboard still shows the old streak/reviews/goal.
   *
   * Same body as init() but without the lastStudyDate side-effect logic
   * (which would re-write stale values from the cleared row).
   */
  reloadFromDb: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  targetLang: 'zh',
  activeTab: 'dashboard',
  soundEnabled: true,
  streak: 0,
  totalReviewsToday: 0,
  dailyGoal: 10,
  cardLayout: DEFAULT_CARD_LAYOUT,
  phonemeVoiceGender: 'male',
  activeStoryId: null,
  storyReturnContext: null,
  catalogReturnContext: null,
  hasSeenOnboarding: false,
  isInitialized: false,

  init: async () => {
    const s = await getSettings();
    const today = new Date().toISOString().slice(0, 10);

    // Reset daily counter if it's a new day; bump streak if yesterday was studied.
    let { streak, totalReviewsToday, lastStudyDate } = s;
    if (lastStudyDate !== today) {
      totalReviewsToday = 0;
      // Streak handling happens when user actually reviews (in bumpReviewCount).
    }

    await updateSettings({ totalReviewsToday });

    set({
      targetLang: s.targetLang,
      soundEnabled: s.soundEnabled,
      streak,
      totalReviewsToday,
      dailyGoal: s.dailyGoal,
      // Sanitize on load so stale prefs don't break the render.
      cardLayout: sanitizeCardLayout(s.cardLayout),
      // Default to male voice for installs without the setting (backward compat)
      phonemeVoiceGender: s.phonemeVoiceGender ?? 'male',
      hasSeenOnboarding: s.hasSeenOnboarding ?? false,
      isInitialized: true,
    });
  },

  setLang: async (lang) => {
    await updateSettings({ targetLang: lang });
    // Reset language-specific UI state alongside the lang switch:
    //   - activeStoryId: stories are language-tied (HSK is zh-only), so an
    //     open Chinese story would keep rendering after switching to English.
    //     Drop it so the Stories tab returns to the level selector for the
    //     new lang. Bug #20 from QC audit.
    //   - catalogReturnContext: stale wordId reference would point at a
    //     word that doesn't exist in the new lang's catalog.
    set({
      targetLang: lang,
      activeStoryId: null,
      catalogReturnContext: null,
    });
  },

  setTab: (tab) => set({ activeTab: tab }),

  toggleSound: async () => {
    const next = !get().soundEnabled;
    await updateSettings({ soundEnabled: next });
    set({ soundEnabled: next });
  },

  bumpReviewCount: async () => {
    const today = new Date().toISOString().slice(0, 10);
    const settings = await getSettings();
    const prevDate = settings.lastStudyDate;

    let newStreak = settings.streak;
    if (prevDate !== today) {
      // First review of today
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().slice(0, 10);
      newStreak = prevDate === yStr ? settings.streak + 1 : 1;
    }

    const next = settings.totalReviewsToday + 1;
    await updateSettings({
      totalReviewsToday: next,
      lastStudyDate: today,
      streak: newStreak,
    });
    set({ totalReviewsToday: next, streak: newStreak });
  },

  setDailyGoal: async (goal) => {
    await updateSettings({ dailyGoal: goal });
    set({ dailyGoal: goal });
  },

  setCardLayout: async (layout) => {
    // Sanitize before persisting — belt-and-suspenders in case the caller
    // hands us a partial layout from the editor's draft state.
    const clean = sanitizeCardLayout(layout);
    await updateSettings({ cardLayout: clean });
    set({ cardLayout: clean });
  },

  resetCardLayout: async () => {
    await updateSettings({ cardLayout: DEFAULT_CARD_LAYOUT });
    set({ cardLayout: DEFAULT_CARD_LAYOUT });
  },

  setPhonemeVoiceGender: async (gender) => {
    await updateSettings({ phonemeVoiceGender: gender });
    set({ phonemeVoiceGender: gender });
  },

  openStory: (storyId) => {
    set({ activeStoryId: storyId, activeTab: 'stories' });
  },

  closeStory: () => {
    set({ activeStoryId: null });
  },

  navigateToWordFromStory: (storyId, wordId) => {
    // Stash where we came from so Flashcards can render "← Back to story"
    set({
      storyReturnContext: { storyId, wordId },
      activeTab: 'flashcards',
    });
  },

  navigateToWord: (wordId) => {
    // Generic navigation without return context. The Flashcards tab's
    // existing pendingWordId effect will pick up this id and surface that
    // word to the front of the queue.
    set({
      storyReturnContext: { storyId: '', wordId },
      activeTab: 'flashcards',
    });
  },

  navigateToWordFromCatalog: (tierId, wordId) => {
    // From Dashboard's WordCatalog → Flashcards. Stash tierId so the
    // back button lands the user on Dashboard (where the catalog lives).
    // Also reuses the same `storyReturnContext.wordId` mechanism so the
    // Flashcards effect surfaces the clicked word at the front of the
    // queue without needing a separate code path.
    set({
      catalogReturnContext: { tierId, wordId },
      storyReturnContext: { storyId: '', wordId },
      activeTab: 'flashcards',
    });
  },

  clearStoryReturnContext: () => {
    set({ storyReturnContext: null });
  },

  clearCatalogReturnContext: () => {
    set({ catalogReturnContext: null });
  },

  reloadFromDb: async () => {
    // Pull fresh values from Dexie. After db.settings.clear() (e.g. delete
    // account / force download / sign-out + clear), getSettings() returns
    // the defaults — we copy those into Zustand so the UI immediately
    // reflects the reset (streak 0, reviews 0, goal 10, etc.) instead of
    // showing the stale values that were in memory before the wipe.
    const s = await getSettings();
    set({
      targetLang: s.targetLang,
      soundEnabled: s.soundEnabled,
      streak: s.streak,
      totalReviewsToday: s.totalReviewsToday,
      dailyGoal: s.dailyGoal,
      cardLayout: sanitizeCardLayout(s.cardLayout),
      phonemeVoiceGender: s.phonemeVoiceGender ?? 'male',
      hasSeenOnboarding: s.hasSeenOnboarding ?? false,
    });
  },

  dismissOnboarding: async () => {
    await updateSettings({ hasSeenOnboarding: true });
    set({ hasSeenOnboarding: true });
  },
}));
