# 13 — Performance & Bundle Optimization

## Hermes Configuration

```ts
// app.config.ts
export default {
  expo: {
    jsEngine: 'hermes',
    // Hermes bytecode compilation on EAS Build
  },
};
```

## Bundle Analysis

```bash
npx expo-bundle-analyzer
# Or: npx react-native-bundle-visualizer
```

## Optimization Strategies

| Area | Technique | Target |
|------|-----------|--------|
| JS Bundle | Lazy load screens with `React.lazy` + `Suspense` | < 2MB gzipped |
| Map | Cluster markers, simplify polylines | 60fps scrolling |
| Images | WebP format, resize for device density | < 500KB total |
| GTFS Cache | MMKV serialization, version hash | < 50ms load |
| Live API | React Query staleTime + refetchInterval | Minimize requests |

## Lazy Loading Screens

```tsx
// app/_layout.tsx
import { Suspense, lazy } from 'react';

const LineDetail = lazy(() => import('./line/[id]').then(m => ({ default: m.default })));
const StopDetail = lazy(() => import('./stop/[id]').then(m => ({ default: m.default })));
const Settings = lazy(() => import('./(tabs)/settings').then(m => ({ default: m.default })));

<Stack.Screen name="line/[id]" component={LineDetail} />
<Stack.Screen name="stop/[id]" component={StopDetail} />
<Tabs.Screen name="settings" component={Settings} />
```

## Map Performance

```tsx
// Marker memoization
const StopMarker = React.memo(({ stop, onPress, isFavorite }: StopMarkerProps) => {
  // ...
}, (prev, next) => 
  prev.stop.stop_id === next.stop.stop_id && 
  prev.isFavorite === next.isFavorite
);

// Polyline simplification (Douglas-Peucker)
import { simplify } from '@turf/turf';
const simplifiedCoords = simplify(originalCoords, { tolerance: 0.0001, highQuality: true });
```

## Memory Management

- Use `useMemo`/`useCallback` for expensive computations
- Clean up listeners in `useEffect` return
- Avoid inline object creation in render
- Profile with `metro-mcp__profile_action` or Flipper

## Startup Optimization

```tsx// app/_layout.tsx - defer non-critical providers
const [gtfsLoaded, setGtfsLoaded] = useState(false);

useEffect(() => {
  gtfsService.load().then(() => setGtfsLoaded(true));
}, []);

if (!gtfsLoaded) return <SplashScreen />;
```