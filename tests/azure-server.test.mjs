// Tests for the Azure App Service server (tools/azure/): real HTTP requests to the handler + Node adapter, serving a small
// fixture site in place of dist/. No network: Turnstile and the email API are mocked.
// Run: npm run test:azure
import { build } from 'esbuild';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { createServer, get as httpGet } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { brotliDecompressSync } from 'node:zlib';

const out = mkdtempSync(join(tmpdir(), 'ch-azure-'));
const bundle = async (entry, name) => {
  await build({ entryPoints: [entry], bundle: true, format: 'esm', platform: 'node', outfile: join(out, name), logLevel: 'error' });
  return import(pathToFileURL(join(out, name)).href);
};
const { createHandler } = await bundle('tools/azure/handler.ts', 'handler.mjs');
const { toRequest, sendResponse, clientIp } = await bundle('tools/azure/node-adapter.ts', 'adapter.mjs');

// Fixture site: the shapes the Astro build emits (dist/<path>/index.html, one 404.html per edition prefix, _redirects, _headers).
const root = join(out, 'dist');
const files = {
  'index.html': '<html>global home</html>',
  'ae/index.html': '<html>ae home</html>',
  'contact-us/index.html': '<html>contact</html>',
  '404.html': '<html>global 404</html>',
  'ae/ar/404.html': '<html>ae ar 404</html>',
  '_astro/app.abc123.js': 'console.log(1)',
  'fonts/Gotham-Book.woff2': 'woff2',
  'favicon.svg': '<svg/>',
  '_redirects': ['/events /media-hub/?category=events#latest 301', '/old-page /contact-us/ 301',
    '/%D8%A7%D9%84%D8%B9%D9%86%D8%A7%D9%8A%D8%A9 /ar/ 301', '/sa/doctor/* /sa/find-a-doctor/ 301', '/sa/doctor/kept/ /never/ 301', '/first/ /one/ 301', '/first/ /two/ 301'].join('\n') + '\n',
  '_headers': '# comment\n/_astro/*\n  Cache-Control: public, max-age=31536000, immutable\n/fonts/*\n  Cache-Control: public, max-age=31536000, immutable\n',
};
for (const [name, body] of Object.entries(files)) {
  mkdirSync(dirname(join(root, name)), { recursive: true });
  writeFileSync(join(root, name), body);
}

let sent = [], turnstileIps = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  if (String(url).includes('turnstile')) { turnstileIps.push(init.body.get('remoteip')); return new Response(JSON.stringify({ success: true })); }
  if (String(url).includes('api.resend.com')) { sent.push(JSON.parse(init.body)); return new Response('{}'); }
  return realFetch(url, init);
};
const env = { TURNSTILE_SECRET_KEY: 's', EMAIL_PROVIDER: 'resend', EMAIL_API_KEY: 'k', MAIL_FROM: 'Site <no-reply@x.test>', FORM_TO_SEND_ENQUIRY: 'inbox@x.test' };
const handle = createHandler(root, env);
const server = createServer(async (req, res) => sendResponse(req, res, await handle(toRequest(req))));
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;
const raw = (path, headers) => new Promise((resolve, reject) => httpGet(origin + path, { headers }, (res) => {
  const chunks = []; res.on('data', (c) => chunks.push(c)); res.on('end', () => resolve({ headers: res.headers, body: Buffer.concat(chunks) }));
}).on('error', reject));
const get = (path, headers = {}, method = 'GET') => realFetch(origin + path, { method, headers, redirect: 'manual' });

const enquiry = () => {
  const fd = new FormData();
  for (const [k, v] of Object.entries({ name: 'A Patient', email: 'a@b.test', hospital: 'abu-dhabi', subject: 'Question', message: 'Hello',
    consent: 'on', 'cf-turnstile-response': 't', edition: 'ae-en' })) fd.append(k, v);
  return fd;
};

