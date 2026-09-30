// Single source for site-wide deployment values. Imported by astro.config.mjs and the SEO helpers.

/** Placeholder until Pramod confirms the production domain. Used for canonical, hreflang, OG and sitemap URLs. */
export const SITE_URL = 'https://cambridgehospital.example';

/** false = staging: every page gets `noindex` and robots.txt disallows crawling. Flip to true at go-live. */
export const INDEXABLE = false;
