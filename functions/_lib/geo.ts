/*
 * Country detection for the Global country pop-up (scope 2.3, bug 083), shared by the Cloudflare Pages middleware
 * (functions/_middleware.ts) and the Vercel Routing Middleware (middleware.ts at the project root).
 * Sources, first one with a real ISO country wins:
 *   1. request.cf.country      Cloudflare Workers / Pages
 *   2. CF-IPCountry header     Cloudflare proxying in front of another host (it must win over Vercel's header there,
 *                              since Vercel would only see Cloudflare's edge IP)
 *   3. x-vercel-ip-country     Vercel
 * Unknown ("XX"), Tor ("T1"), missing or malformed values = null: nothing is stored and no pop-up is offered. A guessed
 * country is never written as a detected one.
 */

// Regional prefixes, kept in sync with src/data/editions.json (regions with a path).
export const REGIONAL = ["ae", "sa"];

/** "ae" / " SA " -> "AE" / "SA"; null for anything that is not a real two-letter country. */
export function normaliseCountry(v: string | null | undefined): string | null {
  const c = (v ?? "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(c) && c !== "XX" && c !== "T1" ? c : null;
}

export function detectCountry(
  headers: Headers,
  cf?: { country?: string } | null,
): string | null {
  return (
    normaliseCountry(cf?.country) ??
    normaliseCountry(headers.get("CF-IPCountry")) ??
    normaliseCountry(headers.get("x-vercel-ip-country"))
  );
}

/** A Global edition page (EN or AR), not /ae, /sa or /api. */
export function isGlobalPath(pathname: string): boolean {
  const first = pathname.split("/")[1] ?? "";
  return !REGIONAL.includes(first) && first !== "api";
}

/** The visitor already chose an edition (ch_edition) or was already detected (ch_geo): leave the response alone. */
export function hasGeoOrChoice(cookieHeader: string | null): boolean {
  const c = cookieHeader ?? "";
  return /(^|;\s*)ch_edition=/.test(c) || /(^|;\s*)ch_geo=/.test(c);
}

/** Short-lived, script-readable cookie read by src/components/CountryPopupLogic.astro. */
export const geoCookie = (country: string) =>
  `ch_geo=${country}; Path=/; Max-Age=86400; SameSite=Lax; Secure`;
