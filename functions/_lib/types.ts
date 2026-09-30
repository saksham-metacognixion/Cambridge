// Minimal Cloudflare Pages Functions types (avoids a dependency on @cloudflare/workers-types).
export interface Env {
  /** Turnstile secret key (server side). The public site key is PUBLIC_TURNSTILE_SITE_KEY at build time. */
  TURNSTILE_SECRET_KEY?: string;
  /** Which email adapter sends the submission: resend | postmark | sendgrid | none. See functions/_lib/email.ts */
  EMAIL_PROVIDER?: string;
  EMAIL_API_KEY?: string;
  /** Sender, e.g. "Cambridge Hospital Website <no-reply@cambridgehospital.com>" */
  MAIL_FROM?: string;
  /** JSON: { "<form>": { "global": "a@x", "ae": "b@x", "sa": "c@x" } } — the inbox for each form in each region. */
  FORM_RECIPIENTS?: string;
  /** Comma-separated origins allowed to post (defaults to the request's own origin). */
  ALLOWED_ORIGINS?: string;
}

export interface PagesContext<P extends string = string> {
  request: Request & { cf?: { country?: string } };
  env: Env;
  params: Record<P, string | string[]>;
  next: () => Promise<Response>;
}
