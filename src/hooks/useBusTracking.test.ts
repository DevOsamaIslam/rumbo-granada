import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-native';

const trackedPairs: any[] = [];
const storeToggleTracking = vi.fn();
const storeAddTrackedPair = vi.fn();
const storeRemoveTrackedPair = vi.fn();
const loadFromStorage = vi.fn();

vi.mock('@/store/tracking', () => ({
  useTrackingStore: vi.fn(() => ({
    trackedPairs,
    toggleTracking: storeToggleTracking,
    addTrackedPair: storeAddTrackedPair,
    removeTrackedPair: storeRemoveTrackedPair,
    loadFromStorage,
  })),
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
}));

import { AppState } from 'react-native';
let currentAppState = 'active';
const appStateHandlers: Array<(state: string) => void> = [];
vi.mock('react-native', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    AppState: {
      currentState: 'active',
      addEventListener: vi.fn((_event: string, handler: (state: string) => void) => {
        appStateHandlers.push(handler);
        return { remove: vi.fn() };
      }),
      setCurrentState: vi.fn((state: string) => {
        currentAppState = state;
        appStateHandlers.forEach((h) => h(state));
      }),
    },
  };
});

import { useBusTracking } from './useBusTracking';
import {
  scheduleArrivalNotification,
  updateTrackingNotification,
  clearTrackingNotification,
  requestNotificationPermissions,
} from '@/services/notifications';
import { liveApiClient } from '@/services/liveApi';

const now = 1_700_000_000_000;

const makePair = (overrides: any = {}) => ({
  id: 'p1',
  routeId: 'r1',
  routeShortName: '33',
  stopId: 's1',
  stopName: 'Gran Vía',
  label: 'Trabajo',
  thresholdMinutes: 5,
  enabled: true,
  createdAt: 0,
  ...overrides,
});

const makePrediction = (overrides: any = {}) => ({
  stopId: 's1',
  routeId: 'r1',
  tripId: 't1',
  arrivalTime: now + 3 * 60_000,
  departureTime: now + 3 * 60_000,
  realtime: true,
  ...overrides,
});

