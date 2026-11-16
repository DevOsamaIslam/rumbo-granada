import type { Stop } from '@/types/gtfs';

// Local region type so web components don't depend on a map library.
export interface Region {
  latitude: number;
  longitude: number;
  zoomLevel: number;
}

export interface MapViewProps {
  initialRegion?: Region;
  selectedLineId?: string;
  /** When set, the map centres on this stop (e.g. arriving from the stop screen). */
  focusStop?: { latitude: number; longitude: number } | null;
  /** When set, only this stop's marker is shown (no other stops or route polylines). */
  focusStopId?: string;
  trackedBuses?: { id: string; latitude: number; longitude: number; heading?: number; label?: string }[];
  onStopPress?: (stop: Stop) => void;
  onBusPress?: (bus: { id: string; latitude: number; longitude: number }) => void;
  onRegionChange?: (region: Region) => void;
  showUserLocation?: boolean;
  followUserLocation?: boolean;
}

