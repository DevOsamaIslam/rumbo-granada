import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import { TrackStopButton } from '@/components/tracking';
import { useTranslation } from 'react-i18next';
import { useAppColors, useThemedStyles } from '@/constants/themes';
import type { AppColors } from '@/constants/colors';
import type { Route, Stop } from '@/types/gtfs';

export type StopTab = 'arrivals' | 'lines';

export interface StopTabBarProps {
  tab: StopTab;
  onTabChange: (tab: StopTab) => void;
  onRefresh: () => void;
  refreshing: boolean;
  onShowOnMap: () => void;
}

/** Tab switcher plus the refresh / show-on-map actions for the stop screen. */
export function StopTabBar({
  tab,
  onTabChange,
  onRefresh,
  refreshing,
  onShowOnMap,
}: StopTabBarProps) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.toolbar}>
      <View style={styles.tabs}>
        <TabButton
          label={t('arrivals', { ns: 'translation' })}
          active={tab === 'arrivals'}
          onPress={() => onTabChange('arrivals')}
        />
        <TabButton
          label={t('lines', { ns: 'translation' })}
          active={tab === 'lines'}
          onPress={() => onTabChange('lines')}
        />
      </View>
      <View style={styles.toolbarActions}>
        <IconButton
          icon='refresh'
          onPress={onRefresh}
          accessibilityLabel={t('refreshArrivals', { ns: 'translation' })}
          disabled={refreshing}
        />
        <IconButton
          icon='map-marker'
          onPress={onShowOnMap}
          accessibilityLabel={t('showStopOnMap', { ns: 'translation' })}
        />
      </View>
    </View>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      style={[styles.tab, active && styles.tabActive]}
      onPress={onPress}
      accessibilityRole='tab'
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

export interface StopLinesTabProps {
  routes: Route[];
  stop: Stop;
  onPress: (route: Route) => void;
}

/** The lines serving the stop, each opening its line detail screen. */
export function StopLinesTab({ routes, stop, onPress }: StopLinesTabProps) {
  const { t } = useTranslation();
  const colors = useAppColors();
  const styles = useThemedStyles(createStyles);

  return (
    <ScrollView contentContainerStyle={styles.infoContent}>
      {routes.length === 0 ? (
        <Text style={styles.mutedText}>{t('noLinesRegistered', { ns: 'translation' })}</Text>
      ) : (
        routes.map((route) => (
          <Pressable
            key={route.route_id}
            style={styles.routeRow}
            onPress={() => onPress(route)}
            accessibilityRole='button'
            accessibilityLabel={t('lineTitle', { ns: 'translation', line: route.route_short_name })}
          >
            <View
              style={[
                styles.routeBadge,
                {
                  backgroundColor: route.route_color
                    ? `#${route.route_color}`
                    : colors.primary,
                },
              ]}
            >
              <Text style={styles.routeBadgeText}>
                {route.route_short_name}
              </Text>
            </View>
            <Text style={styles.routeLongName} numberOfLines={2}>
              {route.route_long_name}
            </Text>
            <TrackStopButton
              routeId={route.route_id}
              routeShortName={route.route_short_name}
              stopId={stop.stop_id}
              stopCode={stop.stop_code}
              stopName={stop.stop_name}
            />
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  tabs: {
    flexDirection: 'row',
    gap: 4,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.primaryContainer,
  },
  tabText: {
    fontSize: 14,
    color: colors.outline,
  },
  tabTextActive: {
    color: colors.onPrimaryContainer,
    fontWeight: '600',
  },
  toolbarActions: {
    flexDirection: 'row',
  },
  infoContent: {
    flexGrow: 1,
    padding: 16,
    gap: 12,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  routeBadge: {
    minWidth: 44,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  routeBadgeText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  routeLongName: {
    flex: 1,
    fontSize: 15,
    color: colors.onSurface,
  },
  mutedText: {
    fontSize: 14,
    color: colors.outline,
    textAlign: 'center',
  },
});
