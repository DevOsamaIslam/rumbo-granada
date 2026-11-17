import { describe, it, expect, vi, afterEach } from 'vitest';
import { I18nManager } from 'react-native';
import { applyLayoutDirection, isRtlLanguage } from './rtl';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('isRtlLanguage', () => {
  it('detects Arabic and other RTL languages', () => {
    expect(isRtlLanguage('ar')).toBe(true);
    expect(isRtlLanguage('ar-EG')).toBe(true);
    expect(isRtlLanguage('he')).toBe(true);
    expect(isRtlLanguage('fa-IR')).toBe(true);
    expect(isRtlLanguage('ur')).toBe(true);
  });

  it('treats Latin languages as LTR', () => {
    expect(isRtlLanguage('en')).toBe(false);
    expect(isRtlLanguage('es')).toBe(false);
    expect(isRtlLanguage('fr-FR')).toBe(false);
  });

  it('handles missing values', () => {
    expect(isRtlLanguage(null)).toBe(false);
    expect(isRtlLanguage(undefined)).toBe(false);
    expect(isRtlLanguage('')).toBe(false);
  });
});

describe('applyLayoutDirection', () => {
  it('forces RTL and reports a change for Arabic from an LTR state', () => {
    const allowSpy = vi.spyOn(I18nManager, 'allowRTL');
    const forceSpy = vi.spyOn(I18nManager, 'forceRTL');
    // The test stub starts in LTR.
    expect(I18nManager.isRTL).toBe(false);

    const result = applyLayoutDirection('ar');

    expect(result).toEqual({ rtl: true, changed: true });
    expect(allowSpy).toHaveBeenCalledWith(true);
    expect(forceSpy).toHaveBeenCalledWith(true);
  });

  it('does not force a change when the direction already matches', () => {
    const original = I18nManager.isRTL;
    (I18nManager as { isRTL: boolean }).isRTL = true;
    const forceSpy = vi.spyOn(I18nManager, 'forceRTL');

    try {
      const result = applyLayoutDirection('ar');
      expect(result).toEqual({ rtl: true, changed: false });
      expect(forceSpy).not.toHaveBeenCalled();
    } finally {
      (I18nManager as { isRTL: boolean }).isRTL = original;
    }
  });

  it('keeps LTR for Latin languages', () => {
    const result = applyLayoutDirection('es');
    expect(result).toEqual({ rtl: false, changed: false });
  });
});
