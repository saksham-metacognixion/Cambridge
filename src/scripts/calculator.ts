/*
 * Health calculator pages, browser side (bug 014): form[data-calculator] inside [data-calc] (src/components/calculators/
 * CalculatorForm.astro). Config in data-calculator (JSON from the content files): the field text, the result strings and
 * the one validation message. Validation = the live site's constraints (required, min, step: the control's own validity)
 * plus the formula's own checks; the formula is src/lib/calculator-formulas.ts. Nothing is sent or stored.
 * BMI: the weight / height labels and placeholders follow the chosen unit, as on the live site.
 */
import { calculate, type CalculatorKey } from "../lib/calculator-formulas";

type ByUnit = Record<string, { label: string; placeholder: string }>;
type FieldText = { label: string; placeholder?: string; byUnit?: ByUnit };
type Config = {
  key: CalculatorKey;
  invalid: string;
  fields: Record<string, FieldText>;
  result: { title: string; categories: Record<string, string>; notes?: Record<string, string>; scoreLabel?: string };
};

function setup(form: HTMLFormElement) {
  const c: Config = JSON.parse(form.dataset.calculator ?? "{}");
  const root = form.closest<HTMLElement>("[data-calc]") ?? form;
  const alert = form.querySelector<HTMLElement>(".f-alert");
  const result = root.querySelector<HTMLElement>("[data-calc-result]");
  const controls = () => [...form.querySelectorAll<HTMLInputElement | HTMLSelectElement>("select[name], input[name]")];
  const field = (name: string) => form.querySelector<HTMLInputElement>(`[name="${name}"]`);
  const label = (name: string) => form.querySelector<HTMLElement>(`[data-field="${name}"] label`);

  // Unit-dependent text (BMI): "Weight" -> "Weight (kg)" / "Weight (lb)", placeholder "Select units first" -> "e.g. 70".
  const unit = form.querySelector<HTMLSelectElement>('select[name="unit"]');
  const relabel = () => {
    for (const [name, t] of Object.entries(c.fields)) {
      if (!t.byUnit) continue;
      const v = unit ? t.byUnit[unit.value] : undefined;
      const l = label(name);
      const f = field(name);
      if (l) l.textContent = v?.label ?? t.label;
      if (f) f.placeholder = v?.placeholder ?? t.placeholder ?? "";
    }
  };
  unit?.addEventListener("change", relabel);
  relabel();

  const clear = () => {
    if (alert && !alert.hidden) {
      alert.hidden = true;
      alert.textContent = "";
    }
    controls().forEach((el) => el.removeAttribute("aria-invalid"));
  };
  const fail = (bad: (HTMLInputElement | HTMLSelectElement)[]) => {
    bad.forEach((el) => el.setAttribute("aria-invalid", "true"));
    if (alert) {
      alert.textContent = c.invalid;
      alert.hidden = false;
    }
    bad[0]?.focus();
  };
  form.addEventListener("input", clear);
  form.addEventListener("change", clear);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clear();
    const all = controls();
    const bad = all.filter((el) => !el.value.trim() || !el.validity.valid || (el instanceof HTMLInputElement && el.type === "number" && !(parseFloat(el.value) > 0)));
    if (bad.length) return fail(bad);
    const values = Object.fromEntries(all.map((el) => [el.name, el.value.trim()]));
    const r = calculate(c.key, values);
    if (!r) return fail(all);
    if (!result) return;
    const value = result.querySelector<HTMLElement>("[data-calc-value]");
    const category = result.querySelector<HTMLElement>("[data-calc-category]");
    const note = result.querySelector<HTMLElement>("[data-calc-note]");
    if (value) value.textContent = `${c.result.title}: ${r.value}`;
    if (category) category.textContent = c.result.categories[r.category] ?? "";
    if (note) {
      let text = c.result.notes?.[r.category] ?? "";
      if (text && c.result.scoreLabel && r.score !== undefined) text += ` (${c.result.scoreLabel}${r.score})`;
      note.textContent = text;
      note.hidden = !text;
    }
    result.hidden = false;
    result.scrollIntoView({ block: "nearest", behavior: "smooth" });
  });
}

document.querySelectorAll<HTMLFormElement>("form[data-calculator]").forEach(setup);
