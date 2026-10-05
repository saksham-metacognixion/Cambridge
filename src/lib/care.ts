import data from "../data/care.json";
import { PAGE_PATHS } from "./paths";
import { content, type Localized } from "./content";
import type { LocaleId } from "./editions";

/*
 * Our Care hierarchy (src/data/care.json): Our Care hub (Figma 36:5631) -> service pages (Inpatient Care 83:226; Outpatient,
 * Home Health, In School have no Figma page yet) -> sub-service pages (Post Acute Care 41:1730; the other five have no Figma
 * page yet) -> condition detail pages (src/lib/conditions.ts).
 * URL pattern in ONE place: our-care, our-care/<service>, our-care/<service>/<sub>. UNCONFIRMED (docs/open-decisions.md OC2).
 * Full page text: src/data/content/care/<slug>.<locale>.json; pages without a file are generated from care.json and marked
 * "content pending" on staging (showPendingNote in src/lib/conditions.ts).
 */
export interface SubService {
  slug: string;
  figma?: string;
  title: Localized;
  desc: { en: string[]; ar?: string[] };
  image: string;
  alt: string;
}
export interface Service {
  slug: string;
  figma?: string;
  title: Localized;
  subServices: SubService[];
}

export const services = data.services as Service[];

export const CARE_PATHS = {
  hub: PAGE_PATHS.ourCare,
  service: (slug: string) => `${PAGE_PATHS.ourCare}/${slug}`,
  sub: (service: string, sub: string) =>
    `${PAGE_PATHS.ourCare}/${service}/${sub}`,
};

export const service = (slug: string): Service => {
  const s = services.find((x) => x.slug === slug);
  if (!s)
    throw new Error(`Unknown service slug "${slug}" (src/data/care.json)`);
  return s;
};

/** Description lines for a locale (English fallback, like `t`). */
export const descLines = (d: SubService["desc"], locale: LocaleId) =>
  locale !== "en" && d[locale]?.length ? d[locale]! : d.en;

const files = import.meta.glob("../data/content/care/*.en.json");
/** Slugs (service or sub-service) with a full content file. */
export const careContentSlugs = new Set(
  Object.keys(files).map((p) => p.replace(/^.*\/(.+)\.en\.json$/, "$1")),
);
export const careContent = (slug: string, locale: LocaleId) =>
  careContentSlugs.has(slug) && slug !== "shared"
    ? content(`care/${slug}`, locale)
    : null;
