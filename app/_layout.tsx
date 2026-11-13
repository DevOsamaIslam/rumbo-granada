import { Stack } from 'expo-router';
import { Providers } from '@/providers';
import { Storage } from '@/services/storage';
import { createMMKV } from 'react-native-mmkv';
import { useFavoritesStore } from '@/store/favorites';
import { useTrackingStore } from '@/store/tracking';
import { useSettingsStore } from '@/store/settings';
import { useEffect } from 'react';

// Initialize MMKV storage
const storage = createMMKV();
Storage.setInstance(storage);

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