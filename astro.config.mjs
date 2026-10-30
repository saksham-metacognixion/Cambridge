// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { SITE_URL } from './site.config.mjs';
import { readdir, readFile, rename, rmdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { transform as lightningTransform, Features } from 'lightningcss';
import { loadEnv } from 'vite';

// Bug 209 (19 Oct 2026): the Contact Us map key is baked in at build time (ContactForm.astro). A deploy whose environment lacks
// it built silently and shipped the placeholder map, so say so in the build log. A warning only: an unconfigured environment
// still builds and shows the placeholder (scripts/contact-map.ts).
if (!(process.env.PUBLIC_GOOGLE_MAPS_KEY || loadEnv('production', process.cwd(), 'PUBLIC_').PUBLIC_GOOGLE_MAPS_KEY))
  console.warn('[contact-map] PUBLIC_GOOGLE_MAPS_KEY is not set for this build: Contact Us pages will show the placeholder map');

/**
 * Cache-busting for the self-hosted fonts (performance audit, 10 Oct 2026). The fonts stay in public/fonts/ (project rule) under
 * fixed names, so a host could either revalidate them on every visit (Vercel: max-age=0) or cache them for a year and keep
 * serving an old file after a fix (the U+00A0 patch of 10 Oct). This pass appends a content hash, /fonts/Gotham-Book.woff2?v=1a2b3c4d,
 * to every font URL in the built CSS and HTML (@font-face src + preload links), so /fonts/* can be cached as immutable on
 * every host (vercel.json, public/_headers, deploy/nginx) and a changed file gets a new URL on the next build.
 */
function fontVersions() {
  return {
    name: 'font-versions',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const fonts = (await readdir(join(root, 'fonts'))).filter((f) => f.endsWith('.woff2'));
        const hash = {};
        for (const f of fonts) hash[f] = createHash('sha256').update(await readFile(join(root, 'fonts', f))).digest('hex').slice(0, 8);
        const re = new RegExp(`/fonts/(${fonts.map((f) => f.replace(/[.-]/g, '\\$&')).join('|')})(?![?\\w.-])`, 'g');
        const files = (await readdir(root, { recursive: true })).filter((f) => /\.(css|html)$/.test(f));
        let changed = 0;
        for (const f of files) {
          const p = join(root, f);
          const src = await readFile(p, 'utf8');
          const out = src.replace(re, (m, name) => `${m}?v=${hash[name]}`);
          if (out !== src) { await writeFile(p, out); changed++; }
        }
        logger.info(`font URLs versioned in ${changed} files`);
      },
    },
  };
}

/**
 * Browser compatibility of the built CSS (cross-browser audit, 9 Oct 2026). Tailwind v4 optimises the final CSS with Lightning CSS
 * for Safari 16.4 / Chrome 111 / Firefox 128, which rewrites EVERY media query, ours included, into the range syntax
 * (`(width >= 1024px)`). A browser that does not parse it (Safari 16.0-16.3, Chrome < 104, Firefox < 63) drops every
 * breakpoint at once: the fluid scale (--u), the stacked layouts, the hamburger — the site is not responsive at all there.
 * This pass lowers the range syntax back to min-/max-width in every stylesheet and inlined <style> block of the build
 * (Astro inlines small stylesheets). Only the media-query feature is enabled, so nothing else is rewritten. Dev mode is
 * untouched (Vite serves the CSS as Tailwind emits it).
 */
function browserCompatCss() {
  const targets = { safari: 16 << 16, ios_saf: 16 << 16, chrome: 100 << 16, edge: 100 << 16, firefox: 100 << 16 };
  // VendorPrefixes stays ON: with it excluded Lightning CSS still merges a `-webkit-backdrop-filter` twin into the unprefixed
  // declaration and then generates no prefix at all, so Safari <= 17 / iOS 17 (prefixed-only) lost the pop-up blur (9 Oct 2026
  // responsive audit). Enabled, the prefixes the targets need are (re)generated: -webkit-backdrop-filter, -webkit-mask, -webkit-user-select.
  const exclude = Features.LogicalProperties | Features.DirSelector | Features.LightDark | Features.Nesting | Features.Colors;
  const lower = (code, filename) =>
    lightningTransform({ filename, code: Buffer.from(code), minify: true, targets, include: Features.MediaQueries, exclude, errorRecovery: true }).code.toString();
  return {
    name: 'browser-compat-css',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const files = (await readdir(root, { recursive: true })).filter((f) => /\.(css|html)$/.test(f));
        let changed = 0;
        for (const f of files) {
          const p = join(root, f);
          const src = await readFile(p, 'utf8');
          const out = f.endsWith('.css')
            ? lower(src, f)
            : src.replace(/(<style(?:\s[^>]*)?>)([\s\S]*?)(<\/style>)/g, (m, open, css, close) => (css.includes('@media') ? open + lower(css, f) + close : m));
          if (out !== src) { await writeFile(p, out); changed++; }
        }
        logger.info(`media queries lowered to min-/max-width in ${changed} files`);
      },
    },
  };
}

