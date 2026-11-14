import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { LineItem } from './LineItem';
import { Route } from '@/types/gtfs';

const makeRoute = (overrides: Partial<Route> = {}): Route => ({
  route_id: 'r1',
  route_short_name: 'L1',
  route_long_name: 'Línea 1',
  route_type: 3,
  ...overrides,
});

describe('LineItem', () => {
  it('renders the line name', () => {
    render(<LineItem route={makeRoute()} onToggleFavorite={() => {}} />);
    expect(screen.getByLabelText('Line L1')).toBeTruthy();
  });

  it('calls onToggleFavorite when the favorite button is pressed', () => {
    const onToggleFavorite = vi.fn();
    render(<LineItem route={makeRoute()} onToggleFavorite={onToggleFavorite} />);
    fireEvent.press(screen.getByLabelText('Toggle favorite for L1'));
    expect(onToggleFavorite).toHaveBeenCalledWith('r1');
  });
});
import type { Route } from '@/types/gtfs';

const makeRoute = (overrides: Partial<Route> = {}): Route => ({
  route_id: 'r1',
  agency_id: 'a1',
  route_short_name: '10',
  route_long_name: 'Alhambra - Centro',
  route_type: 3,
  route_color: '6200EE',
  route_text_color: 'FFFFFF',
  ...overrides,
});

describe('LineItem', () => {
  it('renders short name and long name', () => {
    render(<LineItem route={makeRoute()} isFavorite={false} onPress={() => {}} onToggleFavorite={() => {}} />);
    expect(screen.getByText('Line 10')).toBeOnTheScreen();
    expect(screen.getByText('Alhambra - Centro')).toBeOnTheScreen();
  });

  it('shows filled star when favorite', () => {
    render(<LineItem route={makeRoute()} isFavorite={true} onPress={() => {}} onToggleFavorite={() => {}} />);
    expect(screen.getByLabelText('Remove from favorites')).toBeOnTheScreen();
  });

  it('shows outline star when not favorite', () => {
    render(<LineItem route={makeRoute()} isFavorite={false} onPress={() => {}} onToggleFavorite={() => {}} />);
    expect(screen.getByLabelText('Add to favorites')).toBeOnTheScreen();
  });

  it('calls onToggleFavorite when star pressed', () => {
    const onToggleFavorite = vi.fn();
    render(
      <LineItem route={makeRoute()} isFavorite={false} onPress={() => {}} onToggleFavorite={onToggleFavorite} />,
    );
    fireEvent.press(screen.getByLabelText('Add to favorites'));
    expect(onToggleFavorite).toHaveBeenCalledWith(makeRoute());
  });

  it('calls onPress when row pressed', () => {
    const onPress = vi.fn();
    render(<LineItem route={makeRoute()} isFavorite={false} onPress={onPress} onToggleFavorite={() => {}} />);
    fireEvent.press(screen.getByLabelText('Line 10'));
    expect(onPress).toHaveBeenCalledWith(makeRoute());
  });
});