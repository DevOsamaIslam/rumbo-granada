import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createSafeMMKV } from '@/services/mmkv';
import { getDeviceLanguage } from '@/i18n';
import type { ThemePreference } from '@/constants/themes';

interface SettingsState {
  notificationThresholdMinutes: number;
  mapStyle: 'standard' | 'dark';
  autoFollowUser: boolean;
  showBusLabels: boolean;
  language: 'es' | 'en';
  /**
   * App appearance preference. Separate from `mapStyle`: this controls the UI
   * chrome theme, while `mapStyle` controls the map tiles.
   */
  theme: ThemePreference;
  setNotificationThreshold: (minutes: number) => void;
  setMapStyle: (style: 'standard' | 'dark') => void;
  setAutoFollowUser: (enabled: boolean) => void;
  setShowBusLabels: (enabled: boolean) => void;
  setLanguage: (lang: 'es' | 'en') => void;
  setTheme: (theme: ThemePreference) => void;
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
      // Default comes from the device (Spanish device → Spanish UI, otherwise
      // English); zustand-persist overwrites it when a stored choice exists.
      language: getDeviceLanguage(),
      // Follow the OS by default; the user can pin light or dark in Settings.
      theme: 'system',
      setNotificationThreshold: (minutes) => set({ notificationThresholdMinutes: minutes }),
      setMapStyle: (style) => set({ mapStyle: style }),
      setAutoFollowUser: (enabled) => set({ autoFollowUser: enabled }),
      setShowBusLabels: (enabled) => set({ showBusLabels: enabled }),
      setLanguage: (lang) => set({ language: lang }),
      setTheme: (theme) => set({ theme }),
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