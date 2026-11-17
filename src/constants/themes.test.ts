import { describe, it, expect } from 'vitest';
import { DARK_COLORS, LIGHT_COLORS } from './colors';
import { darkTheme, getAppTheme, lightTheme, resolveThemeScheme } from './themes';

describe('resolveThemeScheme', () => {
  it('follows the OS scheme when the preference is "system"', () => {
    expect(resolveThemeScheme('system', 'dark')).toBe('dark');
    expect(resolveThemeScheme('system', 'light')).toBe('light');
  });

  it('falls back to light when the OS scheme is unknown', () => {
    expect(resolveThemeScheme('system', null)).toBe('light');
    expect(resolveThemeScheme('system', undefined)).toBe('light');
  });

  it('pins the explicit preference regardless of the OS scheme', () => {
    expect(resolveThemeScheme('light', 'dark')).toBe('light');
    expect(resolveThemeScheme('dark', 'light')).toBe('dark');
  });
});

describe('getAppTheme', () => {
  it('returns the light theme for the light scheme', () => {
    const theme = getAppTheme('light');
    expect(theme).toBe(lightTheme);
    expect(theme.dark).toBe(false);
    expect(theme.colors.primary).toBe(LIGHT_COLORS.primary);
    expect(theme.colors.background).toBe(LIGHT_COLORS.background);
    expect(theme.colors.surface).toBe(LIGHT_COLORS.surface);
    expect(theme.colors.onSurface).toBe(LIGHT_COLORS.onSurface);
  });

  it('returns the dark theme for the dark scheme', () => {
    const theme = getAppTheme('dark');
    expect(theme).toBe(darkTheme);
    expect(theme.dark).toBe(true);
    expect(theme.colors.primary).toBe(DARK_COLORS.primary);
    expect(theme.colors.background).toBe(DARK_COLORS.background);
    expect(theme.colors.surface).toBe(DARK_COLORS.surface);
    expect(theme.colors.onSurface).toBe(DARK_COLORS.onSurface);
  });

  it('defines the MD3 tokens Paper needs in both themes', () => {
    for (const theme of [lightTheme, darkTheme]) {
      expect(theme.colors.secondary).toBeTruthy();
      expect(theme.colors.tertiary).toBeTruthy();
      expect(theme.colors.error).toBeTruthy();
      expect(theme.colors.surfaceVariant).toBeTruthy();
      expect(theme.colors.onSurfaceVariant).toBeTruthy();
      expect(theme.colors.outline).toBeTruthy();
      expect(theme.colors.outlineVariant).toBeTruthy();
      expect(theme.colors.elevation.level1).toBeTruthy();
    }
  });

  it('ships a dark palette that actually differs from the light one', () => {
    expect(DARK_COLORS.background).not.toBe(LIGHT_COLORS.background);
    expect(DARK_COLORS.onSurface).not.toBe(LIGHT_COLORS.onSurface);
    // Custom app tokens are present in both palettes.
    expect(LIGHT_COLORS.busColors.day).toBeTruthy();
    expect(DARK_COLORS.busColors.day).toBeTruthy();
    expect(LIGHT_COLORS.stopColors.favorite).toBeTruthy();
    expect(DARK_COLORS.stopColors.favorite).toBeTruthy();
  });
});
