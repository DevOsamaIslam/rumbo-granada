import { View, Text, StyleSheet, Pressable } from 'react-native';
import { IconButton } from 'react-native-paper';
import { Route } from '@/types/gtfs';
import { getBadgeBackgroundColor, getBadgeTextColor } from '@/utils/colors';
import { useTranslation } from 'react-i18next';
import { useAppColors, useThemedStyles } from '@/constants/themes';
import type { AppColors } from '@/constants/colors';

interface LineItemProps {
  route: Route;
  isFavorite: boolean;
  onPress: (route: Route) => void;
  onToggleFavorite: (route: Route) => void;
}

export function LineItem({ route, isFavorite, onPress, onToggleFavorite }: LineItemProps) {
  const { t } = useTranslation();
  const colors = useAppColors();
  const styles = useThemedStyles(createStyles);
  const color = getBadgeBackgroundColor(route.route_color, colors.primary);
  const textColor = getBadgeTextColor(color, route.route_text_color);

  return (
    <Pressable
      style={styles.container}
      onPress={() => onPress(route)}
      accessibilityLabel={t('lineTitle', { line: route.route_short_name })}
      accessibilityRole="button"
    >
      <View style={[styles.badge, { backgroundColor: color }]}>
        <Text style={[styles.badgeText, { color: textColor }]}>{route.route_short_name}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.shortName} numberOfLines={1}>
          {t('lineTitle', { line: route.route_short_name })}
        </Text>
        <Text style={styles.longName} numberOfLines={2}>
          {route.route_long_name}
        </Text>
      </View>
      <IconButton
        icon={isFavorite ? 'star' : 'star-outline'}
        onPress={(event) => {
          // Toggle the favorite without also navigating to the line page.
          event.stopPropagation();
          onToggleFavorite(route);
        }}
        // Make the whole area around the star clickable so tapping just above
        // or below the icon toggles the favorite instead of opening the line.
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
  },
  badgeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  shortName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
  },
  longName: {
    fontSize: 13,
    color: colors.outline,
  },
});