import { editions, urlFor, type Edition, type LocaleId } from "./editions";
import { t } from "./content";
import { authorSchema, type AuthorFile } from "./authors-schema";
import { newsRecords, NEWS_PATHS, type Post } from "./news";

/*
 * Authors and medical reviewers (SEO & GEO dashboard, 30 Oct 2026): one file per person, src/content/authors/<slug>.json,
 * written by the dashboard, validated here like the posts (src/lib/authors-schema.ts). A post names them by slug (`author`,
 * `reviewer`); the article byline, the "Reviewed by" line, the author page (media-hub/author/<slug>, every edition) and the
 * Person schema come from here. A hidden author (active: false) keeps the references but gets no page or byline.
 */
export const AUTHOR_PATHS = {
  page: (slug: string) => `${NEWS_PATHS.list}/author/${slug}`,
};

const files = import.meta.glob<unknown>("../content/authors/*.json", { eager: true, import: "default" });

export const authorFiles: AuthorFile[] = Object.entries(files)
  .map(([path, raw]) => {
    const name = path.split("/").pop()!;
    const parsed = authorSchema.safeParse(raw);
    if (!parsed.success)
      throw new Error(
        `Authors: src/content/authors/${name} is invalid:\n` + parsed.error.issues.map((i) => `  ${i.path.join(".") || "(root)"}: ${i.message}`).join("\n"),
      );
    if (`${parsed.data.slug}.json` !== name) throw new Error(`Authors: src/content/authors/${name}: slug "${parsed.data.slug}" must equal the file name`);
    return parsed.data;
  })
  .sort((a, b) => a.name.en.localeCompare(b.name.en));

/** Authors shown on the site (byline, page). */
export const activeAuthors = authorFiles.filter((a) => a.active);

/** The author a post names, when it exists and is shown; "" / unknown / hidden = none (the organization stays the author). */
export function authorBySlug(slug: string | undefined): AuthorFile | undefined {
  if (!slug) return undefined;
  const a = activeAuthors.find((x) => x.slug === slug);
  if (!a && authorFiles.every((x) => x.slug !== slug)) console.warn(`[authors] no author "${slug}" in src/content/authors (post keeps the organization as author)`);
  return a;
}

export const authorName = (a: AuthorFile, locale: LocaleId) => t(a.name, locale, "authors");
export const authorRole = (a: AuthorFile, locale: LocaleId) => (a.role?.en ? t(a.role, locale, "authors") : "");
export const authorBio = (a: AuthorFile, locale: LocaleId) => (a.bio?.en ? t(a.bio, locale, "authors") : "");
export const authorHref = (a: AuthorFile, edition: Edition) => urlFor(edition, AUTHOR_PATHS.page(a.slug));
/** Edition ids with an author page: all six (an author is not tied to a region). */
export const authorEditions = () => editions.map((e) => e.id);

/** Live posts written or reviewed by an author, in the edition's language, newest first. */
export function postsByAuthor(a: AuthorFile, edition: Edition): Post[] {
  const bySlug = new Map<string, Post>();
  for (const p of newsRecords)
    if ((p.author === a.slug || p.reviewer === a.slug) && p.editions.includes(edition.region)) {
      const cur = bySlug.get(p.slug);
      if (!cur || p.language === edition.locale) bySlug.set(p.slug, p);
    }
  return [...bySlug.values()].sort((x, y) => y.date.localeCompare(x.date));
}
