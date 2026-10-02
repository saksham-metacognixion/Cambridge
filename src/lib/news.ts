import type { Edition, LocaleId } from './editions';
import posts from '../data/news/posts.json';

/*
 * News posts (src/data/news/posts.json, schema in the README next to it).
 * Every edition lists ALL posts (region rule still to be confirmed with Pramod; `region` stays in the data).
 */
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
}

/** Posts for an edition, newest first. A slug without a record in the edition's language falls back to English. */
export function postsFor(edition: Edition): Post[] {
  const all = posts as Post[];
  const bySlug = new Map<string, Post>();
  for (const p of all) {
    if (p.language === 'en' && !bySlug.has(p.slug)) bySlug.set(p.slug, p);
  }
  if (edition.locale !== 'en') for (const p of all) if (p.language === edition.locale) bySlug.set(p.slug, p);
  return [...bySlug.values()].sort((a, b) => b.date.localeCompare(a.date));
}

/** "15" and "Wed" for the date badge; Arabic gets Arabic-Indic numerals and Arabic weekday names. */
export function badgeDate(iso: string, locale: LocaleId) {
  const d = new Date(`${iso}T12:00:00Z`);
  const tag = locale === 'ar' ? 'ar-u-nu-arab' : 'en';
  return {
    day: new Intl.DateTimeFormat(tag, { day: 'numeric', timeZone: 'UTC' }).format(d),
    weekday: new Intl.DateTimeFormat(tag, { weekday: 'short', timeZone: 'UTC' }).format(d),
    full: new Intl.DateTimeFormat(tag, { dateStyle: 'long', timeZone: 'UTC' }).format(d),
  };
}
