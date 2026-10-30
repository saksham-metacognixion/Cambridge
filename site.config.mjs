// Single source for site-wide deployment values. Imported by astro.config.mjs and the SEO helpers.

/**
 * Production domain (bug 057: the live site's domain, no trailing slash here). Used for canonical, hreflang, OG and sitemap
 * URLs on every build, staging included, so search engines only ever see the production URLs.
 */
export const SITE_URL = 'https://cambridgehospital.com';

/** false = staging: every page gets `noindex` and robots.txt disallows crawling. Flip to true at go-live. */
export const INDEXABLE = false;
