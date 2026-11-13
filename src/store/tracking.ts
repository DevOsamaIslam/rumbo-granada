import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';

interface TrackedPair {
  id: string;
  routeId: string;
  routeShortName: string;
  stopId: string;
  stopName: string;
  label: string;
  thresholdMinutes: number;
  enabled: boolean;
  createdAt: number;
}

interface TrackingState {
  trackedPairs: TrackedPair[];
  addTrackedPair: (pair: Omit<TrackedPair, 'id' | 'createdAt'>) => void;
  removeTrackedPair: (id: string) => void;
  updateTrackedPair: (id: string, updates: Partial<TrackedPair>) => void;
  toggleTracking: (id: string) => void;
  loadFromStorage: () => void;
}

const storage = createMMKV({ id: 'tracking' });

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
    (set) => ({
      trackedPairs: [],
      addTrackedPair: (pair) =>
        set((state) => ({
          trackedPairs: [
            ...state.trackedPairs,
            { ...pair, id: `${pair.routeId}-${pair.stopId}-${Date.now()}`, createdAt: Date.now() },
          ],
        })),
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
        // Persist handles loading automatically
      },
    }),
    {
      name: 'tracking-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);