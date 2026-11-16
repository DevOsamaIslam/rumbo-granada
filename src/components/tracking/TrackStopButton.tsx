import { Alert, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBusTracking } from '@/hooks/useBusTracking';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@/constants/colors';
import { hapticTap, hapticSuccess } from '@/utils/haptics';

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
  const { t } = useTranslation();
  const pair = trackedPairs.find(
    (p) => p.routeId === routeId && p.stopId === stopId,
  );
  const isActive = !!pair?.enabled;

  const confirmTrack = () => {
    void hapticSuccess();
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
    void hapticTap();
    if (pair) {
      toggleTracking(pair.id);
      return;
    }

    const existing = trackedPairs[0];
    if (existing) {
      // One tracking at a time: confirm before replacing the current one.
      Alert.alert(
        t('replaceTracking', { ns: 'translation' }),
        t('replaceTrackingMessage', {
          ns: 'translation',
          currentLine: existing.routeShortName,
          currentStop: existing.stopName,
          newLine: routeShortName,
          newStop: stopName,
        }),
        [
          { text: t('cancel', { ns: 'translation' }), style: 'cancel' },
          { text: t('replace', { ns: 'translation' }), onPress: confirmTrack },
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
        isActive ? t('stopTracking', { ns: 'translation' }) : t('resumeTracking', { ns: 'translation' })
      }
      accessibilityRole="button"
      hitSlop={styles.hitSlop}
    >
      <MaterialCommunityIcons
        name={isActive ? 'bell-ring' : 'bell-outline'}
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
