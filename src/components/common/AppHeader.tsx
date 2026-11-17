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
import { Switch } from 'react-native-paper';
import { useBusTracking } from '@/hooks/useBusTracking';
import { formatTrackingBody } from '@/services/notifications';
import { useTranslation } from 'react-i18next';
import { useAppColors, useThemedStyles } from '@/constants/themes';
import type { AppColors } from '@/constants/colors';
import { CONFIG } from '@/constants/config';
import type { ArrivalPrediction, TrackedPair } from '@/types/tracking';

const LOGO = require('../../../assets/logo.png');

/** Refresh cadence of the header countdown; matches the arrival check loop. */
const SUMMARY_REFRESH_MS = CONFIG.NOTIFICATION_CHECK_INTERVAL_MS;

/**
 * Minutes until the tracked line's arrivals at the stop. The live poll stores
 * the line code in `tripId`, so predictions for other lines sharing the stop
 * are filtered out. Sorted ascending and de-duplicated (0 = arriving now).
 * Pure so the logic is unit-testable without React.
 */
export function computePredictionMinutes(
  predictions: ArrivalPrediction[],
  routeShortName: string,
  now: number,
): number[] {
  const minutes = predictions
    .filter((prediction) => prediction.tripId === routeShortName)
    .map((prediction) => Math.round((prediction.arrivalTime - now) / 60_000))
    .filter((minutes) => minutes >= 0);
  return [...new Set(minutes)].sort((a, b) => a - b);
}

/**
 * App-wide header: logo on the left, live tracking status on the right.
 *
 * While a bus tracking is active, the live icon is replaced by a compact chip
 * showing the tracked line, its stop and the countdown — the same content as
 * the persistent notification. Tapping it opens a card with the tracking
 * details and a cancel button. With no active tracking, tapping the live icon
 * opens a dropdown of recent trackings that can be toggled back on.
 */
