import { ActivityIndicator, Text } from 'react-native-paper';
import { FlatList, StyleSheet, View } from 'react-native';
import { ArrivalRow } from './ArrivalRow';
import { COLORS } from '@/constants/colors';
import { useTranslation } from 'react-i18next';
import type { Arrival } from '@/types/api';

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
): string | null {
  if (!timestamp) return null;
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 10) return 'Actualizado ahora';
  if (seconds < 60) return `Actualizado hace ${seconds}s`;
  const minutes = Math.round(seconds / 60);
  return `Actualizado hace ${minutes} min`;
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
  const updatedAt = formatLastUpdated(lastUpdated);
  const header = updatedAt ? (
    <Text style={styles.updatedAt}>{updatedAt}</Text>
  ) : null;

  if (isLoading && arrivals.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator
          animating
          size='large'
          accessibilityLabel={t('loadingArrivals', { ns: 'translation' })}
        />
      </View>
    );
  }

  if (error && arrivals.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>
          No se pudieron cargar las llegadas
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
          <Text style={styles.emptyText}>No hay autobuses previstos</Text>
        </View>
      }
      contentContainerStyle={styles.content}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  content: {
    paddingBottom: 24,
  },
  updatedAt: {
    fontSize: 12,
    color: COLORS.outline,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.outline,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.error,
    textAlign: 'center',
  },
  errorDetail: {
    fontSize: 13,
    color: COLORS.error,
    textAlign: 'center',
  },
});
