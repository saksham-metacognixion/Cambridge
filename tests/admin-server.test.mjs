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
// bug 258: the logo and favicon ship with the UI bundle (tools/admin/bundle.mjs copies them next to app.js), so they load even
// though this content root has no src/assets/header/logo.svg or public/favicon.svg
mkdirSync(join(tmp, 'ui'), { recursive: true });
for (const f of ['logo.svg', 'favicon.svg']) cpSync(`tools/admin/ui/${f}`, join(tmp, 'ui', f));
for (const f of ['logo.svg', 'favicon.svg']) {
  r = await fetch(`${base}/admin/${f}`); assert.equal(r.status, 200, f); assert.equal(r.headers.get('content-type'), 'image/svg+xml');
  assert.ok((await r.text()).startsWith('<svg'), f);
}
assert.ok(readFileSync('tools/admin/bundle.mjs', 'utf8').includes("'logo.svg', 'favicon.svg'")); ok('logo.svg + favicon.svg served from the UI bundle, not the content checkout');
// bug 257: an Arabic version without a title is refused by the server (the dashboard leaves an empty one out and asks for the title)
r = await write('PUT', `/api/admin/posts/${slug}`, { ...post, ar: { hero_button: false, excerpt: 'ملخص' } });
assert.equal(r.status, 400); assert.deepEqual(r.body.details.map((d) => d.field), ['ar.title']); ok('Arabic version without a title -> 400 on ar.title');

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
// bug 259: the reviewer is a second person, also when the dashboard is bypassed (PUT and POST)
r = await write('PUT', `/api/admin/posts/${slug}`, { ...post, author: 'dr-test', reviewer: 'dr-test' });
assert.equal(r.status, 400); assert.deepEqual(r.body.details, [{ field: 'reviewer', message: 'The reviewer must be a different person from the author.' }]);
assert.equal(JSON.parse(readFileSync(join(root, `src/content/news/${slug}.json`), 'utf8')).author, undefined);
r = await write('POST', '/api/admin/posts', { ...post, slug: 'same-person-2026', previous_slugs: [], author: 'dr-test', reviewer: 'dr-test' });
assert.equal(r.status, 400); assert.ok(!existsSync(join(root, 'src/content/news/same-person-2026.json')));
assert.equal((await write('PUT', `/api/admin/posts/${slug}`, { ...post, author: 'dr-other', reviewer: 'dr-test' })).status, 200);
assert.equal((await write('PUT', `/api/admin/posts/${slug}`, { ...post, author: 'dr-test' })).status, 200);
ok('author = reviewer -> 400 "different person" (PUT and POST); two people or no reviewer save');
await write('PUT', `/api/admin/posts/${slug}`, post);
assert.equal((await write('DELETE', '/api/admin/authors/dr-test?confirm=dr-test')).status, 200); ok('unused author deleted');

// bug 259: the GEO check "Reviewed by a clinician" passes only for a reviewer who is not the author
const checksOut = join(tmp, 'checks.mjs');
await build({ entryPoints: ['tools/admin/ui/checks.ts'], bundle: true, format: 'esm', platform: 'node', outfile: checksOut, logLevel: 'warning' });
const { runChecks } = await import(pathToFileURL(checksOut).href);
const reviewed = (o) => runChecks({ title: 'T' }, 't', { otherKeywords: [], ...o }).checks.find((c) => c.label === 'Reviewed by a clinician');
assert.equal(reviewed({ author: 'a', reviewer: 'a' }).ok, false); assert.match(reviewed({ author: 'a', reviewer: 'a' }).tip, /different person/);
assert.equal(reviewed({ author: 'a', reviewer: 'b' }).ok, true); assert.equal(reviewed({ reviewer: 'b' }).ok, true); assert.equal(reviewed({ author: 'a' }).ok, false);
ok('GEO "Reviewed by a clinician": red for author = reviewer or none, green for a second person');

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

