// Native map view built on MapLibre (OpenStreetMap tiles) — no Google Maps.
// On web, `./MapView.tsx` resolves instead of this file.
import React, { useRef, useEffect, useCallback, useMemo, useState } from "react";
import { Alert, NativeSyntheticEvent, StyleSheet, View, useWindowDimensions } from "react-native";
import {
  Map,
  Camera,
  UserLocation,
  type CameraRef,
  type ViewStateChangeEvent,
} from "@maplibre/maplibre-react-native";
import type { StyleSpecification } from "@maplibre/maplibre-gl-style-spec";
import { useTranslation } from "react-i18next";
import { useLines } from "@/hooks/useLines";
import { useStops } from "@/hooks/useStops";
import { useLocation } from "@/hooks/useLocation";
import { gtfsService } from "@/services/gtfs";
import { Storage } from "@/services/storage";
import { CONFIG } from "@/constants/config";
import {
  MAX_VIEWPORT_STOPS,
  REGION_THROTTLE_MS,
  boundsFromRegion,
  filterStopsInViewport,
  isRegionUpdateDue,
  toViewportBounds,
  type LngLatBounds,
  type ViewportBounds,
} from "@/utils/viewport";
import { StopMarker } from "./StopMarker.native";
import { BusMarker } from "./BusMarker.native";
import { RoutePolyline } from "./RoutePolyline.native";
import { MapControls } from "./MapControls.native";
import type { MapViewProps } from "./types";
import { useSettingsStore } from "@/store/settings";

export type { MapViewProps };

const STORAGE_KEY_MAP_REGION = "rumbo-granada.map.region";

interface MapRegion {
  latitude: number;
  longitude: number;
  zoomLevel: number;
}

interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

// Granada bounding box — keeps the map pannable only within the city area.
const GRANADA_BOUNDS: MapBounds = {
  minLat: 37.115,
  maxLat: 37.225,
  minLng: -3.670,
  maxLng: -3.540,
};

const DEFAULT_REGION: MapRegion = {
  latitude: CONFIG.MAP_DEFAULT_LAT,
  longitude: CONFIG.MAP_DEFAULT_LNG,
  zoomLevel: CONFIG.MAP_DEFAULT_ZOOM,
};

/** Clamp a region so it never pans outside Granada. */
function clampRegion(region: MapRegion): MapRegion {
  return {
    ...region,
    latitude: Math.min(
      Math.max(region.latitude, GRANADA_BOUNDS.minLat),
      GRANADA_BOUNDS.maxLat
    ),
    longitude: Math.min(
      Math.max(region.longitude, GRANADA_BOUNDS.minLng),
      GRANADA_BOUNDS.maxLng
    ),
  };
}

/** Zoom used when the map is asked to focus a single stop. */
const MAP_FOCUS_ZOOM = 16;

