import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import appConfig from '../app.config';

/**
 * Branding regression tests.
 *
 * The brand assets are spliced out of `branding/Granada Bus App Icon
 * Collection.png` by `scripts/generate-brand-assets.js`. These tests keep the
 * Expo config, the generated files and the in-app usages pointing at the same
 * brand identity, so a stray rename or regeneration cannot go unnoticed.
 */

const ROOT = process.cwd();

/** Width/height straight from the PNG IHDR chunk. */
function pngSize(file: string): { width: number; height: number } {
  const buf = readFileSync(join(ROOT, file));
  expect(buf.subarray(1, 4).toString('latin1')).toBe('PNG');
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

const config = appConfig({ config: {} as never });

describe('app branding', () => {
  it('points the app icon at the full-bleed 1024x1024 brand icon', () => {
    expect(config.icon).toBe('./assets/icon.png');
    expect(pngSize('assets/icon.png')).toEqual({ width: 1024, height: 1024 });
  });

  it('keeps the Android adaptive icon layers consistent', () => {
    const adaptive = config.android?.adaptiveIcon;
    expect(adaptive?.foregroundImage).toBe('./assets/android-icon-foreground.png');
    expect(adaptive?.backgroundImage).toBe('./assets/android-icon-background.png');
    expect(adaptive?.monochromeImage).toBe('./assets/android-icon-monochrome.png');
    // Brand red sampled from the collection, not the template placeholder.
    expect(adaptive?.backgroundColor).toBe('#95071A');
    expect(pngSize('assets/android-icon-foreground.png')).toEqual({ width: 1024, height: 1024 });
    expect(pngSize('assets/android-icon-background.png')).toEqual({ width: 1024, height: 1024 });
    expect(pngSize('assets/android-icon-monochrome.png')).toEqual({ width: 1024, height: 1024 });
  });

  it('uses the brand splash artwork on the brand red background', () => {
    const splash = config.plugins.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen',
    ) as unknown as [string, Record<string, string>] | undefined;
    expect(splash).toBeDefined();
    expect(splash?.[1].image).toBe('./assets/splash-icon.png');
    expect(splash?.[1].backgroundColor).toBe('#AE0420');
    expect(pngSize('assets/splash-icon.png')).toEqual({ width: 588, height: 1035 });
  });

  it('configures notifications with the white brand glyph and brand red accent', () => {
    const notifications = config.plugins.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-notifications',
    ) as unknown as [string, Record<string, string>] | undefined;
    expect(notifications?.[1].icon).toBe('./assets/notification-icon.png');
    expect(notifications?.[1].color).toBe('#AE0420');
    expect(pngSize('assets/notification-icon.png')).toEqual({ width: 96, height: 96 });
  });

  it('serves the brand favicon for web', () => {
    expect(config.web?.favicon).toBe('./assets/favicon.png');
    expect(pngSize('assets/favicon.png')).toEqual({ width: 48, height: 48 });
  });

  it('stays in sync with the static app.json mirror', () => {
    const appJson = JSON.parse(readFileSync(join(ROOT, 'app.json'), 'utf8'));
    expect(appJson.expo.icon).toBe(config.icon);
    expect(appJson.expo.android.adaptiveIcon.backgroundColor).toBe(
      config.android?.adaptiveIcon?.backgroundColor,
    );
  });

  it('uses the brand pin for map stop markers and the logo in the header', () => {
    const stopMarker = readFileSync(
      join(ROOT, 'src/components/map/StopMarker.native.tsx'),
      'utf8',
    );
    expect(stopMarker).toContain("assets/map-pin.png");
    expect(pngSize('assets/map-pin.png')).toEqual({ width: 340, height: 340 });

    const appHeader = readFileSync(join(ROOT, 'src/components/common/AppHeader.tsx'), 'utf8');
    expect(appHeader).toContain("assets/logo.png");
    expect(pngSize('assets/logo.png').width).toBe(256);
  });

  it('ships the store-listing branding components', () => {
    for (const file of [
      'assets/branding/banner.png',
      'assets/branding/app-store-badge.png',
      'assets/branding/google-play-badge.png',
    ]) {
      expect(() => pngSize(file)).not.toThrow();
    }
  });
});
