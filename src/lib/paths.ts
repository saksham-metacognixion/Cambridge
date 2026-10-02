import { DOCTOR_PATHS } from './doctors';

/**
 * Page paths inside an edition, in ONE place (URL = urlFor(edition, path)). Content JSON names a page by key
 * (`"page": "referPatient"`), never by slug.
 * Slugs follow the Figma frame names (figma-cache/frames.md). UNCONFIRMED with Pramod: cambridgehospital.com answers
 * automated requests with 403, so the current site's paths could not be read. Change them here only.
 * Pages marked "not built" are linked already; add them to allRoutes() (src/lib/routes.ts) when their template exists,
 * so they enter the sitemaps and hreflang.
 */
export const PAGE_PATHS = {
  patientHub: 'patient-hub',
  /** Patient Feedback Form (Figma 188:964). Slug UNCONFIRMED: the current site's URL could not be read. */
  patientFeedback: 'patient-feedback',
  findDoctor: DOCTOR_PATHS.list,
  /** not built (Figma 40:318) */
  conditions: 'conditions-specialities',
  /** not built (Figma 59:14344) */
  referPatient: 'refer-a-patient',
  /** not built (Figma 54:9239) */
  internationalPatients: 'international-patients',
  /** not built (Figma 46:6844) */
  insuranceProviders: 'insurance-providers',
  /** not built (Figma 62:2403) */
  patientTestimonials: 'patient-testimonials',
  /**
   * not built (Legal templates, scope 2.5). Still linked as "#" until the page exists: the consent row on every form
   * (src/data/content/forms/common.*.json -> consent.link.href) and the footer "Privacy Policy". Point both here then.
   */
  privacyPolicy: 'privacy-policy',
} as const;

export type PageKey = keyof typeof PAGE_PATHS;

export function pagePath(key: string): string {
  const p = (PAGE_PATHS as Record<string, string>)[key];
  if (p === undefined) throw new Error(`Unknown page key "${key}" (see PAGE_PATHS in src/lib/paths.ts)`);
  return p;
}
