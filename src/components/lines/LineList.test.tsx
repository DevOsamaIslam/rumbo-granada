import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { LineList } from './LineList';
import { Route } from '@/types/gtfs';

const makeRoute = (id: string, name: string): Route => ({
  route_id: id,
  route_short_name: name,
  route_long_name: `Línea ${name}`,
  route_type: 3,
});

describe('LineList', () => {
  it('renders items for each route', () => {
    render(<LineList routes={[makeRoute('r1', 'L1'), makeRoute('r2', 'L2')]} onRefresh={() => {}} refreshing={false} />);
    expect(screen.getByLabelText('Line L1')).toBeTruthy();
    expect(screen.getByLabelText('Line L2')).toBeTruthy();
  });

  it('shows a message when there are no lines', () => {
    render(<LineList routes={[]} onRefresh={() => {}} refreshing={false} />);
    expect(screen.getByText('No se encontraron líneas')).toBeTruthy();
  });
});
import type { Route } from '@/types/gtfs';

const makeRoute = (id: string, shortName: string): Route => ({
  route_id: id,
  agency_id: 'a1',
  route_short_name: shortName,
  route_long_name: `Route ${shortName}`,
  route_type: 3,
});

const routes = [makeRoute('r1', '10'), makeRoute('r2', '33')];

describe('LineList', () => {
  it('renders all lines', () => {
    render(
      <LineList routes={routes} isLoading={false} error={null} isFavorite={() => false} onPress={() => {}} onToggleFavorite={() => {}} onRefresh={() => {}} refreshing={false} />,
    );
    expect(screen.getByText('Line 10')).toBeOnTheScreen();
    expect(screen.getByText('Line 33')).toBeOnTheScreen();
  });

  it('renders empty message when no lines', () => {
    render(
      <LineList routes={[]} isLoading={false} error={null} isFavorite={() => false} onPress={() => {}} onToggleFavorite={() => {}} onRefresh={() => {}} refreshing={false} emptyMessage="No lines match your search" />,
    );
    expect(screen.getByText('No lines match your search')).toBeOnTheScreen();
  });

  it('renders loading state', () => {
    render(
      <LineList routes={[]} isLoading={true} error={null} isFavorite={() => false} onPress={() => {}} onToggleFavorite={() => {}} onRefresh={() => {}} refreshing={false} />,
    );
    expect(screen.getByType('ActivityIndicator')).toBeOnTheScreen();
  });

  it('renders error state', () => {
    render(
      <LineList routes={[]} isLoading={false} error={new Error('fail')} isFavorite={() => false} onPress={() => {}} onToggleFavorite={() => {}} onRefresh={() => {}} refreshing={false} />,
    );
    expect(screen.getByText('Failed to load lines')).toBeOnTheScreen();
  });

  it('calls onPress when a line is pressed', () => {
    const onPress = vi.fn();
    render(
      <LineList routes={routes} isLoading={false} error={null} isFavorite={() => false} onPress={onPress} onToggleFavorite={() => {}} onRefresh={() => {}} refreshing={false} />,
    );
    fireEvent.press(screen.getByLabelText('Line 10'));
    expect(onPress).toHaveBeenCalledWith(routes[0]);
  });
});