import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react-native';
import { BusMarker } from './BusMarker.native';

describe('BusMarker', () => {
  it('renders the heading arrow', async () => {
    await render(<BusMarker lngLat={[-3.5986, 37.1773]} heading={90} />);
    expect(screen.getByText('▲')).toBeOnTheScreen();
  });

  it('renders the label pill when a label is provided', async () => {
    await render(<BusMarker lngLat={[-3.5986, 37.1773]} label="Línea 33" />);
    expect(screen.getByText('Línea 33')).toBeOnTheScreen();
  });

  it('does not render a label when none is provided', async () => {
    await render(<BusMarker lngLat={[-3.5986, 37.1773]} />);
    expect(screen.queryByText('Línea 33')).toBeNull();
  });

  it('does not render an empty label', async () => {
    await render(<BusMarker lngLat={[-3.5986, 37.1773]} label="" />);
    expect(screen.queryByText('▲')).toBeOnTheScreen();
    // The pill itself is not rendered — only the arrow remains.
    expect(screen.queryAllByText('')).toHaveLength(0);
  });
});
