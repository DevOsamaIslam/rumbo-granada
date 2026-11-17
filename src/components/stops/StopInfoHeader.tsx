import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useAppColors, useThemedStyles } from '@/constants/themes';
import type { AppColors } from '@/constants/colors';
import { formatNumber } from '@/utils/format';
import i18n from '@/i18n';
import { getBadgeBackgroundColor } from '@/utils/colors';
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
  const colors = useAppColors();
  const styles = useThemedStyles(createStyles);

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

      <Text style={styles.sectionTitle}>{t('linesCount', { ns: 'translation', total: formatNumber(routes.length, i18n.language) })}</Text>
      <View style={styles.routeRow}>
        {routes.length === 0 ? (
          <Text style={styles.noRoutes}>{t('noLinesRegistered', { ns: 'translation' })}</Text>
        ) : (
          routes.map((route) => {
            const color = getBadgeBackgroundColor(route.route_color, colors.primary);
            return (
              <Pressable
                key={route.route_id}
                style={[styles.routeBadge, { backgroundColor: color }]}
                onPress={() => onPressRoute(route)}
                accessibilityRole='button'
                accessibilityLabel={t('openLine', { ns: 'translation', line: route.route_short_name })}
              >
                <Text style={styles.routeBadgeText}>
                  {route.route_short_name}
                </Text>
              </Pressable>
            );
          })
        )}
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  container: {
    padding: 16,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
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
    color: colors.onSurface,
  },
  meta: {
    fontSize: 12,
    color: colors.outline,
  },
  favoriteLabel: {
    fontSize: 13,
    color: colors.tertiary,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
    marginTop: 8,
  },
  routeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  routeBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  routeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  noRoutes: {
    fontSize: 13,
    color: colors.outline,
  },
});
