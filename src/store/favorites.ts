import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';

interface FavoriteBus {
  routeId: string;
  routeShortName: string;
  routeLongName: string;
  routeColor: string;
  routeTextColor: string;
}

interface FavoriteStop {
  stopId: string;
  stopName: string;
  label: string;
  lat: number;
  lon: number;
}

interface FavoritesState {
  favoriteBuses: FavoriteBus[];
  favoriteStops: FavoriteStop[];
  addFavoriteBus: (bus: FavoriteBus) => void;
  removeFavoriteBus: (routeId: string) => void;
  addFavoriteStop: (stop: FavoriteStop) => void;
  removeFavoriteStop: (stopId: string) => void;
  updateStopLabel: (stopId: string, label: string) => void;
  loadFromStorage: () => void;
}

const storage = createMMKV({ id: 'favorites' });

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

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteBuses: [],
      favoriteStops: [],
      addFavoriteBus: (bus) =>
        set((state) => ({
          favoriteBuses: state.favoriteBuses.some((b) => b.routeId === bus.routeId)
            ? state.favoriteBuses
            : [...state.favoriteBuses, bus],
        })),
      removeFavoriteBus: (routeId) =>
        set((state) => ({
          favoriteBuses: state.favoriteBuses.filter((b) => b.routeId !== routeId),
        })),
      addFavoriteStop: (stop) =>
        set((state) => ({
          favoriteStops: state.favoriteStops.some((s) => s.stopId === stop.stopId)
            ? state.favoriteStops
            : [...state.favoriteStops, stop],
        })),
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
      loadFromStorage: () => {
        // Persist handles loading automatically
      },
    }),
    {
      name: 'favorites-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);