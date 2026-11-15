import { View, Text, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SearchBar } from '@/components/common';
import { LineList } from '@/components/lines';
import { useLines } from '@/hooks/useLines';
import { useFavorites } from '@/hooks/useFavorites';
import { filterLines } from '@/utils/gtfs';
import { Route } from '@/types/gtfs';
import { useTranslation } from 'react-i18next';

export default function LinesScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { routes, isLoading, error, loadLines } = useLines();
  const { isBusFavorite, toggleFavoriteBus } = useFavorites();
  const {t} = useTranslation();

  const filtered = filterLines(routes, query);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLines();
    setRefreshing(false);
  };

  const handleLinePress = (route: Route) => {
    router.push(`/line/${route.route_id}`);
  };

  const handleToggleFavorite = (route: Route) => {
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
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{t('busLines', { ns: 'translation' })}</Text>
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
});