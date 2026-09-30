import type { APIRoute } from 'astro';
import { editions } from '../lib/editions';
import { absolute } from '../lib/seo';

export const GET: APIRoute = () => {
  const items = editions.map((e) => `  <sitemap><loc>${absolute(`/sitemaps/${e.id}.xml`)}</loc></sitemap>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</sitemapindex>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
