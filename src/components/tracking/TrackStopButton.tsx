import { Alert, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBusTracking } from '@/hooks/useBusTracking';
import { COLORS } from '@/constants/colors';

export interface TrackStopButtonProps {
  routeId: string;
  routeShortName: string;
  stopId: string;
  /**
   * GTFS `stop_code` (the number the live API expects). Falls back to `stopId`
   * when not provided.
   */
  stopCode?: string;
  stopName: string;
  label?: string;
}

/**
 * "Track this bus to this stop" button.
 *
 * Tapping it adds a (route, stop) pair to the tracking store so the hook can
 * poll its arrivals and notify when the bus is close. If the pair is already
 * tracked, tapping toggles it off instead.
 */
export function TrackStopButton({
  routeId,
  routeShortName,
  stopId,
  stopCode,
  stopName,
  label,
}: TrackStopButtonProps) {
  const {
    addTrackedPair,
    toggleTracking,
    trackedPairs,
  } = useBusTracking();
  const pair = trackedPairs.find(
    (p) => p.routeId === routeId && p.stopId === stopId,
  );
  const isActive = !!pair?.enabled;

  const confirmTrack = () => {
    addTrackedPair({
      routeId,
      routeShortName,
      stopId,
      stopCode: stopCode || stopId,
      stopName,
      label: label ?? stopName,
      thresholdMinutes: 5,
      enabled: true,
    });
  };

  const handlePress = () => {
    if (pair) {
      toggleTracking(pair.id);
      return;
    }

    const existing = trackedPairs[0];
    if (existing) {
      // One tracking at a time: confirm before replacing the current one.
      Alert.alert(
        'Reemplazar seguimiento',
        `Ya estás rastreando la línea ${existing.routeShortName} hasta ${existing.stopName}. ¿Quieres reemplazarla por la línea ${routeShortName} hasta ${stopName}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Reemplazar', onPress: confirmTrack },
        ],
      );
      return;
    }

    confirmTrack();
  };

  return (
    <Pressable
      style={styles.button}
      onPress={handlePress}
      accessibilityLabel={
        isActive ? 'Dejar de rastrear autobús' : 'Rastrear autobús hasta parada'
      }
      accessibilityRole="button"
      hitSlop={styles.hitSlop}
    >
      <MaterialCommunityIcons
        name={isActive ? 'bell-ring' : 'bell'}
        size={24}
        color={isActive ? COLORS.error : COLORS.primary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  hitSlop: { top: 12, bottom: 12, left: 12, right: 12 },
});
