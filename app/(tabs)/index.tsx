import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapView } from '@/components/map';
import { StopCard } from '@/components/map/StopCard.native';
import { useLines } from '@/hooks/useLines';
import { Stop } from '@/types/gtfs';
import { gtfsService } from '@/services/gtfs';
import type { Route } from '@/types/gtfs';
import { useThemedStyles } from '@/constants/themes';
import type { AppColors } from '@/constants/colors';

export default function MapScreen() {
  const router = useRouter();
  const { loadLines } = useLines();
  const styles = useThemedStyles(createStyles);
  const params = useLocalSearchParams<{
    lineId?: string;
    stopId?: string;
    lat?: string;
    lon?: string;
  }>();

  // Don't auto-select a route on initial load — show all bus stops by default.
  // A route can be selected from the lines list or via URL params.
  const lineId =
    typeof params.stopId === 'string'
      ? undefined
      : typeof params.lineId === 'string'
      ? params.lineId
      : undefined;

  // Arriving from "Show on map" on the stop screen: centre on those coordinates.
  const focusStop = useMemo(() => {
    const lat = Number.parseFloat(params.lat ?? '');
    const lon = Number.parseFloat(params.lon ?? '');
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { latitude: lat, longitude: lon };
  }, [params.lat, params.lon]);

  // Look up the focused stop's data for the StopCard overlay.
  const stopCard = useMemo(() => {
    if (!params.stopId) return null;
    const stop = gtfsService.getStop(params.stopId);
    if (stop) {
      return { stop, routes: gtfsService.getRoutesForStop(params.stopId) };
    }
    return null;
  }, [params.stopId]);

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

  const handleCloseStopCard = () => {
    router.push('/');
  };

  const handlePressRoute = (route: Route) => {
    router.push(`/line/${route.route_id}`);
  };

  return (
    <View style={[styles.container]}>
      <MapView
        initialRegion={{ latitude: 37.1773, longitude: -3.5986, zoomLevel: 13 }}
        selectedLineId={lineId}
        focusStop={focusStop}
        focusStopId={typeof params.stopId === 'string' ? params.stopId : undefined}
        onStopPress={handleStopPress}
        onBusPress={handleBusPress}
      />
      {stopCard && (
        <View style={styles.cardContainer}>
          <StopCard
            stop={stopCard.stop}
            routes={stopCard.routes}
            onClose={handleCloseStopCard}
            onPressRoute={handlePressRoute}
          />
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  cardContainer: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
    zIndex: 200,
    pointerEvents: 'box-none',
  },
});