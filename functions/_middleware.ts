/*
 * Country pop-up, edge part (scope 2.3). Runs on every request; acts only on Global HTML pages.
 * On a Global page, if the visitor has not chosen an edition yet (no `ch_edition` cookie), put the country
 * Cloudflare detected into a short-lived, script-readable cookie `ch_geo` (e.g. "AE", "SA", "IN").
 * The page script (src/components/CountryPopupLogic.astro) reads it and opens the Figma pop-up (UI pending).
 * Nothing happens on /ae or /sa. Nothing is stored server-side.
 */
import type { PagesContext } from './_lib/types';

// Regional prefixes, kept in sync with src/data/editions.json (regions with a path).
const REGIONAL = ['ae', 'sa'];

export const onRequest = async ({ request, next }: PagesContext) => {
  const res = await next();
  const url = new URL(request.url);
  const first = url.pathname.split('/')[1] ?? '';
  const isHtml = (res.headers.get('Content-Type') ?? '').includes('text/html');
  if (!isHtml || request.method !== 'GET' || REGIONAL.includes(first) || first === 'api') return res;

  const cookies = request.headers.get('Cookie') ?? '';
  if (/(^|;\s*)ch_edition=/.test(cookies) || /(^|;\s*)ch_geo=/.test(cookies)) return res;

  const country = (request.cf?.country ?? request.headers.get('CF-IPCountry') ?? 'XX').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || 'XX';
  const out = new Response(res.body, res);
  out.headers.append('Set-Cookie', `ch_geo=${country}; Path=/; Max-Age=86400; SameSite=Lax; Secure`);
  // The HTML now varies per visitor on first visit; keep shared caches from storing this variant.
  out.headers.set('Cache-Control', 'private, no-store');
  return out;
};
