import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { StopInfoHeader } from './StopInfoHeader';
import type { Route, Stop } from '@/types/gtfs';

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

describe('StopInfoHeader', () => {
  it('renders the stop name, code and coordinates', async () => {
    await render(
      <StopInfoHeader
        stop={makeStop()}
        routes={[]}
        isFavorite={false}
        onToggleFavorite={() => {}}
        onPressRoute={() => {}}
      />,
    );

    expect(screen.getByText('Avda. Sierra Nevada 97')).toBeOnTheScreen();
    expect(screen.getByText(/Código 9/)).toBeOnTheScreen();
    expect(screen.getByText(/37\.1574, -3\.5298/)).toBeOnTheScreen();
  });

  it('shows a placeholder when the stop has no code', async () => {
    await render(
      <StopInfoHeader
        stop={makeStop({ stop_code: undefined })}
        routes={[]}
        isFavorite={false}
        onToggleFavorite={() => {}}
        onPressRoute={() => {}}
      />,
    );

    expect(screen.getByText(/Sin código/)).toBeOnTheScreen();
  });

  it('renders the lines serving the stop', async () => {
    await render(
      <StopInfoHeader
        stop={makeStop()}
        routes={[makeRoute()]}
        isFavorite={false}
        onToggleFavorite={() => {}}
        onPressRoute={() => {}}
      />,
    );

    expect(screen.getByText('Líneas (1)')).toBeOnTheScreen();
    expect(screen.getByText('33')).toBeOnTheScreen();
  });

  it('shows an explicit empty state when no lines are known', async () => {
    await render(
      <StopInfoHeader
        stop={makeStop()}
        routes={[]}
        isFavorite={false}
        onToggleFavorite={() => {}}
        onPressRoute={() => {}}
      />,
    );

    expect(screen.getByText('Sin líneas registradas')).toBeOnTheScreen();
  });

  it('shows the favourite label when the stop is a favourite', async () => {
    await render(
      <StopInfoHeader
        stop={makeStop()}
        routes={[]}
        isFavorite={true}
        favoriteLabel='Cerca del trabajo'
        onToggleFavorite={() => {}}
        onPressRoute={() => {}}
      />,
    );

    expect(screen.getByText('★ Cerca del trabajo')).toBeOnTheScreen();
  });

  it('calls onToggleFavorite from the star button', async () => {
    const onToggleFavorite = vi.fn();
    await render(
      <StopInfoHeader
        stop={makeStop()}
        routes={[]}
        isFavorite={false}
        onToggleFavorite={onToggleFavorite}
        onPressRoute={() => {}}
      />,
    );

    fireEvent.press(screen.getByLabelText('Add stop to favorites'));
    expect(onToggleFavorite).toHaveBeenCalled();
  });

  it('calls onPressRoute with the tapped line', async () => {
    const onPressRoute = vi.fn();
    await render(
      <StopInfoHeader
        stop={makeStop()}
        routes={[makeRoute()]}
        isFavorite={false}
        onToggleFavorite={() => {}}
        onPressRoute={onPressRoute}
      />,
    );

    fireEvent.press(screen.getByLabelText('Open line 33'));
    expect(onPressRoute).toHaveBeenCalledWith(
      expect.objectContaining({ route_id: 'r1' }),
    );
  });
});
