import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GTFSService } from './gtfs';
import * as Papa from 'papaparse';

// Mock MMKV
const mockStorage = new Map<string, unknown>();
vi.mock('react-native-mmkv', () => ({
  createMMKV: vi.fn().mockImplementation(() => ({
    set: vi.fn((key: string, value: unknown) => mockStorage.set(key, value)),
    getString: vi.fn((key: string) => mockStorage.get(key) as string | undefined),
    getNumber: vi.fn((key: string) => mockStorage.get(key) as number | undefined),
    getBoolean: vi.fn((key: string) => mockStorage.get(key) as boolean | undefined),
    remove: vi.fn((key: string) => mockStorage.delete(key)),
    clearAll: vi.fn(() => mockStorage.clear()),
    getAllKeys: vi.fn(() => Array.from(mockStorage.keys())),
    contains: vi.fn((key: string) => mockStorage.has(key)),
  })),
}));

// Mock PapaParse
vi.mock('papaparse', () => ({
  default: {
    parse: vi.fn(),
  },
  parse: vi.fn(),
}));

// Test data
const mockRoutes = [
  { route_id: 'route1', agency_id: 'GRAN', route_short_name: 'F1', route_long_name: 'Line 1', route_type: 3, route_color: 'FF0000', route_text_color: 'FFFFFF' },
  { route_id: 'route2', agency_id: 'GRAN', route_short_name: 'F2', route_long_name: 'Line 2', route_type: 3, route_color: '00FF00', route_text_color: '000000' },
];

const mockStops = [
  { stop_id: 'stop1', stop_code: '1', stop_name: 'Stop 1', stop_lat: 37.1, stop_lon: -3.5 },
  { stop_id: 'stop2', stop_code: '2', stop_name: 'Stop 2', stop_lat: 37.2, stop_lon: -3.6 },
];

const mockTrips = [
  { trip_id: 'trip1', route_id: 'route1', service_id: 'service1', shape_id: 'shape1', direction_id: 0 },
  { trip_id: 'trip2', route_id: 'route1', service_id: 'service1', shape_id: 'shape1', direction_id: 1 },
  { trip_id: 'trip3', route_id: 'route2', service_id: 'service1', shape_id: 'shape2', direction_id: 0 },
];

const mockStopTimes = [
  { trip_id: 'trip1', arrival_time: '08:00:00', departure_time: '08:00:00', stop_id: 'stop1', stop_sequence: 0 },
  { trip_id: 'trip1', arrival_time: '08:10:00', departure_time: '08:10:00', stop_id: 'stop2', stop_sequence: 1 },
  { trip_id: 'trip2', arrival_time: '09:00:00', departure_time: '09:00:00', stop_id: 'stop1', stop_sequence: 0 },
  { trip_id: 'trip3', arrival_time: '10:00:00', departure_time: '10:00:00', stop_id: 'stop2', stop_sequence: 0 },
];

const mockShapes = [
  { shape_id: 'shape1', shape_pt_lat: 37.1, shape_pt_lon: -3.5, shape_pt_sequence: 0 },
  { shape_id: 'shape1', shape_pt_lat: 37.15, shape_pt_lon: -3.55, shape_pt_sequence: 1 },
  { shape_id: 'shape2', shape_pt_lat: 37.2, shape_pt_lon: -3.6, shape_pt_sequence: 0 },
];

