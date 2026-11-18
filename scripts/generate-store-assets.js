/**
 * Builds the store-ready artwork and listing documents from the brand assets
 * and the copy in `docs/store/listing.json`.
 *
 * Outputs (all checked by `src/storeAssets.test.ts`):
 *   assets/store/play-icon-512.png            512x512, 32-bit RGBA (Play icon)
 *   assets/store/play-feature-graphic.png     1024x500, truecolor (Play)
 *   assets/store/app-store-icon-1024.png      1024x1024, opaque (App Store)
 *   docs/store/screenshots/play-phone/*.png   1080x1920, truecolor (9:16)
 *   docs/store/play-store-listing.md          rendered from listing.json
 *   docs/store/app-store-listing.md           rendered from listing.json
 *
 * Raw device captures live in `docs/store/screenshots/raw/` (see the runbook in
 * `docs/store/README.md`); every file there becomes one Play screenshot, in
 * filename order.
 *
 * Uses pngjs (already a devDependency).
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'store');
const STORE_DIR = path.join(ROOT, 'docs', 'store');
const RAW_DIR = path.join(STORE_DIR, 'screenshots', 'raw');
const PHONE_DIR = path.join(STORE_DIR, 'screenshots', 'play-phone');

/** Locale folders that must exist for the store listing (es is the primary). */
const REQUIRED_SCREENSHOT_LOCALES = ['es', 'en'];

/**
 * App Store Connect screenshot sets, in exact pixels. Raw captures are read
 * from `docs/store/screenshots/raw/<dir>` and framed to the required size;
 * producing them needs an iOS device or simulator (macOS).
 */
const IOS_SCREENSHOT_SETS = [
  { dir: 'ios-6.9', width: 1320, height: 2868 },
  { dir: 'ios-6.5', width: 1242, height: 2688 },
];
const APP_STORE_SHOTS_DIR = path.join(STORE_DIR, 'screenshots', 'app-store');

/** Brand colours (match the app icons and splash background). */
const BRAND_DARK = [0x95, 0x07, 0x1a];
const BRAND = [0xae, 0x04, 0x20];

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(PHONE_DIR, { recursive: true });

function readPng(file) {
  return PNG.sync.read(fs.readFileSync(file));
}

/** Writes PNGs as either RGBA (alpha channel) or truecolor RGB. */
function writePng(png, file, { alpha = false } = {}) {
  const buffer = PNG.sync.write(png, alpha ? { colorType: 6 } : { colorType: 2 });
  fs.writeFileSync(file, buffer);
  return { file, bytes: buffer.length };
}

/** Inclusive-exclusive crop. */
function crop(src, x0, y0, x1, y1) {
  const out = new PNG({ width: x1 - x0, height: y1 - y0 });
  PNG.bitblt(src, out, x0, y0, out.width, out.height, 0, 0);
  return out;
}

/** Bilinear resample on premultiplied alpha (avoids dark fringes). */
function resize(png, dw, dh) {
  const { width: sw, height: sh, data: sd } = png;
  const out = new PNG({ width: dw, height: dh });
  const dd = out.data;
  const px = (x, y) => {
    const i = (y * sw + x) * 4;
    const a = sd[i + 3] / 255;
    return [sd[i] * a, sd[i + 1] * a, sd[i + 2] * a, sd[i + 3]];
  };
  for (let y = 0; y < dh; y++) {
    const fy = Math.min(Math.max(((y + 0.5) * sh) / dh - 0.5, 0), sh - 1);
    const y0 = Math.min(Math.floor(fy), sh - 1);
    const y1 = Math.min(y0 + 1, sh - 1);
    const ty = fy - y0;
    for (let x = 0; x < dw; x++) {
      const fx = Math.min(Math.max(((x + 0.5) * sw) / dw - 0.5, 0), sw - 1);
      const x0 = Math.min(Math.floor(fx), sw - 1);
      const x1 = Math.min(x0 + 1, sw - 1);
      const tx = fx - x0;
      const p00 = px(x0, y0);
      const p10 = px(x1, y0);
      const p01 = px(x0, y1);
      const p11 = px(x1, y1);
      const di = (y * dw + x) * 4;
      for (let c = 0; c < 4; c++) {
        const top = p00[c] * (1 - tx) + p10[c] * tx;
        const bot = p01[c] * (1 - tx) + p11[c] * tx;
        dd[di + c] = Math.round(top * (1 - ty) + bot * ty);
      }
    }
  }
  return out;
}

