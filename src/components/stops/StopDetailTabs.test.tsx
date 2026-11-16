import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react-native';

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
import { StopLinesTab } from './StopDetailTabs';
import type { Route, Stop } from '@/types/gtfs';

const mockedUseBusTracking = vi.mocked(useBusTracking);

const makeStop = (overrides: Partial<Stop> = {}): Stop => ({
  stop_id: 'stop-1',
  stop_code: '9',
  stop_name: 'Avda. Sierra Nevada 97',
  stop_lat: 37.157368,
  stop_lon: -3.5297508,
  ...overrides,
});

const makeRoute = (overrides: Partial<Route> = {}): Route => ({
  route_id: 'r1',
  agency_id: 'GRAN',
  route_short_name: '33',
  route_long_name: 'CENES DE LA VEGA - ESTACIÓN AUTOBUSES',
  route_type: 3,
  route_color: 'E5097A',
  route_text_color: 'FFFFFF',
  ...overrides,
});

describe('StopLinesTab', () => {
  it('shows a line number circle for every line serving the stop', async () => {
    mockedUseBusTracking.mockReturnValue({
      trackedPairs: [],
      addTrackedPair: vi.fn(),
      removeTrackedPair: vi.fn(),
    } as any);

    await render(
      <StopLinesTab
        stop={makeStop()}
        routes={[makeRoute(), makeRoute({ route_id: 'r2', route_short_name: '21' })]}
        onPress={() => {}}
      />,
    );

    expect(screen.getByText('33')).toBeOnTheScreen();
    expect(screen.getByText('21')).toBeOnTheScreen();
  });

  it('only shows the line number, not the long name', async () => {
    mockedUseBusTracking.mockReturnValue({
      trackedPairs: [],
      addTrackedPair: vi.fn(),
      removeTrackedPair: vi.fn(),
    } as any);

    await render(
      <StopLinesTab
        stop={makeStop()}
        routes={[makeRoute()]}
        onPress={() => {}}
      />,
    );

    expect(screen.getByText('33')).toBeOnTheScreen();
    expect(
      screen.queryByText('CENES DE LA VEGA - ESTACIÓN AUTOBUSES'),
    ).toBeNull();
  });

  it('shows no tracking bell on the lines tab', async () => {
    mockedUseBusTracking.mockReturnValue({
      trackedPairs: [
        {
          id: 'p1',
          routeId: 'r1',
          routeShortName: '33',
          stopId: 'stop-1',
          stopCode: '9',
          stopName: 'Avda. Sierra Nevada 97',
          label: '',
          thresholdMinutes: 5,
          enabled: true,
          createdAt: 0,
        },
      ],
      addTrackedPair: vi.fn(),
      removeTrackedPair: vi.fn(),
    } as any);

    await render(
      <StopLinesTab stop={makeStop()} routes={[makeRoute()]} onPress={() => {}} />,
    );

    expect(screen.queryByLabelText('Reanudar rastreo')).toBeNull();
    expect(screen.queryByLabelText('Dejar de rastrear')).toBeNull();
  });

  it('still opens the line screen when a row is tapped', async () => {
    mockedUseBusTracking.mockReturnValue({
      trackedPairs: [],
      addTrackedPair: vi.fn(),
      removeTrackedPair: vi.fn(),
    } as any);

    const onPress = vi.fn();
    await render(
      <StopLinesTab stop={makeStop()} routes={[makeRoute()]} onPress={onPress} />,
    );

    fireEvent.press(screen.getByLabelText('Línea 33'));
    expect(onPress).toHaveBeenCalledWith(
      expect.objectContaining({ route_id: 'r1' }),
    );
  });
});
