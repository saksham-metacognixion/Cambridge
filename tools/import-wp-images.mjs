// Wires the live site's images saved by tools/make-image-grabber.mjs (folders docs/cambridge-images*/, unpacked from
// cambridge-images.tar: wp-content/uploads/... + media.json = WordPress media id -> path) into src/assets + the data JSON.
// Only EMPTY slots are filled; a Figma image already in place is never replaced (Figma = design source of truth).
//   doctors       no photo + wp_media file   -> src/assets/doctors/wp/<slug>.<ext>, photo = that key (card default box)
//   testimonials  no photo + wp_media file   -> src/assets/testimonials/wp/<slug>.<ext>, photo box = Mohamed Al Menhali's
//                                               (same 0.80 cut-out photo format, Figma 6x:xxx card), layer order idem
//   insurers      no logo + wp_media file    -> src/assets/insurance/wp/<slug>.<ext>, logo = the live 325x180 tile centred
//   news          image_source file          -> src/assets/<image>.<ext> (the key download-news-images.mjs uses)
// Per file the original bytes win (fetch run: <path>), else the browser re-encode (<path>.webp).
// Usage: node tools/import-wp-images.mjs   (idempotent). Report: docs/wp-images-import.md
import fs from 'node:fs';
import path from 'node:path';

const read = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const write = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2) + '\n');
// Folders with a media.json (grabber output: WordPress media id -> upload path) or a _map.json (flat live-site files without
// media ids, e.g. docs/cambridge-images-ksa, bug 063: { doctors: { <slug>: <file> }, testimonials: {...}, insurers: {...} }).
const dirs = fs.readdirSync('docs').filter((d) => d.startsWith('cambridge-images') && (fs.existsSync(`docs/${d}/media.json`) || fs.existsSync(`docs/${d}/_map.json`))).map((d) => `docs/${d}`);
if (!dirs.length) throw new Error('no docs/cambridge-images*/ folder with a media.json or _map.json (unpack cambridge-images.tar there)');

/** upload path (wp-content/uploads/...) -> local file, original bytes preferred */
const files = new Map();
const media = {};
/** "<type>/<slug>" -> local file, from the _map.json folders */
const flat = new Map();
for (const d of dirs) {
  if (fs.existsSync(`${d}/media.json`)) Object.assign(media, read(`${d}/media.json`).media);
  if (fs.existsSync(`${d}/_map.json`)) {
    const m = read(`${d}/_map.json`);
    for (const type of ['doctors', 'testimonials', 'insurers']) for (const [slug, f] of Object.entries(m[type] ?? {})) flat.set(`${type}/${slug}`, `${d}/${f}`);
  }
  const walk = (p) => fs.readdirSync(p, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(`${p}/${e.name}`) : e.name !== '.DS_Store' && add(`${p}/${e.name}`)));
  const add = (f) => {
    const rel = path.relative(d, f);
    // <path>.avif.webp = the grabber's browser re-encode of <path>.avif; a plain .webp (the older posts) is an original
    const key = /\.(avif|png|jpe?g|gif)\.webp$/i.test(rel) ? rel.slice(0, -5) : rel;
    const original = key === rel;
    if (!files.has(key) || original) files.set(key, f);
  };
  if (fs.existsSync(`${d}/wp-content`)) walk(`${d}/wp-content`);
}
const fileFor = (id) => media[id] && files.get(media[id]);
/** the live file for an empty slot: by WordPress media id, else by slug from a _map.json */
const slotFile = (type, slug, id) => fileFor(id) || flat.get(`${type}/${slug}`);
const source = (f, id) => (fileFor(id) === f ? media[id] : path.relative("docs", f));
const copy = (src, key) => {
  const ext = path.extname(src);
  const dest = `src/assets/${key}${ext}`;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  return dest;
};
const report = [];

const docFile = read('src/data/doctors.json');
for (const d of docFile.doctors) {
  const f = !d.photo && slotFile('doctors', d.slug, d.wp_media);
  if (!f) continue;
  copy(f, `doctors/wp/${d.slug}`);
  d.photo = `doctors/wp/${d.slug}`;
  report.push(`- doctor ${d.slug}: photo ${source(f, d.wp_media)}`);
}
write('src/data/doctors.json', docFile);

const testFile = read('src/data/testimonials.json');
const tpl = testFile.testimonials.find((t) => t.slug === 'mohamed-al-menhali');
for (const t of testFile.testimonials) {
  const f = !t.photo && slotFile('testimonials', t.slug, t.wp_media);
  if (!f) continue;
  copy(f, `testimonials/wp/${t.slug}`);
  const { w, h, x, y } = tpl.photo;
  t.photo = { image: `testimonials/wp/${t.slug}`, alt: { ...t.name }, w, h, x, y };
  t.layers = [...tpl.layers];
  report.push(`- testimonial ${t.slug}: photo ${source(f, t.wp_media)}`);
}
write('src/data/testimonials.json', testFile);

const insFile = read('src/data/insurers.json');
for (const x of insFile.insurers) {
  const f = !x.logo && slotFile('insurers', x.slug, x.wp_media);
  if (!f) continue;
  copy(f, `insurance/wp/${x.slug}`);
  // live tile 325 x 180 (logo + its own white margin), centred in the 194.77 x 88.79 area above the name bar
  x.logo = { image: `insurance/wp/${x.slug}`, w: 136, h: 75.32, x: 29.39, y: 6.74 };
  report.push(`- insurer ${x.slug}: logo ${source(f, x.wp_media)}`);
}
write('src/data/insurers.json', insFile);

const posts = read('src/data/news/posts.json');
const list = Array.isArray(posts) ? posts : posts.posts;
const done = new Set();
for (const p of list) {
  if (!p.image || !p.image_source || done.has(p.image)) continue;
  const f = files.get(new URL(p.image_source).pathname.slice(1));
  if (!f) continue;
  done.add(p.image);
  copy(f, p.image);
  report.push(`- news ${p.image}`);
}

// The report keeps every slot ever wired (earlier runs + hand-written lines); this run's new lines are appended.
const REPORT = 'docs/wp-images-import.md';
const old = fs.existsSync(REPORT) ? fs.readFileSync(REPORT, 'utf8') : '';
const kept = old.split('\n').filter((l) => l.startsWith('- '));
const fresh = report.filter((l) => !kept.includes(l));
const notes = old.split('\n').filter((l) => l.startsWith('Note:'));
fs.writeFileSync(REPORT, `# Live site images wired in\n\nGenerated by \`tools/import-wp-images.mjs\` from ${dirs.join(', ')} (${files.size} images saved from the live site with \`tools/make-image-grabber.mjs\` / \`tools/live-images/fetch.mjs\`; the rest answered 403, NW1).\nOnly empty slots are filled: Figma images stay. Lines accumulate across runs (${new Date().toISOString().slice(0, 10)}: ${fresh.length} new).\n\n${[...kept, ...fresh].join('\n')}\n${notes.length ? '\n' + notes.join('\n') + '\n' : ''}`);
console.log(report.join('\n'));
console.log(`${report.length} image(s) wired`);