/** Centre-crop `png` to `aspect` (width / height) without upscaling. */
function cropToAspect(png, aspect) {
  const current = png.width / png.height;
  if (Math.abs(current - aspect) < 0.001) return png;
  if (current > aspect) {
    const width = Math.round(png.height * aspect);
    const x0 = Math.round((png.width - width) / 2);
    return crop(png, x0, 0, x0 + width, png.height);
  }
  const height = Math.round(png.width / aspect);
  const y0 = Math.round((png.height - height) / 2);
  return crop(png, 0, y0, png.width, y0 + height);
}

/** Vertical brand gradient canvas (RGB, opaque). */
function brandCanvas(width, height, from = BRAND, to = BRAND_DARK) {
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    const t = height <= 1 ? 0 : y / (height - 1);
    const r = Math.round(from[0] + (to[0] - from[0]) * t);
    const g = Math.round(from[1] + (to[1] - from[1]) * t);
    const b = Math.round(from[2] + (to[2] - from[2]) * t);
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      png.data[i] = r;
      png.data[i + 1] = g;
      png.data[i + 2] = b;
      png.data[i + 3] = 255;
    }
  }
  return png;
}

/** Composites `src` (alpha-aware) onto `dst` at (x0, y0). */
function composite(dst, src, x0, y0) {
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const si = (y * src.width + x) * 4;
      const a = src.data[si + 3] / 255;
      if (a === 0) continue;
      const dx = x0 + x;
      const dy = y0 + y;
      if (dx < 0 || dy < 0 || dx >= dst.width || dy >= dst.height) continue;
      const di = (dy * dst.width + dx) * 4;
      for (let c = 0; c < 3; c++) {
        dst.data[di + c] = Math.round(src.data[si + c] * a + dst.data[di + c] * (1 - a));
      }
      dst.data[di + 3] = 255;
    }
  }
}

module.exports = {
  BRAND,
  BRAND_DARK,
  OUT_DIR,
  PHONE_DIR,
  RAW_DIR,
  STORE_DIR,
  brandCanvas,
  composite,
  cropToAspect,
  readPng,
  resize,
  writePng,
};

if (require.main === module) {
  main();
}


