// Bus Tracking Hook
//
// Polls the live API for the arrivals of every enabled tracked pair and
// schedules a local notification when a bus is about to arrive. Polling is
// suspended while the app is in the background so the live endpoint and the
// device radio are not hammered when no one can see the screen.
import { useCallback, useState, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useTrackingStore } from '@/store/tracking';
import { useSettingsStore } from '@/store/settings';
import { BusPosition, ArrivalPrediction, TrackedPair } from '@/types/tracking';
import { Arrival } from '@/types/api';
import { scheduleArrivalNotification, updateTrackingNotification, clearTrackingNotification, requestNotificationPermissions, registerTrackingResponseHandler, TRACKING_CANCEL_ACTION, TRACKING_OPEN_ACTION } from '@/services/notifications';
import { router } from 'expo-router';
import { liveApiClient } from '@/services/liveApi';
import { calcMinutesFromScheduledTime } from '@/utils/liveApi';
import { CONFIG } from '@/constants/config';

/** Default polling interval for arrival checks while tracking is active. */
const POLL_INTERVAL_MS = CONFIG.TRACKING_UPDATE_INTERVAL_MS;

/** Minimum gap between two notifications for the same tracked pair + vehicle. */
const NOTIFICATION_COOLDOWN_MS = 10 * 60 * 1000;

/**
 * Last notification time per `${pair.id}-${vehicleId}`, keyed globally rather
 * than per hook instance: the app-wide header and a tracking screen can poll
 * concurrently, and only one alert should fire for the same bus. The claim is
 * made synchronously before the notification is scheduled so concurrent
 * pollers cannot both pass the cooldown check.
 */
const lastNotifiedAt = new Map<string, number>();

/**
 * Normalises a live-API arrival row into a typed prediction with an absolute
 * arrival time. The site reports both a `minutes` countdown and a
 * `scheduledTime` wall-clock (e.g. "15:18"). The clock time is the source of
 * truth because `minutes` can go stale between polls; we fall back to
 * `minutes` only when the clock time can't be parsed.
 */
function toArrivalPrediction(stopId: string, arrival: Arrival): ArrivalPrediction {
  const now = Date.now();

  let arrivalTime: number;
  const fromLlega = calcMinutesFromScheduledTime(arrival.scheduledTime);
  if (fromLlega !== null) {
    // Same reliability rule as the live-API parser: a Llega time that already
    // passed wraps to tomorrow (~23h), so never report more than the Mins
    // column claims.
    const minutes =
      arrival.minutes >= 0 ? Math.min(fromLlega, arrival.minutes) : fromLlega;
    arrivalTime = now + minutes * 60_000;
  } else {
    arrivalTime = now + Math.max(arrival.minutes, 0) * 60_000;
  }

  return {
    stopId,
    routeId: '',
    tripId: String(arrival.lineCode),
    arrivalTime,
    departureTime: arrivalTime,
    vehicleId: undefined,
    realtime: arrival.isRealTime,
  };
}

/**
 * Minutes until the tracked line's arrivals at the stop, sorted ascending and
 * de-duplicated (0 means a bus is arriving right now). Empty when that line
 * has no upcoming arrivals for the stop. Pure so the logic is unit-testable
 * without React.
 */
const MAX_TRACKING_MINUTES = 120; // 2h cap — anything above is treated as “no data”

export function computeTrackingMinutes(
  rows: Arrival[],
  routeShortName: string,
): number[] {
  const lineMinutes = rows
    .filter((row) => row.lineCode === routeShortName)
    .map((row) => {
      // Prefer the wall-clock scheduled time; fall back to the raw `minutes`
      // field when the clock time can't be parsed.
      const fromLlega = calcMinutesFromScheduledTime(row.scheduledTime);
      if (fromLlega !== null) {
        // Same reliability rule as the live-API parser: a Llega time that
        // already passed wraps to tomorrow (~23h), so never report more than
        // the Mins column claims.
        return row.minutes >= 0 ? Math.min(fromLlega, row.minutes) : fromLlega;
      }
      // Negative `minutes` means "no data" — exclude it.
      // Also exclude sentinel values such as the API's 999 “no data” marker.
      const raw = row.minutes >= 0 ? row.minutes : -1;
      return raw <= MAX_TRACKING_MINUTES ? raw : -1;
    })
    .filter((m) => m >= 0);
  return [...new Set(lineMinutes)].sort((a, b) => a - b);
}

/**
 * Whether removing/disabling the pair with `changedId` should dismiss the
 * persistent tracking notification: true when no other enabled pair remains.
 * Pure so the decision logic is unit-testable without React.
 */
export function shouldClearTrackingNotification(
  pairs: Array<Pick<TrackedPair, 'id' | 'enabled'>>,
  changedId: string,
): boolean {
  return !pairs.some((p) => p.id !== changedId && p.enabled);
}

/** Minimum gap between two in-place updates of the persistent notification. */
const TRACKING_NOTIFICATION_INTERVAL_MS = CONFIG.TRACKING_NOTIFICATION_INTERVAL_MS;

