import React from "react";
import { Marker } from "@maplibre/maplibre-react-native";
import { Stop } from "@/types/gtfs";
import { StyleSheet, View, Image } from "react-native";

// App logo used as the stop marker icon.
const STOP_ICON = require("../../../assets/logo.png");

interface StopMarkerProps {
  lngLat: [number, number];
  stop: Stop;
  /** Current map zoom level, used to size the marker dynamically. */
  zoomLevel?: number;
  onPress?: (stop: Stop) => void;
}

export function StopMarker({
  lngLat,
  stop,
  zoomLevel = 14,
  onPress,
}: StopMarkerProps) {
  // Marker grows slightly as the user zooms in.
  const iconSize = zoomLevel >= 16 ? 36 : zoomLevel >= 14 ? 28 : 20;

  return (
    <Marker
      lngLat={lngLat}
      anchor="center"
      onPress={() => onPress?.(stop)}
    >
      <View style={[styles.annotation, { width: iconSize, height: iconSize }]}>
        <Image source={STOP_ICON} style={[styles.markerIcon, { width: iconSize, height: iconSize }]} />
      </View>
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
});

export default StopMarker;

