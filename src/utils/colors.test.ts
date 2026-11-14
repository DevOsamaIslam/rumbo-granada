import { describe, it, expect } from 'vitest';
import {
  normalizeHexColor,
  relativeLuminance,
  contrastRatio,
  getBadgeTextColor,
  getBadgeBackgroundColor,
} from './colors';

describe('normalizeHexColor', () => {
  it('accepts GTFS colours with and without a leading hash', () => {
    expect(normalizeHexColor('E5097A')).toBe('#E5097A');
    expect(normalizeHexColor('#e5097a')).toBe('#E5097A');
  });

  it('accepts a numeric colour (all-digit hex coerced by the CSV parser)', () => {
    // `525252` is a real route colour in the shipped GTFS and used to arrive as a
    // number, making `.trim()` throw at runtime.
    expect(normalizeHexColor(525252)).toBe('#525252');
  });

  it('rejects numeric colours that cannot round-trip', () => {
    // A number cannot carry the leading zero of `008080`, so it is unusable rather
    // than silently wrong. The parser now keeps these as strings, so this is a
    // defensive guard only.
    expect(normalizeHexColor(8080)).toBeNull();
    expect(normalizeHexColor(614232)).toBe('#614232');
  });

  it('rejects unusable values', () => {
    expect(normalizeHexColor(undefined)).toBeNull();
    expect(normalizeHexColor(null)).toBeNull();
    expect(normalizeHexColor('')).toBeNull();
    expect(normalizeHexColor('nope')).toBeNull();
    expect(normalizeHexColor('FFF')).toBeNull();
  });
});

describe('relativeLuminance', () => {
  it('orders black below white', () => {
    expect(relativeLuminance('#000000')).toBeLessThan(relativeLuminance('#FFFFFF'));
  });

  it('returns 0 for unusable input', () => {
    expect(relativeLuminance('bogus')).toBe(0);
  });
});

describe('getBadgeTextColor', () => {
  it('prefers the GTFS route_text_color when present', () => {
    expect(getBadgeTextColor('#E5097A', 'FFFFFF')).toBe('#FFFFFF');
    expect(getBadgeTextColor('#469F20', '000000')).toBe('#000000');
  });

  it('derives black text on light backgrounds', () => {
    // These routes ship without route_text_color; white text is illegible on them.
    expect(getBadgeTextColor('#FCBE03')).toBe('#000000');
    expect(getBadgeTextColor('#F1B508')).toBe('#000000');
    expect(getBadgeTextColor('#87E6D4')).toBe('#000000');
    expect(getBadgeTextColor('#F39210')).toBe('#000000');
  });

  it('derives black text on mid-tones where white contrast is poor', () => {
    // Mid-tones look "dark-ish" but white text is only 2.4-2.9:1, while black is
    // 7-9:1. A luminance cutoff gets these wrong.
    expect(getBadgeTextColor('#9C92C5')).toBe('#000000');
    expect(getBadgeTextColor('#C49E0F')).toBe('#000000');
  });

  it('derives white text on the dark colours in the shipped GTFS', () => {
    expect(getBadgeTextColor('#614232')).toBe('#FFFFFF');
    expect(getBadgeTextColor('#8C3231')).toBe('#FFFFFF');
    expect(getBadgeTextColor('#525252')).toBe('#FFFFFF');
    expect(getBadgeTextColor('#50504E')).toBe('#FFFFFF');
  });

  it('uses black on saturated mid-dark colours where white gains little', () => {
    // e.g. E5097A: black is 4.65:1 vs white 4.51:1 — maximising contrast is correct.
    expect(getBadgeTextColor('#E5097A')).toBe('#000000');
    expect(getBadgeTextColor('#EA5570')).toBe('#000000');
    expect(getBadgeTextColor('#BF7329')).toBe('#000000');
  });

  it('always picks the higher-contrast option', () => {
    const backgrounds = ['#FCBE03', '#9C92C5', '#E5097A', '#614232', '#87E6D4', '#525252'];
    for (const bg of backgrounds) {
      const chosen = getBadgeTextColor(bg);
      const chosenRatio = contrastRatio(bg, chosen);
      const otherRatio = contrastRatio(bg, chosen === '#000000' ? '#FFFFFF' : '#000000');
      expect(chosenRatio).toBeGreaterThanOrEqual(otherRatio);
    }
  });

  it('defaults to white when there is no usable background', () => {
    expect(getBadgeTextColor(undefined)).toBe('#FFFFFF');
    expect(getBadgeTextColor('bogus')).toBe('#FFFFFF');
  });
});

describe('getBadgeBackgroundColor', () => {
  it('normalises and falls back', () => {
    expect(getBadgeBackgroundColor('E5097A', '#6200EE')).toBe('#E5097A');
    expect(getBadgeBackgroundColor(undefined, '#6200EE')).toBe('#6200EE');
    expect(getBadgeBackgroundColor('bad', '#6200EE')).toBe('#6200EE');
  });

  it('survives numeric colours from the CSV parser', () => {
    expect(getBadgeBackgroundColor(525252, '#6200EE')).toBe('#525252');
  });
});