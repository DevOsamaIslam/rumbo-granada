import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react-native';

vi.mock('@/hooks/useBusTracking', () => ({
  useBusTracking: vi.fn(),
}));

// @expo/vector-icons is native-only; render icons as plain Text in tests.
vi.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return { MaterialCommunityIcons: (props: any) => React.createElement(Text, props) };
});

import { useBusTracking } from '@/hooks/useBusTracking';
import { TrackingList } from './TrackingList';

const mockedUseBusTracking = vi.mocked(useBusTracking);

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

describe('TrackingList', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when there are no tracked pairs', async () => {
    mockedUseBusTracking.mockReturnValue({
      trackedPairs: [],
      toggleTracking: vi.fn(),
      removeTrackedPair: vi.fn(),
    });

    const { queryByText } = await render(<TrackingList />);

    expect(queryByText('Seguimiento activo')).toBeNull();
  });

  it('renders active trackings', async () => {
    mockedUseBusTracking.mockReturnValue({
      trackedPairs: [makePair()],
      toggleTracking: vi.fn(),
      removeTrackedPair: vi.fn(),
    });

    const { getByText } = await render(<TrackingList />);

    expect(getByText('Seguimiento activo')).toBeTruthy();
    expect(getByText('33 → Gran Vía')).toBeTruthy();
    expect(getByText('Trabajo')).toBeTruthy();
  });

  it('calls removeTrackedPair when a row is pressed', async () => {
    const removeTrackedPair = vi.fn();
    mockedUseBusTracking.mockReturnValue({
      trackedPairs: [makePair()],
      toggleTracking: vi.fn(),
      removeTrackedPair,
    });

    const { getByLabelText } = await render(<TrackingList />);

    fireEvent.press(getByLabelText('Dejar de rastrear'));

    expect(removeTrackedPair).toHaveBeenCalledWith('p1');
  });
});