// --- settings: Google Analytics measurement id (src/data/analytics.json) ---
writeFileSync(join(root, 'src/data/analytics.json'), JSON.stringify({ $comment: 'kept', measurementId: '', load: 'deferred' }));
assert.equal((await call('GET', '/api/admin/settings/analytics')).body.measurementId, '');
assert.equal((await write('PUT', '/api/admin/settings/analytics', { measurementId: 'UA-12345-1' })).status, 400);
assert.equal((await write('PUT', '/api/admin/settings/analytics', { measurementId: 'G-ABC' })).status, 400);
assert.equal((await write('PUT', '/api/admin/settings/analytics', { measurementId: 12 })).status, 400);
r = await write('PUT', '/api/admin/settings/analytics', { measurementId: ' g-gynztc8rsl ' });
assert.equal(r.status, 200); assert.equal(r.body.measurementId, 'G-GYNZTC8RSL');
assert.deepEqual(JSON.parse(readFileSync(join(root, 'src/data/analytics.json'), 'utf8')), { $comment: 'kept', measurementId: 'G-GYNZTC8RSL', load: 'deferred' });
assert.equal((await write('PUT', '/api/admin/settings/analytics', { measurementId: '' })).status, 200);
assert.equal((await call('GET', '/api/admin/settings/analytics')).body.measurementId, '');
assert.ok(readdirSync(join(root, '.admin/versions/settings')).some((f) => f.startsWith('analytics-')));
ok('analytics settings: id validated and upper-cased, empty allowed, other options kept, version copy');

// --- publish ---
r = await write('POST', '/api/admin/publish');
assert.equal(r.status, 202);
for (let i = 0; i < 50 && (await call('GET', '/api/admin/publish')).body.publish.state === 'running'; i++) await new Promise((t) => setTimeout(t, 100));
r = await call('GET', '/api/admin/publish');
assert.equal(r.body.publish.state, 'ok'); assert.deepEqual(r.body.publish.output, ['building', 'done']); ok('publish runs the build command and reports its output');
assert.equal(r.body.minutes, 25); ok('the answer carries how long a build takes (PUBLISH_MINUTES, default 25)');
// a second request while a build runs is refused with 409 publish_running and the build keeps going (bug 255)
process.env.PUBLISH_COMMAND = 'sleep 1 && echo slow';
assert.equal((await write('POST', '/api/admin/publish')).status, 202);
r = await write('POST', '/api/admin/publish');
assert.equal(r.status, 409); assert.equal(r.body.error, 'publish_running');
assert.equal((await call('GET', '/api/admin/publish')).body.publish.state, 'running');
for (let i = 0; i < 50 && (await call('GET', '/api/admin/publish')).body.publish.state === 'running'; i++) await new Promise((t) => setTimeout(t, 100));
r = await call('GET', '/api/admin/publish'); assert.equal(r.body.publish.state, 'ok'); assert.deepEqual(r.body.publish.output, ['slow']);
process.env.PUBLISH_COMMAND = 'echo building && echo done';
ok('a second publish while one runs -> 409 publish_running; the running build finishes normally');

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
// rename moves the version history with the post
assert.equal((await write('POST', '/api/admin/posts/later-post/rename', { slug: 'later-post-2' })).status, 200);
assert.ok((await call('GET', '/api/admin/posts/later-post-2/versions')).body.versions.length >= 1); ok('rename keeps the version history under the new address');

