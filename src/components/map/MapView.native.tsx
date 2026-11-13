import React, { useRef, useEffect, useCallback, useState } from "react";
import { Platform, StyleSheet, View, Text } from "react-native";
import { useLocation } from "@/hooks/useLocation";
import { useLines } from "@/hooks/useLines";
import { useStops } from "@/hooks/useStops";
import { Storage } from "@/services/storage";
import { CONFIG } from "@/constants/config";
import { Stop } from "@/types/gtfs";

import type { Region } from "react-native-maps";

import MapView, {
  Marker,
  Callout,
  UrlTile,
  PROVIDER_GOOGLE,
} from "react-native-maps";

import { StopMarker } from "./StopMarker.native";
import { BusMarker } from "./BusMarker.native";
import { RoutePolyline } from "./RoutePolyline.native";
import { MapControls } from "./MapControls.native";
import { MapWebFallback } from "./MapViewWeb";
import type { MapViewProps, MapStyle } from "./types";

export type { MapViewProps, MapStyle };

interface StopMarkerData {
  coordinate: { latitude: number; longitude: number };
  stop: Stop;
  isCluster?: boolean;
  pointCount?: number;
}

const DEFAULT_REGION: Region = {
  latitude: CONFIG.MAP_DEFAULT_LAT,
  longitude: CONFIG.MAP_DEFAULT_LNG,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const OSM_STANDARD_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_SATELLITE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const STORAGE_KEY_MAP_REGION = "map-region";
const STORAGE_KEY_MAP_STYLE = "map-style";

export function MapViewComponent({
  initialRegion,
  selectedLineId,
  trackedBuses = [],
  onStopPress,
  onBusPress,
  onRegionChange,
  showUserLocation = true,
  followUserLocation = false,
  enableClustering = true,
}: MapViewProps) {
  const { location: userLocation, watchLocation } = useLocation();
  const { routes, loadLines } = useLines();
  const { stops, loadStopsForRoute } = useStops();
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(initialRegion ?? DEFAULT_REGION);
  const [mapStyle, setMapStyle] = useState<MapStyle>('standard');
  const [clusteredMarkers, setClusteredMarkers] = useState<StopMarkerData[]>([]);
  const [followMode, setFollowMode] = useState(followUserLocation);

  useEffect(() => {
    const loadPersistedState = async () => {
      try {
        const savedRegion = Storage.getItem(STORAGE_KEY_MAP_REGION);
        const savedStyle = Storage.getItem(STORAGE_KEY_MAP_STYLE) as MapStyle | undefined;

        if (savedRegion) {
          const parsed = JSON.parse(savedRegion);
          setRegion(parsed);
        }
        if (savedStyle) {
          setMapStyle(savedStyle);
        }
      } catch (error) {
        console.warn('Failed to load persisted map state:', error);
      }
    };
    loadPersistedState();
  }, []);

  useEffect(() => {
    if (region) {
      Storage.setItem(STORAGE_KEY_MAP_REGION, JSON.stringify(region));
      onRegionChange?.(region);
    }
  }, [region, onRegionChange]);

  useEffect(() => {
    Storage.setItem(STORAGE_KEY_MAP_STYLE, mapStyle);
  }, [mapStyle]);

  useEffect(() => {
    if (!followMode) return;

    const cleanup = watchLocation((newLocation) => {
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            ...newLocation,
            latitudeDelta: region.latitudeDelta,
            longitudeDelta: region.longitudeDelta,
          },
          1000
        );
      }
    });

    return cleanup;
  }, [followMode, region.latitudeDelta, region.longitudeDelta, watchLocation]);

  useEffect(() => {
    loadLines();
  }, [loadLines]);

  useEffect(() => {
    if (selectedLineId) {
      loadStopsForRoute(selectedLineId);
    }
  }, [selectedLineId, loadStopsForRoute]);

  useEffect(() => {
    if (!enableClustering || stops.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setClusteredMarkers(
        stops.map((stop) => ({
          coordinate: { latitude: stop.stop_lat, longitude: stop.stop_lon },
          stop,
        }))
      );
      return;
    }
    const gridSize = Math.max(0.001, 0.01 / Math.pow(2, 15 - 10));
    const clusters = new Map<string, Stop[]>();
    stops.forEach((stop) => {
      const gridX = Math.floor(stop.stop_lon / gridSize);
      const gridY = Math.floor(stop.stop_lat / gridSize);
      const key = `${gridX},${gridY}`;
      if (!clusters.has(key)) clusters.set(key, []);
      clusters.get(key)!.push(stop);
    });
    const markers: StopMarkerData[] = Array.from(clusters.entries()).map(([, clusterStops]) => {
      if (clusterStops.length === 1) {
        return {
          coordinate: {
            latitude: clusterStops[0].stop_lat,
            longitude: clusterStops[0].stop_lon,
          },
          stop: clusterStops[0],
        };
      }
      const avgLat = clusterStops.reduce((a, b) => a + b.stop_lat, 0) / clusterStops.length;
      const avgLon = clusterStops.reduce((a, b) => a + b.stop_lon, 0) / clusterStops.length;
      return {
        coordinate: { latitude: avgLat, longitude: avgLon },
        stop: clusterStops[0],
        isCluster: true,
        pointCount: clusterStops.length,
      };
    });
    setClusteredMarkers(markers);
  }, [stops, enableClustering]);

  const handleRegionChange = useCallback((newRegion: Region) => {
    setRegion(newRegion);
  }, []);

  const handleRegionChangeComplete = useCallback((newRegion: Region) => {
    setRegion(newRegion);
  }, []);

  const toggleFollowMode = useCallback(() => {
    setFollowMode((prev) => !prev);
  }, []);

  const recenterToUser = useCallback(() => {
    if (userLocation) {
      mapRef.current?.animateToRegion(
        {
          ...userLocation,
          latitudeDelta: region.latitudeDelta,
          longitudeDelta: region.longitudeDelta,
        },
        1000
      );
    }
  }, [userLocation, region.latitudeDelta, region.longitudeDelta]);

  const toggleMapStyle = useCallback(() => {
    setMapStyle((prev) => (prev === 'standard' ? 'satellite' : 'standard'));
  }, []);

  const getTileUrl = useCallback(() => {
    return mapStyle === 'standard' ? OSM_STANDARD_URL : OSM_SATELLITE_URL;
  }, [mapStyle]);

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={region}
      onRegionChange={handleRegionChange}
      onRegionChangeComplete={handleRegionChangeComplete}
      showsUserLocation={showUserLocation}
      followsUserLocation={followMode}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      customMapStyle={mapStyle === 'standard' ? [] : undefined}
      maxZoomLevel={CONFIG.MAP_MAX_ZOOM}
      minZoomLevel={CONFIG.MAP_MIN_ZOOM}
      showsCompass={true}
      showsScale={true}
      rotateEnabled={true}
      scrollEnabled={true}
      zoomEnabled={true}
      pitchEnabled={true}
    >
      <UrlTile
        tileSize={256}
        urlTemplate={getTileUrl()}
        maximumZ={19}
        minimumZ={2}
      />

      {selectedLineId && <RoutePolyline lineId={selectedLineId} routes={routes} />}

      {clusteredMarkers.map((markerData, index) => (
        <StopMarker
          key={`${markerData.coordinate.latitude},${markerData.coordinate.longitude},${index}`}
          coordinate={markerData.coordinate}
          stop={markerData.stop}
          isCluster={markerData.isCluster}
          pointCount={markerData.pointCount}
          onPress={onStopPress}
        />
      ))}

      {trackedBuses.map((bus) => (
        <BusMarker
          key={bus.id}
          coordinate={{ latitude: bus.latitude, longitude: bus.longitude }}
          heading={bus.heading}
          onPress={onBusPress}
        />
      ))}

      {showUserLocation && userLocation && (
        <Marker
          coordinate={userLocation}
          image={require('@/assets/images/user-location.png')}
          tracksViewChanges={false}
          zIndex={100}
        >
          <Callout style={styles.callout}>
            <View style={styles.calloutContent}>
              <Text style={styles.calloutText}>Tu ubicación</Text>
            </View>
          </Callout>
        </Marker>
      )}

      <MapControls
        onRecenter={recenterToUser}
        onToggleFollow={toggleFollowMode}
        followMode={followMode}
        onToggleStyle={toggleMapStyle}
        mapStyle={mapStyle}
      />
    </MapView>
  );
};

export function MapViewComponentWrapper(props: MapViewProps) {
  const isWeb = Platform.OS === 'web';
  
  if (isWeb) {
    return <MapWebFallback initialRegion={props.initialRegion} />;
  }
  
  return <MapViewComponent {...props} />;
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  callout: {
    padding: 8,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  calloutContent: { padding: 4 },
  calloutText: { fontSize: 14, fontWeight: '600', color: '#333' },
  calloutSubText: { fontSize: 12, color: '#666', marginTop: 2 },
});

export { MapViewComponentWrapper as MapView };
export default MapViewComponentWrapper;
