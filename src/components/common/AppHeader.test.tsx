import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

vi.mock('@/hooks/useBusTracking', () => ({
  useBusTracking: vi.fn(),
}));

// The header consumes the status-bar inset; stub the native-safe-area module.
vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// @expo/vector-icons is native-only; render icons as plain Text in tests.
vi.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return { MaterialCommunityIcons: (props: any) => React.createElement(Text, props) };
});

import { useBusTracking } from '@/hooks/useBusTracking';
import { AppHeader, computePredictionMinutes } from './AppHeader';
import type { ArrivalPrediction } from '@/types/tracking';

const mockedUseBusTracking = vi.mocked(useBusTracking);

const makePair = (overrides: Record<string, unknown> = {}) => ({
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

const makePrediction = (
  tripId: string,
  minutesFromNow: number,
  now: number,
): ArrivalPrediction => ({
  stopId: 'uuid-1',
  routeId: '',
  tripId,
  arrivalTime: now + minutesFromNow * 60_000,
  departureTime: now + minutesFromNow * 60_000,
  realtime: true,
});

const mockStore = (overrides: Record<string, unknown> = {}) => {
  mockedUseBusTracking.mockReturnValue({
    trackedPairs: [],
    recentPairs: [],
    arrivals: new Map(),
    startTracking: vi.fn(),
    stopTracking: vi.fn(),
    addTrackedPair: vi.fn(),
    toggleTracking: vi.fn(),
    removeTrackedPair: vi.fn(),
    ...overrides,
  } as any);
};

describe('computePredictionMinutes', () => {
  const now = 1_700_000_000_000;

  it('keeps only the tracked line, sorted and de-duplicated', () => {
    const predictions = [
      makePrediction('33', 12, now),
      makePrediction('21', 3, now),
      makePrediction('33', 4, now),
      makePrediction('33', 4, now),
    ];

    expect(computePredictionMinutes(predictions, '33', now)).toEqual([4, 12]);
  });

  it('drops arrivals in the past and normalises to zero', () => {
    const predictions = [
      makePrediction('33', -5, now),
      makePrediction('33', 0, now),
    ];

    expect(computePredictionMinutes(predictions, '33', now)).toEqual([0]);
  });

  it('returns an empty list when the line has no predictions', () => {
    expect(computePredictionMinutes([], '33', now)).toEqual([]);
  });
});

describe('AppHeader', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the logo and a live icon when nothing is tracked', async () => {
    mockStore();

    await render(<AppHeader />);

    expect(screen.getByLabelText('Rumbo Granada')).toBeOnTheScreen();
    expect(screen.getByLabelText('Seguimientos recientes')).toBeOnTheScreen();
  });

  it('opens the recent trackings dropdown instead of the tracking card', async () => {
    mockStore();

    await render(<AppHeader />);

    await fireEvent.press(screen.getByLabelText('Seguimientos recientes'));

    expect(screen.getByText('Aún no hay seguimientos recientes')).toBeOnTheScreen();
    expect(screen.queryByText('Seguimiento activo')).toBeNull();
  });

  it('lists recent trackings and starts one when pressed', async () => {
    const addTrackedPair = vi.fn();
    mockStore({
      recentPairs: [makePair({ id: 'recent-1' })],
      addTrackedPair,
    });

    await render(<AppHeader />);

    await fireEvent.press(screen.getByLabelText('Seguimientos recientes'));
    await fireEvent.press(screen.getByLabelText('Línea 33 → Gran Vía'));

    expect(addTrackedPair).toHaveBeenCalledWith(
      expect.objectContaining({
        routeId: 'r1',
        stopId: 'uuid-1',
        stopName: 'Gran Vía',
        enabled: true,
      }),
    );
  });

  it('shows the line, stop and minutes in place of the icon when tracking is active', async () => {
    const now = Date.now();
    mockStore({
      trackedPairs: [makePair()],
      arrivals: new Map([
        [
          'uuid-1',
          [
            makePrediction('33', 4, now),
            makePrediction('21', 2, now),
          ],
        ],
      ]),
    });

    await render(<AppHeader />);

    expect(screen.getByText('Línea 33 → Gran Vía')).toBeOnTheScreen();
    await waitFor(() =>
      expect(screen.getByText('Llega en 4 minutos.')).toBeOnTheScreen(),
    );
  });

  it('says "Llegando ahora" instead of "0 minutos" when the bus reaches the stop', async () => {
    const now = Date.now();
    mockStore({
      trackedPairs: [makePair()],
      arrivals: new Map([['uuid-1', [makePrediction('33', 0, now)]]]),
    });

    await render(<AppHeader />);

    await waitFor(() =>
      expect(screen.getByText('Llegando ahora.')).toBeOnTheScreen(),
    );
    expect(screen.queryByText('Llega en 0 minutos.')).toBeNull();
  });

  it('shows a loading message until the first arrivals poll lands', async () => {
    mockStore({ trackedPairs: [makePair()] });

    await render(<AppHeader />);

    await waitFor(() =>
      expect(screen.getByText('Cargando llegadas')).toBeOnTheScreen(),
    );
  });

  it('starts the tracking poll when a tracker is enabled', async () => {
    const startTracking = vi.fn();
    const stopTracking = vi.fn();
    mockStore({ trackedPairs: [makePair()], startTracking, stopTracking });

    await render(<AppHeader />);

    expect(startTracking).toHaveBeenCalled();
    expect(stopTracking).not.toHaveBeenCalled();
  });

  it('stops the tracking poll when nothing is enabled', async () => {
    const startTracking = vi.fn();
    const stopTracking = vi.fn();
    mockStore({ startTracking, stopTracking });

    await render(<AppHeader />);

    expect(stopTracking).toHaveBeenCalled();
    expect(startTracking).not.toHaveBeenCalled();
  });

  it('opens the tracking card with details and cancel for an active tracking', async () => {
    const removeTrackedPair = vi.fn();
    mockStore({ trackedPairs: [makePair()], removeTrackedPair });

    await render(<AppHeader />);

    expect(screen.getByLabelText('Ver seguimiento activo')).toBeOnTheScreen();

    const pressable = screen.getByLabelText('Ver seguimiento activo');
    fireEvent.press(pressable);

    await waitFor(() =>
      expect(screen.getByText('Seguimiento activo')).toBeOnTheScreen(),
    );
    // The header chip and the card both show the tracked line.
    expect(screen.getAllByText('Línea 33 → Gran Vía')).toHaveLength(2);

    fireEvent.press(screen.getByLabelText('Cancelar seguimiento'));
    expect(removeTrackedPair).toHaveBeenCalledWith('p1');
  });

  it('shows the live arrivals summary in the card when available', async () => {
    const now = Date.now();
    mockStore({
      trackedPairs: [makePair()],
      arrivals: new Map([
        [
          'uuid-1',
          [
            makePrediction('33', 12, now),
            makePrediction('33', 4, now),
          ],
        ],
      ]),
    });

    await render(<AppHeader />);

    fireEvent.press(screen.getByLabelText('Ver seguimiento activo'));

    await waitFor(() =>
      expect(screen.getAllByText('Llegan en 4 y 12 minutos.')).toHaveLength(2),
    );
  });
});
