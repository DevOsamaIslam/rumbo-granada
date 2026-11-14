import { View, Text, StyleSheet, Pressable } from 'react-native';
import { IconButton } from 'react-native-paper';
import { Route } from '@/types/gtfs';
import { getBadgeBackgroundColor, getBadgeTextColor } from '@/utils/colors';

interface LineItemProps {
  route: Route;
  isFavorite: boolean;
  onPress: (route: Route) => void;
  onToggleFavorite: (route: Route) => void;
}

export function LineItem({ route, isFavorite, onPress, onToggleFavorite }: LineItemProps) {
  const color = getBadgeBackgroundColor(route.route_color, '#6200EE');
  const textColor = getBadgeTextColor(color, route.route_text_color);

  return (
    <Pressable
      style={styles.container}
      onPress={() => onPress(route)}
      accessibilityLabel={`Line ${route.route_short_name}`}
      accessibilityRole="button"
    >
      <View style={[styles.badge, { backgroundColor: color }]}>
        <Text style={[styles.badgeText, { color: textColor }]}>{route.route_short_name}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.shortName} numberOfLines={1}>
          Line {route.route_short_name}
        </Text>
        <Text style={styles.longName} numberOfLines={2}>
          {route.route_long_name}
        </Text>
      </View>
      <IconButton
        icon={isFavorite ? 'star' : 'star-outline'}
        onPress={() => onToggleFavorite(route)}
        accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  },
  longName: {
    fontSize: 13,
    color: '#79747E',
  },
});