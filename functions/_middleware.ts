/*
 * Country pop-up, edge part (scope 2.3). Runs on every request; acts only on Global HTML pages.
 * On a Global page, if the visitor has not chosen an edition yet (no `ch_edition` cookie), put the detected country
 * (functions/_lib/geo.ts: Cloudflare cf.country / CF-IPCountry, else Vercel's x-vercel-ip-country) into a short-lived,
 * script-readable cookie `ch_geo` (e.g. "AE", "SA", "IN"). Unknown country = no cookie (bug 083: never a guess).
 * The page script (src/components/CountryPopupLogic.astro) reads it and opens the matching pop-up, if any.
 * Nothing happens on /ae or /sa. Nothing is stored server-side. Vercel runs the same logic from middleware.ts.
 */
import type { PagesContext } from "./_lib/types";
import {
  detectCountry,
  geoCookie,
  hasGeoOrChoice,
  isGlobalPath,
} from "./_lib/geo";

export const onRequest = async ({ request, next }: PagesContext) => {
  const res = await next();
  const url = new URL(request.url);
  const isHtml = (res.headers.get("Content-Type") ?? "").includes("text/html");
  if (!isHtml || request.method !== "GET" || !isGlobalPath(url.pathname))
    return res;
  if (hasGeoOrChoice(request.headers.get("Cookie"))) return res;

  const country = detectCountry(request.headers, request.cf);
  if (!country) return res;
  const out = new Response(res.body, res);
  out.headers.append("Set-Cookie", geoCookie(country));
  // The HTML now varies per visitor on first visit; keep shared caches from storing this variant.
  out.headers.set("Cache-Control", "private, no-store");
  return out;
};
