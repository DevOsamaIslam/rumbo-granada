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
  arrivals: LiveApiArrival[];
}

export interface LiveApiArrival {
  line: string;
  destination: string;
  minutes: number;
  realtime: boolean;
  vehicleId?: string;
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