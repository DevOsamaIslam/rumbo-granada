// Material Design 3 color scheme for React Native Paper.
//
// Two full palettes are exported: `LIGHT_COLORS` (the original app look) and
// `DARK_COLORS` (the same tokens tuned for the dark theme). Components read the
// active palette through `useAppColors()` so a theme switch re-renders them.

export interface AppColors {
  primary: string;
  primaryContainer: string;
  onPrimary: string;
  onPrimaryContainer: string;

  secondary: string;
  secondaryContainer: string;
  onSecondary: string;
  onSecondaryContainer: string;

  tertiary: string;
  tertiaryContainer: string;
  onTertiary: string;
  onTertiaryContainer: string;

  error: string;
  errorContainer: string;
  onError: string;
  onErrorContainer: string;

  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;

  outline: string;
  outlineVariant: string;

  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;

  shadow: string;
  scrim: string;

  // Custom app colors
  busColors: {
    day: string;
    night: string;
    express: string;
  };

  stopColors: {
    regular: string;
    favorite: string;
    transfer: string;
  };
}

export const LIGHT_COLORS: AppColors = {
  // Primary
  primary: '#A00020',
  primaryContainer: '#FFE0A8',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#4A0010',

  // Secondary
  secondary: '#FFE0A8',
  secondaryContainer: '#F2C982',
  onSecondary: '#4A0010',
  onSecondaryContainer: '#4A0010',

  // Tertiary
  tertiary: '#760018',
  tertiaryContainer: '#F5CDD3',
  onTertiary: '#FFFFFF',
  onTertiaryContainer: '#4A0010',

  // Error
  error: '#BA1A1A',
  errorContainer: '#FFDAD6',
  onError: '#FFFFFF',
  onErrorContainer: '#410002',

  // Background
  background: '#FFFBF5',
  onBackground: '#28191B',
  surface: '#FFFBF5',
  onSurface: '#28191B',
  surfaceVariant: '#F2E5D5',
  onSurfaceVariant: '#51443F',

  // Outline
  outline: '#88766D',
  outlineVariant: '#D8C5B9',

  // Inverse
  inverseSurface: '#392D2C',
  inverseOnSurface: '#F8EEE7',
  inversePrimary: '#FFB3BE',

  // Shadow
  shadow: '#000000',
  scrim: '#000000',

  busColors: {
    day: '#A00020',
    night: '#760018',
    express: '#D46A36',
  },

  stopColors: {
    regular: '#88766D',
    favorite: '#D99B27',
    transfer: '#527A55',
  },
};

export const DARK_COLORS: AppColors = {
  primary: '#FFB3BE',
  primaryContainer: '#760018',
  onPrimary: '#4A0010',
  onPrimaryContainer: '#FFE0A8',

  secondary: '#FFE0A8',
  secondaryContainer: '#75552B',
  onSecondary: '#3F2800',
  onSecondaryContainer: '#FFE0A8',

  tertiary: '#F5A0AC',
  tertiaryContainer: '#760018',
  onTertiary: '#4A0010',
  onTertiaryContainer: '#FFD9DE',

  error: '#FFB4AB',
  errorContainer: '#93000A',
  onError: '#690005',
  onErrorContainer: '#FFDAD6',

  background: '#1C1113',
  onBackground: '#F3DFDC',
  surface: '#1C1113',
  onSurface: '#F3DFDC',
  surfaceVariant: '#514043',
  onSurfaceVariant: '#D8C2C3',

  outline: '#A58C8E',
  outlineVariant: '#514043',

  inverseSurface: '#F3DFDC',
  inverseOnSurface: '#392D2C',
  inversePrimary: '#A00020',

  shadow: '#000000',
  scrim: '#000000',

  busColors: {
    day: '#FFB3BE',
    night: '#F5A0AC',
    express: '#FFB59A',
  },

  stopColors: {
    regular: '#D8C2C3',
    favorite: '#FFD180',
    transfer: '#A5D6A7',
  },
};

/**
 * Backwards-compatible alias for the light palette.
 *
 * Prefer `useAppColors()` inside components: it returns the palette matching the
 * active light/dark theme. `COLORS` is only for contexts without a theme (e.g.
 * brand constants that intentionally stay the same in both modes).
 */
export const COLORS = LIGHT_COLORS;

export type Colors = AppColors;
