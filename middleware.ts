/*
 * Country pop-up, edge part on Vercel (bug 083). Vercel does not run Cloudflare Pages Functions, so without this file
 * functions/_middleware.ts never ran on the staging link and every visitor looked "unknown". Same logic, shared through
 * functions/_lib/geo.ts: on a Global page request with no `ch_edition` / `ch_geo` cookie, the detected country
 * (x-vercel-ip-country, or Cloudflare's header if Cloudflare sits in front) goes into the `ch_geo` cookie. Unknown
 * country = the request passes untouched. No dependency: `x-middleware-next` is what @vercel/functions' next() sends.
 */
import {
  detectCountry,
  geoCookie,
  hasGeoOrChoice,
  isGlobalPath,
} from "./functions/_lib/geo.js"; // explicit .js: Vercel transpiles this file without bundling it

// Pages only: no built assets, no file with an extension (images, fonts, sitemaps...), no API.
export const config = { matcher: ["/((?!_astro/|api/|.*\\.[A-Za-z0-9]+$).*)"] };

export default function middleware(request: Request): Response | undefined {
  if (request.method !== "GET" || !isGlobalPath(new URL(request.url).pathname))
    return;
  if (!(request.headers.get("Accept") ?? "").includes("text/html")) return;
  if (hasGeoOrChoice(request.headers.get("Cookie"))) return;
  const country = detectCountry(request.headers);
  if (!country) return;
  return new Response(null, {
    headers: {
      "x-middleware-next": "1",
      "Set-Cookie": geoCookie(country),
      "Cache-Control": "private, no-store",
    },
  });
}
