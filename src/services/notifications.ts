// Notification service for bus arrival alerts.
//
// Wraps `expo-notifications` so the tracking layer stays free of native-module
// details. Permissions are requested on demand; if the user denies them (or the
// native module is unavailable in a given environment) all functions degrade
// gracefully instead of throwing.
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';
import i18n from '@/i18n';

/** Android notification channel used for arrival alerts. */
const ARRIVAL_CHANNEL_ID = 'bus-arrival';

/**
 * Android notification channel for the persistent tracking notification.
 * Uses default importance so every in-place update is silent (no sound, no
 * heads-up) — only the imminent-arrival alert on `bus-arrival` interrupts.
 */
export const TRACKING_CHANNEL_ID = 'bus-tracking';

/** Ensures the Android arrival-notification channel exists. */
async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ARRIVAL_CHANNEL_ID, {
    name: i18n.t('notificationChannelArrivals'),
    importance: AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
}

/** Ensures the silent Android channel for the persistent tracking notification exists. */
async function ensureTrackingChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(TRACKING_CHANNEL_ID, {
    name: i18n.t('notificationChannelTracking'),
    importance: AndroidImportance.DEFAULT,
  });
}

/** Requests notification permissions from the user. */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const result = await Notifications.requestPermissionsAsync();
  return result.status === 'granted';
}

/** Schedules an immediate local notification for an imminent bus arrival. */
export async function scheduleArrivalNotification(params: {
  stopName: string;
  routeShortName: string;
  minutes: number;
}): Promise<string | null> {
  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  await ensureChannel();

  const { routeShortName, stopName, minutes } = params;
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t('busOnTheWay'),
      body: i18n.t('arrivalBody', {
        line: routeShortName,
        stop: stopName,
        count: minutes,
      }),
      sound: true,
    },
    trigger: null, // show immediately
  });
  return id;
}

/** Fixed identifier for the ongoing "tracking" notification so every update replaces it. */
export const TRACKING_NOTIFICATION_ID = 'bus-tracking';

/** Android/iOS category that carries the action buttons of the tracking notification. */
export const TRACKING_CATEGORY_ID = 'bus-tracking';

/** Identifier of the "cancel tracking" button shown on the tracking notification. */
export const TRACKING_CANCEL_ACTION = 'cancel-tracking';

/** Identifier of a tap on the notification body itself (expo-notifications default action). */
export const TRACKING_OPEN_ACTION = Notifications.DEFAULT_ACTION_IDENTIFIER;

/** Registers (idempotently) the notification category with the Cancel action. */
async function ensureTrackingCategory(): Promise<void> {
  try {
    const categories = await Notifications.getNotificationCategoriesAsync();
    if (categories.some((c) => c.identifier === TRACKING_CATEGORY_ID)) return;
    await Notifications.setNotificationCategoryAsync(TRACKING_CATEGORY_ID, [
      {
        identifier: TRACKING_CANCEL_ACTION,
        buttonTitle: i18n.t('cancel'),
        options: { opensAppToForeground: false },
      },
    ]);
  } catch {
    // Category registration is best-effort; the notification still shows.
  }
}

/**
 * Formats the notification body for the tracked line's upcoming arrivals.
 * `minutes` is the sorted list of minutes until each bus of the line (0 means
 * one is arriving right now); empty means no upcoming buses for that line.
 *
 * Examples (Spanish): "Llega en 4 minutos." / "Llegan en 4, 12 y 25 minutos." /
 * "Llegando ahora." / "Llegando ahora y en 12 minutos."
 */
export function formatTrackingBody(minutes: number[]): string {
  if (minutes.length === 0) {
    return i18n.t('noUpcomingBuses');
  }

  const arriving = minutes[0] === 0;
  const later = minutes.filter((m) => m > 0);
  if (arriving && later.length === 0) return i18n.t('arrivingNow');

  // The unit is singular only for a bare "1"; a list is always plural.
  const unitCount = later.length === 1 ? later[0] : 2;
  const list =
    later.length === 1
      ? String(later[0])
      : `${later.slice(0, -1).join(', ')} ${i18n.t('and')} ${later[later.length - 1]}`;

  if (arriving) return i18n.t('arrivingNowAndIn', { list, count: unitCount });
  return later.length === 1
    ? i18n.t('arrivesIn', { list, count: unitCount })
    : i18n.t('arrivalsIn', { list });
}

/**
 * Creates or updates the persistent (undismissable) tracking notification that
 * shows the countdown for the tracked bus line to its stop. Called after every
 * poll; scheduling with the fixed identifier replaces the previous content.
 *
 * The notification carries the "Cancelar" action button; presses arrive via
 * `registerTrackingResponseHandler`.
 *
 * `minutes` is the sorted list of minutes until each bus of the tracked line
 * (0 = arriving now); empty means the line has no upcoming arrivals.
 */
export async function updateTrackingNotification(params: {
  routeShortName: string;
  stopName: string;
  minutes: number[];
}): Promise<boolean> {
  const granted = await requestNotificationPermissions();
  if (!granted) return false;

  await ensureChannel();
  await ensureTrackingCategory();

  const { routeShortName, stopName, minutes } = params;
  await ensureTrackingChannel();
  await Notifications.scheduleNotificationAsync({
    identifier: TRACKING_NOTIFICATION_ID,
    content: {
      title: i18n.t('trackingTitle', { line: routeShortName, stop: stopName }),
      body: formatTrackingBody(minutes),
      sticky: true, // Android: cannot be dismissed by swipe (isOngoing)
      autoDismiss: false,
      sound: false,
      categoryIdentifier: TRACKING_CATEGORY_ID,
    },
    trigger: null, // show immediately (replaces previous notification with same identifier)
  });
  return true;
}

/**
 * Subscribes to notification responses (action button presses). The handler is
 * invoked with the pressed action's identifier; only presses on our
 * notification's buttons reach it. Returns a subscription with `remove()`.
 */
export function registerTrackingResponseHandler(
  handler: (actionIdentifier: string) => void,
): { remove: () => void } {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    handler(response.actionIdentifier);
  });
}

/** Removes the persistent tracking notification from the tray. */
export async function clearTrackingNotification(): Promise<void> {
  try {
    await Notifications.dismissNotificationAsync(TRACKING_NOTIFICATION_ID);
  } catch {
    // Nothing to dismiss.
  }
  try {
    await Notifications.cancelScheduledNotificationAsync(TRACKING_NOTIFICATION_ID);
  } catch {
    // Nothing to cancel.
  }
}

/** Cancels a previously scheduled notification by its id. */
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/** Cancels all pending arrival notifications. */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
