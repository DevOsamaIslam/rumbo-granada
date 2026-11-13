# 04 — State Management

## Overview

| Layer | Tool | Purpose |
|-------|------|---------|
| Server State | `@tanstack/react-query` | GTFS queries, live API, caching |
| Client State | `zustand` | Favorites, tracking, settings |
| Persistence | `react-native-mmkv` | Fast, synchronous, encrypted storage |

## React Query (Server State)

### QueryClient Config

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
    },
  },
});
```

### Key Queries

| Query Key | Hook | Source | Stale Time |
|-----------|------|--------|------------|
| `['lines']` | `useLines()` | GTFS | 1 hour (static) |
| `['line', routeId]` | `useLine(routeId)` | GTFS | 1 hour |
| `['stops', routeId]` | `useStopsForLine(routeId)` | GTFS | 1 hour |
| `['stop', stopId]` | `useStop(stopId)` | GTFS | 1 hour |
| `['arrivals', stopNumber]` | `useStopArrivals(stopNumber)` | Live API | 30s |
| `['lineStops', lineCode]` | `useLineStops(lineCode)` | Live API | 15s |
### Query Hooks Pattern

```tsx
// src/hooks/useLines.ts
import { useQuery } from '@tanstack/react-query';
import { gtfsService } from '@/services/gtfs';

export function useLines() {
  return useQuery({
    queryKey: ['lines'],
    queryFn: () => gtfsService.getRoutes(),
    staleTime: 60 * 60_000, // 1 hour
  });
}

export function useLine(routeId: string) {
  return useQuery({
    queryKey: ['line', routeId],
    queryFn: () => gtfsService.getRoute(routeId),
    enabled: !!routeId,
    staleTime: 60 * 60_000,
  });
}
```

## Zustand (Client State)

### Favorites Store (`src/store/favorites.ts`)

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '@/services/storage';
import type { FavoriteBus, FavoriteStop } from '@/types/favorites';

interface FavoritesState {
  favoriteBusIds: string[];
  favoriteStops: FavoriteStop[];

  addFavoriteBus: (routeId: string) => void;
  removeFavoriteBus: (routeId: string) => void;
  isFavoriteBus: (routeId: string) => boolean;

  addFavoriteStop: (stopId: string, label?: string) => void;
  removeFavoriteStop: (stopId: string) => void;
  updateStopLabel: (stopId: string, label: string) => void;
  getFavoriteStop: (stopId: string) => FavoriteStop | undefined;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteBusIds: [],
      favoriteStops: [],

      addFavoriteBus: (routeId) =>
        set((state) => ({
          favoriteBusIds: state.favoriteBusIds.includes(routeId)
            ? state.favoriteBusIds
            : [...state.favoriteBusIds, routeId],
        })),

      removeFavoriteBus: (routeId) =>
        set((state) => ({
          favoriteBusIds: state.favoriteBusIds.filter((id) => id !== routeId),
        })),

      isFavoriteBus: (routeId) => get().favoriteBusIds.includes(routeId),

      addFavoriteStop: (stopId, label) =>
        set((state) => {
          if (state.favoriteStops.some((s) => s.stopId === stopId)) return state;
          return {
            favoriteStops: [
              ...state.favoriteStops,
              { stopId, label: label ?? '', createdAt: Date.now() },
            ],
          };
        }),

      removeFavoriteStop: (stopId) =>
        set((state) => ({
          favoriteStops: state.favoriteStops.filter((s) => s.stopId !== stopId),
        })),

      updateStopLabel: (stopId, label) =>
        set((state) => ({
          favoriteStops: state.favoriteStops.map((s) =>
            s.stopId === stopId ? { ...s, label } : s
          ),
        })),

      getFavoriteStop: (stopId) =>
        get().favoriteStops.find((s) => s.stopId === stopId),
    }),
    {
      name: 'favorites',
      storage: createJSONStorage(() => mmkvStorage),
      version: 1,
    }
  )
);
```
### Tracking Store (`src/store/tracking.ts`)

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '@/services/storage';
import type { TrackedPair } from '@/types/tracking';

interface TrackingState {
  trackedPairs: TrackedPair[];

