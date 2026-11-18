import { View, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SearchBar } from '@/components/common';
import { StopList } from '@/components/stops';
import { useStops } from '@/hooks/useStops';
import { useFavorites } from '@/hooks/useFavorites';
import { useTranslation } from 'react-i18next';
import { hapticTap } from '@/utils/haptics';
import { Stop } from '@/types/gtfs';
import { FavoriteStop } from '@/types/favorites';
import { useAppColors, useThemedStyles } from '@/constants/themes';
import type { AppColors } from '@/constants/colors';

export default function StopsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  // The hook loads every stop on mount, so the list fills without an extra call.
  const { stops, isLoading, error, loadAllStops } = useStops();
  const { isStopFavorite, toggleFavoriteStop } = useFavorites();
  const { t } = useTranslation();
  const colors = useAppColors();
  const styles = useThemedStyles(createStyles);

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name="bus-stop"
            size={32}
            color={colors.primary}
            accessibilityRole="image"
            accessibilityLabel={t('stops', { ns: 'translation' })}
          />
        </View>
        <SearchBar
          placeholder={t('searchStopsPlaceholder', { ns: 'translation' })}
          value={query}
          onChangeText={setQuery}
          style={styles.searchBar}
        />
      </View>
      <StopList
        stops={filtered}
        isLoading={isLoading}
        error={error}
        isFavorite={isStopFavorite}
        onPress={handleStopPress}
        onToggleFavorite={handleToggleFavorite}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        emptyMessage={
          query
            ? t('noStopsMatchSearch', { ns: 'translation' })
            : t('noStopsFound', { ns: 'translation' })
        }
      />
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 8,
    gap: 8,
  },
  // Takes the leftover space beside the search box so the icon sits centred in
  // it instead of hugging the screen edge.
  iconContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flex: 2,
    minWidth: 150,
    maxWidth: 300,
  },
});
