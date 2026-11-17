// React Native Paper (Material Design 3) themes for the app.
//
// The app theme is separate from the map style: these themes only affect the UI
// chrome (Paper components, headers, lists). Map tiles are chosen independently
// in Settings ("Estilo del mapa").
import { useMemo } from 'react';
import { MD3DarkTheme, MD3LightTheme, useTheme, type MD3Theme } from 'react-native-paper';
import { DARK_COLORS, LIGHT_COLORS, type AppColors } from './colors';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ThemeScheme = 'light' | 'dark';

const ROUNDNESS = 8;

function buildTheme(base: MD3Theme, palette: AppColors, dark: boolean): MD3Theme {
  return {
    ...base,
    dark,
    roundness: ROUNDNESS,
    animation: { scale: 1.0 },
    colors: {
      ...base.colors,
      primary: palette.primary,
      primaryContainer: palette.primaryContainer,
      onPrimary: palette.onPrimary,
      onPrimaryContainer: palette.onPrimaryContainer,
      secondary: palette.secondary,
      secondaryContainer: palette.secondaryContainer,
      onSecondary: palette.onSecondary,
      onSecondaryContainer: palette.onSecondaryContainer,
      tertiary: palette.tertiary,
      tertiaryContainer: palette.tertiaryContainer,
      onTertiary: palette.onTertiary,
      onTertiaryContainer: palette.onTertiaryContainer,
      error: palette.error,
      errorContainer: palette.errorContainer,
      onError: palette.onError,
      onErrorContainer: palette.onErrorContainer,
      background: palette.background,
      onBackground: palette.onBackground,
      surface: palette.surface,
      onSurface: palette.onSurface,
      surfaceVariant: palette.surfaceVariant,
      onSurfaceVariant: palette.onSurfaceVariant,
      outline: palette.outline,
      outlineVariant: palette.outlineVariant,
      inverseSurface: palette.inverseSurface,
      inverseOnSurface: palette.inverseOnSurface,
      inversePrimary: palette.inversePrimary,
      shadow: palette.shadow,
      scrim: palette.scrim,
      // Required MD3 colors
      surfaceDisabled: palette.surfaceVariant,
      onSurfaceDisabled: palette.onSurfaceVariant,
      backdrop: palette.background,
      elevation: {
        level0: 'transparent',
        level1: palette.surface,
        level2: palette.surfaceVariant,
        level3: palette.surfaceVariant,
        level4: palette.surfaceVariant,
        level5: palette.surfaceVariant,
      },
    },
  };
}

export const lightTheme: MD3Theme = buildTheme(MD3LightTheme, LIGHT_COLORS, false);
export const darkTheme: MD3Theme = buildTheme(MD3DarkTheme, DARK_COLORS, true);

/**
 * Resolves the user's preference plus the current OS color scheme to the scheme
 * that should actually be rendered. `'system'` follows the OS; anything else is
 * used as-is.
 */
export function resolveThemeScheme(
  preference: ThemePreference,
  systemScheme: ThemeScheme | null | undefined,
): ThemeScheme {
  if (preference === 'system') {
    return systemScheme === 'dark' ? 'dark' : 'light';
  }
  return preference;
}

/** The Paper theme for a resolved scheme. */
export function getAppTheme(scheme: ThemeScheme): MD3Theme {
  return scheme === 'dark' ? darkTheme : lightTheme;
}

/**
 * Colour tokens for the active theme.
 *
 * Reads Paper's theme (provided app-wide by `Providers`) so every consumer
 * re-renders when the theme flips between light and dark.
 */
export function useAppColors(): AppColors {
  const theme = useTheme();
  return theme.dark ? DARK_COLORS : LIGHT_COLORS;
}

/**
 * Builds (and memoises) a `StyleSheet` from the active palette.
 *
 * `factory` must be a stable, module-level function so the sheet is only
 * rebuilt when the palette actually changes.
 */
export function useThemedStyles<T>(factory: (colors: AppColors) => T): T {
  const colors = useAppColors();
  return useMemo(() => factory(colors), [factory, colors]);
}
