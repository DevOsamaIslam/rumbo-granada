/**
 * Splices `branding/Granada Bus App Icon Collection.png` into the individual
 * brand assets the app needs, replacing the Expo template placeholders.
 *
 * Component map (bounding boxes from the connected-component analysis):
 *   c00-c12  red app icons (size ladder, c00 is the master art)
 *   c13/c14  light / dark icon variants        c15  beige variant
 *   c19/c24  map pins (teardrop marker with castle + bus)
 *   c20      notification badge icon ("1")
 *   c21/c22  vertical splash artworks
 *   c23      "Granada Bus App" wide banner
 *   c25/c26  App Store / Google Play badges
 *
 * Uses pngjs (already a devDependency).
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'branding', 'Granada Bus App Icon Collection.png');

fs.mkdirSync(path.join(ROOT, 'assets', 'branding'), { recursive: true });

const src = PNG.sync.read(fs.readFileSync(SRC));

/** Inclusive-exclusive crop of a region of `src`. */
function crop(x0, y0, x1, y1) {
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
    const fy = Math.min(Math.max((y + 0.5) * sh / dh - 0.5, 0), sh - 1);
    const y0 = Math.min(Math.floor(fy), sh - 1);
    const y1 = Math.min(y0 + 1, sh - 1);
    const ty = fy - y0;
    for (let x = 0; x < dw; x++) {
      const fx = Math.min(Math.max((x + 0.5) * sw / dw - 0.5, 0), sw - 1);
      const x0 = Math.min(Math.floor(fx), sw - 1);
      const x1 = Math.min(x0 + 1, sw - 1);
      const tx = fx - x0;
      const p00 = px(x0, y0), p10 = px(x1, y0), p01 = px(x0, y1), p11 = px(x1, y1);
      const di = (y * dw + x) * 4;
      for (let c = 0; c < 4; c++) {
        const top = p00[c] * (1 - tx) + p10[c] * tx;
        const bot = p01[c] * (1 - tx) + p11[c] * tx;
        dd[di + c] = Math.round(top * (1 - ty) + bot * ty);
      }
    }
  }
  // Unpremultiply.
  for (let i = 0; i < dd.length; i += 4) {
    const a = dd[i + 3];
    if (a > 0 && a < 255) {
      const f = 255 / a;
      dd[i] = Math.min(255, Math.round(dd[i] * f));
      dd[i + 1] = Math.min(255, Math.round(dd[i + 1] * f));
      dd[i + 2] = Math.min(255, Math.round(dd[i + 2] * f));
    }
  }
  return out;
}

/** Solid-color square canvas. */
function solid(size, color) {
  const out = new PNG({ width: size, height: size });
  for (let i = 0; i < out.data.length; i += 4) {
    out.data[i] = color[0]; out.data[i + 1] = color[1]; out.data[i + 2] = color[2]; out.data[i + 3] = color[3] ?? 255;
  }
  return out;
}

/** Center `inner` on a `size`x`size` canvas (bg optional). */
function padSquare(inner, size, bg) {
  const out = solid(size, bg ?? [0, 0, 0, 0]);
  PNG.bitblt(inner, out, 0, 0, inner.width, inner.height, (size - inner.width) >> 1, (size - inner.height) >> 1);
  return out;
}

/** Scale art to fit a target square, then center on it. */
function fitSquare(inner, size, bg) {
  const scale = Math.min(size / inner.width, size / inner.height);
  const w = Math.round(inner.width * scale);
  const h = Math.round(inner.height * scale);
  return padSquare(resize(inner, w, h), size, bg);
}

function save(png, file) {
  const target = path.join(ROOT, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, PNG.sync.write(png));
  console.log(`wrote ${file} (${png.width}x${png.height})`);
}

// ---------------------------------------------------------------------------
// Component boxes (from the connected-component analysis; end exclusive)
// ---------------------------------------------------------------------------
const BOX = {
  master: [46, 40, 344, 325],
  iconLight: [46, 381, 272, 593],
  iconDark: [296, 382, 517, 591],
  iconBeige: [543, 399, 725, 578],
  pin: [1207, 418, 1341, 588],
  pinSmall: [1171, 696, 1274, 831],
  notificationBadge: [1374, 419, 1512, 565],
  splash1: [50, 619, 244, 964],
  splash2: [280, 619, 476, 964],
  banner: [501, 671, 1148, 937],
  appStore: [1304, 710, 1501, 787],
  playStore: [1304, 827, 1501, 894],
};

const master = crop(...BOX.master);

function sample(png, x, y) {
  const i = (y * png.width + x) * 4;
  return [png.data[i], png.data[i + 1], png.data[i + 2]];
}
const hex = (rgb) => `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`;

