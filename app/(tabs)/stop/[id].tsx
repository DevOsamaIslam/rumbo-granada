import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator } from 'react-native-paper';
import { ArrivalsList, StopInfoHeader } from '@/components/stops';
import { AddStopLabelModal } from '@/components/favorites';
import { useFavorites } from '@/hooks/useFavorites';
import { useStopArrivals } from '@/hooks/useStopArrivals';
import { gtfsService } from '@/services/gtfs';
import { useThemedStyles } from '@/constants/themes';
import type { AppColors } from '@/constants/colors';
import { getBadgeBackgroundColor } from '@/utils/colors';
import type { Route, Stop } from '@/types/gtfs';
import { useTranslation } from 'react-i18next';
import { StopLinesTab, StopTabBar, type StopTab } from '@/components/stops/StopDetailTabs';

export default function StopDetailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const stopId = typeof id === 'string' ? id : '';

  const [stop, setStop] = useState<Stop | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoadingStop, setIsLoadingStop] = useState(true);
  const [tab, setTab] = useState<StopTab>('arrivals');
  const [labelModalVisible, setLabelModalVisible] = useState(false);

  const {
    favoriteStops,
    isStopFavorite,
    addFavoriteStop,
    removeFavoriteStop,
    updateStopLabel,
  } = useFavorites();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!stopId) {
        setIsLoadingStop(false);
        return;
      }
      try {
        await gtfsService.load();
        if (cancelled) return;
        setStop(gtfsService.getStop(stopId) ?? null);
        setRoutes(gtfsService.getRoutesForStop(stopId));
      } catch {
        if (!cancelled) {
          setStop(null);
          setRoutes([]);
        }
      } finally {
        if (!cancelled) setIsLoadingStop(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [stopId]);

  // The live API keys off the stop code printed on the pole, not the GTFS UUID.
  const stopCode = stop?.stop_code ?? null;
  const {
    arrivals,
    isLoading: isLoadingArrivals,
    error: arrivalsError,
    lastUpdated,
    refresh,
  } = useStopArrivals(stopCode);

  const favoriteStop = useMemo(
    () => favoriteStops.find((favorite) => favorite.stopId === stopId),
    [favoriteStops, stopId],
  );
  const isFavorite = isStopFavorite(stopId);

  // Keyed by the string form of the short name: a numeric `route_short_name` from a
  // stale cache must still match the string line code returned by the live API.
  const routeColors = useMemo(() => {
    const map = new Map<string, string>();
    for (const route of routes) {
      const color = getBadgeBackgroundColor(route.route_color, '');
      if (color) map.set(String(route.route_short_name), color);
    }
    return map;
  }, [routes]);

  const routeTextColors = useMemo(() => {
    const map = new Map<string, string>();
    for (const route of routes) {
      if (route.route_text_color) {
        map.set(String(route.route_short_name), route.route_text_color);
      }
    }
    return map;
  }, [routes]);

  const buildFavoriteStop = useCallback(
    (label: string) => ({
      stopId: stop!.stop_id,
      stopName: stop!.stop_name,
      label,
      lat: stop!.stop_lat,
      lon: stop!.stop_lon,
    }),
    [stop],
  );

  const handleToggleFavorite = useCallback(() => {
    if (!stop) return;
    if (!isFavorite) {
      addFavoriteStop(buildFavoriteStop(''));
    }
    setLabelModalVisible(true);
  }, [stop, isFavorite, addFavoriteStop, buildFavoriteStop]);

  const handleConfirmLabel = useCallback(
    (label: string) => {
      if (!stop) {
        setLabelModalVisible(false);
        return;
      }
      if (favoriteStop) {
        updateStopLabel(stop.stop_id, label);
      } else {
        addFavoriteStop(buildFavoriteStop(label));
      }
      setLabelModalVisible(false);
    },
    [stop, favoriteStop, addFavoriteStop, updateStopLabel, buildFavoriteStop],
  );

  const handleRemoveFavorite = useCallback(() => {
    if (!stop) return;
    removeFavoriteStop(stop.stop_id);
    setLabelModalVisible(false);
  }, [stop, removeFavoriteStop]);

  const handleShowOnMap = useCallback(() => {
    if (!stop) return;
    router.push({
      pathname: '/',
      params: {
        stopId: stop.stop_id,
        lat: String(stop.stop_lat),
        lon: String(stop.stop_lon),
      },
    });
  }, [router, stop]);

  if (isLoadingStop) {
    return (
      <View
        style={[styles.container, styles.centered]}
      >
        <ActivityIndicator
          animating
          size='large'
          accessibilityLabel={t('loadingStop', { ns: 'translation' })}
        />
      </View>
    );
  }

  if (!stop) {
    return (
      <View
        style={[styles.container, styles.centered]}
      >
        <Text style={styles.errorText}>{t('stopNotFound', { ns: 'translation' })}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container]}>
      <StopInfoHeader
        stop={stop}
        routes={routes}
        isFavorite={isFavorite}
        favoriteLabel={favoriteStop?.label}
        onToggleFavorite={handleToggleFavorite}
        onPressRoute={(route) => router.push(`/line/${route.route_id}`)}
      />

      <StopTabBar
        tab={tab}
        onTabChange={setTab}
        onRefresh={refresh}
        refreshing={isLoadingArrivals}
        onShowOnMap={handleShowOnMap}
      />

      {tab === 'arrivals' ? (
        <View style={styles.listContainer}>
          {stopCode ? (
            <ArrivalsList
              arrivals={arrivals}
              isLoading={isLoadingArrivals}
              error={arrivalsError}
              onRefresh={refresh}
              lastUpdated={lastUpdated}
              lineColorFor={(lineCode) => routeColors.get(lineCode)}
              lineTextColorFor={(lineCode) => routeTextColors.get(lineCode)}
            />
          ) : (
            <View style={styles.centered}>
              <Text style={styles.mutedText}>{t('noStopCodeMessage', { ns: 'translation' })}</Text>
            </View>
          )}
        </View>
      ) : (
        <StopLinesTab
          routes={routes}
          stop={stop}
          onPress={(route) => router.push(`/line/${route.route_id}`)}
        />
      )}

      <AddStopLabelModal
        visible={labelModalVisible}
        initialLabel={favoriteStop?.label ?? ''}
        stopName={stop.stop_name}
        onCancel={() => setLabelModalVisible(false)}
        onConfirm={handleConfirmLabel}
        onRemove={favoriteStop ? handleRemoveFavorite : undefined}
      />
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  listContainer: { flex: 1 },
  errorText: { fontSize: 15, color: colors.error },
  mutedText: { fontSize: 14, color: colors.outline, textAlign: 'center' },
});
