import type { APIRoute } from "astro";
import { allRedirects } from "../lib/redirects";

/*
 * Cloudflare Pages `_redirects` (dist/_redirects), generated from src/lib/redirects.ts. Every rule is written for the URL
 * with and without the trailing slash (the live site's URLs end in "/"), all 301, both straight to the target (one hop;
 * the target is a slash URL from urlFor, bug 057). Cloudflare's limits: 2000 static + 100 dynamic (splat) rules.
 * deploy/deploy.sh converts this file into an nginx map for the QA staging server.
 * A dynamic route with ONE static path: Astro skips page files whose name starts with "_", so src/pages/_redirects.ts was
 * never built (no dist/_redirects, found 7 Oct 2026).
 */
export function getStaticPaths() {
  return [{ params: { redirects: "_redirects" } }];
}

export const GET: APIRoute = () => {
  // A splat source ("/sa/doctor/*", bug 059 / 060) is one dynamic rule that also covers the slash form.
  const lines = allRedirects().flatMap((r) => {
    if (r.from.endsWith("/*")) return [`${r.from} ${r.to} 301`];
    const from = r.from.replace(/\/+$/, "");
    return [`${from} ${r.to} 301`, `${from}/ ${r.to} 301`];
  });
  const dynamic = lines.filter((l) => l.split(" ")[0].endsWith("*")).length;
  if (lines.length - dynamic > 2000) throw new Error(`_redirects: ${lines.length - dynamic} static rules, over Cloudflare's 2000 limit`);
  if (dynamic > 100) throw new Error(`_redirects: ${dynamic} splat rules, over Cloudflare's 100 dynamic rule limit`);
  return new Response(lines.join("\n") + "\n", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