// --- settings: manual 301 redirects (src/data/redirects.json, Settings > Redirects) ---
writeFileSync(join(root, 'src/data/redirects.json'), JSON.stringify({ $comment: 'kept', redirects: [] }));
process.env.ADMIN_SITE_URL = 'https://cambridgehospital.com';
r = await call('GET', '/api/admin/settings/redirects');
assert.deepEqual(r.body.redirects, []);
// later-post-2 was renamed from later-post above: the build's automatic redirect is listed read-only
assert.deepEqual(r.body.automatic.map((a) => [a.from, a.to, a.post]), [['/media-hub/later-post/', '/media-hub/later-post-2/', 'later-post-2']]);
ok('redirects: empty list + the automatic ones of renamed posts');
const putRedirects = (redirects) => write('PUT', '/api/admin/settings/redirects', { redirects });
const fieldsOf = (res) => res.body.details.map((d) => d.field);
r = await putRedirects([{ from: 'old-page', to: '/x/' }, { from: '/', to: '/x/' }, { from: '/a?x=1', to: '/x/' }, { from: '/a/*', to: '/x/' }, { from: '/b', to: 'ftp://x' }, { from: 'https://other.site/p', to: '/x/' }]);
assert.equal(r.status, 400);
assert.deepEqual(fieldsOf(r), ['redirects.0.from', 'redirects.1.from', 'redirects.2.from', 'redirects.3.from', 'redirects.4.to', 'redirects.5.from']);
ok('redirects: a source without "/", the home page, a query, a splat, a bad target, another site -> 400 naming each row');
r = await putRedirects([{ from: '/a', to: '/b/' }, { from: '/b', to: '/c/' }, { from: '/a/', to: '/d/' }, { from: '/e', to: '/e/' }, { from: `/ae/media-hub/${slug}`, to: '/x/' }, { from: `/media-hub/later-post-2`, to: '/x/' }]);
assert.equal(r.status, 400);
assert.deepEqual(fieldsOf(r), ['redirects.0.to', 'redirects.2.from', 'redirects.3.to', 'redirects.4.from', 'redirects.5.from']);
assert.match(r.body.details[0].message, /itself redirected \(rule 2\)/); assert.match(r.body.details[1].message, /already listed/);
assert.match(r.body.details[2].message, /same page/); assert.match(r.body.details[3].message, /published post/); assert.match(r.body.details[4].message, /scheduled post/);
ok('redirects: a chain, a duplicate (with / without slash), a loop and the address of a published / scheduled post -> 400');
assert.ok(!existsSync(join(root, '.admin/versions/settings')) || !readdirSync(join(root, '.admin/versions/settings')).some((f) => f.startsWith('redirects-')));
r = await putRedirects([
  { from: 'https://www.cambridgehospital.com/Old-Page/', to: '/contact-us', note: ' moved ' },
  { from: '/ar/الصحة/', to: '/ar/media-hub/?category=events#latest' },
  { from: '/leaflet', to: 'https://example.org/leaflet.pdf' },
  { from: '/brochure.pdf', to: '/files/brochure-2026.pdf' },
  { from: '/media-hub/renamed-post-2026', to: `/media-hub/${slug}/` }, // a deleted post's address may be redirected
  { from: '', to: '' },
]);
assert.equal(r.status, 200, JSON.stringify(r.body));
const saved = r.body.redirects;
assert.deepEqual(saved.map((x) => [x.from, x.to]), [
  ['/Old-Page', '/contact-us/'], ['/ar/%D8%A7%D9%84%D8%B5%D8%AD%D8%A9', '/ar/media-hub/?category=events#latest'], ['/leaflet', 'https://example.org/leaflet.pdf'],
  ['/brochure.pdf', '/files/brochure-2026.pdf'], ['/media-hub/renamed-post-2026', `/media-hub/${slug}/`],
]);
assert.equal(saved[0].note, 'moved'); assert.match(saved[0].added, /^\d{4}-\d{2}-\d{2}$/);
const redirectsFile = JSON.parse(readFileSync(join(root, 'src/data/redirects.json'), 'utf8'));
assert.equal(redirectsFile.$comment, 'kept'); assert.deepEqual(redirectsFile.redirects, saved);
assert.ok(readdirSync(join(root, '.admin/versions/settings')).some((f) => f.startsWith('redirects-')));
ok('redirects: normalised (site URL -> path, no trailing slash on the source, slash on a page target, Arabic encoded), empty row dropped, note trimmed, added date, version copy');
const added = saved[0].added;
r = await putRedirects([{ ...saved[0], added: '2000-01-01' }, saved[2]]);
assert.equal(r.status, 200); assert.equal(r.body.redirects[0].added, added); assert.equal(r.body.redirects.length, 2);
ok('redirects: a kept rule keeps its original added date; removed rules are gone');
// The build's own schema accepts what the service wrote (src/lib/redirects.ts stops the build otherwise).
const schemaOut = join(tmp, 'redirects-schema.mjs');
await build({ entryPoints: ['src/lib/redirects-schema.ts'], bundle: true, format: 'esm', platform: 'node', outfile: schemaOut, logLevel: 'warning' });
const { redirectsFileSchema, normalizeRedirect } = await import(pathToFileURL(schemaOut).href);
assert.ok(redirectsFileSchema.safeParse(JSON.parse(readFileSync(join(root, 'src/data/redirects.json'), 'utf8'))).success);
assert.ok(redirectsFileSchema.safeParse(JSON.parse(readFileSync('src/data/redirects.json', 'utf8'))).success, 'the repo file is valid');
assert.deepEqual(normalizeRedirect({ from: ' /a/b/ ', to: '/c' }, 'x.test'), { from: '/a/b', to: '/c/', note: '' });
assert.deepEqual(normalizeRedirect({ from: 'https://x.test/a', to: 'https://y.test/b' }, 'x.test'), { from: '/a', to: 'https://y.test/b', note: '' });
ok('redirects: the file the service wrote and the repo file pass the build schema');

