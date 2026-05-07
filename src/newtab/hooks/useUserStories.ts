import { useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import {
  deleteUserStory as deleteUserStoryService,
  toggleFavorite as toggleFavoriteService,
} from '../../services/storyGenService';
import type { HskLevel, UserStory } from '../../types';

/**
 * Live-queryable list of user-generated stories.
 *
 * Why useLiveQuery: Dexie's reactive query auto-rerenders when the table
 * changes — so when StoryGenModal saves a new story, the list refreshes
 * without us needing to manually trigger refetch from the modal callback.
 *
 * Filter by HSK level when provided. Sort: newest first, with favorites
 * pinned to the top regardless of date (so favorites don't get buried as
 * the user generates more).
 */
export function useUserStories(hskLevel?: HskLevel): UserStory[] {
  const stories = useLiveQuery(
    async () => {
      const all = await db.userStories.orderBy('createdAt').reverse().toArray();
      const filtered = hskLevel ? all.filter((s) => s.hskLevel === hskLevel) : all;
      // Sort favorites first, then newest. Stable since both sub-orders are
      // already locked in by the toArray() above.
      return filtered.sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
        return 0;
      });
    },
    [hskLevel],
    [],  // initial value while query loads
  );

  return stories ?? [];
}

/**
 * Imperative actions for user stories. Returned as a callback bundle so
 * components don't need to import service functions directly.
 */
export function useUserStoryActions() {
  const deleteStory = useCallback(async (id: string, force = false) => {
    return deleteUserStoryService(id, force);
  }, []);

  const toggleFav = useCallback(async (id: string) => {
    return toggleFavoriteService(id);
  }, []);

  return { deleteStory, toggleFav };
}

/**
 * Total count of user stories across all HSK levels — used by the empty
 * state hint ("Bạn chưa có truyện AI nào, bấm + Tạo truyện để bắt đầu").
 *
 * Uses useLiveQuery so the count auto-updates when stories are added/deleted
 * elsewhere — the manual hook subscriptions Dexie offers have awkward types
 * that vary by event, and useLiveQuery is what the rest of the codebase uses.
 */
export function useUserStoriesCount(): number {
  const count = useLiveQuery(() => db.userStories.count(), [], 0);
  return count ?? 0;
}
