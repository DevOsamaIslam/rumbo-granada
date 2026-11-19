// Location readiness: a granted permission is not enough — the user can turn
// location off at any time. The map's locate button relies on this gate to ask
// the user to turn location on.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-native';
import { Linking, Platform } from 'react-native';

const locationMocks = vi.hoisted(() => ({
  hasServicesEnabledAsync: vi.fn(),
  requestForegroundPermissionsAsync: vi.fn(),
  enableNetworkProviderAsync: vi.fn(),
  getCurrentPositionAsync: vi.fn(),
  watchPositionAsync: vi.fn(),
}));

vi.mock('expo-location', () => ({
  ...locationMocks,
  Accuracy: { High: 4, Balanced: 3 },
}));

/* eslint-disable-next-line import/first */
import { useLocation } from './useLocation';

function setPlatform(os: 'ios' | 'android') {
  (Platform as unknown as { OS: string }).OS = os;
}

describe('useLocation readiness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    locationMocks.hasServicesEnabledAsync.mockResolvedValue(true);
    locationMocks.requestForegroundPermissionsAsync.mockResolvedValue({
      status: 'granted',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setPlatform('ios');
  });

  it('is ready when location services are on and the permission is granted', async () => {
    const { result } = await renderHook(() => useLocation());

    let ready: boolean | undefined;
    await act(async () => {
      ready = await result.current.ensureLocationReady();
    });

    expect(ready).toBe(true);
    expect(locationMocks.requestForegroundPermissionsAsync).toHaveBeenCalled();
  });

  it('is not ready when the device location switch is off', async () => {
    locationMocks.hasServicesEnabledAsync.mockResolvedValue(false);
    const { result } = await renderHook(() => useLocation());
    // The hook checks the permission on mount; only new calls matter here.
    const callsOnMount =
      locationMocks.requestForegroundPermissionsAsync.mock.calls.length;

    let ready: boolean | undefined;
    await act(async () => {
      ready = await result.current.ensureLocationReady();
    });

    expect(ready).toBe(false);
    // No point asking for the permission while location is off.
    expect(locationMocks.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(
      callsOnMount,
    );
  });

  it('is not ready when the permission is denied', async () => {
    locationMocks.requestForegroundPermissionsAsync.mockResolvedValue({
      status: 'denied',
    });
    const { result } = await renderHook(() => useLocation());

    let ready: boolean | undefined;
    await act(async () => {
      ready = await result.current.ensureLocationReady();
    });

    expect(ready).toBe(false);
  });

  describe('openLocationSettings', () => {
    it('opens the app settings on iOS', async () => {
      const openSettings = vi.spyOn(Linking, 'openSettings').mockResolvedValue();
      const { result } = await renderHook(() => useLocation());

      let enabled: boolean | undefined;
      await act(async () => {
        enabled = await result.current.openLocationSettings();
      });

      expect(openSettings).toHaveBeenCalledTimes(1);
      expect(enabled).toBe(true);
      expect(locationMocks.enableNetworkProviderAsync).not.toHaveBeenCalled();
    });

    it('shows the system turn-on dialog on Android', async () => {
      setPlatform('android');
      locationMocks.enableNetworkProviderAsync.mockResolvedValue(undefined);
      const { result } = await renderHook(() => useLocation());

      let enabled: boolean | undefined;
      await act(async () => {
        enabled = await result.current.openLocationSettings();
      });

      expect(locationMocks.enableNetworkProviderAsync).toHaveBeenCalledTimes(1);
      expect(enabled).toBe(true);
    });

    it('reports false and opens nothing else when the Android dialog is dismissed', async () => {
      setPlatform('android');
      locationMocks.hasServicesEnabledAsync.mockResolvedValue(false);
      locationMocks.enableNetworkProviderAsync.mockRejectedValue(new Error('dismissed'));
      const openSettings = vi.spyOn(Linking, 'openSettings').mockResolvedValue();
      const { result } = await renderHook(() => useLocation());

      let enabled: boolean | undefined;
      await act(async () => {
        enabled = await result.current.openLocationSettings();
      });

      expect(enabled).toBe(false);
      expect(openSettings).not.toHaveBeenCalled();
    });
  });
});
