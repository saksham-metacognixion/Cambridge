import { DOCTOR_PATHS } from "./doctors";

/**
 * Page paths inside an edition, in ONE place (URL = urlFor(edition, path)). Content JSON names a page by key
 * (`"page": "referPatient"`), never by slug.
 * Slugs = the current site's URL structure (CLAUDE.md 5), read from the page URLs quoted in the client's content documents
 * ('Website Content - Suhad', 5 Oct 2026): /about/, /about/accreditations-partnerships/, /about/careers/, /care/, /hospitals/,
 * /patient-hub/conditions-specialities/, /patient-hub/refer-a-patient/, /patient-hub/international-patients/,
 * /patient-hub/testimonials/, /media-hub/, /your-opinion-matters/; Arabic = /ar/ prefix. Pages without a quoted URL keep the
 * Figma-derived slug (marked UNCONFIRMED). Change them here only (docs/open-decisions.md CT1).
 */
export const PAGE_PATHS = {
  /** About Cambridge (Figma 45:4982); live URL /about/ */
  about: "about",
  /** Why Cambridge (Figma 116:311). Slug UNCONFIRMED (no URL in the documents; the site map lists it under About). */
  whyCambridge: "about/why-cambridge",
  /** Accreditations & Partnerships (Figma 55:12215); live URL /about/accreditations-partnerships/ */
  accreditations: "about/accreditations-partnerships",
  /** Our Hospitals list (Figma 101:6247); live URL /hospitals/. Detail pages = hospitals/<path> (src/lib/hospitals.ts) */
  hospitals: "hospitals",
  /** Contact Us (Figma 86:431) */
  contact: "contact",
  /** Career Hub (Figma 112:7295); live URL /about/careers/ */
  careers: "about/careers",
  patientHub: "patient-hub",
  /** Your Opinion Matters / Patient Feedback Form (Figma 188:964); live URL /your-opinion-matters/ */
  patientFeedback: "your-opinion-matters",
  findDoctor: DOCTOR_PATHS.list,
  /** Conditions & Specialities (Figma 40:318); live URL /patient-hub/conditions-specialities/; detail pages = <this>/<slug> (src/lib/conditions.ts) */
  conditions: "patient-hub/conditions-specialities",
  /** Refer a Patient (Figma 59:14344); live URL /patient-hub/refer-a-patient/ */
  referPatient: "patient-hub/refer-a-patient",
  /** International Patients (Figma 54:9239); live URL /patient-hub/international-patients/ */
  internationalPatients: "patient-hub/international-patients",
  /** Insurance Providers (Figma 46:6844). Slug UNCONFIRMED (no URL in the documents; a Patient Hub page like its siblings). */
  insuranceProviders: "patient-hub/insurance-providers",
  /** FAQ (Figma 100:5509) */
  faq: "faq",
  /** Patient Testimonials (Figma 62:2403); live URL /patient-hub/testimonials/ */
  patientTestimonials: "patient-hub/testimonials",
  /** Our Care hub (Figma 36:5631); live URL /care/; services and programmes = care/<service>/... (CARE_PATHS in src/lib/care.ts) */
  ourCare: "care",
  /** Media Hub list (Figma 100:5522); live URL /media-hub/; articles = media-hub/<slug> (NEWS_PATHS in src/lib/news.ts) */
  mediaHub: "media-hub",
  /**
   * Legal templates (scope 2.5, no Figma frame): one template, content pending (docs/open-decisions.md B10, L1).
   * The consent row on every form (src/data/content/forms/common.*.json -> consent.link) and the footer legal links point here.
   */
  privacyPolicy: "privacy-policy",
  cookiePolicy: "cookie-policy",
  compliance: "compliance",
  /** 404 page (scope 2.5, no Figma frame): /404, /ae/404, ... = the file each prefix serves for an unknown URL. Cards whose slug has no page link here. */
  notFound: "404",
} as const;

export type PageKey = keyof typeof PAGE_PATHS;

export function pagePath(key: string): string {
  const p = (PAGE_PATHS as Record<string, string>)[key];
  if (p === undefined)
    throw new Error(
      `Unknown page key "${key}" (see PAGE_PATHS in src/lib/paths.ts)`,
    );
  return p;
}
