import type { ImageMetadata } from 'astro';
import type { RegionId } from './editions';

/*
 * Images are referenced from JSON by key = path under src/assets without extension, e.g. "doctors/dr-ahmad".
 * Region-specific versions (scope 2.2: "never mix images across regions") go in
 * src/assets/regions/<ae|sa>/<same key>.<ext> and win automatically for that region; otherwise the shared file is used.
 *
 * Do NOT read .width/.height/.src of a raster image from here except by passing it to <Picture>/<Image>:
 * any property read makes Astro copy the full-size original into dist.
 */
const all = import.meta.glob<{ default: ImageMetadata }>('../assets/**/*.{png,jpg,jpeg,webp,avif,svg}', { eager: true });
const byKey = new Map<string, ImageMetadata>();
for (const [p, m] of Object.entries(all)) byKey.set(p.replace('../assets/', '').replace(/\.[a-z0-9]+$/i, ''), m.default);

export function img(key: string, region?: RegionId): ImageMetadata {
  if (region && region !== 'global') {
    const r = byKey.get(`regions/${region}/${key}`);
    if (r) return r;
  }
  const v = byKey.get(key);
  if (!v) throw new Error(`Image not found for key "${key}" (looked in src/assets${region ? ` and src/assets/regions/${region}` : ''})`);
  return v;
}
