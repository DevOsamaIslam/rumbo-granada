# 06 — Map Integration

## Stack

- **react-native-maps** — Native map view (Google Maps on Android, Apple Maps on iOS)
- **OpenStreetMap tiles** — Free, open map tiles via custom TileOverlay
- **react-native-maps-super-cluster** — Marker clustering (optional)

## MapView Component (`src/components/map/MapView.tsx`)

```tsx
import MapView, { Marker, Callout, Polyline, TileOverlay } from 'react-native-maps';
import { useLocation } from '@/hooks/useLocation';
import { useLines, useStopsForLine } from '@/hooks/useLines';
import { StopMarker } from './StopMarker';
import { BusMarker } from './BusMarker';
import { RoutePolyline } from './RoutePolyline';
import { MapControls } from './MapControls';

export function MapView({ 
  initialRegion, 
  selectedLineId, 
  trackedBuses,
  onStopPress,
  onBusPress 
}: MapViewProps) {
  const { location, loading: locationLoading } = useLocation();
  const { data: lines } = useLines();
  const { data: stops } = useStopsForLine(selectedLineId);

  const region = initialRegion ?? location ?? DEFAULT_REGION;

  return (
    <MapView
      style={styles.map}
      initialRegion={region}
      showsUserLocation={true}
      followsUserLocation={false}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : null}
      customMapStyle={OSM_STYLE}
    >
      <TileOverlay
        tileSize={256}
        urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maximumZ={19}
        subdomains={['a', 'b', 'c']}
      />

      {selectedLineId && <RoutePolyline lineId={selectedLineId} />}

      {stops?.map((stop) => (
        <StopMarker
          key={stop.stop_id}
          stop={stop}
          onPress={onStopPress}
          isFavorite={isFavoriteStop(stop.stop_id)}
        />
      ))}

      {trackedBuses.map((bus) => (
        <BusMarker
          key={bus.id}
          bus={bus}
          onPress={onBusPress}
        />
      ))}

      {location && (
        <Marker
          coordinate={location}
          image={require('@/assets/images/user-location.png')}
          tracksViewChanges={false}
        />
      )}

      <MapControls onRecenter={() => recenter(location)} />
    </MapView>
  );
}
## OSM Tile Overlay

```tsx
<TileOverlay
  tileSize={256}
  urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  maximumZ={19}
  minimumZ={2}
  subdomains={['a', 'b', 'c']}
  attribution="© OpenStreetMap contributors"
/>
```

**Alternative tile servers** (for production):
- `https://tile.openstreetmap.org/{z}/{x}/{y}.png` (official)
- `https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png` (requires API key)
- `https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png`

## Stop Marker (`src/components/map/StopMarker.tsx`)

```tsx
import { Marker, Callout } from 'react-native-maps';
import { Text, View, IconButton } from 'react-native-paper';
import { useFavoritesStore } from '@/store/favorites';

interface StopMarkerProps {
  stop: Stop;
  onPress: (stop: Stop) => void;
  isFavorite: boolean;
}

export function StopMarker({ stop, onPress, isFavorite }: StopMarkerProps) {
  const { addFavoriteStop, removeFavoriteStop } = useFavoritesStore();
  const toggleFavorite = () => {
    if (isFavorite) removeFavoriteStop(stop.stop_id);
    else addFavoriteStop(stop.stop_id, stop.stop_name);
  };

  return (
    <Marker
      coordinate={{ latitude: stop.stop_lat, longitude: stop.stop_lon }}
      onPress={() => onPress(stop)}
      image={require('@/assets/images/stop-marker.png')}
      tracksViewChanges={false}
      zIndex={10}
    >
      <Callout tooltip={true}>
        <View style={styles.callout}>
          <Text style={styles.stopName}>{stop.stop_name}</Text>
          <Text style={styles.stopCode}>Stop #{stop.stop_code}</Text>
          <View style={styles.calloutActions}>
            <IconButton
              icon={isFavorite ? 'star' : 'star-outline'}
              onPress={toggleFavorite}
              size={20}
              accessibilityLabel={isFavorite ? 'Remove favorite' : 'Add favorite'}
            />
            <IconButton
              icon="map-marker"
              onPress={() => onPress(stop)}
              size={20}
              accessibilityLabel="Show on map"
            />
          </View>
        </View>
      </Callout>
    </Marker>
  );
}
```

## Bus Marker (`src/components/map/BusMarker.tsx`)

