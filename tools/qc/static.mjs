// Static QC over EVERY built page (dist/**/*.html), no browser: title + meta description, canonical, hreflang set, one h1,
// heading order, images with alt + width + height, lazy loading below the fold (every <img> except the eager hero ones carries
// loading="lazy"), robots on the 404 pages. Prints a summary and writes JSON for the QC report.
// Usage: node tools/qc/static.mjs [dist=dist] [out=docs/qc/static.json]
import fs from 'node:fs';
import { SITE_URL } from '../../site.config.mjs';
import path from 'node:path';

const dist = process.argv[2] ?? 'dist';
const out = process.argv[3] ?? 'docs/qc/static.json';
const SITE = SITE_URL; // site.config.mjs (bug 057: https://cambridgehospital.com)

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.html') ? [path.join(d, e.name)] : []));
const files = walk(dist).filter((f) => !f.includes('/_astro/'));
// attribute value; a bare attribute (`alt` = empty string, how Astro prints alt="") counts as present
const attr = (tag, name) => { const m = tag.match(new RegExp(`\\s${name}(?:\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+)))?(?=[\\s/>])`, 'i')); return m ? (m[2] ?? m[3] ?? m[4] ?? '') : null; };
const isRaster = (tag) => /\.(png|jpe?g|webp|avif|gif)(\?|"|'|\s|$)/i.test(attr(tag, 'src') ?? '');

const results = [];
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const url = '/' + path.relative(dist, f).replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, ''); // bug 057: /contact-us/ (dir/index.html), /ae/404
  const is404 = /(^|\/)404$/.test(url);
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1]?.trim() ?? '';
  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? '';
  const hreflang = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)"/g)].map((m) => m[1]);
  const robots = html.match(/<meta name="robots" content="([^"]*)"/)?.[1] ?? '';
  const lang = html.match(/<html lang="([^"]+)" dir="(ltr|rtl)"/);
  const h1 = (html.match(/<h1\b/g) ?? []).length;
  // heading order: no level skipped downward (h2 -> h4) inside <main>
  const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
  const levels = [...main.matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]));
  let skips = 0, prev = 1;
  for (const l of levels) { if (l > prev + 1) skips++; prev = l; }
  const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  const noAlt = imgs.filter((t) => attr(t, 'alt') === null).length;
  const noSize = imgs.filter((t) => attr(t, 'width') === null || attr(t, 'height') === null).length;
  const eager = imgs.filter((t) => attr(t, 'loading') === 'eager' || attr(t, 'fetchpriority') === 'high').length;
  // lazy loading: every RASTER image that is not the eager hero must carry loading="lazy" (inline SVG icons are not counted)
  const noLoading = imgs.filter((t) => isRaster(t) && attr(t, 'loading') === null && attr(t, 'fetchpriority') !== 'high').length;
  const svgNoLoading = imgs.filter((t) => !isRaster(t) && attr(t, 'loading') === null).length;
  const expectedCanonical = SITE + url.replace(/^\/$/, '/');
  results.push({
    url, title, descLen: desc.length, canonicalOk: canonical === expectedCanonical || (url === '/' && canonical === SITE + '/'), canonical,
    hreflang: hreflang.length, hreflangOk: is404 ? hreflang.length === 0 : hreflang.length >= 3 && hreflang.includes('x-default'),
    lang: lang ? `${lang[1]} ${lang[2]}` : '', h1, skips, imgs: imgs.length, noAlt, noSize, eager, noLoading, svgNoLoading, robots, is404,
  });
}

const fails = {
  title: results.filter((r) => !r.title),
  desc: results.filter((r) => !r.descLen),
  canonical: results.filter((r) => !r.canonicalOk),
  hreflang: results.filter((r) => !r.hreflangOk),
  h1: results.filter((r) => r.h1 !== 1),
  skips: results.filter((r) => r.skips > 0),
  noAlt: results.filter((r) => r.noAlt > 0),
  noSize: results.filter((r) => r.noSize > 0),
  noLoading: results.filter((r) => r.noLoading > 0),
  robots404: results.filter((r) => r.is404 && !/noindex/.test(r.robots)),
};
const summary = Object.fromEntries(Object.entries(fails).map(([k, v]) => [k, v.length]));
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ pages: results.length, summary, fails: Object.fromEntries(Object.entries(fails).map(([k, v]) => [k, v.slice(0, 40).map((r) => r.url)])), results }, null, 1));
console.log(`pages: ${results.length}`);
console.log(JSON.stringify(summary));
for (const [k, v] of Object.entries(fails)) if (v.length) console.log(`  ${k}: ${v.slice(0, 6).map((r) => r.url + (k === 'h1' ? ` (${r.h1})` : k === 'skips' ? ` (${r.skips})` : k === 'noLoading' ? ` (${r.noLoading}/${r.imgs})` : '')).join(', ')}${v.length > 6 ? ` ... +${v.length - 6}` : ''}`);
