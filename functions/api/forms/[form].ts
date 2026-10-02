/*
 * POST /api/forms/<form>  — Book an Appointment, Send an Enquiry (page + pop-up), Refer a Patient, Your Opinion Matters
 * (pop-up + Patient Feedback page). Validate -> verify Turnstile -> send ONE email -> answer. Nothing is stored: no
 * database, no KV, no logs of submissions (errors are logged by type only, never with field values).
 *
 * Request: multipart/form-data or urlencoded, fields per src/data/forms.json, plus
 *   consent=on (required on every form), cf-turnstile-response (added by the Turnstile widget), edition=<global|ae|sa>-<en|ar>.
 * Response: JSON { ok: true } | { ok: false, error, fields?: { <name>: "required" | "invalid" | "too_long" } } when the
 * client asks for JSON (Accept: application/json); otherwise a 303 back to the page with ?form=sent|error, so the
 * form also works without JavaScript. The EN/AR messages for these codes live in src/data/content/forms/common.*.json.
 * Recipient: env FORM_TO_<INBOX> (e.g. FORM_TO_BOOK_APPOINTMENT), see .env.example.
 */
import formsConfig from "../../../src/data/forms.json";
import specialtiesData from "../../../src/data/specialties.json";
import doctorsData from "../../../src/data/doctors.json";
import hospitalsData from "../../../src/data/hospitals.json";
import type { PagesContext } from "../../_lib/types";
import { verifyTurnstile } from "../../_lib/turnstile";
import { sendMail } from "../../_lib/email";

type Field = {
  name: string;
  label?: string;
  type: string;
  required: boolean;
  max?: number;
  options?: string[];
  source?: string;
};
const forms = formsConfig.forms as Record<
  string,
  { subject: string; inbox: string; fields: Field[] }
>;
const dialCodes = new Set(formsConfig.dialCodes.map((d) => d.code));
const REGIONS = ["global", "ae", "sa"];
const MAX_BODY = 32 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TEL_RE = /^[0-9][0-9 ()-]{4,18}$/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

// Options of data-backed selects: value -> English name (shown in the email).
const sources: Record<string, Map<string, string>> = {
  specialties: new Map(
    specialtiesData.specialties.map((s) => [s.id, s.name.en]),
  ),
  doctors: new Map(doctorsData.doctors.map((d) => [d.slug, d.name.en])),
  hospitals: new Map(
    hospitalsData.hospitals.map((h) => [h.slug, `${h.brand.en} ${h.city.en}`]),
  ),
};

export const onRequestPost = async ({
  request,
  env,
  params,
}: PagesContext<"form">) => {
  const wantsJson = (request.headers.get("Accept") ?? "").includes(
    "application/json",
  );
  const back = (status: "sent" | "error") => {
    const ref = request.headers.get("Referer");
    const url = new URL(
      ref && sameOrigin(ref, request) ? ref : "/",
      request.url,
    );
    url.searchParams.set("form", status);
    return Response.redirect(url.toString(), 303);
  };
  const fail = (
    status: number,
    error: string,
    fields?: Record<string, string>,
  ) =>
    wantsJson
      ? json({ ok: false, error, ...(fields ? { fields } : {}) }, status)
      : back("error");

  const formId = String(params.form);
  const form = Object.hasOwn(forms, formId) ? forms[formId] : undefined;
  if (!form) return fail(404, "unknown_form");

  if (!originAllowed(request, env.ALLOWED_ORIGINS)) return fail(403, "origin");
  if (Number(request.headers.get("Content-Length") ?? 0) > MAX_BODY)
    return fail(413, "too_large");

  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    return fail(400, "bad_request");
  }

  // Validation (required, format, length, allowed options) + consent on every form.
  const fields: Record<string, string> = {};
  const rows: [string, string][] = [];
  for (const f of form.fields) {
    const v = String(data.get(f.name) ?? "").trim();
    const error = check(f, v, data);
    if (error) fields[f.name] = error;
    rows.push([f.label ?? f.name, display(f, v, data)]);
  }
  const consent = String(data.get("consent") ?? "");
  if (!["on", "true", "1", "yes"].includes(consent))
    fields.consent = "required";
  if (Object.keys(fields).length) return fail(422, "validation", fields);

  // Spam protection.
  if (!env.TURNSTILE_SECRET_KEY) return fail(500, "not_configured");
  const human = await verifyTurnstile(
    String(data.get("cf-turnstile-response") ?? ""),
    env.TURNSTILE_SECRET_KEY,
    request.headers.get("CF-Connecting-IP"),
  );
  if (!human) return fail(403, "turnstile");

  // Recipient for this form type in this region.
  const edition = String(data.get("edition") ?? "global-en");
  const region = REGIONS.includes(edition.split("-")[0])
    ? edition.split("-")[0]
    : "global";
  const to = recipients(
    env[`FORM_TO_${form.inbox.toUpperCase().replace(/-/g, "_")}`],
    region,
  );
  if (!to.length) return fail(500, "not_configured");

  rows.push(["Edition", edition], ["Consent", "yes"]);
  const email = String(data.get("email") ?? "").trim();
  try {
    await sendMail(
      {
        to,
        subject: `${form.subject} — website (${edition})`,
        text: rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
        html: `<table>${rows.map(([k, v]) => `<tr><th align="left">${esc(k)}</th><td>${esc(v).replace(/\n/g, "<br>")}</td></tr>`).join("")}</table>`,
        replyTo: EMAIL_RE.test(email) ? email : undefined,
      },
      env,
    );
  } catch (e) {
    console.error(
      `form ${formId}: send failed (${e instanceof Error ? e.message : "unknown"})`,
    );
    return fail(502, "send_failed");
  }
  return wantsJson ? json({ ok: true }) : back("sent");
};

