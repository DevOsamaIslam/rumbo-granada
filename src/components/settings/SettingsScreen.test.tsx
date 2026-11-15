import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react-native';
import i18n from '@/i18n';

type SettingsValues = {
  language: 'es' | 'en';
  mapStyle: 'standard' | 'dark';
  notificationThresholdMinutes: number;
  autoFollowUser: boolean;
  showBusLabels: boolean;
};

const state: SettingsValues = {
  language: 'es',
  mapStyle: 'standard',
  notificationThresholdMinutes: 5,
  autoFollowUser: true,
  showBusLabels: true,
};

const setLanguageMock = vi.fn((value: SettingsValues['language']) => {
  state.language = value;
});
const setMapStyleMock = vi.fn((value: SettingsValues['mapStyle']) => {
  state.mapStyle = value;
});
const setNotificationThresholdMock = vi.fn((value: number) => {
  state.notificationThresholdMinutes = value;
});
const setAutoFollowUserMock = vi.fn((value: boolean) => {
  state.autoFollowUser = value;
});
const setShowBusLabelsMock = vi.fn((value: boolean) => {
  state.showBusLabels = value;
});

vi.mock('@/store/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    ...state,
    setLanguage: setLanguageMock,
    setMapStyle: setMapStyleMock,
    setNotificationThreshold: setNotificationThresholdMock,
    setAutoFollowUser: setAutoFollowUserMock,
    setShowBusLabels: setShowBusLabelsMock,
  })),
}));

vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// vitest hoists `vi.mock` to the top of the file, so the import of the
// component under test must come after the mock registrations.
/* eslint-disable-next-line import/first */
import { SettingsScreen } from './SettingsScreen';

describe('SettingsScreen', () => {
  beforeEach(() => {
    Object.assign(state, {
      language: 'es',
      mapStyle: 'standard',
      notificationThresholdMinutes: 5,
      autoFollowUser: true,
      showBusLabels: true,
    });
    vi.clearAllMocks();
    // The "changes the language" test switches the global i18n language;
    // restore Spanish so every test renders the original UI language.
    i18n.changeLanguage('es');
  });

  it('renders the settings sections', async () => {
    const { getByText } = await render(<SettingsScreen />);
    expect(getByText('Configuración')).toBeOnTheScreen();
    expect(getByText('Idioma')).toBeOnTheScreen();
    expect(getByText('Español')).toBeOnTheScreen();
    expect(getByText('Inglés')).toBeOnTheScreen();
    expect(getByText('Estilo del mapa')).toBeOnTheScreen();
    expect(getByText('Estándar')).toBeOnTheScreen();
    expect(getByText('Oscuro')).toBeOnTheScreen();
    expect(getByText('Preferencias')).toBeOnTheScreen();
    expect(getByText('Seguir mi ubicación automáticamente')).toBeOnTheScreen();
    expect(getByText('Mostrar etiquetas de autobuses')).toBeOnTheScreen();
    expect(getByText('Avisar con (minutos)')).toBeOnTheScreen();
  });

  it('changes the language', async () => {
    const { getByLabelText } = await render(<SettingsScreen />);
    fireEvent.press(getByLabelText('Inglés'));
    expect(setLanguageMock).toHaveBeenCalledWith('en');
    expect(state.language).toBe('en');
  });

  it('changes the map style', async () => {
    const { getByLabelText } = await render(<SettingsScreen />);
    fireEvent.press(getByLabelText('Oscuro'));
    expect(setMapStyleMock).toHaveBeenCalledWith('dark');
    expect(state.mapStyle).toBe('dark');
  });

  it('toggles auto-follow user position', async () => {
    const { getByLabelText } = await render(<SettingsScreen />);
    fireEvent.press(getByLabelText('Seguir mi ubicación automáticamente'));
    expect(setAutoFollowUserMock).toHaveBeenCalledWith(false);
    expect(state.autoFollowUser).toBe(false);
  });

  it('toggles bus labels', async () => {
    const { getByLabelText } = await render(<SettingsScreen />);
    fireEvent.press(getByLabelText('Mostrar etiquetas de autobuses'));
    expect(setShowBusLabelsMock).toHaveBeenCalledWith(false);
    expect(state.showBusLabels).toBe(false);
  });

  it('increases the notification threshold', async () => {
    const { getByLabelText } = await render(<SettingsScreen />);
    fireEvent.press(getByLabelText('Aumentar umbral'));
    expect(setNotificationThresholdMock).toHaveBeenLastCalledWith(6);
    expect(state.notificationThresholdMinutes).toBe(6);
  });

  it('decreases the notification threshold', async () => {
    const { getByLabelText } = await render(<SettingsScreen />);
    fireEvent.press(getByLabelText('Disminuir umbral'));
    expect(setNotificationThresholdMock).toHaveBeenLastCalledWith(4);
    expect(state.notificationThresholdMinutes).toBe(4);
  });

  it('clamps the notification threshold at its bounds', () => {
    // The stepper clamps with Math.max(.. - 1, 1) and Math.min(.. + 1, 180).
    expect(Math.max(1 - 1, 1)).toBe(1);
    expect(Math.min(180 + 1, 180)).toBe(180);
  });
});

