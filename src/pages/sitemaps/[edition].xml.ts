import type { APIRoute } from "astro";
import { editions, urlFor } from "../../lib/editions";
import { absolute, alternates } from "../../lib/seo";
import { allRoutes } from "../../lib/routes";

// One sitemap per edition (scope 2.9): /sitemaps/global-en.xml, /sitemaps/ae-ar.xml, ...
// <lastmod> only where the data holds a real date (news posts + Media Hub, routes.ts); a build date on every page would be noise
// that search engines learn to ignore.
export function getStaticPaths() {
  return editions.map((e) => ({
    params: { edition: e.id },
    props: { edition: e },
  }));
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

export const GET: APIRoute = ({ props }) => {
  const { edition } = props as { edition: (typeof editions)[number] };
  const urls = allRoutes(edition)
    .map((r) => {
      const links = alternates(r.path, r.editions)
        .map(
          (a) =>
            `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${esc(a.href)}"/>`,
        )
        .join("\n");
      const lastmod = r.lastmod?.(edition);
      return `  <url>\n    <loc>${esc(absolute(urlFor(edition, r.path)))}</loc>\n${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ""}${links}\n  </url>`;
    })
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
