// Performance audit, 10 Oct 2026: the Home "Contact" logo pattern (src/assets/contact/logo-pattern.png, 4096x1948, thin outline marks
// on transparency, shown at opacity .55) cost 208 KB as Astro's AVIF at 1430 px, the heaviest image on Home. A 32-colour palette
// PNG of the same artwork is 90 KB and closer to the source (mean error 0.15 vs 0.41 of 255 on the composited page pixels; 16
// colours lose detail). Astro always re-encodes <Picture> to AVIF/WebP, so the three srcset widths are written here once and
// Contact.astro references them directly. Re-run after replacing the source: node tools/images/logo-pattern.mjs
import sharp from 'sharp';
const SRC = 'src/assets/contact/logo-pattern.png';
for (const w of [720, 1430, 2860]) {
  const out = `src/assets/contact/logo-pattern-${w}.png`;
  const info = await sharp(SRC).resize(w).png({ palette: true, colours: 32, compressionLevel: 9, effort: 10 }).toFile(out);
  console.log(out, info.width + 'x' + info.height, (info.size / 1024).toFixed(0) + ' KB');
}