describe('useBusTracking', () => {
  beforeEach(() => {
    trackedPairs.length = 0;
    storeToggleTracking.mockReset();
    storeAddTrackedPair.mockReset();
    storeRemoveTrackedPair.mockReset();
    loadFromStorage.mockReset();
    vi.mocked(liveApiClient.getStopArrivals).mockReset().mockResolvedValue([]);
    vi.mocked(scheduleArrivalNotification).mockReset().mockResolvedValue('notif-1');
    vi.mocked(updateTrackingNotification).mockReset().mockResolvedValue(true);
    vi.mocked(clearTrackingNotification).mockReset().mockResolvedValue(undefined);
    vi.mocked(requestNotificationPermissions).mockReset().mockResolvedValue(true);
    appStateHandlers.length = 0;
    currentAppState = 'active';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('removes a tracked pair', async () => {
    const { result, rerender } = await renderHook(() => useBusTracking());
    for (let i = 0; i < 10 && result.current === null; i++) {
      await act(async () => { rerender({ iteration: i }); });
    }
    result.current.removeTrackedPair('p1');
    expect(storeRemoveTrackedPair).toHaveBeenCalledWith('p1');
  });

  it('cancelling an enabled tracking removes the pair instead of just disabling it', async () => {
    trackedPairs.push(makePair({ enabled: true }));
    const { result, rerender } = await renderHook(() => useBusTracking());
    for (let i = 0; i < 10 && result.current === null; i++) {
      await act(async () => { rerender({ iteration: i }); });
    }
    act(() => {
      result.current.toggleTracking('p1');
    });
    // Cancelling removes the pair entirely so a new tracking can start immediately.
    expect(storeRemoveTrackedPair).toHaveBeenCalledWith('p1');
    expect(storeToggleTracking).not.toHaveBeenCalled();
    expect(clearTrackingNotification).toHaveBeenCalled();
    expect(result.current.isTracking).toBe(false);
  });

  it('re-enabling a disabled tracking toggles it back on', async () => {
    trackedPairs.push(makePair({ enabled: false }));
    const { result, rerender } = await renderHook(() => useBusTracking());
    for (let i = 0; i < 10 && result.current === null; i++) {
      await act(async () => { rerender({ iteration: i }); });
    }
    act(() => {
      result.current.toggleTracking('p1');
    });
    expect(storeToggleTracking).toHaveBeenCalledWith('p1');
    expect(storeRemoveTrackedPair).not.toHaveBeenCalled();
    expect(result.current.isTracking).toBe(true);
  });

  it('does not notify when arrival is beyond the threshold', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(now);
    const { result, rerender } = await renderHook(() => useBusTracking());
    for (let i = 0; i < 10 && result.current === null; i++) {
      await act(async () => { rerender({ iteration: i }); });
    }
    const pair = makePair();
    const prediction = makePrediction({ arrivalTime: now + 10 * 60_000 });
    result.current.checkArrival(pair, prediction);
    expect(scheduleArrivalNotification).not.toHaveBeenCalled();
  });

  it('schedules a notification when arrival is within the threshold', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(now);
    const { result, rerender } = await renderHook(() => useBusTracking());
    for (let i = 0; i < 10 && result.current === null; i++) {
      await act(async () => { rerender({ iteration: i }); });
    }
    const pair = makePair();
    const prediction = makePrediction({ arrivalTime: now + 3 * 60_000 });
    result.current.checkArrival(pair, prediction);
    expect(scheduleArrivalNotification).toHaveBeenCalledWith({
      stopName: 'Gran Vía',
      routeShortName: '33',
      minutes: 3,
    });
  });

  it('does not notify when the bus has already arrived', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(now);
    const { result, rerender } = await renderHook(() => useBusTracking());
    for (let i = 0; i < 10 && result.current === null; i++) {
      await act(async () => { rerender({ iteration: i }); });
    }
    const pair = makePair();
    const prediction = makePrediction({ arrivalTime: now - 60_000 });
    result.current.checkArrival(pair, prediction);
    expect(scheduleArrivalNotification).not.toHaveBeenCalled();
  });

  it('uses the per-pair thresholdMinutes over the settings default', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(now);
    const { result, rerender } = await renderHook(() => useBusTracking());
    for (let i = 0; i < 10 && result.current === null; i++) {
      await act(async () => { rerender({ iteration: i }); });
    }
    const pair = makePair({ thresholdMinutes: 2 });
    result.current.checkArrival(pair, makePrediction({ arrivalTime: now + 3 * 60_000, tripId: 't1' }));
    expect(scheduleArrivalNotification).not.toHaveBeenCalled();
    result.current.checkArrival(pair, makePrediction({ arrivalTime: now + 1 * 60_000, tripId: 't2' }));
    expect(scheduleArrivalNotification).toHaveBeenCalledTimes(1);
  });

  it('does not re-notify for the same vehicle within the cooldown window', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(now);
    const { result, rerender } = await renderHook(() => useBusTracking());
    for (let i = 0; i < 10 && result.current === null; i++) {
      await act(async () => { rerender({ iteration: i }); });
    }
    const pair = makePair();
    const base = makePrediction({ arrivalTime: now + 3 * 60_000 });
    result.current.checkArrival(pair, { ...base, vehicleId: 'v1', tripId: 't1' });
    expect(scheduleArrivalNotification).toHaveBeenCalledTimes(1);
    vi.mocked(scheduleArrivalNotification).mockClear();
    result.current.checkArrival(pair, { ...base, vehicleId: 'v1', tripId: 't1' });
    expect(scheduleArrivalNotification).toHaveBeenCalledTimes(1);
    vi.mocked(scheduleArrivalNotification).mockClear();
    result.current.checkArrival(pair, { ...base, vehicleId: 'v2', tripId: 't2' });
    expect(scheduleArrivalNotification).toHaveBeenCalledTimes(1);
  });

  it('subscribes to AppState changes', async () => {
    const setIntervalSpy = vi
      .spyOn(globalThis, 'setInterval')
      .mockImplementation(() => 0 as unknown as ReturnType<typeof setInterval>);
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    trackedPairs.push(makePair({ enabled: true }));

    const { result, rerender } = await renderHook(() => useBusTracking());
    for (let i = 0; i < 10 && result.current === null; i++) {
      await act(async () => { rerender({ iteration: i }); });
    }

    expect(appStateHandlers).toHaveLength(1);
    expect(result.current.isTracking).toBe(false);

    expect(liveApiClient.getStopArrivals).not.toHaveBeenCalled();
    expect(setIntervalSpy).not.toHaveBeenCalled();
    expect(clearIntervalSpy).not.toHaveBeenCalled();

    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });

  it('registers a new tracked pair and starts tracking', async () => {
    const pair = makePair();
    const { result, rerender } = await renderHook(() => useBusTracking());
    for (let i = 0; i < 10 && result.current === null; i++) {
      await act(async () => { rerender({ iteration: i }); });
    }
    act(() => {
      result.current.addTrackedPair(pair);
    });
    // Drain the async poll chain started by tracking so it cannot leak into
    // the next test's render cycle.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(storeAddTrackedPair).toHaveBeenCalledWith(pair);
  });
});
