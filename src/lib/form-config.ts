/*
 * Resolves src/data/forms.json for both the UI (src/lib/forms.ts) and the Pages Function: a form may be a VARIANT of
 * another one ({ "variantOf": "<form id>", "omitGroups": ["<ui.group>"], "subject"?: "..." }), i.e. the same fields minus
 * whole layout groups. Example: Refer a Patient "For Others" = "For Doctors" without the referring-doctor block.
 * So every field is defined once.
 */
export interface RawField {
  name: string;
  label?: string;
  type: string;
  required: boolean;
  max?: number;
  options?: string[];
  source?: string;
  autocomplete?: string;
  ui?: { group?: string; [k: string]: unknown };
}
export interface RawForm {
  subject?: string;
  inbox?: string;
  /** env variable with the recipients, instead of FORM_TO_<INBOX> */
  inboxEnv?: string;
  fields?: RawField[];
  variantOf?: string;
  omitGroups?: string[];
}
export interface ResolvedForm {
  subject: string;
  inbox: string;
  inboxEnv?: string;
  fields: RawField[];
}

export function resolveForms(forms: Record<string, RawForm>): Record<string, ResolvedForm> {
  const out: Record<string, ResolvedForm> = {};
  for (const [id, f] of Object.entries(forms)) {
    if (!f.variantOf) {
      out[id] = { subject: f.subject ?? id, inbox: f.inbox ?? id, ...(f.inboxEnv ? { inboxEnv: f.inboxEnv } : {}), fields: f.fields ?? [] };
      continue;
    }
    const base = forms[f.variantOf];
    if (!base || base.variantOf) throw new Error(`forms.json: "${id}" is a variant of unknown or variant form "${f.variantOf}"`);
    const omit = new Set(f.omitGroups ?? []);
    out[id] = {
      subject: f.subject ?? base.subject ?? id,
      inbox: f.inbox ?? base.inbox ?? f.variantOf,
      ...((f.inboxEnv ?? base.inboxEnv) ? { inboxEnv: f.inboxEnv ?? base.inboxEnv } : {}),
      fields: (base.fields ?? []).filter((x) => !omit.has(x.ui?.group ?? 'details')),
    };
  }
  return out;
}
