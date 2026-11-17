import { useState } from 'react';
import { useColorScheme } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { createSafeMMKV } from '@/services/mmkv';
import { Storage } from '@/services/storage';
import { getAppTheme, resolveThemeScheme } from '@/constants/themes';
import { useSettingsStore } from '@/store/settings';

// Create MMKV instance for general storage
const storage = createSafeMMKV({ id: 'rumbo-granada-general' });
Storage.setInstance(storage as never);

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // App theme preference ("system" follows the OS). This is independent from the
  // map style toggle: the map keeps its own standard/dark tiles.
  const systemScheme = useColorScheme();
  const themePreference = useSettingsStore((state) => state.theme);
  const scheme = resolveThemeScheme(themePreference, systemScheme);
  const theme = getAppTheme(scheme);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={theme}>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          {children}
        </PaperProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

