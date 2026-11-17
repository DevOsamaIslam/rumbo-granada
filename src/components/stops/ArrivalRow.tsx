import { StyleSheet, Text, View } from 'react-native';
import { useAppColors, useThemedStyles } from '@/constants/themes';
import type { AppColors } from '@/constants/colors';
import { formatCountdown } from '@/utils/gtfs';
import { formatNumber } from '@/utils/format';
import { isRtlLanguage } from '@/utils/rtl';
import i18n from '@/i18n';
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
/**
 * Formats the countdown shown on the right of a row.
 *
 * Latin locales keep the compact `12 min` / `1h 15min` format, while RTL
 * locales (Arabic) render Arabic-Indic digits and use the short unit labels
 * from the translation files.
 */
export function formatArrivalMinutes(
  minutes: number,
  t: TFunction,
  language: string = 'es',
): string {
  if (minutes <= 0) return t('now');
  if (!isRtlLanguage(language)) return formatCountdown(minutes);

  const n = (value: number) => formatNumber(value, language);
  if (minutes < 60) return `${n(minutes)} ${t('minutesShort')}`;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0
    ? `${n(hours)}${t('hourShort')} ${n(mins)}${t('minutesShort')}`
    : `${n(hours)}${t('hourShort')}`;
}

export function ArrivalRow({ arrival, lineColor, lineTextColor }: ArrivalRowProps) {
  const { t } = useTranslation();
  const colors = useAppColors();
  const styles = useThemedStyles(createStyles);
  const badgeColor = getBadgeBackgroundColor(lineColor, colors.primary);
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
      </View>
      <Text style={styles.minutes}>
        {formatArrivalMinutes(arrival.minutes, t, i18n.language)}
      </Text>
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
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
    color: colors.onSurface,
  },
  minutes: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
});
