/**
 * Registry of page paths inside an edition. Every page exists in all 6 editions.
 * Templates filled from JSON (doctors, hospitals, news) add their dynamic paths here, so the
 * sitemaps and hreflang stay complete.
 */
import { DOCTOR_PATHS, profileDoctors } from "./doctors";
import { PAGE_PATHS, pagePath } from "./paths";
import legal from "../data/legal.json";
import { CONDITION_PATHS, allDetailSlugs } from "./conditions";
import { NEWS_PATHS, allPostSlugs } from "./news";
import { HOSPITAL_PATHS, hospitals, hospitalEditions } from "./hospitals";
import { CARE_PATHS, allCareNodes } from "./care";
import { calculators } from "./calculators";
import { urlFor, type Edition } from "./editions";

export interface PageRoute {
  key: string;
  /** path inside the edition, "" = edition home */
  path: string;
  /** edition ids that have the page; absent = all 6 */
  editions?: string[];
}

/** Every route; with an edition, only the routes that exist in it. */
export function allRoutes(edition?: Edition): PageRoute[] {
  const all = routes();
  return edition
    ? all.filter((r) => !r.editions || r.editions.includes(edition.id))
    : all;
}

function routes(): PageRoute[] {
  return [
    { key: "home", path: "" },
    { key: "about", path: PAGE_PATHS.about },
    { key: "who-we-are", path: PAGE_PATHS.whoWeAre },
    { key: "why-cambridge", path: PAGE_PATHS.whyCambridge },
    { key: "accreditations", path: PAGE_PATHS.accreditations },
    { key: "hospitals", path: PAGE_PATHS.hospitals },
    ...hospitals.map((h) => ({
      key: `hospital-${h.slug}`,
      path: HOSPITAL_PATHS.detail(h.slug),
      editions: hospitalEditions(h),
    })),
    { key: "our-care", path: CARE_PATHS.hub },
    ...allCareNodes().map((p) => ({
      key: `care-${p.trail.join("-")}`,
      path: CARE_PATHS.of(p.trail),
    })),
    { key: "contact", path: PAGE_PATHS.contact },
    { key: "careers", path: PAGE_PATHS.careers },
    { key: "media-hub", path: NEWS_PATHS.list },
    ...allPostSlugs.map((slug) => ({
      key: `post-${slug}`,
      path: NEWS_PATHS.article(slug),
    })),
    { key: "patient-hub", path: PAGE_PATHS.patientHub },
    ...calculators.map((c) => ({
      key: `calculator-${c.key}`,
      path: pagePath(c.page),
    })),
    { key: "patient-feedback", path: PAGE_PATHS.patientFeedback },
    { key: "find-a-doctor", path: DOCTOR_PATHS.list },
    { key: "refer-patient", path: PAGE_PATHS.referPatient },
    { key: "insurance-providers", path: PAGE_PATHS.insuranceProviders },
    { key: "international-patients", path: PAGE_PATHS.internationalPatients },
    { key: "patient-testimonials", path: PAGE_PATHS.patientTestimonials },
    { key: "faq", path: PAGE_PATHS.faq },
    ...legal.pages.map((p) => ({
      key: `legal-${p.slug}`,
      path: pagePath(p.page),
    })),
    { key: "conditions", path: CONDITION_PATHS.list },
    ...allDetailSlugs.map((slug) => ({
      key: `condition-${slug}`,
      path: CONDITION_PATHS.detail(slug),
    })),
    ...profileDoctors.map((d) => ({
      key: `doctor-${d.slug}`,
      path: DOCTOR_PATHS.profile(d.slug),
    })),
  ];
}

/**
 * Language / region switch target: the same page path in the other edition when it exists there, else the nearest
 * ancestor that does (a KSA hospital page seen from /ae -> /ae/hospitals), else the edition home. Keeps the switches
 * from landing on a 404 (scope 2.2: "same page in the other language / region where it exists").
 */
export function switchHref(target: Edition, path: string): string {
  const paths = new Set(allRoutes(target).map((r) => r.path));
  let p = path.replace(/^\/+|\/+$/g, "");
  while (p && !paths.has(p)) p = p.includes("/") ? p.slice(0, p.lastIndexOf("/")) : "";
  return urlFor(target, p);
}
