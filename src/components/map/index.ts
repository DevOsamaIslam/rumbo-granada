// Map components - main exports
// `./MapView` resolves to MapView.native.tsx on iOS/Android and MapView.tsx (web
// fallback) on web, so react-native-maps native codegen never runs on web.
// StopMarker/BusMarker/RoutePolyline/MapControls are native-only internals of
// MapView.native.tsx and are intentionally NOT re-exported here.
export { MapView } from './MapView';
export type { MapViewProps, MapStyle } from './types';