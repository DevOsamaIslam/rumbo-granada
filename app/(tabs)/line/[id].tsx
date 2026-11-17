import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, IconButton } from 'react-native-paper';
import { gtfsService } from '@/services/gtfs';
import { useFavorites } from '@/hooks/useFavorites';
import { useTranslation } from 'react-i18next';
import { TrackStopButton } from '@/components/tracking';
import { useAppColors, useThemedStyles } from '@/constants/themes';
import type { AppColors } from '@/constants/colors';
import { formatNumber } from '@/utils/format';
import i18n from '@/i18n';
import { Route, Stop } from '@/types/gtfs';

export default function LineDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [route, setRoute] = useState<Route | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isBusFavorite, toggleFavoriteBus } = useFavorites();
  const { t } = useTranslation();
  const colors = useAppColors();
  const styles = useThemedStyles(createStyles);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!id || typeof id !== 'string') {
        setIsLoading(false);
        return;
      }
      try {
        await gtfsService.load();
        const r = gtfsService.getRoute(id);
        const s = gtfsService.getOrderedStopsForRoute(id);
        if (!cancelled) {
          setRoute(r ?? null);
          setStops(s);
        }
      } catch {
        if (!cancelled) {
          setRoute(null);
          setStops([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleShowOnMap = () => {
    if (id) {
      router.push({ pathname: '/', params: { lineId: id } });
    }
  };

  const handleToggleFavorite = () => {
    if (!route) return;
    toggleFavoriteBus({
      routeId: route.route_id,
      routeShortName: route.route_short_name,
      routeLongName: route.route_long_name,
      routeColor: route.route_color ?? '',
      routeTextColor: route.route_text_color ?? '',
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator animating size="large" />
      </View>
    );
  }

  if (!route) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{t('lineNotFound', { ns: 'translation' })}</Text>
      </View>
    );
  }

  const isFavorite = isBusFavorite(route.route_id);

  return (
    <ScrollView
      style={[styles.container]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: route.route_color ? `#${route.route_color}` : colors.primary }]}>
          <Text style={styles.badgeText}>{route.route_short_name}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{t('lineTitle', { ns: 'translation', line: route.route_short_name })}</Text>
          <Text style={styles.subtitle}>{route.route_long_name}</Text>
        </View>
        <IconButton
          icon={isFavorite ? 'star' : 'star-outline'}
          onPress={handleToggleFavorite}
          accessibilityLabel={
            isFavorite ? t('removeFromFavorites', { ns: 'translation' }) : t('addToFavorites', { ns: 'translation' })
          }
        />
      </View>

      <Pressable
        style={[styles.mapButton, { backgroundColor: colors.secondary }]}
        onPress={handleShowOnMap}
        accessibilityRole="button"
        accessibilityLabel={t('showOnMap', { ns: 'translation' })}
      >
        <Text style={styles.mapButtonText}>{t('showOnMap', { ns: 'translation' })}</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>{t('stopsCount', { ns: 'translation', total: formatNumber(stops.length, i18n.language) })}</Text>
      {stops.map((stop, index) => (
        <Pressable
          key={`${stop.stop_id}-${index}`}
          style={styles.stopRow}
          onPress={() => router.push(`/stop/${stop.stop_id}`)}
          accessibilityRole="button"
          accessibilityLabel={t('stopAccessibilityLabel', { ns: 'translation', name: stop.stop_name })}
        >
          <View style={styles.stopNumber}>
            <Text style={styles.stopNumberText}>{stop.stop_code}</Text>
          </View>
          <Text style={styles.stopName}>{stop.stop_name}</Text>
          <TrackStopButton
            routeId={id}
            routeShortName={route?.route_short_name ?? ''}
            stopId={stop.stop_id}
            stopCode={stop.stop_code}
            stopName={stop.stop_name}
          />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  badge: {
    minWidth: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.onBackground,
  },
  subtitle: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  errorText: {
    color: colors.error,
    fontSize: 15,
  },
  mapButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  mapButtonText: {
    color: colors.onSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: colors.onBackground,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  stopNumber: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopNumberText: {
    color: colors.onTertiary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  stopName: {
    flex: 1,
    fontSize: 15,
    color: colors.onSurface,
  },
});