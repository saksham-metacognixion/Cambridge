/*
 * Conditions & Specialities filter logic (Figma 40:318: "Select speciality" + A–Z, "Select condition" + A–Z).
 * Pure functions, no DOM: used by src/scripts/condition-filters.ts and tests/condition-filters.test.mjs.
 *
 * URL: ?specialty=<specialty id> &condition=<condition slug> &sort=az
 *   - Values are the English ids/slugs on every edition (only labels translate). Empty values are left out.
 *   - Both A–Z buttons in Figma toggle the same alphabetical order of the cards (interpretation: Figma has no
 *     behaviour for them; flagged for Pramod). Default = Figma order.
 */
export type Sort = "" | "az";

export interface ConditionState {
  specialty: string;
  condition: string;
  sort: Sort;
}

export interface FilterCondition {
  slug: string;
  /** label used for the A–Z order (localized title) */
  title: string;
  specialties: string[];
}

export const emptyState = (): ConditionState => ({
  specialty: "",
  condition: "",
  sort: "",
});

/** Read the state from a query string. Unknown values are dropped. */
export function parseState(
  search: string,
  known: { specialties: string[]; conditions: string[] },
): ConditionState {
  const q = new URLSearchParams(search);
  const specialty = q.get("specialty") ?? "";
  const condition = q.get("condition") ?? "";
  return {
    specialty: known.specialties.includes(specialty) ? specialty : "",
    condition: known.conditions.includes(condition) ? condition : "",
    sort: q.get("sort") === "az" ? "az" : "",
  };
}

/** Query string for a state ("" when nothing is set). Fixed key order, so equal states give equal URLs. */
export function toSearch(s: ConditionState): string {
  const q = new URLSearchParams();
  if (s.specialty) q.set("specialty", s.specialty);
  if (s.condition) q.set("condition", s.condition);
  if (s.sort) q.set("sort", s.sort);
  const str = q.toString();
  return str ? `?${str}` : "";
}

/** Matching conditions, in display order (Figma order, or A–Z by title in the page's locale). */
export function applyFilters<T extends FilterCondition>(
  items: T[],
  s: ConditionState,
  locale = "en",
): T[] {
  const shown = items.filter(
    (c) =>
      (!s.specialty || c.specialties.includes(s.specialty)) &&
      (!s.condition || c.slug === s.condition),
  );
  if (s.sort === "az")
    return [...shown].sort((a, b) => a.title.localeCompare(b.title, locale));
  return shown;
}
