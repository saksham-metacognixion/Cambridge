import config from "../data/forms.json";
import { resolveForms, type RawForm } from "./form-config";
import specialtiesData from "../data/specialties.json";
import doctorsData from "../data/doctors.json";
import hospitalsData from "../data/hospitals.json";
import countriesData from "../data/countries.json";
import { content, t } from "./content";
import type { Edition, LocaleId } from "./editions";

/*
 * Build-time side of the forms (scope 2.7). The field list of every form lives in src/data/forms.json, shared with the
 * serverless function; the text lives in src/data/content/forms/<form>.<locale>.json; dropdown options come from the
 * entity JSON (specialties, doctors, hospitals). Components only place the fields in their Figma layout block.
 */
export interface FieldConfig {
  name: string;
  label?: string;
  type:
    | "text"
    | "email"
    | "tel"
    | "date"
    | "select"
    | "radio"
    | "rating"
    | "textarea";
  required: boolean;
  max?: number;
  options?: string[];
  source?: "specialties" | "doctors" | "hospitals" | "countries";
  autocomplete?: string;
  ui?: { group?: string; inputAt?: number; strong?: boolean };
}
export interface FormConfig {
  subject: string;
  inbox: string;
  fields: FieldConfig[];
}

const forms = resolveForms(config.forms as Record<string, RawForm>) as unknown as Record<string, FormConfig>;

export function formConfig(id: string): FormConfig {
  const f = forms[id];
  if (!f) throw new Error(`Unknown form "${id}" (src/data/forms.json)`);
  return f;
}

/** Fields of a form that belong to one Figma layout block, in config order. */
export const fieldsIn = (id: string, group: string) =>
  formConfig(id).fields.filter((f) => (f.ui?.group ?? "details") === group);

export interface Option {
  value: string;
  label: string;
  specialties?: string;
  region?: string;
}

/** Options of a data-backed select. Doctors carry their specialties + region so the browser can filter them. */
export function sourceOptions(
  source: FieldConfig["source"],
  edition: Edition,
): Option[] {
  const loc = edition.locale;
  if (source === "specialties")
    return specialtiesData.specialties.map((s) => ({
      value: s.id,
      label: t(s.name, loc, "specialties"),
    }));
  if (source === "doctors")
    return doctorsData.doctors.map((d) => ({
      value: d.slug,
      label: t(d.name, loc, "doctors"),
      specialties: d.specialties.join(" "),
      region: d.country,
    }));
  if (source === "hospitals")
    return hospitalsData.hospitals
      .filter((h) => edition.region === "global" || h.region === edition.region)
      .map((h) => ({
        value: h.slug,
        label: `${t(h.brand, loc, "hospitals")} ${t(h.city, loc, "hospitals")}`,
      }));
  if (source === "countries")
    return countriesData.countries
      .map((c) => ({ value: c.code, label: t(c.name, loc, "countries") }))
      .sort((a, b) => a.label.localeCompare(b.label, loc));
  return [];
}

/** Shared text (consent, close, errors, success) for a locale. */
export const commonText = (locale: LocaleId) => content("forms/common", locale);

/** What the browser script needs to validate a form: the rules from the config + the error strings. */
export function clientConfig(id: string, locale: LocaleId) {
  const c = commonText(locale);
  return JSON.stringify({
    id,
    fields: formConfig(id).fields.map(
      ({ name, type, required, max, options }) => ({
        name,
        type,
        required,
        max,
        options,
      }),
    ),
    errors: c.errors,
    sending: c.sending,
  });
}

/** Ids for a field inside a form, unique on the page. */
export const fieldId = (form: string, name: string) => `${form}-${name}`;

/** Visible label "Name*": the asterisk is decoration (the input is `required`, which screen readers announce). */
export function splitStar(label: string): [string, string] {
  return label.endsWith("*") ? [label.slice(0, -1), "*"] : [label, ""];
}
