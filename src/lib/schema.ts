import { SITE_URL } from "../../site.config.mjs";
import org from "../data/organization.json";
import social from "../data/social.json";
import callButton from "../data/call-button.json";
import { urlFor, type Edition } from "./editions";
import { absolute } from "./seo";
import { t } from "./content";
import { hospitalsIn, hospitalName, hospitalPosition, HOSPITAL_PATHS, type Hospital } from "./hospitals";
import type { Post } from "./news";
import type { AuthorFile } from "./authors-schema";
import { authorBio, authorHref, authorName, authorRole } from "./authors";

/*
 * JSON-LD structured data (SEO & GEO Dashboard Spec, Phase 1, 29 Oct 2026): the group on the edition homes, a Hospital on each
 * hospital page, an Article / NewsArticle on each Media Hub post. Only values the site already holds; an empty field (hospital
 * phone / hours, B3) is left out, never guessed. Rendered in the page head: <script slot="head" type="application/ld+json"
 * set:html={ldJson(...)} />.
 */

const ORG_ID = `${SITE_URL}/#organization`;
const hospitalId = (h: Hospital) => `${SITE_URL}/#hospital-${h.slug}`;

/** JSON for a <script type="application/ld+json">: "<" escaped so text from the data can never close the script tag. */
export const ldJson = (data: object) => JSON.stringify(data).replace(/</g, "\\u003c");

/** The edition's own social profiles (social.json byRegion), non-empty only. */
function sameAs(edition: Edition): string[] {
  const own = (social.byRegion as Record<string, Record<string, string>>)[edition.region] ?? {};
  const links = (social.links as { id: string; href: string }[]).map((l) => own[l.id] ?? l.href);
  return [...links, own.threads].filter((href): href is string => !!href);
}

/** Short reference to the group, for publisher / parentOrganization. */
const orgRef = () => ({
  "@type": "MedicalOrganization",
  "@id": ORG_ID,
  name: org.name,
  logo: absolute(org.logo),
});

/** The group (edition home): name, logo, the edition's phone and social profiles, and its hospitals. */
export function organizationSchema(edition: Edition) {
  const phone = (callButton.phone as Record<string, string | null>)[edition.region];
  return {
    "@context": "https://schema.org",
    ...orgRef(),
    alternateName: org.alternateName,
    url: absolute(urlFor(edition)),
    inLanguage: edition.lang,
    ...(phone && { telephone: phone }),
    sameAs: sameAs(edition),
    subOrganization: hospitalsIn(edition).map((h) => ({
      "@type": "Hospital",
      "@id": hospitalId(h),
      name: hospitalName(h, edition.locale),
      url: absolute(urlFor(edition, HOSPITAL_PATHS.detail(h.slug))),
    })),
  };
}

/** One hospital (its detail page): address, position and, once supplied, phone and opening hours. */
export function hospitalSchema(h: Hospital, edition: Edition) {
  const loc = edition.locale;
  const p = hospitalPosition(h);
  const hours = h.hours?.en ? t(h.hours, loc, "hospitals") : "";
  return {
    "@context": "https://schema.org",
    "@type": "Hospital",
    "@id": hospitalId(h),
    name: hospitalName(h, loc),
    url: absolute(urlFor(edition, HOSPITAL_PATHS.detail(h.slug))),
    inLanguage: edition.lang,
    address: {
      "@type": "PostalAddress",
      streetAddress: t(h.address, loc, "hospitals"),
      addressLocality: t(h.city, loc, "hospitals"),
      addressCountry: h.region.toUpperCase(),
    },
    ...(p && { geo: { "@type": "GeoCoordinates", latitude: p.lat, longitude: p.lng } }),
    ...(h.phone && { telephone: h.phone }),
    ...(hours && { openingHours: hours }),
    parentOrganization: orgRef(),
  };
}

const personId = (a: AuthorFile) => `${SITE_URL}/#person-${a.slug}`;
const personRef = (a: AuthorFile, edition: Edition) => ({ "@type": "Person", "@id": personId(a), name: authorName(a, edition.locale), url: absolute(authorHref(a, edition)) });

/** An author / reviewer (author page, and referenced from the articles): name, role, credentials, bio, photo, profiles. */
export function personSchema(a: AuthorFile, edition: Edition, photo?: string) {
  const loc = edition.locale;
  const role = authorRole(a, loc);
  const bio = authorBio(a, loc);
  return {
    "@context": "https://schema.org",
    ...personRef(a, edition),
    ...(role && { jobTitle: role }),
    ...(bio && { description: bio }),
    ...(photo && { image: photo }),
    ...(a.credentials && { hasCredential: { "@type": "EducationalOccupationalCredential", name: a.credentials } }),
    sameAs: [a.linkedin, ...a.same_as].filter(Boolean),
    worksFor: orgRef(),
  };
}

/** FAQPage for the questions of an article (the FAQ page builds its own). */
export function faqSchema(faqs: { q: string; a: string }[], edition: Edition) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: edition.lang,
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a.replace(/\s*\n\s*/g, " ") } })),
  };
}

/**
 * A Media Hub post: Article for the spec's blogs (`type` blog = health articles), NewsArticle for press releases, events,
 * conferences, interviews. GEO fields when the post has them: a named author / reviewer (Person), dateModified from
 * `updated`, the key takeaways as the description, the sources as citations.
 */
export function articleSchema(post: Post, edition: Edition, o: { url: string; description: string; image?: string; author?: AuthorFile; reviewer?: AuthorFile }) {
  const takeaways = post.key_takeaways?.filter(Boolean) ?? [];
  const sources = post.sources?.filter((s) => s.url) ?? [];
  return {
    "@context": "https://schema.org",
    "@type": post.type === "blog" ? "Article" : "NewsArticle",
    headline: post.title,
    description: takeaways.length ? takeaways.join(" ") : o.description,
    url: o.url,
    mainEntityOfPage: o.url,
    inLanguage: edition.lang,
    datePublished: post.date,
    dateModified: post.updated || post.date,
    ...(o.image && { image: [o.image] }),
    author: o.author ? personRef(o.author, edition) : orgRef(),
    ...(o.reviewer && { reviewedBy: personRef(o.reviewer, edition) }),
    publisher: orgRef(),
    ...(sources.length && { citation: sources.map((s) => ({ "@type": "CreativeWork", name: s.title || s.url, url: s.url })) }),
  };
}
