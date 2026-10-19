/** Server-side Turnstile check: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/ */
// Siteverify codes that mean OUR setup is wrong (bad / missing secret), not the visitor: answered as "not_configured".
const SETUP_ERRORS = ['missing-input-secret', 'invalid-input-secret'];

/** 'ok' = human; 'failed' = no / bad / expired token (visitor retries); 'config' = secret rejected or siteverify unreachable. */
export async function verifyTurnstile(token: string, secret: string, ip?: string | null): Promise<'ok' | 'failed' | 'config'> {
  if (!token) return 'failed';
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  let r: Response;
  try {
    r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  } catch {
    console.error('turnstile: siteverify unreachable');
    return 'config';
  }
  if (!r.ok) {
    console.error(`turnstile: siteverify ${r.status}`);
    return 'config';
  }
  const data = (await r.json().catch(() => ({}))) as { success?: boolean; 'error-codes'?: string[] };
  if (data.success === true) return 'ok';
  const codes = data['error-codes'] ?? [];
  if (codes.some((c) => SETUP_ERRORS.includes(c))) {
    console.error(`turnstile: secret rejected (${codes.join(', ')}); check TURNSTILE_SECRET_KEY`);
    return 'config';
  }
  return 'failed';
}