/**
 * Whether the persistent tracking notification is due for its periodic
 * refresh (at most once per minute). Pure so it is unit-testable.
 */
export function isTrackingUpdateDue(
  lastUpdatedAt: number,
  now: number,
  intervalMs: number = TRACKING_NOTIFICATION_INTERVAL_MS,
): boolean {
  return now - lastUpdatedAt >= intervalMs;
}

/**
 * Whether the pressed notification action cancels tracking. Pure so the
 * decision logic is unit-testable without React.
 */
export function isCancelTrackingAction(actionIdentifier: string): boolean {
  return actionIdentifier === TRACKING_CANCEL_ACTION;
}

/**
 * Handles a pressed notification action: "Cancelar" removes every tracked
 * pair and dismisses the persistent notification. Pure (store-driven) so it
 * is unit-testable without React.
 */
export function handleTrackingNotificationAction(
  actionIdentifier: string,
): void {
  const { trackedPairs: pairs, removeTrackedPair } =
    useTrackingStore.getState();

  if (isCancelTrackingAction(actionIdentifier)) {
    for (const pair of pairs) removeTrackedPair(pair.id);
    void clearTrackingNotification();
    return;
  }

  if (actionIdentifier === TRACKING_OPEN_ACTION) {
    // Tapping the notification opens the tracked stop's page.
    const pair = pairs[0];
    if (pair) router.navigate(`/stop/${pair.stopId}`);
  }
}

/** Registers the notification "Cancelar" action handler once per app session. */
let trackingCancelHandlerRegistered = false;
function ensureTrackingCancelHandler(): void {
  if (trackingCancelHandlerRegistered) return;
  trackingCancelHandlerRegistered = true;
  registerTrackingResponseHandler(handleTrackingNotificationAction);
}

