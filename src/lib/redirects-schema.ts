import { z } from "astro/zod";

/*
 * Manual 301 redirects, src/data/redirects.json (SEO & GEO dashboard redirect manager, 2 Nov 2026): old address -> new
 * address rules a person adds by hand in the dashboard (Settings > Redirects), next to the automatic ones a renamed post
 * gets (`previous_slugs`). The build merges them into dist/_redirects first (src/lib/redirects.ts manualRedirects), so a
 * manual rule wins over a generated one with the same source. The dashboard validates with this same schema before it
 * writes the file, and the build stops on a bad file, so a broken rule never reaches a host.
 */

/** A site path: starts with "/", no query, hash, whitespace or "*" (exact sources only, no splat rules by hand). */
const SOURCE = /^\/[^\s?#*]*$/;
/** A site path (query / hash allowed, e.g. the Media Hub filtered on a category) or an absolute http(s) URL. */
const TARGET = /^(\/[^\s]*|https?:\/\/[^\s]+)$/;

export const manualRedirectSchema = z
  .object({
    /** the old address, a path on this site, without its trailing slash ("/old-page"); never "/" */
    from: z.string().regex(SOURCE, "The old address must be a path on this website, like /old-page/").refine((p) => p !== "/" && !p.includes("//"), "The old address cannot be the home page or contain //"),
    /** the new address: a path on this site ("/media-hub/new-post/") or a full URL on another site */
    to: z.string().regex(TARGET, "The new address must be a path on this website (/new-page/) or a full https:// link"),
    /** why the rule exists (shown in the dashboard only) */
    note: z.string().max(300).default(""),
    /** YYYY-MM-DD the rule was added (dashboard) */
    added: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  })
  .strict();

export const redirectsFileSchema = z
  .object({
    $comment: z.string().optional(),
    redirects: z.array(manualRedirectSchema).default([]),
  })
  .strict();

export type ManualRedirect = z.infer<typeof manualRedirectSchema>;

/** A path without its trailing slash ("/x/" and "/x" are the same page, bug 057); the root stays "/". */
export const bare = (p: string) => p.replace(/\/+$/, "") || "/";

/**
 * The form a rule is stored in: the source without its trailing slash and with its percent-encoding as browsers send it
 * (RFC 3986, uppercase hex; a pasted Arabic path is encoded), the target with the trailing slash every page URL ends in
 * (one hop, bug 057) unless it names a file, carries a query / hash, or is an external link. A full URL pasted as the old
 * address is reduced to its path when it is on this site (`siteHost`); anything else is left for the schema to refuse.
 */
export function normalizeRedirect(r: { from: string; to: string; note?: string; added?: string }, siteHost: string): { from: string; to: string; note: string; added?: string } {
  const encodePath = (p: string) => { try { return new URL(p, "https://x.invalid").pathname; } catch { return p; } };
  let from = r.from.trim();
  const m = /^https?:\/\/([^/?#]+)(\/[^?#]*)?/i.exec(from);
  if (m && [siteHost, `www.${siteHost}`].includes(m[1].toLowerCase())) from = m[2] || "/";
  if (from.startsWith("/") && !/[?#]/.test(from)) from = bare(encodePath(from)); // a query / hash is left for the schema to refuse
  let to = r.to.trim();
  if (to.startsWith("/")) {
    const [, pathPart, rest = ""] = /^([^?#]*)(.*)$/.exec(to)!;
    const path = encodePath(pathPart);
    const last = path.slice(path.lastIndexOf("/") + 1);
    to = (path.endsWith("/") || last.includes(".") ? path : `${path}/`) + rest;
  }
  return { from, to, note: (r.note ?? "").trim(), ...(r.added ? { added: r.added } : {}) };
}
