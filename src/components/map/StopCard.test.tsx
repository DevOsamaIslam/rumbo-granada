// The map StopCard only identifies the focused stop and offers the cancel
// action. The lines serving the stop are drawn on the map marker itself, so the
// card must not repeat them.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { StopCard } from './StopCard.native';
import type { Stop } from '@/types/gtfs';

const makeStop = (overrides: Partial<Stop> = {}): Stop => ({
  stop_id: 'stop-1',
  stop_code: '74',
  stop_name: 'Avda. Sierra Nevada 97',
  stop_lat: 37.157368,
  stop_lon: -3.5297508,
  ...overrides,
});

describe('StopCard', () => {
  it('renders the stop name and code', async () => {
    await render(<StopCard stop={makeStop()} onClose={() => {}} />);

    expect(screen.getByText('Avda. Sierra Nevada 97')).toBeOnTheScreen();
    expect(screen.getByText(/Código 74/)).toBeOnTheScreen();
  });

  it('does not repeat the lines serving the stop', async () => {
    await render(<StopCard stop={makeStop()} onClose={() => {}} />);

    expect(screen.queryByText(/Líneas/)).toBeNull();
    expect(screen.queryByText(/Sin líneas registradas/)).toBeNull();
  });

  it('omits the code line when the stop has no code', async () => {
    await render(<StopCard stop={makeStop({ stop_code: undefined })} onClose={() => {}} />);

    expect(screen.queryByText(/Código/)).toBeNull();
  });

  it('offers a cancel control that resets the map', async () => {
    const onClose = vi.fn();
    await render(<StopCard stop={makeStop()} onClose={onClose} />);

    const cancel = screen.getByLabelText('Cerrar tarjeta de parada');
    expect(cancel).toBeOnTheScreen();

    await fireEvent.press(cancel);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
