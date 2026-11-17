// Store-listing regression tests.
//
// `npm run store-assets` builds the Play/App Store artwork and renders the
// listing copy from `docs/store/listing.json`. These assertions keep the
// artefacts inside the stores' hard limits so a regeneration cannot silently
// produce an upload that Play Console or App Store Connect will reject.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();

interface PngHeader {
  width: number;
  height: number;
  bitDepth: number;
  colorType: number;
}

function pngHeader(file: string): PngHeader {
  const buf = readFileSync(join(ROOT, file));
  expect(buf.subarray(1, 4).toString('latin1')).toBe('PNG');
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    bitDepth: buf[24],
    colorType: buf[25],
  };
}

const listing = JSON.parse(readFileSync(join(ROOT, 'docs/store/listing.json'), 'utf8'));

describe('store artwork', () => {
  it('ships a Play icon at 512x512 with an alpha channel under 1 MB', () => {
    const file = 'assets/store/play-icon-512.png';
    const header = pngHeader(file);
    expect(header).toMatchObject({ width: 512, height: 512, colorType: 6 });
    // Play rejects icons larger than 1024 KB.
    expect(statSync(join(ROOT, file)).size).toBeLessThanOrEqual(1024 * 1024);
  });

  it('ships an opaque 1024x1024 App Store icon', () => {
    const header = pngHeader('assets/store/app-store-icon-1024.png');
    expect(header).toMatchObject({ width: 1024, height: 1024 });
    // 2 = truecolor without alpha; App Store Connect rejects alpha.
    expect(header.colorType).toBe(2);
  });

  it('ships a 1024x500 Play feature graphic without alpha', () => {
    const header = pngHeader('assets/store/play-feature-graphic.png');
    expect(header).toMatchObject({ width: 1024, height: 500, colorType: 2 });
  });

  it('ships at least two phone screenshots per store locale in the 9:16 Play format', () => {
    const baseDir = 'docs/store/screenshots/play-phone';

    for (const locale of ['es', 'en']) {
      const dir = join(baseDir, locale);
      const files = readdirSync(join(ROOT, dir)).filter((name) => name.endsWith('.png'));

      // Play requires a minimum of two screenshots per device type and allows
      // up to eight.
      expect(files.length, `${locale} screenshot count`).toBeGreaterThanOrEqual(2);
      expect(files.length, `${locale} screenshot count`).toBeLessThanOrEqual(8);

      for (const file of files) {
        const header = pngHeader(join(dir, file));
        expect(header.width, `${locale}/${file} width`).toBe(1080);
        expect(header.height, `${locale}/${file} height`).toBe(1920);
        expect(header.colorType, `${locale}/${file} has alpha`).toBe(2);
        // Play: the longest side may not exceed twice the shortest side.
        expect(header.height / header.width).toBeLessThanOrEqual(2);
      }
    }
  });
});

describe('store listing copy', () => {
  it('covers the shipped locales', () => {
    expect(Object.keys(listing.locales).sort()).toEqual(['en', 'es']);
  });

  it('respects the store character limits', () => {
    for (const [code, locale] of Object.entries(listing.locales) as [
      string,
      {
        appName: string;
        subtitle: string;
        shortDescription: string;
        promotionalText: string;
        keywords: string[];
        releaseNotes: string;
        fullDescription: string[];
      },
    ][]) {
      const full = locale.fullDescription.join('\n');
      expect(locale.appName.length, `${code} app name`).toBeLessThanOrEqual(30);
      expect(locale.subtitle.length, `${code} subtitle`).toBeLessThanOrEqual(30);
      expect(locale.shortDescription.length, `${code} short description`).toBeLessThanOrEqual(80);
      expect(locale.promotionalText.length, `${code} promotional text`).toBeLessThanOrEqual(170);
      expect(locale.keywords.join(',').length, `${code} keywords`).toBeLessThanOrEqual(100);
      expect(locale.releaseNotes.length, `${code} release notes`).toBeLessThanOrEqual(500);
      expect(full.length, `${code} full description`).toBeLessThanOrEqual(4000);
    }
  });

  it('renders the listing documents from listing.json', () => {
    const play = readFileSync(join(ROOT, 'docs/store/play-store-listing.md'), 'utf8');
    const appStore = readFileSync(join(ROOT, 'docs/store/app-store-listing.md'), 'utf8');

    for (const doc of [play, appStore]) {
      expect(doc).toContain(listing.app.bundleId);
      expect(doc).toContain(listing.locales.es.appName);
      expect(doc).toContain(listing.locales.en.appName);
    }
    expect(play).toContain('assets/store/play-feature-graphic.png');
  });

  it('points the stores at the release profile identifiers', () => {
    const eas = JSON.parse(readFileSync(join(ROOT, 'eas.json'), 'utf8'));
    expect(eas.cli.appVersionSource).toBe('remote');
    expect(eas.build.production.autoIncrement).toBe(true);
    expect(eas.build.production.android.buildType).toBe('app-bundle');
    expect(eas.submit.production.android.track).toBe('internal');
  });
});
