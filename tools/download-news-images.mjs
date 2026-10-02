// Downloads every post's `image_source` into src/assets/<image>.<ext> so Astro can optimise it (AVIF/WebP, 1x/2x).
// Usage: node tools/download-news-images.mjs   (skips files that already exist; never overwrites)
import fs from 'node:fs';
import path from 'node:path';

const posts = JSON.parse(fs.readFileSync('src/data/news/posts.json', 'utf8'));
let done = 0, skipped = 0, failed = 0;
for (const p of posts) {
  if (!p.image_source || !p.image) continue;
  const ext = (path.extname(new URL(p.image_source).pathname) || '.jpg').toLowerCase();
  const file = path.join('src/assets', p.image + ext);
  if (fs.existsSync(file)) { skipped++; continue; }
  try {
    const res = await fetch(p.image_source);
    if (!res.ok) throw new Error(String(res.status));
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    done++;
  } catch (e) {
    failed++;
    console.warn(`FAILED ${p.slug}: ${p.image_source} (${e.message})`);
  }
}
console.log(`downloaded ${done}, skipped ${skipped}, failed ${failed}`);
