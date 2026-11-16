import React from "react";
import { Marker } from "@maplibre/maplibre-react-native";
import { View, StyleSheet, Text } from "react-native";
import { COLORS } from "@/constants/colors";

interface BusMarkerProps {
  lngLat: [number, number];
  heading?: number;
  /**
   * Optional label rendered under the bus icon (e.g. the line name or vehicle
   * code). `MapView` passes it only while the "Mostrar etiquetas de autobuses"
   * setting is enabled, so the toggle actually hides/shows it.
   */
  label?: string;
  onPress?: (bus: { id: string; latitude: number; longitude: number }) => void;
}

function BusMarkerImpl({ lngLat, heading = 0, label, onPress }: BusMarkerProps) {
  return (
    <Marker
      lngLat={lngLat}
      anchor="center"
      onPress={() => onPress?.({ id: "", latitude: lngLat[1], longitude: lngLat[0] })}
    >
      <View style={styles.busMarker}>
        <Text
          style={[
            styles.busIcon,
            {
              transform: [{ rotate: `${heading}deg` }],
            },
          ]}
        >
          ▲
        </Text>
        {label ? (
          <View style={styles.labelPill}>
            <Text style={styles.labelText}>{label}</Text>
          </View>
        ) : null}
      </View>
    </Marker>
  );
}

// Memoized so a region/zoom change re-rendering `MapView` does not re-render
// every bus annotation.
export const BusMarker = React.memo(BusMarkerImpl);

const styles = StyleSheet.create({
  busMarker: {
    width: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  busIcon: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  labelPill: {
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginTop: 1,
  },
  labelText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default BusMarker;