/** Renders `docs/store/play-store-listing.md` + `app-store-listing.md`. */
function writeListings(listing) {
  const { app, contact, locales } = listing;
  const fullText = (locale) => locale.fullDescription.join('\n');

  const playSections = Object.entries(locales).map(([code, locale]) =>
    [
      `### ${code.toUpperCase()}`,
      '',
      `**App name (${locale.appName.length}/30)**`,
      '',
      locale.appName,
      '',
      `**Short description (${locale.shortDescription.length}/80)**`,
      '',
      locale.shortDescription,
      '',
      `**Full description (${fullText(locale).length}/4000)**`,
      '',
      '```text',
      fullText(locale),
      '```',
      '',
      `**Release notes (${locale.releaseNotes.length}/500)**`,
      '',
      locale.releaseNotes,
      '',
    ].join('\n'),
  );

  const appStoreSections = Object.entries(locales).map(([code, locale]) =>
    [
      `### ${code.toUpperCase()}`,
      '',
      `**App name (${locale.appName.length}/30)**`,
      '',
      locale.appName,
      '',
      `**Subtitle (${locale.subtitle.length}/30)**`,
      '',
      locale.subtitle,
      '',
      `**Keywords (${locale.keywords.join(',').length}/100)**`,
      '',
      locale.keywords.join(','),
      '',
      `**Promotional text (${locale.promotionalText.length}/170)**`,
      '',
      locale.promotionalText,
      '',
      `**Description (${fullText(locale).length}/4000)**`,
      '',
      '```text',
      fullText(locale),
      '```',
      '',
      `**What's new (${locale.releaseNotes.length}/4000)**`,
      '',
      locale.releaseNotes,
      '',
    ].join('\n'),
  );

  const playDoc = [
    '<!-- Generated by `npm run store-assets` from listing.json. Do not edit by hand. -->',
    '',
    '# Google Play — Store listing',
    '',
    '| Field | Value |',
    '|-------|-------|',
    '| Package | `' + app.bundleId + '` |',
    '| Version | ' + app.marketingVersion + ' |',
    '| Category | ' + app.playCategory + ' |',
    '| Price | ' + app.price + ' |',
    '| Contact email | ' + contact.email + ' |',
    '| Privacy policy | ' + contact.privacyPolicyUrl + ' |',
    '| Terms of service | ' + contact.termsUrl + ' |',
    '',
    '## Graphics',
    '',
    '| Asset | File | Requirement |',
    '|-------|------|-------------|',
    '| App icon | `assets/store/play-icon-512.png` | 512x512, 32-bit PNG with alpha, ≤ 1 MB |',
    '| Feature graphic | `assets/store/play-feature-graphic.png` | 1024x500, JPEG or 24-bit PNG |',
    '| Phone screenshots | `docs/store/screenshots/play-phone/<locale>/*.png` | 2–8 images per language, 1080x1920 (9:16), 24-bit PNG |',
    '',
    '## Copy',
    '',
    ...playSections,
  ].join('\n');

  const appStoreDoc = [
    '<!-- Generated by `npm run store-assets` from listing.json. Do not edit by hand. -->',
    '',
    '# App Store — Store listing',
    '',
    '| Field | Value |',
    '|-------|-------|',
    '| Bundle id | `' + app.bundleId + '` |',
    '| Version | ' + app.marketingVersion + ' |',
    '| Primary category | ' + app.appStorePrimaryCategory + ' |',
    '| Secondary category | ' + app.appStoreSecondaryCategory + ' |',
    '| Price | ' + app.price + ' |',
    '| Support URL | ' + contact.supportUrl + ' |',
    '| Privacy policy | ' + contact.privacyPolicyUrl + ' |',
    '',
    'All localisations are in Spanish and English; Arabic is supported in-app but',
    'store metadata does not need an Arabic localisation to ship.',
    '',
    '## Copy',
    '',
    ...appStoreSections,
  ].join('\n');

  const outputs = [
    { file: path.join(STORE_DIR, 'play-store-listing.md'), text: playDoc },
    { file: path.join(STORE_DIR, 'app-store-listing.md'), text: appStoreDoc },
  ];

  for (const output of outputs) {
    fs.writeFileSync(output.file, output.text);
  }

  return outputs.map((output) => ({
    file: output.file,
    bytes: Buffer.byteLength(output.text),
  }));
}


/** Raw captures grouped by locale folder (or a single `null` group if flat). */
function listRawGroups() {
  if (!fs.existsSync(RAW_DIR)) return [];

  const entries = fs.readdirSync(RAW_DIR).sort();
  const groups = [];

  const flat = entries.filter((name) => name.toLowerCase().endsWith('.png'));
  if (flat.length > 0) {
    groups.push({
      locale: null,
      files: flat.map((name) => ({ abs: path.join(RAW_DIR, name), name })),
    });
  }

  for (const entry of entries) {
    const dir = path.join(RAW_DIR, entry);
    if (!fs.statSync(dir).isDirectory()) continue;
    const files = fs
      .readdirSync(dir)
      .filter((name) => name.toLowerCase().endsWith('.png'))
      .sort();
    if (files.length === 0) continue;
    groups.push({
      locale: entry,
      files: files.map((name) => ({ abs: path.join(dir, name), name })),
    });
  }

  for (const locale of REQUIRED_SCREENSHOT_LOCALES) {
    if (!groups.some((group) => group.locale === locale)) {
      console.warn(
        `! no raw ${locale} screenshots in ${path.relative(ROOT, path.join(RAW_DIR, locale))}`,
      );
    }
  }

  return groups;
}


