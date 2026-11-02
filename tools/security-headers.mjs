// Security response headers for every page (client security review, 30 Oct 2026: the live site sent only
// X-Content-Type-Options). Written into dist/_headers under "/*" by securityHeaders() in astro.config.mjs after each build;
// the Azure page server (tools/azure/handler.ts) applies dist/_headers to every file it serves, Vercel staging gets the same
// block in vercel.json (tools/vercel-json.mjs reads dist/_headers), Cloudflare Pages reads _headers natively.
//
// Content-Security-Policy without 'unsafe-inline' for scripts: the pages' inline scripts (BaseLayout aos flag, Footer reveal,
// CountryPopupLogic) are allowed by their SHA-256 hash, computed from the built HTML. That only works while every inline script
// is the SAME on every page (CountryPopupLogic keeps its per-page config in a <script type="application/json"> element, which
// the browser never runs and the policy ignores). Astro also inlines its small per-page-type <script type="module"> chunks
// (doctor filters, leaders, modals...: 6 on 30 Oct 2026, identical on every page that uses them). A new per-page inline script
// would produce hundreds of hashes, so the build fails above MAX_INLINE_SCRIPTS: move the varying part into a JSON element or
// an external script (src/scripts/).
// Third parties, each only where the site loads it (nothing else runs on the pages):
//   - Cloudflare Turnstile on the forms: script + frame from challenges.cloudflare.com (src/scripts/forms.ts)
//   - Google Maps JavaScript API on Contact Us (src/scripts/contact-map.ts): Google's published CSP list for the Maps API
//     (scripts / tiles / fonts from *.googleapis.com, *.gstatic.com, *.google.com, *.googleusercontent.com, *.ggpht.com;
//     blob: workers for the vector renderer); the pin icons are data: SVGs
//   - click-to-play videos (src/scripts/video-facade.ts): frames from www.youtube-nocookie.com and player.vimeo.com
// 'unsafe-inline' stays for styles only: the pages carry hundreds of style="" attributes (Figma positions) and Maps injects
// its own; a style policy cannot be hashed per attribute.
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

export const MAX_INLINE_SCRIPTS = 24;

/** Content-Security-Policy for the pages, given the base64 SHA-256 hashes of the inline scripts. */
export function contentSecurityPolicy(hashes) {
  const inline = hashes.map((h) => `'sha256-${h}'`).join(' ');
  return [
    `default-src 'self'`,
    `script-src 'self' ${inline} https://challenges.cloudflare.com https://maps.googleapis.com https://*.gstatic.com https://*.google.com https://*.ggpht.com https://*.googleusercontent.com blob:`.replace(/\s+/g, ' '),
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `img-src 'self' data: https://*.googleapis.com https://*.gstatic.com https://*.google.com https://*.googleusercontent.com https://*.ggpht.com`,
    `font-src 'self' https://fonts.gstatic.com`,
    `connect-src 'self' https://*.googleapis.com https://*.gstatic.com https://*.google.com data: blob:`,
    `frame-src https://challenges.cloudflare.com https://www.youtube-nocookie.com https://player.vimeo.com https://*.google.com`,
    `worker-src blob:`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'self'`,
    `upgrade-insecure-requests`,
  ].join('; ');
}

/** The header block for every path, as [name, value] pairs. */
export function securityHeaders(hashes) {
  return [
    // One year, this host only: the client's other subdomains are not ours to force onto HTTPS (no includeSubDomains / preload).
    ['Strict-Transport-Security', 'max-age=31536000'],
    ['Content-Security-Policy', contentSecurityPolicy(hashes)],
    ['X-Frame-Options', 'SAMEORIGIN'],
    ['X-Content-Type-Options', 'nosniff'],
    ['Referrer-Policy', 'strict-origin-when-cross-origin'],
    ['Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()'],
  ];
}

/** Inline (no src) executable scripts in one HTML document: their exact text. JSON / JSON-LD / template scripts are skipped. */
export function inlineScripts(html) {
  const out = [];
  const re = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    const attrs = m[1] ?? '';
    if (/\ssrc\s*=/i.test(attrs)) continue;
    const type = /\stype\s*=\s*["']?([^"'\s>]+)/i.exec(attrs)?.[1]?.toLowerCase();
    if (type && type !== 'module' && type !== 'text/javascript' && type !== 'application/javascript') continue;
    out.push(m[2]);
  }
  return out;
}

export const sha256 = (text) => createHash('sha256').update(text, 'utf8').digest('base64');

/** Unique inline-script hashes across every HTML file under root, with the first page each was seen on. */
export async function inlineScriptHashes(root) {
  const files = (await readdir(root, { recursive: true })).filter((f) => f.endsWith('.html')).sort(); // sorted: a stable hash order in the header
  const seen = new Map();
  for (const f of files) {
    for (const script of inlineScripts(await readFile(join(root, f), 'utf8'))) {
      const h = sha256(script);
      if (!seen.has(h)) seen.set(h, { page: f, head: script.trim().slice(0, 80) });
    }
  }
  return seen;
}

/** The "/*" rule in Cloudflare _headers format, appended to dist/_headers by the build. */
export function headersRule(hashes) {
  return ['/*', ...securityHeaders(hashes).map(([k, v]) => `  ${k}: ${v}`)].join('\n') + '\n';
}

/** Hashes the built pages' inline scripts; throws when a page-specific inline script has crept in. */
export async function buildHeadersRule(root) {
  const seen = await inlineScriptHashes(root);
  if (seen.size > MAX_INLINE_SCRIPTS) {
    const list = [...seen.values()].slice(0, 12).map((s) => `  ${s.page}: ${s.head}`).join('\n');
    throw new Error(
      `security headers: ${seen.size} different inline scripts in the build (limit ${MAX_INLINE_SCRIPTS}); a script that differs per page ` +
        `cannot be allowed by hash. Keep its data in a <script type="application/json"> element (CountryPopupLogic.astro) or move it to src/scripts/.\n${list}`,
    );
  }
  return { rule: headersRule([...seen.keys()]), hashes: [...seen.keys()] };
}
