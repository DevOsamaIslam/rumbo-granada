import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Route } from '@/types/gtfs';
import { useTranslation } from 'react-i18next';
import { LineItem } from './LineItem';
import { SkeletonListItem } from '@/components/common/Skeleton';

interface LineListProps {
  routes: Route[];
  isLoading: boolean;
  error: Error | null;
  isFavorite: (routeId: string) => boolean;
  onPress: (route: Route) => void;
  onToggleFavorite: (route: Route) => void;
  onRefresh: () => void;
  refreshing: boolean;
  emptyMessage?: string;
}

export function LineList({
  routes,
  isLoading,
  error,
  isFavorite,
  onPress,
  onToggleFavorite,
  onRefresh,
  refreshing,
  emptyMessage,
}: LineListProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <View
        style={styles.skeletonContainer}
        accessibilityLabel={t('loadingLines', { ns: 'translation' })}
      >
        {[...Array(6)].map((_, i) => (
          <SkeletonListItem key={i} />
        ))}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{t('failedToLoadLines', { ns: 'translation' })}</Text>
        <Text style={styles.errorDetail}>{error.message}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={routes}
      keyExtractor={(route) => route.route_id}
      renderItem={({ item }) => (
        <LineItem
          route={item}
          isFavorite={isFavorite(item.route_id)}
          onPress={onPress}
          onToggleFavorite={onToggleFavorite}
        />
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{emptyMessage ?? t('noLinesFound', { ns: 'translation' })}</Text>
        </View>
      }
      contentContainerStyle={styles.listContent}
      refreshing={refreshing}
      onRefresh={onRefresh}
      initialNumToRender={15}
      maxToRenderPerBatch={15}
      windowSize={7}
    />
  );
}

const styles = StyleSheet.create({
  skeletonContainer: {
    padding: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 24,
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  errorText: {
    color: '#B00020',
    fontSize: 15,
    fontWeight: '600',
  },
  errorDetail: {
    color: '#B00020',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyText: {
    color: '#79747E',
    fontSize: 15,
  },
});