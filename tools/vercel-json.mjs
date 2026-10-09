// Writes vercel.json for the Vercel staging link from dist/_redirects (run after `npm run build`).
// Vercel ignores Cloudflare's _redirects file, so the 301s are copied into vercel.json, both forms (/events and /events/),
// each straight to its target. Trailing slash (bug 057, Astro trailingSlash 'always' + build.format 'directory'): every page
// is dist/<path>/index.html, served at /<path>/; the last rule 301s any other slash-less page URL to /<path>/ in one hop.
// Vercel's own `trailingSlash: true` is not used: it runs before these redirects, so /events would go /events/ -> target
// (two hops). The rule skips files (a dot in the last segment: /favicon.svg, /sitemaps/ae-en.xml), /api (form POSTs) and
// /_astro. Forms run on Vercel through api/forms/[form].ts (a wrapper around the Cloudflare handler); the country header
// middleware (functions/_middleware.ts) does not run on Vercel.
import { readFileSync, writeFileSync } from 'node:fs';

const redirects = readFileSync('dist/_redirects', 'utf8')
  .split('\n')
  .map((line) => line.trim().split(/\s+/))
  .filter(([from, to]) => from && to)
  // A Cloudflare splat source "/sa/doctor/*" (bug 059 / 060) = Vercel "/sa/doctor/:splat(.*)"; order kept (splats come last).
  // Not ":splat*": Vercel compiles sources with path-to-regexp in strict mode, where ":splat*" matches "/testimonial/amani"
  // but NOT the live "/testimonial/amani/" (the trailing slash is not a segment) -> 404 on staging (bug 061, 9 Oct 2026).
  // "(.*)" takes any rest, slash included. The Arabic sources are already listed in both hex cases (src/pages/[redirects].ts).
  .map(([from, to, code]) => ({ source: from.replace(/\/\*$/, '/:splat(.*)'), destination: to, statusCode: Number(code) || 301 }));

const config = {
  $schema: 'https://openapi.vercel.sh/vercel.json',
  framework: null,
  buildCommand: 'npm run build',
  outputDirectory: 'dist',
  redirects: [
    ...redirects,
    { source: '/:path((?!api/|_astro/)(?:[^/]+/)*[^/.]+)', destination: '/:path/', statusCode: 301 },
  ],
};

writeFileSync('vercel.json', JSON.stringify(config, null, 2) + '\n');
console.log(`vercel.json: ${redirects.length} redirects + trailing-slash rule`);
