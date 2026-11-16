import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-native';

// Tests for the persistent-notification side of the tracking hook. The
// countdown / clear-decision logic is exported as pure helpers and tested
// directly; only the permission request needs the React hook.

const trackedPairs: any[] = [];
const storeToggleTracking = vi.fn();
const storeAddTrackedPair = vi.fn();
const storeRemoveTrackedPair = vi.fn();
const loadFromStorage = vi.fn();

vi.mock('@/store/tracking', () => ({
  useTrackingStore: Object.assign(
    // Reads the module-level binding on every call so a store "update" that
    // replaces the array is visible to re-renders (like a real zustand store).
    vi.fn(() => ({
      trackedPairs,
      toggleTracking: storeToggleTracking,
      addTrackedPair: storeAddTrackedPair,
      removeTrackedPair: storeRemoveTrackedPair,
      loadFromStorage,
    })),
    {
      // The notification cancel handler reads the store outside React.
      getState: () => ({
        trackedPairs,
        removeTrackedPair: storeRemoveTrackedPair,
      }),
    },
  ),
}));

vi.mock('@/store/settings', () => ({
  useSettingsStore: vi.fn(() => ({ notificationThresholdMinutes: 5 })),
}));

vi.mock('@/services/liveApi', () => ({
  liveApiClient: { getStopArrivals: vi.fn().mockResolvedValue([]) },
}));

vi.mock('@/services/notifications', () => ({
  scheduleArrivalNotification: vi.fn().mockResolvedValue('notif-1'),
  updateTrackingNotification: vi.fn().mockResolvedValue(true),
  clearTrackingNotification: vi.fn().mockResolvedValue(undefined),
  requestNotificationPermissions: vi.fn().mockResolvedValue(true),
  registerTrackingResponseHandler: vi.fn().mockReturnValue({ remove: vi.fn() }),
  TRACKING_CATEGORY_ID: 'bus-tracking',
  TRACKING_CANCEL_ACTION: 'cancel-tracking',
  TRACKING_OPEN_ACTION: 'expo.modules.notifications.actions.DEFAULT',
}));

vi.mock('react-native', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    AppState: {
      currentState: 'active',
      addEventListener: vi.fn(() => ({ remove: vi.fn() })),
    },
  };
});

import {
  useBusTracking,
  computeTrackingMinutes,
  shouldClearTrackingNotification,
  handleTrackingNotificationAction,
  isTrackingUpdateDue,
} from './useBusTracking';
import {
  requestNotificationPermissions,
  clearTrackingNotification,
  TRACKING_CANCEL_ACTION,
  TRACKING_OPEN_ACTION,
} from '@/services/notifications';
import { router } from 'expo-router';

const makeArrival = (overrides: any = {}) => ({
  lineCode: '33',
  destination: 'Alhambra',
  minutes: 4,
  scheduledTime: '',
  isRealTime: true,
  ...overrides,
});

describe('computeTrackingMinutes', () => {
  it('returns all minutes of the tracked line only, sorted', () => {
    const rows = [
      makeArrival({ lineCode: '33', minutes: 12 }),
      makeArrival({ lineCode: '4', minutes: 2 }),
      makeArrival({ lineCode: '33', minutes: 7 }),
      makeArrival({ lineCode: '33', minutes: 25 }),
    ];
    expect(computeTrackingMinutes(rows, '33')).toEqual([7, 12, 25]);
  });

  it('de-duplicates buses that share the same minute', () => {
    const rows = [
      makeArrival({ lineCode: '33', minutes: 5 }),
      makeArrival({ lineCode: '33', minutes: 5 }),
    ];
    expect(computeTrackingMinutes(rows, '33')).toEqual([5]);
  });

  it('returns null when the tracked line has no upcoming arrivals', () => {
    const rows = [makeArrival({ lineCode: '4', minutes: 2 })];
    expect(computeTrackingMinutes(rows, '33')).toEqual([]);
  });

  it('returns 0 when the tracked line is arriving right now', () => {
    const rows = [makeArrival({ lineCode: '33', minutes: 0 })];
    expect(computeTrackingMinutes(rows, '33')).toEqual([0]);
  });

  it('ignores negative minutes', () => {
    const rows = [
      makeArrival({ lineCode: '33', minutes: -3 }),
      makeArrival({ lineCode: '33', minutes: 5 }),
    ];
    expect(computeTrackingMinutes(rows, '33')).toEqual([5]);
  });

  it('derives minutes from scheduledTime when present', () => {
    // Truncate to a whole minute so the expected countdown is exact regardless
    // of the seconds on the wall clock when the suite happens to run.
    const now = new Date();
    now.setSeconds(0, 0);
    vi.spyOn(Date, 'now').mockReturnValue(now.getTime());
    const nowHour = now.getHours();
    const nowMin = now.getMinutes();
    // Schedule a time 10 minutes from now
    let targetMin = nowMin + 10;
    let targetHour = nowHour;
    if (targetMin >= 60) {
      targetMin -= 60;
      targetHour += 1;
    }
    if (targetHour >= 24) targetHour -= 24;
    const scheduledTime = `${String(targetHour).padStart(2, '0')}:${String(targetMin).padStart(2, '0')}`;
    const rows = [
      makeArrival({ lineCode: '33', minutes: 999, scheduledTime }),
    ];
    expect(computeTrackingMinutes(rows, '33')).toEqual([10]);
    vi.restoreAllMocks();
  });

  it('prefers the Mins column over a stale Llega-derived countdown', () => {
    // Truncate to a whole minute for a deterministic expected countdown.
    const now = new Date();
    now.setSeconds(0, 0);
    vi.spyOn(Date, 'now').mockReturnValue(now.getTime());
    // A Llega time one hour in the past wraps to tomorrow (~23h); Mins says 20.
    const past = new Date(now.getTime() - 60 * 60_000);
    const timeStr = `${String(past.getHours()).padStart(2, '0')}:${String(past.getMinutes()).padStart(2, '0')}`;
    const rows = [
      makeArrival({ lineCode: '33', minutes: 20, scheduledTime: timeStr }),
    ];
    expect(computeTrackingMinutes(rows, '33')).toEqual([20]);
    vi.restoreAllMocks();
  });

  it('falls back to minutes when scheduledTime is unparseable', () => {
    const rows = [
      makeArrival({ lineCode: '33', minutes: 8, scheduledTime: '--:--' }),
      makeArrival({ lineCode: '33', minutes: 3, scheduledTime: '' }),
    ];
    expect(computeTrackingMinutes(rows, '33')).toEqual([3, 8]);
  });
});

