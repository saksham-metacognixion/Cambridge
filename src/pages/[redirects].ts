import type { APIRoute } from "astro";
import { allRedirects } from "../lib/redirects";

/*
 * Cloudflare Pages `_redirects` (dist/_redirects), generated from src/lib/redirects.ts. Every rule is written for the URL
 * with and without the trailing slash (the live site's URLs end in "/"), all 301. Cloudflare's limit: 2000 static rules.
 * deploy/deploy.sh converts this file into an nginx map for the QA staging server.
 * A dynamic route with ONE static path: Astro skips page files whose name starts with "_", so src/pages/_redirects.ts was
 * never built (no dist/_redirects, found 7 Oct 2026).
 */
export function getStaticPaths() {
  return [{ params: { redirects: "_redirects" } }];
}

export const GET: APIRoute = () => {
  const lines = allRedirects().flatMap((r) => [`${r.from} ${r.to} 301`, `${r.from}/ ${r.to} 301`]);
  if (lines.length > 2000) throw new Error(`_redirects: ${lines.length} rules, over Cloudflare's 2000 static rule limit`);
  return new Response(lines.join("\n") + "\n", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
