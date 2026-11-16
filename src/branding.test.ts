import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PNG } from 'pngjs';
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

function readPng(file: string): PNG {
  return PNG.sync.read(readFileSync(join(ROOT, file)));
}

function pixel(png: PNG, x: number, y: number) {
  const i = (y * png.width + x) * 4;
  return {
    r: png.data[i],
    g: png.data[i + 1],
    b: png.data[i + 2],
    a: png.data[i + 3],
  };
}

interface Box {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Bounding box of every pixel with meaningful alpha. */
function alphaBBox(file: string, minAlpha = 24): Box {
  const png = readPng(file);
  let minX = png.width;
  let minY = png.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      if (png.data[(y * png.width + x) * 4 + 3] > minAlpha) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Bounding box of the bright artwork (beige castle + white bus). Red shades —
 * the backdrop gradient and the hill — have near-zero green/blue, so this
 * isolates the logo itself and proves it keeps a margin from the icon edges.
 */
function artworkBBox(file: string): Box {
  const png = readPng(file);
  let minX = png.width;
  let minY = png.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const i = (y * png.width + x) * 4;
      if (png.data[i + 3] > 24 && Math.min(png.data[i + 1], png.data[i + 2]) > 85) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY };
}

const config = appConfig({ config: {} as never });

describe('app branding', () => {
  it('points the app icon at a full-bleed 1024x1024 icon with breathing room', () => {
    expect(config.icon).toBe('./assets/icon.png');
    expect(pngSize('assets/icon.png')).toEqual({ width: 1024, height: 1024 });

    const icon = readPng('assets/icon.png');
    // Store icons must be opaque: the OS applies the rounded mask itself.
    for (const [x, y] of [
      [0, 0],
      [1023, 0],
      [0, 1023],
      [1023, 1023],
    ]) {
      expect(pixel(icon, x, y).a).toBe(255);
    }

    // iOS icon artwork guidance: keep the glyph clear of the edges so the OS
    // mask and shadow do not crop it (the previous icon filled the canvas).
    const art = artworkBBox('assets/icon.png');
    const margin = Math.round(1024 * 0.1);
    expect(art.minX).toBeGreaterThanOrEqual(margin);
    expect(art.minY).toBeGreaterThanOrEqual(margin);
    expect(art.maxX).toBeLessThanOrEqual(1024 - margin);
    expect(art.maxY).toBeLessThanOrEqual(1024 - margin);
  });

  it('keeps the Android adaptive icon inside the launcher safe zone', () => {
    const adaptive = config.android?.adaptiveIcon;
    expect(adaptive?.foregroundImage).toBe('./assets/android-icon-foreground.png');
    expect(adaptive?.backgroundImage).toBe('./assets/android-icon-background.png');
    expect(adaptive?.monochromeImage).toBe('./assets/android-icon-monochrome.png');
    // Brand red sampled from the collection, not the template placeholder.
    expect(adaptive?.backgroundColor).toBe('#95071A');
    for (const file of [
      'assets/android-icon-foreground.png',
      'assets/android-icon-background.png',
      'assets/android-icon-monochrome.png',
    ]) {
      expect(pngSize(file)).toEqual({ width: 1024, height: 1024 });
    }

    // The foreground is a transparent glyph: the background layer supplies the
    // red and the launcher mask may crop down to a 66dp circle.
    const foreground = readPng('assets/android-icon-foreground.png');
    expect(pixel(foreground, 0, 0).a).toBe(0);
    const art = alphaBBox('assets/android-icon-foreground.png');
    const safeDiameter = Math.round((1024 * 66) / 108);
    expect(art.maxX - art.minX).toBeLessThanOrEqual(safeDiameter);
    expect(art.maxY - art.minY).toBeLessThanOrEqual(safeDiameter);
  });

  it('uses a square, transparent splash logo on the brand red background', () => {
    const splash = config.plugins.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen',
    ) as unknown as [string, Record<string, string | number>] | undefined;
    expect(splash).toBeDefined();
    expect(splash?.[1].image).toBe('./assets/splash-icon.png');
    expect(splash?.[1].backgroundColor).toBe('#AE0420');
    // Expo recommends a 1024x1024 transparent logo scaled with `imageWidth`
    // rather than a portrait poster stretched with `cover`.
    expect(splash?.[1].imageWidth).toBe(220);
    expect(splash?.[1].resizeMode).toBe('contain');
    expect(pngSize('assets/splash-icon.png')).toEqual({ width: 1024, height: 1024 });

    const splashPng = readPng('assets/splash-icon.png');
    for (const [x, y] of [
      [0, 0],
      [1023, 0],
      [0, 1023],
      [1023, 1023],
    ]) {
      expect(pixel(splashPng, x, y).a).toBe(0);
    }
  });

  it('uses the map stop marker pin as a white notification icon', () => {
    const notifications = config.plugins.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-notifications',
    ) as unknown as [string, Record<string, string>] | undefined;
    expect(notifications?.[1].icon).toBe('./assets/notification-icon.png');
    expect(notifications?.[1].color).toBe('#AE0420');
    // 24dp status-bar icon at xxxhdpi.
    expect(pngSize('assets/notification-icon.png')).toEqual({ width: 96, height: 96 });

    // Android draws the status-bar icon as an alpha mask, so it must be white
    // with transparency only.
    const icon = readPng('assets/notification-icon.png');
    for (let i = 0; i < icon.data.length; i += 4) {
      if (icon.data[i + 3] > 0) {
        expect([icon.data[i], icon.data[i + 1], icon.data[i + 2]]).toEqual([255, 255, 255]);
      }
    }

    // Same teardrop as the map stop marker: taller than it is wide, with a
    // margin inside the 96x96 canvas.
    const box = alphaBBox('assets/notification-icon.png');
    expect(box.maxY - box.minY).toBeGreaterThan(box.maxX - box.minX);
    expect(box.minX).toBeGreaterThan(0);
    expect(box.minY).toBeGreaterThan(0);
    expect(box.maxX).toBeLessThan(95);
    expect(box.maxY).toBeLessThan(95);
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
