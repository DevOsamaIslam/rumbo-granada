// Map Utilities

import { haversineDistance, formatDistance } from './gtfs';

export { haversineDistance, formatDistance };

export function calculateBounds(
  points: { lat: number; lon: number }[]
): { minLat: number; maxLat: number; minLon: number; maxLon: number } {
  if (points.length === 0) {
    return { minLat: 0, maxLat: 0, minLon: 0, maxLon: 0 };
  }

  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLon = points[0].lon;
  let maxLon = points[0].lon;

  for (const point of points) {
    minLat = Math.min(minLat, point.lat);
    maxLat = Math.max(maxLat, point.lat);
    minLon = Math.min(minLon, point.lon);
    maxLon = Math.max(maxLon, point.lon);
  }

  return { minLat, maxLat, minLon, maxLon };
}

export function getBoundsCenter(bounds: {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}): { lat: number; lon: number } {
  return {
    lat: (bounds.minLat + bounds.maxLat) / 2,
    lon: (bounds.minLon + bounds.maxLon) / 2,
  };
}

export function calculateZoomLevel(
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number },
  padding: number = 0.1
): number {
  const latDiff = bounds.maxLat - bounds.minLat;
  const lonDiff = bounds.maxLon - bounds.minLon;
  const maxDiff = Math.max(latDiff, lonDiff);

  if (maxDiff === 0) return 15;

  const zoom = Math.log2(360 / (maxDiff * (1 + padding)));
  return Math.min(Math.max(Math.floor(zoom), 10), 19);
}

export function isPointInBounds(
  point: { lat: number; lon: number },
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number }
): boolean {
  return (
    point.lat >= bounds.minLat &&
    point.lat <= bounds.maxLat &&
    point.lon >= bounds.minLon &&
    point.lon <= bounds.maxLon
  );
}

export function clusterMarkers<T extends { lat: number; lon: number }>(
  markers: T[],
  gridSize: number = 50
): Map<string, T[]> {
  const clusters = new Map<string, T[]>();

  for (const marker of markers) {
    const gridX = Math.floor(marker.lat * 10000 / gridSize);
    const gridY = Math.floor(marker.lon * 10000 / gridSize);
    const key = `${gridX},${gridY}`;

    if (!clusters.has(key)) {
      clusters.set(key, []);
    }
    clusters.get(key)!.push(marker);
  }

  return clusters;
}

export function getClusterCenter<T extends { lat: number; lon: number }>(
  markers: T[]
): { lat: number; lon: number } {
  if (markers.length === 0) return { lat: 0, lon: 0 };

  const latSum = markers.reduce((sum, m) => sum + m.lat, 0);
  const lonSum = markers.reduce((sum, m) => sum + m.lon, 0);

  return {
    lat: latSum / markers.length,
    lon: lonSum / markers.length,
  };
}