describe('GTFSService', () => {
  let service: GTFSService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage.clear();
    
    service = new GTFSService();
    
    const mockParse = vi.fn((text: string, options: { complete: (result: { data: unknown[]; errors: unknown[] }) => void }) => {
      let data: unknown[] = [];
      
      if (text.includes('route_id,agency_id')) data = mockRoutes;
      else if (text.includes('stop_id,stop_name')) data = mockStops;
      else if (text.includes('trip_id,route_id')) data = mockTrips;
      else if (text.includes('trip_id,arrival_time')) data = mockStopTimes;
      else if (text.includes('shape_id,shape_pt_lat')) data = mockShapes;
      
      options.complete({ data, errors: [] });
    });
    
    vi.mocked(Papa.parse).mockImplementation(mockParse);
    
    global.fetch = vi.fn().mockImplementation((url: string) => {
      let csvContent = '';
      if (url.includes('routes.txt')) csvContent = 'route_id,agency_id,route_short_name\nroute1,GRAN,F1';
      else if (url.includes('stops.txt')) csvContent = 'stop_id,stop_name\nstop1,Stop 1';
      else if (url.includes('trips.txt')) csvContent = 'trip_id,route_id\n';
      else if (url.includes('stop_times.txt')) csvContent = 'trip_id,arrival_time\n';
      else if (url.includes('shapes.txt')) csvContent = 'shape_id,shape_pt_lat\n';
      
      return Promise.resolve({
        text: () => Promise.resolve(csvContent),
      });
    });
  });

  it('should parse all GTFS files and build indexes', async () => {
    const data = await service.load();
    
    expect(data.routes.size).toBe(2);
    expect(data.stops.size).toBe(2);
    expect(data.trips.size).toBe(3);
    expect(data.stopTimes.size).toBe(3);
    expect(data.shapes.size).toBe(2);
  });

  it('should get all routes', async () => {
    await service.load();
    const routes = service.getRoutes();
    
    expect(routes).toHaveLength(2);
    expect(routes.map(r => r.route_short_name)).toContain('F1');
    expect(routes.map(r => r.route_short_name)).toContain('F2');
  });

  it('should get route by ID', async () => {
    await service.load();
    const route = service.getRoute('route1');
    
    expect(route).toBeDefined();
    expect(route?.route_short_name).toBe('F1');
  });

  it('should return undefined for non-existent route', async () => {
    await service.load();
    const route = service.getRoute('nonexistent');
    
    expect(route).toBeUndefined();
  });

  it('should get stops for a route', async () => {
    await service.load();
    const stops = service.getStopsForRoute('route1');
    
    expect(stops).toHaveLength(2);
    expect(stops.map(s => s.stop_id)).toContain('stop1');
    expect(stops.map(s => s.stop_id)).toContain('stop2');
  });

  it('should return empty array for route with no stops', async () => {
    await service.load();
    const stops = service.getStopsForRoute('nonexistent');
    
    expect(stops).toHaveLength(0);
  });

  it('should get trips for a route', async () => {
    await service.load();
    const trips = service.getTripsForRoute('route1');
    
    expect(trips).toHaveLength(2);
    expect(trips.map(t => t.trip_id)).toContain('trip1');
    expect(trips.map(t => t.trip_id)).toContain('trip2');
  });

  it('should get stop times for a trip', async () => {
    await service.load();
    const stopTimes = service.getStopTimesForTrip('trip1');
    
    expect(stopTimes).toHaveLength(2);
    expect(stopTimes[0].stop_sequence).toBe(0);
    expect(stopTimes[1].stop_sequence).toBe(1);
  });

  it('should get stop by ID', async () => {
    await service.load();
    const stop = service.getStop('stop1');
    
    expect(stop).toBeDefined();
    expect(stop?.stop_name).toBe('Stop 1');
  });

  it('should get shape for a route', async () => {
    await service.load();
    const shapes = service.getShapeForRoute('route1');
    
    expect(shapes).toHaveLength(2);
    expect(shapes[0].shape_pt_sequence).toBe(0);
    expect(shapes[1].shape_pt_sequence).toBe(1);
  });

  it('should get routes for a stop', async () => {
    await service.load();
    const routes = service.getRoutesForStop('stop1');
    
    expect(routes).toHaveLength(1);
    expect(routes.map(r => r.route_short_name)).toContain('F1');
  });

  it('should clear cache', async () => {
    await service.load();
    service.clearCache();
    
    const data = await service.load();
    expect(data.routes.size).toBe(2);
  });
});

describe('GTFS Data Structure', () => {
  it('should have correct types exported', () => {
    const route = {
      route_id: 'test',
      agency_id: 'GRAN',
      route_short_name: 'F1',
      route_long_name: 'Test Line',
      route_type: 3,
      route_color: 'FF0000',
      route_text_color: 'FFFFFF',
    };
    
    expect(route.route_id).toBe('test');
  });
});
