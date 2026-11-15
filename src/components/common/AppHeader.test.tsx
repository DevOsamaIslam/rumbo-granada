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
import { AppHeader } from './AppHeader';

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

const mockStore = (overrides: Record<string, unknown> = {}) => {
  mockedUseBusTracking.mockReturnValue({
    trackedPairs: [],
    arrivals: new Map(),
    removeTrackedPair: vi.fn(),
    ...overrides,
  } as any);
};

describe('AppHeader', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the logo and a grey live icon when nothing is tracked', async () => {
    mockStore();

    await render(<AppHeader />);

    expect(screen.getByLabelText('Granabus')).toBeOnTheScreen();
    expect(screen.getByLabelText('Sin seguimiento activo')).toBeOnTheScreen();
  });

  it('does not open the card when the live icon is inactive', async () => {
    mockStore();

    await render(<AppHeader />);

    fireEvent.press(screen.getByLabelText('Sin seguimiento activo'));
    expect(screen.queryByText('Seguimiento activo')).toBeNull();
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
    expect(screen.getByText('Línea 33 → Gran Vía')).toBeOnTheScreen();

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
            { stopId: 'uuid-1', routeId: '', tripId: '33', arrivalTime: now + 12 * 60_000, departureTime: now + 12 * 60_000, realtime: true },
            { stopId: 'uuid-1', routeId: '', tripId: '33', arrivalTime: now + 4 * 60_000, departureTime: now + 4 * 60_000, realtime: true },
          ],
        ],
      ]),
    });

    await render(<AppHeader />);

    fireEvent.press(screen.getByLabelText('Ver seguimiento activo'));

    await waitFor(() =>
      expect(screen.getByText('Llegan en 4 y 12 minutos.')).toBeOnTheScreen(),
    );
  });
});
