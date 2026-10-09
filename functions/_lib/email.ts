import type { Env } from './types';
import { sendSmtp } from './smtp';

export interface Mail {
  to: string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

/*
 * Pluggable email adapters. Pick one with EMAIL_PROVIDER: resend | postmark | sendgrid | smtp | none.
 * "Nothing stored" (scope 2.7): this code keeps no copy. Most providers retain message logs/content by default —
 * turn content retention off in the provider's settings, or use an SMTP relay on the client's own mail system
 * (add an adapter here using Workers TCP sockets, `cloudflare:sockets`).
 */
type Adapter = (mail: Mail, env: Env) => Promise<void>;

const resend: Adapter = async (m, env) => {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.EMAIL_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.MAIL_FROM, to: m.to, subject: m.subject, text: m.text, html: m.html, reply_to: m.replyTo }),
  });
  if (!r.ok) throw new Error(`resend ${r.status}${await reason(r)}`);
};

const postmark: Adapter = async (m, env) => {
  const r = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: { 'X-Postmark-Server-Token': env.EMAIL_API_KEY ?? '', 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ From: env.MAIL_FROM, To: m.to.join(','), Subject: m.subject, TextBody: m.text, HtmlBody: m.html, ReplyTo: m.replyTo, MessageStream: 'outbound' }),
  });
  if (!r.ok) throw new Error(`postmark ${r.status}${await reason(r)}`);
};

const sendgrid: Adapter = async (m, env) => {
  const r = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.EMAIL_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: m.to.map((email) => ({ email })) }],
      // SendGrid wants { email, name }, not the "Name <address>" form MAIL_FROM uses (.env.example).
      from: address(mailFrom(env)),
      reply_to: m.replyTo ? { email: m.replyTo } : undefined,
      subject: m.subject,
      content: [{ type: 'text/plain', value: m.text }, { type: 'text/html', value: m.html }],
      tracking_settings: { click_tracking: { enable: false }, open_tracking: { enable: false } },
    }),
  });
  if (!r.ok) throw new Error(`sendgrid ${r.status}${await reason(r)}`);
};

/**
 * Local development only: accepts the submission and sends nothing (and logs nothing). Refused unless LOCAL_DEV=true
 * (.dev.vars), so a production deployment with EMAIL_PROVIDER=none cannot silently discard submissions (-> 500 not_configured).
 */
const none: Adapter = async (_m, env) => {
  if (env.LOCAL_DEV !== 'true') throw new Error('EMAIL_PROVIDER "none" is for local development only (set LOCAL_DEV=true)');
};

/** The client's own mail server (or Gmail) over SMTP: SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS, see functions/_lib/smtp.ts. */
const smtp: Adapter = (m, env) =>
  sendSmtp(m, { host: env.SMTP_HOST!, port: Number(env.SMTP_PORT) || 587, user: env.SMTP_USER!, pass: env.SMTP_PASS!, from: address(mailFrom(env)) });

const adapters: Record<string, Adapter> = { resend, postmark, sendgrid, smtp, none };

/** MAIL_FROM, or for SMTP the account itself (Gmail and most relays rewrite any other sender anyway). */
const mailFrom = (env: Env) => env.MAIL_FROM?.trim() || ((env.EMAIL_PROVIDER ?? '').trim().toLowerCase() === 'smtp' && env.SMTP_USER ? `Cambridge Hospital Website <${env.SMTP_USER}>` : '');

/**
 * What is missing in the email settings (variable names only, never values), or undefined when sendMail can run.
 * The form function checks this BEFORE Turnstile, so a deployment without email settings answers "not_configured"
 * at once and says why in the log, instead of failing later or looking like a spam-check problem.
 */
export function mailConfigError(env: Env): string | undefined {
  const name = (env.EMAIL_PROVIDER ?? '').trim().toLowerCase();
  if (!Object.hasOwn(adapters, name)) return `EMAIL_PROVIDER "${name}" is not one of ${Object.keys(adapters).join(' | ')}`;
  if (name === 'none') return env.LOCAL_DEV === 'true' ? undefined : 'EMAIL_PROVIDER "none" is for local development only (set LOCAL_DEV=true)';
  const needed = name === 'smtp' ? (['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'] as const) : (['EMAIL_API_KEY', 'MAIL_FROM'] as const);
  const missing = needed.filter((k) => !env[k]?.trim());
  if (missing.length) return `${missing.join(' / ')} missing`;
  if (!address(mailFrom(env)).email) return 'MAIL_FROM is not an email address ("Name <address>" or "address")';
  return undefined;
}

export async function sendMail(mail: Mail, env: Env): Promise<void> {
  const problem = mailConfigError(env);
  if (problem) throw new Error(problem);
  await adapters[(env.EMAIL_PROVIDER ?? '').trim().toLowerCase()](mail, env);
}

/** "Name <a@b>" | "a@b" -> { email, name? } */
function address(v: string): { email: string; name?: string } {
  const m = /^\s*(?:"?([^"<]*?)"?\s*)?<([^<>\s]+@[^<>\s]+)>\s*$/.exec(v);
  if (m) return m[1] ? { email: m[2], name: m[1] } : { email: m[2] };
  const plain = v.trim();
  return { email: /^[^\s@<>]+@[^\s@<>]+$/.test(plain) ? plain : '' };
}

/**
 * The provider's own error text for the log (e.g. "domain is not verified"), short and with any email address masked:
 * some providers echo the recipient or reply-to (= the visitor's address) back, and the log must not hold form data.
 */
async function reason(r: Response): Promise<string> {
  try {
    const t = (await r.text()).replace(/[^\s"'<>,;:]+@[^\s"'<>,;:]+/g, '<email>').replace(/\s+/g, ' ').trim();
    return t ? `: ${t.slice(0, 300)}` : '';
  } catch {
    return '';
  }
}
