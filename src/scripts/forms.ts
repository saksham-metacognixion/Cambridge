/*
 * Forms + pop-ups, browser side (scope 2.7). Loaded on demand by src/components/forms/Modals.astro (first click on a
 * trigger, a #hash link on load, or first focus in a page form), so pages without interaction download nothing.
 *   - pop-ups: native modal <dialog>; Tab/Shift+Tab kept inside, Esc / close button / click outside closes,
 *     focus back to the opener, page scroll locked without a layout shift
 *   - Book an Appointment: doctors filtered by speciality (and the edition's region); a trigger with data-doctor preselects
 *   - validation from the form's src/data/forms.json rules, messages from src/data/content/forms/common.<locale>.json
 *   - Turnstile rendered when a form is first used; JSON submit to the Pages Function; success message
 * Nothing is stored in the browser either (no localStorage, no drafts).
 */

type Rule = {
  name: string;
  type: string;
  required: boolean;
  max?: number;
  options?: string[];
};
type Config = {
  id: string;
  fields: Rule[];
  errors: Record<string, string>;
  sending: string;
};
type TurnstileApi = {
  render: (el: HTMLElement, o: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  getResponse: (id?: string) => string | undefined;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
    __tsReady?: () => void;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TEL_RE = /^[0-9][0-9 ()-]{4,18}$/;
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const region = document.documentElement.dataset.region ?? "global";

/* ───────── Pop-ups ───────── */
let opener: HTMLElement | null = null;
let scrollY = 0;

export function openModal(id: string, trigger: HTMLElement | null) {
  const dlg = document.getElementById(id) as HTMLDialogElement | null;
  if (!dlg || dlg.open) return;
  document
    .querySelectorAll<HTMLDialogElement>("dialog[data-modal][open]")
    .forEach((d) => d.close());
  setup(dlg);
  opener = trigger ?? (document.activeElement as HTMLElement | null);
  const form = dlg.querySelector<HTMLFormElement>("form[data-form]");
  if (form) {
    initForm(form);
    preselect(form, trigger?.dataset.doctor);
    // Hidden context fields (forms.json ui.group "hidden"), e.g. the hospital whose page / row opened the pop-up.
    form
      .querySelectorAll<HTMLInputElement>("input[data-preselect]")
      .forEach((i) => {
        i.value = trigger?.dataset[i.dataset.preselect!] ?? "";
      });
  }
  lockScroll(true);
  dlg.showModal();
  const first = dlg.querySelector<HTMLElement>(
    '[data-panel] select, [data-panel] input:not([type="hidden"]), [data-panel] textarea',
  );
  (first ?? dlg.querySelector<HTMLElement>(FOCUSABLE))?.focus();
}

function setup(dlg: HTMLDialogElement) {
  if (dlg.dataset.ready) return;
  dlg.dataset.ready = "1";
  dlg.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    if (t === dlg || t.closest("[data-close]")) dlg.close();
  });
  dlg.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const items = [...dlg.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    );
    if (!items.length) return;
    const first = items[0],
      last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
  dlg.addEventListener("close", () => {
    lockScroll(false);
    if (location.hash === `#${hashFor(dlg.id)}`)
      history.replaceState(
        history.state,
        "",
        location.pathname + location.search,
      );
    const back = opener;
    opener = null;
    if (back && document.contains(back)) back.focus({ preventScroll: true });
  });
}

/** Scroll lock that keeps the page where it is and adds the scrollbar's width back (no layout shift). */
function lockScroll(on: boolean) {
  const html = document.documentElement;
  if (on) {
    scrollY = window.scrollY;
    const gap = window.innerWidth - html.clientWidth;
    html.style.setProperty("overflow", "hidden");
    if (gap > 0) html.style.setProperty("padding-inline-end", `${gap}px`);
  } else {
    html.style.removeProperty("overflow");
    html.style.removeProperty("padding-inline-end");
    window.scrollTo(0, scrollY);
  }
}

// #hash used by links for each pop-up (ids differ where the scope name differs from the Figma name).
const HASH: Record<string, string> = {
  "book-appointment": "book-appointment",
  "send-enquiry-popup": "send-inquiry",
  "feedback-popup": "your-opinion",
};
const hashFor = (dialogId: string) => HASH[dialogId] ?? dialogId;

