/**
 * Registry of page paths inside an edition. Every page exists in all 6 editions.
 * Templates filled from JSON (doctors, hospitals, news) add their dynamic paths here, so the
 * sitemaps and hreflang stay complete.
 */
import { DOCTOR_PATHS, profileDoctors } from './doctors';
import { PAGE_PATHS } from './paths';
import { CONDITION_PATHS, allDetailSlugs } from './conditions';

export interface PageRoute {
  key: string;
  /** path inside the edition, "" = edition home */
  path: string;
}

export function allRoutes(): PageRoute[] {
  return [
    { key: 'home', path: '' },
    { key: 'about', path: PAGE_PATHS.about },
    { key: 'why-cambridge', path: PAGE_PATHS.whyCambridge },
    { key: 'contact', path: PAGE_PATHS.contact },
    { key: 'careers', path: PAGE_PATHS.careers },
    { key: 'media-hub', path: 'media-hub' },
    { key: 'patient-hub', path: PAGE_PATHS.patientHub },
    { key: 'patient-feedback', path: PAGE_PATHS.patientFeedback },
    { key: 'find-a-doctor', path: DOCTOR_PATHS.list },
    { key: 'refer-patient', path: PAGE_PATHS.referPatient },
    { key: 'insurance-providers', path: PAGE_PATHS.insuranceProviders },
    { key: 'international-patients', path: PAGE_PATHS.internationalPatients },
    { key: 'patient-testimonials', path: PAGE_PATHS.patientTestimonials },
    { key: 'faq', path: PAGE_PATHS.faq },
    { key: 'conditions', path: CONDITION_PATHS.list },
    ...allDetailSlugs.map((slug) => ({ key: `condition-${slug}`, path: CONDITION_PATHS.detail(slug) })),
    ...profileDoctors.map((d) => ({ key: `doctor-${d.slug}`, path: DOCTOR_PATHS.profile(d.slug) })),
  ];
}
