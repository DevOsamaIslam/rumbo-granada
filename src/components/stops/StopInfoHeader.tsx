import { StyleSheet, Text, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import { COLORS } from '@/constants/colors';
import { getBadgeBackgroundColor, getBadgeTextColor } from '@/utils/colors';
import { useTranslation } from 'react-i18next';
import type { Route, Stop } from '@/types/gtfs';

export interface StopInfoHeaderProps {
  stop: Stop;
  routes: Route[];
  isFavorite: boolean;
  favoriteLabel?: string;
  onToggleFavorite: () => void;
  onPressRoute: (route: Route) => void;
}

/** Stop name, code, coordinates and the lines that serve it. */
export function StopInfoHeader({
  stop,
  routes,
  isFavorite,
  favoriteLabel,
  onToggleFavorite,
  onPressRoute,
}: StopInfoHeaderProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.name}>{stop.stop_name}</Text>
          <Text style={styles.meta}>
            {stop.stop_code
              ? t('stopCode', { ns: 'translation', code: stop.stop_code })
              : t('noStopCode', { ns: 'translation' })}
            {` · ${stop.stop_lat.toFixed(4)}, ${stop.stop_lon.toFixed(4)}`}
          </Text>
          {isFavorite && favoriteLabel ? (
            <Text style={styles.favoriteLabel}>★ {favoriteLabel}</Text>
          ) : null}
        </View>
        <IconButton
          icon={isFavorite ? 'star' : 'star-outline'}
          onPress={onToggleFavorite}
          accessibilityLabel={
            isFavorite ? t('removeFromFavorites', { ns: 'translation' }) : t('addToFavorites', { ns: 'translation' })
          }
        />
      </View>

      <Text style={styles.sectionTitle}>{t('linesCount', { ns: 'translation', total: routes.length })}</Text>
      <View style={styles.routeRow}>
        {routes.length === 0 ? (
          <Text style={styles.noRoutes}>{t('noLinesRegistered', { ns: 'translation' })}</Text>
        ) : (
          routes.map((route) => {
            const color = getBadgeBackgroundColor(route.route_color, COLORS.primary);
            const textColor = getBadgeTextColor(color, route.route_text_color);
            return (
              <View
                key={route.route_id}
                style={[styles.routeBadge, { backgroundColor: color }]}
              >
                <IconButton
                  icon='chevron-right'
                  size={20}
                  onPress={() => onPressRoute(route)}
                  accessibilityLabel={t('openLine', { ns: 'translation', line: route.route_short_name })}
                  style={styles.routeBadgeButton}
                />
                <Text style={[styles.routeBadgeText, { color: textColor }]}>
                  {route.route_short_name}
                </Text>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.outlineVariant,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  meta: {
    fontSize: 12,
    color: COLORS.outline,
  },
  favoriteLabel: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
    marginTop: 8,
  },
  routeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  routeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingLeft: 4,
    paddingRight: 8,
  },
  routeBadgeButton: {
    margin: 0,
    width: 28,
    height: 28,
  },
  routeBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  noRoutes: {
    fontSize: 13,
    color: COLORS.outline,
  },
});
