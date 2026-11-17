import { Text } from 'react-native-paper';
import { FlatList, StyleSheet, View } from 'react-native';
import { ArrivalRow } from './ArrivalRow';
import { useThemedStyles } from '@/constants/themes';
import type { AppColors } from '@/constants/colors';
import { formatNumber } from '@/utils/format';
import i18n from '@/i18n';
import { useTranslation } from 'react-i18next';
import { SkeletonListItem } from '@/components/common/Skeleton';
import type { Arrival } from '@/types/api';
import type { TFunction } from 'i18next';

export interface ArrivalsListProps {
  arrivals: Arrival[];
  isLoading: boolean;
  error: Error | null;
  /** Colour lookup by GTFS `route_short_name`, used for the line badge. */
  lineColorFor?: (lineCode: string) => string | undefined;
  /** Text colour lookup for the badge; derived from the background when absent. */
  lineTextColorFor?: (lineCode: string) => string | undefined;
  onRefresh: () => void;
  refreshing?: boolean;
  lastUpdated?: number | null;
}

function formatLastUpdated(
  timestamp: number | null | undefined,
  t: TFunction,
  language: string = 'es',
): string | null {
  if (!timestamp) return null;
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 10) return t('updatedNow');
  if (seconds < 60) {
    return t('updatedSecondsAgo', { seconds: formatNumber(seconds, language) });
  }
  const minutes = Math.round(seconds / 60);
  return t('updatedMinutesAgo', { minutes: formatNumber(minutes, language) });
}

export function ArrivalsList({
  arrivals,
  isLoading,
  error,
  lineColorFor,
  lineTextColorFor,
  onRefresh,
  refreshing = false,
  lastUpdated = null,
}: ArrivalsListProps) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const updatedAt = formatLastUpdated(lastUpdated, t, i18n.language);
  const header = updatedAt ? (
    <Text style={styles.updatedAt}>{updatedAt}</Text>
  ) : null;

  if (isLoading && arrivals.length === 0) {
    return (
      <View
        style={styles.skeletonContainer}
        accessibilityLabel={t('loadingArrivals', { ns: 'translation' })}
      >
        {[...Array(4)].map((_, i) => (
          <SkeletonListItem key={i} />
        ))}
      </View>
    );
  }

  if (error && arrivals.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>
          {t('failedToLoadArrivals', { ns: 'translation' })}
        </Text>
        <Text style={styles.errorDetail}>{error.message}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={arrivals}
      keyExtractor={(item, index) =>
        `${item.lineCode}-${item.scheduledTime}-${index}`
      }
      renderItem={({ item }) => (
        <ArrivalRow
          arrival={item}
          lineColor={lineColorFor?.(item.lineCode)}
          lineTextColor={lineTextColorFor?.(item.lineCode)}
        />
      )}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListHeaderComponent={header ?? undefined}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{t('noScheduledBuses', { ns: 'translation' })}</Text>
        </View>
      }
      contentContainerStyle={styles.content}
    />
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  skeletonContainer: {
    padding: 8,
  },
  content: {
    paddingBottom: 24,
  },
  updatedAt: {
    fontSize: 12,
    color: colors.outline,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyText: {
    fontSize: 15,
    color: colors.outline,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.error,
    textAlign: 'center',
  },
  errorDetail: {
    fontSize: 13,
    color: colors.error,
    textAlign: 'center',
  },
});
