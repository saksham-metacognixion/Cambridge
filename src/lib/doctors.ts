import doctorData from '../data/doctors.json';
import hospitalData from '../data/hospitals.json';
import specialtyData from '../data/specialties.json';
import { t, type Localized } from './content';
import type { LocaleId } from './editions';

/*
 * Doctors come from src/data/doctors.json (Pramod's export later; schema in the $comment of that file).
 * URL pattern in ONE place: list = the live site's /patient-hub/find-a-doctor/ (WordPress export, 6 Oct 2026); the profile
 * pattern is UNCONFIRMED (the doctor records are not in the export): profiles sit under the list.
 */
export const DOCTOR_PATHS = {
  list: 'patient-hub/find-a-doctor',
  /** path inside the edition of one doctor profile */
  profile: (slug: string) => `patient-hub/find-a-doctor/${slug}`,
};

export interface Doctor {
  id: string;
  slug: string;
  old_url?: string;
  name: Localized;
  title: Localized;
  specialties: string[];
  hospital_id: string;
  country: 'ae' | 'sa' | ''; // '' = no country in WordPress (Global list only)
  languages: Localized[] | string[];
  bio: Localized;
  sub_specialities: Localized[];
  photo: string;
  photo_alt?: Localized;
  card_photo?: { size?: number; h?: number; dx?: number };
  listed?: boolean;
  wp_media?: number;
  home_photo?: string;
  home_title?: Localized;
  show_book_now?: boolean;
}

/** Doctors shown in the list and given a profile page. */
export const allDoctors: Doctor[] = (doctorData.doctors as unknown as Doctor[]).filter((d) => d.listed !== false);
/** Every doctor incl. the ones not in the list (profiles are generated for all of them). */
export const profileDoctors: Doctor[] = doctorData.doctors as unknown as Doctor[];

export const hospitals = hospitalData.hospitals;
export const specialties = specialtyData.specialties;

export const hospitalName = (slug: string, locale: LocaleId) => {
  const h = hospitals.find((x) => x.slug === slug);
  return h ? `${t(h.brand, locale, 'hospitals')} ${t(h.city, locale, 'hospitals')}` : '';
};
export const specialtyName = (id: string, locale: LocaleId) => {
  const s = specialties.find((x) => x.id === id);
  return s ? t(s.name, locale, 'specialties') : id;
};

/** Everything the client filter needs per card, as data attributes. */
export const filterHospitals = hospitals.map((h) => ({ slug: h.slug, country: h.region }));

/** Full role for a specialty (e.g. "General Practitioner" for GP); falls back to the specialty name. */
export const specialtyRole = (id: string, locale: LocaleId) => {
  const s = specialties.find((x) => x.id === id);
  return (s?.role && t(s.role, locale, 'specialties')) || specialtyName(id, locale);
};

/** The line under a doctor's name: the designation, else (no designation in the WordPress export) the specialty roles. */
export const doctorRole = (d: Doctor, locale: LocaleId) =>
  t(d.title, locale, 'doctors') || d.specialties.map((s) => specialtyRole(s, locale)).join(', ');
