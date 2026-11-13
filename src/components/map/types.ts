import type { Region } from 'react-native-maps';
import type { Stop } from '@/types/gtfs';

export interface MapViewProps {
  initialRegion?: Region;
  selectedLineId?: string;
  trackedBuses?: { id: string; latitude: number; longitude: number; heading?: number }[];
  onStopPress?: (stop: Stop) => void;
  onBusPress?: (bus: { id: string; latitude: number; longitude: number }) => void;
  onRegionChange?: (region: Region) => void;
  showUserLocation?: boolean;
  followUserLocation?: boolean;
  enableClustering?: boolean;
}

export type MapStyle = 'standard' | 'satellite';