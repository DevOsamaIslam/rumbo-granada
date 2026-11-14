import { Stack } from 'expo-router';
import { Providers } from '@/providers';
import { Storage } from '@/services/storage';
import { createSafeMMKV } from '@/services/mmkv';
import { useFavoritesStore } from '@/store/favorites';
import { useTrackingStore } from '@/store/tracking';
import { useSettingsStore } from '@/store/settings';
import { useEffect } from 'react';

// Initialize MMKV storage
const storage = createSafeMMKV({ id: 'rumbo-granada-general' });
Storage.setInstance(storage as never);

export default function RootLayout() {
  // Initialize stores on app start
  useEffect(() => {
    useFavoritesStore.getState().loadFromStorage();
    useTrackingStore.getState().loadFromStorage();
    useSettingsStore.getState().loadFromStorage();
  }, []);

  return (
    <Providers>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ presentation: 'card' }} />
        <Stack.Screen name="line/[id]" />
        <Stack.Screen name="stop/[id]" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </Providers>
  );
}