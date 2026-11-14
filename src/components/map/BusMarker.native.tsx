import React from "react";
import { Marker } from "@maplibre/maplibre-react-native";
import { View, StyleSheet, Text } from "react-native";

interface BusMarkerProps {
  lngLat: [number, number];
  heading?: number;
  onPress?: (bus: { id: string; latitude: number; longitude: number }) => void;
}

export function BusMarker({ lngLat, heading = 0, onPress }: BusMarkerProps) {
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
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  busMarker: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  busIcon: {
    fontSize: 24,
    color: "#6200EE",
    fontWeight: "bold",
  },
});

export default BusMarker;