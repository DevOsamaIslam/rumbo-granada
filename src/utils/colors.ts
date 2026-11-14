// Colour helpers for GTFS route badges.
//
// `route_color` is a hex string *without* a leading `#`, and `route_text_color` is
// frequently missing (12 of 34 routes in the shipped GTFS). A hardcoded white label
// is illegible on the light backgrounds in this dataset (e.g. FCBE03, 87E6D4,
// F1B508), so the text colour is derived from the background when absent.

/** Normalises a GTFS colour to `#RRGGBB`, or null when unusable. */
export function normalizeHexColor(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  // Accept numbers defensively: an all-digit hex like `525252` used to be coerced
  // to a number by the CSV parser, and `String(...)` keeps that from throwing.
  const hex = String(value).trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  return `#${hex.toUpperCase()}`;
}

/** Relative luminance (WCAG) of a `#RRGGBB` colour, 0 (black) to 1 (white). */
export function relativeLuminance(hexColor: string): number {
  const hex = normalizeHexColor(hexColor)?.slice(1);
  if (!hex) return 0;

  const channels = [0, 2, 4].map((offset) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** Contrast ratio (WCAG) between two `#RRGGBB` colours, 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const lighter = Math.max(relativeLuminance(a), relativeLuminance(b));
  const darker = Math.min(relativeLuminance(a), relativeLuminance(b));
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Picks a label colour that stays readable on `backgroundColor`.
 *
 * Uses the GTFS `route_text_color` when it is present, and otherwise picks whichever
 * of black or white has the better WCAG contrast ratio. A plain luminance cutoff is
 * wrong here: mid-tones like `#9C92C5` and `#F39210` still read far better with dark
 * text (7.3:1 and 8.9:1) than with white (2.9:1 and 2.4:1).
 */
export function getBadgeTextColor(
  backgroundColor: string | null | undefined,
  routeTextColor?: string | null,
): string {
  const fromData = normalizeHexColor(routeTextColor);
  if (fromData) return fromData;

  const background = normalizeHexColor(backgroundColor);
  if (!background) return '#FFFFFF';

  return contrastRatio(background, '#000000') >= contrastRatio(background, '#FFFFFF')
    ? '#000000'
    : '#FFFFFF';
}

/** Normalises a GTFS route colour for use as a badge background. */
export function getBadgeBackgroundColor(
  routeColor: string | null | undefined,
  fallback: string,
): string {
  return normalizeHexColor(routeColor) ?? fallback;
}