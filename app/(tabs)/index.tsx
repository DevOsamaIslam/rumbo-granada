import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { MapView } from '@/components/map';
import { useLines } from '@/hooks/useLines';
import { Stop } from '@/types/gtfs';

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { routes, loadLines } = useLines();
  const params = useLocalSearchParams<{ lineId?: string }>();
  const lineId = typeof params.lineId === 'string' ? params.lineId : routes[0]?.route_id;

  useEffect(() => {
    loadLines();
  }, [loadLines]);

  const handleStopPress = (stop: Stop) => {
    console.log('Stop pressed:', stop.stop_name);
    // TODO: Navigate to stop detail
  };

  const handleBusPress = (bus: { id: string; latitude: number; longitude: number }) => {
    console.log('Bus pressed:', bus.id);
    // TODO: Navigate to bus tracking
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <MapView
        initialRegion={{ latitude: 37.1773, longitude: -3.5986, zoomLevel: 13 }}
        selectedLineId={lineId}
        onStopPress={handleStopPress}
        onBusPress={handleBusPress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});