import type { Env } from './types';

export interface Mail {
  to: string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

/*
 * Pluggable email adapters. Pick one with EMAIL_PROVIDER until Pramod decides.
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
  if (!r.ok) throw new Error(`resend ${r.status}`);
};

const postmark: Adapter = async (m, env) => {
  const r = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: { 'X-Postmark-Server-Token': env.EMAIL_API_KEY ?? '', 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ From: env.MAIL_FROM, To: m.to.join(','), Subject: m.subject, TextBody: m.text, HtmlBody: m.html, ReplyTo: m.replyTo, MessageStream: 'outbound' }),
  });
  if (!r.ok) throw new Error(`postmark ${r.status}`);
};

const sendgrid: Adapter = async (m, env) => {
  const r = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.EMAIL_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: m.to.map((email) => ({ email })) }],
      from: { email: env.MAIL_FROM },
      reply_to: m.replyTo ? { email: m.replyTo } : undefined,
      subject: m.subject,
      content: [{ type: 'text/plain', value: m.text }, { type: 'text/html', value: m.html }],
      tracking_settings: { click_tracking: { enable: false }, open_tracking: { enable: false } },
    }),
  });
  if (!r.ok) throw new Error(`sendgrid ${r.status}`);
};

/** Local development only: accepts the submission and sends nothing (and logs nothing). */
const none: Adapter = async () => {};

const adapters: Record<string, Adapter> = { resend, postmark, sendgrid, none };

export async function sendMail(mail: Mail, env: Env): Promise<void> {
  const name = (env.EMAIL_PROVIDER ?? '').toLowerCase();
  const adapter = adapters[name];
  if (!adapter) throw new Error(`EMAIL_PROVIDER "${name}" is not configured`);
  if (name !== 'none' && (!env.EMAIL_API_KEY || !env.MAIL_FROM)) throw new Error('EMAIL_API_KEY / MAIL_FROM missing');
  await adapter(mail, env);
}
