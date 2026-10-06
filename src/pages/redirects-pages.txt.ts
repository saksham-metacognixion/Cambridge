import type { APIRoute } from "astro";
import { editions, urlFor } from "../lib/editions";
import { PAGE_PATHS } from "../lib/paths";
import { NEWS_PATHS } from "../lib/news";
import { conditions, CONDITION_PATHS } from "../lib/conditions";

/*
 * 301 map for the live site's page URLs that have no page of their own here (scope 2.9), from the WordPress export
 * (docs/cambridgehospital.WordPress.2026-10-06.xml, 6 Oct 2026). Same format as /redirects-doctors.txt and
 * /redirects-news.txt (Cloudflare Pages `_redirects` lines, appended at deploy time or converted for nginx).
 *   - news category archives (/events/, /conferences/, /press-releases/, /health-articles/) -> Media Hub filtered on that category
 *   - /book-an-appointment/ -> the home page with the Book an Appointment pop-up open (the site has the Figma pop-up, CT15)
 *   - /about/meet-the-team/ -> About (the leadership records are not in the export, WP6)
 *   - condition pages /condition/<WordPress slug>/ -> the condition's detail page (old_slug in conditions.json, docs/specialty.json)
 * The four health calculators keep their live URLs (PAGE_PATHS, bug 014): no redirect.
 * Every edition's language gets its own line (/ar/..., /ae/..., /ae/ar/..., /sa/..., /sa/ar/...).
 */
export const GET: APIRoute = () => {
  const lines: string[] = [];
  for (const e of editions) {
    const base = e.base ? `/${e.base}` : "";
    const add = (from: string, to: string) => lines.push(`${base}${from} ${to} 301`);
    for (const cat of ["events", "conferences", "press-releases", "health-articles"])
      add(`/${cat}`, urlFor(e, NEWS_PATHS.list) + `?category=${cat}#latest`);
    add("/book-an-appointment", urlFor(e) + "#book-appointment");
    add("/about/meet-the-team", urlFor(e, PAGE_PATHS.about));
    for (const c of conditions) if (c.old_slug) add(`/condition/${c.old_slug}`, urlFor(e, CONDITION_PATHS.detail(c.slug)));
  }
  return new Response(lines.join("\n") + "\n", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
