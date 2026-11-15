import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/constants/colors';
import { formatCountdown } from '@/utils/gtfs';
import { getBadgeBackgroundColor, getBadgeTextColor } from '@/utils/colors';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { Arrival } from '@/types/api';

export interface ArrivalRowProps {
  arrival: Arrival;
  /** Line colour from GTFS (hex without `#`), when the line is known. */
  lineColor?: string;
  /** GTFS `route_text_color`; derived from the background when absent. */
  lineTextColor?: string;
}

/** Formats the countdown shown on the right of a row. */
export function formatArrivalMinutes(minutes: number, t: TFunction): string {
  if (minutes <= 0) return t('now');
  return formatCountdown(minutes);
}

export function ArrivalRow({ arrival, lineColor, lineTextColor }: ArrivalRowProps) {
  const { t } = useTranslation();
  const badgeColor = getBadgeBackgroundColor(lineColor, COLORS.primary);
  // Many routes ship without `route_text_color`; derive a legible one so the line
  // code stays readable on light backgrounds.
  const badgeTextColor = getBadgeTextColor(badgeColor, lineTextColor);

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { backgroundColor: badgeColor }]}>
        <Text style={[styles.badgeText, { color: badgeTextColor }]}>
          {arrival.lineCode}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.destination} numberOfLines={2}>
          {arrival.destination}
        </Text>
        <Text style={styles.schedule}>
          {arrival.scheduledTime}
          {arrival.isRealTime ? '' : ` · ${t('estimated')}`}
        </Text>
      </View>
      <Text style={styles.minutes}>
        {formatArrivalMinutes(arrival.minutes, t)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.outlineVariant,
  },
  badge: {
    minWidth: 44,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  destination: {
    fontSize: 15,
    color: COLORS.onSurface,
  },
  schedule: {
    fontSize: 12,
    color: COLORS.outline,
  },
  minutes: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