function main() {
  // 1. Play Store icon: 512x512, 32-bit PNG with alpha, <= 1 MB.
  const playIcon = resize(readPng(path.join(ROOT, 'assets', 'icon.png')), 512, 512);
  const iconOut = writePng(playIcon, path.join(OUT_DIR, 'play-icon-512.png'), { alpha: true });

  // 2. App Store icon: 1024x1024, opaque (Apple rejects alpha).
  const appStoreIcon = readPng(path.join(ROOT, 'assets', 'icon.png'));
  const appStoreOut = writePng(appStoreIcon, path.join(OUT_DIR, 'app-store-icon-1024.png'));

  // 3. Play feature graphic: 1024x500, truecolor.
  const banner = readPng(path.join(ROOT, 'assets', 'branding', 'banner.png'));
  const feature = resize(cropToAspect(banner, 1024 / 500), 1024, 500);
  const featureOut = writePng(feature, path.join(OUT_DIR, 'play-feature-graphic.png'));

  // 4. Play phone screenshots: 1080x1920 (9:16), truecolor, app UI untouched.
  //    Raw captures are grouped by store locale (`raw/es`, `raw/en`, ...); flat
  //    files in `raw/` are still accepted for a quick single-locale run.
  const screenshots = [];
  const rawGroups = listRawGroups();
  for (const group of rawGroups) {
    for (const file of group.files) {
      const raw = readPng(file.abs);
      const canvas = brandCanvas(1080, 1920);
      const scale = Math.min(1080 / raw.width, 1920 / raw.height);
      const scaled = resize(raw, Math.round(raw.width * scale), Math.round(raw.height * scale));
      composite(
        canvas,
        scaled,
        Math.round((1080 - scaled.width) / 2),
        Math.round((1920 - scaled.height) / 2),
      );
      const target = group.locale
        ? path.join(PHONE_DIR, group.locale, file.name)
        : path.join(PHONE_DIR, file.name);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      screenshots.push(writePng(canvas, target));
    }
  }
  if (screenshots.length === 0) {
    console.warn(
      `! no raw screenshots in ${path.relative(ROOT, RAW_DIR)} — skipping Play screenshots`,
    );
  }

  // 4b. App Store screenshots at exact pixels, no alpha. Stays empty until iOS
  //     captures exist in `raw/ios-6.9` / `raw/ios-6.5` (needs macOS).
  const appStoreShots = [];
  for (const set of IOS_SCREENSHOT_SETS) {
    const dir = path.join(RAW_DIR, set.dir);
    if (!fs.existsSync(dir)) continue;

    const files = fs
      .readdirSync(dir)
      .filter((name) => name.toLowerCase().endsWith('.png'))
      .sort();
    for (const file of files) {
      const raw = readPng(path.join(dir, file));
      const canvas = brandCanvas(set.width, set.height);
      const scale = Math.min(set.width / raw.width, set.height / raw.height);
      const scaled = resize(raw, Math.round(raw.width * scale), Math.round(raw.height * scale));
      composite(
        canvas,
        scaled,
        Math.round((set.width - scaled.width) / 2),
        Math.round((set.height - scaled.height) / 2),
      );
      const target = path.join(APP_STORE_SHOTS_DIR, set.dir, file);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      appStoreShots.push(writePng(canvas, target));
    }
  }
  if (appStoreShots.length === 0) {
    console.warn('! no iOS captures yet (needs macOS) — skipping App Store screenshots');
  }

  // 5. Listing documents rendered from listing.json.
  const listing = JSON.parse(fs.readFileSync(path.join(STORE_DIR, 'listing.json'), 'utf8'));
  const written = writeListings(listing);

  console.log('Store assets written:');
  for (const item of [
    iconOut,
    appStoreOut,
    featureOut,
    ...screenshots,
    ...appStoreShots,
    ...written,
  ]) {
    console.log(`  ${path.relative(ROOT, item.file)}  ${(item.bytes / 1024).toFixed(1)} KB`);
  }
}

