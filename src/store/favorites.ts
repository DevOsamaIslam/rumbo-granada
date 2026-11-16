import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createSafeMMKV } from '@/services/mmkv';

interface FavoriteBus {
  routeId: string;
  routeShortName: string;
  routeLongName: string;
  routeColor: string;
  routeTextColor: string;
  label?: string;
}

interface FavoriteStop {
  stopId: string;
  stopName: string;
  label: string;
  lat: number;
  lon: number;
}

interface Reminder {
  id: string;
  stopId: string;
  stopName: string;
  label?: string;
  minutes?: number;
  createdAt: number;
}

interface FavoritesState {
  favoriteBuses: FavoriteBus[];
  favoriteStops: FavoriteStop[];
  reminders: Reminder[];
  addFavoriteBus: (bus: FavoriteBus) => void;
  removeFavoriteBus: (routeId: string) => void;
  updateBusLabel: (routeId: string, label: string) => void;
  addFavoriteStop: (stop: FavoriteStop) => void;
  removeFavoriteStop: (stopId: string) => void;
  updateStopLabel: (stopId: string, label: string) => void;
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt'>) => void;
  removeReminder: (reminderId: string) => void;
  clearOldReminders: () => void;
  loadFromStorage: () => void;
}

const storage = createSafeMMKV({ id: 'favorites' });

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

function keepLatestReminders(state: FavoritesState) {
  const sorted = [...state.reminders].sort((a, b) => b.createdAt - a.createdAt);
  return { reminders: sorted.slice(0, 3) };
}

function initialState() {
  return {
    favoriteBuses: [],
    favoriteStops: [],
    reminders: [],
  };
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      ...initialState(),

      addFavoriteBus: (bus: FavoriteBus) =>
        set((state) => ({
          favoriteBuses: state.favoriteBuses.some((b) => b.routeId === bus.routeId)
            ? state.favoriteBuses
            : [...state.favoriteBuses, bus],
        })),

      removeFavoriteBus: (routeId: string) =>
        set((state) => ({
          favoriteBuses: state.favoriteBuses.filter((b) => b.routeId !== routeId),
        })),

      updateBusLabel: (routeId: string, label: string) =>
        set((state) => ({
          favoriteBuses: state.favoriteBuses.map((b) =>
            b.routeId === routeId ? { ...b, label } : b
          ),
        })),

      addFavoriteStop: (stop: FavoriteStop) =>
        set((state) => ({
          favoriteStops: state.favoriteStops.some((s) => s.stopId === stop.stopId)
            ? state.favoriteStops
            : [...state.favoriteStops, stop],
        })),

      removeFavoriteStop: (stopId: string) =>
        set((state) => ({
          favoriteStops: state.favoriteStops.filter((s) => s.stopId !== stopId),
        })),

      updateStopLabel: (stopId: string, label: string) =>
        set((state) => ({
          favoriteStops: state.favoriteStops.map((s) =>
            s.stopId === stopId ? { ...s, label } : s
          ),
        })),

      addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt'>) =>
        set((state) => {
          const newReminder: Reminder = {
            id: `${reminder.stopId}-${Date.now()}`,
            stopId: reminder.stopId,
            stopName: reminder.stopName,
            label: reminder.label,
            minutes: reminder.minutes,
            createdAt: Date.now(),
          };
          const updated = [...state.reminders, newReminder];
          return keepLatestReminders({ ...state, reminders: updated });
        }),

      removeReminder: (reminderId: string) =>
        set((state) => ({
          reminders: state.reminders.filter((r) => r.id !== reminderId),
        })),

      clearOldReminders: () =>
        set(() => keepLatestReminders({ ...get(), reminders: [] })),

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
