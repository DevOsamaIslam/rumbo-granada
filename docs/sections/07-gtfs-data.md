# 07 — GTFS Data Layer

## Overview

Parses static GTFS CSV files from `resources/gtfs/` into typed TypeScript objects with efficient in-memory indexes for fast queries.

## GTFS Types (`src/types/gtfs.ts`)

```ts
export interface Route {
  route_id: string;
  agency_id: string;
  route_short_name: string;
  route_long_name: string;
  route_desc?: string;
  route_type: number;
  route_url?: string;
  route_color: string;
  route_text_color: string;
}

export interface Stop {
  stop_id: string;
  stop_code: string;
  stop_name: string;
  stop_desc?: string;
  stop_lat: number;
  stop_lon: number;
  zone_id?: string;
  stop_url?: string;
  location_type: number;
  parent_station?: string;
  stop_timezone?: string;
  wheelchair_boarding?: number;
  platform_code?: string;
}

export interface Trip {
  trip_id: string;
  route_id: string;
  service_id: string;
  trip_headsign: string;
  trip_short_name?: string;
  direction_id: 0 | 1;
  block_id?: string;
  shape_id?: string;
  wheelchair_accessible?: number;
}

export interface StopTime {
  trip_id: string;
  arrival_time: string;
  departure_time: string;
  stop_id: string;
  stop_sequence: number;
  stop_headsign?: string;
  pickup_type: number;
  drop_off_type: number;
  shape_dist_traveled?: number;
}

export interface Shape {
  shape_id: string;
  shape_pt_lat: number;
  shape_pt_lon: number;
  shape_pt_sequence: number;
  shape_dist_traveled?: number;
}

export interface GTFSData {
  routes: Map<string, Route>;
  stops: Map<string, Stop>;
  trips: Map<string, Trip>;
  stopTimes: Map<string, StopTime[]>;
  shapes: Map<string, Shape[]>;
  tripsByRoute: Map<string, string[]>;
  stopsByTrip: Map<string, string[]>;
  routesByStop: Map<string, string[]>;
  shapeByRoute: Map<string, string>;
}
## Parser Service (`src/services/gtfs.ts`)

```ts
import * as Papa from 'papaparse';
import { MMKV } from 'react-native-mmkv';
import type { GTFSData, Route, Stop, Trip, StopTime, Shape } from '@/types/gtfs';

const mmkv = new MMKV({ id: 'gtfs-cache' });
const CACHE_VERSION = '1.0.0';

export class GTFSService {
  private data: GTFSData | null = null;
  private loadingPromise: Promise<GTFSData> | null = null;

  async load(): Promise<GTFSData> {
    if (this.data) return this.data;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = this.parseAndIndex();
    this.data = await this.loadingPromise;
    return this.data;
  }

  private async parseAndIndex(): Promise<GTFSData> {
    const cached = this.loadFromCache();
    if (cached) return cached;

    const [routes, stops, trips, stopTimes, shapes] = await Promise.all([
      this.parseFile<Route>('routes.txt'),
      this.parseFile<Stop>('stops.txt'),
      this.parseFile<Trip>('trips.txt'),
      this.parseFile<StopTime>('stop_times.txt'),
      this.parseFile<Shape>('shapes.txt'),
    ]);

    const data = this.buildIndexes(routes, stops, trips, stopTimes, shapes);
    this.saveToCache(data);
    return data;
  }

  private parseFile<T>(filename: string): Promise<T[]> {
    const path = `../resources/gtfs/${filename}`;
    const response = await fetch(path);
    const text = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse<T>(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (result) => resolve(result.data),
        error: reject,
      });
    });
  }

  private buildIndexes(
    routes: Route[],
    stops: Stop[],
    trips: Trip[],
    stopTimes: StopTime[],
    shapes: Shape[]
  ): GTFSData {
    const routesMap = new Map(routes.map(r => [r.route_id, r]));
    const stopsMap = new Map(stops.map(s => [s.stop_id, s]));
    const tripsMap = new Map(trips.map(t => [t.trip_id, t]));
    
    const stopTimesByTrip = new Map<string, StopTime[]>();
    stopTimes.forEach(st => {
      const arr = stopTimesByTrip.get(st.trip_id) ?? [];
      arr.push(st);
      stopTimesByTrip.set(st.trip_id, arr);
    });
    stopTimesByTrip.forEach(arr => arr.sort((a, b) => a.stop_sequence - b.stop_sequence));

    const shapesByShape = new Map<string, Shape[]>();
    shapes.forEach(s => {
      const arr = shapesByShape.get(s.shape_id) ?? [];
      arr.push(s);
      shapesByShape.set(s.shape_id, arr);
    });
    shapesByShape.forEach(arr => arr.sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence));

    const tripsByRoute = new Map<string, string[]>();
    trips.forEach(t => {
      const arr = tripsByRoute.get(t.route_id) ?? [];
      arr.push(t.trip_id);
      tripsByRoute.set(t.route_id, arr);
    });

    const stopsByTrip = new Map<string, string[]>();
    stopTimesByTrip.forEach((arr, tripId) => {
      stopsByTrip.set(tripId, arr.map(st => st.stop_id));
    });

    const routesByStop = new Map<string, string[]>();
    stopTimes.forEach(st => {
      const trip = tripsMap.get(st.trip_id);
      if (trip) {
        const arr = routesByStop.get(st.stop_id) ?? [];
        if (!arr.includes(trip.route_id)) arr.push(trip.route_id);
        routesByStop.set(st.stop_id, arr);
      }
    });

    const shapeByRoute = new Map<string, string>();
    trips.forEach(t => {
      if (t.shape_id && !shapeByRoute.has(t.route_id)) {
        shapeByRoute.set(t.route_id, t.shape_id);
      }
    });

    return {
      routes: routesMap,
      stops: stopsMap,
      trips: tripsMap,
      stopTimes: stopTimesByTrip,
      shapes: shapesByShape,
      tripsByRoute,
      stopsByTrip,
      routesByStop,
      shapeByRoute,
    };
  }