describe('shouldClearTrackingNotification', () => {
  const pairs = [
    { id: 'p1', enabled: true },
    { id: 'p2', enabled: false },
  ];

  it('clears when the changed pair was the only enabled one', () => {
    expect(shouldClearTrackingNotification(pairs, 'p1')).toBe(true);
  });

  it('does not clear while another enabled pair remains', () => {
    const both: any = [...pairs, { id: 'p3', enabled: true }];
    expect(shouldClearTrackingNotification(both, 'p1')).toBe(false);
  });

  it('clears when the list becomes empty', () => {
    expect(shouldClearTrackingNotification([{ id: 'p1', enabled: true }], 'p1')).toBe(true);
  });
});

const makePairForCancel = (overrides: any = {}) => ({
  id: 'p1',
  routeId: 'r1',
  routeShortName: '33',
  stopId: 'uuid-1',
  stopCode: '74',
  stopName: 'Gran Vía',
  label: 'Gran Vía',
  thresholdMinutes: 5,
  enabled: true,
  createdAt: 0,
  ...overrides,
});

describe('useBusTracking notification actions', () => {
  beforeEach(() => {
    trackedPairs.length = 0;
    storeToggleTracking.mockReset();
    storeAddTrackedPair.mockReset();
    storeRemoveTrackedPair.mockReset();
    loadFromStorage.mockReset();
    vi.mocked(requestNotificationPermissions).mockReset().mockResolvedValue(true);
    vi.mocked(clearTrackingNotification).mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requests notification permission when tracking starts', async () => {
    const { result } = await renderHook(() => useBusTracking());
    act(() => {
      result.current.addTrackedPair({
        routeId: 'r1',
        routeShortName: '33',
        stopId: 's1',
        stopName: 'Gran Vía',
        label: 'Gran Vía',
        thresholdMinutes: 5,
        enabled: true,
      });
    });
    expect(requestNotificationPermissions).toHaveBeenCalledTimes(1);
  });

  it('updates the persistent notification at most once per minute', () => {
    const t = 1_700_000_000_000;
    expect(isTrackingUpdateDue(0, t, 60_000)).toBe(true); // first update always due
    expect(isTrackingUpdateDue(t, t + 59_000, 60_000)).toBe(false);
    expect(isTrackingUpdateDue(t, t + 60_000, 60_000)).toBe(true);
    expect(isTrackingUpdateDue(t, t + 120_000, 60_000)).toBe(true);
  });

  it('pressing the notification Cancelar action removes the tracking', () => {
    trackedPairs.push(makePairForCancel({ enabled: true, stopCode: '74' }));

    handleTrackingNotificationAction(TRACKING_CANCEL_ACTION);

    expect(storeRemoveTrackedPair).toHaveBeenCalledWith('p1');
    expect(clearTrackingNotification).toHaveBeenCalled();
  });

  it('ignores other notification actions', () => {
    trackedPairs.push(makePairForCancel({ enabled: true }));

    handleTrackingNotificationAction('unrelated-action');

    expect(storeRemoveTrackedPair).not.toHaveBeenCalled();
    expect(clearTrackingNotification).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('tapping the notification opens the tracked stop page', () => {
    trackedPairs.push(makePairForCancel({ enabled: true, stopId: 'uuid-1' }));

    handleTrackingNotificationAction(TRACKING_OPEN_ACTION);

    expect(router.navigate).toHaveBeenCalledWith('/stop/uuid-1');
    expect(storeRemoveTrackedPair).not.toHaveBeenCalled();
  });
});
