# 12 — Testing Strategy

## Stack

| Tool | Purpose |
|------|---------|
| Vitest | Unit/integration tests |
| @testing-library/react-native | Component testing |
| jest-expo | Expo/RN test environment |
| Maestro | E2E testing (future) |

## Vitest Config (`vitest.config.ts`)

```ts
import { defineConfig } from 'vitest/config';
import reactNative from 'vite-plugin-react-native';

export default defineConfig({
  plugins: [reactNative()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./app/test/setup.ts'],
    include: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 },
    },
  },
});
```

## Test Setup (`app/test/setup.ts`)

```ts
import '@testing-library/jest-native';
import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { render } from '@testing-library/react-native';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <PaperProvider theme={/* test theme */}>{children}</PaperProvider>
  </QueryClientProvider>
);

export { wrapper };
global.render = (ui: ReactNode) => render(ui, { wrapper });
## Unit Tests

### GTFS Parser (`src/services/gtfs.test.ts`)

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { gtfsService } from '@/services/gtfs';

describe('GTFSService', () => {
  beforeAll(async () => { await gtfsService.load(); });

  it('loads all routes', () => {
    const routes = gtfsService.getRoutes();
    expect(routes.length).toBeGreaterThan(0);
  });

  it('finds route by ID', () => {
    const route = gtfsService.getRoute('b4ab663b-59a5-4eb6-bd58-b7c4fe9c2a1b');
    expect(route?.route_short_name).toBe('F6');
  });

  it('gets stops for route', () => {
    const stops = gtfsService.getStopsForRoute('b4ab663b-59a5-4eb6-bd58-b7c4fe9c2a1b');
    expect(stops.length).toBeGreaterThan(0);
  });
});
```

### Favorites Store (`src/store/favorites.test.ts`)

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useFavoritesStore } from '@/store/favorites';

describe('FavoritesStore', () => {
  beforeEach(() => useFavoritesStore.setState({ favoriteBusIds: [], favoriteStops: [] }));

  it('adds and removes favorite bus', () => {
    const { addFavoriteBus, removeFavoriteBus, isFavoriteBus } = useFavoritesStore.getState();
    addFavoriteBus('route-1');
    expect(isFavoriteBus('route-1')).toBe(true);
    removeFavoriteBus('route-1');
    expect(isFavoriteBus('route-1')).toBe(false);
  });

  it('adds labeled stop', () => {
    const { addFavoriteStop, getFavoriteStop } = useFavoritesStore.getState();
    addFavoriteStop('stop-1', 'Home', 'Avda. Sierra Nevada', '9');
    expect(getFavoriteStop('stop-1')?.label).toBe('Home');
  });
});
```

### Tracking Logic (`src/hooks/useBusTracking.test.ts`)

```ts
import { describe, it, expect, vi } from 'vitest';
import { useBusTracking } from '@/hooks/useBusTracking';
import { liveApiClient } from '@/services/liveApi';

vi.mock('@/services/liveApi', () => ({
  liveApiClient: { getStopArrivals: vi.fn() },
}));

describe('useBusTracking', () => {
  it('checks arrival and triggers notification', async () => {
    liveApiClient.getStopArrivals.mockResolvedValue([
      { lineCode: 'C34', busId: 'bus-1', minutes: 2, distance: 150, isRealTime: true }
    ]);
    const { checkArrival } = useBusTracking();
    const result = await checkArrival({ thresholdMeters: 200, thresholdStops: 2 } as any);
    expect(result).toBe(true);
  });
});
```

## Component Tests

```tsx
// src/components/map/StopMarker.test.tsx
import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react-native';
import { StopMarker } from './StopMarker';

describe('StopMarker', () => {
  it('renders stop name and favorite button', () => {
    const { getByText, getByLabelText } = render(
      <StopMarker stop={{ stop_id: '1', stop_name: 'Test Stop', stop_code: '9', stop_lat: 0, stop_lon: 0 }} 
                  onPress={vi.fn()} isFavorite={false} />
    );
    expect(getByText('Test Stop')).toBeTruthy();
    expect(getByLabelText('Add favorite')).toBeTruthy();
  });
});
```

## E2E Tests (Maestro)

```yaml
# maestro/flows/track-bus.yaml
appId: com.granabus.app
---
- launchApp
- tapOn: "Lines"
- tapOn: "C34"
- tapOn: "Stop: Avda. Sierra Nevada 97"
- tapOn: "Track this bus"
- inputText: "Home"
- tapOn: "Start Tracking"
- assertVisible: "Tracking started"
```

## Running Tests

```bash
npm run test           # Unit tests
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage report
```
```