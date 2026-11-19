// Verifies that the settings toggles are actually honoured by the map:
// - "Seguir mi ubicación automáticamente" (autoFollowUser) controls the map's
//   follow mode (camera trackUserLocation).
// - "Mostrar etiquetas de autobuses" (showBusLabels) controls whether tracked
//   bus markers render their label pill.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

/** Camera prop values that mean "the map follows the user". */
const TRACKING_PROPS = { trackUserLocation: 'default' };

// Mutable settings state the mocked store reads from, so tests can rerender
// with a changed setting and observe the map react to it.
const settingsState = {
  mapStyle: 'standard' as 'standard' | 'dark',
  autoFollowUser: true,
  showBusLabels: true,
};

vi.mock('@/store/settings', () => ({
  useSettingsStore: vi.fn(() => ({ ...settingsState })),
}));


const loadLinesMock = vi.fn();
const loadAllStopsMock = vi.fn();
const loadStopsForRouteMock = vi.fn();
const ensureLocationReadyMock = vi.fn();
const getCurrentLocationMock = vi.fn();
const openLocationSettingsMock = vi.fn();

vi.mock('@/hooks/useLines', () => ({
  useLines: () => ({ routes: [], loadLines: loadLinesMock }),
}));

vi.mock('@/hooks/useStops', () => ({
  useStops: () => ({
    stops: [],
    loadAllStops: loadAllStopsMock,
    loadStopsForRoute: loadStopsForRouteMock,
  }),
}));

// Permission granted so the follow mode actually reaches the camera. The map
// waits for its first location fix before starting camera tracking, so the mock
// delivers one synchronously.
vi.mock('@/hooks/useLocation', () => ({
  useLocation: () => ({
    permission: 'granted',
    watchLocation: (callback: (location: unknown) => void) => {
      callback({
        latitude: 37.1773,
        longitude: -3.5986,
        accuracy: 5,
        timestamp: 0,
      });
      return () => {};
    },
    ensureLocationReady: ensureLocationReadyMock,
    getCurrentLocation: getCurrentLocationMock,
    openLocationSettings: openLocationSettingsMock,
  }),
}));

// vitest hoists `vi.mock` to the top of the file, so the import of the
// component under test must come after the mock registrations.
/* eslint-disable-next-line import/first */
import { MapView } from './MapView.native';

/** Camera props recorded by the setup mock (opt-in `__MAP_CAMERA_PROPS__` global). */
type CameraPropsLog = Record<string, unknown>[];

function getCameraPropsLog(): CameraPropsLog | undefined {
  return (globalThis as { __MAP_CAMERA_PROPS__?: CameraPropsLog })
    .__MAP_CAMERA_PROPS__;
}

/** Props of the most recently rendered Camera (logged by the setup mock). */
const lastCameraProps = (): Record<string, unknown> => getCameraPropsLog()?.at(-1) ?? {};

/** `easeTo` calls recorded by the setup Camera mock. */
type EaseToOptions = { center?: [number, number]; duration?: number };

function getEaseToLog(): EaseToOptions[] | undefined {
  return (globalThis as { __MAP_CAMERA_EASE_TO__?: EaseToOptions[] })
    .__MAP_CAMERA_EASE_TO__;
}

