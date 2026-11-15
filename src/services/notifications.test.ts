import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Notifications from 'expo-notifications';
import {
  scheduleArrivalNotification,
  requestNotificationPermissions,
  cancelNotification,
  cancelAllNotifications,
  updateTrackingNotification,
  clearTrackingNotification,
  formatTrackingBody,
  registerTrackingResponseHandler,
  TRACKING_NOTIFICATION_ID,
  TRACKING_CATEGORY_ID,
  TRACKING_CANCEL_ACTION,
  TRACKING_CHANNEL_ID,
} from './notifications';

const mockScheduleNotificationAsync = vi.mocked(
  Notifications.scheduleNotificationAsync,
);
const mockGetPermissionsAsync = vi.mocked(Notifications.getPermissionsAsync);
const mockRequestPermissionsAsync = vi.mocked(
  Notifications.requestPermissionsAsync,
);
const mockCancelScheduledNotificationAsync = vi.mocked(
  Notifications.cancelScheduledNotificationAsync,
);
const mockCancelAllScheduledNotificationsAsync = vi.mocked(
  Notifications.cancelAllScheduledNotificationsAsync,
);
const mockDismissNotificationAsync = vi.mocked(
  Notifications.dismissNotificationAsync,
);

const mockGetCategoriesAsync = vi.mocked(
  Notifications.getNotificationCategoriesAsync,
);

