import { Stack } from 'expo-router';
import { View } from 'react-native';
import { Providers } from '@/providers';
import { AppHeader } from '@/components/common';
import { Storage } from '@/services/storage';
import { createSafeMMKV } from '@/services/mmkv';
import { useFavoritesStore } from '@/store/favorites';
import { useTrackingStore } from '@/store/tracking';
import { useSettingsStore } from '@/store/settings';
import i18n from '@/i18n';
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
    // Set i18n language from stored preference
    const storedLanguage = useSettingsStore.getState().language;
    i18n.changeLanguage(storedLanguage);
  }, []);

  return (
    <Providers>
      <View style={{ flex: 1 }}>
        <AppHeader />
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ presentation: "card" }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </View>
    </Providers>
  );
}
