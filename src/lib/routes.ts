/**
 * Registry of page paths inside an edition. Every page exists in all 6 editions.
 * Templates filled from JSON (doctors, hospitals, news) add their dynamic paths here, so the
 * sitemaps and hreflang stay complete.
 */
import { DOCTOR_PATHS, profileDoctors } from './doctors';

export interface PageRoute {
  key: string;
  /** path inside the edition, "" = edition home */
  path: string;
}

export function allRoutes(): PageRoute[] {
  return [
    { key: 'home', path: '' },
    { key: 'contact', path: 'contact' },
    { key: 'media-hub', path: 'media-hub' },
    { key: 'find-a-doctor', path: DOCTOR_PATHS.list },
    ...profileDoctors.map((d) => ({ key: `doctor-${d.slug}`, path: DOCTOR_PATHS.profile(d.slug) })),
  ];
}
