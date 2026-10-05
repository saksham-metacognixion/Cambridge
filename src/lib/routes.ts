/**
 * Registry of page paths inside an edition. Every page exists in all 6 editions.
 * Templates filled from JSON (doctors, hospitals, news) add their dynamic paths here, so the
 * sitemaps and hreflang stay complete.
 */
import { DOCTOR_PATHS, profileDoctors } from "./doctors";
import { PAGE_PATHS } from "./paths";
import { CONDITION_PATHS, allDetailSlugs } from "./conditions";
import { NEWS_PATHS, allPostSlugs } from "./news";
import { HOSPITAL_PATHS, hospitals, hospitalEditions } from "./hospitals";
import { CARE_PATHS, services } from "./care";
import type { Edition } from "./editions";

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
    { key: "why-cambridge", path: PAGE_PATHS.whyCambridge },
    { key: "accreditations", path: PAGE_PATHS.accreditations },
    { key: "hospitals", path: PAGE_PATHS.hospitals },
    ...hospitals.map((h) => ({
      key: `hospital-${h.slug}`,
      path: HOSPITAL_PATHS.detail(h.slug),
      editions: hospitalEditions(h),
    })),
    { key: "our-care", path: CARE_PATHS.hub },
    ...services.flatMap((s) => [
      { key: `care-${s.slug}`, path: CARE_PATHS.service(s.slug) },
      ...s.subServices.map((x) => ({
        key: `care-${s.slug}-${x.slug}`,
        path: CARE_PATHS.sub(s.slug, x.slug),
      })),
    ]),
    { key: "contact", path: PAGE_PATHS.contact },
    { key: "careers", path: PAGE_PATHS.careers },
    { key: "media-hub", path: NEWS_PATHS.list },
    ...allPostSlugs.map((slug) => ({
      key: `post-${slug}`,
      path: NEWS_PATHS.article(slug),
    })),
    { key: "patient-hub", path: PAGE_PATHS.patientHub },
    { key: "patient-feedback", path: PAGE_PATHS.patientFeedback },
    { key: "find-a-doctor", path: DOCTOR_PATHS.list },
    { key: "refer-patient", path: PAGE_PATHS.referPatient },
    { key: "insurance-providers", path: PAGE_PATHS.insuranceProviders },
    { key: "international-patients", path: PAGE_PATHS.internationalPatients },
    { key: "patient-testimonials", path: PAGE_PATHS.patientTestimonials },
    { key: "faq", path: PAGE_PATHS.faq },
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
