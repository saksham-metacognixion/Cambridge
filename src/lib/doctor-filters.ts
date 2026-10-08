/*
 * Find a Doctor filter logic (scope 2.6). Pure functions, no DOM: used by the client island (src/scripts/doctor-filters.ts)
 * and by the tests (tests/doctor-filters.test.mjs).
 *
 * THE RULE: the selected country is never cleared by a change to any other filter. Only a country change may clear
 * the hospital, specialty or name, and only when it no longer fits that country (prune(), bug 052).
 *
 * URL: ?country=ae|sa|all &hospital=<hospital slug> &specialty=<specialty id> &q=<name text>
 *   - `country` is left out of the URL when it equals the edition's default (/ae -> ae, /sa -> sa, Global -> all).
 *     So on /ae the link for "all countries" is ?country=all.
 *   - Parameter values are always the English ids/slugs, also on Arabic pages (only the labels translate).
 */
export type Country = "all" | "ae" | "sa";

export interface FilterState {
  country: Country;
  hospital: string;
  specialty: string;
  q: string;
}

export interface FilterDoctor {
  slug: string;
  name: string;
  country: string;
  hospital: string;
  specialties: string[];
}

export interface FilterHospital {
  slug: string;
  /** country of the hospital (hospitals.json "region") */
  country: string;
}

export const COUNTRIES: Country[] = ["all", "ae", "sa"];

/** Default country of an edition's region: Global shows everyone, /ae and /sa only their own doctors. */
export function defaultCountry(region: string): Country {
  return region === "ae" || region === "sa" ? region : "all";
}

export function defaultState(region: string): FilterState {
  return {
    country: defaultCountry(region),
    hospital: "",
    specialty: "",
    q: "",
  };
}

const isCountry = (v: string | null): v is Country =>
  v !== null && (COUNTRIES as string[]).includes(v);

/** Read the filter state from a query string. Unknown / missing values fall back to the edition defaults. */
export function parseState(
  search: string,
  region: string,
  hospitals: FilterHospital[] = [],
  /** known specialty ids; when given, an unknown ?specialty= is ignored */
  specialties?: string[],
): FilterState {
  const p = new URLSearchParams(search);
  const state = defaultState(region);
  const country = p.get("country");
  if (isCountry(country)) state.country = country;
  state.hospital = p.get("hospital") ?? "";
  state.specialty = p.get("specialty") ?? "";
  state.q = (p.get("q") ?? "").trim();
  // A shared link with a hospital from another country keeps the country (the country wins, never the other way round).
  if (state.hospital && !hospitalFits(state.hospital, state.country, hospitals))
    state.hospital = "";
  // Unknown ids (hand-edited or stale links) are ignored rather than filtering everything out.
  if (
    state.hospital &&
    hospitals.length &&
    !hospitals.some((h) => h.slug === state.hospital)
  )
    state.hospital = "";
  if (state.specialty && specialties && !specialties.includes(state.specialty))
    state.specialty = "";
  return state;
}

/** Query string ("?country=sa&specialty=x" or "") for a state; defaults are left out. */
export function toSearch(state: FilterState, region: string): string {
  const p = new URLSearchParams();
  if (state.country !== defaultCountry(region)) p.set("country", state.country);
  if (state.hospital) p.set("hospital", state.hospital);
  if (state.specialty) p.set("specialty", state.specialty);
  if (state.q.trim()) p.set("q", state.q.trim());
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function hospitalFits(
  hospital: string,
  country: Country,
  hospitals: FilterHospital[],
): boolean {
  if (!hospital || country === "all") return true;
  const h = hospitals.find((x) => x.slug === hospital);
  return !!h && h.country === country;
}

/** Hospitals offered for the selected country (all of them for "all"). */
export function hospitalsFor(
  country: Country,
  hospitals: FilterHospital[],
): FilterHospital[] {
  return country === "all"
    ? hospitals
    : hospitals.filter((h) => h.country === country);
}

/* ── state changes: each returns a NEW state and touches only what it must ── */

export function setCountry(
  state: FilterState,
  country: Country,
  hospitals: FilterHospital[],
): FilterState {
  const next = { ...state, country };
  // Dependent option: a hospital that is not in the new country is cleared. Nothing else changes.
  if (!hospitalFits(next.hospital, country, hospitals)) next.hospital = "";
  return next;
}

export const setHospital = (
  state: FilterState,
  hospital: string,
): FilterState => ({ ...state, hospital });
export const setSpecialty = (
  state: FilterState,
  specialty: string,
): FilterState => ({ ...state, specialty });
export const setQuery = (state: FilterState, q: string): FilterState => ({
  ...state,
  q,
});

const norm = (s: string) =>
  s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export function matches(d: FilterDoctor, s: FilterState): boolean {
  if (s.country !== "all" && d.country !== s.country) return false;
  if (s.hospital && d.hospital !== s.hospital) return false;
  if (s.specialty && !d.specialties.includes(s.specialty)) return false;
  if (s.q && !norm(d.name).includes(norm(s.q))) return false;
  return true;
}

/** Doctors that pass the filters, in their original order. */
export function applyFilters<T extends FilterDoctor>(
  doctors: T[],
  s: FilterState,
): T[] {
  return doctors.filter((d) => matches(d, s));
}

/* ── dependent dropdowns (bug 052) ──
 * Each dropdown offers only the values of the doctors that pass EVERY OTHER filter, so no option can lead to
 * "No doctors match your search": the specialty list follows country + name, the name list follows country + specialty. */

/** Specialty ids offered for a state: the specialties of the doctors that match everything except the specialty. */
export function specialtyOptions(
  doctors: FilterDoctor[],
  s: FilterState,
): Set<string> {
  return new Set(
    applyFilters(doctors, { ...s, specialty: "" }).flatMap(
      (d) => d.specialties,
    ),
  );
}

/** Doctor names offered for a state: the doctors that match everything except the name text. */
export function nameOptions(
  doctors: FilterDoctor[],
  s: FilterState,
): Set<string> {
  return new Set(applyFilters(doctors, { ...s, q: "" }).map((d) => d.name));
}

/** True when `name` contains the typed text (case and accents ignored), the rule the name dropdown filters with. */
export const nameMatches = (name: string, text: string) =>
  norm(name).includes(norm(text));

/**
 * Clears what the country no longer allows: a specialty no doctor of that country has, then a name that matches no doctor
 * of that country (+ specialty). Run after a country change and on a URL from outside, never on typing (typed text with no
 * match is a legitimate empty search). The country itself is never touched.
 */
export function prune(s: FilterState, doctors: FilterDoctor[]): FilterState {
  const next = { ...s };
  if (
    next.specialty &&
    !specialtyOptions(doctors, { ...next, q: "" }).has(next.specialty)
  )
    next.specialty = "";
  if (next.q && applyFilters(doctors, next).length === 0) next.q = "";
  return next;
}
