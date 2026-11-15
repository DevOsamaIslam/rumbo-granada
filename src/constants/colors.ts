// Material Design 3 Color Scheme for React Native Paper

export const COLORS = {
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

  // Custom app colors
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

  // Dark theme variants
  dark: {
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
  },
} as const;


export type Colors = typeof COLORS;