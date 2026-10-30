import { editions, type Edition, type LocaleId } from "./editions";
import samples from "../data/news/sample-images.json";
import mediaHub from "../data/content/media-hub/page.en.json";
import { img } from "./images";
import { postSchema, type PostFile, type PostLocale } from "./news-schema";

/*
 * News posts: one file per post, src/content/news/<slug>.json (schema + field notes in src/lib/news-schema.ts, history in
 * src/data/news/README.md). The dashboard writes these files; the build reads them here and validates every one (a bad file
 * stops the build with its name and the field). Posts come from the WordPress import of the old site (129, Oct 2026) and
 * from the dashboard / hand-written files since (press releases the client sends as documents).
 * Only LIVE posts are built: status "published", or "scheduled" once its time has passed. `editions` says which Media Hubs
 * list a post and where its article page exists (migrated posts: all three, D15).
 * URL pattern in ONE place: list = Media Hub, article = media-hub/<slug>. `old_url` on each language feeds the 301 map
 * (src/lib/redirects.ts -> dist/_redirects), `previous_slugs` the 301s of a renamed post.
 */
export const NEWS_PATHS = {
  list: "media-hub",
  article: (slug: string) => `media-hub/${slug}`,
};

/** One language of one post, as the templates use it (the file's shared fields + that language's fields). */
export type Post = Omit<PostFile, "en" | "ar"> & PostLocale & { language: LocaleId };

// ---------- load + validate ----------
const KNOWN_CATEGORIES = new Set([...(mediaHub.explore.categories as { key: string }[]).map((c) => c.key), "interviews"]);
const files = import.meta.glob<unknown>("../content/news/*.json", { eager: true, import: "default" });

/** Every post file, validated, drafts included (the dashboard's list); newest first. */
export const newsFiles: PostFile[] = Object.entries(files)
  .map(([path, raw]) => {
    const name = path.split("/").pop()!;
    const file = `src/content/news/${name}`;
    const parsed = postSchema.safeParse(raw);
    if (!parsed.success)
      throw new Error(
        `News: ${file} is invalid:\n` + parsed.error.issues.map((i) => `  ${i.path.join(".") || "(root)"}: ${i.message}`).join("\n"),
      );
    const post = parsed.data;
    if (`${post.slug}.json` !== name) throw new Error(`News: ${file}: slug "${post.slug}" must equal the file name`);
    if (!KNOWN_CATEGORIES.has(post.category)) throw new Error(`News: ${file}: unknown category "${post.category}"`);
    return post;
  })
  .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));

const today = new Date().toISOString().slice(0, 10);
/** Built and listed: published, or scheduled with its time passed. */
export const isLive = (p: PostFile) =>
  p.status === "published" || (p.status === "scheduled" && (p.publish_at ? Date.parse(p.publish_at) <= Date.now() : p.date <= today));

const live = newsFiles.filter(isLive);
const record = (p: PostFile, language: LocaleId): Post => {
  const { en, ar, ...shared } = p;
  return { ...shared, ...(language === "ar" ? ar! : en), language };
};
/** Flat list of every live language record (English first per post): the redirects and the templates read this. */
export const newsRecords: Post[] = live.flatMap((p) => [record(p, "en"), ...(p.ar ? [record(p, "ar")] : [])]);
const all = newsRecords;

/** Edition ids where a post's page exists (hreflang / sitemaps): its `editions`, both languages. */
export const postEditions = (slug: string): string[] => {
  const p = live.find((x) => x.slug === slug);
  return editions.filter((e) => p?.editions.includes(e.region)).map((e) => e.id);
};
const inEdition = (p: Post, edition: Edition) => p.editions.includes(edition.region);