export function AppHeader() {
  const {
    trackedPairs,
    recentPairs,
    arrivals,
    startTracking,
    stopTracking,
    addTrackedPair,
    toggleTracking,
    removeTrackedPair,
  } = useBusTracking();
  const { t } = useTranslation();
  const pair = trackedPairs[0];
  const isActive = !!pair?.enabled;
  // Primitives for the effect dependencies below.
  const stopId = pair?.stopId;
  const routeShortName = pair?.routeShortName;
  // Pad below the system status bar so the header never sits under the
  // clock / notification / battery icons.
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const styles = useThemedStyles(createStyles);

  const [cardVisible, setCardVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [summary, setSummary] = useState('');
  // Stable Animated.Value for the live dot pulse (useState so it is created once).
  const [pulse] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!isActive) {
      pulse.setValue(1);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.35,
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

  // The header is mounted app-wide, so it owns a polling loop while a tracker
  // is enabled. Without this, its own `arrivals` state stays empty: polling
  // otherwise only runs in the hook instance that started the tracking (the
  // track button's screen), which the header never sees.
  useEffect(() => {
    if (isActive) startTracking();
    else stopTracking();
  }, [isActive, startTracking, stopTracking]);

  // Keep the header countdown in sync with the latest polled arrivals. The
  // impure Date.now() lives in this callback, never in render.
  useEffect(() => {
    if (!isActive || !stopId || !routeShortName) return;
    const update = () => {
      const predictions = arrivals.get(stopId);
      setSummary(
        predictions
          ? formatTrackingBody(
              computePredictionMinutes(predictions, routeShortName, Date.now()),
            )
          : t('loadingArrivals', { ns: 'translation' }),
      );
    };
    update();
    const interval = setInterval(update, SUMMARY_REFRESH_MS);
    return () => clearInterval(interval);
  }, [arrivals, isActive, stopId, routeShortName, t]);

  const handleCancel = useCallback(() => {
    if (!pair) return;
    removeTrackedPair(pair.id);
    setCardVisible(false);
  }, [pair, removeTrackedPair]);

  const openCard = useCallback(() => {
    if (!pair) return;
    setCardVisible(true);
  }, [pair]);

  const openMenu = useCallback(() => setMenuVisible(true), []);

  /** Re-enable a recent tracking, or stop it if it is the active one. */
  const handleRecentToggle = useCallback(
    (recent: TrackedPair) => {
      const active = trackedPairs.find(
        (tracked) =>
          tracked.enabled &&
          tracked.routeId === recent.routeId &&
          tracked.stopId === recent.stopId,
      );
      if (active) {
        toggleTracking(active.id);
      } else {
        addTrackedPair({
          routeId: recent.routeId,
          routeShortName: recent.routeShortName,
          stopId: recent.stopId,
          stopCode: recent.stopCode,
          stopName: recent.stopName,
          label: recent.label,
          thresholdMinutes: recent.thresholdMinutes,
          enabled: true,
        });
      }
      setMenuVisible(false);
    },
    [trackedPairs, toggleTracking, addTrackedPair],
  );

  return (
    <View
      style={[
        styles.header,
        { paddingTop: insets.top + styles.header.paddingVertical },
      ]}
    >
      <Image source={LOGO} style={styles.logo} accessibilityLabel='Granabus' />

      <Pressable
        style={[styles.liveButton, isActive && styles.liveChip]}
        onPress={isActive ? openCard : openMenu}
        accessibilityRole='button'
        accessibilityLabel={
          isActive
            ? t('viewTracking', { ns: 'translation' })
            : t('recentTrackings', { ns: 'translation' })
        }
        hitSlop={8}
      >
        {isActive && pair ? (
          <>
            <Animated.View style={[styles.liveDot, { opacity: pulse }]} />
            <View style={styles.liveText}>
              <Text style={styles.liveTitle} numberOfLines={1}>
                {t('trackingTitle', {
                  line: pair.routeShortName,
                  stop: pair.stopName,
                  ns: 'translation',
                })}
              </Text>
              <Text style={styles.liveSummary} numberOfLines={1}>
                {summary}
              </Text>
            </View>
          </>
        ) : (
          <MaterialCommunityIcons
            name='broadcast'
            size={26}
            color={colors.onPrimaryContainer}
          />
        )}
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
                <View style={styles.divider} />
                <Text style={styles.cardBody}>{summary}</Text>
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

      <Modal
        visible={menuVisible}
        transparent
        animationType='fade'
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={[styles.menuScrim, { paddingTop: insets.top + 60 }]}
          onPress={() => setMenuVisible(false)}
          accessibilityLabel={t('close', { ns: 'translation' })}
        >
          <Pressable style={styles.menu} onPress={() => {}}>
            <Text style={styles.menuTitle}>
              {t('recentTrackings', { ns: 'translation' })}
            </Text>
            {recentPairs.length === 0 ? (
              <Text style={styles.menuEmpty}>
                {t('noRecentTrackings', { ns: 'translation' })}
              </Text>
            ) : (
              recentPairs.map((recent) => {
                const active = trackedPairs.some(
                  (tracked) =>
                    tracked.enabled &&
                    tracked.routeId === recent.routeId &&
                    tracked.stopId === recent.stopId,
                );
                const title = t('trackingTitle', {
                  ns: 'translation',
                  line: recent.routeShortName,
                  stop: recent.stopName,
                });
                return (
                  <Pressable
                    key={`${recent.routeId}-${recent.stopId}`}
                    style={styles.menuRow}
                    onPress={() => handleRecentToggle(recent)}
                    accessibilityRole='switch'
                    accessibilityState={{ checked: active }}
                    accessibilityLabel={title}
                  >
                    <View style={styles.menuInfo}>
                      <Text style={styles.menuRowTitle} numberOfLines={2}>
                        {title}
                      </Text>
                      {recent.label && recent.label !== recent.stopName ? (
                        <Text style={styles.menuRowLabel} numberOfLines={1}>
                          {recent.label}
                        </Text>
                      ) : null}
                    </View>
                    <View
                      pointerEvents='none'
                      accessibilityElementsHidden
                      importantForAccessibility='no-hide-descendants'
                    >
                      <Switch
                        value={active}
                        color={colors.primary}
                        trackColor={{ false: colors.outlineVariant, true: colors.primary }}
                      />
                    </View>
                  </Pressable>
                );
              })
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.inversePrimary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.inverseSurface,
  },
  logo: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
  liveButton: {
    padding: 6,
  },
  // Active tracking: the header shows the tracked line, stop and countdown
  // instead of the icon, so the row reads like the persistent notification.
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    maxWidth: '78%',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.onPrimaryContainer,
  },
  liveText: {
    flexShrink: 1,
  },
  liveTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.onPrimaryContainer,
  },
  liveSummary: {
    fontSize: 11,
    color: colors.onPrimaryContainer,
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
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.onSurface,
  },
  cardLine: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  cardBody: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.outlineVariant,
    marginVertical: 8,
  },
  cancelButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.errorContainer,
  },
  cancelButtonText: {
    color: colors.error,
    fontWeight: '600',
  },
  menuScrim: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
  },
  menu: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outlineVariant,
    padding: 16,
    gap: 4,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 6,
  },
  menuEmpty: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    paddingVertical: 8,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
  },
  menuInfo: {
    flex: 1,
    gap: 2,
  },
  menuRowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
  },
  menuRowLabel: {
    fontSize: 12,
    color: colors.outline,
  },
});