// Minimal Cloudflare Pages Functions types (avoids a dependency on @cloudflare/workers-types).
export interface Env {
  /** Turnstile secret key (server side). The public site key is PUBLIC_TURNSTILE_SITE_KEY at build time. */
  TURNSTILE_SECRET_KEY?: string;
  /** Which email adapter sends the submission: resend | postmark | sendgrid | smtp | none. See functions/_lib/email.ts */
  EMAIL_PROVIDER?: string;
  EMAIL_API_KEY?: string;
  /** EMAIL_PROVIDER=smtp: the mail server (STARTTLS on 587 / 25, implicit TLS on 465) and its login. */
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  /** Sender, e.g. "Cambridge Hospital Website <no-reply@cambridgehospital.com>" */
  MAIL_FROM?: string;
  /**
   * Inbox per form type (scope 2.7), one variable each: FORM_TO_BOOK_APPOINTMENT, FORM_TO_SEND_ENQUIRY, FORM_TO_FEEDBACK,
   * FORM_TO_REFER_PATIENT (the form's `inbox` in src/data/forms.json, upper-cased). Value: "a@x, b@x" for every region,
   * or JSON { "global": "a@x", "ae": "b@x", "sa": "c@x" } for a different inbox per region.
   */
  [key: `FORM_TO_${string}`]: string | undefined;
  /** Comma-separated origins allowed to post (defaults to the request's own origin). */
  ALLOWED_ORIGINS?: string;
  /** "true" only in .dev.vars: lets EMAIL_PROVIDER=none accept submissions without sending (never in production). */
  LOCAL_DEV?: string;
}

export interface PagesContext<P extends string = string> {
  request: Request & { cf?: { country?: string } };
  env: Env;
  params: Record<P, string | string[]>;
  next: () => Promise<Response>;
}
