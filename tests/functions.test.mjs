// Tests for the Cloudflare Pages Functions (no network: Turnstile and the email API are mocked).
// Run: npm run test:functions
import { build } from 'esbuild';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const out = mkdtempSync(join(tmpdir(), 'ch-fn-'));
const bundle = async (entry, name) => {
  await build({ entryPoints: [entry], bundle: true, format: 'esm', platform: 'neutral', outfile: join(out, name), logLevel: 'warning' });
  return import(pathToFileURL(join(out, name)).href);
};
const { onRequestPost, onRequest } = await bundle('functions/api/forms/[form].ts', 'form.mjs');
let sent = [], tsOk = true;
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  if (String(url).includes('turnstile')) return new Response(JSON.stringify({ success: tsOk }));
  if (String(url).includes('api.resend.com')) { sent.push(JSON.parse(init.body)); return new Response('{}', { status: 200 }); }
  return realFetch(url, init);
};
const env = { TURNSTILE_SECRET_KEY: 's', EMAIL_PROVIDER: 'resend', EMAIL_API_KEY: 'k', MAIL_FROM: 'Site <no-reply@x.test>',
  FORM_RECIPIENTS: JSON.stringify({ 'send-enquiry': { global: 'g@x.test', ae: 'ae@x.test', sa: 'sa@x.test' } }) };
const post = (form, fields, { json = true, origin = 'https://site.test' } = {}) => {
  const fd = new FormData(); for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  const req = new Request(`https://site.test/api/forms/${form}`, { method: 'POST', body: fd, headers: { Accept: json ? 'application/json' : 'text/html', Origin: origin, Referer: 'https://site.test/ae' } });
  return onRequestPost({ request: req, env, params: { form } });
};
const good = { name: 'A Patient', email: 'a@b.test', message: 'Hello <b>there</b>', consent: 'on', 'cf-turnstile-response': 't', edition: 'ae-en' };
const cases = [
  ['valid (JSON)', () => post('send-enquiry', good), (r, b) => r.status === 200 && b.ok && sent.length === 1 && sent[0].to[0] === 'ae@x.test' && sent[0].html.includes('&lt;b&gt;') && sent[0].reply_to === 'a@b.test'],
  ['missing consent', () => post('send-enquiry', { ...good, consent: '' }), (r, b) => r.status === 422 && b.fields.consent === 'required'],
  ['required + invalid email', () => post('send-enquiry', { ...good, name: '', email: 'nope' }), (r, b) => r.status === 422 && b.fields.name === 'required' && b.fields.email === 'invalid'],
  ['turnstile fails', () => { tsOk = false; return post('send-enquiry', good); }, (r, b) => { tsOk = true; return r.status === 403 && b.error === 'turnstile'; }],
  ['unknown form (newsletter)', () => post('newsletter', good), (r, b) => r.status === 404 && b.error === 'unknown_form'],
  ['foreign origin', () => post('send-enquiry', good, { origin: 'https://evil.test' }), (r, b) => r.status === 403 && b.error === 'origin'],
  ['no-JS post redirects back', () => post('send-enquiry', good, { json: false }), (r) => r.status === 303 && r.headers.get('Location') === 'https://site.test/ae?form=sent'],
  ['form not configured for region', () => post('send-enquiry', { ...good, edition: 'global-ar' }), (r, b) => r.status === 200 && sent.at(-1).to[0] === 'g@x.test'],
  ['GET not allowed', async () => onRequest(), (r) => r.status === 405],
];
let pass = 0;
for (const [name, run, check] of cases) {
  const r = await run(); let b = {}; try { b = await r.clone().json(); } catch {}
  const ok = await check(r, b); pass += ok ? 1 : 0; console.log(ok ? 'PASS' : 'FAIL', name, r.status, JSON.stringify(b));
}
console.log(`${pass}/${cases.length} passed`);
if (pass !== cases.length) process.exit(1);
