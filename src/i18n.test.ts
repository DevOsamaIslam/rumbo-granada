import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getLocales } from 'expo-localization';
import { getDeviceLanguage } from './i18n';
import en from '../locales/en/translation.json';
import es from '../locales/es/translation.json';
import ar from '../locales/ar/translation.json';

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

  it("returns 'ar' when the device language is Arabic", () => {
    mockedGetLocales.mockReturnValue([{ languageCode: 'ar', regionCode: 'EG' }]);
    expect(getDeviceLanguage()).toBe('ar');
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

describe('locale coverage', () => {
  const enKeys = Object.keys(en).sort();

  it('Spanish defines every English key', () => {
    const missing = enKeys.filter((key) => !(key in es));
    expect(missing).toEqual([]);
  });

  it('Arabic defines every English key', () => {
    const missing = enKeys.filter((key) => !(key in ar));
    expect(missing).toEqual([]);
  });

  it('Arabic includes the RTL/restart strings', () => {
    expect(ar.restartRequiredTitle).toBeTruthy();
    expect(ar.restartRequiredMessage).toBeTruthy();
    expect(ar.arabic).toBeTruthy();
    expect(ar.minutesShort).toBeTruthy();
    expect(ar.hourShort).toBeTruthy();
  });
});