export const onRequest = () =>
  new Response("Method Not Allowed", {
    status: 405,
    headers: { Allow: "POST" },
  });

/** Error code for one field, or undefined when it is valid. */
function check(f: Field, v: string, data: FormData): string | undefined {
  if (!v) return f.required ? "required" : undefined;
  if (v.length > (f.max ?? 200)) return "too_long";
  switch (f.type) {
    case "email":
      return EMAIL_RE.test(v) ? undefined : "invalid";
    case "tel":
      return TEL_RE.test(v) &&
        dialCodes.has(String(data.get(`${f.name}_code`) ?? ""))
        ? undefined
        : "invalid";
    case "date":
      return validDate(v) &&
        !(f.name === "dob" && v > new Date().toISOString().slice(0, 10))
        ? undefined
        : "invalid";
    case "radio":
    case "rating":
      return f.options?.includes(v) ? undefined : "invalid";
    case "select":
      return f.source && !sources[f.source]?.has(v) ? "invalid" : undefined;
  }
  return undefined;
}

/** Value as staff read it in the email. */
function display(f: Field, v: string, data: FormData): string {
  if (!v) return "";
  if (f.type === "tel")
    return `${String(data.get(`${f.name}_code`) ?? "")} ${v}`;
  if (f.type === "select" && f.source) return sources[f.source]?.get(v) ?? v;
  return v;
}

function validDate(v: string) {
  const m = DATE_RE.exec(v);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return (
    d.getUTCFullYear() === +m[1] &&
    d.getUTCMonth() === +m[2] - 1 &&
    d.getUTCDate() === +m[3] &&
    +m[1] >= 1900
  );
}

/** FORM_TO_* value: "a@x, b@x" (all regions) or JSON { "global": "...", "ae": "...", "sa": "..." }. */
function recipients(value: string | undefined, region: string): string[] {
  if (!value) return [];
  let list = value;
  if (value.trim().startsWith("{")) {
    try {
      const map = JSON.parse(value) as Record<string, string>;
      list = map[region] ?? map.global ?? "";
    } catch {
      return [];
    }
  }
  return list
    .split(",")
    .map((s) => s.trim())
    .filter((s) => EMAIL_RE.test(s));
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
function sameOrigin(url: string, req: Request) {
  try {
    return new URL(url).origin === new URL(req.url).origin;
  } catch {
    return false;
  }
}
function originAllowed(req: Request, allowed?: string) {
  const origin = req.headers.get("Origin");
  if (!origin) return true; // same-origin form posts from older browsers may omit it; Turnstile still applies
  const list = allowed
    ? allowed.split(",").map((s) => s.trim())
    : [new URL(req.url).origin];
  return list.includes(origin);
}
