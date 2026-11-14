import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ArrivalsList } from './ArrivalsList';
import type { Arrival } from '@/types/api';

const arrivals: Arrival[] = [
  {
    lineCode: '33',
    destination: 'CENES DE LA VEGA',
    minutes: 4,
    scheduledTime: '14:47',
    isRealTime: true,
  },
  {
    lineCode: 'C34',
    destination: 'SACROMONTE - CENTRO',
    minutes: 12,
    scheduledTime: '14:55',
    isRealTime: false,
  },
];

const baseProps = {
  arrivals,
  isLoading: false,
  error: null,
  onRefresh: () => {},
};

describe('ArrivalsList', () => {
  it('renders every arrival', async () => {
    await render(<ArrivalsList {...baseProps} />);

    expect(screen.getByText('33')).toBeOnTheScreen();
    expect(screen.getByText('C34')).toBeOnTheScreen();
    expect(screen.getByText('4 min')).toBeOnTheScreen();
    expect(screen.getByText('12 min')).toBeOnTheScreen();
  });

  it('shows a spinner while loading with no data yet', async () => {
    await render(
      <ArrivalsList {...baseProps} arrivals={[]} isLoading={true} />,
    );

    expect(screen.getByLabelText('Loading arrivals')).toBeOnTheScreen();
  });

  it('shows the error state when the request failed and nothing is cached', async () => {
    await render(
      <ArrivalsList
        {...baseProps}
        arrivals={[]}
        error={new Error('Network failed')}
      />,
    );

    expect(
      screen.getByText('No se pudieron cargar las llegadas'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Network failed')).toBeOnTheScreen();
  });

  it('keeps showing stale arrivals alongside the error', async () => {
    await render(
      <ArrivalsList {...baseProps} error={new Error('Network failed')} />,
    );

    expect(screen.getByText('33')).toBeOnTheScreen();
    expect(screen.queryByText('No se pudieron cargar las llegadas')).toBeNull();
  });

  it('shows an empty state when there are no arrivals', async () => {
    await render(<ArrivalsList {...baseProps} arrivals={[]} />);

    expect(screen.getByText('No hay autobuses previstos')).toBeOnTheScreen();
  });

  it('shows a relative "updated" timestamp when lastUpdated is set', async () => {
    await render(<ArrivalsList {...baseProps} lastUpdated={Date.now()} />);

    expect(screen.getByText('Actualizado ahora')).toBeOnTheScreen();
  });

  it('colours line badges from the lookup callback', async () => {
    await render(
      <ArrivalsList
        {...baseProps}
        lineColorFor={(code) => (code === '33' ? 'E5097A' : undefined)}
      />,
    );

    const badge = screen.getByText('33').parent;
    const style = Array.isArray(badge?.props?.style)
      ? Object.assign({}, ...badge!.props.style.filter(Boolean))
      : badge?.props?.style;

    expect(style).toMatchObject({ backgroundColor: '#E5097A' });
  });

  it('passes the badge text colour through to each row', async () => {
    await render(
      <ArrivalsList
        {...baseProps}
        lineColorFor={() => 'FCBE03'}
        lineTextColorFor={() => '000000'}
      />,
    );

    const badgeText = screen.getByText('33');
    expect(badgeText.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: '#000000' })]),
    );
  });

  it('derives a readable badge text colour when none is supplied', async () => {
    // FCBE03 has no route_text_color in the GTFS, so the row must pick black.
    await render(<ArrivalsList {...baseProps} lineColorFor={() => 'FCBE03'} />);

    const badgeText = screen.getByText('33');
    const style = Object.assign(
      {},
      ...[].concat(badgeText.props.style).filter(Boolean),
    );
    expect(style).toMatchObject({ color: '#000000' });
  });

  it('gives each line its own colour, matching the Líneas tab', async () => {
    // Mirrors the real GTFS + live-API pairing: the map is keyed by the string form
    // of the short name, and each arrival carries a string line code.
    const gtfsRoutes = [
      { short: 'N6', color: '8D297B' },
      { short: 'U1', color: '6A5BA3' },
      { short: '33', color: 'E5097A' },
      { short: '121', color: '525252' },
    ];
    const colorMap = new Map(gtfsRoutes.map((r) => [String(r.short), r.color]));

    await render(
      <ArrivalsList
        {...baseProps}
        arrivals={[
          { lineCode: '33', destination: 'CENES', minutes: 4, scheduledTime: '16:56', isRealTime: true },
          { lineCode: 'N6', destination: 'CHANA', minutes: 9, scheduledTime: '17:01', isRealTime: true },
        ]}
        lineColorFor={(code) => colorMap.get(String(code))}
      />,
    );

    const bg = (code: string) => {
      const style = [].concat(screen.getByText(code).parent?.props?.style ?? []).filter(Boolean);
      return Object.assign({}, ...style).backgroundColor;
    };

    expect(bg('33')).toBe('#E5097A');
    expect(bg('N6')).toBe('#8D297B');
  });

  it('still colours the badge when the line code is numeric-like', async () => {
    // A stale cache can hold `route_short_name` as a number (e.g. 33); the lookup
    // key must still match the string code coming from the live API.
    await render(
      <ArrivalsList
        {...baseProps}
        lineColorFor={(code) => (String(code) === '33' ? 'E5097A' : undefined)}
      />,
    );

    const badge = screen.getByText('33').parent;
    const style = Object.assign({}, ...[].concat(badge?.props?.style).filter(Boolean));
    expect(style).toMatchObject({ backgroundColor: '#E5097A' });
  });

  it('triggers onRefresh from pull-to-refresh', async () => {
    const onRefresh = vi.fn();
    const { container } = await render(
      <ArrivalsList {...baseProps} onRefresh={onRefresh} />,
    );

    // The stubbed FlatList forwards `onRefresh` to its host element.
    const [list] = container.queryAll(
      (node) => node.props.onRefresh === onRefresh,
    );
    expect(list).toBeDefined();

    fireEvent(list, 'refresh');
    expect(onRefresh).toHaveBeenCalled();
  });
});
