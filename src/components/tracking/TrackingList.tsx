import { FlatList, StyleSheet, Text, View, Pressable } from 'react-native';
import { Divider, Switch } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBusTracking } from '@/hooks/useBusTracking';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@/constants/colors';
import { hapticTap } from '@/utils/haptics';

/**
 * List of active bus trackings, shown on the Favorites tab.
 *
 * Each row shows the route heading to the stop, lets the user enable/disable
 * tracking with a switch, and remove a pair entirely.
 */
export function TrackingList() {
  const { trackedPairs, toggleTracking, removeTrackedPair } = useBusTracking();
  const { t } = useTranslation();

  if (trackedPairs.length === 0) return null;

  return (
    <View style={styles.container}>
      <Divider style={styles.divider} />
      <Text style={styles.title}>Seguimiento activo</Text>
      <FlatList
        data={trackedPairs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => {
              void hapticTap();
              removeTrackedPair(item.id);
            }}
            accessibilityLabel={
              item.enabled ? t('stopTracking', { ns: 'translation' }) : t('resumeTracking', { ns: 'translation' })
            }
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name="bell-ring"
              size={18}
              color={COLORS.error}
              style={styles.icon}
            />
            <View style={styles.info}>
              <Text style={styles.route}>
                {item.routeShortName} → {item.stopName}
              </Text>
              {item.label && <Text style={styles.label}>{item.label}</Text>}
            </View>
            <Switch
              value={item.enabled}
              onValueChange={() => toggleTracking(item.id)}
              trackColor={{
                false: COLORS.outlineVariant,
                true: COLORS.primary,
              }}
            />
          </Pressable>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  divider: {
    marginVertical: 12,
    borderColor: COLORS.outlineVariant,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.onSurface,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  icon: {
    marginRight: 10,
  },
  info: {
    flex: 1,
  },
  route: {
    fontSize: 15,
    color: COLORS.onSurface,
  },
  label: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  listContent: {
    paddingBottom: 24,
  },
});
