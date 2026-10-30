// Tests for the dashboard's admin service, tools/admin/server.ts, over real HTTP against a temporary copy of two posts
// (the repo's content is never touched). Run: npm run test:admin
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const tmp = mkdtempSync(join(tmpdir(), 'ch-admin-'));
const out = join(tmp, 'admin-server.mjs');
await build({ entryPoints: ['tools/admin/server.ts'], bundle: true, format: 'esm', platform: 'node', outfile: out, external: ['sharp'], logLevel: 'warning' });
import sharp from 'sharp';
const { start, hashPassword } = await import(pathToFileURL(out).href);

// Content root = a temp folder with two real posts copied in.
const root = join(tmp, 'site');
mkdirSync(join(root, 'src/content/news'), { recursive: true });
const SLUGS = ['12-exercises-and-stretches-for-shoulder-pain', 'cambridge-hospital-at-the-global-health-exhibition-in-riyadh'];
for (const s of SLUGS) cpSync(`src/content/news/${s}.json`, join(root, `src/content/news/${s}.json`));
mkdirSync(join(root, 'public/fonts'), { recursive: true });
cpSync('public/fonts/Gotham-Book.woff2', join(root, 'public/fonts/Gotham-Book.woff2'));
Object.assign(process.env, {
  CONTENT_ROOT: root, LOCAL_DEV: 'true', ADMIN_EMAIL: 'Admin@Example.test', ADMIN_PASSWORD_HASH: hashPassword('correct horse battery'),
  ADMIN_SESSION_SECRET: 'test-secret', PUBLISH_COMMAND: 'echo building && echo done', SCHEDULE_CHECK_SECONDS: '1',
});

const server = start(0, '127.0.0.1');
await new Promise((r) => server.once('listening', r));
const base = `http://127.0.0.1:${server.address().port}`;
let cookie = '';
const call = async (method, path, body, headers = {}) => {
  const res = await fetch(`${base}${path}`, {
    method, headers: { 'Content-Type': 'application/json', Cookie: cookie, ...headers }, body: body === undefined ? undefined : JSON.stringify(body),
  });
  const set = res.headers.get('set-cookie');
  if (set) cookie = set.split(';')[0];
  return { status: res.status, body: await res.json().catch(() => null) };
};
const write = (method, path, body) => call(method, path, body, { 'X-Requested-With': 'admin' });
const ok = (label) => console.log(`  ok   ${label}`);

// --- auth ---
assert.equal((await call('GET', '/api/admin/posts')).status, 401); ok('no session -> 401');
assert.equal((await call('POST', '/api/admin/login', { email: 'admin@example.test', password: 'wrong' })).status, 401);
for (let i = 0; i < 4; i++) await call('POST', '/api/admin/login', { email: 'admin@example.test', password: 'wrong' });
assert.equal((await call('POST', '/api/admin/login', { email: 'admin@example.test', password: 'correct horse battery' })).status, 429);
ok('5 wrong passwords -> 429 even with the right one');
// a fresh client (other IP) via X-Forwarded-For is not rate limited
let r = await call('POST', '/api/admin/login', { email: 'admin@example.test', password: 'correct horse battery' }, { 'X-Forwarded-For': '203.0.113.9' });
assert.equal(r.status, 200); assert.ok(cookie.startsWith('ch_admin=')); ok('login sets the session cookie (email case-insensitive)');
assert.equal((await call('GET', '/api/admin/me')).body.email, 'admin@example.test');
assert.equal((await call('PUT', '/api/admin/posts/x', {})).status, 403); ok('write without X-Requested-With -> 403');

