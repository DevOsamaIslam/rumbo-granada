// Web-safe MapView entry point.
// Metro resolves this file on web (MapLibre native codegen is not
// web-compatible), while MapView.native.tsx is resolved on iOS/Android.
import { MapWebFallback } from './MapViewWeb';
import type { MapViewProps } from './types';

export type { MapViewProps };

export function MapView({
  initialRegion,
}: MapViewProps) {
  return <MapWebFallback initialRegion={initialRegion} />;
}

export default MapView;