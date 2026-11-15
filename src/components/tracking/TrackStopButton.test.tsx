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
import { TrackStopButton } from './TrackStopButton';

const mockedUseBusTracking = vi.mocked(useBusTracking);

const makeStore = (trackedPairs: any = []) =>
  mockedUseBusTracking.mockReturnValue({
    addTrackedPair: vi.fn(),
    toggleTracking: vi.fn(),
    trackedPairs,
  });

describe('TrackStopButton', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls addTrackedPair when the pair is not tracked yet', async () => {
    const addTrackedPair = vi.fn();
    mockedUseBusTracking.mockReturnValue({
      addTrackedPair,
      toggleTracking: vi.fn(),
      trackedPairs: [],
    });

    const { getByLabelText } = await render(
      <TrackStopButton
        routeId="r1"
        routeShortName="33"
        stopId="s1"
        stopName="Gran Vía"
      />,
    );

    fireEvent.press(getByLabelText('Rastrear autobús hasta parada'));

    expect(addTrackedPair).toHaveBeenCalledWith({
      routeId: 'r1',
      routeShortName: '33',
      stopId: 's1',
      stopCode: 's1',
      stopName: 'Gran Vía',
      label: 'Gran Vía',
      thresholdMinutes: 5,
      enabled: true,
    });
  });

  it('uses the provided stopCode when tracking', async () => {
    const addTrackedPair = vi.fn();
    mockedUseBusTracking.mockReturnValue({
      addTrackedPair,
      toggleTracking: vi.fn(),
      trackedPairs: [],
    });

    const { getByLabelText } = await render(
      <TrackStopButton
        routeId="r1"
        routeShortName="33"
        stopId="uuid-1"
        stopCode="74"
        stopName="Fuente de las Batallas"
      />,
    );

    fireEvent.press(getByLabelText('Rastrear autobús hasta parada'));

    expect(addTrackedPair).toHaveBeenCalledWith(
      expect.objectContaining({ stopId: 'uuid-1', stopCode: '74' }),
    );
  });

  it('calls toggleTracking with the pair id when already tracked', async () => {
    const toggleTracking = vi.fn();
    mockedUseBusTracking.mockReturnValue({
      addTrackedPair: vi.fn(),
      toggleTracking,
      trackedPairs: [
        {
          id: 'p1',
          routeId: 'r1',
          routeShortName: '33',
          stopId: 's1',
          stopName: 'Gran Vía',
          label: 'Trabajo',
          thresholdMinutes: 5,
          enabled: true,
          createdAt: 0,
        },
      ],
    });

    const { getByLabelText } = await render(
      <TrackStopButton
        routeId="r1"
        routeShortName="33"
        stopId="s1"
        stopName="Gran Vía"
      />,
    );

    fireEvent.press(getByLabelText('Dejar de rastrear autobús'));

    expect(toggleTracking).toHaveBeenCalledWith('p1');
  });

  it('shows an active state when the pair is tracked', async () => {
    makeStore([
      {
        id: 'p1',
        routeId: 'r1',
        routeShortName: '33',
        stopId: 's1',
        stopName: 'Gran Vía',
        label: 'Trabajo',
        thresholdMinutes: 5,
        enabled: true,
        createdAt: 0,
      },
    ]);

    const { getByLabelText, queryByLabelText } = await render(
      <TrackStopButton
        routeId="r1"
        routeShortName="33"
        stopId="s1"
        stopName="Gran Vía"
      />,
    );

    expect(getByLabelText('Dejar de rastrear autobús')).toBeTruthy();
    expect(queryByLabelText('Rastrear autobús hasta parada')).toBeNull();
  });
});
