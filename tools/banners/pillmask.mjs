// Bug 213: render src/assets/banners/pills.svg at its spot in the client's 2880x1370 composites (stack top-left 1172.68,138.54,
// 1540.74 x 1178.6 composite px; tools/banners/pill_place.py STACK) as a transparent PNG mask for conditions_cutout.py.
// Usage: node tools/banners/pillmask.mjs <out.png>
import sharp from 'sharp';
const svg = new URL('../../src/assets/banners/pills.svg', import.meta.url).pathname;
const w = 1541, h = 1179;
const pills = await sharp(svg, { density: 72 * 1540.74 / 562 }).resize(w, h).png().toBuffer();
await sharp({ create: { width: 2880, height: 1370, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: pills, left: 1173, top: 139 }]).png().toFile(process.argv[2]);
console.log('ok');
