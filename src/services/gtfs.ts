import * as Papa from 'papaparse';
import { createMMKV } from 'react-native-mmkv';
import { Platform } from 'react-native';
import { orderStopsBySequence } from '@/utils/gtfs';
import type { Route, Stop, Trip, StopTime, Shape } from '@/types/gtfs';

const mmkv = createMMKV({ id: 'gtfs-cache' });
const CACHE_VERSION = '1.0.0';
const GTFS_CACHE_KEY = 'gtfs-data';
const GTFS_VERSION_KEY = 'gtfs-version';

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

interface SerializableGTFSData {
  routes: [string, Route][];
  stops: [string, Stop][];
  trips: [string, Trip][];
  stopTimes: [string, StopTime[]][];
  shapes: [string, Shape[]][];
  tripsByRoute: [string, string[]][];
  stopsByTrip: [string, string[]][];
  routesByStop: [string, string[]][];
  shapeByRoute: [string, string][];
}

class GTFSService {
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
    // On web, GTFS files are served statically from `public/gtfs/`.
    // On native, Metro serves them from `../resources/gtfs/`.
    const path = Platform.OS === 'web' ? `/gtfs/${filename}` : `../resources/gtfs/${filename}`;
    return fetch(path)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch ${filename}: ${response.status}`);
        }
        return response.text();
      })
      .then((text) => {
        if (text.trimStart().startsWith('<')) {
          throw new Error(`Unexpected HTML response when fetching ${filename}`);
        }
        return new Promise<T[]>((resolve, reject) => {
          Papa.parse<T>(text, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            complete: (results) => {
              if (results.errors.length > 0) {
                console.warn(`GTFS parse warnings for ${filename}:`, results.errors);
              }
              resolve(results.data as T[]);
            },
            error: (error: Error) => reject(error),
          });
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
    const routesMap = new Map<string, Route>();
    const stopsMap = new Map<string, Stop>();
    const tripsMap = new Map<string, Trip>();
    const stopTimesMap = new Map<string, StopTime[]>();
    const shapesMap = new Map<string, Shape[]>();
    const tripsByRoute = new Map<string, string[]>();
    const stopsByTrip = new Map<string, string[]>();
    const routesByStop = new Map<string, string[]>();
    const shapeByRoute = new Map<string, string>();

    for (const route of routes) {
      routesMap.set(route.route_id, route);
      tripsByRoute.set(route.route_id, []);
    }

    for (const stop of stops) {
      stopsMap.set(stop.stop_id, stop);
      routesByStop.set(stop.stop_id, []);
    }

    for (const trip of trips) {
      tripsMap.set(trip.trip_id, trip);
      const routeTrips = tripsByRoute.get(trip.route_id);
      if (routeTrips) {
        routeTrips.push(trip.trip_id);
      }
      if (trip.shape_id) {
        shapeByRoute.set(trip.route_id, trip.shape_id);
      }
    }

    for (const stopTime of stopTimes) {
      const tripStopTimes = stopTimesMap.get(stopTime.trip_id) ?? [];
      tripStopTimes.push(stopTime);
      stopTimesMap.set(stopTime.trip_id, tripStopTimes);

      const tripStops = stopsByTrip.get(stopTime.trip_id) ?? [];
      tripStops.push(stopTime.stop_id);
      stopsByTrip.set(stopTime.trip_id, tripStops);

      const stopRoutes = routesByStop.get(stopTime.stop_id) ?? [];
      const trip = tripsMap.get(stopTime.trip_id);
      if (trip && !stopRoutes.includes(trip.route_id)) {
        stopRoutes.push(trip.route_id);
        routesByStop.set(stopTime.stop_id, stopRoutes);
      }
    }

    for (const times of stopTimesMap.values()) {
      times.sort((a, b) => a.stop_sequence - b.stop_sequence);
    }

    for (const shape of shapes) {
      const shapePoints = shapesMap.get(shape.shape_id) ?? [];
      shapePoints.push(shape);
      shapesMap.set(shape.shape_id, shapePoints);
    }

    for (const points of shapesMap.values()) {
      points.sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence);
    }

    return {
      routes: routesMap,
      stops: stopsMap,
      trips: tripsMap,
      stopTimes: stopTimesMap,
      shapes: shapesMap,
      tripsByRoute,
      stopsByTrip,
      routesByStop,
      shapeByRoute,
    };
  }

  private loadFromCache(): GTFSData | null {
    try {
      const version = mmkv.getString(GTFS_VERSION_KEY);
      if (version !== CACHE_VERSION) {
        return null;
      }

      const cached = mmkv.getString(GTFS_CACHE_KEY);
      if (!cached) return null;

      const serialized: SerializableGTFSData = JSON.parse(cached);
      return this.deserialize(serialized);
    } catch (error) {
      console.warn('Failed to load GTFS from cache:', error);
      return null;
    }
  }

  private saveToCache(data: GTFSData): void {
    try {
      const serialized: SerializableGTFSData = {
        routes: Array.from(data.routes.entries()),
        stops: Array.from(data.stops.entries()),
        trips: Array.from(data.trips.entries()),
        stopTimes: Array.from(data.stopTimes.entries()),
        shapes: Array.from(data.shapes.entries()),
        tripsByRoute: Array.from(data.tripsByRoute.entries()),
        stopsByTrip: Array.from(data.stopsByTrip.entries()),
        routesByStop: Array.from(data.routesByStop.entries()),
        shapeByRoute: Array.from(data.shapeByRoute.entries()),
      };

      mmkv.set(GTFS_CACHE_KEY, JSON.stringify(serialized));
      mmkv.set(GTFS_VERSION_KEY, CACHE_VERSION);
    } catch (error) {
      console.warn('Failed to save GTFS to cache:', error);
    }
  }

  private deserialize(serialized: SerializableGTFSData): GTFSData {
    return {
      routes: new Map(serialized.routes),
      stops: new Map(serialized.stops),
      trips: new Map(serialized.trips),
      stopTimes: new Map(serialized.stopTimes),
      shapes: new Map(serialized.shapes),
      tripsByRoute: new Map(serialized.tripsByRoute),
      stopsByTrip: new Map(serialized.stopsByTrip),
      routesByStop: new Map(serialized.routesByStop),
      shapeByRoute: new Map(serialized.shapeByRoute),
    };
  }

  getRoutes(): Route[] {
    return Array.from(this.data?.routes.values() ?? []);
  }

  getRoute(routeId: string): Route | undefined {
    return this.data?.routes.get(routeId);
  }

  getStopsForRoute(routeId: string): Stop[] {
    const tripIds = this.data?.tripsByRoute.get(routeId) ?? [];
    const stopIds = new Set<string>();

    for (const tripId of tripIds) {
      const stops = this.data?.stopsByTrip.get(tripId) ?? [];
      for (const stopId of stops) {
        stopIds.add(stopId);
      }
    }

    return Array.from(stopIds)
      .map((id) => this.data?.stops.get(id))
      .filter((stop): stop is Stop => stop !== undefined);
  }

  getOrderedStopsForRoute(routeId: string): Stop[] {
    if (!this.data) return [];
    return orderStopsBySequence(
      this.data.tripsByRoute,
      this.data.stopTimes,
      this.data.stops,
      routeId
    );
  }

  getTripsForRoute(routeId: string): Trip[] {
    const tripIds = this.data?.tripsByRoute.get(routeId) ?? [];
    return tripIds
      .map((id) => this.data?.trips.get(id))
      .filter((trip): trip is Trip => trip !== undefined);
  }

  getStopTimesForTrip(tripId: string): StopTime[] {
    return this.data?.stopTimes.get(tripId) ?? [];
  }

  getStop(stopId: string): Stop | undefined {
    return this.data?.stops.get(stopId);
  }

  getShapeForRoute(routeId: string): Shape[] {
    const shapeId = this.data?.shapeByRoute.get(routeId);
    return shapeId ? this.data?.shapes.get(shapeId) ?? [] : [];
  }

  getRoutesForStop(stopId: string): Route[] {
    const routeIds = this.data?.routesByStop.get(stopId) ?? [];
    return routeIds
      .map((id) => this.data?.routes.get(id))
      .filter((route): route is Route => route !== undefined);
  }

  clearCache(): void {
    mmkv.remove(GTFS_CACHE_KEY);
    mmkv.remove(GTFS_VERSION_KEY);
    this.data = null;
    this.loadingPromise = null;
  }
}

export const gtfsService = new GTFSService();

export { GTFSService };
