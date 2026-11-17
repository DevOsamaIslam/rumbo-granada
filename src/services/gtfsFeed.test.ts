// Canary test for the bundled GTFS feed.
//
// The app ships `resources/gtfs/*.txt` and builds its indexes from them. A
// feed where a route in `routes.txt` has no trips in `trips.txt` renders an
// empty line detail screen ("Stops (0)"), which is a release blocker. This test
// pins the current state of the feed so any refresh is reviewed deliberately:
// when the feed is updated so those routes gain trips, the assertion below
// fails and the allow-list must shrink.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Papa from 'papaparse';
import { describe, expect, it } from 'vitest';

const GTFS_DIR = join(process.cwd(), 'resources', 'gtfs');

interface Row {
  [key: string]: string;
}

function readCsv(file: string): Row[] {
  const content = readFileSync(join(GTFS_DIR, file), 'utf8');
  const parsed = Papa.parse<Row>(content, { header: true, skipEmptyLines: true });
  expect(parsed.errors).toEqual([]);
  return parsed.data;
}

/**
 * Routes that exist in `routes.txt` but have no trips yet. The six "F" lines
 * and route 1123 were published in the feed ahead of their trip data.
 *
 * TODO(release): refresh `resources/gtfs/` from the operator and empty this
 * list — the app currently shows a "no timetable data yet" note for them.
 */
const ROUTES_AWAITING_TRIPS = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', '1123'];

describe('bundled GTFS feed', () => {
  const routes = readCsv('routes.txt');
  const trips = readCsv('trips.txt');
  const stopTimes = readCsv('stop_times.txt');
  const stops = readCsv('stops.txt');

  it('has a usable amount of data', () => {
    expect(routes.length).toBeGreaterThan(20);
    expect(trips.length).toBeGreaterThan(1000);
    expect(stopTimes.length).toBeGreaterThan(100_000);
    expect(stops.length).toBeGreaterThan(300);
  });

  it('never references a route or stop that does not exist', () => {
    const routeIds = new Set(routes.map((route) => route.route_id));
    const stopIds = new Set(stops.map((stop) => stop.stop_id));

    const orphanTrips = trips.filter((trip) => !routeIds.has(trip.route_id));
    expect(orphanTrips).toEqual([]);

    const orphanStopTimes = stopTimes.filter((row) => !stopIds.has(row.stop_id));
    expect(orphanStopTimes).toEqual([]);
  });

  it('keeps the known list of routes without trips up to date', () => {
    const routeIdsWithTrips = new Set(trips.map((trip) => trip.route_id));
    const routesWithoutTrips = routes
      .filter((route) => !routeIdsWithTrips.has(route.route_id))
      .map((route) => route.route_short_name)
      .sort();

    expect(routesWithoutTrips).toEqual([...ROUTES_AWAITING_TRIPS].sort());
  });

  it('gives every route with trips at least one stop time', () => {
    const tripIdsWithTimes = new Set(stopTimes.map((row) => row.trip_id));
    const routeIdsWithTrips = new Set(trips.map((trip) => trip.route_id));

    const emptyRoutes = routes
      .filter((route) => routeIdsWithTrips.has(route.route_id))
      .filter((route) => {
        const routeTrips = trips.filter((trip) => trip.route_id === route.route_id);
        return !routeTrips.some((trip) => tripIdsWithTimes.has(trip.trip_id));
      })
      .map((route) => route.route_short_name);

    expect(emptyRoutes).toEqual([]);
  });
});