// Edge pixels of the master art (vertical centre, a few px inside the shape)
// give the exact brand red used across the collection.
const midY = master.height >> 1;
const edgeL = sample(master, 6, midY);
const edgeR = sample(master, master.width - 7, midY);
const BRAND_RED = edgeL.map((v, c) => Math.round((v + edgeR[c]) / 2));
console.log(`brand red: rgb(${BRAND_RED.join(',')}) = ${hex(BRAND_RED)}`);

const splash2 = crop(...BOX.splash2);
const SPLASH_RED = sample(splash2, 3, splash2.height >> 1);
console.log(`splash red: rgb(${SPLASH_RED.join(',')}) = ${hex(SPLASH_RED)}`);

// --- Core app assets --------------------------------------------------------
// The collection's master art is a rounded tile with a subtle red gradient
// backdrop. Store icons must be square and full-bleed (the OS applies its own
// mask), so the glyph (castle + bus) is cut out of the art and recomposed on a
// clean gradient: full-bleed for iOS, inside the Android adaptive safe zone.
const GLYPH_CANVAS = 1024;
/** iOS/store icon: 1024x1024, opaque, glyph leaving a ~14% margin per side. */
const ICON_GLYPH_FRACTION = 0.72;
/** Android adaptive safe zone: 66dp of the 108dp layer canvas (~61%). */
const ADAPTIVE_GLYPH_FRACTION = 0.6;
/** Splash logo: 1024x1024 transparent PNG, same breathing room as the icon. */
const SPLASH_GLYPH_FRACTION = 0.62;

// Gradient stops sampled from the art's own backdrop (top light → bottom dark).
const GRADIENT_TOP = sample(master, 30, 30);
const GRADIENT_BOTTOM = sample(master, 30, master.height - 31);
console.log(`icon gradient: ${hex(GRADIENT_TOP)} → ${hex(GRADIENT_BOTTOM)}`);

/** Opaque vertical brand gradient, matching the collection backdrop. */
function redGradient(size, top, bottom) {
  const out = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) {
    const t = y / (size - 1);
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      for (let c = 0; c < 3; c++) {
        out.data[i + c] = Math.round(top[c] * (1 - t) + bottom[c] * t);
      }
      out.data[i + 3] = 255;
    }
  }
  return out;
}

/** Fully transparent square canvas. */
function transparent(size) {
  return new PNG({ width: size, height: size });
}

// Glyph extraction: only the bright artwork counts — the castle is beige
// (#FDD4A2) and the bus is white — while every red shade (backdrop gradient,
// hill) has near-zero green/blue. The bounding box crops the art so it can be
// re-scaled independently of the rounded tile it came from.
let minX = master.width, maxX = 0, minY = master.height, maxY = 0;
const glyphArt = new PNG({ width: master.width, height: master.height });
const glyphMask = new PNG({ width: master.width, height: master.height });
for (let y = 0; y < master.height; y++) {
  for (let x = 0; x < master.width; x++) {
    const i = (y * master.width + x) * 4;
    const a = Math.max(0, Math.min(255, Math.round((Math.min(master.data[i + 1], master.data[i + 2]) - 85) * 5)));
    if (a > 0) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    glyphArt.data[i] = master.data[i];
    glyphArt.data[i + 1] = master.data[i + 1];
    glyphArt.data[i + 2] = master.data[i + 2];
    glyphArt.data[i + 3] = a;
    glyphMask.data[i] = 255;
    glyphMask.data[i + 1] = 255;
    glyphMask.data[i + 2] = 255;
    glyphMask.data[i + 3] = a;
  }
}

/** Crop a glyph layer down to its visible bounding box. */
function cropGlyph(source) {
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const out = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const si = ((y + minY) * source.width + (x + minX)) * 4;
      const di = (y * w + x) * 4;
      for (let c = 0; c < 4; c++) out.data[di + c] = source.data[si + c];
    }
  }
  return out;
}
const glyphBox = cropGlyph(glyphArt);
const glyphSilhouette = cropGlyph(glyphMask);

/**
 * Scale `art` to `fraction` of the square canvas and source-over composite it
 * on `bg` (PNG.bitblt would overwrite instead of blending).
 */
