import React, { useEffect } from 'react';
import { SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapView } from '@/components/map';
import { useLines } from '@/hooks/useLines';
import { StyleSheet } from 'react-native';
import { Stop } from '@/types/gtfs';

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { routes, loadLines } = useLines();

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
        initialRegion={{ latitude: 37.1773, longitude: -3.5986, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
        selectedLineId={routes[0]?.route_id}
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