export function useBusTracking() {
  // One app-wide listener for the notification's "Cancelar" action button.
  useEffect(() => {
    ensureTrackingCancelHandler();
  }, []);

  const {
    trackedPairs,
    recentPairs,
    toggleTracking: storeToggleTracking,
    addTrackedPair: storeAddTrackedPair,
    removeTrackedPair: storeRemoveTrackedPair,
    loadFromStorage,
  } = useTrackingStore();
  const notificationThresholdMinutes = useSettingsStore(
    (state) => state.notificationThresholdMinutes,
  );

  const [arrivalThreshold, setArrivalThreshold] = useState(
    notificationThresholdMinutes,
  );

  // Keep the UI threshold in sync with the settings store.
  useEffect(() => {
    setArrivalThreshold(notificationThresholdMinutes);
  }, [notificationThresholdMinutes]);

  const [busPositions, setBusPositions] = useState<Map<string, BusPosition>>(
    new Map(),
  );
  const [arrivals, setArrivals] = useState<Map<string, ArrivalPrediction[]>>(
    new Map(),
  );
  const [isTracking, setIsTracking] = useState(false);

  const appStateRef = useRef(AppState.currentState);
  const isTrackingRef = useRef(isTracking);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Timestamp of the last in-place refresh of the persistent notification.
  const lastTrackingUpdateRef = useRef(0);

  // Keep the ref in sync with state; polling checks the ref so stale closures
  // (interval callbacks, AppState handlers) always see the latest value.
  useEffect(() => {
    isTrackingRef.current = isTracking;
  }, [isTracking]);

  const checkArrival = useCallback(
    (pair: TrackedPair, prediction: ArrivalPrediction) => {
      const threshold = pair.thresholdMinutes ?? arrivalThreshold;
      const now = Date.now();
      const minutesUntilArrival = (prediction.arrivalTime - now) / 60000;

      // Not imminent yet, or already arrived.
      if (minutesUntilArrival <= 0 || minutesUntilArrival > threshold) return;

      // Avoid re-notifying for the same vehicle within the cooldown window.
      const vehicleId = prediction.vehicleId ?? prediction.tripId;
      const key = `${pair.id}-${vehicleId}`;
      const lastNotified = lastNotifiedAt.get(key) ?? 0;
      if (now - lastNotified < NOTIFICATION_COOLDOWN_MS) return;

      // Claim the cooldown synchronously so another polling instance cannot
      // schedule a duplicate alert for this bus.
      lastNotifiedAt.set(key, now);
      void scheduleArrivalNotification({
        stopName: pair.stopName,
        routeShortName: pair.routeShortName,
        minutes: Math.round(minutesUntilArrival),
      });
    },
    [arrivalThreshold],
  );

  const pollArrivals = useCallback(async () => {
    if (!isTrackingRef.current || appStateRef.current !== 'active') return;

    // Read the pairs from the store, not the closure: the polling interval
    // outlives renders, and a captured trackedPairs snapshot goes stale (the
    // list was still empty when the interval was created), which froze the
    // notification on its first value.
    const enabled = useTrackingStore
      .getState()
      .trackedPairs.filter((p) => p.enabled);
    if (enabled.length === 0) return;

    const results = await Promise.all(
      enabled.map((pair) =>
        liveApiClient
          .getStopArrivals(pair.stopCode || pair.stopId)
          .then((rows) => ({ pair, rows }))
          .catch(() => ({ pair, rows: [] as Arrival[] })),
      ),
    );

    results.forEach(({ pair, rows }) => {
      const predictions = rows.map((row) => toArrivalPrediction(pair.stopId, row));
      setArrivals((prev) => {
        const next = new Map(prev);
        next.set(pair.stopId, predictions);
        return next;
      });

      // Refresh the persistent notification at most once per minute; the
      // same-id re-post updates it silently in the tray.
      const now = Date.now();
      if (isTrackingUpdateDue(lastTrackingUpdateRef.current, now)) {
        lastTrackingUpdateRef.current = now;
        void updateTrackingNotification({
          routeShortName: pair.routeShortName,
          stopName: pair.stopName,
          minutes: computeTrackingMinutes(rows, pair.routeShortName),
        });
      }

      predictions.forEach((prediction) => checkArrival(pair, prediction));
    });
  }, [trackedPairs, checkArrival]);

  const ensureInterval = useCallback(() => {
    if (!isTrackingRef.current || intervalRef.current !== null) return;
    // Invoke the poll through the ref so the long-lived interval always runs
    // the latest closure instead of the snapshot from when it was created.
    intervalRef.current = setInterval(() => {
      void pollArrivalsRef.current();
    }, POLL_INTERVAL_MS);
  }, []);

  const pollArrivalsRef = useRef(pollArrivals);
  const ensureIntervalRef = useRef(ensureInterval);

  useEffect(() => {
    pollArrivalsRef.current = pollArrivals;
  }, [pollArrivals]);

  useEffect(() => {
    ensureIntervalRef.current = ensureInterval;
  }, [ensureInterval]);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Suspend polling while the app is in the background; resume it in the
  // foreground if tracking is still enabled.
  useEffect(() => {
    const handleChange = (nextState: AppStateStatus) => {
      const wasForeground = appStateRef.current === 'active';
      appStateRef.current = nextState;
      if (wasForeground && nextState !== 'active') {
        // App went to background: stop polling, tracking intent is preserved.
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else if (
        !wasForeground &&
        nextState === 'active' &&
        isTrackingRef.current
      ) {
        // App came back to foreground: resume polling.
        ensureIntervalRef.current();
      }
    };
    const subscription = AppState.addEventListener('change', handleChange);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (isTracking && appStateRef.current === 'active') {
      void pollArrivalsRef.current();
      ensureIntervalRef.current();
    }
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isTracking, pollArrivalsRef, ensureIntervalRef]);

  const startTracking = useCallback(() => setIsTracking(true), []);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const toggleTracking = useCallback(
    (id: string) => {
      const pair = trackedPairs.find((p) => p.id === id);
      const wasEnabled = pair?.enabled;

      if (wasEnabled) {
        // Cancelling: remove the pair entirely so a new tracking can start
        // immediately without a "replace existing tracking" confirmation.
        storeRemoveTrackedPair(id);
        void clearTrackingNotification();
        setIsTracking(false);
      } else {
        // Re-enabling: toggle back on and resume polling.
        storeToggleTracking(id);
        setIsTracking(true);
        ensureIntervalRef.current();
      }
    },
    [storeToggleTracking, storeRemoveTrackedPair, trackedPairs],
  );

  const addTrackedPair = useCallback(
    (pair: Omit<TrackedPair, 'id' | 'createdAt'>) => {
      // Ask for notification permission up front so the OS prompt appears on
      // the first track instead of only when the first alert fires.
      void requestNotificationPermissions();
      storeAddTrackedPair(pair);
      // New tracking: refresh the persistent notification immediately.
      lastTrackingUpdateRef.current = 0;
      setIsTracking(true);
      ensureIntervalRef.current();
    },
    [storeAddTrackedPair, ensureIntervalRef],
  );

  const removeTrackedPair = useCallback(
    (id: string) => {
      storeRemoveTrackedPair(id);
      if (shouldClearTrackingNotification(trackedPairs, id)) {
        void clearTrackingNotification();
      }
    },
    [storeRemoveTrackedPair, trackedPairs],
  );

  const updateBusPosition = useCallback((position: BusPosition) => {
    setBusPositions((prev) => {
      const next = new Map(prev);
      next.set(position.vehicleId, position);
      return next;
    });
  }, []);

  const updateArrivals = useCallback(
    (stopId: string, predictions: ArrivalPrediction[]) => {
      setArrivals((prev) => {
        const next = new Map(prev);
        next.set(stopId, predictions);
        return next;
      });
    },
    [],
  );

  return {
    trackedPairs,
    recentPairs,
    busPositions,
    arrivals,
    isTracking,
    arrivalThreshold,
    setArrivalThreshold,
    startTracking,
    stopTracking,
    updateBusPosition,
    updateArrivals,
    toggleTracking,
    addTrackedPair,
    removeTrackedPair,
    checkArrival,
  };
}