const cases = [
  ['page: /ae/ serves ae/index.html as HTML', () => get('/ae/'), async (r) => r.status === 200 && r.headers.get('content-type').startsWith('text/html') && (await r.text()) === '<html>ae home</html>'],
  // node:http directly: fetch would decode the body itself and hide what was on the wire.
  ['page: Brotli when accepted, Vary set, bytes decode to the file', () => raw('/contact-us/', { 'Accept-Encoding': 'gzip, br' }), (r) =>
    r.headers['content-encoding'] === 'br' && r.headers.vary === 'Accept-Encoding' && !r.headers['content-length'] &&
    brotliDecompressSync(r.body).toString() === '<html>contact</html>'],
  ['page: no compression for binary files', () => get('/fonts/Gotham-Book.woff2', { 'Accept-Encoding': 'br' }), (r) => !r.headers.has('content-encoding') && r.headers.get('content-length') === '5'],
  ['slash: /contact-us -> 301 /contact-us/, query kept', () => get('/contact-us?x=1'), (r) => r.status === 301 && r.headers.get('location') === '/contact-us/?x=1'],
  ['slash: files are not redirected', () => get('/favicon.svg'), (r) => r.status === 200 && r.headers.get('content-type') === 'image/svg+xml'],
  ['redirect: /events -> its target in one hop (before the slash rule)', () => get('/events'), (r) => r.status === 301 && r.headers.get('location') === '/media-hub/?category=events#latest'],
  ['redirect: the target\'s own query wins over the request\'s', () => get('/events?utm=a'), (r) => r.headers.get('location') === '/media-hub/?category=events#latest'],
  ['redirect: request query kept when the target has none', () => get('/old-page?utm=a'), (r) => r.status === 301 && r.headers.get('location') === '/contact-us/?utm=a'],
  ['redirect: percent-encoded Arabic source', () => get('/%D8%A7%D9%84%D8%B9%D9%86%D8%A7%D9%8A%D8%A9'), (r) => r.status === 301 && r.headers.get('location') === '/ar/'],
  ['redirect: splat source matches any rest, slash included', () => get('/sa/doctor/dr-a/'), (r) => r.status === 301 && r.headers.get('location') === '/sa/find-a-doctor/'],
  ['redirect: file order wins: an exact rule below a matching splat never applies', () => get('/sa/doctor/kept/'), (r) => r.headers.get('location') === '/sa/find-a-doctor/'],
  ['redirect: duplicate source -> the first line', () => get('/first/'), (r) => r.headers.get('location') === '/one/'],
  ['404: nearest edition 404 page, status 404', () => get('/ae/ar/missing/'), async (r) => r.status === 404 && (await r.text()) === '<html>ae ar 404</html>'],
  ['404: falls back to the Global 404 page', () => get('/ae/missing/'), async (r) => r.status === 404 && (await r.text()) === '<html>global 404</html>'],
  ['404: host config files are not served', async () => [await get('/_redirects'), await get('/_redirects/'), await get('/_headers/')],
    async ([a, b, c]) => a.status === 301 && b.status === 404 && c.status === 404 && !(await b.text()).includes('/events') && !(await c.text()).includes('Cache-Control')],
  ['404: no path traversal out of dist', () => get('/..%2f..%2f..%2fetc%2fpasswd'), async (r) => r.status === 404 && !(await r.text()).includes('root:')],
  ['headers: dist/_headers rule on /_astro/*', () => get('/_astro/app.abc123.js'), (r) => r.headers.get('cache-control') === 'public, max-age=31536000, immutable'],
  ['headers: pages revalidate', () => get('/ae/'), (r) => r.headers.get('cache-control') === 'public, max-age=0, must-revalidate' && r.headers.get('x-content-type-options') === 'nosniff'],
  ['cache: matching If-None-Match -> 304, no body', async () => { const etag = (await get('/ae/')).headers.get('etag'); return get('/ae/', { 'If-None-Match': etag }); },
    async (r) => r.status === 304 && (await r.text()) === ''],
  ['HEAD: headers only', () => get('/ae/', {}, 'HEAD'), async (r) => r.status === 200 && r.headers.get('content-length') === '20' && (await r.text()) === ''],
  ['method: POST to a page -> 405', () => realFetch(origin + '/ae/', { method: 'POST' }), (r) => r.status === 405],
  ['geo: Global page + detected country -> ch_geo cookie, not cached', () => get('/', { 'CF-IPCountry': 'AE' }), (r) =>
    /^ch_geo=AE;/.test(r.headers.get('set-cookie') ?? '') && r.headers.get('cache-control') === 'private, no-store'],
  ['geo: nothing on /ae/', () => get('/ae/', { 'CF-IPCountry': 'AE' }), (r) => !r.headers.has('set-cookie')],
  ['geo: nothing once an edition was chosen', () => get('/', { 'CF-IPCountry': 'AE', Cookie: 'ch_edition=global' }), (r) => !r.headers.has('set-cookie')],
  ['geo: no country header -> no cookie', () => get('/'), (r) => !r.headers.has('set-cookie')],
  ['form: multipart POST over HTTP -> shared handler sends one email', () => { sent = []; turnstileIps = [];
    return realFetch(origin + '/api/forms/send-enquiry', { method: 'POST', body: enquiry(), headers: { Accept: 'application/json', Origin: origin,
      'X-Forwarded-For': '203.0.113.7:51234, 10.0.0.1', 'CF-Connecting-IP': '6.6.6.6' } }); },
    async (r) => r.status === 200 && (await r.json()).ok === true && sent.length === 1 && sent[0].to[0] === 'inbox@x.test' && turnstileIps[0] === '203.0.113.7'],
  ['form: foreign Origin refused', () => realFetch(origin + '/api/forms/send-enquiry', { method: 'POST', body: enquiry(), headers: { Accept: 'application/json', Origin: 'https://evil.test' } }),
    async (r) => r.status === 403 && (await r.json()).error === 'origin'],
  ['form: GET -> 405', () => get('/api/forms/send-enquiry'), (r) => r.status === 405 && r.headers.get('allow') === 'POST'],
  ['form: unknown form -> 404', () => realFetch(origin + '/api/forms/nope', { method: 'POST', body: enquiry(), headers: { Accept: 'application/json', Origin: origin } }),
    async (r) => r.status === 404 && (await r.json()).error === 'unknown_form'],
  ['clientIp: IPv4 with port, IPv6 in brackets, plain', () => [clientIp('203.0.113.7:51234'), clientIp('[2001:db8::1]:443'), clientIp('2001:db8::1'), clientIp(undefined)],
    (v) => v.join('|') === '203.0.113.7|2001:db8::1|2001:db8::1|'],
];

let passed = 0;
for (const [name, run, check] of cases) {
  let ok = false;
  try { ok = await check(await run()); } catch (e) { console.log(`  error: ${e.message}`); }
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (ok) passed++;
}
server.close();
console.log(`${passed}/${cases.length} passed`);
if (passed !== cases.length) process.exit(1);
