import { DOCTOR_PATHS } from "./doctors";

/**
 * Page paths inside an edition, in ONE place (URL = urlFor(edition, path)). Content JSON names a page by key
 * (`"page": "referPatient"`), never by slug.
 * Slugs follow the Figma frame names (figma-cache/frames.md). UNCONFIRMED with Pramod: cambridgehospital.com answers
 * automated requests with 403, so the current site's paths could not be read. Change them here only.
 * Pages marked "not built" are linked already; add them to allRoutes() (src/lib/routes.ts) when their template exists,
 * so they enter the sitemaps and hreflang.
 */
export const PAGE_PATHS = {
  /** About Cambridge (Figma 45:4982). Slug UNCONFIRMED (docs/open-decisions.md A6). */
  about: "about",
  /** Why Cambridge (Figma 116:311), built after About. Slug UNCONFIRMED. */
  whyCambridge: "why-cambridge",
  /** Accreditations & Partnerships (Figma 55:12215). Slug UNCONFIRMED. */
  accreditations: "accreditations-partnerships",
  /** Our Hospitals list (Figma 101:6247). Slug UNCONFIRMED. Hospital DETAIL pages (Figma 112:7721) are not built yet. */
  hospitals: "our-hospitals",
  /** Contact Us (Figma 86:431) */
  contact: "contact",
  /** Careers (Figma 112:7295). Slug and scope UNCONFIRMED (docs/open-decisions.md D1, D2). */
  careers: "careers",
  patientHub: "patient-hub",
  /** Patient Feedback Form (Figma 188:964). Slug UNCONFIRMED: the current site's URL could not be read. */
  patientFeedback: "patient-feedback",
  findDoctor: DOCTOR_PATHS.list,
  /** Conditions & Specialities (Figma 40:318); detail pages = conditions-specialities/<slug> (src/lib/conditions.ts) */
  conditions: "conditions-specialities",
  /** Refer a Patient (Figma 59:14344) */
  referPatient: "refer-a-patient",
  /** International Patients (Figma 54:9239) */
  internationalPatients: "international-patients",
  /** Insurance Providers (Figma 46:6844) */
  insuranceProviders: "insurance-providers",
  /** FAQ (Figma 100:5509) */
  faq: "faq",
  /** Patient Testimonials (Figma 62:2403) */
  patientTestimonials: "patient-testimonials",
  /** Our Care hub (Figma 36:5631); services = our-care/<service>, sub-services = our-care/<service>/<sub> (CARE_PATHS in src/lib/care.ts). Slug UNCONFIRMED (OC2). */
  ourCare: "our-care",
  /** Media Hub list (Figma 100:5522); articles = media-hub/<slug> (NEWS_PATHS in src/lib/news.ts) */
  mediaHub: "media-hub",
  /**
   * Legal templates (scope 2.5, no Figma frame): one template, content pending (docs/open-decisions.md B10, L1).
   * The consent row on every form (src/data/content/forms/common.*.json -> consent.link) and the footer legal links point here.
   */
  privacyPolicy: "privacy-policy",
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
