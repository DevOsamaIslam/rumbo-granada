import { View, Text, StyleSheet, Pressable } from 'react-native';
import { IconButton } from 'react-native-paper';
import { Stop } from '@/types/gtfs';
import { useTranslation } from 'react-i18next';
import { useThemedStyles } from '@/constants/themes';
import type { AppColors } from '@/constants/colors';

interface StopItemProps {
  stop: Stop;
  isFavorite: boolean;
  onPress: (stop: Stop) => void;
  onToggleFavorite: (stop: Stop) => void;
}

/**
 * Text shown inside the circular badge.
 *
 * A row mirrors `LineItem`, where the circle carries the line number, so here it
 * carries the stop code printed on the physical sign. Stops without a code fall
 * back to the first two letters of the name instead of leaving an empty circle.
 */
export function getStopBadgeLabel(stop: Stop): string {
  const code = stop.stop_code?.trim();
  if (code) return code;
  return stop.stop_name.trim().slice(0, 2).toUpperCase();
}

export function StopItem({ stop, isFavorite, onPress, onToggleFavorite }: StopItemProps) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      style={styles.container}
      onPress={() => onPress(stop)}
      accessibilityLabel={t('stopAccessibility', { ns: 'translation', stopName: stop.stop_name })}
      accessibilityRole="button"
    >
      <View style={styles.badge}>
        <Text style={styles.badgeText} numberOfLines={1}>
          {getStopBadgeLabel(stop)}
        </Text>
      </View>
      <Text style={styles.stopName} numberOfLines={2}>
        {stop.stop_name}
      </Text>
      <IconButton
        icon={isFavorite ? 'star' : 'star-outline'}
        onPress={(event) => {
          // Toggle the favorite without also navigating to the stop page.
          event.stopPropagation();
          onToggleFavorite(stop);
        }}
        // Make the whole area around the star clickable so tapping just above
        // or below the icon toggles the favorite instead of opening the stop.
        hitSlop={{ top: 20, bottom: 20, left: 15, right: 15 }}
        accessibilityLabel={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
      />
    </Pressable>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  badge: {
    minWidth: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    backgroundColor: colors.tertiary,
  },
  badgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onTertiary,
  },
  stopName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.onSurface,
  },
});
