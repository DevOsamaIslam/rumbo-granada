// Verifies that the settings toggles are actually honoured by the map:
// - "Seguir mi ubicación automáticamente" (autoFollowUser) controls the map's
//   follow mode (camera trackUserLocation).
// - "Mostrar etiquetas de autobuses" (showBusLabels) controls whether tracked
//   bus markers render their label pill.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react-native';

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

describe('MapView settings integration', () => {
  beforeEach(() => {
    settingsState.mapStyle = 'standard';
    settingsState.autoFollowUser = true;
    settingsState.showBusLabels = true;
    const log = getCameraPropsLog();
    if (log) log.length = 0;
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
});
