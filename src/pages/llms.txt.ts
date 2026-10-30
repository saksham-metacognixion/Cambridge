import type { APIRoute } from 'astro';
import { editions, defaultEdition, urlFor } from '../lib/editions';
import { absolute } from '../lib/seo';
import { allRoutes } from '../lib/routes';
import { hospitals, hospitalName, HOSPITAL_PATHS } from '../lib/hospitals';
import { pages as seoPages } from '../data/seo.json';
import org from '../data/organization.json';

/*
 * /llms.txt (llmstxt.org; SEO & GEO Dashboard Spec, Pratik 29 Oct 2026, section 6): a Markdown map of the site for AI tools.
 * No new copy: every title and summary is the live site's approved meta (src/data/seo.json, Global English unless noted),
 * hospital names / addresses from hospitals.json. A page without a seo.json title is left out. The CMS settings screen can
 * replace this with edited text later (Phase 2).
 */
const seo = seoPages as Record<string, { title?: string; description?: string }>;

// Main pages, in site order (route keys of src/lib/routes.ts).
const KEY_PAGES = [
  'about', 'who-we-are', 'why-cambridge', 'accreditations', 'hospitals', 'our-care', 'find-a-doctor', 'conditions',
  'patient-hub', 'international-patients', 'insurance-providers', 'refer-patient', 'media-hub', 'faq', 'contact', 'careers',
];

const link = (url: string, fallback = '') => {
  const meta = seo[url];
  const title = meta?.title || fallback;
  if (!title) return null;
  return `- [${title}](${absolute(url)})${meta?.description ? `: ${meta.description}` : ''}`;
};

export const GET: APIRoute = () => {
  const routes = allRoutes();
  const home = seo[urlFor(defaultEdition)];
  const lines = [
    `# ${org.name}`,
    '',
    ...(home?.description ? [`> ${home.description}`, ''] : []),
    '## Editions',
    '',
    ...editions.map((e) => link(urlFor(e), `${e.regionName} (${e.lang})`)),
    '',
    '## Main pages',
    '',
    ...KEY_PAGES.map((key) => routes.find((r) => r.key === key)).map((r) => r && link(urlFor(defaultEdition, r.path))),
    '',
    '## Hospitals',
    '',
    ...hospitals.map((h) => `- [${hospitalName(h, 'en')}](${absolute(urlFor(defaultEdition, HOSPITAL_PATHS.detail(h.slug)))}): ${h.address.en}`),
    '',
    '## Optional',
    '',
    `- [Sitemap](${absolute('/sitemap-index.xml')})`,
    '',
  ];
  return new Response(lines.filter((l) => l !== null).join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
