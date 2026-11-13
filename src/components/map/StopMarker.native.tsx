import React from 'react';
import { Marker, Callout } from 'react-native-maps';
import { Stop } from '@/types/gtfs';
import { StyleSheet, View, Text } from 'react-native';

interface StopMarkerProps {
  coordinate: { latitude: number; longitude: number };
  stop: Stop;
  isCluster?: boolean;
  pointCount?: number;
  onPress?: (stop: Stop) => void;
}

export function StopMarker({
  coordinate,
  stop,
  isCluster = false,
  pointCount,
  onPress,
}: StopMarkerProps) {
  return (
    <Marker
      coordinate={coordinate}
      title={isCluster ? `${pointCount} paradas` : stop.stop_name}
      description={isCluster ? undefined : stop.stop_code}
      onPress={() => onPress?.(stop)}
      tracksViewChanges={false}
      zIndex={isCluster ? 50 : 10}
    >
      <Callout
        style={styles.callout}
        tooltip={true}
        onPress={() => onPress?.(stop)}
      >
        <View style={styles.calloutContent}>
          <Text style={styles.calloutText} numberOfLines={1}>
            {isCluster ? `${pointCount} paradas agrupadas` : stop.stop_name}
          </Text>
          {!isCluster && stop.stop_code && (
            <Text style={styles.calloutSubText}>Código: {stop.stop_code}</Text>
          )}
        </View>
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
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
  calloutContent: {
    padding: 4,
  },
  calloutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  calloutSubText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});

export default StopMarker;