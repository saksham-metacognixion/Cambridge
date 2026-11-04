// One-time move of the news data to one JSON file per post (SEO & GEO dashboard, Phase A, 30 Oct 2026):
//   src/data/news/posts.json (WordPress import) + site-posts.json (posts written for this site) + the news entries of
//   src/data/seo.json (live-site <title> / meta description per URL)
//     -> src/content/news/<slug>.json = { ...what both languages share (date, category, type, status, editions, image ...),
//                                        en: { title, excerpt, body, image_alt, old_url, seo ... }, ar: { same } }
// `ar` is absent when the post has no Arabic record (the English one is shown on /ar, as before).
// Every value is copied unchanged; nothing is invented. A shared field that differs between the two language records stops
// the script (it would be lost). The news entries are removed from seo.json afterwards (the post file is their only home
// now; BaseLayout falls back to the page's own props, which the article page fills from `seo`). Schema: src/lib/news-schema.ts.
// Run: node tools/migrate-news.mjs [--dry]
import fs from 'node:fs';
import path from 'node:path';

const DRY = process.argv.includes('--dry');
const OUT = 'src/content/news';
const read = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));

const wordpress = read('src/data/news/posts.json');
const site = read('src/data/news/site-posts.json').posts;
const seoFile = read('src/data/seo.json');
const seo = seoFile.pages;

// Spec: "Blog" = health articles, "PR / News" = press releases, events, conferences, interviews.
const TYPE = { 'health-articles': 'blog' };
// Fields shared by both languages (top level) vs per language (en / ar).
const SHARED = ['slug', 'date', 'category', 'image', 'image_source', 'region', 'image_crop', 'hero_photo'];
const LOCAL = ['title', 'excerpt', 'body', 'image_alt', 'old_url', 'hero_button', 'source'];

const bySlug = new Map();
for (const p of [...wordpress, ...site]) {
  if (!bySlug.has(p.slug)) bySlug.set(p.slug, {});
  const post = bySlug.get(p.slug);
  if (post[p.language]) throw new Error(`${p.slug}: two ${p.language} records`);
  post[p.language] = p;
}

const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj[k] !== undefined && obj[k] !== '').map((k) => [k, obj[k]]));
const seoFor = (slug, lang) => {
  const entry = seo[`${lang === 'ar' ? '/ar' : ''}/media-hub/${slug}/`];
  return entry ? pick(entry, ['title', 'description']) : undefined;
};
const locale = (rec, lang) => {
  const out = pick(rec, LOCAL);
  const s = seoFor(rec.slug, lang);
  if (s) out.seo = s;
  return out;
};

let files = 0;
const removedSeo = [];
for (const [slug, { en, ar }] of bySlug) {
  if (!en) throw new Error(`${slug}: no English record`);
  if (ar) for (const k of SHARED) if (JSON.stringify(en[k]) !== JSON.stringify(ar[k])) throw new Error(`${slug}: "${k}" differs between en and ar (${JSON.stringify(en[k])} / ${JSON.stringify(ar[k])})`);
  const post = {
    ...pick(en, SHARED),
    type: TYPE[en.category] ?? 'pr',
    status: 'published',
    editions: ['global', 'ae', 'sa'],
    en: locale(en, 'en'),
    ...(ar && { ar: locale(ar, 'ar') }),
  };
  files++;
  if (!DRY) {
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, `${slug}.json`), JSON.stringify(post, null, 2) + '\n');
  }
  // Every edition's entry for this post (Global / UAE / KSA share the value, checked before the migration).
  for (const url of Object.keys(seo)) if (new RegExp(`^(/ae|/sa)?(/ar)?/media-hub/${slug}/$`).test(url)) removedSeo.push(url);
}

if (!DRY) {
  for (const url of removedSeo) delete seo[url];
  seoFile._note += ' News posts (media-hub/<slug>) moved to src/content/news/<slug>.json `en.seo` / `ar.seo` on 30 Oct 2026 (tools/migrate-news.mjs).';
  fs.writeFileSync('src/data/seo.json', JSON.stringify(seoFile, null, 1) + '\n');
}
console.log(`${bySlug.size} posts -> ${files} files in ${OUT}${DRY ? ' (dry run)' : ''}; ${removedSeo.length} seo.json entries moved`);
