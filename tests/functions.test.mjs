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
const { default: vmw } = await bundle('middleware.ts', 'vmw.mjs');
let sent = [], tsOk = true, tsReply = null, tsCalls = 0, providerFail = null;
const logs = [];
const realError = console.error;
console.error = (...a) => { logs.push(a.join(' ')); realError(...a); };
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  if (String(url).includes('turnstile')) { tsCalls++; return new Response(JSON.stringify(tsReply ?? { success: tsOk })); }
  if (/api\.(resend|postmarkapp|sendgrid)\.com/.test(String(url))) {
    if (providerFail === 'throw') throw new TypeError('fetch failed');
    if (providerFail) return new Response(providerFail.body, { status: providerFail.status });
    sent.push(JSON.parse(init.body)); return new Response('{}', { status: 200 });
  }
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
const book = { specialty: 'pediatric', doctor: 'ahmad-al-khayer', name: 'A Patient', email: '', dob: '1990-05-01', mobile_code: 'AE', mobile: '50 123 4567', gender: 'female', message: '', consent: 'on', 'cf-turnstile-response': 't', edition: 'sa-ar' };
const refer = { doctor_name: 'Dr A', doctor_mobile_code: 'AE', doctor_mobile: '50 111 2222', name: 'A Patient', dob: '1990-05-01', mobile_code: 'AE', mobile: '50 123 4567', gender: 'male', guardian_mobile_code: 'AE', guardian_mobile: '50 999 8888', diagnosis: 'Stroke', consent: 'on', 'cf-turnstile-response': 't', edition: 'ae-en' };
const cases = [
  ['valid (JSON)', () => post('send-enquiry', good), (r, b) => r.status === 200 && b.ok && sent.length === 1 && sent[0].to[0] === 'ae@x.test' && sent[0].html.includes('&lt;b&gt;') && sent[0].reply_to === 'a@b.test'],
  ['missing consent', () => post('send-enquiry', { ...good, consent: '' }), (r, b) => r.status === 422 && b.fields.consent === 'required'],
  ['required + invalid email', () => post('send-enquiry', { ...good, name: '', email: 'nope' }), (r, b) => r.status === 422 && b.fields.name === 'required' && b.fields.email === 'invalid'],
  ['turnstile fails', () => { tsOk = false; return post('send-enquiry', good); }, (r, b) => { tsOk = true; return r.status === 403 && b.error === 'turnstile'; }],
  ['unknown form (newsletter)', () => post('newsletter', good), (r, b) => r.status === 404 && b.error === 'unknown_form'],
  ['foreign origin', () => post('send-enquiry', good, { origin: 'https://evil.test' }), (r, b) => r.status === 403 && b.error === 'origin'],
  ['no-JS post redirects back', () => post('send-enquiry', good, { json: false }), (r) => r.status === 303 && r.headers.get('Location') === 'https://site.test/ae?form=sent'],
  ['form not configured for region', () => post('send-enquiry', { ...good, edition: 'global-ar' }), (r, b) => r.status === 200 && sent.at(-1).to[0] === 'g@x.test'],
  ['book: valid, doctor shown by name, 2 inboxes', () => post('book-appointment', book), (r, b) => r.status === 200 && b.ok && sent.at(-1).to.join() === 'book@x.test,book2@x.test' && sent.at(-1).text.includes('Doctor: Dr. Ahmad Al Khayer') && sent.at(-1).text.includes('Mobile: +971 50 123 4567 (AE)') && !sent.at(-1).reply_to],
  ['book: required dob/gender/mobile', () => post('book-appointment', { ...book, dob: '', gender: '', mobile: '' }), (r, b) => r.status === 422 && b.fields.dob === 'required' && b.fields.gender === 'required' && b.fields.mobile === 'required' && !b.fields.email],
  ['book: bad option, future dob, unknown dial code, bad doctor', () => post('book-appointment', { ...book, gender: 'x', dob: '2999-01-01', mobile_code: 'ZZ', doctor: 'nobody' }), (r, b) => r.status === 422 && b.fields.gender === 'invalid' && b.fields.dob === 'invalid' && b.fields.mobile === 'invalid' && b.fields.doctor === 'invalid'],
  ['feedback page: valid with ratings', () => post('feedback', { name: 'A', mobile_code: 'AE', mobile: '501234567', recommend: 'likely', quality: 'satisfied', hospital: 'jeddah', consent: 'on', 'cf-turnstile-response': 't', edition: 'global-en' }), (r, b) => r.status === 200 && sent.at(-1).to[0] === 'fb@x.test' && sent.at(-1).text.includes('Hospital: Cambridge Hospital Jeddah')],
  ['feedback pop-up: invalid rating value', () => post('feedback-popup', { name: 'A', mobile_code: 'AE', mobile: '501234567', overall: 'great', consent: 'on', 'cf-turnstile-response': 't' }), (r, b) => r.status === 422 && b.fields.overall === 'invalid'],
  ['KSA dial code: SA posts +966 into the email', () => post('book-appointment', { ...book, mobile_code: 'SA' }), (r, b) => r.status === 200 && sent.at(-1).text.includes('Mobile: +966 50 123 4567 (SA)')],
  ['home contact: valid submission succeeds (own form id, send-enquiry inbox)', () => post('home-contact', { name: 'A Visitor', email: 'v@b.test', message: 'Hello', consent: 'on', 'cf-turnstile-response': 't', edition: 'global-en' }), (r, b) => r.status === 200 && b.ok && sent.at(-1).to[0] === 'g@x.test' && sent.at(-1).text.includes('Your Name: A Visitor') && sent.at(-1).text.includes('Message: Hello')],
  ['home contact: Figma fields only (no hospital/subject needed), message required', () => post('home-contact', { name: 'A', email: 'v@b.test', message: '', consent: 'on', 'cf-turnstile-response': 't' }), (r, b) => r.status === 422 && Object.keys(b.fields).join() === 'message'],
  ['inbox not configured', () => post('refer-patient', refer), (r, b) => r.status === 500 && b.error === 'not_configured'],
  ['refer (doctor): referring-doctor + patient + diagnosis required', () => post('refer-patient', { ...refer, doctor_name: '', diagnosis: '', guardian_mobile: '' }), (r, b) => r.status === 422 && b.fields.doctor_name === 'required' && b.fields.diagnosis === 'required' && b.fields.guardian_mobile === 'required'],
  ['refer (other) = variant without the doctor block, same inbox', () => { env.FORM_TO_REFER_PATIENT = 'ref@x.test'; return post('refer-patient-other', { ...refer, doctor_name: '', doctor_mobile: '' }); }, (r, b) => { delete env.FORM_TO_REFER_PATIENT; return r.status === 200 && sent.at(-1).to[0] === 'ref@x.test' && !sent.at(-1).text.includes('Referring doctor') && sent.at(-1).text.includes('Diagnosis (ICD code if available): Stroke'); }],
  ['refer: select with an options list rejects other values', () => post('refer-patient', { ...refer, referral_type: 'anything' }), (r, b) => r.status === 422 && b.fields.referral_type === 'invalid'],
  ['international: own env INTERNATIONAL_INBOX, country by name, gender required', () => { env.INTERNATIONAL_INBOX = 'intl@x.test'; return post('international-enquiry', { name: 'A', country: 'gb', gender: 'female', consent: 'on', 'cf-turnstile-response': 't', edition: 'global-en' }); }, (r, b) => { delete env.INTERNATIONAL_INBOX; return r.status === 200 && sent.at(-1).to[0] === 'intl@x.test' && sent.at(-1).text.includes('Country: United Kingdom'); }],
  ['international: unknown country + missing gender', () => post('international-enquiry', { country: 'xx', consent: 'on', 'cf-turnstile-response': 't' }), (r, b) => r.status === 422 && b.fields.country === 'invalid' && b.fields.gender === 'required'],
  ['prototype key is not a form', () => post('constructor', good), (r, b) => r.status === 404],
  ['GET not allowed', async () => onRequest(), (r) => r.status === 405],
  ['edition outside the whitelist never reaches the subject', () => post('send-enquiry', { ...good, edition: 'ae-en\r\nBcc: x@evil.test' }), (r, b) => r.status === 200 && sent.at(-1).subject.endsWith('(global-en)') && sent.at(-1).to[0] === 'g@x.test'],
  ['cross-site Sec-Fetch-Site rejected', () => { const fd = new FormData(); for (const [k, v] of Object.entries(good)) fd.append(k, v); return onRequestPost({ request: new Request('https://site.test/api/forms/send-enquiry', { method: 'POST', body: fd, headers: { Accept: 'application/json', 'Sec-Fetch-Site': 'cross-site' } }), env, params: { form: 'send-enquiry' } }); }, (r, b) => r.status === 403 && b.error === 'origin'],
  ['EMAIL_PROVIDER=none without LOCAL_DEV fails (no silent discard)', () => { env.EMAIL_PROVIDER = 'none'; return post('send-enquiry', good); }, (r, b) => r.status === 500 && b.error === 'not_configured' && !b.ok],
  ['EMAIL_PROVIDER=none with LOCAL_DEV=true accepts (local dev)', () => { env.LOCAL_DEV = 'true'; return post('send-enquiry', good); }, (r, b) => { env.EMAIL_PROVIDER = 'resend'; delete env.LOCAL_DEV; return r.status === 200 && b.ok; }],
  // Deployment settings: answered "not_configured" before Turnstile is called (its token is single-use), logged by name only.
  ['no Turnstile secret -> not_configured, logged, nothing sent', () => { tsCalls = 0; env.TURNSTILE_SECRET_KEY = ''; return post('send-enquiry', good); }, (r, b) => { env.TURNSTILE_SECRET_KEY = 's'; return r.status === 500 && b.error === 'not_configured' && tsCalls === 0 && logs.at(-1).includes('TURNSTILE_SECRET_KEY missing'); }],
  ['no email settings (Vercel project without env) -> not_configured before Turnstile', () => { tsCalls = 0; const n = sent.length; delete env.EMAIL_PROVIDER; delete env.EMAIL_API_KEY; return post('send-enquiry', good).then((r) => ((r.n = n), r)); }, (r, b) => { Object.assign(env, { EMAIL_PROVIDER: 'resend', EMAIL_API_KEY: 'k' }); return r.status === 500 && b.error === 'not_configured' && tsCalls === 0 && sent.length === r.n && logs.at(-1).includes('EMAIL_PROVIDER ""'); }],
  ['MAIL_FROM missing -> not_configured', () => { delete env.MAIL_FROM; return post('send-enquiry', good); }, (r, b) => { env.MAIL_FROM = 'Site <no-reply@x.test>'; return r.status === 500 && b.error === 'not_configured' && logs.at(-1).includes('MAIL_FROM missing'); }],
  ['unknown EMAIL_PROVIDER (prototype key) -> not_configured', () => { env.EMAIL_PROVIDER = 'constructor'; return post('send-enquiry', good); }, (r, b) => { env.EMAIL_PROVIDER = 'resend'; return r.status === 500 && b.error === 'not_configured'; }],
  ['Turnstile rejects OUR secret -> not_configured (not "complete the check")', () => { tsReply = { success: false, 'error-codes': ['invalid-input-secret'] }; return post('send-enquiry', good); }, (r, b) => { tsReply = null; return r.status === 500 && b.error === 'not_configured' && logs.at(-1).includes('TURNSTILE_SECRET_KEY'); }],
  ['provider error -> 502 send_failed, no success, reason logged with addresses masked', () => { providerFail = { status: 403, body: '{"message":"Testing emails only to owner@corp.test; reply a@b.test"}' }; return post('send-enquiry', good); }, (r, b) => { providerFail = null; const l = logs.at(-1); return r.status === 502 && b.error === 'send_failed' && !b.ok && l.includes('resend 403') && l.includes('<email>') && !l.includes('a@b.test') && !l.includes('owner@corp.test'); }],
  ['provider unreachable -> 502 send_failed', () => { providerFail = 'throw'; return post('send-enquiry', good); }, (r, b) => { providerFail = null; return r.status === 502 && b.error === 'send_failed'; }],
  ['no-JS post with failed send redirects with form=error', () => { providerFail = { status: 500, body: '' }; return post('send-enquiry', good, { json: false }); }, (r) => { providerFail = null; return r.status === 303 && r.headers.get('Location') === 'https://site.test/ae?form=error'; }],
  ['sendgrid: "Name <address>" MAIL_FROM sent as { email, name }', () => { env.EMAIL_PROVIDER = 'sendgrid'; return post('send-enquiry', good); }, (r, b) => { env.EMAIL_PROVIDER = 'resend'; const m = sent.at(-1); return r.status === 200 && b.ok && m.from.email === 'no-reply@x.test' && m.from.name === 'Site' && m.personalizations[0].to[0].email === 'ae@x.test' && m.reply_to.email === 'a@b.test'; }],
  ['smtp without SMTP_HOST / SMTP_PASS -> not_configured (named in the log)', () => { env.EMAIL_PROVIDER = 'smtp'; env.SMTP_USER = 'u@x.test'; return post('send-enquiry', good); }, (r, b) => { env.EMAIL_PROVIDER = 'resend'; delete env.SMTP_USER; return r.status === 500 && b.error === 'not_configured' && logs.at(-1).includes('SMTP_HOST / SMTP_PASS missing'); }],
  ['smtp server down -> 502 send_failed, no success', () => { Object.assign(env, { EMAIL_PROVIDER: 'smtp', SMTP_HOST: '127.0.0.1', SMTP_PORT: '1', SMTP_USER: 'u@x.test', SMTP_PASS: 'p' }); return post('send-enquiry', good); }, (r, b) => { env.EMAIL_PROVIDER = 'resend'; for (const k of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS']) delete env[k]; return r.status === 502 && b.error === 'send_failed' && !b.ok; }],
  ['postmark: From / To / ReplyTo', () => { env.EMAIL_PROVIDER = 'postmark'; return post('book-appointment', { ...book, email: 'p@b.test' }); }, (r, b) => { env.EMAIL_PROVIDER = 'resend'; const m = sent.at(-1); return r.status === 200 && b.ok && m.From === 'Site <no-reply@x.test>' && m.To === 'book@x.test,book2@x.test' && m.ReplyTo === 'p@b.test'; }],
];
let pass = 0;
for (const [name, run, check] of cases) {
  const r = await run(); let b = {}; try { b = await r.clone().json(); } catch {}
  const ok = await check(r, b); pass += ok ? 1 : 0; console.log(ok ? 'PASS' : 'FAIL', name, r.status, JSON.stringify(b));
}
// middleware (bug 083): Cloudflare cf.country / CF-IPCountry, Vercel x-vercel-ip-country; unknown = no cookie, never a guess
const html = () => new Response('<html></html>', { headers: { 'Content-Type': 'text/html' } });
const mwReq = (path, cookie = '', cf = { country: 'AE' }, headers = {}) => mw({ request: Object.assign(new Request('https://site.test' + path, { headers: { ...headers, ...(cookie ? { Cookie: cookie } : {}) } }), { cf }), env: {}, params: {}, next: async () => html() });
const geo = (r) => r?.headers.get('Set-Cookie') ?? null;
const m1 = await mwReq('/'); const m2 = await mwReq('/ae'); const m3 = await mwReq('/', 'ch_edition=ae'); const m4 = await mwReq('/ar/find-a-doctor');
const mw_cases = [
  ['CF: Global sets ch_geo=AE', geo(m1)?.startsWith('ch_geo=AE;')],
  ['CF: /ae untouched', !geo(m2)],
  ['CF: chosen visitor untouched', !geo(m3)],
  ['CF: Global Arabic page sets it', geo(m4)?.startsWith('ch_geo=AE;')],
  ['CF: SA', geo(await mwReq('/', '', { country: 'sa' }))?.startsWith('ch_geo=SA;')],
  ['CF: IN stored as IN (no pop-up version)', geo(await mwReq('/', '', { country: 'IN' }))?.startsWith('ch_geo=IN;')],
  ['CF: XX = no cookie', !geo(await mwReq('/', '', { country: 'XX' }))],
  ['CF: T1 (Tor) = no cookie', !geo(await mwReq('/', '', { country: 'T1' }))],
  ['CF: none = no cookie', !geo(await mwReq('/', '', {}))],
  ['CF header only', geo(await mwReq('/', '', {}, { 'CF-IPCountry': 'SA' }))?.startsWith('ch_geo=SA;')],
  ['Vercel header via Pages middleware', geo(await mwReq('/', '', {}, { 'x-vercel-ip-country': 'ae' }))?.startsWith('ch_geo=AE;')],
  ['already detected = untouched', !geo(await mwReq('/', 'ch_geo=IN'))],
  ['/sa untouched', !geo(await mwReq('/sa/ar/'))],
];
const vReq = (path, headers = {}, method = 'GET') => vmw(new Request('https://site.test' + path, { method, headers: { Accept: 'text/html,*/*', ...headers } }));
const v = (r) => (r ? { next: r.headers.get('x-middleware-next'), cookie: r.headers.get('Set-Cookie') } : null);
mw_cases.push(
  ['Vercel: AE', v(vReq('/', { 'x-vercel-ip-country': 'AE' }))?.cookie?.startsWith('ch_geo=AE;') && v(vReq('/', { 'x-vercel-ip-country': 'AE' })).next === '1'],
  ['Vercel: SA on Global Arabic', v(vReq('/ar/', { 'x-vercel-ip-country': 'SA' }))?.cookie?.startsWith('ch_geo=SA;')],
  ['Vercel: IN stored as IN', v(vReq('/', { 'x-vercel-ip-country': 'IN' }))?.cookie?.startsWith('ch_geo=IN;')],
  ['Vercel: no header = pass through', vReq('/') === undefined],
  ['Vercel: invalid header = pass through', vReq('/', { 'x-vercel-ip-country': 'ZZZ' }) === undefined && vReq('/', { 'x-vercel-ip-country': 'XX' }) === undefined],
  ['Vercel: Cloudflare in front wins', v(vReq('/', { 'x-vercel-ip-country': 'US', 'CF-IPCountry': 'SA' }))?.cookie?.startsWith('ch_geo=SA;')],
  ['Vercel: /ae and /sa untouched', vReq('/ae/', { 'x-vercel-ip-country': 'AE' }) === undefined && vReq('/sa/ar/', { 'x-vercel-ip-country': 'SA' }) === undefined],
  ['Vercel: chosen visitor untouched', vReq('/', { 'x-vercel-ip-country': 'AE', Cookie: 'a=1; ch_edition=global' }) === undefined],
  ['Vercel: non-HTML / POST untouched', vReq('/', { 'x-vercel-ip-country': 'AE', Accept: 'image/avif' }) === undefined && vReq('/', { 'x-vercel-ip-country': 'AE' }, 'POST') === undefined],
);
for (const [name, ok] of mw_cases) console.log(ok ? 'PASS' : 'FAIL', 'middleware:', name);
const mw_ok = mw_cases.map(([, ok]) => !!ok);

const total = pass + (mw_ok.every(Boolean) ? 1 : 0);
console.log(`${total}/${cases.length + 1} passed`);
if (total !== cases.length + 1) process.exit(1);
