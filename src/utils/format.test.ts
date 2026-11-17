import { describe, it, expect } from 'vitest';
import { formatDateTime, formatNumber, toIntlLocale } from './format';

describe('toIntlLocale', () => {
  it('maps Arabic to the locale with Arabic-Indic digits', () => {
    expect(toIntlLocale('ar')).toBe('ar-EG');
    expect(toIntlLocale('ar-EG')).toBe('ar-EG');
  });

  it('keeps Latin locales as-is and defaults to English', () => {
    expect(toIntlLocale('es')).toBe('es');
    expect(toIntlLocale('en')).toBe('en');
    expect(toIntlLocale(null)).toBe('en');
  });
});

describe('formatNumber', () => {
  it('renders Arabic-Indic numerals for Arabic', () => {
    expect(formatNumber(12, 'ar')).toBe('١٢');
    expect(formatNumber(0, 'ar')).toBe('٠');
  });

  it('renders Latin numerals for Spanish and English', () => {
    expect(formatNumber(12, 'es')).toBe('12');
    expect(formatNumber(12, 'en')).toBe('12');
  });

  it('falls back to the plain string for non-finite values', () => {
    expect(formatNumber(Number.NaN, 'ar')).toBe('NaN');
  });

  it('does not add grouping separators', () => {
    expect(formatNumber(1234, 'en')).toBe('1234');
  });
});

describe('formatDateTime', () => {
  it('formats a timestamp with the active locale', () => {
    const date = new Date(2026, 0, 1, 14, 47, 0);
    expect(formatDateTime(date, 'en')).toMatch(/\d{1,2}:\d{2}/);
    expect(formatDateTime(date.getTime(), 'ar')).toMatch(/[٠-٩]/);
  });

  it('returns an empty string for invalid dates', () => {
    expect(formatDateTime(Number.NaN, 'en')).toBe('');
  });
});
