import config from "../data/forms.json";
import { resolveForms, type RawForm } from "./form-config";
import specialtiesData from "../data/specialties.json";
import doctorsData from "../data/doctors.json";
import hospitalsData from "../data/hospitals.json";
import countriesData from "../data/countries.json";
import { content, t } from "./content";
import { acceptAttr, sizeLabel, typeList, type AttachmentRules } from "./attachments";
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
    | "textarea"
    | "file";
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
  consent: boolean;
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

/** Attachment rules (bug 093, src/data/forms.json `attachments`, provisional) and whether a form has a file field. */
export const attachmentRules = config.attachments as AttachmentRules;
export const hasFile = (id: string) => formConfig(id).fields.some((f) => f.type === "file");

/** Text of the attachment field with the configured types / size filled in ({types}, {size}). */
export function attachText(locale: LocaleId) {
  const a = commonText(locale).attach;
  const fill = (s: string) => s.replace("{types}", typeList(attachmentRules, a.or)).replace("{size}", sizeLabel(attachmentRules.maxBytes));
  return { ...a, hint: fill(a.hint), fileType: fill(a.errors.file_type), fileSize: fill(a.errors.file_size), accept: acceptAttr(attachmentRules) };
}

/** What the browser script needs to validate a form: the rules from the config + the error strings. */
export function clientConfig(id: string, locale: LocaleId) {
  const c = commonText(locale);
  const file = hasFile(id) ? attachText(locale) : undefined;
  return JSON.stringify({
    id,
    consent: formConfig(id).consent,
    fields: formConfig(id).fields.map(
      ({ name, type, required, max, options }) => ({
        name,
        type,
        required,
        max,
        options,
      }),
    ),
    errors: file
      ? { ...c.errors, file_type: file.fileType, file_size: file.fileSize, file_invalid: file.errors.file_invalid }
      : c.errors,
    sending: c.sending,
    ...(file ? { attachment: { ...attachmentRules, selected: file.selected, removed: file.removed } } : {}),
  });
}

/**
 * Label column of a grey-box page form row (Refer a Patient, International Patients; bug 119): the Figma `at` of the cell, raised to
 * the locale's minimum for its column (content `labelColumn`: Figma px per column, e.g. Arabic [0, 120]). A longer label (Arabic
 * "البريد الإلكتروني") then never narrows its own box: every box in that column starts at the same place. `narrow` = the same for the
 * one-column layout (768-1023), where both columns stack, so the largest minimum applies. Radios keep their Figma offset.
 */
export function labelAt(at: number, col: number, type: string, min?: number[]) {
  if (type === "radio" || !min?.length) return { at, narrow: at };
  return { at: Math.max(at, min[col] ?? 0), narrow: Math.max(at, ...min) };
}

/** Ids for a field inside a form, unique on the page. */
export const fieldId = (form: string, name: string) => `${form}-${name}`;

/** Visible label "Name*": the asterisk is decoration (the input is `required`, which screen readers announce). */
export function splitStar(label: string): [string, string] {
  return label.endsWith("*") ? [label.slice(0, -1), "*"] : [label, ""];
}
