/** Server-side Turnstile check: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/ */
export async function verifyTurnstile(token: string, secret: string, ip?: string | null): Promise<boolean> {
  if (!token) return false;
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  if (!r.ok) return false;
  const data = (await r.json()) as { success?: boolean };
  return data.success === true;
}
