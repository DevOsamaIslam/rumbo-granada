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
import { applyLayoutDirection } from '@/utils/rtl';
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
    // Set i18n language from the persisted preference. The store's default is
    // the device language (Spanish device → 'es', otherwise 'en'), so a user
    // who never chose a language gets the device language automatically.
    const storedLanguage = useSettingsStore.getState().language;
    i18n.changeLanguage(storedLanguage);
    // Make sure the native layout direction matches the stored language. If it
    // does not, the forced direction is applied on the next cold start.
    applyLayoutDirection(storedLanguage);
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