/** dist/<prefix>/404/index.html -> dist/<prefix>/404.html: the file Cloudflare Pages / nginx / Vercel serve for unknown URLs. */
function notFoundPages() {
  return {
    name: 'not-found-pages',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const root = fileURLToPath(dir);
        const found = (await readdir(root, { recursive: true })).filter((f) => /(^|[\\/])404[\\/]index\.html$/.test(f));
        for (const f of found) {
          const folder = join(root, f, '..');
          await rename(join(root, f), folder + '.html');
          await rmdir(folder);
        }
      },
    },
  };
}

/**
 * Dev server only: `astro dev` answers 404 to /contact-us under trailingSlash 'always'; 301 page navigations to /contact-us/
 * like the hosts do, so dev matches production. Files, Vite / Astro internals and non-HTML requests are left alone.
 */
function devTrailingSlash() {
  return {
    name: 'dev-trailing-slash',
    configureServer(server) {
      // Post hook, put first in the stack: Astro unshifts its own trailing-slash handler (a 404 "did you mean" page) in its
      // post hook, which runs before this one.
      return () => server.middlewares.stack.unshift({ route: '', handle: (req, res, next) => {
        const [p, q] = (req.url ?? '').split(/\?(.*)/s);
        const page = req.method === 'GET' && /text\/html/.test(req.headers.accept ?? '') && !p.endsWith('/') && !/^\/(@|_|src\/|node_modules\/|api\/)/.test(p) && !p.split('/').pop().includes('.');
        if (!page) return next();
        res.writeHead(301, { Location: p + '/' + (q ? `?${q}` : '') });
        res.end();
      } });
    },
  };
}

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  output: 'static',
  // Bug 057: every page URL ends in a slash, like the live site (/contact-us/, /ae/, /sa/ar/). 'directory' emits
  // contact-us/index.html; the hosts serve /contact-us/ and 301 /contact-us -> /contact-us/ (vercel.json via
  // tools/vercel-json.mjs, deploy/nginx, Cloudflare Pages by default). Page URLs come from urlFor (src/lib/editions.ts).
  // The integration below moves each edition's 404 page to <prefix>/404.html, the file the hosts serve for unknown URLs.
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  // The optimised-image cache (4,500+ AVIF / WebP, ~12 min to encode) defaults to node_modules/.astro. On the Azure VM the
  // dashboard's builds keep it outside the checkout (ASTRO_CACHE_DIR, deploy/vm/cambridge-admin.service) so `npm ci` on a
  // code deploy does not throw it away.
  ...(process.env.ASTRO_CACHE_DIR ? { cacheDir: process.env.ASTRO_CACHE_DIR } : {}),
  integrations: [notFoundPages(), browserCompatCss(), fontVersions()],
  devToolbar: { enabled: false },
  // Bug 190 (16 Oct 2026): no quality was set anywhere, so every photo (<Picture> / <Image>) was encoded at sharp's default AVIF
  // quality 50 with 4:2:0 chroma: soft faces and smeared patterns (the red-checked ghutra), banners 7-25 KB. src/lib/image-service.ts
  // = the sharp service with a default quality (AVIF 80, WebP 85) in each image's options, so it is in the cache key and file
  // name; AVIF chroma 4:4:4 here. Measured on the KSA Why / Accreditations cut-outs at their desktop widths: q80 4:4:4 =
  // +7.3 / +5.6 dB PSNR for 2.1x the bytes (KSA Why 1x 15.6 -> 33.6 KB); 4:4:4 itself costs ~5%.
  image: { service: { entrypoint: './src/lib/image-service.ts', config: { avif: { chromaSubsampling: '4:4:4' } } } },
  vite: {
    plugins: [tailwindcss(), devTrailingSlash()],
    // Staging: the dev server is exposed through ngrok (finalist-tamale-rhyme.ngrok-free.dev);
    // Vite blocks unknown Host headers unless listed here.
    server: {
      allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app', '.ngrok.app'],
      // .astro/ holds the QA scratch builds (many GB, rewritten while QA runs); watching it and the docs/figma-cache exports
      // stalled the dev server (transport invoke timeouts on global.css).
      watch: { ignored: ['**/.astro/**', '**/dist/**', '**/docs/**', '**/figma-cache/**'] },
    },
  },
});
