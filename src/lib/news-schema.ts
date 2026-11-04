import { z } from "astro/zod";

/*
 * Shape of one news post on disk, src/content/news/<slug>.json (SEO & GEO dashboard Phase A, 30 Oct 2026): what both
 * languages share at the top level (date, category, type, status, editions, featured image, author ...), the English text +
 * SEO / GEO fields under `en`, the Arabic version under `ar` (absent = the English record is shown on /ar, as before).
 * The build validates every file and stops with the file name and field on the first error, so the dashboard (or a hand
 * edit) can never ship a broken post. `.strict()`: an unknown key is an error, not silently ignored.
 * Migrated posts carry only the fields the WordPress export had plus type / status / editions; the dashboard fills the rest.
 */
/** YYYY-MM-DD that is a real calendar date (2026-13-45 is not). */
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const date = () =>
  z.string().regex(DATE).refine((d) => { const t = Date.parse(`${d}T00:00:00Z`); return !Number.isNaN(t) && new Date(t).toISOString().startsWith(d); }, { message: "Not a real calendar date" });

export const localeSchema = z
  .object({
    title: z.string().min(1),
    excerpt: z.string().default(""),
    /** article HTML, sanitised at build (src/lib/sanitize.ts) */
    body: z.string().default(""),
    image_alt: z.string().default(""),
    /** path of the post on the old site (301 -> this post, src/lib/redirects.ts); "" = none */
    old_url: z.string().default(""),
    /** false = the article hero shows no button ("Consult for a Care Plan") */
    hero_button: z.boolean().optional(),
    /** site-written posts: the document the text was taken from */
    source: z.string().optional(),
    /** <title> and meta description (the live site's values for migrated posts); absent = template pattern / excerpt */
    seo: z.object({ title: z.string().optional(), description: z.string().optional() }).strict().optional(),
    /** editorial guide for the dashboard checker; never rendered */
    focus_keyword: z.string().default(""),
    /** canonical URL override; "" = the page's own URL */
    canonical: z.string().default(""),
    key_takeaways: z.array(z.string()).default([]),
    faqs: z.array(z.object({ q: z.string(), a: z.string() }).strict()).default([]),
    sources: z.array(z.object({ title: z.string().default(""), url: z.string() }).strict()).default([]),
  })
  .strict();

export const postSchema = z
  .object({
    /** = the file name; URL media-hub/<slug> in every edition */
    slug: z.string().regex(/^[\p{L}\p{N}-]+$/u),
    /** publish date YYYY-MM-DD (datePublished, sitemap lastmod) */
    date: date(),
    /** last edit YYYY-MM-DD (dateModified); absent = date */
    updated: date().optional(),
    /** Media Hub dropdown key (src/data/content/media-hub/page.en.json) or "interviews" */
    category: z.string().min(1),
    /** spec: Blog (Article schema) = health articles; PR (NewsArticle) = press releases, events, conferences, interviews */
    type: z.enum(["blog", "pr"]),
    /** scheduled = live once publish_at (else date) has passed; draft / archived = not built */
    status: z.enum(["draft", "scheduled", "published", "archived"]),
    /** ISO date-time of a scheduled post */
    publish_at: z.string().optional(),
    /** editions whose Media Hub lists the post and build its article page */
    editions: z.array(z.enum(["global", "ae", "sa"])).min(1),
    /** featured image key under src/assets (news/<slug>), shared by both languages; "" = none (sample photo, NW1) */
    image: z.string().default(""),
    /** URL of the image on the old site (import record) */
    image_source: z.string().optional(),
    /** Figma placeholder crop (unused since the import) */
    image_crop: z.object({ h: z.string(), l: z.string(), t: z.string(), w: z.string() }).optional(),
    /** "full" = the desktop hero shows the whole photo, not the 1052x323 strip */
    hero_photo: z.literal("full").optional(),
    /** import record (every post "global"); `editions` is what counts */
    region: z.string().optional(),
    /** earlier slugs of this post: each one 301s to the current URL (slug changed in the dashboard) */
    previous_slugs: z.array(z.string()).default([]),
    /** author / reviewer slugs (src/content/authors); "" = the organization (Phase 1 schema) */
    author: z.string().default(""),
    reviewer: z.string().default(""),
    /** true = robots noindex and left out of the sitemap */
    noindex: z.boolean().default(false),
    en: localeSchema,
    ar: localeSchema.optional(),
  })
  .strict();

export type PostFile = z.infer<typeof postSchema>;
export type PostLocale = z.infer<typeof localeSchema>;
