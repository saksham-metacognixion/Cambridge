/*
 * Conditions & Specialities filter island. The cards are already in the HTML; this only shows/hides/reorders them.
 * State lives in the URL (?specialty=&condition=&sort=az): every change pushes a history entry, back/forward restore it.
 * Logic (and its tests): src/lib/condition-filters.ts.
 */
import {
  applyFilters,
  parseState,
  toSearch,
  type ConditionState,
  type FilterCondition,
} from "../lib/condition-filters";

const root = document.querySelector<HTMLElement>("[data-condition-filters]");
if (root) {
  const locale = root.dataset.locale ?? "en";
  const list = root.querySelector<HTMLElement>("[data-condition-list]")!;
  const items: (FilterCondition & { el: HTMLElement })[] = [
    ...list.children,
  ].map((el) => {
    const li = el as HTMLElement;
    return {
      el: li,
      slug: li.dataset.slug ?? "",
      title: li.dataset.title ?? "",
      specialties: (li.dataset.specialties ?? "").split(" ").filter(Boolean),
    };
  });
  const specialtySelect = root.querySelector<HTMLSelectElement>(
    'select[name="specialty"]',
  )!;
  const conditionSelect = root.querySelector<HTMLSelectElement>(
    'select[name="condition"]',
  )!;
  const sortButtons = [
    ...root.querySelectorAll<HTMLButtonElement>("[data-sort]"),
  ];
  const empty = root.querySelector<HTMLElement>("[data-condition-empty]");
  const status = root.querySelector<HTMLElement>("[data-condition-status]");
  const known = {
    specialties: [...specialtySelect.options]
      .map((o) => o.value)
      .filter(Boolean),
    conditions: items.map((i) => i.slug),
  };

  let state: ConditionState = parseState(location.search, known);
  let announce = false; // the first render is the page load, not a change

  function render() {
    const shown = applyFilters(items, state, locale);
    const visible = new Set(shown.map((i) => i.slug));
    // Display order: matching cards in their order, then the hidden ones (keeps the DOM complete for the next change).
    for (const i of [...shown, ...items.filter((x) => !visible.has(x.slug))])
      list.append(i.el);
    for (const i of items) i.el.hidden = !visible.has(i.slug);
    specialtySelect.value = state.specialty;
    conditionSelect.value = state.condition;
    for (const b of sortButtons)
      b.setAttribute("aria-pressed", String(state.sort === "az"));
    if (empty) empty.hidden = shown.length > 0;
    if (status && announce)
      status.textContent = (status.dataset.template ?? "").replace(
        "{n}",
        String(shown.length),
      );
  }

  function commit(next: ConditionState) {
    state = next;
    const search = toSearch(state);
    if (search !== location.search)
      history.pushState(null, "", location.pathname + search + location.hash);
    announce = true;
    render();
  }

  specialtySelect.addEventListener("change", () =>
    commit({ ...state, specialty: specialtySelect.value }),
  );
  conditionSelect.addEventListener("change", () =>
    commit({ ...state, condition: conditionSelect.value }),
  );
  for (const b of sortButtons)
    b.addEventListener("click", () =>
      commit({ ...state, sort: state.sort === "az" ? "" : "az" }),
    );
  window.addEventListener("popstate", () => {
    state = parseState(location.search, known);
    announce = true;
    render();
  });

  render();
}
