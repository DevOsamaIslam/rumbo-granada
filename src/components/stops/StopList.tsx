import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Stop } from '@/types/gtfs';
import { useTranslation } from 'react-i18next';
import { StopItem } from './StopItem';
import { SkeletonListItem } from '@/components/common/Skeleton';
import { useThemedStyles } from '@/constants/themes';
import type { AppColors } from '@/constants/colors';

interface StopListProps {
  stops: Stop[];
  isLoading: boolean;
  error: Error | null;
  isFavorite: (stopId: string) => boolean;
  onPress: (stop: Stop) => void;
  onToggleFavorite: (stop: Stop) => void;
  onRefresh: () => void;
  refreshing: boolean;
  emptyMessage?: string;
}

export function StopList({
  stops,
  isLoading,
  error,
  isFavorite,
  onPress,
  onToggleFavorite,
  onRefresh,
  refreshing,
  emptyMessage,
}: StopListProps) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);

  if (isLoading) {
    return (
      <View
        style={styles.skeletonContainer}
        accessibilityLabel={t('loadingStops', { ns: 'translation' })}
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
        <Text style={styles.errorText}>{t('failedToLoadStops', { ns: 'translation' })}</Text>
        <Text style={styles.errorDetail}>{error.message}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={stops}
      keyExtractor={(stop) => stop.stop_id}
      renderItem={({ item }) => (
        <StopItem
          stop={item}
          isFavorite={isFavorite(item.stop_id)}
          onPress={onPress}
          onToggleFavorite={onToggleFavorite}
        />
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{emptyMessage ?? t('noStopsFound', { ns: 'translation' })}</Text>
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

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
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
    backgroundColor: colors.outlineVariant,
  },
  errorText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '600',
  },
  errorDetail: {
    color: colors.error,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyText: {
    color: colors.onSurfaceVariant,
    fontSize: 15,
  },
});
