import { useState, type ReactNode } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, useWindowDimensions } from 'react-native';
import { Title, Divider, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useFavorites } from '@/hooks/useFavorites';
import { AddStopLabelModal } from '@/components/favorites';
import { TrackingList } from '@/components/tracking';

import { COLORS } from '@/constants/colors';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withSpring, runOnJS } from 'react-native-reanimated';

/** Dismiss threshold: swipe left beyond this distance and the row removes itself. */
const DISMISS_THRESHOLD = -80;
const ROW_MARGIN = 12;

/** Backup removal in case the exit animation is interrupted before finishing. */
function scheduleRemoval(onRemove: () => void) {
  setTimeout(onRemove, 420);
}

/**
 * Swipe-left-to-dismiss wrapper. No action button: the row follows the finger,
 * releasing past the threshold slides it out, fades it and collapses its height
 * so the list reflows smoothly, then removes it. Releasing earlier springs back.
 */
function SwipeToRemove({ onRemove, children }: { onRemove: () => void; children: ReactNode }) {
  const { width } = useWindowDimensions();
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const height = useSharedValue(0);
  const marginBottom = useSharedValue(ROW_MARGIN);
  const exiting = useSharedValue(false);

  const pan = Gesture.Pan()
    .activeOffsetX([-16, 16])
    .failOffsetY([-8, 8])
    .onUpdate((e) => {
      if (exiting.value) return;
      translateX.value = Math.max(-width, Math.min(0, e.translationX));
    })
    .onEnd((e) => {
      if (exiting.value) return;
      if (e.translationX < DISMISS_THRESHOLD) {
        exiting.value = true;
        translateX.value = withTiming(-width, { duration: 170 });
        opacity.value = withTiming(0, { duration: 170 }, (finished) => {
          if (!finished) return;
          height.value = withTiming(0, { duration: 150 }, (finished2) => {
            if (finished2) runOnJS(onRemove)();
          });
          marginBottom.value = withTiming(0, { duration: 150 });
        });
        // Safety net: if the exit animation is interrupted (e.g. the user
        // navigates away mid-swipe), its completion callbacks never fire and
        // the row would stay in the store while looking gone. The scheduled
        // removal keeps state consistent; when the animation completes first
        // the second call is a no-op (remove is idempotent).
        runOnJS(scheduleRemoval)(onRemove);
      } else {
        translateX.value = withSpring(0, { damping: 28, stiffness: 260 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
    marginBottom: marginBottom.value,
    // Height only participates while collapsing: its measured value is captured
    // in onLayout, then animated to 0 so sibling rows reflow without a jump.
    height: exiting.value ? height.value : undefined,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={animatedStyle}
        onLayout={(e) => {
          // Reanimated shared values are mutable by design; this write is a
          // false positive for the React Compiler immutability rule.
          // eslint-disable-next-line react-hooks/immutability
          height.value = e.nativeEvent.layout.height;
        }}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

export default function FavoritesScreen() {
  const router = useRouter();
  const { favoriteBuses, favoriteStops, isBusFavorite, isStopFavorite, toggleFavoriteBus, toggleFavoriteStop, removeFavoriteBus, removeFavoriteStop, updateBusLabel, updateStopLabel } = useFavorites();

  const [labelModal, setLabelModal] = useState<{
    type: 'bus' | 'stop';
    id: string;
    initialLabel: string;
    itemName: string;
    title: string;
  } | null>(null);

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

  return (
    <View style={[styles.container]}>
      <View style={styles.content}>
        <Title style={styles.title}>Favorite Bus Lines</Title>
        {favoriteBuses.length === 0 ? (
          <Text style={styles.emptyMessage}>No favorite bus lines yet</Text>
        ) : (
          <FlatList
            data={favoriteBuses}
            keyExtractor={(bus) => bus.routeId}
            renderItem={({ item }) => (
              <SwipeToRemove onRemove={() => removeFavoriteBus(item.routeId)}>
                <Pressable style={styles.item} onPress={() => handleBusPress(item)}>
                  <View style={[styles.badgeBackground, { backgroundColor: item.routeColor ? `#${item.routeColor}` : COLORS.primary }]}>
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
                      onPress={() => toggleFavoriteBus({
                        routeId: item.routeId,
                        routeShortName: item.routeShortName,
                        routeLongName: item.routeLongName,
                        routeColor: item.routeColor,
                        routeTextColor: item.routeTextColor,
                      })}
                      accessibilityLabel={isBusFavorite(item.routeId) ? 'Remove from favorites' : 'Add to favorites'}
                    />
                    <IconButton
                      icon='pencil'
                      onPress={() => handleBusEdit(item)}
                      accessibilityLabel='Editar label'
                    />
                  </View>
                </Pressable>
              </SwipeToRemove>
            )}
            contentContainerStyle={styles.listContent}
          />
        )}
        <Divider style={styles.divider} />
        <Title style={styles.title}>Favorite Stops</Title>
        {favoriteStops.length === 0 ? (
          <Text style={styles.emptyMessage}>No favorite stops yet</Text>
        ) : (
          <FlatList
            data={favoriteStops}
            keyExtractor={(stop) => stop.stopId}
            renderItem={({ item }) => (
              <SwipeToRemove onRemove={() => removeFavoriteStop(item.stopId)}>
                <Pressable style={styles.item} onPress={() => handleStopPress(item)}>
                  <View style={[styles.badgeBackground, { backgroundColor: COLORS.primary }]}>
                    <Text style={styles.badgeText}>&#9733;</Text>
                  </View>
                  <View style={styles.stopInfo}>
                    <Text style={styles.stopName}>{item.stopName}</Text>
                    {item.label && (
                      <Text style={styles.stopLabel}>Label: {item.label}</Text>
                    )}
                  </View>
                  <View style={styles.favoriteArea}>
                    <IconButton
                      icon={isStopFavorite(item.stopId) ? 'star' : 'star-outline'}
                      onPress={() => toggleFavoriteStop({
                        stopId: item.stopId,
                        stopName: item.stopName,
                        label: item.label,
                        lat: item.lat,
                        lon: item.lon,
                      })}
                      accessibilityLabel={isStopFavorite(item.stopId) ? 'Remove from favorites' : 'Add to favorites'}
                    />
                    <IconButton
                      icon='pencil'
                      onPress={() => handleStopEdit(item)}
                      accessibilityLabel='Editar label'
                    />
                  </View>
                </Pressable>
              </SwipeToRemove>
            )}
            contentContainerStyle={styles.listContent}
          />
        )}
        <Divider style={styles.divider} />
        <Text style={styles.subtitle}>Favorite bus lines and labeled stops</Text>
        <TrackingList />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    marginBottom: 8,
  },
  emptyMessage: {
    color: '#79747E',
    fontSize: 16,
    textAlign: 'center',
    padding: 24,
  },
  divider: {
    marginVertical: 8,
    borderColor: '#EEE',
  },
  subtitle: {
    color: '#79747E',
    textAlign: 'center',
    marginTop: 4,
  },
  // Unified item style - same for buses and stops, only the badge icon differs
  item: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  swipeRightIcon: {
    marginRight: 8,
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