// OpenFreeMap Liberty vector tiles — minimalist style.
// Keeps only road names, place (neighbourhood / town / city) names,
// establishment (POI) labels and multicolor building footprints.
// No API key required.
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
    // Building footprints — multicolor fills with thin outlines (zoom 13+).
    // Drawn before labels so road/place/POI names stay visible on top.
    {
      id: "building-fill",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "building",
      minzoom: 13,
      paint: {
        "fill-color": ["case", ["has", "colour"], ["get", "colour"], "#e8e4dc"],
        "fill-opacity": 0.85,
      },
    },
    {
      id: "building-outline",
      type: "line",
      source: "openmaptiles",
      "source-layer": "building",
      minzoom: 13,
      paint: {
        "line-color": "#7f7f7f",
        "line-width": 0.5,
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
      minzoom: 10,
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
      minzoom: 4,
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
      minzoom: 18,
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

// Dark variant of the OpenFreeMap Liberty style for the "Oscuro" map setting.
// Mirrors OSM_STANDARD_STYLE with a dark canvas and lighter strokes/labels.
const OSM_DARK_STYLE: StyleSpecification = {
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
    { id: "background", type: "background", paint: { "background-color": "#1a1a1a" } },
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
        "line-color": "#444444",
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
    {
      id: "building-fill",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "building",
      minzoom: 13,
      paint: {
        "fill-color": ["case", ["has", "colour"], ["get", "colour"], "#333333"],
        "fill-opacity": 0.85,
      },
    },
    {
      id: "building-outline",
      type: "line",
      source: "openmaptiles",
      "source-layer": "building",
      minzoom: 13,
      paint: { "line-color": "#555555", "line-width": 0.5 },
    },
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
      minzoom: 10,
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Noto Sans Regular"],
        "text-size": 11,
        "text-max-angle": 40,
      },
      paint: {
        "text-color": "#bbbbbb",
        "text-halo-color": "#000000",
        "text-halo-width": 2,
      },
    },
    {
      id: "place-label",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      filter: ["in", "class", "city", "town", "village"],
      minzoom: 4,
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Noto Sans Regular"],
        "text-size": 12,
      },
      paint: {
        "text-color": "#cccccc",
        "text-halo-color": "#000000",
        "text-halo-width": 2,
      },
    },
    {
      id: "poi-label",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "poi",
      filter: ["has", "name"],
      minzoom: 18,
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Noto Sans Regular"],
        "text-size": 10,
      },
      paint: {
        "text-color": "#aaaaaa",
        "text-halo-color": "#000000",
        "text-halo-width": 2,
      },
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
  const { mapStyle, autoFollowUser, showBusLabels } = useSettingsStore();
  const { t } = useTranslation();
  const cameraRef = useRef<CameraRef>(null);

  // When focusStopId is set, only show that one stop's marker.
  const focusedStop = useMemo(() => {
    if (!focusStopId) return null;
    return gtfsService.getStop(focusStopId) ?? null;
  }, [focusStopId]);

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
  // Visible viewport reported by MapLibre, used to decide which stop markers
  // are mounted. `null` until the map reports its first region; the camera
  // region keeps a fallback so the first frame doesn't mount every stop.
  const [viewportBounds, setViewportBounds] = useState<ViewportBounds | null>(null);
  const lastViewportUpdateRef = useRef(0);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const effectiveViewport = useMemo(
    () =>
      viewportBounds ??
      boundsFromRegion(region, { width: windowWidth, height: windowHeight }),
    [viewportBounds, region, windowWidth, windowHeight],
  );

  const stopsToShow = useMemo(() => {
    if (focusedStop) return [focusedStop];
    // Only mount the stops inside the visible area (plus a margin) — the map
    // adds/removes markers as the viewport moves instead of holding every
    // GTFS stop in memory as a native annotation.
    return filterStopsInViewport(stops, effectiveViewport, {
      maxStops: MAX_VIEWPORT_STOPS,
    });
  }, [focusedStop, stops, effectiveViewport]);

  // Load every GTFS stop so all stop markers render on the map (when no line is selected and no single stop is focused).
  useEffect(() => {
    if (!focusStopId && !selectedLineId) {
      void loadAllStops();
    }
  }, [loadAllStops, selectedLineId, focusStopId]);

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
  const [followMode, setFollowMode] = useState(followUserLocation || autoFollowUser);
  // Sync follow mode with the "auto-follow my location" settings toggle while
  // the map is open. Skipped on mount so an explicit `followUserLocation` prop
  // from a caller is not immediately overwritten by the stored setting.
  const prevAutoFollowRef = useRef(autoFollowUser);
  useEffect(() => {
    if (prevAutoFollowRef.current === autoFollowUser) return;
    prevAutoFollowRef.current = autoFollowUser;
    setFollowMode(autoFollowUser);
  }, [autoFollowUser]);

  const { permission, watchLocation, ensureLocationReady, getCurrentLocation, openLocationSettings } = useLocation();
  // MapLibre's native location component logs "Failed to obtain last location
  // update" when camera tracking starts before it has a position. Wait for the
  // first real fix before handing `trackUserLocation` to the camera.
  const [hasUserFix, setHasUserFix] = useState(false);
  useEffect(() => {
    if (!showUserLocation || permission !== 'granted' || hasUserFix) return;
    return watchLocation(() => setHasUserFix(true));
  }, [showUserLocation, permission, hasUserFix, watchLocation]);

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
      const { center, zoom, bounds } = event.nativeEvent;
      // MapLibre LngLat is [longitude, latitude]
      const nextRegion: MapRegion = clampRegion({
        longitude: center[0],
        latitude: center[1],
        zoomLevel: zoom,
      });
      setRegion(nextRegion);
      if (bounds) {
        setViewportBounds(toViewportBounds(bounds as LngLatBounds));
      }
      Storage.setItem(STORAGE_KEY_MAP_REGION, JSON.stringify(nextRegion));
      onRegionChange?.(nextRegion);
    },
    [onRegionChange],
  );

  // While the map is being dragged/pinched, refresh the viewport (so markers
  // enter/leave as it moves) but throttle it and skip persisting the region —
  // `onRegionDidChange` writes the final position once the gesture ends.
  const handleRegionIsChanging = useCallback(
    (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
      const now = Date.now();
      if (!isRegionUpdateDue(lastViewportUpdateRef.current, now, REGION_THROTTLE_MS)) {
        return;
      }
      lastViewportUpdateRef.current = now;

      const { bounds } = event.nativeEvent;
      if (bounds) {
        setViewportBounds(toViewportBounds(bounds as LngLatBounds));
      }
    },
    [],
  );

  const handleZoomIn = useCallback(() => {
    cameraRef.current?.zoomTo(region.zoomLevel + 1, { duration: 300 });
  }, [region.zoomLevel]);

  const handleZoomOut = useCallback(() => {
    cameraRef.current?.zoomTo(region.zoomLevel - 1, { duration: 300 });
  }, [region.zoomLevel]);

  /** Turns follow mode on, provided location is available. */
  const enableFollowing = useCallback(async () => {
    const ready = await ensureLocationReady();
    if (!ready) return false;

    // Animate the map to the user's position as soon as a fix is found, so the
    // button visibly takes the user there instead of silently starting to
    // follow (the camera then keeps tracking the location updates).
    const fix = await getCurrentLocation();
    if (fix) {
      cameraRef.current?.easeTo({
        center: [fix.longitude, fix.latitude],
        duration: 800,
      });
    }
    setFollowMode(true);
    return true;
  }, [ensureLocationReady, getCurrentLocation]);

  const handleToggleFollow = useCallback(async () => {
    if (followMode) {
      setFollowMode(false);
      return;
    }

    if (await enableFollowing()) return;

    // Location is off (services disabled or permission denied). Ask the user to
    // turn it on. The check runs on every press, so while location is still off
    // the prompt reappears each time the button is tapped.
    Alert.alert(
      t('locationRequiredTitle', { ns: 'translation' }),
      t('locationRequiredMessage', { ns: 'translation' }),
      [
        { text: t('cancel', { ns: 'translation' }), style: 'cancel' },
        {
          text: t('openSettings', { ns: 'translation' }),
          onPress: () => {
            // After the OS dialog/settings page, follow straight away when the
            // user actually turned location on.
            void openLocationSettings().then((enabled) => {
              if (enabled) void enableFollowing();
            });
          },
        },
      ],
    );
  }, [enableFollowing, followMode, openLocationSettings, t]);

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
        mapStyle={mapStyle === "dark" ? OSM_DARK_STYLE : OSM_STANDARD_STYLE}
        onRegionIsChanging={handleRegionIsChanging}
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
          trackUserLocation={
            followMode && hasUserFix ? 'default' : undefined
          }
        />
        {showUserLocation && permission === 'granted' && <UserLocation />}
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
        {stopsToShow.map((stop) => {
          const routesForStop = gtfsService.getRoutesForStop(stop.stop_id);
          if (routesForStop.length === 0) return null;
          return (
            <StopMarker
              key={stop.stop_id}
              lngLat={[stop.stop_lon, stop.stop_lat]}
              stop={stop}
              routes={routesForStop}
              zoomLevel={region.zoomLevel}
              onPress={onStopPress}
            />
          );
        })}
        {trackedBuses.map((bus) => (
          <BusMarker
            key={bus.id}
            lngLat={[bus.longitude, bus.latitude]}
            heading={bus.heading}
            // Honour the "Mostrar etiquetas de autobuses" setting: labels are
            // only passed to the marker while the toggle is enabled.
            label={showBusLabels ? bus.label || bus.id || undefined : undefined}
            onPress={onBusPress}
          />
        ))}
      </Map>
      <MapControls
        onToggleFollow={handleToggleFollow}
        followMode={followMode}
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
