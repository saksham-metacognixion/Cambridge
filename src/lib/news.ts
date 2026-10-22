import type { Edition, LocaleId } from "./editions";
import posts from "../data/news/posts.json";
import sitePosts from "../data/news/site-posts.json";
import samples from "../data/news/sample-images.json";
import { img } from "./images";

/*
 * News posts, schema in src/data/news/README.md. Two sources, one list: posts.json (GENERATED from the WordPress export,
 * never edited by hand) + site-posts.json (posts written for this site, e.g. press releases the client sends as documents;
 * kept by hand, never touched by the import). A slug may live in only one of them.
 * Every edition lists ALL posts (region rule still to be confirmed with Pramod; `region` stays in the data).
 * URL pattern in ONE place: list = Media Hub, article = media-hub/<slug>. UNCONFIRMED with Pramod (the current site's
 * post URLs could not be read, docs/open-decisions.md D7 / AR2); `old_url` on each post feeds the 301 map
 * (src/lib/redirects.ts -> dist/_redirects).
 */
export const NEWS_PATHS = {
  list: "media-hub",
  article: (slug: string) => `media-hub/${slug}`,
};

export interface Post {
  slug: string;
  old_url: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  body: string;
  image: string;
  image_alt: string;
  region: string;
  language: LocaleId;
  image_crop?: { h: string; l: string; t: string; w: string };
  /** false = the article hero shows no button ("Consult for a Care Plan"); absent = it shows */
  hero_button?: boolean;
  /** site-posts.json only: the document the text was taken from */
  source?: string;
}

const wordpress = posts as Post[];
const authored = sitePosts.posts as Post[];
// One slug, one source: a site post may not shadow (or be shadowed by) a WordPress post after a re-import.
const wpSlugs = new Set(wordpress.map((p) => p.slug));
for (const p of authored)
  if (wpSlugs.has(p.slug))
    throw new Error(
      `News: slug "${p.slug}" is in both posts.json (WordPress import) and site-posts.json; rename the site post`,
    );
const all: Post[] = [...wordpress, ...authored];

/** Posts for an edition, newest first. A slug without a record in the edition's language falls back to English. */
export function postsFor(edition: Edition): Post[] {
  const bySlug = new Map<string, Post>();
  for (const p of all) {
    if (p.language === "en" && !bySlug.has(p.slug)) bySlug.set(p.slug, p);
  }
  if (edition.locale !== "en")
    for (const p of all)
      if (p.language === edition.locale) bySlug.set(p.slug, p);
  return [...bySlug.values()].sort((a, b) => b.date.localeCompare(a.date));
}

/** Every slug that gets an article page (one page per slug in every edition). */
export const allPostSlugs: string[] = [...new Set(all.map((p) => p.slug))];

/** The record of one slug for an edition (its language, else English). */
export function postFor(slug: string, edition: Edition): Post | undefined {
  return (
    all.find((p) => p.slug === slug && p.language === edition.locale) ??
    all.find((p) => p.slug === slug && p.language === "en")
  );
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
  for (const p of [...new Map(all.map((p) => [p.slug, p])).values()].sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug))) {
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
