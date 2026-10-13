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
const { message: smtpMessage } = await bundle('functions/_lib/smtp.ts', 'smtp.mjs');
const att = await bundle('src/lib/attachments.ts', 'att.mjs');
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
const PDF = '%PDF-1.4\n%test\n' + 'x'.repeat(600) + '\n%%EOF';
const file = (bytes, name, type = '') => new File([bytes], name, { type });
const pdf = (name) => file(PDF, name, 'application/pdf');
const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46]), PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const ZIP = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 20, 0]), OLE = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0, 0]);
const good = { name: 'A Patient', email: 'a@b.test', hospital: 'abu-dhabi', subject: 'Question', message: 'Hello <b>there</b>', consent: 'on', 'cf-turnstile-response': 't', edition: 'ae-en' };
const book = { specialty: 'pediatric', doctor: 'ahmad-al-khayer', name: 'A Patient', email: '', dob: '1990-05-01', mobile_code: 'AE', mobile: '50 123 4567', gender: 'female', message: '', consent: 'on', 'cf-turnstile-response': 't', edition: 'sa-ar' };
const refer = { doctor_name: 'Dr A', doctor_mobile_code: 'AE', doctor_mobile: '50 111 2222', name: 'A Patient', dob: '1990-05-01', mobile_code: 'AE', mobile: '50 123 4567', gender: 'male', guardian_mobile_code: 'AE', guardian_mobile: '50 999 8888', diagnosis: 'Stroke', consent: 'on', 'cf-turnstile-response': 't', edition: 'ae-en' };
const cases = [
  ['valid (JSON)', () => post('send-enquiry', good), (r, b) => r.status === 200 && b.ok && sent.length === 1 && sent[0].to[0] === 'ae@x.test' && sent[0].html.includes('&lt;b&gt;') && sent[0].reply_to === 'a@b.test'],
  ['missing consent', () => post('send-enquiry', { ...good, consent: '' }), (r, b) => r.status === 422 && b.fields.consent === 'required'],
  ['required + invalid email', () => post('send-enquiry', { ...good, name: '', email: 'nope' }), (r, b) => r.status === 422 && b.fields.name === 'required' && b.fields.email === 'invalid'],
  ['turnstile fails', () => { tsOk = false; return post('send-enquiry', good); }, (r, b) => { tsOk = true; return r.status === 403 && b.error === 'turnstile'; }],
  ['unknown form', () => post('mailing-list', good), (r, b) => r.status === 404 && b.error === 'unknown_form'],
  ['newsletter: email only, no consent needed, own inbox', () => { env.FORM_TO_NEWSLETTER = 'nl@x.test'; return post('newsletter', { email: 'n@b.test', 'cf-turnstile-response': 't', edition: 'ae-ar' }); }, (r, b) => { delete env.FORM_TO_NEWSLETTER; return r.status === 200 && b.ok && sent.at(-1).to[0] === 'nl@x.test' && sent.at(-1).text.includes('Email: n@b.test') && !sent.at(-1).text.includes('Consent'); }],
  ['newsletter: invalid email', () => post('newsletter', { email: 'nope', 'cf-turnstile-response': 't' }), (r, b) => r.status === 422 && b.fields.email === 'invalid' && !b.fields.consent],
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
  // Bug 093: optional attachment on the three Send an Enquiry forms (rules: src/data/forms.json attachments, provisional).
  ['attachment: PDF emailed (resend), named in the text, nothing else changed', () => post('send-enquiry', { ...good, attachment: pdf('report.pdf') }), (r, b) => { const m = sent.at(-1); return r.status === 200 && b.ok && m.attachments?.length === 1 && m.attachments[0].filename === 'report.pdf' && Buffer.from(m.attachments[0].content, 'base64').toString('latin1') === PDF && m.text.includes('Attachment: report.pdf (1 KB, attached)') && m.to[0] === 'ae@x.test'; }],
  ['attachment: none chosen (empty file part) -> sent without attachments', () => post('send-enquiry', { ...good, attachment: new File([], '', { type: 'application/octet-stream' }) }), (r, b) => r.status === 200 && b.ok && !('attachments' in sent.at(-1)) && sent.at(-1).text.includes('Attachment: \n')],
  ['attachment: field absent (old page / no JS urlencoded name only) -> sent without', () => post('send-enquiry', { ...good, attachment: 'report.pdf' }), (r, b) => r.status === 200 && b.ok && !('attachments' in sent.at(-1))],
  ['attachment: .exe refused (file_type), nothing sent', () => { const n = sent.length; return post('send-enquiry', { ...good, attachment: new File(['MZ...'], 'setup.exe') }).then((r) => ((r.n = n), r)); }, (r, b) => r.status === 422 && b.fields.attachment === 'file_type' && sent.length === r.n],
  ['attachment: text renamed .pdf refused (content sniff, MIME claim ignored)', () => post('send-enquiry', { ...good, attachment: new File(['hello'], 'fake.pdf', { type: 'application/pdf' }) }), (r, b) => r.status === 422 && b.fields.attachment === 'file_invalid'],
  ['attachment: over the size limit refused (file_size)', () => post('send-enquiry', { ...good, attachment: new File([PDF, new Uint8Array(4 * 1048576)], 'big.pdf') }), (r, b) => r.status === 422 && b.fields.attachment === 'file_size'],
  ['attachment: Content-Length over limit + text forms keep 32 KB', async () => { const fd = new FormData(); for (const [k, v] of Object.entries(good)) fd.append(k, v); const big = await onRequestPost({ request: new Request('https://site.test/api/forms/send-enquiry', { method: 'POST', body: fd, headers: { Accept: 'application/json', 'Content-Length': String(5 * 1048576) } }), env, params: { form: 'send-enquiry' } }); const ok = await onRequestPost({ request: new Request('https://site.test/api/forms/send-enquiry', { method: 'POST', body: fd, headers: { Accept: 'application/json', 'Content-Length': String(1048576) } }), env, params: { form: 'send-enquiry' } }); const text = await onRequestPost({ request: new Request('https://site.test/api/forms/feedback', { method: 'POST', body: fd, headers: { Accept: 'application/json', 'Content-Length': String(40 * 1024) } }), env, params: { form: 'feedback' } }); big.extra = [ok.status, text.status]; return big; }, (r, b) => r.status === 413 && b.error === 'too_large' && r.extra[0] !== 413 && r.extra[1] === 413],
  ['attachment: path / quotes / control characters stripped from the name, extension lower-cased', () => post('send-enquiry', { ...good, attachment: pdf('..\\..\\C:/tmp/re"po<r>t\u0007.PDF') }), (r, b) => r.status === 200 && sent.at(-1).attachments[0].filename === 'report.pdf'],
  ['attachment: Arabic file name kept; JPEG / PNG / DOCX / DOC accepted by content', async () => { const rs = []; for (const f of [file(JPG, 'تقرير طبي.jpg'), file(PNG, 'scan.png'), file(ZIP, 'letter.docx'), file(OLE, 'old.doc')]) rs.push(await post('send-enquiry', { ...good, attachment: f }).then((x) => x.status)); const r = new Response('{}'); r.codes = rs; return r; }, (r) => r.codes.every((c) => c === 200) && sent.at(-4).attachments[0].filename === 'تقرير طبي.jpg' && sent.at(-1).attachments[0].filename === 'old.doc'],
  ['attachment: pop-up + Home forms take it too', async () => { const a = await post('send-enquiry-popup', { name: 'A', mobile_code: 'AE', mobile: '501234567', email: 'a@b.test', consent: 'on', 'cf-turnstile-response': 't', attachment: pdf('p.pdf') }); a.second = await post('home-contact', { name: 'A', email: 'v@b.test', message: 'Hi', consent: 'on', 'cf-turnstile-response': 't', attachment: pdf('h.pdf') }).then((x) => x.status); a.name = sent.at(-1).attachments?.[0].filename; return a; }, (r, b) => r.status === 200 && r.second === 200 && r.name === 'h.pdf'],
  ['attachment: forms without a file field ignore a posted file (feedback, newsletter)', () => post('feedback', { name: 'A', mobile_code: 'AE', mobile: '501234567', consent: 'on', 'cf-turnstile-response': 't', attachment: pdf('x.pdf') }), (r, b) => r.status === 200 && !('attachments' in sent.at(-1)) && !sent.at(-1).text.includes('Attachment')],
  ['attachment: postmark Attachments + sendgrid attachments shapes', async () => { env.EMAIL_PROVIDER = 'postmark'; const a = await post('send-enquiry', { ...good, attachment: pdf('a.pdf') }); const pm = sent.at(-1); env.EMAIL_PROVIDER = 'sendgrid'; await post('send-enquiry', { ...good, attachment: pdf('a.pdf') }); const sg = sent.at(-1); env.EMAIL_PROVIDER = 'resend'; a.pm = pm; a.sg = sg; return a; }, (r) => r.pm.Attachments[0].Name === 'a.pdf' && r.pm.Attachments[0].ContentType === 'application/pdf' && Buffer.from(r.pm.Attachments[0].Content, 'base64').toString('latin1') === PDF && r.sg.attachments[0].filename === 'a.pdf' && r.sg.attachments[0].type === 'application/pdf' && r.sg.attachments[0].disposition === 'attachment'],
  ['attachment: provider failure -> 502 send_failed, file content never logged', () => { providerFail = { status: 500, body: 'boom' }; return post('send-enquiry', { ...good, attachment: pdf('secret-scan.pdf') }); }, (r, b) => { providerFail = null; return r.status === 502 && b.error === 'send_failed' && !logs.join(' ').includes('secret-scan') && !logs.join(' ').includes('%PDF'); }],
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

// Bug 093: SMTP message with an attachment (multipart/mixed) and without (unchanged multipart/alternative); shared rules.
const from = { email: 'site@x.test', name: 'Site' };
const plainMail = smtpMessage({ to: ['a@x.test'], subject: 'S', text: 't', html: '<p>t</p>' }, from, 'x.test');
const withFile = smtpMessage({ to: ['a@x.test'], subject: 'S', text: 't', html: '<p>t</p>', attachments: [{ filename: 'تقرير.pdf', content: new TextEncoder().encode(PDF), contentType: 'application/pdf' }, { filename: 'scan.png', content: PNG, contentType: 'image/png' }] }, from, 'x.test');
const b64part = (msg, name) => { const i = msg.indexOf(name); const body = msg.slice(msg.indexOf('\r\n\r\n', i) + 4); return Buffer.from(body.slice(0, body.indexOf('\r\n--')).replace(/\r\n/g, ''), 'base64'); };
const lib_cases = [
  ['smtp: no attachment = multipart/alternative at the top (unchanged)', /^Content-Type: multipart\/alternative/m.test(plainMail) && !plainMail.includes('multipart/mixed')],
  ['smtp: attachment = multipart/mixed with the alternative part inside', /^Content-Type: multipart\/mixed/m.test(withFile) && withFile.includes('Content-Type: multipart/alternative')],
  ['smtp: Arabic name as RFC 2231 + ASCII fallback', withFile.includes(`filename="attachment.pdf"; filename*=UTF-8''${encodeURIComponent('تقرير.pdf')}`) && withFile.includes('Content-Type: application/pdf; name="attachment.pdf"')],
  ['smtp: ASCII name as is, content round-trips through base64', withFile.includes('filename="scan.png"\r\n') && b64part(withFile, 'filename="scan.png"').equals(Buffer.from(PNG)) && b64part(withFile, "filename*=UTF-8''").toString('latin1') === PDF],
  ['smtp: lines within 998 characters', withFile.split('\r\n').every((l) => l.length <= 998)],
  ['lib: checkFile type / size / empty', att.checkFile('a.PDF', 10, { maxBytes: 100, types: { pdf: 'x' } }) === undefined && att.checkFile('a.exe', 10, { maxBytes: 100, types: { pdf: 'x' } }) === 'file_type' && att.checkFile('a.pdf', 101, { maxBytes: 100, types: { pdf: 'x' } }) === 'file_size' && att.checkFile('a.pdf', 0, { maxBytes: 100, types: { pdf: 'x' } }) === 'file_invalid' && att.checkFile('pdf', 1, { maxBytes: 100, types: { pdf: 'x' } }) === 'file_type'],
  ['lib: typeList / sizeLabel / acceptAttr', att.typeList({ maxBytes: 1, types: { pdf: '', jpg: '', jpeg: '', png: '' } }, 'or') === 'PDF, JPG or PNG' && att.sizeLabel(4194304) === '4 MB' && att.acceptAttr({ maxBytes: 1, types: { pdf: '', png: '' } }) === '.pdf,.png'],
  ['lib: safeName', att.safeName('../../x/.hidden', 'pdf') === 'attachment.pdf' && att.safeName('../../x/..notes.txt', 'pdf') === 'notes.pdf' && att.safeName('', 'pdf') === 'attachment.pdf' && att.safeName('a'.repeat(300) + '.pdf', 'pdf').length === 100],
];
for (const [name, ok] of lib_cases) console.log(ok ? 'PASS' : 'FAIL', name);
const lib_ok = lib_cases.every(([, ok]) => ok);

const total = pass + (mw_ok.every(Boolean) ? 1 : 0) + (lib_ok ? 1 : 0);
console.log(`${total}/${cases.length + 2} passed`);
if (total !== cases.length + 2) process.exit(1);
