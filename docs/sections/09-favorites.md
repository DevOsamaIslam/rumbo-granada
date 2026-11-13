# 09 — Favorites System

## Types (`src/types/favorites.ts`)

```ts
export interface FavoriteBus {
  routeId: string;
  addedAt: number;
}

export interface FavoriteStop {
  stopId: string;
  label: string;        // Custom label: "Home", "Work", "Gym"
  stopName: string;     // Original stop name from GTFS
  stopCode: string;     // For live API
  addedAt: number;
}

export type FavoriteItem = 
  | { type: 'bus'; routeId: string }
  | { type: 'stop'; stopId: string };
```

## Store (`src/store/favorites.ts`)

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '@/services/storage';
import type { FavoriteBus, FavoriteStop } from '@/types/favorites';

interface FavoritesState {
  favoriteBuses: FavoriteBus[];
  favoriteStops: FavoriteStop[];

  // Buses
  addFavoriteBus: (routeId: string) => void;
  removeFavoriteBus: (routeId: string) => void;
  isFavoriteBus: (routeId: string) => boolean;

  // Stops
  addFavoriteStop: (stopId: string, label: string, stopName: string, stopCode: string) => void;
  removeFavoriteStop: (stopId: string) => void;
  updateStopLabel: (stopId: string, label: string) => void;
  getFavoriteStop: (stopId: string) => FavoriteStop | undefined;
  getFavoriteStopsWithArrivals: () => Promise<FavoriteStopWithArrival[]>;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteBuses: [],
      favoriteStops: [],

      addFavoriteBus: (routeId) => set(state => ({
        favoriteBuses: state.favoriteBuses.some(b => b.routeId === routeId)
          ? state.favoriteBuses
          : [...state.favoriteBuses, { routeId, addedAt: Date.now() }],
      })),

      removeFavoriteBus: (routeId) => set(state => ({
        favoriteBuses: state.favoriteBuses.filter(b => b.routeId !== routeId),
      })),

      isFavoriteBus: (routeId) => get().favoriteBuses.some(b => b.routeId === routeId),

      addFavoriteStop: (stopId, label, stopName, stopCode) => set(state => {
        if (state.favoriteStops.some(s => s.stopId === stopId)) return state;
        return {
          favoriteStops: [...state.favoriteStops, { stopId, label, stopName, stopCode, addedAt: Date.now() }],
        };
      }),

      removeFavoriteStop: (stopId) => set(state => ({
        favoriteStops: state.favoriteStops.filter(s => s.stopId !== stopId),
      })),

      updateStopLabel: (stopId, label) => set(state => ({
        favoriteStops: state.favoriteStops.map(s => s.stopId === stopId ? { ...s, label } : s),
      })),

      getFavoriteStop: (stopId) => get().favoriteStops.find(s => s.stopId === stopId),

      getFavoriteStopsWithArrivals: async () => {
        const { liveApiClient } = await import('@/services/liveApi');
        const stops = get().favoriteStops;
        const results = await Promise.all(
          stops.map(async stop => {
            const arrivals = await liveApiClient.getStopArrivals(stop.stopCode);
            return { ...stop, nextArrival: arrivals[0] ?? null };
          })
        );
        return results;
      },
    }),
    { name: 'favorites', storage: createJSONStorage(() => mmkvStorage), version: 1 }
  )
);
```

## UI Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `FavoriteBusList` | `src/components/favorites/` | List favorite buses with quick actions |
| `FavoriteStopList` | `src/components/favorites/` | List labeled stops with next arrival |
| `AddStopLabelModal` | `src/components/favorites/` | Modal to add/edit stop label |

## Favorites Tab Screen (`app/(tabs)/favorites.tsx`)

```tsx
export default function FavoritesScreen() {
  const { favoriteBuses, favoriteStops, removeFavoriteBus, removeFavoriteStop } = useFavoritesStore();
  const { data: stopsWithArrivals } = useQuery({
    queryKey: ['favorites-stops-arrivals'],
    queryFn: () => useFavoritesStore.getState().getFavoriteStopsWithArrivals(),
    refetchInterval: 30_000,
  });

  return (
    <ScrollView>
      {favoriteBuses.length > 0 && (
        <Section title="Favorite Buses">
          <FavoriteBusList buses={favoriteBuses} onRemove={removeFavoriteBus} />
        </Section>
      )}
      {favoriteStops.length > 0 && (
        <Section title="Favorite Stops">
          <FavoriteStopList 
            stops={stopsWithArrivals ?? favoriteStops} 
            onRemove={removeFavoriteStop}
            onEditLabel={updateStopLabel}
          />
        </Section>
      )}
      {(favoriteBuses.length === 0 && favoriteStops.length === 0) && (
        <EmptyState 
          icon="star-outline" 
          title="No favorites yet" 
          message="Tap the star on any line or stop to add it here"
        />
      )}
    </ScrollView>
  );
}
```