/* ───────── Book an Appointment: speciality -> doctors ───────── */
function doctorSelects(form: HTMLFormElement) {
  return {
    spec: form.querySelector<HTMLSelectElement>(
      'select[data-source="specialties"]',
    ),
    doc: form.querySelector<HTMLSelectElement>('select[data-source="doctors"]'),
  };
}
function filterDoctors(form: HTMLFormElement) {
  const { spec, doc } = doctorSelects(form);
  if (!doc) return;
  const s = spec?.value ?? "";
  for (const o of doc.options) {
    if (!o.value) continue;
    const ok =
      (region === "global" || o.dataset.region === region) &&
      (!s || (o.dataset.specialties ?? "").split(" ").includes(s));
    o.hidden = !ok && !o.selected;
    o.disabled = !ok && !o.selected;
  }
  const cur = doc.selectedOptions[0];
  if (
    cur?.value &&
    s &&
    !(cur.dataset.specialties ?? "").split(" ").includes(s)
  )
    doc.value = "";
}
function preselect(form: HTMLFormElement, slug?: string) {
  const { spec, doc } = doctorSelects(form);
  if (!doc || !slug) {
    filterDoctors(form);
    return;
  }
  const o = [...doc.options].find((x) => x.value === slug);
  if (!o) return;
  if (spec) spec.value = (o.dataset.specialties ?? "").split(" ")[0] ?? "";
  doc.value = slug;
  filterDoctors(form);
}

/* ───────── Dial code box: shows the code (Figma "+971") and the flag Figma has (UAE only) ───────── */
function syncDial(sel: HTMLSelectElement) {
  const box = sel.closest("[data-dial]");
  const opt = sel.selectedOptions[0];
  const code = box?.querySelector<HTMLElement>(".dial-code");
  if (code && opt) code.textContent = opt.dataset.code ?? "";
  box
    ?.querySelectorAll<HTMLImageElement>("img[data-flag-for]")
    .forEach((img) => (img.hidden = img.dataset.flagFor !== opt?.value));
}

/* ───────── Forms ───────── */
export function initForm(form: HTMLFormElement) {
  if (form.dataset.ready) return;
  form.dataset.ready = "1";
  const { spec } = doctorSelects(form);
  spec?.addEventListener("change", () => filterDoctors(form));
  filterDoctors(form);
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
  form.querySelectorAll<HTMLInputElement>('input[type="date"]').forEach((d) => {
    if (d.hasAttribute("data-past")) d.max = today;
    const sync = () => d.toggleAttribute("data-empty", !d.value);
    d.addEventListener("input", sync);
    d.addEventListener("change", sync);
    d.addEventListener("click", () => {
      try {
        d.showPicker();
      } catch {
        /* not supported / not allowed */
      }
    });
    sync();
  });
  // Clear a field's error as soon as it is changed.
  form.addEventListener("input", (e) =>
    clearError(form, (e.target as HTMLInputElement).name),
  );
  form.addEventListener("change", (e) =>
    clearError(form, (e.target as HTMLInputElement).name),
  );
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    void submit(form);
  });
  form
    .querySelectorAll<HTMLSelectElement>("[data-dial] select")
    .forEach((sel) => sel.addEventListener("change", () => syncDial(sel)));
  renderTurnstile(form);
}

const cfg = (form: HTMLFormElement): Config =>
  JSON.parse(form.dataset.config ?? "{}");
const errEl = (form: HTMLFormElement, name: string) =>
  form.querySelector<HTMLElement>(`[data-field="${name}"] .f-err`);
const controls = (form: HTMLFormElement, name: string) => [
  ...form.querySelectorAll<HTMLInputElement>(`[name="${name}"]`),
];

function setError(form: HTMLFormElement, name: string, msg: string) {
  const el = errEl(form, name);
  if (el) {
    el.textContent = msg;
    el.hidden = false;
  }
  controls(form, name).forEach((c) => c.setAttribute("aria-invalid", "true"));
}
function clearError(form: HTMLFormElement, name: string) {
  const base = name?.replace(/_code$/, "");
  if (!base) return;
  const el = errEl(form, base);
  if (el && !el.hidden) {
    el.hidden = true;
    el.textContent = "";
  }
  controls(form, base).forEach((c) => c.removeAttribute("aria-invalid"));
}

function validate(form: HTMLFormElement, c: Config): Record<string, string> {
  const out: Record<string, string> = {};
  const data = new FormData(form);
  for (const r of c.fields) {
    const v = String(data.get(r.name) ?? "").trim();
    if (!v) {
      if (r.required) out[r.name] = "required";
      continue;
    }
    if (v.length > (r.max ?? 200)) out[r.name] = "too_long";
    else if (r.type === "email" && !EMAIL_RE.test(v))
      out[r.name] = "invalid_email";
    else if (r.type === "tel" && !TEL_RE.test(v)) out[r.name] = "invalid_tel";
    else if (
      r.type === "date" &&
      !(controls(form, r.name)[0]?.validity.valid ?? true)
    )
      out[r.name] = "invalid_date";
  }
  if (!data.get("consent")) out.consent = "consent";
  return out;
}

// Server error codes -> message keys.
function messageKey(field: string, code: string, c: Config) {
  if (field === "consent") return "consent";
  if (code === "invalid") {
    const t = c.fields.find((f) => f.name === field)?.type;
    if (t === "email" || t === "tel" || t === "date") return `invalid_${t}`;
  }
  return code;
}