  addTracking: (pair: TrackedPair) => void;
  removeTracking: (busId: string, stopId: string) => void;
  updateTracking: (busId: string, stopId: string, updates: Partial<TrackedPair>) => void;
  getTracking: (busId: string, stopId: string) => TrackedPair | undefined;
  clearAll: () => void;
}

export const useTrackingStore = create<TrackingState>()(
  persist(
    (set, get) => ({
      trackedPairs: [],

      addTracking: (pair) =>
        set((state) => {
          if (state.trackedPairs.some((p) => p.busId === pair.busId && p.stopId === pair.stopId)) {
            return state;
          }
          return { trackedPairs: [...state.trackedPairs, pair] };
        }),

      removeTracking: (busId, stopId) =>
        set((state) => ({
          trackedPairs: state.trackedPairs.filter(
            (p) => !(p.busId === busId && p.stopId === stopId)
          ),
        })),

      updateTracking: (busId, stopId, updates) =>
        set((state) => ({
          trackedPairs: state.trackedPairs.map((p) =>
            p.busId === busId && p.stopId === stopId ? { ...p, ...updates } : p
          ),
        })),

      getTracking: (busId, stopId) =>
        get().trackedPairs.find((p) => p.busId === busId && p.stopId === stopId),

      clearAll: () => set({ trackedPairs: [] }),
    }),
    {
      name: 'tracking',
      storage: createJSONStorage(() => mmkvStorage),
      version: 1,
    }
  )
);
```

### Settings Store (`src/store/settings.ts`)

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '@/services/storage';

interface SettingsState {
  arrivalThresholdMeters: number;
  arrivalThresholdStops: number;
  backgroundTrackingEnabled: boolean;
  pushNotificationsEnabled: boolean;
  theme: 'light' | 'dark' | 'system';

  setArrivalThresholdMeters: (meters: number) => void;
  setArrivalThresholdStops: (stops: number) => void;
  setBackgroundTracking: (enabled: boolean) => void;
  setPushNotifications: (enabled: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  reset: () => void;
}

const DEFAULT_SETTINGS = {
  arrivalThresholdMeters: 200,
  arrivalThresholdStops: 2,
  backgroundTrackingEnabled: true,
  pushNotificationsEnabled: false,
  theme: 'system' as const,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setArrivalThresholdMeters: (meters) => set({ arrivalThresholdMeters: meters }),
      setArrivalThresholdStops: (stops) => set({ arrivalThresholdStops: stops }),
      setBackgroundTracking: (enabled) => set({ backgroundTrackingEnabled: enabled }),
      setPushNotifications: (enabled) => set({ pushNotificationsEnabled: enabled }),
      setTheme: (theme) => set({ theme }),
      reset: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'settings',
      storage: createJSONStorage(() => mmkvStorage),
      version: 1,
    }
  )
);
```

## MMKV Storage Wrapper (`src/services/storage.ts`)

```ts
import { MMKV } from 'react-native-mmkv';
import { Storage } from 'zustand/middleware';

const mmkv = new MMKV({
  id: 'granabus-storage',
  encryptionKey: 'granabus-secure-key',
});

export const mmkvStorage: Storage = {
  getItem: (name) => {
    const value = mmkv.getString(name);
    return value ?? null;
  },
  setItem: (name, value) => {
    mmkv.set(name, value);
  },
  removeItem: (name) => {
    mmkv.delete(name);
  },
};

export function clearAllStorage() {
  mmkv.clearAll();
}
```

## Store Composition

```tsx
// src/store/index.ts
export { useFavoritesStore } from './favorites';
export { useTrackingStore } from './tracking';
export { useSettingsStore } from './settings';

export function useStores() {
  const favorites = useFavoritesStore();
  const tracking = useTrackingStore();
  const settings = useSettingsStore();
  return { favorites, tracking, settings };
}
```

## Migration Strategy

When store schema changes:

1. Increment `version` in `persist` config
2. Add `migrate` function:

```ts
persist(
  (set, get) => ({ ... }),
  {
    name: 'favorites',
    storage: createJSONStorage(() => mmkvStorage),
    version: 2,
    migrate: (persistedState, version) => {
      if (version === 1) {
        return { ...persistedState, newField: 'default' };
      }
      return persistedState;
    },
  }
)
```
| `['busPosition', busId]` | `useBusPosition(busId)` | Live API | 15s |