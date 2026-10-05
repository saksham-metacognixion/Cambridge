import type { APIRoute } from "astro";
import { editions, urlFor } from "../lib/editions";
import { NEWS_PATHS } from "../lib/news";
import posts from "../data/news/posts.json";

/*
 * 301 map for news post URLs that change (scope 2.9): one line per post with an `old_url` (path of the post on the current
 * site, from Pramod's export) that differs from the new URL. Same format and purpose as /redirects-doctors.txt (Cloudflare
 * Pages `_redirects` lines, appended at deploy time or converted for nginx). The old site has one URL per post (its language
 * record), so an English post goes to the Global English article and an Arabic one to the Global Arabic article.
 */
export const GET: APIRoute = () => {
  const seen = new Set<string>();
  const lines = (posts as { slug: string; old_url: string; language: string }[])
    .filter((p) => p.old_url)
    .map((p) => {
      const edition = editions.find(
        (e) =>
          e.region === "global" &&
          e.locale === (p.language === "ar" ? "ar" : "en"),
      )!;
      return {
        from: new URL(p.old_url, "https://x.invalid").pathname.replace(
          /\/+$/,
          "",
        ),
        to: urlFor(edition, NEWS_PATHS.article(p.slug)),
      };
    })
    .filter(
      (r) => r.from && r.from !== r.to && !seen.has(r.from) && seen.add(r.from),
    )
    .map((r) => `${r.from} ${r.to} 301`);
  return new Response(lines.join("\n") + (lines.length ? "\n" : ""), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
