import { useCallback, useEffect, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBusTracking } from '@/hooks/useBusTracking';
import { formatTrackingBody } from '@/services/notifications';
import { COLORS } from '@/constants/colors';

const LOGO = require('../../../assets/logo.png');

/** Live status colors: green while a tracking is active, grey otherwise. */
const LIVE_ACTIVE_COLOR = '#4CAF50';
const LIVE_INACTIVE_COLOR = '#9E9E9E';

/**
 * App-wide header: logo on the left, a live status icon on the right.
 *
 * The live icon is green and pulsing while a bus tracking is active — tapping
 * it opens a card with the tracking details and a cancel button. With no
 * active tracking it is grey and inert.
 */
export function AppHeader() {
  const { trackedPairs, arrivals, removeTrackedPair } = useBusTracking();
  const pair = trackedPairs[0];
  const isActive = !!pair?.enabled;
  // Pad below the system status bar so the header never sits under the
  // clock / notification / battery icons.
  const insets = useSafeAreaInsets();

  const [cardVisible, setCardVisible] = useState(false);
  const [cardSummary, setCardSummary] = useState('');
  // Stable Animated.Value for the pulse (useState so it is created once).
  const [pulse] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!isActive) {
      pulse.setValue(1);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.3,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [isActive, pulse]);

  const handleCancel = useCallback(() => {
    if (!pair) return;
    removeTrackedPair(pair.id);
    setCardVisible(false);
  }, [pair, removeTrackedPair]);

  // The summary is computed when the card opens (an event, not render) so the
  // impure Date.now() call is allowed and the values are fresh.
  const openCard = useCallback(() => {
    if (!pair) return;
    const predictions = arrivals.get(pair.stopId);
    if (!predictions || predictions.length === 0) {
      setCardSummary('Buscando llegadas…');
    } else {
      const now = Date.now();
      const minutes = [
        ...new Set(
          predictions
            .map((prediction) =>
              Math.round((prediction.arrivalTime - now) / 60_000),
            )
            .filter((minutes) => minutes >= 0),
        ),
      ].sort((a, b) => a - b);
      setCardSummary(formatTrackingBody(minutes));
    }
    setCardVisible(true);
  }, [arrivals, pair]);

  return (
    <View
      style={[
        styles.header,
        { paddingTop: insets.top + styles.header.paddingVertical },
      ]}
    >
      <Image source={LOGO} style={styles.logo} accessibilityLabel='Granabus' />

      <Pressable
        style={styles.liveButton}
        onPress={isActive ? openCard : undefined}
        disabled={!isActive}
        accessibilityRole={isActive ? 'button' : 'text'}
        accessibilityLabel={
          isActive ? 'Ver seguimiento activo' : 'Sin seguimiento activo'
        }
        accessibilityState={{ disabled: !isActive }}
        hitSlop={8}
      >
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <MaterialCommunityIcons
            name='broadcast'
            size={26}
            color={isActive ? LIVE_ACTIVE_COLOR : LIVE_INACTIVE_COLOR}
          />
        </Animated.View>
      </Pressable>

      <Modal
        visible={cardVisible && !!pair}
        transparent
        animationType='fade'
        onRequestClose={() => setCardVisible(false)}
      >
        <Pressable
          style={styles.scrim}
          onPress={() => setCardVisible(false)}
          accessibilityLabel='Cerrar seguimiento'
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Seguimiento activo</Text>
            {pair ? (
              <>
                <Text style={styles.cardLine}>
                  Línea {pair.routeShortName} → {pair.stopName}
                </Text>
                <Text style={styles.cardBody}>{cardSummary}</Text>
                <Pressable
                  style={styles.cancelButton}
                  onPress={handleCancel}
                  accessibilityRole='button'
                  accessibilityLabel='Cancelar seguimiento'
                >
                  <Text style={styles.cancelButtonText}>
                    Cancelar seguimiento
                  </Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.outlineVariant,
  },
  logo: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
  liveButton: {
    padding: 6,
  },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  cardLine: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  cardBody: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
  },
  cancelButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.errorContainer,
  },
  cancelButtonText: {
    color: COLORS.error,
    fontWeight: '600',
  },
});