describe('notifications service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockGetPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockRequestPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockScheduleNotificationAsync.mockResolvedValue('notification-id');
    mockGetCategoriesAsync.mockResolvedValue([]);
  });

  it('requestNotificationPermissions returns true when already granted', async () => {
    const granted = await requestNotificationPermissions();
    expect(granted).toBe(true);
    expect(mockRequestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('requestNotificationPermissions requests permission when not granted', async () => {
    mockGetPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
    mockRequestPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });

    const granted = await requestNotificationPermissions();
    expect(granted).toBe(true);
    expect(mockRequestPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  it('requestNotificationPermissions returns false when denied', async () => {
    mockGetPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
    mockRequestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

    const granted = await requestNotificationPermissions();
    expect(granted).toBe(false);
  });

  it('scheduleArrivalNotification requests permission, ensures channel and schedules', async () => {
    const id = await scheduleArrivalNotification({
      stopName: 'Gran Vía',
      routeShortName: '33',
      minutes: 3,
    });

    expect(id).toBe('notification-id');
    expect(mockScheduleNotificationAsync).toHaveBeenCalledWith({
      content: {
        title: 'Autobús en camino',
        body: 'La línea 33 llega a Gran Vía en 3 minutos.',
        sound: true,
      },
      trigger: null,
    });
  });

  it('scheduleArrivalNotification returns null when permission is denied', async () => {
    mockGetPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
    mockRequestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

    const id = await scheduleArrivalNotification({
      stopName: 'Gran Vía',
      routeShortName: '33',
      minutes: 3,
    });

    expect(id).toBeNull();
    expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('uses singular "minuto" for one minute', async () => {
    await scheduleArrivalNotification({
      stopName: 'Parada Central',
      routeShortName: '5',
      minutes: 1,
    });
    expect(mockScheduleNotificationAsync).toHaveBeenCalledWith({
      content: {
        title: 'Autobús en camino',
        body: 'La línea 5 llega a Parada Central en 1 minuto.',
        sound: true,
      },
      trigger: null,
    });
  });

  it('cancelNotification cancels a single scheduled notification', async () => {
    await cancelNotification('notification-id');
    expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith(
      'notification-id',
    );
  });

  it('cancelAllNotifications cancels all scheduled notifications', async () => {
    await cancelAllNotifications();
    expect(mockCancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
  });

  it('updateTrackingNotification schedules a sticky notification with a fixed identifier and the cancel category', async () => {
    const ok = await updateTrackingNotification({
      stopName: 'Fuente de las Batallas',
      routeShortName: '33',
      minutes: [4],
    });

    expect(ok).toBe(true);
    expect(mockScheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: TRACKING_NOTIFICATION_ID,
      content: {
        title: 'Línea 33 → Fuente de las Batallas',
        body: 'Llega en 4 minutos.',
        sticky: true,
        autoDismiss: false,
        sound: false,
        categoryIdentifier: TRACKING_CATEGORY_ID,
        
      },
      trigger: null,
    });
  });

  it('updateTrackingNotification reports missing arrivals', async () => {
    await updateTrackingNotification({
      stopName: 'Fuente de las Batallas',
      routeShortName: '33',
      minutes: [],
    });

    expect(mockScheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: TRACKING_NOTIFICATION_ID,
        content: expect.objectContaining({
          body: 'Sin próximos autobuses para esta línea.',
        }),
      }),
    );
  });

  it('updateTrackingNotification uses "Llegando ahora" for zero minutes', async () => {
    await updateTrackingNotification({
      stopName: 'Fuente de las Batallas',
      routeShortName: '33',
      minutes: [0],
    });

    expect(mockScheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({ body: 'Llegando ahora.' }),
      }),
    );
  });

  it('updateTrackingNotification returns false when permission is denied', async () => {
    mockGetPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
    mockRequestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

    const ok = await updateTrackingNotification({
      stopName: 'Fuente de las Batallas',
      routeShortName: '33',
      minutes: [4],
    });

    expect(ok).toBe(false);
    expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('clearTrackingNotification dismisses and cancels the tracking notification', async () => {
    await clearTrackingNotification();
    expect(mockDismissNotificationAsync).toHaveBeenCalledWith(
      TRACKING_NOTIFICATION_ID,
    );
    expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith(
      TRACKING_NOTIFICATION_ID,
    );
  });

  it('registers the tracking category with a Cancelar action', async () => {
    await updateTrackingNotification({
      stopName: 'Fuente de las Batallas',
      routeShortName: '33',
      minutes: [4],
    });

    expect(Notifications.setNotificationCategoryAsync).toHaveBeenCalledWith(
      TRACKING_CATEGORY_ID,
      [
        expect.objectContaining({
          identifier: TRACKING_CANCEL_ACTION,
          buttonTitle: 'Cancelar',
        }),
      ],
    );
  });

  it('posts the tracking notification on the silent tracking channel', async () => {
    await updateTrackingNotification({
      stopName: 'Fuente de las Batallas',
      routeShortName: '33',
      minutes: [4],
    });

    expect(mockScheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: null,
      }),
    );
  });

  it('registerTrackingResponseHandler forwards only pressed action identifiers', async () => {
    const handler = vi.fn();
    const subscription = registerTrackingResponseHandler(handler);

    const listener = Notifications.addNotificationResponseReceivedListener.mock
      .calls.at(-1)?.[0] as (response: { actionIdentifier: string }) => void;

    listener({ actionIdentifier: TRACKING_CANCEL_ACTION });
    listener({ actionIdentifier: 'something-else' });

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenNthCalledWith(1, TRACKING_CANCEL_ACTION);
    expect(handler).toHaveBeenNthCalledWith(2, 'something-else');

    subscription.remove();
  });

  it('formats a single upcoming bus', () => {
    expect(formatTrackingBody([4])).toBe('Llega en 4 minutos.');
    expect(formatTrackingBody([1])).toBe('Llega en 1 minuto.');
  });

  it('formats multiple buses of the same line', () => {
    expect(formatTrackingBody([4, 12])).toBe('Llegan en 4 y 12 minutos.');
    expect(formatTrackingBody([4, 12, 25])).toBe(
      'Llegan en 4, 12 y 25 minutos.',
    );
  });

  it('formats an arriving bus with later ones', () => {
    expect(formatTrackingBody([0])).toBe('Llegando ahora.');
    expect(formatTrackingBody([0, 12, 25])).toBe(
      'Llegando ahora y en 12 y 25 minutos.',
    );
  });

  it('reports missing arrivals', () => {
    expect(formatTrackingBody([])).toBe(
      'Sin próximos autobuses para esta línea.',
    );
  });
});