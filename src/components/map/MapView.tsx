// Web-safe MapView entry point.
// Metro resolves this file on web (react-native-maps native codegen is not
// web-compatible), while MapView.native.tsx is resolved on iOS/Android.
import { MapWebFallback } from './MapViewWeb';
import type { MapViewProps, MapStyle } from './types';

export type { MapViewProps, MapStyle };

export function MapView({
  initialRegion,
}: MapViewProps) {
  return <MapWebFallback initialRegion={initialRegion} />;
}

export default MapView;