```tsx
import { Marker } from 'react-native-maps';
import { Animated, Image } from 'react-native';
import { useBusPosition } from '@/hooks/useStops';

interface BusMarkerProps {
  bus: TrackedBus;
  onPress: (bus: TrackedBus) => void;
}

export function BusMarker({ bus, onPress }: BusMarkerProps) {
  const { data: position } = useBusPosition(bus.id);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (position?.bearing !== undefined) {
      rotation.value = withTiming(position.bearing, { duration: 500 });
    }
  }, [position?.bearing]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Marker
      coordinate={position?.coordinate ?? bus.lastKnownCoordinate}
      onPress={() => onPress(bus)}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={true}
      zIndex={20}
    >
      <Animated.View style={animatedStyle}>
        <Image
          source={require('@/assets/images/bus-marker.png')}
          style={styles.busIcon}
        />
      </Animated.View>
    </Marker>
  );
}
```
## Route Polyline (`src/components/map/RoutePolyline.tsx`)

```tsx
import { Polyline } from 'react-native-maps';
import { useLineShape } from '@/hooks/useLines';
import { decodePolyline } from '@/utils/gtfs';

interface RoutePolylineProps {
  lineId: string;
}

export function RoutePolyline({ lineId }: RoutePolylineProps) {
  const { data: shape } = useLineShape(lineId);
  const coordinates = shape ? decodePolyline(shape.points) : [];

  if (coordinates.length === 0) return null;

  return (
    <Polyline
      coordinates={coordinates}
      strokeColor="#1976D2"
      strokeWidth={4}
      geodesic={true}
      zIndex={5}
    />
  );
}
```

## Map Clustering

```tsx
// Option 1: react-native-maps-super-cluster
import { SuperCluster } from 'react-native-maps-super-cluster';

<SuperCluster
  markers={stops.map(toMarker)}
  clusterRadius={40}
  minZoom={0}
  maxZoom={19}
  renderCluster={(cluster) => (
    <Marker
      coordinate={cluster.coordinate}
      image={getClusterImage(cluster.pointCount)}
    />
  )}
/>

// Option 2: Custom clustering
function clusterMarkers(stops: Stop[], zoom: number): MarkerData[] {
  const gridSize = Math.max(0.001, 0.01 / Math.pow(2, zoom - 10));
  const clusters = new Map<string, Stop[]>();
  
  stops.forEach((stop) => {
    const gridX = Math.floor(stop.stop_lon / gridSize);
    const gridY = Math.floor(stop.stop_lat / gridSize);
    const key = `${gridX},${gridY}`;
    if (!clusters.has(key)) clusters.set(key, []);
    clusters.get(key)!.push(stop);
  });

  return Array.from(clusters.entries()).map(([key, stops]) => {
    if (stops.length === 1) return toMarker(stops[0]);
    const avgLat = stops.reduce((a, b) => a + b.stop_lat, 0) / stops.length;
    const avgLon = stops.reduce((a, b) => a + b.stop_lon, 0) / stops.length;
    return { coordinate: { latitude: avgLat, longitude: avgLon }, count: stops.length };
  });
}
```

## Map Controls (`src/components/map/MapControls.tsx`)

```tsx
import { View, IconButton } from 'react-native-paper';
import { useMapRef } from '@/hooks/useMap';

interface MapControlsProps {
  onRecenter: () => void;
}

export function MapControls({ onRecenter }: MapControlsProps) {
  const mapRef = useMapRef();

  return (
    <View style={styles.controlsContainer} pointerEvents="box-none">
      <View style={styles.controlGroup}>
        <IconButton
          icon="my-location"
          onPress={onRecenter}
          size={28}
          accessibilityLabel="Recenter to my location"
        />
        <IconButton
          icon="plus"
          onPress={() => mapRef.current?.animateToRegion({ ...region, latitudeDelta: region.latitudeDelta / 2 })}
          size={28}
          accessibilityLabel="Zoom in"
        />
        <IconButton
          icon="minus"
          onPress={() => mapRef.current?.animateToRegion({ ...region, latitudeDelta: region.latitudeDelta * 2 })}
          size={28}
          accessibilityLabel="Zoom out"
        />
      </View>
    </View>
  );
}
```

## Default Region (Granada, Spain)

```ts
// src/constants/config.ts
export const DEFAULT_REGION = {
  latitude: 37.1773,
  longitude: -3.5986,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};
```

## Performance Tips

1. **Use `tracksViewChanges={false}`** for static markers (stops)
2. **Use `tracksViewChanges={true}`** only for animated markers (buses)
3. **Memoize marker components** with `React.memo`
4. **Cluster markers** at low zoom levels
5. **Limit polyline points** — simplify shapes with Douglas-Peucker
6. **Use `zIndex`** to layer: polyline (5) < stops (10) < buses (20) < controls (30)
```