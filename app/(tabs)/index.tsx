import React, { useEffect, useMemo } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapView } from '@/components/map';
import { useLines } from '@/hooks/useLines';
import { Stop } from '@/types/gtfs';

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { routes, loadLines } = useLines();
  const params = useLocalSearchParams<{
    lineId?: string;
    stopId?: string;
    lat?: string;
    lon?: string;
  }>();

  const lineId = typeof params.lineId === 'string' ? params.lineId : routes[0]?.route_id;

  // Arriving from "Show on map" on the stop screen: centre on those coordinates.
  const focusStop = useMemo(() => {
    const lat = Number.parseFloat(params.lat ?? '');
    const lon = Number.parseFloat(params.lon ?? '');
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { latitude: lat, longitude: lon };
  }, [params.lat, params.lon]);

  useEffect(() => {
    loadLines();
  }, [loadLines]);

  const handleStopPress = (stop: Stop) => {
    router.push(`/stop/${stop.stop_id}`);
  };

  const handleBusPress = (bus: { id: string; latitude: number; longitude: number }) => {
    // Bus tracking lands in a later phase; keep the tap from feeling dead.
    void bus;
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <MapView
        initialRegion={{ latitude: 37.1773, longitude: -3.5986, zoomLevel: 13 }}
        selectedLineId={lineId}
        focusStop={focusStop}
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