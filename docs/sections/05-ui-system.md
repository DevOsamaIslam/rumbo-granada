# 05 — UI System

## React Native Paper Theme (`src/constants/colors.ts`)

```ts
import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';

const fontConfig = {
  default: { fontFamily: 'System', fontWeight: '400' as const },
  displayLarge: { fontFamily: 'System', fontWeight: '700' as const, fontSize: 57 },
  displayMedium: { fontFamily: 'System', fontWeight: '700' as const, fontSize: 45 },
  displaySmall: { fontFamily: 'System', fontWeight: '700' as const, fontSize: 36 },
  headlineLarge: { fontFamily: 'System', fontWeight: '600' as const, fontSize: 32 },
  headlineMedium: { fontFamily: 'System', fontWeight: '600' as const, fontSize: 28 },
  headlineSmall: { fontFamily: 'System', fontWeight: '600' as const, fontSize: 24 },
  titleLarge: { fontFamily: 'System', fontWeight: '500' as const, fontSize: 22 },
  titleMedium: { fontFamily: 'System', fontWeight: '500' as const, fontSize: 16 },
  titleSmall: { fontFamily: 'System', fontWeight: '500' as const, fontSize: 14 },
  bodyLarge: { fontFamily: 'System', fontWeight: '400' as const, fontSize: 16 },
  bodyMedium: { fontFamily: 'System', fontWeight: '400' as const, fontSize: 14 },
  bodySmall: { fontFamily: 'System', fontWeight: '400' as const, fontSize: 12 },
  labelLarge: { fontFamily: 'System', fontWeight: '500' as const, fontSize: 14 },
  labelMedium: { fontFamily: 'System', fontWeight: '500' as const, fontSize: 12 },
  labelSmall: { fontFamily: 'System', fontWeight: '500' as const, fontSize: 11 },
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1976D2',
    primaryContainer: '#BBDEFB',
    secondary: '#0288D1',
    secondaryContainer: '#B3E5FC',
    tertiary: '#388E3C',
    tertiaryContainer: '#C8E6C9',
    error: '#D32F2F',
    errorContainer: '#FFCDD2',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    outline: '#757575',
    outlineVariant: '#BDBDBD',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onTertiary: '#FFFFFF',
    onError: '#FFFFFF',
    onBackground: '#212121',
    onSurface: '#212121',
    onSurfaceVariant: '#424242',
    inverseSurface: '#303030',
    inversePrimary: '#90CAF9',
    shadow: '#000000',
    scrim: '#000000',
    backdrop: 'rgba(0,0,0,0.5)',
  },
  fonts: configureFonts({ config: fontConfig }),
  roundness: 8,
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#90CAF9',
    primaryContainer: '#1565C0',
    secondary: '#81D4FA',
    secondaryContainer: '#01579B',
    tertiary: '#A5D6A7',
    tertiaryContainer: '#2E7D32',
    error: '#EF9A9A',
    errorContainer: '#B71C1C',
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2C2C2C',
    outline: '#9E9E9E',
    outlineVariant: '#616161',
    onPrimary: '#000000',
    onSecondary: '#000000',
    onTertiary: '#000000',
    onError: '#000000',
    onBackground: '#EEEEEE',
    onSurface: '#EEEEEE',
    onSurfaceVariant: '#BDBDBD',
    inverseSurface: '#EEEEEE',
    inversePrimary: '#1976D2',
    shadow: '#000000',
    scrim: '#000000',
    backdrop: 'rgba(0,0,0,0.5)',
  },
  fonts: configureFonts({ config: fontConfig }),
  roundness: 8,
};

export const theme = { light: lightTheme, dark: darkTheme };
## Theme Provider (`app/_layout.tsx`)

```tsx
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { lightTheme, darkTheme } from '@/constants/colors';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  return <PaperProvider theme={theme}>{children}</PaperProvider>;
}
```

## Common Components

### SearchBar (`src/components/common/SearchBar.tsx`)

```tsx
import { TextInput, IconButton } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
}

export function SearchBar({ placeholder = 'Search...', value, onChangeText, onClear }: SearchBarProps) {
  return (
    <View style={styles.container}>
      <IconButton icon="magnify" size={24} style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        mode="outlined"
        label={placeholder}
      />
      {value && onClear && (
        <IconButton icon="close" size={24} onPress={onClear} accessibilityLabel="Clear search" />
      )}
    </View>
  );
}
```

### LoadingSkeleton (`src/components/common/LoadingSkeleton.tsx`)

```tsx
import { View, StyleSheet } from 'react-native';
import { Skeleton } from 'react-native-paper';

interface LoadingSkeletonProps {
  lines?: number;
  lineHeight?: number;
  spacing?: number;
}

export function LoadingSkeleton({ lines = 3, lineHeight = 16, spacing = 8 }: LoadingSkeletonProps) {
  return (
    <View>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} style={[styles.line, { height: lineHeight, marginBottom: spacing }]} />
      ))}
    </View>
  );
}
```

### EmptyState (`src/components/common/EmptyState.tsx`)

```tsx
import { View, Text, IconButton } from 'react-native-paper';
import { StyleSheet } from 'react-native';

interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <IconButton icon={icon} size={64} color="outline" disabled style={styles.icon} />
      <Text style={styles.title} variant="headlineSmall">{title}</Text>
      <Text style={styles.message} variant="bodyMedium">{message}</Text>
      {actionLabel && onAction && (
        <IconButton icon="plus" mode="contained" onPress={onAction} style={styles.action}>
          {actionLabel}
        </IconButton>
      )}
    </View>
  );
}
```

### ErrorView (`src/components/common/ErrorView.tsx`)

```tsx
import { View, Text, Button } from 'react-native-paper';
import { StyleSheet } from 'react-native';

interface ErrorViewProps {
  message: string;
  onRetry: () => void;
}

export function ErrorView({ message, onRetry }: ErrorViewProps) {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>Something went wrong</Text>
      <Text variant="bodyMedium" style={styles.message}>{message}</Text>
      <Button mode="contained" onPress={onRetry} style={styles.button}>
        Try Again
      </Button>
    </View>
  );
}
```

## Icon System

Uses `@expo/vector-icons` (MaterialCommunityIcons):

| Icon | Usage |
|------|-------|
| `map-marker-radius` | Map tab |
| `bus` | Lines tab |
| `star` / `star-outline` | Favorites |
| `cog` | Settings |
| `my-location` | Recenter map |
| `plus` / `minus` | Zoom controls |
| `magnify` | Search |
| `close` | Clear/dismiss |
| `bell` / `bell-off` | Notifications |
| `clock` | Time/arrivals |

## Spacing & Layout

```ts
// src/constants/spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};
```

## Dark Mode

- Automatic via `useColorScheme()`
- Paper themes handle color switching
- Map tiles: OSM works in both; consider dark tiles for production
- Test both themes regularly
```