```
private loadFromCache(): GTFSData | null {
    try {
      const version = mmkv.getString('gtfs-version');
      if (version !== CACHE_VERSION) return null;
      
      const json = mmkv.getString('gtfs-data');
      if (!json) return null;
      
      const parsed = JSON.parse(json);
      return {
        routes: new Map(Object.entries(parsed.routes)),
        stops: new Map(Object.entries(parsed.stops)),
        trips: new Map(Object.entries(parsed.trips)),
        stopTimes: new Map(Object.entries(parsed.stopTimes).map(([k, v]) => [k, v as StopTime[]])),
        shapes: new Map(Object.entries(parsed.shapes).map(([k, v]) => [k, v as Shape[]])),
        tripsByRoute: new Map(Object.entries(parsed.tripsByRoute).map(([k, v]) => [k, v as string[]])),
        stopsByTrip: new Map(Object.entries(parsed.stopsByTrip).map(([k, v]) => [k, v as string[]])),
        routesByStop: new Map(Object.entries(parsed.routesByStop).map(([k, v]) => [k, v as string[]])),
        shapeByRoute: new Map(Object.entries(parsed.shapeByRoute)),
      };
    } catch {
      return null;
    }
  }

  private saveToCache(data: GTFSData) {
    const serializable = {
      routes: Object.fromEntries(data.routes),
      stops: Object.fromEntries(data.stops),
      trips: Object.fromEntries(data.trips),
      stopTimes: Object.fromEntries(data.stopTimes),
      shapes: Object.fromEntries(data.shapes),
      tripsByRoute: Object.fromEntries(data.tripsByRoute),
      stopsByTrip: Object.fromEntries(data.stopsByTrip),
      routesByStop: Object.fromEntries(data.routesByStop),
      shapeByRoute: Object.fromEntries(data.shapeByRoute),
    };
    mmkv.set('gtfs-data', JSON.stringify(serializable));
    mmkv.set('gtfs-version', CACHE_VERSION);
  }

  // Query methods
  getRoutes(): Route[] {
    return Array.from(this.data?.routes.values() ?? []);
  }

  getRoute(routeId: string): Route | undefined {
    return this.data?.routes.get(routeId);
  }

  getStopsForRoute(routeId: string): Stop[] {
    const tripIds = this.data?.tripsByRoute.get(routeId) ?? [];
    const stopIds = new Set<string>();
    tripIds.forEach(tripId => {
      this.data?.stopsByTrip.get(tripId)?.forEach(stopId => stopIds.add(stopId));
    });
    return Array.from(stopIds).map(id => this.data!.stops.get(id)!).filter(Boolean);
  }

  getStop(stopId: string): Stop | undefined {
    return this.data?.stops.get(stopId);
  }

  getTripsForRoute(routeId: string): Trip[] {
    const tripIds = this.data?.tripsByRoute.get(routeId) ?? [];
    return tripIds.map(id => this.data!.trips.get(id)!).filter(Boolean);
  }

  getStopTimesForTrip(tripId: string): StopTime[] {
    return this.data?.stopTimes.get(tripId) ?? [];
  }

  getShapeForRoute(routeId: string): Shape[] {
    const shapeId = this.data?.shapeByRoute.get(routeId);
    return shapeId ? this.data?.shapes.get(shapeId) ?? [] : [];
  }

  getRoutesForStop(stopId: string): Route[] {
    const routeIds = this.data?.routesByStop.get(stopId) ?? [];
    return routeIds.map(id => this.data!.routes.get(id)!).filter(Boolean);
  }
}

export const gtfsService = new GTFSService();
```

## React Query Hooks (`src/hooks/useLines.ts`)

```tsx
import { useQuery } from '@tanstack/react-query';
import { gtfsService } from '@/services/gtfs';

export function useLines() {
  return useQuery({
    queryKey: ['lines'],
    queryFn: () => gtfsService.load().then(() => gtfsService.getRoutes()),
    staleTime: 60 * 60_000,
  });
}

export function useLine(routeId: string) {
  return useQuery({
    queryKey: ['line', routeId],
    queryFn: () => gtfsService.load().then(() => gtfsService.getRoute(routeId)),
    enabled: !!routeId,
    staleTime: 60 * 60_000,
  });
}

export function useStopsForLine(routeId: string) {
  return useQuery({
    queryKey: ['stops', routeId],
    queryFn: () => gtfsService.load().then(() => gtfsService.getStopsForRoute(routeId)),
    enabled: !!routeId,
    staleTime: 60 * 60_000,
  });
}

export function useStop(stopId: string) {
  return useQuery({
    queryKey: ['stop', stopId],
    queryFn: () => gtfsService.load().then(() => gtfsService.getStop(stopId)),
    enabled: !!stopId,
    staleTime: 60 * 60_000,
  });
}

export function useLineShape(routeId: string) {
  return useQuery({
    queryKey: ['shape', routeId],
    queryFn: () => gtfsService.load().then(() => gtfsService.getShapeForRoute(routeId)),
    enabled: !!routeId,
    staleTime: 60 * 60_000,
  });
}
```

## Shape Decoding (`src/utils/gtfs.ts`)

```ts
export function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
  const points: { latitude: number; longitude: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += deltaLat;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += deltaLng;

    points.push({
      latitude: lat * 1e-5,
      longitude: lng * 1e-5,
    });
  }

  return points;
}

export function getDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
```
```