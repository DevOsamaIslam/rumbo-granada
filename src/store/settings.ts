import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createSafeMMKV } from '@/services/mmkv';

interface SettingsState {
  notificationThresholdMinutes: number;
  mapStyle: 'standard' | 'dark';
  autoFollowUser: boolean;
  showBusLabels: boolean;
  language: 'es' | 'en';
  setNotificationThreshold: (minutes: number) => void;
  setMapStyle: (style: 'standard' | 'dark') => void;
  setAutoFollowUser: (enabled: boolean) => void;
  setShowBusLabels: (enabled: boolean) => void;
  setLanguage: (lang: 'es' | 'en') => void;
  loadFromStorage: () => void;
}

const storage = createSafeMMKV({ id: 'settings' });

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

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      notificationThresholdMinutes: 5,
      mapStyle: 'standard',
      autoFollowUser: true,
      showBusLabels: true,
      language: 'es',
      setNotificationThreshold: (minutes) => set({ notificationThresholdMinutes: minutes }),
      setMapStyle: (style) => set({ mapStyle: style }),
      setAutoFollowUser: (enabled) => set({ autoFollowUser: enabled }),
      setShowBusLabels: (enabled) => set({ showBusLabels: enabled }),
      setLanguage: (lang) => set({ language: lang }),
      loadFromStorage: () => {
        // Persist handles loading automatically
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);