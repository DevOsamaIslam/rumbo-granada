// Map Viewport Utilities
//
// The map only mounts stop markers that fall inside the current viewport
// (plus a safety margin) instead of every GTFS stop in the network. These
// helpers are pure so the filtering logic can be unit tested without a map.

import type { Stop } from '@/types/gtfs';

export interface ViewportBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/** MapLibre reports viewport bounds as `[west, south, east, north]`. */
export type LngLatBounds = [west: number, south: number, east: number, north: number];

/**
 * Extra area (as a fraction of the viewport size) kept mounted around the
 * edges so markers don't pop in and out during small pans.
 */
export const VIEWPORT_PADDING = 0.35;

/** Hard cap on simultaneously mounted stop markers (MapLibre annotation cost). */
export const MAX_VIEWPORT_STOPS = 300;

/** Minimum gap between viewport recomputations while the map is moving. */
export const REGION_THROTTLE_MS = 150;

const DEGENERATE_SPAN = 1e-6;

export function toViewportBounds(bounds: LngLatBounds): ViewportBounds {
  const [west, south, east, north] = bounds;
  return {
    minLat: Math.min(south, north),
    maxLat: Math.max(south, north),
    minLng: Math.min(west, east),
    maxLng: Math.max(west, east),
  };
}

/**
 * Grow the bounds outward by `factor` of their size (on each side), so a
 * marker stays mounted slightly outside the visible area.
 */
export function expandBounds(
  bounds: ViewportBounds,
  factor: number = VIEWPORT_PADDING
): ViewportBounds {
  if (!Number.isFinite(factor) || factor <= 0) return bounds;

  const latPad = ((bounds.maxLat - bounds.minLat) / 2) * factor;
  const lngPad = ((bounds.maxLng - bounds.minLng) / 2) * factor;

  return {
    minLat: bounds.minLat - latPad,
    maxLat: bounds.maxLat + latPad,
    minLng: bounds.minLng - lngPad,
    maxLng: bounds.maxLng + lngPad,
  };
}

export function isStopInBounds(stop: Stop, bounds: ViewportBounds): boolean {
  return (
    stop.stop_lat >= bounds.minLat &&
    stop.stop_lat <= bounds.maxLat &&
    stop.stop_lon >= bounds.minLng &&
    stop.stop_lon <= bounds.maxLng
  );
}

/** MapLibre renders 512px vector tiles. */
const TILE_SIZE = 512;

/**
 * Approximate the visible bounds from a camera centre/zoom and the on-screen
 * size of the map (Web Mercator projection). Used as the initial viewport so
 * the very first frame doesn't mount every stop, and as a fallback if the map
 * has not reported its bounds yet.
 */
export function boundsFromRegion(
  region: { latitude: number; longitude: number; zoomLevel: number },
  size: { width: number; height: number }
): ViewportBounds {
  const zoomLevel = Number.isFinite(region.zoomLevel) ? region.zoomLevel : 14;
  const width = Math.max(size.width, 1);
  const height = Math.max(size.height, 1);
  const worldSize = TILE_SIZE * 2 ** zoomLevel;

  // Latitude → mercator "world" pixels.
  const latRad = (region.latitude * Math.PI) / 180;
  const centerY =
    (0.5 - Math.log(Math.tan(Math.PI / 4 + latRad / 2)) / (2 * Math.PI)) * worldSize;

  const toLatitude = (y: number) =>
    (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / worldSize))) * 180) / Math.PI;

  const halfLng = ((width / 2) * 360) / worldSize;

  return {
    minLat: toLatitude(centerY + height / 2),
    maxLat: toLatitude(centerY - height / 2),
    minLng: region.longitude - halfLng,
    maxLng: region.longitude + halfLng,
  };
}

export interface ViewportFilterOptions {
  /** Extra area kept mounted around the viewport edges. */
  padding?: number;
  /** Maximum markers to return; extra clusters are down-sampled. */
  maxStops?: number;
}

function boundsCenter(bounds: ViewportBounds): { lat: number; lng: number } {
  return {
    lat: (bounds.minLat + bounds.maxLat) / 2,
    lng: (bounds.minLng + bounds.maxLng) / 2,
  };
}

/**
 * Down-sample stops to at most `maxStops` by bucketing them into a grid and
 * keeping the stop closest to the viewport centre in each cell. The result is
 * deterministic and keeps markers spread across the visible area instead of
 * dropping whole neighbourhoods.
 */
function capStops(stops: Stop[], bounds: ViewportBounds, maxStops: number): Stop[] {
  if (stops.length <= maxStops) return stops;

  const center = boundsCenter(bounds);
  const latSpan = bounds.maxLat - bounds.minLat || DEGENERATE_SPAN;
  const lngSpan = bounds.maxLng - bounds.minLng || DEGENERATE_SPAN;
  // Cell size that yields roughly one cell per marker in the budget.
  const cellSize = Math.sqrt((latSpan * lngSpan) / maxStops) || DEGENERATE_SPAN;

  const representatives = new Map<string, Stop>();
  const distances = new Map<string, number>();

  for (const stop of stops) {
    const cellX = Math.floor((stop.stop_lat - bounds.minLat) / cellSize);
    const cellY = Math.floor((stop.stop_lon - bounds.minLng) / cellSize);
    const key = `${cellX},${cellY}`;

    const latDelta = stop.stop_lat - center.lat;
    const lngDelta = stop.stop_lon - center.lng;
    const distance = latDelta * latDelta + lngDelta * lngDelta;

    const best = distances.get(key);
    if (best === undefined || distance < best) {
      representatives.set(key, stop);
      distances.set(key, distance);
    }
  }

  const kept = Array.from(representatives.values());
  return kept.length > maxStops ? kept.slice(0, maxStops) : kept;
}

/**
 * Returns the stops worth mounting for the current viewport: those inside the
 * (padded) bounds, capped to a marker budget.
 */
export function filterStopsInViewport(
  stops: Stop[],
  bounds: ViewportBounds,
  { padding = VIEWPORT_PADDING, maxStops = MAX_VIEWPORT_STOPS }: ViewportFilterOptions = {}
): Stop[] {
  const searchArea = expandBounds(bounds, padding);
  const visible = stops.filter((stop) => isStopInBounds(stop, searchArea));
  return capStops(visible, searchArea, maxStops);
}

/**
 * Leading-edge throttle for viewport updates. The map emits region changes on
 * every animation frame while panning; recomputing on each one is wasteful.
 */
export function isRegionUpdateDue(
  lastUpdateAt: number,
  now: number,
  intervalMs: number = REGION_THROTTLE_MS
): boolean {
  return now - lastUpdateAt >= intervalMs;
}
