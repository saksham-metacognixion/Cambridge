import doctorData from '../data/doctors.json';
import hospitalData from '../data/hospitals.json';
import specialtyData from '../data/specialties.json';
import { t, type Localized } from './content';
import homeDoctors from '../data/content/home/doctors.en.json';
import { editions, getEdition, urlFor, type Edition, type LocaleId } from './editions';

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

/** Country code of an edition as used in the data files ('ae' | 'sa'), null on Global. */
export const editionCountry = (e: Edition): 'ae' | 'sa' | null => (e.country ? (e.country.toLowerCase() as 'ae' | 'sa') : null);

/**
 * A doctor list for one edition: on /ae and /sa the doctors of that country, if the list has any (bug 041 / 048);
 * otherwise (Global, or none in that country) the whole list. Order kept.
 */
export function doctorsForEdition<T extends { country: string }>(list: T[], e: Edition): T[] {
  const c = editionCountry(e);
  const own = c ? list.filter((d) => d.country === c) : [];
  return own.length ? own : list;
}

/**
 * Edition ids where a doctor's profile page exists: Global always, plus the doctor's own country (like the hospital pages),
 * so /sa never shows a UAE doctor and the KSA switch on a UAE profile goes to the KSA Find a Doctor list. No country = all.
 */
export const doctorEditions = (d: { country: string }) =>
  editions.filter((e) => e.region === 'global' || !d.country || e.region === d.country).map((e) => e.id);

/** Profile URL seen from an edition: the same edition when the page exists there, else the doctor's own country, same language. */
export function doctorHref(d: { slug: string; country: string }, edition: Edition): string {
  const e = doctorEditions(d).includes(edition.id) ? edition : getEdition(d.country as 'ae' | 'sa', edition.locale);
  return urlFor(e, DOCTOR_PATHS.profile(d.slug));
}

/**
 * The doctors of a fixed row ("Expert Care, Trusted Doctors": the Figma four, all UAE) for one edition. On /ae and /sa only
 * that country's doctors; when the list has none there, the first `list.length` doctors of the Home row under that
 * country's pill (the Home six from home/doctors JSON, then every other doctor with a photo, doctors.json order).
 */
export function rowDoctorsForEdition(list: Doctor[], e: Edition): Doctor[] {
  const c = editionCountry(e);
  if (!c) return list;
  const own = list.filter((d) => d.country === c);
  if (own.length) return own;
  const home = homeDoctors.doctors.map((s: string) => profileDoctors.find((d) => d.slug === s)!).filter(Boolean);
  const order = [...home, ...profileDoctors.filter((d) => d.photo && !home.includes(d))];
  return order.filter((d) => d.country === c && d.listed !== false).slice(0, list.length);
}

