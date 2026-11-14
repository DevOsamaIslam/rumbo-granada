import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider, MD3Theme, DefaultTheme } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { createSafeMMKV } from '@/services/mmkv';
import { Storage } from '@/services/storage';
import { COLORS } from '@/constants/colors';

// Create MMKV instance for general storage
const storage = createSafeMMKV({ id: 'rumbo-granada-general' });
Storage.setInstance(storage as never);

// Create theme for Paper (Material Design 3)
const theme: MD3Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    primaryContainer: COLORS.primaryContainer,
    onPrimary: COLORS.onPrimary,
    onPrimaryContainer: COLORS.onPrimaryContainer,
    secondary: COLORS.secondary,
    secondaryContainer: COLORS.secondaryContainer,
    onSecondary: COLORS.onSecondary,
    onSecondaryContainer: COLORS.onSecondaryContainer,
    tertiary: COLORS.tertiary,
    tertiaryContainer: COLORS.tertiaryContainer,
    onTertiary: COLORS.onTertiary,
    onTertiaryContainer: COLORS.onTertiaryContainer,
    error: COLORS.error,
    errorContainer: COLORS.errorContainer,
    onError: COLORS.onError,
    onErrorContainer: COLORS.onErrorContainer,
    background: COLORS.background,
    onBackground: COLORS.onBackground,
    surface: COLORS.surface,
    onSurface: COLORS.onSurface,
    surfaceVariant: COLORS.surfaceVariant,
    onSurfaceVariant: COLORS.onSurfaceVariant,
    outline: COLORS.outline,
    outlineVariant: COLORS.outlineVariant,
    inverseSurface: COLORS.inverseSurface,
    inverseOnSurface: COLORS.inverseOnSurface,
    inversePrimary: COLORS.inversePrimary,
    shadow: COLORS.shadow,
    scrim: COLORS.scrim,
    // Required MD3 colors
    surfaceDisabled: COLORS.surfaceVariant,
    onSurfaceDisabled: COLORS.onSurfaceVariant,
    backdrop: COLORS.background,
    elevation: {
      level0: 'transparent',
      level1: COLORS.surface,
      level2: COLORS.surfaceVariant,
      level3: COLORS.surfaceVariant,
      level4: COLORS.surfaceVariant,
      level5: COLORS.surfaceVariant,
    },
  },
  dark: true,
  roundness: 8,
  animation: { scale: 1.0 },
};

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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={theme}>
          {children}
        </PaperProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}