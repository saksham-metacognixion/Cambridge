import { DOCTOR_PATHS } from "./doctors";

/**
 * Page paths inside an edition, in ONE place (URL = urlFor(edition, path)). Content JSON names a page by key
 * (`"page": "referPatient"`), never by slug.
 * Slugs = the current site's URL structure (CLAUDE.md 5): the page URLs of the live site's WordPress export
 * (docs/cambridgehospital.WordPress.2026-10-06.xml, 6 Oct 2026), which confirmed the ones quoted in the client's documents
 * (5 Oct 2026) and settled the rest (/faqs/, /contact-us/, /about/why-cambridge-hospital/, /patient-hub/find-a-doctor/,
 * /legal/<slug>/, /care/home-healthcare/, /care/in-school/). Arabic = /ar/ prefix. Doctor profile and article slugs stay
 * unconfirmed (not in the export). Change them here only (docs/open-decisions.md CT1 / WP1).
 */
export const PAGE_PATHS = {
  /** About Cambridge (Figma 45:4982); live URL /about/ */
  about: "about",
  /** Why Cambridge (Figma 116:311); live URL /about/why-cambridge-hospital/ (WordPress export, 6 Oct 2026) */
  whyCambridge: "about/why-cambridge-hospital",
  /** Who We Are (Figma 46:5841); live URL /about/who-we-are/ (WordPress export, 6 Oct 2026) */
  whoWeAre: "about/who-we-are",
  /** Accreditations & Partnerships (Figma 55:12215); live URL /about/accreditations-partnerships/ */
  accreditations: "about/accreditations-partnerships",
  /** Our Hospitals list (Figma 101:6247); live URL /hospitals/. Detail pages = hospitals/<path> (src/lib/hospitals.ts) */
  hospitals: "hospitals",
  /** Contact Us (Figma 86:431); live URL /contact-us/ (WordPress export, 6 Oct 2026) */
  contact: "contact-us",
  /** Career Hub (Figma 112:7295); live URL /about/careers/ */
  careers: "about/careers",
  patientHub: "patient-hub",
  /**
   * Health calculators (Home "Check Your Health in Seconds", bug 014; no Figma frame): live URLs kept so the old links
   * work without a redirect (WordPress export, 6 Oct 2026). Template: src/pages/[...base]/[calculator].astro, fields in
   * src/data/calculators.json, formulas in src/lib/calculator-formulas.ts.
   */
  bmiCalculator: "bmi-calculator",
  strokeRiskCalculator: "stroke-risk-calculator",
  heartAgeCalculator: "heart-health-age-calculator",
  lungHealthCalculator: "lung-health-calculator",
  /** Your Opinion Matters / Patient Feedback Form (Figma 188:964); live URL /your-opinion-matters/ */
  patientFeedback: "your-opinion-matters",
  findDoctor: DOCTOR_PATHS.list,
  /** Conditions & Specialities (Figma 40:318); live URL /patient-hub/conditions-specialities/; detail pages = <this>/<slug> (src/lib/conditions.ts) */
  conditions: "patient-hub/conditions-specialities",
  /** Refer a Patient (Figma 59:14344); live URL /patient-hub/refer-a-patient/ */
  referPatient: "patient-hub/refer-a-patient",
  /** International Patients (Figma 54:9239); live URL /patient-hub/international-patients/ */
  internationalPatients: "patient-hub/international-patients",
  /** Insurance Providers (Figma 46:6844); live URL /patient-hub/insurance-providers/ (WordPress export, 6 Oct 2026) */
  insuranceProviders: "patient-hub/insurance-providers",
  /** FAQ (Figma 100:5509); live URL /faqs/ (WordPress export, 6 Oct 2026) */
  faq: "faqs",
  /** Patient Testimonials (Figma 62:2403); live URL /patient-hub/testimonials/ */
  patientTestimonials: "patient-hub/testimonials",
  /** Our Care hub (Figma 36:5631); live URL /care/; services and programmes = care/<service>/... (CARE_PATHS in src/lib/care.ts) */
  ourCare: "care",
  /** Media Hub list (Figma 100:5522); live URL /media-hub/; articles = media-hub/<slug> (NEWS_PATHS in src/lib/news.ts) */
  mediaHub: "media-hub",
  /**
   * Legal templates (scope 2.5, no Figma frame): one template, content pending (docs/open-decisions.md B10, L1).
   * Slugs = the live site's six legal pages under /legal/ (WordPress export, 6 Oct 2026; src/data/legal.json).
   * The consent row on every form (src/data/content/forms/common.*.json -> consent.link) and the footer legal links point here.
   */
  privacyPolicy: "legal/privacy-policy",
  cookiePolicy: "legal/cookie-policy",
  compliance: "legal/gdpr-compliance",
  patientRights: "legal/patient-rights",
  ethicsStatement: "legal/ethics-statement",
  accessibilityStatement: "legal/accessibility-statement",
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
