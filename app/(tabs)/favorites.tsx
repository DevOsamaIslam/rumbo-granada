import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { IconButton, Switch } from 'react-native-paper';
import { FavoritesTabBar, type FavoritesTab } from '@/components/favorites/FavoritesTabBar';
import { AddStopLabelModal } from '@/components/favorites';
import { useRouter } from 'expo-router';
import { useFavorites } from '@/hooks/useFavorites';
import { useBusTracking } from '@/hooks/useBusTracking';
import { useTranslation } from 'react-i18next';
import { hapticTap } from '@/utils/haptics';
import type { TrackedPair } from '@/types/tracking';

import { useAppColors, useThemedStyles } from '@/constants/themes';
import type { AppColors } from '@/constants/colors';

export default function FavoritesScreen() {
  const router = useRouter();
  const {
    favoriteBuses,
    favoriteStops,
    isBusFavorite,
    isStopFavorite,
    toggleFavoriteBus,
    toggleFavoriteStop,
    updateBusLabel,
    updateStopLabel,
  } = useFavorites();
  const { recentPairs, trackedPairs, addTrackedPair, toggleTracking } = useBusTracking();
  const { t } = useTranslation();
  const colors = useAppColors();
  const styles = useThemedStyles(createStyles);

  const [tab, setTab] = useState<FavoritesTab>('favoriteLines');

  const [labelModal, setLabelModal] = useState<{
    type: 'bus' | 'stop';
    id: string;
    initialLabel: string;
    itemName: string;
    title: string;
  } | null>(null);

  const handleBusPress = (bus: (typeof favoriteBuses)[number]) => {
    void hapticTap();
    router.push(`/line/${bus.routeId}`);
  };

  const handleStopPress = (stop: (typeof favoriteStops)[number]) => {
    void hapticTap();
    router.push(`/stop/${stop.stopId}`);
  };

  const handleBusEdit = (bus: (typeof favoriteBuses)[number]) => {
    void hapticTap();
    setLabelModal({
      type: 'bus',
      id: bus.routeId,
      initialLabel: bus.label ?? '',
      itemName: bus.routeLongName,
      title: 'Editar línea',
    });
  };

  const handleStopEdit = (stop: (typeof favoriteStops)[number]) => {
    void hapticTap();
    setLabelModal({
      type: 'stop',
      id: stop.stopId,
      initialLabel: stop.label,
      itemName: stop.stopName,
      title: 'Editar parada',
    });
  };

  const handleConfirmLabel = (label: string) => {
    if (!labelModal) return;
    if (labelModal.type === 'bus') {
      updateBusLabel(labelModal.id, label);
    } else {
      updateStopLabel(labelModal.id, label);
    }
    setLabelModal(null);
  };

  /** Re-enable a recent tracking, or stop it if it is the active one. */
  const handleRecentToggle = (recent: TrackedPair) => {
    void hapticTap();
    const active = trackedPairs.find(
      (pair) =>
        pair.enabled &&
        pair.routeId === recent.routeId &&
        pair.stopId === recent.stopId,
    );
    if (active) {
      toggleTracking(active.id);
      return;
    }
    addTrackedPair({
      routeId: recent.routeId,
      routeShortName: recent.routeShortName,
      stopId: recent.stopId,
      stopCode: recent.stopCode,
      stopName: recent.stopName,
      label: recent.label,
      thresholdMinutes: recent.thresholdMinutes,
      enabled: true,
    });
  };

  return (
    <View style={styles.container}>
      <FavoritesTabBar
        tab={tab}
        onTabChange={setTab}
      />

      <View style={styles.content}>
        {tab === 'favoriteLines' &&
          (favoriteBuses.length === 0 ? (
            <Text style={styles.emptyMessage}>
              {t('noFavoriteBusLines', { ns: 'translation' })}
            </Text>
          ) : (
            <FlatList
              data={favoriteBuses}
              keyExtractor={(bus) => bus.routeId}
              renderItem={({ item }) => (
                <Pressable style={styles.item} onPress={() => handleBusPress(item)}>
                  <View
                    style={[
                      styles.badgeBackground,
                      { backgroundColor: item.routeColor ? `#${item.routeColor}` : colors.primary },
                    ]}
                  >
                    <Text style={styles.badgeText}>{item.routeShortName}</Text>
                  </View>
                  <View style={styles.busInfo}>
                    <Text style={styles.busName}>{item.label || item.routeLongName}</Text>
                    {item.label ? (
                      <Text style={styles.busRoutes}>{item.routeLongName}</Text>
                    ) : (
                      <Text style={styles.busRoutes}>Linea {item.routeShortName}</Text>
                    )}
                  </View>
                  <View style={styles.favoriteArea}>
                    <IconButton
                      icon={isBusFavorite(item.routeId) ? 'star' : 'star-outline'}
                      onPress={() =>
                        toggleFavoriteBus({
                          routeId: item.routeId,
                          routeShortName: item.routeShortName,
                          routeLongName: item.routeLongName,
                          routeColor: item.routeColor,
                          routeTextColor: item.routeTextColor,
                        })
                      }
                      accessibilityLabel={
                        isBusFavorite(item.routeId) ? 'Remove from favorites' : 'Add to favorites'
                      }
                    />
                    <IconButton
                      icon='pencil'
                      onPress={() => handleBusEdit(item)}
                      accessibilityLabel='Editar label'
                    />
                  </View>
                </Pressable>
              )}
              contentContainerStyle={styles.listContent}
            />
          ))}

        {tab === 'favoriteStops' &&
          (favoriteStops.length === 0 ? (
            <Text style={styles.emptyMessage}>{t('noFavoriteStops', { ns: 'translation' })}</Text>
          ) : (
            <FlatList
              data={favoriteStops}
              keyExtractor={(stop) => stop.stopId}
              renderItem={({ item }) => (
                <Pressable style={styles.item} onPress={() => handleStopPress(item)}>
                  <View style={[styles.badgeBackground, { backgroundColor: colors.primary }]}>
                    <Text style={styles.badgeText}>&#9733;</Text>
                  </View>
                  <View style={styles.stopInfo}>
                    <Text style={styles.stopName}>{item.stopName}</Text>
                    {item.label && <Text style={styles.stopLabel}>Label: {item.label}</Text>}
                  </View>
                  <View style={styles.favoriteArea}>
                    <IconButton
                      icon={isStopFavorite(item.stopId) ? 'star' : 'star-outline'}
                      onPress={() =>
                        toggleFavoriteStop({
                          stopId: item.stopId,
                          stopName: item.stopName,
                          label: item.label,
                          lat: item.lat,
                          lon: item.lon,
                        })
                      }
                      accessibilityLabel={
                        isStopFavorite(item.stopId) ? 'Remove from favorites' : 'Add to favorites'
                      }
                    />
                    <IconButton
                      icon='pencil'
                      onPress={() => handleStopEdit(item)}
                      accessibilityLabel='Editar label'
                    />
                  </View>
                </Pressable>
              )}
              contentContainerStyle={styles.listContent}
            />
          ))}

        {tab === 'recentTrackings' &&
          (recentPairs.length === 0 ? (
            <Text style={styles.emptyMessage}>
              {t('noRecentTrackings', { ns: 'translation' })}
            </Text>
          ) : (
            <FlatList
              data={recentPairs}
              keyExtractor={(pair) => `${pair.routeId}-${pair.stopId}`}
              renderItem={({ item }) => {
                const active = trackedPairs.some(
                  (pair) =>
                    pair.enabled &&
                    pair.routeId === item.routeId &&
                    pair.stopId === item.stopId,
                );
                const title = t('trackingTitle', {
                  ns: 'translation',
                  line: item.routeShortName,
                  stop: item.stopName,
                });
                return (
                  <Pressable
                    style={styles.item}
                    onPress={() => handleRecentToggle(item)}
                    accessibilityRole='switch'
                    accessibilityState={{ checked: active }}
                    accessibilityLabel={title}
                  >
                    <View style={[styles.badgeBackground, { backgroundColor: colors.primary }]}>
                      <Text style={styles.badgeText}>{item.routeShortName}</Text>
                    </View>
                    <View style={styles.stopInfo}>
                      <Text style={styles.stopName}>{title}</Text>
                      {item.label && item.label !== item.stopName ? (
                        <Text style={styles.stopLabel}>{item.label}</Text>
                      ) : null}
                    </View>
                    <View style={styles.favoriteArea} pointerEvents='none'>
                      <Switch
                        value={active}
                        color={colors.primary}
                        trackColor={{ false: colors.outlineVariant, true: colors.primary }}
                      />
                    </View>
                  </Pressable>
                );
              }}
              contentContainerStyle={styles.listContent}
            />
          ))}
      </View>

      <AddStopLabelModal
        visible={labelModal !== null}
        initialLabel={labelModal?.initialLabel ?? ''}
        stopName={labelModal?.itemName ?? ''}
        title={labelModal?.title}
        onCancel={() => setLabelModal(null)}
        onConfirm={handleConfirmLabel}
      />
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  emptyMessage: {
    color: colors.onSurfaceVariant,
    fontSize: 16,
    textAlign: 'center',
    padding: 24,
  },
  // Unified item style - same for buses, stops and recent trackings, only the badge icon differs
  item: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: 12,
  },
  badgeText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  busInfo: {
    flex: 1,
  },
  busName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
  },
  busRoutes: {
    fontSize: 12,
    color: colors.outline,
    marginTop: 2,
  },
  listContent: {
    paddingVertical: 8,
  },
  favoriteArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopInfo: {
    flex: 1,
  },
  stopName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
  },
  stopLabel: {
    fontSize: 12,
    color: colors.outline,
    marginTop: 2,
  },
});