// --- posts ---
r = await call('GET', '/api/admin/posts');
assert.equal(r.body.items.length, 2); assert.ok(r.body.items[0].title && !('body' in r.body.items[0])); ok('list = summaries, no bodies');
const slug = SLUGS[0];
r = await call('GET', `/api/admin/posts/${slug}`);
const migrated = r.body.item; assert.equal(migrated.slug, slug); assert.ok(migrated.en.body.length > 100); ok('get one post');
// Spec: a published post with a featured image needs alt text. The migrated post has none, so saving it as published is refused
// until the alt text is added (drafts are fine).
r = await write('PUT', `/api/admin/posts/${slug}`, migrated);
assert.equal(r.status, 400); assert.equal(r.body.details[0].field, 'en.image_alt'); ok('publishing without alt text -> 400');
assert.equal((await write('PUT', `/api/admin/posts/${slug}`, { ...migrated, status: 'draft' })).status, 200);
const post = { ...migrated, en: { ...migrated.en, image_alt: 'Physiotherapist guiding shoulder exercises' } };
assert.equal((await write('PUT', `/api/admin/posts/${slug}`, post)).status, 200); ok('with alt text the post saves as published');

r = await write('PUT', `/api/admin/posts/${slug}`, { ...post, date: '2026-13-45', typo: 1 });
assert.equal(r.status, 400); assert.deepEqual(r.body.details.map((d) => d.field).sort(), ['(root)', 'date']); ok('invalid post -> 400 naming the fields');
assert.deepEqual(readFileSync(join(root, `src/content/news/${slug}.json`), 'utf8'), JSON.stringify(post, null, 2) + '\n'); ok('a rejected save changes nothing');

r = await write('PUT', `/api/admin/posts/${slug}`, { ...post, en: { ...post.en, focus_keyword: 'shoulder pain' }, updated: '2026-10-30' });
assert.equal(r.status, 200);
assert.equal(JSON.parse(readFileSync(join(root, `src/content/news/${slug}.json`), 'utf8')).en.focus_keyword, 'shoulder pain');
assert.deepEqual((await call('GET', '/api/admin/posts')).body.items.find((i) => i.slug === slug).keywords, ['shoulder pain']);
r = await call('GET', `/api/admin/posts/${slug}/versions`);
assert.equal(r.body.versions.length, 3); const v1 = r.body.versions[0].id; ok('save writes the file and keeps the previous version');
assert.equal((await call('GET', '/api/admin/me')).body.categories.length, 4); ok('/me lists the categories and site URL');
r = await fetch(`${base}/fonts/Gotham-Book.woff2`); assert.equal(r.status, 200); assert.equal(r.headers.get('content-type'), 'font/woff2');
r = await fetch(`${base}/fonts/..%2F..%2Fpackage.json`); assert.equal(r.status, 404); ok('fonts served from the checkout, no path tricks');

r = await write('POST', `/api/admin/posts/${slug}/restore`, { version: v1 });
assert.equal(r.status, 200);
assert.equal(JSON.parse(readFileSync(join(root, `src/content/news/${slug}.json`), 'utf8')).en.focus_keyword, undefined); ok('restore brings the earlier version back');

r = await write('POST', '/api/admin/posts', { ...post, slug: 'new-post-2026', previous_slugs: [] });
assert.equal(r.status, 201); assert.equal((await write('POST', '/api/admin/posts', { ...post, slug: 'new-post-2026' })).status, 409); ok('create; a second create of the same slug -> 409');

r = await write('POST', '/api/admin/posts/new-post-2026/rename', { slug: 'renamed-post-2026' });
assert.equal(r.status, 200);
const renamed = JSON.parse(readFileSync(join(root, 'src/content/news/renamed-post-2026.json'), 'utf8'));
assert.deepEqual(renamed.previous_slugs, ['new-post-2026']); assert.ok(!existsSync(join(root, 'src/content/news/new-post-2026.json'))); ok('rename moves the file and records the old slug');