// --- preview: /admin/preview/* -> an `astro dev` started on demand (here: a stand-in that answers after a short delay) ---
const fake = join(tmp, 'fake-preview.mjs');
writeFileSync(fake, `
import { createServer } from 'node:http';
import { writeFileSync } from 'node:fs';
writeFileSync(process.env.FAKE_PID_FILE, String(process.pid));
const srv = createServer((req, res) => {
  const [p, q] = req.url.split('?');
  const html = (b) => { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(b); };
  if (p === '/admin/preview/') return html('<html><body>home</body></html>');
  if (p === '/admin/preview/ae/media-hub/x/') return html('<html><head><link rel="stylesheet" href="/src/styles/g.css"></head><body><script type="module" src="/@vite/client"></script><img src="/@fs/abs/logo.svg?x=1"><style>.a{mask:url("/@fs/abs/m.svg")}</style><a href="/ae/care/">site link</a><p>base=' + process.env.ASTRO_BASE + ' preview=' + process.env.NEWS_PREVIEW + ' port=' + process.env.PREVIEW_PORT + ' q=' + (q ?? '') + '</p></body></html>');
  if (p === '/src/scripts/a.ts') { res.writeHead(200, { 'Content-Type': 'text/javascript' }); return res.end('import "/node_modules/.vite/deps/p.js?v=1";import x from "/@id/__x00__y";'); }
  if (p === '/admin/preview/_image/') { res.writeHead(200, { 'Content-Type': 'image/webp' }); return res.end(Buffer.from([1, 2, 3])); }
  if (p === '/admin/preview/media-hub/x') { res.writeHead(301, { Location: '/admin/preview/media-hub/x/' }); return res.end(); }
  res.writeHead(404, { 'Content-Type': 'text/html' }); res.end('<html><body>nope ' + p + '</body></html>');
});
setTimeout(() => srv.listen(Number(process.env.PREVIEW_PORT), '127.0.0.1'), 1200);
`);
const pidFile = join(tmp, 'fake.pid');
Object.assign(process.env, { PREVIEW_COMMAND: `node ${fake}`, PREVIEW_PORT: '4397', FAKE_PID_FILE: pidFile });
const page = (path, headers = {}) => fetch(`${base}${path}`, { headers: { Cookie: cookie, ...headers }, redirect: 'manual' });
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } };
const untilGone = async (pid) => { for (let i = 0; i < 50 && alive(pid); i++) await new Promise((t) => setTimeout(t, 100)); return !alive(pid); };
r = await fetch(`${base}/admin/preview/ae/media-hub/x/`, { redirect: 'manual' });
assert.equal(r.status, 302); assert.equal(r.headers.get('location'), '/admin'); assert.ok(!existsSync(pidFile), 'nothing started');
ok('preview without a session -> sign-in page, no dev server started');
r = await page('/admin/preview/ae/media-hub/x/?a=1');
let html = await r.text();
assert.equal(r.status, 200, html);
assert.equal(r.headers.get('cache-control'), 'no-store'); assert.equal(r.headers.get('x-robots-tag'), 'noindex, nofollow');
assert.ok(html.includes('base=/admin/preview preview=true port=4397 q=a=1'), html);
assert.ok(html.includes('href="/admin/preview/src/styles/g.css"') && html.includes('src="/admin/preview/@vite/client"') && html.includes('src="/admin/preview/@fs/abs/logo.svg?x=1"') && html.includes('url("/admin/preview/@fs/abs/m.svg")'), html);
assert.ok(html.includes('href="/ae/care/"'), 'site links untouched'); assert.ok(html.includes('Preview · not published</div></body>'), 'badge');
ok('preview: the dev server is started, waited for and proxied; Vite URLs get the /admin/preview prefix, site links stay');
const fakePid = Number(readFileSync(pidFile, 'utf8'));
r = await page('/admin/preview/src/scripts/a.ts'); assert.equal(r.status, 200);
assert.equal(await r.text(), 'import "/admin/preview/node_modules/.vite/deps/p.js?v=1";import x from "/admin/preview/@id/__x00__y";');
r = await page('/admin/preview/_image/?href=x'); assert.equal(r.status, 200); assert.equal(r.headers.get('content-type'), 'image/webp'); assert.equal((await r.arrayBuffer()).byteLength, 3);
r = await page('/admin/preview/media-hub/x'); assert.equal(r.status, 301); assert.equal(r.headers.get('location'), '/admin/preview/media-hub/x/');
r = await page('/admin/preview/media-hub/nope/'); assert.equal(r.status, 404); assert.ok(!(await r.text()).includes('Preview · not published'));
ok('preview: Vite paths are fetched at the dev server root, JS imports rewritten, images and redirects pass through, 404 kept');
// Adding a post stops the dev server (Astro reads the set of files at start); the next request starts it again.
assert.equal((await write('POST', '/api/admin/posts', sched('preview-new-post', '2099-01-01T09:00:00.000Z'))).status, 201);
assert.ok(await untilGone(fakePid), 'the dev server was stopped after a new post');
r = await page('/admin/preview/ae/media-hub/x/'); assert.equal(r.status, 200);
const fakePid2 = Number(readFileSync(pidFile, 'utf8')); assert.notEqual(fakePid2, fakePid);
await write('PUT', '/api/admin/posts/preview-new-post', { ...sched('preview-new-post', '2099-01-01T09:00:00.000Z'), en: { title: 'Changed', body: '<p>x</p>' } });
await new Promise((t) => setTimeout(t, 300)); assert.ok(alive(fakePid2), 'a save of an existing post keeps the dev server running');
ok('preview: restarts after a new post, keeps running across saves');
// A dev server that dies shows the "could not start" page with its output; one that is slow shows the "starting" page.
process.env.PREVIEW_COMMAND = 'echo boom && exit 1';
await write('DELETE', '/api/admin/posts/preview-new-post?confirm=preview-new-post'); assert.ok(await untilGone(fakePid2));
r = await page('/admin/preview/ae/media-hub/x/'); html = await r.text();
assert.equal(r.status, 503); assert.ok(html.includes('could not start') && html.includes('boom'), html);
ok('preview: a dev server that exits -> 503 page with its last output');
process.env.PREVIEW_COMMAND = `node ${fake}`;

// --- logout ---
await write('POST', '/api/admin/logout');
assert.equal((await call('GET', '/api/admin/me')).status, 401); ok('logout clears the session');

// Closing the service stops the preview dev server it started.
r = await call('POST', '/api/admin/login', { email: 'admin@example.test', password: 'correct horse battery' }, { 'X-Forwarded-For': '203.0.113.10' });
r = await page('/admin/preview/ae/media-hub/x/'); assert.equal(r.status, 200);
const fakePid3 = Number(readFileSync(pidFile, 'utf8'));
server.close();
assert.ok(await untilGone(fakePid3), 'the preview dev server stopped with the service'); ok('closing the service stops the preview dev server');
console.log('admin server: all passed');
