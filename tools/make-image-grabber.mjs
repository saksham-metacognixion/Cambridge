// Writes a script to paste into the browser console on https://cambridgehospital.com (logged in or not): the visitor's own
// browser passes the Cloudflare check that blocks every scripted download (NW1), so it fetches the images the site needs
// and saves them as ONE file, cambridge-images.tar (paths = the live URL paths, plus media.json = WordPress media id -> path).
// Inputs: posts.json image_source, wp-images.json source, wp_media ids in doctors / insurers / testimonials + leadership.
// Usage: node tools/make-image-grabber.mjs > grabber.js   (or | pbcopy), paste in the console of a wp-admin page while
// logged in (the image ids are looked up through the Media Library), wait for the download.
// Then: node tools/import-image-tar.mjs docs/cambridge-images.tar
import fs from 'node:fs';
const read = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const posts = read('src/data/news/posts.json');
const urls = new Set([
  ...(Array.isArray(posts) ? posts : posts.posts).map((p) => p.image_source),
  ...read('src/data/wp-images.json').images.map((x) => x.source),
].filter(Boolean));
const ids = new Set([
  ...read('src/data/doctors.json').doctors.map((d) => d.wp_media),
  ...read('src/data/insurers.json').insurers.map((d) => d.wp_media),
  ...read('src/data/testimonials.json').testimonials.map((d) => d.wp_media),
  ...read('docs/leadership.json').map((d) => d.featured_media),
].filter(Boolean));

const browser = async (URLS, IDS) => {
  const log = (...a) => console.log('%c[images]', 'color:#00b8ff', ...a);
  const media = {}, failed = [];
  // id -> URL: the Media Library's own admin-ajax query (any logged-in user with upload rights; the REST media route
  // answers 403 on this site), then the REST route as a fallback. A failed lookup never stops the downloads.
  const add = (id, url) => { if (url && !media[id]) { media[id] = new URL(url).pathname.slice(1); URLS.push(url); } };
  for (let i = 0; i < IDS.length; i += 40) {
    const chunk = IDS.slice(i, i + 40);
    try {
      const body = new URLSearchParams({ action: 'query-attachments', 'query[posts_per_page]': '-1', 'query[post_status]': 'inherit' });
      chunk.forEach((id) => body.append('query[post__in][]', id));
      const r = await fetch('/wp-admin/admin-ajax.php', { method: 'POST', credentials: 'include', body });
      const j = await r.json();
      (j.data || []).forEach((m) => add(m.id, m.url));
    } catch (e) { log('media library lookup failed', e.message); }
    const rest = chunk.filter((id) => !media[id]);
    if (!rest.length) continue;
    try {
      const nonce = window.wpApiSettings?.nonce;
      const r = await fetch(`/wp-json/wp/v2/media?include=${rest.join(',')}&per_page=100&_fields=id,source_url`, { credentials: 'include', headers: nonce ? { 'X-WP-Nonce': nonce } : {} });
      if (r.ok) (await r.json()).forEach((m) => add(m.id, m.source_url));
    } catch (e) { log('REST media lookup failed', e.message); }
  }
  log(`media ids resolved: ${Object.keys(media).length} / ${IDS.length}`);
  const list = [...new Set(URLS.map((u) => new URL(u, location.origin).pathname))];
  const files = [];
  // The site answers 403 to script requests for uploads (fetch), but serves the same file to an <img>: load each image as an
  // <img> (same origin, so the canvas is not tainted) and re-encode it as WebP 0.95 (Astro re-encodes it anyway).
  // Stored as <original path>.webp; tools/import-image-tar.mjs maps it back to the original URL.
  const viaImg = (p) => new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => {
      const c = Object.assign(document.createElement('canvas'), { width: im.naturalWidth, height: im.naturalHeight });
      c.getContext('2d').drawImage(im, 0, 0);
      c.toBlob((b) => (b ? b.arrayBuffer().then((x) => res(new Uint8Array(x)), rej) : rej(new Error('encode'))), 'image/webp', 0.95);
    };
    im.onerror = () => rej(new Error('img blocked'));
    im.src = p;
  });
  let done = 0;
  const worker = async () => {
    while (list.length) {
      const p = list.shift();
      try {
        files.push([p.slice(1) + '.webp', await viaImg(p)]);
      } catch (e) { failed.push(`${p} ${e.message}`); }
      if (++done % 20 === 0) log(`${done} fetched`);
    }
  };
  await Promise.all([1, 2, 3, 4].map(worker));
  files.push(['media.json', new TextEncoder().encode(JSON.stringify({ media, failed }, null, 1))]);
  // minimal ustar writer
  const enc = new TextEncoder(), parts = [];
  const field = (b, off, len, s) => b.set(enc.encode(s).slice(0, len), off);
  for (const [name, data] of files) {
    const h = new Uint8Array(512);
    let n = name, prefix = '';
    if (enc.encode(n).length > 100) { const k = n.lastIndexOf('/', 154); prefix = n.slice(0, k); n = n.slice(k + 1); }
    field(h, 0, 100, n); field(h, 100, 8, '0000644\0'); field(h, 108, 8, '0000000\0'); field(h, 116, 8, '0000000\0');
    field(h, 124, 12, data.length.toString(8).padStart(11, '0') + '\0'); field(h, 136, 12, Math.floor(Date.now() / 1000).toString(8).padStart(11, '0') + '\0');
    field(h, 148, 8, '        '); h[156] = 48; field(h, 257, 6, 'ustar\0'); field(h, 263, 2, '00'); field(h, 345, 155, prefix);
    field(h, 148, 8, h.reduce((a, b) => a + b, 0).toString(8).padStart(6, '0') + '\0 ');
    parts.push(h, data, new Uint8Array((512 - (data.length % 512)) % 512));
  }
  parts.push(new Uint8Array(1024));
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob(parts, { type: 'application/x-tar' })), download: 'cambridge-images.tar' });
  document.body.append(a); a.click();
  log(`saved cambridge-images.tar: ${files.length - 1} images, ${failed.length} failed`, failed);
};
process.stdout.write(`(${browser})(${JSON.stringify([...urls])}, ${JSON.stringify([...ids])});\n`);
