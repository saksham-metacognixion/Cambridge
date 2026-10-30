import { SITE_URL } from "../../site.config.mjs";
import org from "../data/organization.json";
import social from "../data/social.json";
import callButton from "../data/call-button.json";
import { urlFor, type Edition } from "./editions";
import { absolute } from "./seo";
import { t } from "./content";
import { hospitalsIn, hospitalName, hospitalPosition, HOSPITAL_PATHS, type Hospital } from "./hospitals";
import type { Post } from "./news";

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

/** A Media Hub post: Article for health articles (spec: blogs), NewsArticle for press releases, events, conferences, interviews. */
export function articleSchema(post: Post, edition: Edition, o: { url: string; description: string; image?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": post.category === "health-articles" ? "Article" : "NewsArticle",
    headline: post.title,
    description: o.description,
    url: o.url,
    mainEntityOfPage: o.url,
    inLanguage: edition.lang,
    datePublished: post.date,
    dateModified: post.date,
    ...(o.image && { image: [o.image] }),
    author: orgRef(),
    publisher: orgRef(),
  };
}
