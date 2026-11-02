// Single source for site-wide deployment values. Imported by astro.config.mjs and the SEO helpers.

/**
 * Production domain (bug 057: the live site's domain, no trailing slash here). Used for canonical, hreflang, OG and sitemap
 * URLs on every build, staging included, so search engines only ever see the production URLs.
 */
export const SITE_URL = 'https://cambridgehospital.com';

/**
 * true = production: pages are indexable and robots.txt allows crawling (and the AI search crawlers in src/data/robots.json).
 * Switched on 2 Nov 2026 (user decision: the site goes into search; the live site had shipped with `noindex` on every page).
 * false = every page gets `noindex, nofollow` and robots.txt disallows crawling. Staging hosts stay out of search by a host
 * header instead: Vercel `X-Robots-Tag: noindex, nofollow` (tools/vercel-json.mjs), nginx deploy/nginx/cambridge-staging.conf.
 */
export const INDEXABLE = true;
