import { afterEach, describe, it, expect, vi } from 'vitest';
import {
  cleanup,
  render,
  screen,
  fireEvent,
} from '@testing-library/react-native';
import { AddStopLabelModal } from './AddStopLabelModal';

const baseProps = {
  visible: true,
  stopName: 'Avda. Sierra Nevada 97',
  onCancel: () => {},
  onConfirm: () => {},
};

afterEach(async () => {
  await cleanup();
});

describe('AddStopLabelModal', () => {
  it('renders nothing when hidden', async () => {
    const { toJSON } = await render(
      <AddStopLabelModal {...baseProps} visible={false} />,
    );
    expect(toJSON()).toBeNull();
  });

  it('prefills the existing label', async () => {
    await render(<AddStopLabelModal {...baseProps} initialLabel='Trabajo' />);

    expect(screen.getByDisplayValue('Trabajo')).toBeOnTheScreen();
  });

  it('submits the trimmed label', async () => {
    const onConfirm = vi.fn();
    await render(<AddStopLabelModal {...baseProps} onConfirm={onConfirm} />);

    await fireEvent.changeText(screen.getByLabelText('Stop label'), '  Casa  ');
    await fireEvent.press(screen.getByText('Guardar'));

    expect(onConfirm).toHaveBeenCalledWith('Casa');
  });

  it('saves an empty label as-is when the field is blank', async () => {
    const onConfirm = vi.fn();
    await render(<AddStopLabelModal {...baseProps} onConfirm={onConfirm} />);

    await fireEvent.changeText(screen.getByLabelText('Stop label'), '');
    await fireEvent.press(screen.getByText('Guardar'));

    expect(onConfirm).toHaveBeenCalledWith('');
  });

  it('cancels without confirming', async () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    await render(
      <AddStopLabelModal
        {...baseProps}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    await fireEvent.press(screen.getByText('Cancelar'));

    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('offers removal only when the stop is already a favourite', async () => {
    const onRemove = vi.fn();
    const { rerender } = await render(
      <AddStopLabelModal {...baseProps} onRemove={onRemove} />,
    );

    await fireEvent.press(screen.getByText('Quitar'));
    expect(onRemove).toHaveBeenCalled();

    await rerender(<AddStopLabelModal {...baseProps} />);
    expect(screen.queryByText('Quitar')).toBeNull();
  });
});
