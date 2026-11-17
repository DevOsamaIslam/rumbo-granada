import { describe, it, expect } from 'vitest';
import type { Stop } from '@/types/gtfs';
import {
  MAX_VIEWPORT_STOPS,
  REGION_THROTTLE_MS,
  VIEWPORT_PADDING,
  boundsFromRegion,
  expandBounds,
  filterStopsInViewport,
  isRegionUpdateDue,
  isStopInBounds,
  toViewportBounds,
  type ViewportBounds,
} from '@/utils/viewport';

const makeStop = (id: string, lat: number, lon: number): Stop => ({
  stop_id: id,
  stop_name: `Stop ${id}`,
  stop_lat: lat,
  stop_lon: lon,
});

// Roughly the Granada city centre.
const BOUNDS: ViewportBounds = {
  minLat: 37.16,
  maxLat: 37.19,
  minLng: -3.62,
  maxLng: -3.58,
};

describe('toViewportBounds', () => {
  it('maps MapLibre [west, south, east, north] order to named bounds', () => {
    expect(toViewportBounds([-3.62, 37.16, -3.58, 37.19])).toEqual(BOUNDS);
  });

  it('normalises inverted corners', () => {
    expect(toViewportBounds([-3.58, 37.19, -3.62, 37.16])).toEqual(BOUNDS);
  });
});

describe('expandBounds', () => {
  it('grows the bounds outward by half the factor on each side', () => {
    const expanded = expandBounds(BOUNDS, 0.5);
    const latPad = ((BOUNDS.maxLat - BOUNDS.minLat) / 2) * 0.5;
    const lngPad = ((BOUNDS.maxLng - BOUNDS.minLng) / 2) * 0.5;

    expect(expanded.minLat).toBeCloseTo(BOUNDS.minLat - latPad, 10);
    expect(expanded.maxLat).toBeCloseTo(BOUNDS.maxLat + latPad, 10);
    expect(expanded.minLng).toBeCloseTo(BOUNDS.minLng - lngPad, 10);
    expect(expanded.maxLng).toBeCloseTo(BOUNDS.maxLng + lngPad, 10);
  });

  it('returns the same bounds when no padding is requested', () => {
    expect(expandBounds(BOUNDS, 0)).toEqual(BOUNDS);
    expect(expandBounds(BOUNDS, Number.NaN)).toEqual(BOUNDS);
  });

  it('defaults to VIEWPORT_PADDING', () => {
    expect(expandBounds(BOUNDS)).toEqual(expandBounds(BOUNDS, VIEWPORT_PADDING));
    expect(expandBounds(BOUNDS).maxLat).toBeGreaterThan(BOUNDS.maxLat);
  });
});

describe('isStopInBounds', () => {
  it('includes stops on the boundary', () => {
    expect(isStopInBounds(makeStop('edge', BOUNDS.minLat, BOUNDS.minLng), BOUNDS)).toBe(true);
    expect(isStopInBounds(makeStop('edge', BOUNDS.maxLat, BOUNDS.maxLng), BOUNDS)).toBe(true);
  });

  it('excludes stops outside on either axis', () => {
    expect(isStopInBounds(makeStop('north', BOUNDS.maxLat + 1e-4, -3.6), BOUNDS)).toBe(false);
    expect(isStopInBounds(makeStop('east', 37.17, BOUNDS.maxLng + 1e-4), BOUNDS)).toBe(false);
  });
});
describe('filterStopsInViewport', () => {
  const stops = [
    makeStop('centre', 37.1773, -3.5986),
    makeStop('near', 37.175, -3.599),
    makeStop('madrid', 40.4168, -3.7038),
    makeStop('edge', 37.1602, -3.6198),
  ];

  it('keeps only stops inside the visible viewport', () => {
    const visible = filterStopsInViewport(stops, BOUNDS, { padding: 0 });
    expect(visible.map((s) => s.stop_id).sort()).toEqual(['centre', 'edge', 'near']);
  });

  it('keeps a margin of stops mounted around the edges by default', () => {
    // Just outside the right edge, but inside the padding margin.
    const justOffscreen = makeStop('just-outside', 37.1773, BOUNDS.maxLng + 0.001);

    expect(filterStopsInViewport([justOffscreen], BOUNDS, { padding: 0 })).toHaveLength(0);
    expect(filterStopsInViewport([justOffscreen], BOUNDS)).toHaveLength(1);
  });

  it('returns an empty list when nothing is visible', () => {
    expect(filterStopsInViewport([], BOUNDS)).toEqual([]);
    expect(filterStopsInViewport([makeStop('madrid', 40.4168, -3.7038)], BOUNDS)).toEqual([]);
  });

  it('caps the marker count while keeping stops spread over the viewport', () => {
    // Dense grid of 400 stops (20 x 20) inside the bounds.
    const dense: Stop[] = [];
    for (let row = 0; row < 20; row += 1) {
      for (let col = 0; col < 20; col += 1) {
        dense.push(
          makeStop(
            `s-${row}-${col}`,
            BOUNDS.minLat + ((row + 0.5) / 20) * (BOUNDS.maxLat - BOUNDS.minLat),
            BOUNDS.minLng + ((col + 0.5) / 20) * (BOUNDS.maxLng - BOUNDS.minLng),
          ),
        );
      }
    }

    const capped = filterStopsInViewport(dense, BOUNDS, { padding: 0, maxStops: 40 });

    expect(capped.length).toBeGreaterThan(0);
    expect(capped.length).toBeLessThanOrEqual(40);
    expect(capped.every((stop) => isStopInBounds(stop, BOUNDS))).toBe(true);

    // Representatives come from every corner of the viewport, not just one
    // neighbourhood.
    const latitudes = capped.map((stop) => stop.stop_lat);
    const longitudes = capped.map((stop) => stop.stop_lon);
    expect(Math.min(...latitudes)).toBeLessThan(BOUNDS.minLat + 0.01);
    expect(Math.max(...latitudes)).toBeGreaterThan(BOUNDS.maxLat - 0.01);
    expect(Math.min(...longitudes)).toBeLessThan(BOUNDS.minLng + 0.01);
    expect(Math.max(...longitudes)).toBeGreaterThan(BOUNDS.maxLng - 0.01);
  });

  it('is deterministic and never exceeds the default budget', () => {
    const dense: Stop[] = [];
    for (let index = 0; index < MAX_VIEWPORT_STOPS * 3; index += 1) {
      dense.push(
        makeStop(
          `s-${index}`,
          37.16 + (index % 100) * 0.0003,
          -3.62 + Math.floor(index / 100) * 0.0003,
        ),
      );
    }

    const first = filterStopsInViewport(dense, BOUNDS);
    const second = filterStopsInViewport(dense, BOUNDS);

    expect(second).toEqual(first);
    expect(first.length).toBeLessThanOrEqual(MAX_VIEWPORT_STOPS);
  });
});

