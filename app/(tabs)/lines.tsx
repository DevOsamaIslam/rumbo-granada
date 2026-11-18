import { View, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SearchBar } from '@/components/common';
import { LineList } from '@/components/lines';
import { useLines } from '@/hooks/useLines';
import { useFavorites } from '@/hooks/useFavorites';
import { filterLines } from '@/utils/gtfs';
import { Route } from '@/types/gtfs';
import { useTranslation } from 'react-i18next';
import { hapticTap } from '@/utils/haptics';
import { useAppColors, useThemedStyles } from '@/constants/themes';
import type { AppColors } from '@/constants/colors';

export default function LinesScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { routes, isLoading, error, loadLines } = useLines();
  const { isBusFavorite, toggleFavoriteBus } = useFavorites();
  const {t} = useTranslation();
  const colors = useAppColors();
  const styles = useThemedStyles(createStyles);

  const filtered = filterLines(routes, query);

  const handleRefresh = async () => {
    void hapticTap();
    setRefreshing(true);
    await loadLines();
    setRefreshing(false);
  };

  const handleLinePress = (route: Route) => {
    void hapticTap();
    router.push(`/line/${route.route_id}`);
  };

  const handleToggleFavorite = (route: Route) => {
    void hapticTap();
    toggleFavoriteBus({
      routeId: route.route_id,
      routeShortName: route.route_short_name,
      routeLongName: route.route_long_name,
      routeColor: route.route_color ?? '',
      routeTextColor: route.route_text_color ?? '',
    });
  };

  return (
    <View style={[styles.container]}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name="bus"
            size={32}
            color={colors.primary}
            accessibilityRole="image"
            accessibilityLabel={t('busLines', { ns: 'translation' })}
          />
        </View>
        <SearchBar
          placeholder={t('searchLinesPlaceholder', { ns: 'translation' })}
          value={query}
          onChangeText={setQuery}
          style={styles.searchBar}
        />
      </View>
      <LineList
        routes={filtered}
        isLoading={isLoading}
        error={error}
        isFavorite={isBusFavorite}
        onPress={handleLinePress}
        onToggleFavorite={handleToggleFavorite}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        emptyMessage={
          query
            ? t('noLinesMatchSearch', { ns: 'translation' })
            : t('noLinesFound', { ns: 'translation' })
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