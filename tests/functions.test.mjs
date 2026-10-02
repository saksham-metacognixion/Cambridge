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
const { onRequest: mw } = await bundle('functions/_middleware.ts', 'mw.mjs');
let sent = [], tsOk = true;
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  if (String(url).includes('turnstile')) return new Response(JSON.stringify({ success: tsOk }));
  if (String(url).includes('api.resend.com')) { sent.push(JSON.parse(init.body)); return new Response('{}', { status: 200 }); }
  return realFetch(url, init);
};
const env = { TURNSTILE_SECRET_KEY: 's', EMAIL_PROVIDER: 'resend', EMAIL_API_KEY: 'k', MAIL_FROM: 'Site <no-reply@x.test>',
  FORM_TO_SEND_ENQUIRY: JSON.stringify({ global: 'g@x.test', ae: 'ae@x.test', sa: 'sa@x.test' }),
  FORM_TO_BOOK_APPOINTMENT: 'book@x.test, book2@x.test', FORM_TO_FEEDBACK: 'fb@x.test' };
const post = (form, fields, { json = true, origin = 'https://site.test' } = {}) => {
  const fd = new FormData(); for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  const req = new Request(`https://site.test/api/forms/${form}`, { method: 'POST', body: fd, headers: { Accept: json ? 'application/json' : 'text/html', Origin: origin, Referer: 'https://site.test/ae' } });
  return onRequestPost({ request: req, env, params: { form } });
};
const good = { name: 'A Patient', email: 'a@b.test', hospital: 'abu-dhabi', subject: 'Question', message: 'Hello <b>there</b>', consent: 'on', 'cf-turnstile-response': 't', edition: 'ae-en' };
const book = { specialty: 'pediatrics', doctor: 'ahmad-al-khayer', name: 'A Patient', email: '', dob: '1990-05-01', mobile_code: '+971', mobile: '50 123 4567', gender: 'female', message: '', consent: 'on', 'cf-turnstile-response': 't', edition: 'sa-ar' };
const cases = [
  ['valid (JSON)', () => post('send-enquiry', good), (r, b) => r.status === 200 && b.ok && sent.length === 1 && sent[0].to[0] === 'ae@x.test' && sent[0].html.includes('&lt;b&gt;') && sent[0].reply_to === 'a@b.test'],
  ['missing consent', () => post('send-enquiry', { ...good, consent: '' }), (r, b) => r.status === 422 && b.fields.consent === 'required'],
  ['required + invalid email', () => post('send-enquiry', { ...good, name: '', email: 'nope' }), (r, b) => r.status === 422 && b.fields.name === 'required' && b.fields.email === 'invalid'],
  ['turnstile fails', () => { tsOk = false; return post('send-enquiry', good); }, (r, b) => { tsOk = true; return r.status === 403 && b.error === 'turnstile'; }],
  ['unknown form (newsletter)', () => post('newsletter', good), (r, b) => r.status === 404 && b.error === 'unknown_form'],
  ['foreign origin', () => post('send-enquiry', good, { origin: 'https://evil.test' }), (r, b) => r.status === 403 && b.error === 'origin'],
  ['no-JS post redirects back', () => post('send-enquiry', good, { json: false }), (r) => r.status === 303 && r.headers.get('Location') === 'https://site.test/ae?form=sent'],
  ['form not configured for region', () => post('send-enquiry', { ...good, edition: 'global-ar' }), (r, b) => r.status === 200 && sent.at(-1).to[0] === 'g@x.test'],
  ['book: valid, doctor shown by name, 2 inboxes', () => post('book-appointment', book), (r, b) => r.status === 200 && b.ok && sent.at(-1).to.join() === 'book@x.test,book2@x.test' && sent.at(-1).text.includes('Doctor: Dr. Ahmad Al Khayer') && sent.at(-1).text.includes('Mobile: +971 50 123 4567') && !sent.at(-1).reply_to],
  ['book: required dob/gender/mobile', () => post('book-appointment', { ...book, dob: '', gender: '', mobile: '' }), (r, b) => r.status === 422 && b.fields.dob === 'required' && b.fields.gender === 'required' && b.fields.mobile === 'required' && !b.fields.email],
  ['book: bad option, future dob, unknown dial code, bad doctor', () => post('book-appointment', { ...book, gender: 'x', dob: '2999-01-01', mobile_code: '+1', doctor: 'nobody' }), (r, b) => r.status === 422 && b.fields.gender === 'invalid' && b.fields.dob === 'invalid' && b.fields.mobile === 'invalid' && b.fields.doctor === 'invalid'],
  ['feedback page: valid with ratings', () => post('feedback', { name: 'A', mobile_code: '+971', mobile: '501234567', recommend: 'likely', quality: 'satisfied', hospital: 'jeddah', consent: 'on', 'cf-turnstile-response': 't', edition: 'global-en' }), (r, b) => r.status === 200 && sent.at(-1).to[0] === 'fb@x.test' && sent.at(-1).text.includes('Hospital: Cambridge Hospital Jeddah')],
  ['feedback pop-up: invalid rating value', () => post('feedback-popup', { name: 'A', mobile_code: '+971', mobile: '501234567', overall: 'great', consent: 'on', 'cf-turnstile-response': 't' }), (r, b) => r.status === 422 && b.fields.overall === 'invalid'],
  ['inbox not configured', () => post('refer-patient', { name: 'A', email: 'a@b.test', consent: 'on', 'cf-turnstile-response': 't' }), (r, b) => r.status === 500 && b.error === 'not_configured'],
  ['prototype key is not a form', () => post('constructor', good), (r, b) => r.status === 404],
  ['GET not allowed', async () => onRequest(), (r) => r.status === 405],
];
let pass = 0;
for (const [name, run, check] of cases) {
  const r = await run(); let b = {}; try { b = await r.clone().json(); } catch {}
  const ok = await check(r, b); pass += ok ? 1 : 0; console.log(ok ? 'PASS' : 'FAIL', name, r.status, JSON.stringify(b));
}
// middleware
const html = () => new Response('<html></html>', { headers: { 'Content-Type': 'text/html' } });
const mwReq = (path, cookie = '') => mw({ request: Object.assign(new Request('https://site.test' + path, { headers: cookie ? { Cookie: cookie } : {} }), { cf: { country: 'AE' } }), env: {}, params: {}, next: async () => html() });
const m1 = await mwReq('/'); const m2 = await mwReq('/ae'); const m3 = await mwReq('/', 'ch_edition=ae'); const m4 = await mwReq('/ar/find-a-doctor');
const mw_ok = [m1.headers.get('Set-Cookie')?.startsWith('ch_geo=AE'), !m2.headers.get('Set-Cookie'), !m3.headers.get('Set-Cookie'), m4.headers.get('Set-Cookie')?.startsWith('ch_geo=AE')];
console.log(mw_ok.every(Boolean) ? 'PASS' : 'FAIL', 'middleware: Global sets ch_geo, /ae untouched, chosen visitors untouched, Global Arabic page sets it', JSON.stringify(mw_ok));

const total = pass + (mw_ok.every(Boolean) ? 1 : 0);
console.log(`${total}/${cases.length + 1} passed`);
if (total !== cases.length + 1) process.exit(1);