async function submit(form: HTMLFormElement) {
  const c = cfg(form);
  const alert = form.querySelector<HTMLElement>(".f-alert");
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (!button || button.getAttribute("aria-disabled") === "true") return;
  if (alert) {
    alert.hidden = true;
    alert.textContent = "";
  }
  c.fields.forEach((f) => clearError(form, f.name));
  clearError(form, "consent");

  const errors = validate(form, c);
  if (Object.keys(errors).length) return showErrors(form, c, errors);

  const label = button.querySelector("span");
  const idle = label?.textContent ?? "";
  button.setAttribute("aria-disabled", "true");
  if (label) label.textContent = c.sending;
  try {
    await turnstileToken(form);
    const res = await fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" },
    });
    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      fields?: Record<string, string>;
    };
    if (res.ok && body.ok) return success(form);
    if (body.error === "validation" && body.fields) {
      const mapped: Record<string, string> = {};
      for (const [k, v] of Object.entries(body.fields))
        mapped[k] = messageKey(k, v, c);
      return showErrors(form, c, mapped);
    }
    if (body.error === "turnstile") resetTurnstile(form);
    showAlert(
      form,
      c.errors[body.error === "turnstile" ? "turnstile" : "send_failed"],
    );
  } catch {
    showAlert(form, c.errors.network);
  } finally {
    button.removeAttribute("aria-disabled");
    if (label) label.textContent = idle;
  }
}

function showErrors(
  form: HTMLFormElement,
  c: Config,
  errors: Record<string, string>,
) {
  for (const [name, key] of Object.entries(errors))
    setError(form, name, c.errors[key] ?? c.errors.invalid);
  const first = c.fields
    .map((f) => f.name)
    .concat("consent")
    .find((n) => errors[n]);
  if (first) controls(form, first)[0]?.focus();
}
function showAlert(form: HTMLFormElement, msg: string) {
  const alert = form.querySelector<HTMLElement>(".f-alert");
  if (alert) {
    alert.textContent = msg;
    alert.hidden = false;
  }
}
function success(form: HTMLFormElement) {
  const ok = document.querySelector<HTMLElement>(
    `[data-success-for="${form.dataset.form}"]`,
  );
  form.reset();
  form
    .querySelectorAll<HTMLSelectElement>("[data-dial] select")
    .forEach(syncDial);
  form
    .querySelectorAll<HTMLInputElement>('input[type="date"]')
    .forEach((d) => d.toggleAttribute("data-empty", true));
  resetTurnstile(form);
  if (!ok) return;
  form.hidden = true;
  ok.hidden = false;
  ok.focus();
  // A pop-up shows the form again (empty) the next time it opens.
  const dlg = form.closest("dialog");
  dlg?.addEventListener(
    "close",
    () => {
      form.hidden = false;
      ok.hidden = true;
      filterDoctors(form);
    },
    { once: true },
  );
}

/* ───────── Turnstile (explicit render, script loaded once, only when a form is used) ───────── */
let tsLoading: Promise<void> | null = null;
function loadTurnstile() {
  tsLoading ??= new Promise<void>((resolve) => {
    if (window.turnstile) return resolve();
    // Another form on the page (e.g. the Contact section) may already have added the script: wait for it.
    if (
      document.querySelector(
        'script[src*="challenges.cloudflare.com/turnstile"]',
      )
    ) {
      const t = setInterval(() => {
        if (window.turnstile) {
          clearInterval(t);
          resolve();
        }
      }, 100);
      return;
    }
    window.__tsReady = () => resolve();
    const s = document.createElement("script");
    s.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__tsReady";
    s.async = true;
    document.head.appendChild(s);
  });
  return tsLoading;
}
/** Resolves when the form's Turnstile token is ready (or after a timeout: the server then answers "turnstile"). */
async function turnstileToken(form: HTMLFormElement, ms = 8000) {
  const slot = form.querySelector<HTMLElement>(".ts-slot");
  if (!slot) return;
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const id = slot.dataset.widget;
    if (id && id !== "pending" && window.turnstile?.getResponse(id)) return;
    await new Promise((r) => setTimeout(r, 150));
  }
}
function renderTurnstile(form: HTMLFormElement) {
  const slot = form.querySelector<HTMLElement>(".ts-slot");
  if (!slot || slot.dataset.widget) return;
  slot.dataset.widget = "pending";
  void loadTurnstile().then(() => {
    slot.dataset.widget = window.turnstile!.render(slot, {
      sitekey: slot.dataset.sitekey,
      appearance: slot.dataset.appearance ?? "interaction-only",
      language: slot.dataset.language,
      size: "flexible",
    });
  });
}
function resetTurnstile(form: HTMLFormElement) {
  const id = form.querySelector<HTMLElement>(".ts-slot")?.dataset.widget;
  if (id && id !== "pending") window.turnstile?.reset(id);
}
