// Native map view built on MapLibre (OpenStreetMap tiles) — no Google Maps.
// On web, `./MapView.tsx` resolves instead of this file.
import React, { useRef, useEffect, useCallback, useMemo, useState } from "react";
import { NativeSyntheticEvent, StyleSheet, View } from "react-native";
import {
  Map,
  Camera,
  UserLocation,
  type CameraRef,
  type ViewStateChangeEvent,
} from "@maplibre/maplibre-react-native";
import type { StyleSpecification } from "@maplibre/maplibre-gl-style-spec";
import { useLines } from "@/hooks/useLines";
import { useStops } from "@/hooks/useStops";
import { gtfsService } from "@/services/gtfs";
import { Storage } from "@/services/storage";
import { CONFIG } from "@/constants/config";
import { StopMarker } from "./StopMarker.native";
import { BusMarker } from "./BusMarker.native";
import { RoutePolyline } from "./RoutePolyline.native";
import { MapControls } from "./MapControls.native";
import type { MapViewProps, MapStyle } from "./types";

export type { MapViewProps, MapStyle };

const STORAGE_KEY_MAP_REGION = "rumbo-granada.map.region";
const STORAGE_KEY_MAP_STYLE = "rumbo-granada.map.style";

interface MapRegion {
  latitude: number;
  longitude: number;
  zoomLevel: number;
}

const DEFAULT_REGION: MapRegion = {
  latitude: CONFIG.MAP_DEFAULT_LAT,
  longitude: CONFIG.MAP_DEFAULT_LNG,
  zoomLevel: CONFIG.MAP_DEFAULT_ZOOM,
};

/** Zoom used when the map is asked to focus a single stop. */
const MAP_FOCUS_ZOOM = 16;

// OpenFreeMap Liberty vector tiles — minimalist style.
// Keeps only road names, place (neighbourhood / town / city) names and
// establishment (POI) labels. Buildings, land use, water, boundaries
// and other map details are hidden. No API key required.
// Tiles max out at zoom 14; markers and route polylines render above that.
const OSM_STANDARD_STYLE: StyleSpecification = {
  version: 8,
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  sources: {
    openmaptiles: {
      type: "vector",
      url: "https://tiles.openfreemap.org/planet",
      attribution:
        '© OpenMapTiles | Data © OpenStreetMap contributors | https://openfreemap.org',
    },
  },
  layers: [
    {
      id: "background",
      type: "background",
      paint: {
        "background-color": "#f8f4f0",
      },
    },
    // Road geometry — light lines so roads are visible but not dominant.
    {
      id: "road-geometry",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: [
        "in",
        "class",
        "motorway",
        "trunk",
        "primary",
        "secondary",
        "tertiary",
        "residential",
        "service",
      ],
      minzoom: 9,
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#e8e4dc",
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          9,
          0.5,
          14,
          2,
        ],
      },
    },
    // Road names.
    {
      id: "road-name",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "transportation_name",
      filter: [
        "in",
        "class",
        "motorway",
        "trunk",
        "primary",
        "secondary",
        "tertiary",
        "residential",
      ],
      minzoom: 12,
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Noto Sans Regular"],
        "text-size": 11,
        "text-max-angle": 40,
      },
      paint: {
        "text-color": "#5d5d5d",
        "text-halo-color": "#ffffff",
        "text-halo-width": 2,
      },
    },
    // Place (neighbourhood / town / city) names.
    {
      id: "place-label",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      filter: ["in", "class", "city", "town", "village"],
      minzoom: 12,
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Noto Sans Regular"],
        "text-size": 12,
      },
      paint: {
        "text-color": "#7d6d6d",
        "text-halo-color": "#ffffff",
        "text-halo-width": 2,
      },
    },
    // Establishment (POI) labels — shops, restaurants, hospitals, etc.
    {
      id: "poi-label",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "poi",
      filter: ["has", "name"],
      minzoom: 14,
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Noto Sans Regular"],
        "text-size": 10,
      },
      paint: {
        "text-color": "#6b7280",
        "text-halo-color": "#ffffff",
        "text-halo-width": 2,
      },
    },
  ],
};

const SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "© Esri World Imagery",
    },
  },
  layers: [
    {
      id: "satellite",
      type: "raster",
      source: "satellite",
    },
  ],
};

