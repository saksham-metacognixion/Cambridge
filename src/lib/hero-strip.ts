import type { ImageMetadata } from "astro";
import sharp from "sharp";

/*
 * Hero crop below 1024px (PageHero `small`, styles/global.css .hero-media), 10 Oct 2026: a banner without its own `small`
 * used one generic crop (72vw box, art at 80% 30%), so on tablets the people stood against the right edge (cut there) with a
 * wide empty gradient on the left (Careers, Why, Who We Are, Patient Hub, Care, FAQs, Media Hub). The strip to keep in view
 * is now read at build time from the people cut-out (`<key>-subject`, tools/hero-layers): the columns holding opaque pixels,
 * padded on both sides, never narrower than MIN_W (a narrow strip = a tall, zoomed-in photo), in Figma px of the 1052 art.
 * Same approach as About (bug 027, x 440 w 612), whose hand-set strip stays.
 */
const ART_W = 1052;
const ALPHA = 64; // a column belongs to the people when any pixel is at least this opaque
const MIN_PX = 4; // ... and holds at least this many such pixels (stray anti-aliasing specks ignored)
const PAD = 24; // Figma px kept beyond the people on each side (room for the cursor-follow drift and air)
const MIN_W = 560;

const cache = new Map<string, Promise<{ x: number; w: number } | null>>();

async function read(path: string) {
  const { data, info } = await sharp(path)
    .ensureAlpha()
    .extractChannel(3)
    .raw()
    .toBuffer({ resolveWithObject: true });
  let first = -1,
    last = -1;
  for (let x = 0; x < info.width; x++) {
    let n = 0;
    for (let y = 0; y < info.height && n < MIN_PX; y++)
      if (data[y * info.width + x] >= ALPHA) n++;
    if (n >= MIN_PX) {
      if (first < 0) first = x;
      last = x;
    }
  }
  if (first < 0) return null;
  const k = ART_W / info.width;
  let a = Math.max(0, first * k - PAD),
    b = Math.min(ART_W, (last + 1) * k + PAD);
  if (b - a < MIN_W) {
    const c = (a + b) / 2;
    a = Math.min(Math.max(0, c - MIN_W / 2), ART_W - MIN_W);
    b = a + MIN_W;
  }
  // the whole art (or nearly) holds people: keep the generic crop
  if (b - a > ART_W - 40) return null;
  return { x: Math.round(a), w: Math.round(b - a) };
}

/** The strip of the 1052-wide art that holds the people of a `<key>-subject` layer, or null when it spans the whole art. */
export function heroSubjectStrip(
  image: ImageMetadata,
): Promise<{ x: number; w: number } | null> {
  const path = (image as ImageMetadata & { fsPath?: string }).fsPath;
  if (!path) return Promise.resolve(null);
  let p = cache.get(path);
  if (!p) cache.set(path, (p = read(path)));
  return p;
}

/** Below 1024px the photo box takes the strip's aspect (the whole strip in view), capped at `maxH` (default 640 CSS px, the top
 *  of the art cropped first); `sizes` asks for the zoomed width (art width / strip width), so the crop is not upscaled. */
export function heroSmallCrop(small: { x: number; w: number; maxH?: number }, artH: number, wide = "100vw") {
  const pos = ((small.x / Math.max(1, ART_W - small.w)) * 100).toFixed(2);
  return {
    style: `--hero-h:auto;--hero-aspect:${small.w} / ${artH};--hero-pos:${pos}% 100%;--hero-max-h:${small.maxH ?? 640}px;`,
    sizes: `(max-width: 1023.98px) ${Math.round((100 * ART_W) / small.w)}vw, ${wide}`,
  };
}
