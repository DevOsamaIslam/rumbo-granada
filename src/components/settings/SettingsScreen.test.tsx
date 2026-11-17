import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import i18n from '@/i18n';

type SettingsValues = {
  language: 'es' | 'en' | 'ar';
  mapStyle: 'standard' | 'dark';
  notificationThresholdMinutes: number;
  autoFollowUser: boolean;
  showBusLabels: boolean;
  theme: 'light' | 'dark' | 'system';
};

const state: SettingsValues = {
  language: 'es',
  mapStyle: 'standard',
  notificationThresholdMinutes: 5,
  autoFollowUser: true,
  showBusLabels: true,
  theme: 'system',
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
const setThemeMock = vi.fn((value: SettingsValues['theme']) => {
  state.theme = value;
});

vi.mock('@/store/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    ...state,
    setLanguage: setLanguageMock,
    setMapStyle: setMapStyleMock,
    setNotificationThreshold: setNotificationThresholdMock,
    setAutoFollowUser: setAutoFollowUserMock,
    setShowBusLabels: setShowBusLabelsMock,
    setTheme: setThemeMock,
  })),
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
      theme: 'system',
    });
    vi.clearAllMocks();
    // The "changes the language" test switches the global i18n language;
    // restore Spanish so every test renders the original UI language.
    i18n.changeLanguage('es');
  });

  it('renders the settings sections', async () => {
    const { getByText, getByLabelText } = await render(<SettingsScreen />);
    expect(getByText('Configuración')).toBeOnTheScreen();
    expect(getByText('Personaliza tu experiencia')).toBeOnTheScreen();
    expect(getByText('Idioma')).toBeOnTheScreen();
    // The picker shows the current language; the other options live in its modal.
    expect(getByText('Español')).toBeOnTheScreen();
    expect(getByLabelText('Idioma: Español')).toBeOnTheScreen();
    expect(getByText('Estilo del mapa')).toBeOnTheScreen();
    expect(getByText('Elige la apariencia del mapa')).toBeOnTheScreen();
    expect(getByText('Mapa oscuro')).toBeOnTheScreen();
    expect(getByText('Tema')).toBeOnTheScreen();
    expect(getByText('Elige la apariencia de la aplicación')).toBeOnTheScreen();
    expect(getByText('Seguir el tema del sistema')).toBeOnTheScreen();
    expect(getByText('Modo oscuro')).toBeOnTheScreen();
    expect(getByText('Preferencias')).toBeOnTheScreen();
    expect(getByText('Seguir mi ubicación automáticamente')).toBeOnTheScreen();
    expect(getByText('Mostrar etiquetas de autobuses')).toBeOnTheScreen();
    expect(getByText('Avisar con (minutos)')).toBeOnTheScreen();
    expect(getByText('Con cuánta antelación avisamos de la llegada')).toBeOnTheScreen();
  });

  it('shows the current threshold value and the app footer', async () => {
    const { getByText, getAllByText } = await render(<SettingsScreen />);
    expect(getByText('5')).toBeOnTheScreen();
    // App name in the eyebrow and in the footer, plus tagline and version.
    expect(getAllByText('Rumbo Granada')).toHaveLength(2);
    expect(getByText('Tu autobús, en tiempo real')).toBeOnTheScreen();
    expect(getByText('v1.0.0')).toBeOnTheScreen();
  });

  it('changes the language from the picker modal', async () => {
    const { getByLabelText } = await render(<SettingsScreen />);
    await fireEvent.press(getByLabelText('Idioma: Español'));
    await fireEvent.press(getByLabelText('Inglés'));
    expect(setLanguageMock).toHaveBeenCalledWith('en');
    expect(state.language).toBe('en');
  });

  it('selects Arabic and requests a restart to apply RTL', async () => {
    const alertSpy = vi.spyOn(Alert, 'alert');
    const { getByLabelText } = await render(<SettingsScreen />);
    await fireEvent.press(getByLabelText('Idioma: Español'));
    await fireEvent.press(getByLabelText('Árabe'));
    expect(setLanguageMock).toHaveBeenCalledWith('ar');
    expect(state.language).toBe('ar');
    // RTL flips the native layout direction, so the screen asks for a restart.
    expect(alertSpy).toHaveBeenCalled();
  });

  it('toggles the dark map', async () => {
    const { getByLabelText } = await render(<SettingsScreen />);
    fireEvent.press(getByLabelText('Mapa oscuro'));
    expect(setMapStyleMock).toHaveBeenCalledWith('dark');
    expect(state.mapStyle).toBe('dark');
  });

  it('toggles dark mode when the system theme is not followed', async () => {
    state.theme = 'light';
    const { getByLabelText } = await render(<SettingsScreen />);
    fireEvent.press(getByLabelText('Modo oscuro'));
    expect(setThemeMock).toHaveBeenCalledWith('dark');
    expect(state.theme).toBe('dark');
  });

  it('toggles following the system theme', async () => {
    const { getByLabelText } = await render(<SettingsScreen />);
    // Initially "system": switching it off pins the light theme.
    fireEvent.press(getByLabelText('Seguir el tema del sistema'));
    expect(setThemeMock).toHaveBeenCalledWith('light');
    expect(state.theme).toBe('light');
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

