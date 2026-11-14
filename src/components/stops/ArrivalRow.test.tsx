import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react-native';
import { ArrivalRow, formatArrivalMinutes } from './ArrivalRow';
import type { Arrival } from '@/types/api';

const makeArrival = (overrides: Partial<Arrival> = {}): Arrival => ({
  lineCode: '33',
  destination: 'CENES DE LA VEGA - ESTACIÓN AUTOBUSES',
  minutes: 4,
  scheduledTime: '14:47',
  isRealTime: true,
  ...overrides,
});

describe('formatArrivalMinutes', () => {
  it('shows "Ahora" for arriving now', () => {
    expect(formatArrivalMinutes(0)).toBe('Ahora');
    expect(formatArrivalMinutes(-3)).toBe('Ahora');
  });

  it('formats minutes and hours', () => {
    expect(formatArrivalMinutes(1)).toBe('1 min');
    expect(formatArrivalMinutes(12)).toBe('12 min');
    expect(formatArrivalMinutes(60)).toBe('1h');
    expect(formatArrivalMinutes(75)).toBe('1h 15min');
  });
});

describe('ArrivalRow', () => {
  it('renders line, destination and countdown', async () => {
    await render(<ArrivalRow arrival={makeArrival()} />);

    expect(screen.getByText('33')).toBeOnTheScreen();
    expect(
      screen.getByText('CENES DE LA VEGA - ESTACIÓN AUTOBUSES'),
    ).toBeOnTheScreen();
    expect(screen.getByText('4 min')).toBeOnTheScreen();
    expect(screen.getByText('14:47')).toBeOnTheScreen();
  });

  it('marks estimated arrivals', async () => {
    await render(<ArrivalRow arrival={makeArrival({ isRealTime: false })} />);
    expect(screen.getByText('14:47 · estimada')).toBeOnTheScreen();
  });

  it('uses the GTFS line colour when provided', async () => {
    await render(<ArrivalRow arrival={makeArrival()} lineColor='E5097A' />);

    const badge = screen.getByText('33').parent;
    const style = Array.isArray(badge?.props?.style)
      ? Object.assign({}, ...badge!.props.style.filter(Boolean))
      : badge?.props?.style;

    expect(style).toMatchObject({ backgroundColor: '#E5097A' });
  });

  it('falls back to the primary colour when no line colour is known', async () => {
    await render(<ArrivalRow arrival={makeArrival()} />);

    const badge = screen.getByText('33').parent;
    const style = Array.isArray(badge?.props?.style)
      ? Object.assign({}, ...badge!.props.style.filter(Boolean))
      : badge?.props?.style;

    expect(style).toMatchObject({ backgroundColor: '#6200EE' });
  });

  it('keeps the GTFS line colour and derives readable text on a light badge', async () => {
    // FCBE03 ships without route_text_color; white text would be illegible.
    await render(<ArrivalRow arrival={makeArrival({ lineCode: 'F3' })} lineColor='FCBE03' />);

    expect(screen.getByText('F3')).toBeOnTheScreen();
    const badgeText = screen.getByText('F3');
    expect(flattenStyle(badgeText.props.style)).toMatchObject({ color: '#000000' });
  });

  it('uses the GTFS text colour when the data provides one', async () => {
    await render(
      <ArrivalRow
        arrival={makeArrival({ lineCode: '11' })}
        lineColor='9C92C5'
        lineTextColor='FFFFFF'
      />,
    );

    const badgeText = screen.getByText('11');
    expect(flattenStyle(badgeText.props.style)).toMatchObject({ color: '#FFFFFF' });
  });
});

function flattenStyle(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) {
    return Object.assign({}, ...style.filter(Boolean).map(flattenStyle));
  }
  return (style ?? {}) as Record<string, unknown>;
}
