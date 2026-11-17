import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createSafeMMKV } from '@/services/mmkv';
import { MAX_RECENT_TRACKINGS, mergeRecentTrackings } from '@/utils/recentTrackings';

interface TrackedPair {
  id: string;
  routeId: string;
  routeShortName: string;
  stopId: string;
  stopCode?: string;
  stopName: string;
  label: string;
  thresholdMinutes: number;
  enabled: boolean;
  createdAt: number;
}

interface TrackingState {
  trackedPairs: TrackedPair[];
  /**
   * Persisted history of tracked targets (newest first). Kept after tracking
   * stops so Favorites and the header can offer a quick "track again" toggle.
   */
  recentPairs: TrackedPair[];
  addTrackedPair: (pair: Omit<TrackedPair, 'id' | 'createdAt'>) => void;
  removeTrackedPair: (id: string) => void;
  updateTrackedPair: (id: string, updates: Partial<TrackedPair>) => void;
  toggleTracking: (id: string) => void;
  loadFromStorage: () => void;
}

const storage = createSafeMMKV({ id: 'tracking' });

const mmkvStorage = {
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    storage.set(name, value);
  },
  removeItem: (name: string) => {
    storage.remove(name);
  },
};

export const useTrackingStore = create<TrackingState>()(
  persist(
    (set, get) => ({
      trackedPairs: [],
      recentPairs: [],
      // One tracking at a time: adding a new pair replaces any existing one.
      addTrackedPair: (pair) =>
        set((state) => {
          const createdAt = Date.now();
          const tracked: TrackedPair = {
            ...pair,
            id: `${pair.routeId}-${pair.stopId}-${createdAt}`,
            createdAt,
          };
          return {
            trackedPairs: [tracked],
            recentPairs: mergeRecentTrackings(state.recentPairs, tracked),
          };
        }),
      removeTrackedPair: (id) =>
        set((state) => ({
          trackedPairs: state.trackedPairs.filter((p) => p.id !== id),
        })),
      updateTrackedPair: (id, updates) =>
        set((state) => ({
          trackedPairs: state.trackedPairs.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      toggleTracking: (id) =>
        set((state) => ({
          trackedPairs: state.trackedPairs.map((p) =>
            p.id === id ? { ...p, enabled: !p.enabled } : p
          ),
        })),
      loadFromStorage: () => {
        // Seed the history from a tracked pair persisted before `recentPairs`
        // existed, so the new Favorites tab is not empty after an upgrade.
        const { trackedPairs, recentPairs } = get();
        if (recentPairs.length === 0 && trackedPairs.length > 0) {
          set({ recentPairs: trackedPairs.slice(0, MAX_RECENT_TRACKINGS) });
        }
      },
    }),
    {
      name: 'tracking-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);