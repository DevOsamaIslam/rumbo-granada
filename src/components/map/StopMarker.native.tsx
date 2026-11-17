import React from "react";
import { Marker } from "@maplibre/maplibre-react-native";
import { Route, Stop } from "@/types/gtfs";
import { Animated, StyleSheet, View, Image, Text } from "react-native";
import { useMarkerEntrance } from "./useMarkerEntrance";

// Teardrop brand pin used as the stop marker icon when zoomed out.
const STOP_ICON = require("../../../assets/map-pin.png");

// Zoom at or above which the stop logo is replaced by colored line circles.
const STOP_CIRCLE_ZOOM = 16;

/** Pixels to offset each line circle so multiple lines at one stop stay visible. */
const CIRCLE_OFFSETS = [
  { x: 0, y: 0 },
  { x: -16, y: -16 },
  { x: 16, y: -16 },
  { x: -16, y: 16 },
  { x: 16, y: 16 },
  { x: 0, y: -28 },
  { x: 0, y: 28 },
  { x: -28, y: 0 },
  { x: 28, y: 0 },
];

interface StopMarkerProps {
  lngLat: [number, number];
  stop: Stop;
  /** Lines (GTFS routes) serving this stop, used for the close-up circles. */
  routes?: Route[];
  /** Current map zoom level, used to size the marker dynamically. */
  zoomLevel?: number;
  /** Fade/scale the marker in on mount (markers entering the viewport). */
  animateIn?: boolean;
  onPress?: (stop: Stop) => void;
}

export function StopMarker({
  lngLat,
  stop,
  routes = [],
  zoomLevel = 14,
  animateIn = true,
  onPress,
}: StopMarkerProps) {
  const entrance = useMarkerEntrance(animateIn);
  const isCloseUp = zoomLevel >= STOP_CIRCLE_ZOOM;
  const lineRoutes = routes.filter((r) => r.route_color);

  // Marker grows slightly as the user zooms in — tiny when zoomed out.
  const iconSize =
    zoomLevel >= 16 ? 36 : zoomLevel >= 14 ? 24 : zoomLevel >= 12 ? 14 : 10;

  return (
    <Marker
      lngLat={lngLat}
      anchor="center"
      onPress={() => onPress?.(stop)}
    >
      <Animated.View
        style={[
          styles.annotation,
          { width: iconSize, height: iconSize },
          entrance,
        ]}
      >
        {/* Close-up: show one colored circle per line serving the stop. */}
        {isCloseUp && lineRoutes.length > 0 ? (
          lineRoutes.map((route, index) => {
            const offset = CIRCLE_OFFSETS[index % CIRCLE_OFFSETS.length];
            return (
              <View
                key={route.route_id}
                style={[
                  styles.lineCircle,
                  {
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: `#${route.route_color}`,
                    position: "absolute",
                    left: offset.x,
                    top: offset.y,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                ]}
              >
                <Text style={[styles.lineCircleText]}>
                  {route.route_short_name}
                </Text>
              </View>
            );
          })
        ) : (
          // Zoomed out: show the app logo icon.
          <Image source={STOP_ICON} style={[styles.markerIcon, { width: iconSize, height: iconSize }]} />
        )}
      </Animated.View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerIcon: {
    resizeMode: "contain",
  },
  annotation: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  lineCircle: {
    borderWidth: 2,
    borderColor: "white",
  },
  lineCircleText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "white",
  },
});

export default StopMarker;