describe('boundsFromRegion', () => {
  const region = { latitude: 37.1773, longitude: -3.5986, zoomLevel: 14 };
  const size = { width: 390, height: 844 };

  it('centres the bounds on the camera position', () => {
    const bounds = boundsFromRegion(region, size);

    expect(bounds.minLat).toBeLessThan(region.latitude);
    expect(bounds.maxLat).toBeGreaterThan(region.latitude);
    expect(bounds.minLng).toBeLessThan(region.longitude);
    expect(bounds.maxLng).toBeGreaterThan(region.longitude);
  });

  it('is symmetric horizontally around the camera', () => {
    const bounds = boundsFromRegion(region, size);
    expect((bounds.minLng + bounds.maxLng) / 2).toBeCloseTo(region.longitude, 10);
    expect(bounds.maxLng - region.longitude).toBeCloseTo(
      region.longitude - bounds.minLng,
      10,
    );
  });

  it('covers a plausible span at zoom 14', () => {
    const bounds = boundsFromRegion(region, size);
    // ~0.017° of longitude and ~0.029° of latitude for a phone-sized viewport.
    expect(bounds.maxLng - bounds.minLng).toBeCloseTo(0.0167, 2);
    expect(bounds.maxLat - bounds.minLat).toBeGreaterThan(0.02);
    expect(bounds.maxLat - bounds.minLat).toBeLessThan(0.04);
  });

  it('shrinks as the map zooms in', () => {
    const wide = boundsFromRegion(region, size);
    const close = boundsFromRegion({ ...region, zoomLevel: 16 }, size);

    expect(close.maxLng - close.minLng).toBeLessThan(wide.maxLng - wide.minLng);
    expect(close.maxLat - close.minLat).toBeLessThan(wide.maxLat - wide.minLat);
  });

  it('does not produce NaN for degenerate input', () => {
    const bounds = boundsFromRegion(
      { ...region, zoomLevel: Number.NaN },
      { width: 0, height: 0 },
    );
    for (const value of [bounds.minLat, bounds.maxLat, bounds.minLng, bounds.maxLng]) {
      expect(Number.isFinite(value)).toBe(true);
    }
  });
});

describe('isRegionUpdateDue', () => {
  it('throttles updates within the interval', () => {
    expect(isRegionUpdateDue(1_000, 1_000)).toBe(false);
    expect(isRegionUpdateDue(1_000, 1_000 + REGION_THROTTLE_MS - 1)).toBe(false);
  });

  it('allows an update once the interval has elapsed', () => {
    expect(isRegionUpdateDue(1_000, 1_000 + REGION_THROTTLE_MS)).toBe(true);
    expect(isRegionUpdateDue(0, 10_000)).toBe(true);
  });

  it('honours a custom interval', () => {
    expect(isRegionUpdateDue(0, 50, 100)).toBe(false);
    expect(isRegionUpdateDue(0, 100, 100)).toBe(true);
  });
});