export function MapViewComponent({
  initialRegion,
  selectedLineId,
  focusStop = null,
  focusStopId,
  trackedBuses = [],
  onStopPress,
  onBusPress,
  onRegionChange,
  showUserLocation = true,
  followUserLocation = false,
}: MapViewProps) {
  const { routes, loadLines } = useLines();
  const { stops, loadStopsForRoute, loadAllStops } = useStops();
  const cameraRef = useRef<CameraRef>(null);

  // When focusStopId is set, only show that one stop's marker.
  const focusedStop = useMemo(() => {
    if (!focusStopId) return null;
    return gtfsService.getStop(focusStopId) ?? null;
  }, [focusStopId]);

  const stopsToShow = useMemo(() => (focusedStop ? [focusedStop] : stops), [focusedStop, stops]);

  // Load every GTFS stop so all stop markers render on the map (when no line is selected and no single stop is focused).
  useEffect(() => {
    if (!focusStopId && !selectedLineId && routes.length > 0) {
      void loadAllStops();
    }
  }, [routes.length, loadAllStops, selectedLineId, focusStopId]);

  // Load the stops for the selected line (when a line is chosen and no single stop is focused).
  useEffect(() => {
    if (!focusStopId && selectedLineId) {
      void loadStopsForRoute(selectedLineId);
    }
  }, [selectedLineId, loadStopsForRoute, focusStopId]);

  // Route lines that serve at least one of the displayed stops.
  const routesServingStops = useMemo(() => {
    const routeIds = new Set<string>();
    for (const stop of stopsToShow) {
      for (const route of gtfsService.getRoutesForStop(stop.stop_id)) {
        routeIds.add(route.route_id);
      }
    }
    return routes.filter((route) => routeIds.has(route.route_id));
  }, [stopsToShow, routes]);
  const [region, setRegion] = useState<MapRegion>(() => {
    try {
      const savedRegion = Storage.getItem(STORAGE_KEY_MAP_REGION);
      if (savedRegion) {
        const parsed = JSON.parse(savedRegion) as MapRegion;
        if (
          typeof parsed.latitude === "number" &&
          typeof parsed.longitude === "number" &&
          typeof parsed.zoomLevel === "number"
        ) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn("Failed to load persisted map region:", error);
    }
    return initialRegion ?? DEFAULT_REGION;
  });
  const [mapStyle, setMapStyle] = useState<MapStyle>(() => {
    const savedStyle = Storage.getItem(STORAGE_KEY_MAP_STYLE);
    return savedStyle === "standard" || savedStyle === "satellite"
      ? savedStyle
      : "standard";
  });
  const [followMode, setFollowMode] = useState(followUserLocation);

  useEffect(() => {
    Storage.setItem(STORAGE_KEY_MAP_STYLE, mapStyle);
  }, [mapStyle]);

  useEffect(() => {
    loadLines();
  }, [loadLines]);

  useEffect(() => {
    if (selectedLineId) {
      loadStopsForRoute(selectedLineId);
    }
  }, [selectedLineId, loadStopsForRoute]);

  const handleRegionChange = useCallback(
    (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
      const { center, zoom } = event.nativeEvent;
      // MapLibre LngLat is [longitude, latitude]
      const nextRegion: MapRegion = {
        longitude: center[0],
        latitude: center[1],
        zoomLevel: zoom,
      };
      setRegion(nextRegion);
      Storage.setItem(STORAGE_KEY_MAP_REGION, JSON.stringify(nextRegion));
      onRegionChange?.(nextRegion);
    },
    [onRegionChange],
  );

  const handleRecenter = useCallback(() => {
    cameraRef.current?.easeTo({
      center: [DEFAULT_REGION.longitude, DEFAULT_REGION.latitude],
      zoom: DEFAULT_REGION.zoomLevel,
      duration: 500,
    });
  }, []);

  const handleZoomIn = useCallback(() => {
    cameraRef.current?.zoomTo(region.zoomLevel + 1, { duration: 300 });
  }, [region.zoomLevel]);

  const handleZoomOut = useCallback(() => {
    cameraRef.current?.zoomTo(region.zoomLevel - 1, { duration: 300 });
  }, [region.zoomLevel]);

  const handleToggleStyle = useCallback(() => {
    setMapStyle((prev) => (prev === "standard" ? "satellite" : "standard"));
  }, []);

  const handleToggleFollow = useCallback(() => {
    setFollowMode((prev) => !prev);
  }, []);

  // Centre the map on a stop when the caller asks for it (e.g. "Show on map"
  // from the stop detail screen). Only fires when the focused stop changes.
  const focusLat = focusStop?.latitude;
  const focusLon = focusStop?.longitude;
  useEffect(() => {
    if (focusLat === undefined || focusLon === undefined) return;
    cameraRef.current?.easeTo({
      center: [focusLon, focusLat],
      zoom: MAP_FOCUS_ZOOM,
      duration: 500,
    });
  }, [focusLat, focusLon]);

  return (
    <View style={styles.container}>
      <Map
        style={StyleSheet.absoluteFill}
        mapStyle={mapStyle === "standard" ? OSM_STANDARD_STYLE : SATELLITE_STYLE}
        onRegionDidChange={handleRegionChange}
        attribution={true}
      >
        <Camera
          ref={cameraRef}
          initialViewState={{
            center: [region.longitude, region.latitude],
            zoom: region.zoomLevel,
          }}
          minZoom={3}
          maxZoom={19}
          trackUserLocation={followMode ? "default" : undefined}
        />
        {showUserLocation && <UserLocation />}
        {/* When a specific line is selected, show only its shape. */}
        {!focusStopId && selectedLineId && (
          <RoutePolyline lineId={selectedLineId} routes={routes} zoomLevel={region.zoomLevel} />
        )}
        {/* Otherwise, when no line is selected and no single stop is focused, draw lines serving each stop when zoomed in sufficiently. */}
        {!focusStopId && !selectedLineId &&
          routesServingStops.map((route) => (
            <RoutePolyline
              key={route.route_id}
              lineId={route.route_id}
              routes={routes}
              zoomLevel={region.zoomLevel}
            />
          ))}
        {stopsToShow.map((stop) => (
          <StopMarker
            key={stop.stop_id}
            lngLat={[stop.stop_lon, stop.stop_lat]}
            stop={stop}
            routes={gtfsService.getRoutesForStop(stop.stop_id)}
            zoomLevel={region.zoomLevel}
            onPress={onStopPress}
          />
        ))}
        {trackedBuses.map((bus) => (
          <BusMarker
            key={bus.id}
            lngLat={[bus.longitude, bus.latitude]}
            heading={bus.heading}
            onPress={onBusPress}
          />
        ))}
      </Map>
      <MapControls
        onRecenter={handleRecenter}
        onToggleFollow={handleToggleFollow}
        followMode={followMode}
        onToggleStyle={handleToggleStyle}
        mapStyle={mapStyle}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export { MapViewComponent as MapView };
export default MapViewComponent;
