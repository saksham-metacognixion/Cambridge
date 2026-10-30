// Tests for the self-hosted (Docker) form server, tools/docker/forms-server.ts, over real HTTP (no network: Turnstile and the
// email API are mocked). The handler itself is covered by tests/functions.test.mjs; this checks the Node wrapper around it.
// Run: npm run test:forms-server
import { build } from 'esbuild';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const out = join(mkdtempSync(join(tmpdir(), 'ch-fs-')), 'forms-server.mjs');
await build({ entryPoints: ['tools/docker/forms-server.ts'], bundle: true, format: 'esm', platform: 'node', outfile: out,
  logOverride: { 'unsupported-dynamic-import': 'silent' }, logLevel: 'warning' });
const { start } = await import(pathToFileURL(out).href);

let sent = [], tsBody = null;
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  if (String(url).includes('turnstile')) { tsBody = init.body.get('remoteip'); return new Response(JSON.stringify({ success: true })); }
  if (String(url).includes('api.resend.com')) { sent.push(JSON.parse(init.body)); return new Response('{}'); }
  return realFetch(url, init);
};
Object.assign(process.env, { TURNSTILE_SECRET_KEY: 's', EMAIL_PROVIDER: 'resend', EMAIL_API_KEY: 'k', MAIL_FROM: 'Site <no-reply@x.test>',
  FORM_TO_SEND_ENQUIRY: 'inbox@x.test' });

const server = start(0);
await new Promise((r) => server.once('listening', r));
const base = `http://127.0.0.1:${server.address().port}`;
// As nginx forwards it (deploy/docker/nginx.conf): public Host + scheme, the visitor's IP.
const proxied = { Host: 'site.test', 'X-Forwarded-Proto': 'https', 'X-Real-IP': '203.0.113.7' };
const good = { name: 'A Patient', email: 'a@b.test', hospital: 'abu-dhabi', subject: 'Question', message: 'Hello', consent: 'on',
  'cf-turnstile-response': 't', edition: 'ae-en' };
const form = (fields) => { const fd = new FormData(); for (const [k, v] of Object.entries(fields)) fd.append(k, v); return fd; };
// Node's fetch will not send a custom Host header, so the server is called with node:http for those cases.
import { request as httpRequest } from 'node:http';
const raw = (path, { method = 'POST', headers = {}, body = '' } = {}) => new Promise((resolve, reject) => {
  const req = httpRequest(`${base}${path}`, { method, headers }, (res) => {
    let data = ''; res.on('data', (c) => (data += c)); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
  });
  req.on('error', reject); req.end(body);
});
const encoded = async (fields) => {
  const r = new Request('http://x', { method: 'POST', body: form(fields) });
  return { body: Buffer.from(await r.arrayBuffer()), type: r.headers.get('Content-Type') };
};
const postForm = async (path, fields, headers = {}) => {
  const { body, type } = await encoded(fields);
  return raw(path, { headers: { ...proxied, 'Content-Type': type, 'Content-Length': body.length, ...headers }, body });
};

const cases = [
  ['health check', () => raw('/healthz', { method: 'GET' }), (r) => r.status === 200 && r.body === 'ok'],
  ['valid post -> email sent, JSON ok', () => postForm('/api/forms/send-enquiry', good, { Accept: 'application/json', Origin: 'https://site.test' }),
    (r) => r.status === 200 && JSON.parse(r.body).ok && sent.length === 1 && sent[0].to[0] === 'inbox@x.test'],
  ['visitor IP reaches Turnstile', () => Promise.resolve(null), () => tsBody === '203.0.113.7'],
  ['no-JS post -> 303 back to the https page', () => postForm('/api/forms/send-enquiry', good, { Referer: 'https://site.test/ae/contact-us/' }),
    (r) => r.status === 303 && r.headers.location === 'https://site.test/ae/contact-us/?form=sent'],
  ['origin of another site refused', () => postForm('/api/forms/send-enquiry', good, { Accept: 'application/json', Origin: 'https://evil.test' }),
    (r) => r.status === 403 && JSON.parse(r.body).error === 'origin'],
  ['http origin refused when the visitor used https', () => postForm('/api/forms/send-enquiry', good, { Accept: 'application/json', Origin: 'http://site.test' }),
    (r) => r.status === 403],
  ['validation errors come back', () => postForm('/api/forms/send-enquiry', { ...good, email: 'nope' }, { Accept: 'application/json' }),
    (r) => r.status === 422 && JSON.parse(r.body).fields.email === 'invalid'],
  ['GET on a form -> 405', () => raw('/api/forms/send-enquiry', { method: 'GET', headers: proxied }), (r) => r.status === 405 && r.headers.allow === 'POST'],
  ['other paths -> 404', () => raw('/contact-us/', { method: 'GET', headers: proxied }), (r) => r.status === 404],
  ['announced body over the limit -> 413, not read', () => raw('/api/forms/send-enquiry',
    { headers: { ...proxied, Accept: 'application/json', 'Content-Type': 'multipart/form-data; boundary=x', 'Content-Length': 9_000_000 } }),
    (r) => r.status === 413],
  ['chunked body over the cap -> 400', () => new Promise((resolve, reject) => {
    const req = httpRequest(`${base}/api/forms/send-enquiry`, { method: 'POST',
      headers: { ...proxied, Accept: 'application/json', 'Content-Type': 'multipart/form-data; boundary=x', 'Transfer-Encoding': 'chunked' } },
      (res) => { let d = ''; res.on('data', (c) => (d += c)); res.on('end', () => resolve({ status: res.statusCode, body: d })); });
    req.on('error', () => resolve({ status: 'reset' }));
    const chunk = Buffer.alloc(256 * 1024, 'a');
    let n = 0; const pump = () => { while (n++ < 24) if (!req.write(chunk)) return req.once('drain', pump); req.end(); }; pump();
  }), (r) => r.status === 400 || r.status === 'reset'],
];

let failed = 0;
for (const [name, run, ok] of cases) {
  let pass = false;
  try { pass = ok(await run()); } catch (e) { console.error(e); }
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}`);
  if (!pass) failed++;
}
server.close();
globalThis.fetch = realFetch;
console.log(failed ? `${failed} failed` : `all ${cases.length} passed`);
process.exit(failed ? 1 : 0);