assert.equal((await write('DELETE', '/api/admin/posts/renamed-post-2026')).status, 400);
assert.equal((await write('DELETE', '/api/admin/posts/renamed-post-2026?confirm=renamed-post-2026')).status, 200);
assert.ok(readdirSync(join(root, '.admin/versions/posts/renamed-post-2026')).some((f) => f.includes('deleted'))); ok('delete needs ?confirm=<slug> and keeps a copy under versions');
assert.equal((await write('DELETE', '/api/admin/posts/..%2F..%2Fetc?confirm=x')).status, 400); ok('path characters in a slug -> 400');

// --- authors ---
r = await write('POST', '/api/admin/authors', { slug: 'dr-test', name: { en: 'Dr Test' }, role: { en: 'Neurologist' } });
assert.equal(r.status, 201);
assert.equal((await call('GET', '/api/admin/authors')).body.items[0].name.en, 'Dr Test'); ok('author create + list');
await write('PUT', `/api/admin/posts/${slug}`, { ...post, reviewer: 'dr-test' });
r = await write('DELETE', '/api/admin/authors/dr-test?confirm=dr-test');
assert.equal(r.status, 409); assert.deepEqual(r.body.posts, [slug]); ok('an author in use cannot be deleted');
await write('PUT', `/api/admin/posts/${slug}`, post);
assert.equal((await write('DELETE', '/api/admin/authors/dr-test?confirm=dr-test')).status, 200); ok('unused author deleted');

// --- images ---
// A noisy 2400 x 1600 PNG (several MB) must come back as a WebP under 200 KB, saved as src/assets/news/<slug>.webp.
mkdirSync(join(root, 'src/assets/news'), { recursive: true });
writeFileSync(join(root, `src/assets/news/${slug}.jpg`), 'old file'); // an imported featured image with another extension
const noise = Buffer.alloc(2400 * 1600 * 3); for (let i = 0; i < noise.length; i++) noise[i] = (i * 2654435761) >>> 24;
const png = await sharp(noise, { raw: { width: 2400, height: 1600, channels: 3 } }).png().toBuffer();
const upload = (path, body, type = 'image/png') => fetch(`${base}${path}`, { method: 'POST', headers: { Cookie: cookie, 'Content-Type': type, 'X-Requested-With': 'admin' }, body });
r = await upload(`/api/admin/upload/posts/${slug}`, png); let u = await r.json();
assert.equal(r.status, 200); assert.equal(u.key, `news/${slug}`); assert.ok(u.bytes <= 200 * 1024, `webp is ${u.bytes} bytes`); assert.ok(u.width <= 1600 && u.width >= 480, `width ${u.width}`);
assert.ok(existsSync(join(root, `src/assets/news/${slug}.webp`))); assert.ok(!existsSync(join(root, `src/assets/news/${slug}.jpg`)));
assert.ok(readdirSync(join(root, '.admin/versions/images/news')).some((f) => f.endsWith(`${slug}.jpg`))); ok(`upload -> WebP ${Math.round(u.bytes / 1024)} KB at ${u.width} px (noise image), the old .jpg moved to versions`);
// A real-looking photo (smooth gradient) stays at the full 1600 px.
const grad = Buffer.alloc(2400 * 1600 * 3); for (let y = 0; y < 1600; y++) for (let x = 0; x < 2400; x++) { const i = (y * 2400 + x) * 3; grad[i] = x / 10; grad[i + 1] = y / 7; grad[i + 2] = 120; }
r = await upload(`/api/admin/upload/posts/${slug}`, await sharp(grad, { raw: { width: 2400, height: 1600, channels: 3 } }).jpeg().toBuffer(), 'image/jpeg'); u = await r.json();
assert.equal(u.width, 1600); assert.ok(u.bytes <= 200 * 1024); ok(`photo-like upload keeps 1600 px (${Math.round(u.bytes / 1024)} KB)`);
r = await fetch(`${base}/api/admin/image/news/${slug}`, { headers: { Cookie: cookie } });
assert.equal(r.status, 200); assert.equal(r.headers.get('content-type'), 'image/webp'); ok('image preview served by key');
assert.equal((await upload(`/api/admin/upload/posts/${slug}`, Buffer.from('not an image'))).status, 400);
assert.equal((await upload(`/api/admin/upload/posts/no-such-post`, png)).status, 404); ok('bad file -> 400, unknown post -> 404');

