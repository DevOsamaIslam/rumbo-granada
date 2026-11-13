// Tracking Types
export interface TrackedPair {
  id: string;
  routeId: string;
  routeShortName: string;
  stopId: string;
  stopName: string;
  label: string;
  thresholdMinutes: number;
  enabled: boolean;
  createdAt: number;
}

export interface TrackingState {
  trackedPairs: TrackedPair[];
  activeTrackingId: string | null;
}

export interface BusPosition {
  vehicleId: string;
  routeId: string;
  lat: number;
  lon: number;
  bearing: number;
  speed: number;
  timestamp: number;
  occupancy?: number;
}

export interface ArrivalPrediction {
  stopId: string;
  routeId: string;
  tripId: string;
  arrivalTime: number;
  departureTime: number;
  vehicleId?: string;
  realtime: boolean;
}