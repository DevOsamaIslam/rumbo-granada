// API Types

export interface LiveApiLineStopsResponse {
  line: string;
  stops: LiveApiStop[];
}

export interface LiveApiStop {
  stopId: string;
  stopName: string;
  lat: number;
  lon: number;
  order: number;
  distance?: number;
}

export interface LiveApiArrivalsResponse {
  stopId: string;
  arrivals: Arrival[];
}

/**
 * One row of the `paradas.htm` arrivals table.
 *
 * `minutes` is what the site reports (0 means "arriving now"); `scheduledTime` is
 * the wall-clock time printed next to it, e.g. `15:18`.
 */
export interface Arrival {
  lineCode: string;
  destination: string;
  minutes: number;
  scheduledTime: string;
  isRealTime: boolean;
}

/** One row of the `paradas.htm` search results (when `parada` is a name fragment). */
export interface StopSearchResult {
  stopCode: string;
  stopName: string;
}

export interface LiveApiBusPositionsResponse {
  buses: LiveApiBusPosition[];
}

export interface LiveApiBusPosition {
  vehicleId: string;
  line: string;
  lat: number;
  lon: number;
  bearing: number;
  speed: number;
  timestamp: number;
}