// --- settings: robots.txt AI crawlers (src/data/robots.json) ---
mkdirSync(join(root, 'src/data'), { recursive: true });
writeFileSync(join(root, 'src/data/robots.json'), JSON.stringify({ $comment: 'kept', aiCrawlers: { GPTBot: true } }));
assert.deepEqual((await call('GET', '/api/admin/settings/robots')).body.aiCrawlers, { GPTBot: true });
assert.equal((await write('PUT', '/api/admin/settings/robots', { aiCrawlers: { GPTBot: 'yes' } })).status, 400);
assert.equal((await write('PUT', '/api/admin/settings/robots', { aiCrawlers: { 'bad name!': true } })).status, 400);
assert.equal((await write('PUT', '/api/admin/settings/robots', { aiCrawlers: { GPTBot: false, PerplexityBot: true } })).status, 200);
const robotsFile = JSON.parse(readFileSync(join(root, 'src/data/robots.json'), 'utf8'));
assert.deepEqual(robotsFile, { $comment: 'kept', aiCrawlers: { GPTBot: false, PerplexityBot: true } });
assert.ok(readdirSync(join(root, '.admin/versions/settings')).some((f) => f.startsWith('robots-')));
ok('robots settings: read, validated, written with the comment kept and a version copy');

// --- publish ---
r = await write('POST', '/api/admin/publish');
assert.equal(r.status, 202);
for (let i = 0; i < 50 && (await call('GET', '/api/admin/publish')).body.publish.state === 'running'; i++) await new Promise((t) => setTimeout(t, 100));
r = await call('GET', '/api/admin/publish');
assert.equal(r.body.publish.state, 'ok'); assert.deepEqual(r.body.publish.output, ['building', 'done']); ok('publish runs the build command and reports its output');

// --- scheduled posts: one due in the past goes live by itself (status flipped, version kept, build started); one in the future waits ---
const sched = (slug, at) => ({ slug, date: '2026-10-30', category: 'health-articles', type: 'blog', status: 'scheduled', publish_at: at, editions: ['global'], image: '', en: { title: `Scheduled ${slug}`, body: '<p>Soon.</p>' } });
assert.equal((await write('POST', '/api/admin/posts', sched('due-post', new Date(Date.now() - 60_000).toISOString()))).status, 201);
assert.equal((await write('POST', '/api/admin/posts', sched('later-post', '2099-01-01T09:00:00.000Z'))).status, 201);
for (let i = 0; i < 40 && (await call('GET', `/api/admin/posts/due-post`)).body.item.status !== 'published'; i++) await new Promise((t) => setTimeout(t, 100));
r = await call('GET', '/api/admin/posts/due-post');
assert.equal(r.body.item.status, 'published'); assert.equal(r.body.item.publish_at, undefined);
assert.ok(readdirSync(join(root, '.admin/versions/posts/due-post')).some((f) => f.endsWith('-scheduled.json')));
for (let i = 0; i < 50 && (await call('GET', '/api/admin/publish')).body.publish.state === 'running'; i++) await new Promise((t) => setTimeout(t, 100));
r = await call('GET', '/api/admin/publish');
assert.equal(r.body.publish.state, 'ok'); assert.ok(r.body.schedule.lastRun, 'the scheduler started a build');
assert.deepEqual(r.body.schedule.next.map((d) => d.slug), ['later-post']);
assert.equal((await call('GET', `/api/admin/posts/later-post`)).body.item.status, 'scheduled');
ok('a scheduled post goes live on time by itself; a future one waits and is listed as next');

// --- logout ---
await write('POST', '/api/admin/logout');
assert.equal((await call('GET', '/api/admin/me')).status, 401); ok('logout clears the session');

server.close();
console.log('admin server: all passed');
