import hospitalData from "../data/hospitals.json";
import pageConfig from "../data/hospitals-page.json";
import { PAGE_PATHS, pagePath } from "./paths";
import {
  editions,
  getEdition,
  urlFor,
  type Edition,
  type LocaleId,
} from "./editions";
import { content, t, type Localized } from "./content";

/*
 * Hospitals (src/data/hospitals.json, Pramod's export later) and their detail pages (one template, Figma 112:7721).
 * URL pattern in ONE place: hospitals/<path> (the live site's URLs quoted in the client's documents, e.g.
 * /ae/hospitals/cambridge-hospital-abu-dhabi/; `path` per hospital in hospitals.json, the internal `slug` is unchanged).
 * Editions: a hospital's page exists on Global (all six) and on its own region (/ae: the UAE three, /sa: the KSA three),
 * in both languages (scope 2.5 "filtered by region"; H1 / HD3).
 * Full page content (Figma has Abu Dhabi only): src/data/content/hospital-detail/<slug>.<locale>.json; a hospital without
 * that file gets a page generated from its data (title "Advanced Care in <city>", map band, care cards, CTA, doctors) and a
 * "content pending" note on staging (showPendingNote).
 */
export interface Hospital {
  slug: string;
  /** URL segment under hospitals/ (live site URL) */
  path: string;
  brand: Localized;
  city: Localized;
  region: "ae" | "sa";
  photo: string;
  address: Localized;
  listPhoto: string;
  listTitleCityless?: boolean;
  /** click-to-call number, international format ("+971 2 ..."); empty = not shown (B3) */
  phone?: string;
  /** opening hours text per language; empty = not shown (B3) */
  hours?: Localized;
  /** "Open in Google Maps" target; empty = a Google Maps search for the address */
  mapUrl?: string;
}

export const hospitals = hospitalData.hospitals as Hospital[];

export const HOSPITAL_PATHS = {
  list: PAGE_PATHS.hospitals,
  detail: (slug: string) => `${PAGE_PATHS.hospitals}/${hospital(slug).path}`,
};

export function hospital(slug: string): Hospital {
  const h = hospitals.find((x) => x.slug === slug);
  if (!h)
    throw new Error(
      `Unknown hospital slug "${slug}" (src/data/hospitals.json)`,
    );
  return h;
}

/** Hospitals that have a page in an edition: all on Global, the region's own elsewhere. */
export const hospitalsIn = (edition: Edition) =>
  hospitals.filter(
    (h) => edition.region === "global" || h.region === edition.region,
  );

/** Edition ids where a hospital's page exists (for hreflang and the sitemaps). */
export const hospitalEditions = (h: Hospital) =>
  editions
    .filter((e) => e.region === "global" || e.region === h.region)
    .map((e) => e.id);

export const hospitalName = (h: Hospital, locale: LocaleId) =>
  `${t(h.brand, locale, "hospitals")} ${t(h.city, locale, "hospitals")}`;

/** URL of a hospital's page seen from an edition: the same edition when the page exists there, else the hospital's own region in the same language. */
export function hospitalHref(slug: string, edition: Edition): string {
  const h = hospital(slug);
  const e =
    edition.region === "global" || edition.region === h.region
      ? edition
      : getEdition(h.region, edition.locale);
  return urlFor(e, HOSPITAL_PATHS.detail(slug));
}

/** "View Hospital" / "Visit Page" target (src/data/hospitals-page.json): the detail page, or a page key while the pages are off. */
export function viewHospitalHref(slug: string, edition: Edition): string {
  const v = pageConfig.viewHospital as { detail?: boolean; page?: string };
  return v.detail
    ? hospitalHref(slug, edition)
    : urlFor(edition, pagePath(v.page ?? "contact"));
}

/** Google Maps target: the hospital's own URL, else a Maps search for its address. */
export const mapsHref = (h: Hospital, locale: LocaleId) =>
  h.mapUrl ||
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hospitalName(h, "en")}, ${t(h.address, locale, "hospitals")}`)}`;

const detailFiles = import.meta.glob(
  "../data/content/hospital-detail/*.en.json",
);
/** Slugs with a full content file. */
export const detailSlugs = new Set(
  Object.keys(detailFiles).map((p) => p.replace(/^.*\/(.+)\.en\.json$/, "$1")),
);

export const detailContent = (slug: string, locale: LocaleId) =>
  detailSlugs.has(slug) ? content(`hospital-detail/${slug}`, locale) : null;
