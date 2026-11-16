import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { IconButton } from 'react-native-paper';
import { FavoritesTabBar } from '@/components/favorites/FavoritesTabBar';
import { AddStopLabelModal } from '@/components/favorites';
import { useRouter } from 'expo-router';
import { useFavorites } from '@/hooks/useFavorites';
import { useTranslation } from 'react-i18next';

import { COLORS } from '@/constants/colors';

export default function FavoritesScreen() {
  const router = useRouter();
  const {
    favoriteBuses,
    favoriteStops,
    reminders,
    addReminder,
    removeReminder,
    clearOldReminders,
    isBusFavorite,
    isStopFavorite,
    toggleFavoriteBus,
    toggleFavoriteStop,
    updateBusLabel,
    updateStopLabel,
  } = useFavorites();
  const { t } = useTranslation();

  const [tab, setTab] = useState<'favoriteLines' | 'favoriteStops' | 'previousReminders'>(
    'favoriteLines'
  );
  const [refreshing, setRefreshing] = useState(false);

  const [labelModal, setLabelModal] = useState<{
    type: 'bus' | 'stop';
    id: string;
    initialLabel: string;
    itemName: string;
    title: string;
  } | null>(null);

  const handleRefresh = () => {
    clearOldReminders();
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 400);
  };

  const handleBusPress = (bus: (typeof favoriteBuses)[number]) => {
    router.push(`/line/${bus.routeId}`);
  };

  const handleStopPress = (stop: (typeof favoriteStops)[number]) => {
    router.push(`/stop/${stop.stopId}`);
  };

  const handleBusEdit = (bus: (typeof favoriteBuses)[number]) => {
    setLabelModal({
      type: 'bus',
      id: bus.routeId,
      initialLabel: bus.label ?? '',
      itemName: bus.routeLongName,
      title: 'Editar línea',
    });
  };

  const handleStopEdit = (stop: (typeof favoriteStops)[number]) => {
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

  const handleRepeatReminder = (reminder: (typeof reminders)[number]) => {
    addReminder({
      stopId: reminder.stopId,
      stopName: reminder.stopName,
      label: reminder.label,
      minutes: reminder.minutes,
    });
  };

  return (
    <View style={styles.container}>
      <FavoritesTabBar
        tab={tab}
        onTabChange={setTab}
        onRefresh={handleRefresh}
        refreshing={refreshing}
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
                      { backgroundColor: item.routeColor ? `#${item.routeColor}` : COLORS.primary },
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
                  <View style={[styles.badgeBackground, { backgroundColor: COLORS.primary }]}>
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
      </View>

        {tab === 'previousReminders' &&
          (reminders.length === 0 ? (
            <Text style={styles.emptyMessage}>{t('noReminders', { ns: 'translation' })}</Text>
          ) : (
            <FlatList
              data={reminders}
              keyExtractor={(reminder) => reminder.id}
              renderItem={({ item }) => (
                <Pressable style={styles.item} onPress={() => handleRepeatReminder(item)}>
                  <View style={[styles.badgeBackground, { backgroundColor: COLORS.primary }]}>
                    <Text style={styles.badgeText}>{item.minutes ? `${item.minutes}m` : '⏰'}</Text>
                  </View>
                  <View style={styles.stopInfo}>
                    <Text style={styles.stopName}>{item.stopName}</Text>
                    {item.label && <Text style={styles.stopLabel}>Label: {item.label}</Text>}
                  </View>
                  <View style={styles.favoriteArea}>
                    <IconButton
                      icon='alarm'
                      onPress={() => handleRepeatReminder(item)}
                      accessibilityLabel='Repeat reminder'
                    />
                    <IconButton
                      icon='delete'
                      onPress={() => removeReminder(item.id)}
                      accessibilityLabel='Remove reminder'
                    />
                  </View>
                </Pressable>
              )}
              contentContainerStyle={styles.listContent}
            />
          ))}

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  content: {
    flex: 1,
  },
  emptyMessage: {
    color: '#79747E',
    fontSize: 16,
    textAlign: 'center',
    padding: 24,
  },
  // Unified item style - same for buses, stops and reminders, only the badge icon differs
  item: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    shadowColor: '#000',
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
    marginRight: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  busInfo: {
    flex: 1,
  },
  busName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  busRoutes: {
    fontSize: 12,
    color: COLORS.outline,
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
    color: COLORS.onSurface,
  },
  stopLabel: {
    fontSize: 12,
    color: COLORS.outline,
    marginTop: 2,
  },
});
