// Run: npm run test:news
// Invariants of the post files (src/content/news/<slug>.json, schema in src/lib/news-schema.ts) that the templates rely on.
// The build validates every file against the Zod schema; this test runs without a build and also checks the counts the
// migration of 30 Oct 2026 must keep (131 posts, every one with an Arabic version).
import assert from 'node:assert/strict';
import fs from 'node:fs';

const DIR = 'src/content/news';
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).sort();
const posts = files.map((f) => ({ file: f, ...JSON.parse(fs.readFileSync(`${DIR}/${f}`, 'utf8')) }));
const categories = JSON.parse(fs.readFileSync('src/data/content/media-hub/page.en.json', 'utf8')).explore.categories.map((c) => c.key);
const KNOWN = new Set([...categories, 'interviews']);
const MIGRATED = 131; // 129 WordPress posts + 2 written for this site, all with an Arabic version (never fewer)

assert.ok(posts.length >= MIGRATED, `${DIR}: ${posts.length} posts, expected at least ${MIGRATED}`);
const slugs = new Set();
for (const p of posts) {
  const k = p.file;
  assert.equal(`${p.slug}.json`, p.file, `${k}: slug "${p.slug}" must equal the file name`);
  assert.ok(!slugs.has(p.slug), `duplicate slug ${p.slug}`);
  slugs.add(p.slug);
  assert.match(p.slug, /^[\p{L}\p{N}-]+$/u, `bad slug "${p.slug}"`);
  assert.match(p.date, /^\d{4}-\d{2}-\d{2}$/, `bad date on ${k}`);
  assert.ok(KNOWN.has(p.category), `unknown category "${p.category}" on ${k}`);
  assert.ok(['blog', 'pr'].includes(p.type), `bad type on ${k}`);
  assert.ok(['draft', 'scheduled', 'published', 'archived'].includes(p.status), `bad status on ${k}`);
  assert.ok(Array.isArray(p.editions) && p.editions.length > 0, `no editions on ${k}`);
  assert.ok(p.en, `no English record on ${k}`);
  for (const lang of ['en', 'ar']) {
    const r = p[lang];
    if (!r) continue;
    const kk = `${k} (${lang})`;
    assert.ok(r.title?.trim(), `empty title on ${kk}`);
    assert.ok((r.body ?? '').trim() || (r.excerpt ?? '').trim(), `no body and no excerpt on ${kk}`);
    assert.ok(!/<(script|iframe)\b/i.test(r.body ?? ''), `raw script/iframe in ${kk}`);
    assert.ok(!/<!--/.test(r.body ?? ''), `block comment left in ${kk}`);
    for (const m of (r.body ?? '').matchAll(/data-youtube="([^"]*)"/g)) assert.match(m[1], /^[A-Za-z0-9_-]{11}$/, `bad video id in ${kk}`);
    if (r.old_url) assert.ok(r.old_url.startsWith('/'), `old_url not a path on ${kk}`);
  }
}
const withArabic = posts.filter((p) => p.ar).length;
assert.ok(withArabic >= MIGRATED, `${withArabic} posts have an Arabic version, expected at least ${MIGRATED}`);

// Home cards point at real posts
const home = JSON.parse(fs.readFileSync('src/data/content/home/news.en.json', 'utf8'));
for (const slug of home.posts) assert.ok(slugs.has(slug), `home/news post "${slug}" is not in ${DIR}`);
const homeNews = JSON.parse(fs.readFileSync('src/data/news.json', 'utf8'));
for (const p of homeNews.posts) assert.ok(slugs.has(p.slug), `news.json slug "${p.slug}" is not in ${DIR}`);

// Images: the keys must resolve to a file; missing files only warn
const missing = [...new Set(posts.map((p) => p.image).filter(Boolean))].filter((key) => !fs.readdirSync('src/assets/news').some((f) => f.replace(/\.[a-z0-9]+$/i, '') === key.replace('news/', '')));
if (missing.length) console.warn(`news: ${missing.length} featured image file(s) missing in src/assets/news`);

console.log(`news: ok (${posts.length} posts, ${withArabic} with Arabic)`);