function glyphOn(bg, fraction, art = glyphBox) {
  const size = bg.width;
  const scale = (size * fraction) / Math.max(art.width, art.height);
  const scaled = resize(art, Math.round(art.width * scale), Math.round(art.height * scale));
  const out = new PNG({ width: size, height: size });
  out.data.set(bg.data);
  const offX = (size - scaled.width) >> 1;
  const offY = (size - scaled.height) >> 1;
  for (let y = 0; y < scaled.height; y++) {
    for (let x = 0; x < scaled.width; x++) {
      const si = (y * scaled.width + x) * 4;
      const sa = scaled.data[si + 3] / 255;
      if (sa === 0) continue;
      const di = ((y + offY) * size + (x + offX)) * 4;
      const da = out.data[di + 3] / 255;
      const oa = sa + da * (1 - sa);
      for (let c = 0; c < 3; c++) {
        out.data[di + c] = Math.round(
          (scaled.data[si + c] * sa + out.data[di + c] * da * (1 - sa)) / oa,
        );
      }
      out.data[di + 3] = Math.round(oa * 255);
    }
  }
  return out;
}

// Full-bleed opaque app icon (Apple rejects transparency in store icons).
save(glyphOn(redGradient(GLYPH_CANVAS, GRADIENT_TOP, GRADIENT_BOTTOM), ICON_GLYPH_FRACTION), 'assets/icon.png');

// Rounded logo for in-app use (AppHeader) — transparent outside the art.
const masterFullBleed = padSquare(master, Math.max(master.width, master.height), BRAND_RED);
save(resize(master, 256, 245), 'assets/logo.png');

// Android adaptive icon: transparent glyph-only foreground inside the safe
// zone, over the solid brand red background layer.
save(glyphOn(transparent(GLYPH_CANVAS), ADAPTIVE_GLYPH_FRACTION), 'assets/android-icon-foreground.png');
save(solid(GLYPH_CANVAS, BRAND_RED), 'assets/android-icon-background.png');
// Monochrome (white) glyph for Android themed icons.
save(glyphOn(transparent(GLYPH_CANVAS), SPLASH_GLYPH_FRACTION, glyphSilhouette), 'assets/android-icon-monochrome.png');

// Splash logo: square, transparent, centred glyph. expo-splash-screen scales it
// with `imageWidth` over the brand red background (see app.config.ts).
save(glyphOn(transparent(GLYPH_CANVAS), SPLASH_GLYPH_FRACTION), 'assets/splash-icon.png');

// Favicon: the master art on brand red.
save(fitSquare(masterFullBleed, 48, BRAND_RED), 'assets/favicon.png');

// Map pin for StopMarker: pin centred on a transparent square (no distortion
// when React Native renders it at width == height).
const pin = crop(...BOX.pin);
save(resize(padSquare(pin, Math.max(pin.width, pin.height)), 340, 340), 'assets/map-pin.png');

// Notification icon (Android status bar): the same map pin as the stop marker,
// flattened to a white silhouette with transparency, as Android requires.
// 96x96 px = 24dp at xxxhdpi.
function silhouette(png, size, fraction) {
  const scale = (size * fraction) / Math.max(png.width, png.height);
  const scaled = resize(png, Math.round(png.width * scale), Math.round(png.height * scale));
  for (let i = 0; i < scaled.data.length; i += 4) {
    scaled.data[i] = 255;
    scaled.data[i + 1] = 255;
    scaled.data[i + 2] = 255;
    // Android draws the status-bar icon as a mask: hard edges, no halo.
    scaled.data[i + 3] = scaled.data[i + 3] >= 40 ? 255 : 0;
  }
  return padSquare(scaled, size);
}
save(silhouette(pin, 96, 0.9), 'assets/notification-icon.png');

// --- Additional branding components (store listing, future UI) --------------
save(resize(crop(...BOX.banner), 1294, 532), 'assets/branding/banner.png');
save(resize(crop(...BOX.appStore), 394, 154), 'assets/branding/app-store-badge.png');
save(resize(crop(...BOX.playStore), 394, 134), 'assets/branding/google-play-badge.png');
save(resize(crop(...BOX.iconLight), 452, 424), 'assets/branding/icon-light.png');
save(resize(crop(...BOX.iconDark), 442, 418), 'assets/branding/icon-dark.png');
save(resize(crop(...BOX.iconBeige), 364, 358), 'assets/branding/icon-beige.png');
save(resize(crop(...BOX.splash1), 388, 690), 'assets/branding/splash-artwork-1.png');
save(resize(splash2, 588, 1035), 'assets/branding/splash-artwork-2.png');
save(resize(crop(...BOX.notificationBadge), 276, 292), 'assets/branding/notification-badge.png');
const pinSmall = crop(...BOX.pinSmall);
save(resize(padSquare(pinSmall, Math.max(pinSmall.width, pinSmall.height)), 260, 260), 'assets/branding/pin-small.png');

console.log('done');
