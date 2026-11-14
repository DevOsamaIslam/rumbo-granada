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
  trackedBuses?: { id: string; latitude: number; longitude: number; heading?: number }[];
  onStopPress?: (stop: Stop) => void;
  onBusPress?: (bus: { id: string; latitude: number; longitude: number }) => void;
  onRegionChange?: (region: Region) => void;
  showUserLocation?: boolean;
  followUserLocation?: boolean;
}

export type MapStyle = 'standard' | 'satellite';