import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getLocales } from 'expo-localization';
import { getDeviceLanguage } from './i18n';

// The setup file mocks `expo-localization` with a Spanish device; adjust the
// mock per test to exercise the other branches.
const mockedGetLocales = vi.mocked(getLocales);

describe('getDeviceLanguage', () => {
  beforeEach(() => {
    mockedGetLocales.mockReset();
    mockedGetLocales.mockReturnValue([{ languageCode: 'es', regionCode: 'MX' }]);
  });

  it("returns 'es' when the device language is Spanish", () => {
    expect(getDeviceLanguage()).toBe('es');
  });

  it("returns 'en' for any other device language", () => {
    mockedGetLocales.mockReturnValue([{ languageCode: 'en', regionCode: 'US' }]);
    expect(getDeviceLanguage()).toBe('en');
    mockedGetLocales.mockReturnValue([{ languageCode: 'fr', regionCode: 'FR' }]);
    expect(getDeviceLanguage()).toBe('en');
  });

  it("falls back to 'en' when no locale is reported", () => {
    mockedGetLocales.mockReturnValue([]);
    expect(getDeviceLanguage()).toBe('en');
  });

  it("falls back to 'en' when the native module throws", () => {
    mockedGetLocales.mockImplementation(() => {
      throw new Error('native module unavailable');
    });
    expect(getDeviceLanguage()).toBe('en');
  });
});
