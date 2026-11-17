import { View, Text, StyleSheet, Pressable, FlatList, Platform } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SearchBar } from '@/components/common';
import { useStops } from '@/hooks/useStops';
import { useFavorites } from '@/hooks/useFavorites';
import { useTranslation } from 'react-i18next';
import { hapticTap } from '@/utils/haptics';
import { Stop } from '@/types/gtfs';
import { FavoriteStop } from '@/types/favorites';
import { RefreshControl } from 'react-native';

export default function StopsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { stops, isLoading, error, loadAllStops } = useStops();
  const { isStopFavorite, toggleFavoriteStop } = useFavorites();
  const { t } = useTranslation();

  // Automatically load stops on mount
  useStops(); // This triggers the useEffect

  // Filter stops by query (accent/case-insensitive match on stop_id/stop_code/stop_name)
  const filtered = stops.filter((stop: Stop) => {
    const lowerQuery = query.toLowerCase();
    return (
      stop.stop_name.toLowerCase().includes(lowerQuery) ||
      (stop.stop_code?.toLowerCase().includes(lowerQuery)) ||
      stop.stop_id.toLowerCase().includes(lowerQuery)
    );
  });

  const handleRefresh = async () => {
    void hapticTap();
    setRefreshing(true);
    await loadAllStops();
    setRefreshing(false);
  };

  const handleStopPress = (stop: Stop) => {
    void hapticTap();
    router.push(`/stop/${stop.stop_id}`);
  };

  const handleToggleFavorite = (stop: Stop) => {
    const favoriteStop: FavoriteStop = {
      stopId: stop.stop_id,
      stopName: stop.stop_name,
      label: '',
      lat: 0,
      lon: 0,
    };
    void hapticTap();
    toggleFavoriteStop(favoriteStop);
  };

  const renderStop = ({ item }: { item: Stop }) => {
    const stop = item;
    const isFavorite = isStopFavorite(stop.stop_id);
    return (
      <Pressable
        key={stop.stop_id}
        style={styles.listItem}
        onPress={() => handleStopPress(stop)}
        accessibilityLabel={t('stopAccessibility', { stopName: stop.stop_name })}
        accessibilityRole="button"
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{stop.stop_name.substring(0, 2).toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.stopName}>{stop.stop_name}</Text>
          {stop.stop_code && (
            <Text style={styles.stopCode}>({stop.stop_code})</Text>
          )}
        </View>
        <IconButton
        icon={isFavorite ? 'star' : 'star-outline'}
        onPress={(event) => {
          // Toggle the favorite without also navigating to the stop page.
          event.stopPropagation();
          handleToggleFavorite(stop);
        }}
        hitSlop={{ top: 20, bottom: 20, left: 15, right: 15 }}
        accessibilityLabel={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
      />
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{t('stops', { ns: 'translation' })}</Text>
        </View>
        <SearchBar
          placeholder={t('searchStopsPlaceholder', { ns: 'translation' })}
          value={query}
          onChangeText={setQuery}
          style={styles.searchBar}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(stop) => stop.stop_id}
        renderItem={renderStop}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('noStopsFound', { ns: 'translation' })}</Text>
          </View>
        }
        horizontal={false}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#6200EE"
            title={t('refreshing', { ns: 'translation' })}
          />
        }
        contentContainerStyle={styles.listContent}
        initialNumToRender={15}
        maxToRenderPerBatch={15}
        windowSize={7}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 8,
    gap: 12,
  },
  titleContainer: {
    flexShrink: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  searchBar: {
    flex: 1,
    minWidth: 150,
    maxWidth: 300,
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 24,
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#79747E',
    fontSize: 15,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 12,
    backgroundColor: Platform.select({ ios: '#fff', android: '#F5F5F5', default: '#fff' }),
    marginBottom: 8,
  },
  badge: {
    minWidth: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    backgroundColor: '#E0E0E0',
  },
  badgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  stopName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
  },
  stopCode: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  favoriteButton: {
    alignItems: 'flex-end',
  },
});