describe('MapView settings integration', () => {
  beforeEach(() => {
    settingsState.mapStyle = 'standard';
    settingsState.autoFollowUser = true;
    settingsState.showBusLabels = true;
    const log = getCameraPropsLog();
    if (log) log.length = 0;
    const easeToLog = getEaseToLog();
    if (easeToLog) easeToLog.length = 0;
    ensureLocationReadyMock.mockReset().mockResolvedValue(true);
    getCurrentLocationMock.mockReset().mockResolvedValue({
      latitude: 37.1773,
      longitude: -3.5986,
      accuracy: 5,
      timestamp: 0,
    });
    openLocationSettingsMock.mockReset().mockResolvedValue(true);
    vi.clearAllMocks();
  });

  describe('autoFollowUser toggle', () => {
    it('starts following the user when the setting is enabled', async () => {
      await render(<MapView />);
      expect(lastCameraProps()).toMatchObject(TRACKING_PROPS);
    });

    it('does not follow the user when the setting is disabled', async () => {
      settingsState.autoFollowUser = false;
      await render(<MapView />);
      expect(lastCameraProps().trackUserLocation).toBeUndefined();
    });

    it('reacts when the toggle changes while the map is open', async () => {
      const view = await render(<MapView />);
      expect(lastCameraProps()).toMatchObject(TRACKING_PROPS);

      settingsState.autoFollowUser = false;
      await act(async () => {
        view.rerender(<MapView />);
      });
      expect(lastCameraProps().trackUserLocation).toBeUndefined();

      settingsState.autoFollowUser = true;
      await act(async () => {
        view.rerender(<MapView />);
      });
      expect(lastCameraProps()).toMatchObject(TRACKING_PROPS);
    });
  });

  describe('showBusLabels toggle', () => {
    const trackedBuses = [
      { id: 'V-123', latitude: 37.1773, longitude: -3.5986, heading: 45, label: 'Línea 33' },
    ];

    it('shows tracked bus labels when the setting is enabled', async () => {
      const view = await render(<MapView trackedBuses={trackedBuses} />);
      expect(view.getByText('Línea 33')).toBeOnTheScreen();
      expect(view.getByText('▲')).toBeOnTheScreen();
    });

    it('hides tracked bus labels when the setting is disabled', async () => {
      settingsState.showBusLabels = false;
      const view = await render(<MapView trackedBuses={trackedBuses} />);
      expect(view.queryByText('Línea 33')).toBeNull();
      // The bus marker itself is still rendered.
      expect(view.getByText('▲')).toBeOnTheScreen();
    });

    it('falls back to the bus id as the label when no explicit label exists', async () => {
      const view = await render(
        <MapView
          trackedBuses={[{ id: 'V-999', latitude: 37.1773, longitude: -3.5986 }]}
        />,
      );
      expect(view.getByText('V-999')).toBeOnTheScreen();
    });
  });

  describe('locate button and location availability', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('asks to turn location on every time it is off', async () => {
      settingsState.autoFollowUser = false;
      ensureLocationReadyMock.mockResolvedValue(false);
      const alertSpy = vi.spyOn(Alert, 'alert').mockImplementation(() => {});

      const view = await render(<MapView />);
      expect(lastCameraProps().trackUserLocation).toBeUndefined();

      await fireEvent.press(view.getByLabelText('Activar seguimiento'));
      await waitFor(() => expect(alertSpy).toHaveBeenCalledTimes(1));
      expect(alertSpy.mock.calls[0][0]).toBe('Ubicación desactivada');
      expect(alertSpy.mock.calls[0][1]).toMatch(/Activa la ubicación/);

      // Nothing moved and no fix was requested while location stays off.
      expect(lastCameraProps().trackUserLocation).toBeUndefined();
      expect(getCurrentLocationMock).not.toHaveBeenCalled();
      expect(getEaseToLog()?.length ?? 0).toBe(0);

      // Pressing again asks again — there is no "don't show this again".
      await fireEvent.press(view.getByLabelText('Activar seguimiento'));
      await waitFor(() => expect(alertSpy).toHaveBeenCalledTimes(2));
    });

    it('animates the map to the user location when a fix is found', async () => {
      settingsState.autoFollowUser = false;

      const view = await render(<MapView />);
      await fireEvent.press(view.getByLabelText('Activar seguimiento'));

      await waitFor(() =>
        expect(getEaseToLog()).toEqual([
          { center: [-3.5986, 37.1773], duration: 800 },
        ]),
      );
      expect(getCurrentLocationMock).toHaveBeenCalled();
      expect(lastCameraProps()).toMatchObject(TRACKING_PROPS);
    });

    it('offers to open settings and follows once location is on', async () => {
      settingsState.autoFollowUser = false;
      ensureLocationReadyMock
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);
      openLocationSettingsMock.mockResolvedValue(true);
      const alertSpy = vi.spyOn(Alert, 'alert').mockImplementation(() => {});

      const view = await render(<MapView />);
      await fireEvent.press(view.getByLabelText('Activar seguimiento'));
      await waitFor(() => expect(alertSpy).toHaveBeenCalledTimes(1));

      type AlertButton = { text?: string; onPress?: () => void };
      const buttons = (alertSpy.mock.calls[0][2] ?? []) as AlertButton[];
      const openSettings = buttons.find((button) => button.text === 'Abrir ajustes');
      expect(openSettings).toBeDefined();

      await act(async () => {
        openSettings?.onPress?.();
      });

      await waitFor(() => expect(openLocationSettingsMock).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(lastCameraProps()).toMatchObject(TRACKING_PROPS));
      expect(getEaseToLog()?.length ?? 0).toBe(1);
    });
  });
});
