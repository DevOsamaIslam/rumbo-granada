import { describe, it, expect } from 'vitest';
import { filterLines, orderStopsBySequence, getRouteTypeName } from '@/utils/gtfs';
import type { Route, Stop, StopTime } from '@/types/gtfs';

const makeRoute = (overrides: Partial<Route>): Route => ({
  route_id: 'r1',
  agency_id: 'a1',
  route_short_name: '1',
  route_long_name: 'Alhambra',
  route_type: 3,
  ...overrides,
});

const makeStop = (id: string): Stop => ({
  stop_id: id,
  stop_name: `Stop ${id}`,
  stop_lat: 37.1,
  stop_lon: -3.6,
});

const makeStopTime = (tripId: string, stopId: string, seq: number): StopTime => ({
  trip_id: tripId,
  arrival_time: '08:00:00',
  departure_time: '08:00:00',
  stop_id: stopId,
  stop_sequence: seq,
});

describe('filterLines', () => {
  const routes = [
    makeRoute({ route_id: 'r1', route_short_name: '10', route_long_name: 'Alhambra - Centro' }),
    makeRoute({ route_id: 'r2', route_short_name: '33', route_long_name: 'Zaidín' }),
  ];

  it('returns all routes when query is empty', () => {
    expect(filterLines(routes, '')).toHaveLength(2);
    expect(filterLines(routes, '   ')).toHaveLength(2);
  });

  it('filters by short name', () => {
    expect(filterLines(routes, '10')).toHaveLength(1);
    expect(filterLines(routes, '10')[0].route_id).toBe('r1');
  });

  it('filters by long name case-insensitively', () => {
    expect(filterLines(routes, 'zaidín')).toHaveLength(1);
    expect(filterLines(routes, 'ZAIDÍN')[0].route_id).toBe('r2');
  });

  it('returns empty for no match', () => {
    expect(filterLines(routes, 'xyz')).toHaveLength(0);
  });
});

describe('orderStopsBySequence', () => {
  const tripsByRoute = new Map([
    ['r1', ['t1', 't2']],
  ]);
  const stopTimes = new Map<string, StopTime[]>([
    ['t1', [makeStopTime('t1', 's1', 1), makeStopTime('t1', 's3', 2), makeStopTime('t1', 's2', 3)]],
    ['t2', [makeStopTime('t2', 's2', 1), makeStopTime('t2', 's3', 2)]],
  ]);
  const stops = new Map([
    ['s1', makeStop('s1')],
    ['s2', makeStop('s2')],
    ['s3', makeStop('s3')],
  ]);

  it('orders stops by minimum sequence across trips', () => {
    expect(orderStopsBySequence(tripsByRoute, stopTimes, stops, 'r1').map((s) => s.stop_id)).toEqual([
      's1',
      's2',
      's3',
    ]);
  });

  it('returns empty for unknown route', () => {
    expect(orderStopsBySequence(tripsByRoute, stopTimes, stops, 'r999')).toEqual([]);
  });
});

describe('getRouteTypeName', () => {
  it('returns Spanish names for known route types', () => {
    expect(getRouteTypeName(0)).toBe('Tranvía');
    expect(getRouteTypeName(1)).toBe('Metro');
    expect(getRouteTypeName(2)).toBe('Tren');
    expect(getRouteTypeName(3)).toBe('Autobús');
    expect(getRouteTypeName(4)).toBe('Ferry');
    expect(getRouteTypeName(5)).toBe('Teleférico');
    expect(getRouteTypeName(6)).toBe('Funicular');
    expect(getRouteTypeName(7)).toBe('Trolebús');
    expect(getRouteTypeName(11)).toBe('Tranvía');
    expect(getRouteTypeName(12)).toBe('Monorraíl');
  });

  it('returns Desconocido for unknown route types', () => {
    expect(getRouteTypeName(-1)).toBe('Desconocido');
    expect(getRouteTypeName(99)).toBe('Desconocido');
  });
});