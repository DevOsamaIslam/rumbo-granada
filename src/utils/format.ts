// Locale-aware number and date formatting.
//
// The UI language codes (`es`, `en`, `ar`) do not always map 1:1 to the best
// Intl locale. Arabic in particular defaults to Latin digits for the bare `ar`
// tag in some ICU builds, so we pin it to `ar-EG` to get Arabic-Indic numerals
// (١٢٣), which is what users expect from an Arabic UI.

/** Arabic UI language mapped to the Intl locale that yields Arabic-Indic digits. */
const ARABIC_INTL_LOCALE = 'ar-EG';

/** Maps an app language code to the Intl locale used for formatting. */
export function toIntlLocale(language: string | null | undefined): string {
  const base = (language ?? 'en').toLowerCase();
  if (base === 'ar' || base.startsWith('ar-')) return ARABIC_INTL_LOCALE;
  return base;
}

/**
 * Formats an integer/decimal using the digits of the active locale.
 *
 * `useGrouping: false` keeps small counts stable (`1234`, not `1.234`), matching
 * the compact counts shown in the UI.
 */
export function formatNumber(value: number, language?: string | null): string {
  if (!Number.isFinite(value)) return String(value);
  try {
    return new Intl.NumberFormat(toIntlLocale(language), {
      useGrouping: false,
    }).format(value);
  } catch {
    return String(value);
  }
}

/** Formats a timestamp as a locale-aware `HH:MM` clock time. */
export function formatDateTime(
  value: number | Date,
  language?: string | null,
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(toIntlLocale(language), {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return date.toLocaleTimeString();
  }
}
