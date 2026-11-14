# 03 — Navigation & Routing

## Expo Router Setup

### Root Layout (`app/_layout.tsx`)

```tsx
import { Providers } from '@/providers';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <Providers>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="line/[id]" />
        <Stack.Screen name="stop/[id]" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </Providers>
  );
}
```

### Providers (`src/providers.tsx`)

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider } from 'react-native-paper';
import { MMKVStorage } from '@/services/storage';
import { theme } from '@/constants/colors';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, refetchOnWindowFocus: false },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <MMKVStorage>
          {children}
        </MMKVStorage>
      </PaperProvider>
    </QueryClientProvider>
  );
}
```

## Tab Navigation (`app/(tabs)/_layout.tsx`)

```tsx
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1976D2',
        tabBarInactiveTintColor: '#757575',
        tabBarStyle: { elevation: 8, shadowColor: '#000' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="map-marker-radius" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="lines"
        options={{
          title: 'Lines',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bus" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="star" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
```

## Route Parameters

| Route | Params | Type |
|-------|--------|------|
| `line/[id]` | `id` | `string` (route_id from GTFS) |
| `stop/[id]` | `id` | `string` (stop_id from GTFS) |

## Deep Linking

Scheme: `rumbo-granada://`

| URL | Opens |
|-----|-------|
| `rumbo-granada://` | Home (Map) |
| `rumbo-granada://lines` | Lines tab |
| `rumbo-granada://line/b4ab663b-...` | Line detail |
| `rumbo-granada://stop/a164fda3-...` | Stop detail |
| `rumbo-granada://favorites` | Favorites tab |
| `rumbo-granada://settings` | Settings tab |

Configured in `app.config.ts`:

```ts
export default {
  expo: {
    scheme: 'rumbo-granada',
    // ...
  },
};
```

## Navigation Helpers

```tsx
// src/hooks/useNavigation.ts
import { useRouter, useLocalSearchParams } from 'expo-router';

export function useLineNavigation() {
  const router = useRouter();
  return {
    goToLine: (routeId: string) => router.push(`/line/${routeId}`),
    goToStop: (stopId: string) => router.push(`/stop/${stopId}`),
    goToMap: () => router.push('/'),
    goToFavorites: () => router.push('/favorites'),
  };
}
```

## Header/Search Bar (Lines Tab)

```tsx
// app/(tabs)/lines.tsx
import { SearchBar } from '@/components/common/SearchBar';

export default function LinesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bus Lines</Text>
        <SearchBar placeholder="Search lines..." onChangeText={setQuery} />
      </View>
      <LineList query={query} />
    </SafeAreaView>
  );
}
```