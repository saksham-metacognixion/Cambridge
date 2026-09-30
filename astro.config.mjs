// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { SITE_URL } from './site.config.mjs';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  output: 'static',
  // URLs without trailing slash (/ae, /sa/ar), matching the current site. 'file' emits ae.html etc.,
  // which Cloudflare Pages serves at /ae. Re-check if the hosting target changes.
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'auto' },
  devToolbar: { enabled: false },
  vite: {
    plugins: [tailwindcss()],
  },
});