/** Posts for an edition, newest first. A slug without a record in the edition's language falls back to English. */
export function postsFor(edition: Edition): Post[] {
  const bySlug = new Map<string, Post>();
  for (const p of all) {
    if (p.language === "en" && inEdition(p, edition) && !bySlug.has(p.slug)) bySlug.set(p.slug, p);
  }
  if (edition.locale !== "en")
    for (const p of all)
      if (p.language === edition.locale && inEdition(p, edition)) bySlug.set(p.slug, p);
  return [...bySlug.values()].sort((a, b) => b.date.localeCompare(a.date));
}

/** Every live slug (one article page per slug in each of its editions). */
export const allPostSlugs: string[] = live.map((p) => p.slug);

/** The record of one slug for an edition (its language, else English); undefined when the post is not in that edition. */
export function postFor(slug: string, edition: Edition): Post | undefined {
  const p = all.find((x) => x.slug === slug && x.language === edition.locale) ?? all.find((x) => x.slug === slug && x.language === "en");
  return p && inEdition(p, edition) ? p : undefined;
}

/** Whether a slug has an article page; used to wire cards (a missing slug links to the 404 page). */
export const hasPost = (slug: string) => allPostSlugs.includes(slug);

/** "15" and "Wed" for the date badge; Arabic gets Arabic weekday / month names with Western digits (bug 154, 15 Oct 2026: one digit
 *  style site-wide, as in the stats, the footer and the English edition; was Arabic-Indic). */
export function badgeDate(iso: string, locale: LocaleId) {
  const d = new Date(`${iso}T12:00:00Z`);
  const tag = locale === "ar" ? "ar-u-nu-latn" : "en";
  return {
    day: new Intl.DateTimeFormat(tag, {
      day: "numeric",
      timeZone: "UTC",
    }).format(d),
    weekday: new Intl.DateTimeFormat(tag, {
      weekday: "short",
      timeZone: "UTC",
    }).format(d),
    full: new Intl.DateTimeFormat(tag, {
      dateStyle: "long",
      timeZone: "UTC",
    }).format(d),
  };
}

/*
 * Image key for a post: its own file when it is in src/assets, else a TEMPORARY sample photo (src/data/news/sample-images.json,
 * NW1) so cards are not empty; "" when samples are off. The sample is picked by the post's position in its category (newest
 * first), so the latest posts of one tab never share a photo and a post keeps the same photo on every page.
 */
const hasImg = (key: string) => { try { img(key); return true; } catch { return false; } };
const categoryRank = new Map<string, number>();
{
  const seen = new Map<string, number>();
  for (const p of live) {
    const n = seen.get(p.category) ?? 0;
    categoryRank.set(p.slug, n);
    seen.set(p.category, n + 1);
  }
}
export function postImage(post: Pick<Post, "slug" | "image">): { key: string; sample: boolean } {
  if (post.image && hasImg(post.image)) return { key: post.image, sample: false };
  if (!samples.enabled || !samples.images.length) return { key: "", sample: false };
  return { key: samples.images[(categoryRank.get(post.slug) ?? 0) % samples.images.length], sample: true };
}

/**
 * Desktop title size of a post's hero, in Figma px (PageHero `titleSize`; user, 21 Oct 2026: "decrease the heading size so
 * that it fits"). The Figma hero is a 322 stage with a 385-wide title column at 39 px. Longer titles step down to 32 / 26 so
 * they stay inside the Figma height instead of making a tall banner; short titles keep the Figma size. The steps are per
 * language: Arabic (GE SS Two Bold, 1.45 line height, bug 129) fills the column with fewer characters than Gotham, so it steps
 * down sooner. Measured over every post at 1024 / 1440 (21 Oct 2026). If a title still needs more room, the hero grows with it
 * (PageHero `.side`), so nothing can overflow.
 */
const TITLE_STEPS: Record<LocaleId, [number, number]> = { en: [60, 100], ar: [55, 80] };
export function postTitleSize(title: string, locale: LocaleId): number {
  const n = [...title].length;
  const [figma, medium] = TITLE_STEPS[locale];
  return n <= figma ? 39 : n <= medium ? 32 : 26;
}
