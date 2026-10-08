// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { SITE_URL } from './site.config.mjs';
import { readdir, rename, rmdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
  integrations: [notFoundPages()],
  devToolbar: { enabled: false },
  vite: {
    plugins: [tailwindcss(), devTrailingSlash()],
    // Staging: the dev server is exposed through ngrok (finalist-tamale-rhyme.ngrok-free.dev);
    // Vite blocks unknown Host headers unless listed here.
    server: { allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app', '.ngrok.app'] },
  },
});
