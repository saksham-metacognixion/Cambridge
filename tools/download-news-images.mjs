// Downloads the news images into src/assets so Astro can optimise them (AVIF/WebP, 1x/2x):
//   - every post's `image_source` (featured image on the current site) -> src/assets/<image>.<ext>
//   - every image of src/data/wp-images.json (live-site photos for placeholders: conditions, care, testimonials, insurer logos ...)
//   - every YouTube video embedded in a body (<figure data-youtube="id">) -> src/assets/news/videos/<id>.jpg
//     (maxresdefault, else hqdefault; the article shows it as the click-to-play poster, so no YouTube request on load)
// Usage: node tools/download-news-images.mjs [--browser] [--headed]
//   Skips files that already exist; never overwrites. cambridgehospital.com sits behind a Cloudflare bot challenge that
//   answers 403 to plain HTTP clients, so --browser fetches the featured images through a real Chrome (playwright-core,
//   the QC suite's browser): it opens the site once, waits for the challenge to clear, then fetches each file in-page.
//   On 5 Oct 2026 the challenge did not clear for an automated Chrome (headless or visible), so use --browser --headed:
//   a Chrome window opens on the site and the script waits up to 3 minutes for YOU to pass the check (tick the box if
//   one is shown); once the home page is visible the downloads run by themselves. Alternative: the wp-content/uploads
//   folder from Pramod, copied to src/assets/news/<slug>.<ext> (see image / image_source in posts.json).
import fs from 'node:fs';
import path from 'node:path';

const posts = JSON.parse(fs.readFileSync('src/data/news/posts.json', 'utf8'));
const useBrowser = process.argv.includes('--browser');
const headed = process.argv.includes('--headed');
const stats = { done: 0, skipped: 0, failed: 0 };

const save = (file, buf) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buf);
  stats.done++;
};

// ---- plain fetch (works for i.ytimg.com; cambridgehospital.com needs --browser) ----
async function plain(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'image/avif,image/webp,image/*,*/*' } });
  if (!res.ok) throw new Error(String(res.status));
  return Buffer.from(await res.arrayBuffer());
}

// ---- browser fetch ----
let page = null;
async function browserPage() {
  if (page) return page;
  const { chromium } = await import('playwright-core');
  const browser = await chromium.launch({ channel: 'chrome', headless: !headed });
  page = await browser.newPage();
  await page.goto('https://cambridgehospital.com/', { waitUntil: 'domcontentloaded' });
  const challenged = async () => /just a moment|attention required/i.test(await page.title());
  if (headed && (await challenged())) console.log('Cloudflare check: pass it in the Chrome window (waiting up to 3 minutes)...');
  for (let i = 0; i < (headed ? 180 : 30) && (await challenged()); i++) await page.waitForTimeout(1000);
  if (await challenged()) throw new Error('Cloudflare challenge did not clear');
  return page;
}
async function viaBrowser(url) {
  const p = await browserPage();
  const r = await p.evaluate(async (u) => {
    const res = await fetch(u, { credentials: 'include' });
    if (!res.ok) return { error: res.status };
    const b = new Uint8Array(await res.arrayBuffer());
    let s = '';
    for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
    return { b64: btoa(s), type: res.headers.get('content-type') };
  }, url);
  if (r.error) throw new Error(String(r.error));
  if (!/^image\//.test(r.type ?? '')) throw new Error(`not an image (${r.type})`);
  return Buffer.from(r.b64, 'base64');
}

// ---- featured images ----
const seen = new Set();
for (const p of posts) {
  if (!p.image_source || !p.image || seen.has(p.image)) continue;
  seen.add(p.image);
  const ext = (path.extname(new URL(p.image_source).pathname) || '.jpg').toLowerCase();
  const file = path.join('src/assets', p.image + ext);
  if (fs.existsSync(file)) { stats.skipped++; continue; }
  try {
    save(file, useBrowser ? await viaBrowser(p.image_source) : await plain(p.image_source));
  } catch (e) {
    stats.failed++;
    console.warn(`FAILED ${p.slug}: ${p.image_source} (${e.message})`);
  }
}

// ---- live-site page images (src/data/wp-images.json: conditions, care, testimonials, insurers, hospitals, banners) ----
const manifest = JSON.parse(fs.readFileSync('src/data/wp-images.json', 'utf8')).images;
for (const m of manifest) {
  const ext = (path.extname(new URL(m.source).pathname) || '.jpg').toLowerCase();
  const file = path.join('src/assets', m.key + ext);
  if (fs.existsSync(file)) { stats.skipped++; continue; }
  try {
    save(file, useBrowser ? await viaBrowser(m.source) : await plain(m.source));
  } catch (e) {
    stats.failed++;
    console.warn(`FAILED ${m.key}: ${m.source} (${e.message})`);
  }
}

// ---- YouTube posters ----
const ids = new Set();
for (const p of posts) for (const m of p.body.matchAll(/data-youtube="([A-Za-z0-9_-]{11})"/g)) ids.add(m[1]);
for (const id of ids) {
  const file = path.join('src/assets/news/videos', `${id}.jpg`);
  if (fs.existsSync(file)) { stats.skipped++; continue; }
  try {
    let buf;
    try { buf = await plain(`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`); }
    catch { buf = await plain(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`); }
    save(file, buf);
  } catch (e) {
    stats.failed++;
    console.warn(`FAILED poster ${id} (${e.message})`);
  }
}

if (page) await page.context().browser().close();
console.log(`downloaded ${stats.done}, skipped ${stats.skipped}, failed ${stats.failed}`);
