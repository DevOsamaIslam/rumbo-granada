import React from "react";
import { Marker, Callout } from "@maplibre/maplibre-react-native";
import { Stop } from "@/types/gtfs";
import { StyleSheet, View, Text } from "react-native";

interface StopMarkerProps {
  lngLat: [number, number];
  stop: Stop;
  isCluster?: boolean;
  pointCount?: number;
  onPress?: (stop: Stop) => void;
}

export function StopMarker({
  lngLat,
  stop,
  isCluster = false,
  pointCount,
  onPress,
}: StopMarkerProps) {
  return (
    <Marker
      lngLat={lngLat}
      anchor="bottom"
      onPress={() => onPress?.(stop)}
    >
      <View style={styles.annotation}>
        <View style={styles.markerDot}>
          <Text style={styles.markerText}>
            {isCluster ? `${pointCount}+` : "🚏"}
          </Text>
        </View>
        <Callout style={styles.callout}>
          <View style={styles.calloutContent}>
            <Text style={styles.calloutText} numberOfLines={1}>
              {isCluster ? `${pointCount} paradas agrupadas` : stop.stop_name}
            </Text>
            {!isCluster && stop.stop_code && (
              <Text style={styles.calloutSubText}>
                Código: {stop.stop_code}
              </Text>
            )}
          </View>
        </Callout>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#6200EE",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  annotation: {
    position: "relative",
  },
  markerText: {
    fontSize: 12,
    color: "white",
  },
  callout: {
    padding: 8,
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  calloutContent: {
    alignItems: "center",
  },
  calloutText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  calloutSubText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
});

export default StopMarker;

