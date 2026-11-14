import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

import type { Region } from './types';

interface MapWebFallbackProps {
  initialRegion?: Region;
}

export const MapWebFallback = ({ initialRegion }: MapWebFallbackProps) => {
  void initialRegion;
  return (
    <View style={styles.map}>
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>
          Map view is available on iOS and Android apps.
          <Text style={{ marginTop: 8 }}>Web version coming soon.</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  map: { flex: 1 },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  fallbackText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});
