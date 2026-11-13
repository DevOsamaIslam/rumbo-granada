// Material Design 3 Color Scheme for React Native Paper
export const COLORS = {
  // Primary
  primary: '#6200EE',
  primaryContainer: '#EADDFF',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#21005D',

  // Secondary
  secondary: '#03DAC6',
  secondaryContainer: '#018786',
  onSecondary: '#000000',
  onSecondaryContainer: '#FFFFFF',

  // Tertiary
  tertiary: '#FF0266',
  tertiaryContainer: '#FFD1E1',
  onTertiary: '#FFFFFF',
  onTertiaryContainer: '#4E001D',

  // Error
  error: '#B00020',
  errorContainer: '#FCD8DF',
  onError: '#FFFFFF',
  onErrorContainer: '#410002',

  // Background
  background: '#FFFFFF',
  onBackground: '#1C1B1F',
  surface: '#FFFFFF',
  onSurface: '#1C1B1F',
  surfaceVariant: '#E7E0EC',
  onSurfaceVariant: '#49454F',

  // Outline
  outline: '#79747E',
  outlineVariant: '#CAC4D0',

  // Inverse
  inverseSurface: '#313033',
  inverseOnSurface: '#F4EFF4',
  inversePrimary: '#D0BCFF',

  // Shadow
  shadow: '#000000',
  scrim: '#000000',

  // Custom app colors
  busColors: {
    day: '#1976D2',
    night: '#7B1FA2',
    express: '#D32F2F',
  },

  stopColors: {
    regular: '#757575',
    favorite: '#FFD600',
    transfer: '#4CAF50',
  },

  // Dark theme variants
  dark: {
    primary: '#BB86FC',
    primaryContainer: '#3700B3',
    onPrimary: '#000000',
    onPrimaryContainer: '#EADDFF',
    secondary: '#03DAC6',
    secondaryContainer: '#018786',
    onSecondary: '#000000',
    onSecondaryContainer: '#FFFFFF',
    tertiary: '#FF0266',
    tertiaryContainer: '#FFD1E1',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#4E001D',
    error: '#CF6679',
    errorContainer: '#B1384E',
    onError: '#FFFFFF',
    onErrorContainer: '#FCD8DF',
    background: '#121212',
    onBackground: '#E6E1E5',
    surface: '#121212',
    onSurface: '#E6E1E5',
    surfaceVariant: '#49454F',
    onSurfaceVariant: '#D0CBDC',
    outline: '#938F99',
    outlineVariant: '#49454F',
    inverseSurface: '#E6E1E5',
    inverseOnSurface: '#313033',
    inversePrimary: '#6200EE',
    shadow: '#000000',
    scrim: '#000000',
  },
} as const;

export type Colors = typeof COLORS;