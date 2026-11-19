// Phase 17: the map mounts only the stop markers inside the reported viewport.
// Panning/zooming updates MapLibre bounds -> markers are added and removed.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react-native';
import type { Stop } from '@/types/gtfs';

const makeStop = (id: string, lat: number, lon: number): Stop => ({
  stop_id: id,
  stop_name: `Stop ${id}`,
  stop_lat: lat,
  stop_lon: lon,
});

// Two stops in the Granada centre, one far away in Madrid.
const STOPS = [
  makeStop('centre', 37.1773, -3.5986),
  makeStop('nearby', 37.175, -3.599),
  makeStop('madrid', 40.4168, -3.7038),
];

vi.mock('@/store/settings', () => ({
  useSettingsStore: () => ({
    mapStyle: 'standard',
    autoFollowUser: false,
    showBusLabels: true,
  }),
}));

vi.mock('@/hooks/useLines', () => ({
  useLines: () => ({ routes: [], loadLines: vi.fn() }),
}));

vi.mock('@/hooks/useStops', () => ({
  useStops: () => ({
    stops: STOPS,
    loadAllStops: vi.fn(),
    loadStopsForRoute: vi.fn(),
  }),
}));

vi.mock('@/hooks/useLocation', () => ({
  useLocation: () => ({
    permission: 'denied',
    watchLocation: vi.fn(),
    ensureLocationReady: vi.fn(async () => false),
    getCurrentLocation: vi.fn(async () => null),
    openLocationSettings: vi.fn(async () => false),
  }),
}));

vi.mock('@/services/gtfs', () => ({
  gtfsService: {
    getStop: vi.fn(() => undefined),
    getRoutesForStop: vi.fn(() => [
      {
        route_id: 'r1',
        route_short_name: '1',
        route_long_name: 'Centro',
        route_type: 3,
        route_color: 'FF0000',
      },
    ]),
    getShapeForRoute: vi.fn(() => []),
  },
}));

vi.mock('@/services/storage', () => ({
  Storage: { getItem: vi.fn(() => null), setItem: vi.fn() },
}));

/* eslint-disable-next-line import/first */
import { MapView } from './MapView.native';

type ViewResult = Awaited<ReturnType<typeof render>>;

interface JsonNode {
  type: string;
  props: Record<string, unknown>;
  children?: (JsonNode | string)[] | null;
}

function walk(node: JsonNode | string | null | undefined, visit: (node: JsonNode) => void) {
  if (!node || typeof node === 'string') return;
  visit(node);
  for (const child of node.children ?? []) walk(child, visit);
}

/** Number of stop markers (host Views carrying a `lngLat` prop) on screen. */
function markerCount(view: ViewResult): number {
  let count = 0;
  walk(view.toJSON() as JsonNode, (node) => {
    if (Array.isArray(node.props.lngLat)) count += 1;
  });
  return count;
}

/** Simulates MapLibre reporting a finished camera movement. */
async function reportRegion(
  view: ViewResult,
  bounds: [number, number, number, number],
  center: [number, number],
  zoom = 14,
) {
  let handler: ((event: unknown) => void) | undefined;
  walk(view.toJSON() as JsonNode, (node) => {
    if (typeof node.props.onRegionDidChange === 'function') {
      handler = node.props.onRegionDidChange as (event: unknown) => void;
    }
  });
  expect(handler).toBeDefined();

  await act(async () => {
    handler?.({
      nativeEvent: {
        center,
        zoom,
        bearing: 0,
        pitch: 0,
        bounds,
        animated: false,
        userInteraction: true,
      },
    });
  });
}

describe('MapView viewport stops', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('only mounts the stops inside the viewport reported by the map', async () => {
    const view = await render(<MapView />);

    // Camera region fallback (Granada, zoom 14) already excludes Madrid.
    expect(markerCount(view)).toBe(2);

    // Panning to Madrid keeps only the Madrid stop mounted.
    await reportRegion(view, [-3.72, 40.4, -3.69, 40.43], [-3.7038, 40.4168]);
    expect(markerCount(view)).toBe(1);

    // Panning back to Granada adds the city stops again (they animate in).
    await reportRegion(view, [-3.61, 37.17, -3.59, 37.18], [-3.5986, 37.1773]);
    expect(markerCount(view)).toBe(2);
  });

  it('keeps stops slightly outside the viewport mounted to avoid edge popping', async () => {
    const view = await render(<MapView />);

    // The viewport's top edge stops south of the 'nearby' stop (37.175), but
    // the padding margin keeps it mounted instead of prising it off-screen.
    await reportRegion(view, [-3.61, 37.16, -3.59, 37.174], [-3.5986, 37.167]);

    expect(markerCount(view)).toBe(1);
  });
});
