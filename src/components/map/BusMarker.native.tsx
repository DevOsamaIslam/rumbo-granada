import React from 'react';
import { Marker } from 'react-native-maps';
import { View, StyleSheet, Text } from 'react-native';

interface BusMarkerProps {
  coordinate: { latitude: number; longitude: number };
  heading?: number;
  onPress?: (bus: { id: string; latitude: number; longitude: number }) => void;
}

export function BusMarker({ coordinate, heading = 0, onPress }: BusMarkerProps) {
  return (
    <Marker
      coordinate={coordinate}
      rotation={heading}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={true}
      zIndex={20}
      onPress={() => onPress?.({ id: '', ...coordinate })}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  busIcon: {
    fontSize: 24,
    color: '#6200EE',
    fontWeight: 'bold',
  },
});

export default BusMarker;