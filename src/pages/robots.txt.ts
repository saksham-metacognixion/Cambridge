import type { APIRoute } from 'astro';
import { absolute, INDEXABLE } from '../lib/seo';

// Staging (INDEXABLE = false in site.config.mjs) blocks all crawling.
export const GET: APIRoute = () =>
  new Response(
    INDEXABLE
      ? `User-agent: *\nAllow: /\n\nSitemap: ${absolute('/sitemap-index.xml')}\n`
      : `User-agent: *\nDisallow: /\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
