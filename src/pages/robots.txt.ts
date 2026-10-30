import type { APIRoute } from 'astro';
import { absolute, INDEXABLE } from '../lib/seo';
import robots from '../data/robots.json';

// Staging (INDEXABLE = false in site.config.mjs) blocks all crawling.
// Production: everyone allowed, then one group per AI crawler from src/data/robots.json (a named group replaces the "*" group
// for that crawler, so each one gets its own Allow / Disallow).
const aiGroups = () =>
  Object.entries(robots.aiCrawlers)
    .map(([agent, allow]) => `User-agent: ${agent}\n${allow ? 'Allow' : 'Disallow'}: /\n`)
    .join('\n');

export const GET: APIRoute = () =>
  new Response(
    INDEXABLE
      ? `User-agent: *\nAllow: /\n\n${aiGroups()}\nSitemap: ${absolute('/sitemap-index.xml')}\n`
      : `User-agent: *\nDisallow: /\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
