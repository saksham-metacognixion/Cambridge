/*
 * POST /api/forms/<form>  — Book an Appointment, Send an Enquiry, Refer a Patient, "We are listening".
 * Validate -> verify Turnstile -> send ONE email -> answer. Nothing is stored: no database, no KV, no logs of
 * submissions (errors are logged by type only, never with field values).
 *
 * Request: multipart/form-data or urlencoded, fields per src/data/forms.json, plus
 *   consent=on (required on every form), cf-turnstile-response (added by the Turnstile widget), edition=<global|ae|sa>-<en|ar>.
 * Response: JSON { ok: true } | { ok: false, error, fields?: { <name>: "required" | "invalid" | "too_long" } } when the
 * client asks for JSON (Accept: application/json); otherwise a 303 back to the page with ?form=sent|error, so the
 * form also works without JavaScript. The EN/AR messages for these codes live with the form UI (not built yet).
 */
import formsConfig from '../../../src/data/forms.json';
import type { PagesContext } from '../../_lib/types';
import { verifyTurnstile } from '../../_lib/turnstile';
import { sendMail } from '../../_lib/email';

type Field = { name: string; type: string; required: boolean; max: number };
const forms = formsConfig.forms as Record<string, { subject: string; fields: Field[] }>;
const REGIONS = ['global', 'ae', 'sa'];
const MAX_BODY = 32 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const onRequestPost = async ({ request, env, params }: PagesContext<'form'>) => {
  const wantsJson = (request.headers.get('Accept') ?? '').includes('application/json');
  const back = (status: 'sent' | 'error') => {
    const ref = request.headers.get('Referer');
    const url = new URL(ref && sameOrigin(ref, request) ? ref : '/', request.url);
    url.searchParams.set('form', status);
    return Response.redirect(url.toString(), 303);
  };
  const fail = (status: number, error: string, fields?: Record<string, string>) =>
    wantsJson ? json({ ok: false, error, ...(fields ? { fields } : {}) }, status) : back('error');

  const formId = String(params.form);
  const form = forms[formId];
  if (!form) return fail(404, 'unknown_form');

  if (!originAllowed(request, env.ALLOWED_ORIGINS)) return fail(403, 'origin');
  if (Number(request.headers.get('Content-Length') ?? 0) > MAX_BODY) return fail(413, 'too_large');

  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    return fail(400, 'bad_request');
  }

  // Validation (required, format, length) + consent on every form.
  const fields: Record<string, string> = {};
  const values: Record<string, string> = {};
  for (const f of form.fields) {
    const v = String(data.get(f.name) ?? '').trim();
    values[f.name] = v;
    if (f.required && !v) fields[f.name] = 'required';
    else if (v && v.length > f.max) fields[f.name] = 'too_long';
    else if (v && f.type === 'email' && !EMAIL_RE.test(v)) fields[f.name] = 'invalid';
  }
  const consent = String(data.get('consent') ?? '');
  if (!['on', 'true', '1', 'yes'].includes(consent)) fields.consent = 'required';
  if (Object.keys(fields).length) return fail(422, 'validation', fields);

  // Spam protection.
  if (!env.TURNSTILE_SECRET_KEY) return fail(500, 'not_configured');
  const human = await verifyTurnstile(String(data.get('cf-turnstile-response') ?? ''), env.TURNSTILE_SECRET_KEY, request.headers.get('CF-Connecting-IP'));
  if (!human) return fail(403, 'turnstile');

  // Recipient for this form in this region.
  const edition = String(data.get('edition') ?? 'global-en');
  const region = REGIONS.includes(edition.split('-')[0]) ? edition.split('-')[0] : 'global';
  let to: string | undefined;
  try {
    const map = JSON.parse(env.FORM_RECIPIENTS ?? '{}') as Record<string, Record<string, string>>;
    to = map[formId]?.[region] ?? map[formId]?.global;
  } catch {
    to = undefined;
  }
  if (!to) return fail(500, 'not_configured');

  const rows = form.fields.map((f) => [f.name, values[f.name]] as const);
  rows.push(['edition', edition], ['consent', 'yes']);
  try {
    await sendMail(
      {
        to: to.split(',').map((s) => s.trim()).filter(Boolean),
        subject: `${form.subject} — website (${edition})`,
        text: rows.map(([k, v]) => `${k}: ${v}`).join('\n'),
        html: `<table>${rows.map(([k, v]) => `<tr><th align="left">${esc(k)}</th><td>${esc(v).replace(/\n/g, '<br>')}</td></tr>`).join('')}</table>`,
        replyTo: EMAIL_RE.test(values.email ?? '') ? values.email : undefined,
      },
      env,
    );
  } catch (e) {
    console.error(`form ${formId}: send failed (${e instanceof Error ? e.message : 'unknown'})`);
    return fail(502, 'send_failed');
  }
  return wantsJson ? json({ ok: true }) : back('sent');
};

export const onRequest = () => new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function sameOrigin(url: string, req: Request) {
  try {
    return new URL(url).origin === new URL(req.url).origin;
  } catch {
    return false;
  }
}
function originAllowed(req: Request, allowed?: string) {
  const origin = req.headers.get('Origin');
  if (!origin) return true; // same-origin form posts from older browsers may omit it; Turnstile still applies
  const list = allowed ? allowed.split(',').map((s) => s.trim()) : [new URL(req.url).origin];
  return list.includes(origin);
}
