import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { FavoritesTabBar } from './FavoritesTabBar';

describe('FavoritesTabBar', () => {
  it('renders all tabs, including recent trackings', async () => {
    await render(
      <FavoritesTabBar
        tab="favoriteLines"
        onTabChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Líneas')).toBeOnTheScreen();
    expect(screen.getByText('Paradas')).toBeOnTheScreen();
    expect(screen.getByText('Seguimientos recientes')).toBeOnTheScreen();
    expect(screen.queryByText('Recordatorios anteriores')).toBeNull();
  });

  it('selects the recent trackings tab', async () => {
    const onTabChange = vi.fn();
    await render(
      <FavoritesTabBar
        tab="favoriteLines"
        onTabChange={onTabChange}
      />,
    );

    await fireEvent.press(screen.getByLabelText('Seguimientos recientes'));
    expect(onTabChange).toHaveBeenCalledWith('recentTrackings');
  });
});
