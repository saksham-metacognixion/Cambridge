/*
 * Shared dropdown behaviour (bug 053) for src/components/shared/Combobox.astro. WAI-ARIA APG combobox patterns:
 *   editable (name): typing filters the list; Down/Up move, Enter picks, Escape closes, Tab leaves (nothing is picked).
 *   select-only (specialty): Enter / Space / Down / Up open; the same keys inside the list; a letter jumps to the next
 *   option starting with it. Picking the option that is already selected clears it (the list has no "all" row: bug 053).
 * Focus stays on the field; the highlighted option is aria-activedescendant. The page script owns the state:
 *   cb.setAvailable(values)  which options may be offered (the rest are hidden)
 *   cb.setValue(value)       the current value (name text / specialty id), without events
 *   onSelect(value)          a pick ('' = cleared) ; onInput(text) typing (editable only)
 * Bug 054 (editable): a picked name never locks the list. A click / tap on the field or the arrow opens EVERY valid name
 * with the current one highlighted, and the text is selected so typing replaces it; the x button (shown while the field has
 * text) clears it in one press (onSelect('')). The arrow toggles the list like a native dropdown arrow.
 */
import { nameMatches } from "../lib/doctor-filters";

export interface ComboboxOptions {
  onSelect: (value: string) => void;
  onInput?: (text: string) => void;
}

export function createCombobox(root: HTMLElement, opts: ComboboxOptions) {
  const field = root.querySelector<HTMLElement>("[data-cb-field]")!;
  const list = root.querySelector<HTMLElement>("[data-cb-list]")!;
  const none = root.querySelector<HTMLElement>("[data-cb-none]");
  const valueEl = root.querySelector<HTMLElement>("[data-cb-value]");
  const editable = root.hasAttribute("data-editable");
  const input = editable ? (field as HTMLInputElement) : null;
  const options = [...list.querySelectorAll<HTMLElement>('[role="option"]')];
  const clearBtn = root.querySelector<HTMLButtonElement>("[data-cb-clear]");
  const toggleBtn = root.querySelector<HTMLElement>("[data-cb-toggle]");
  const label = (o: HTMLElement) => o.textContent ?? "";

  let available: Set<string> | null = null; // null = everything
  let value = "";
  let active = -1; // index into visible()
  let typed = false; // the user typed since the list opened: filter by the text

  const isOpen = () => !list.hidden;
  const visible = () => options.filter((o) => !o.hidden);

  /** Which options to show: the available ones, and in the name box those matching the typed text. */
  function refresh() {
    // The name list is narrowed by the text only while the user types; opened by click / arrow it shows every valid name.
    const text = input && typed ? input.value.trim() : "";
    for (const o of options) {
      const ok = !available || available.has(o.dataset.value ?? "");
      o.hidden = !(ok && (!text || nameMatches(label(o), text)));
      o.setAttribute("aria-selected", String(isSelected(o)));
    }
    if (none) none.hidden = visible().length > 0;
    syncClear();
  }

  /** The x shows while the name box has any text (a picked doctor or typed letters). */
  function syncClear() {
    if (!clearBtn || !input) return;
    const on = input.value !== "";
    clearBtn.hidden = !on;
    root.classList.toggle("has-clear", on);
  }

  /** Clicking into a picked name selects it, so the next letter replaces it instead of being appended. */
  function selectPicked() {
    if (input && value && options.some((o) => label(o) === input.value))
      input.select();
  }

  const isSelected = (o: HTMLElement) =>
    input ? !!value && label(o) === value : o.dataset.value === value;

  function setActive(i: number) {
    const vis = visible();
    options.forEach((o) => o.classList.remove("is-active"));
    active = vis.length ? Math.max(-1, Math.min(i, vis.length - 1)) : -1;
    const o = vis[active];
    if (o) {
      o.classList.add("is-active");
      field.setAttribute("aria-activedescendant", o.id);
      o.scrollIntoView({ block: "nearest" });
    } else field.removeAttribute("aria-activedescendant");
  }

  function open(
    highlight: "selected" | "first" | "last" | "none" = "selected",
  ) {
    if (!isOpen()) {
      typed = false;
      refresh();
      list.hidden = false;
      root.classList.add("is-open");
      field.setAttribute("aria-expanded", "true");
      list.scrollTop = 0;
    }
    const vis = visible();
    const sel = vis.findIndex(isSelected);
    if (highlight === "first") setActive(0);
    else if (highlight === "last") setActive(vis.length - 1);
    else if (highlight === "selected" && sel >= 0) setActive(sel);
    else setActive(-1);
    // A select-only list opened near the bottom of the screen is scrolled into view (no keyboard on screen to fight with).
    if (!input) {
      const r = list.getBoundingClientRect();
      if (r.bottom > window.innerHeight)
        window.scrollBy({
          top: Math.min(r.bottom - window.innerHeight + 12, r.top - 12),
          behavior: "smooth",
        });
    }
  }

  function close() {
    if (!isOpen()) return;
    list.hidden = true;
    root.classList.remove("is-open");
    field.setAttribute("aria-expanded", "false");
    field.removeAttribute("aria-activedescendant");
    options.forEach((o) => o.classList.remove("is-active"));
    active = -1;
  }

  function pick(o: HTMLElement) {
    const v = o.dataset.value ?? "";
    const next = !input && v === value ? "" : v; // select-only: picking the selected option again clears it
    close();
    if (!input && document.activeElement !== field)
      field.focus({ preventScroll: true }); // after a tap focus was on the list
    if (input) input.value = label(o);
    setValue(next);
    opts.onSelect(next);
  }

  function setValue(v: string) {
    value = v;
    if (input) {
      // While typing the field already holds the text (keep its spaces); a change from outside (back / forward with the
      // field still focused after the x) must still show.
      if (
        input.value !== v &&
        (document.activeElement !== input || input.value.trim() !== v.trim())
      )
        input.value = v;
    } else if (valueEl) {
      const o = options.find((x) => x.dataset.value === v);
      valueEl.textContent = o ? label(o) : (valueEl.dataset.placeholder ?? "");
      root.classList.toggle("has-value", !!o);
    }
    refresh();
  }

  function move(delta: number) {
    if (!isOpen()) return open(delta > 0 ? "first" : "last");
    const n = visible().length;
    if (!n) return;
    setActive(active < 0 ? (delta > 0 ? 0 : n - 1) : (active + delta + n) % n);
  }

  field.addEventListener("keydown", (e) => {
    const vis = visible();
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (e.altKey) open();
        else move(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        if (e.altKey) close();
        else move(-1);
        break;
      case "Home":
      case "End":
        if (!input && isOpen()) {
          e.preventDefault();
          setActive(e.key === "Home" ? 0 : vis.length - 1);
        }
        break;
      case "PageDown":
      case "PageUp":
        if (isOpen()) {
          e.preventDefault();
          setActive(Math.max(0, active) + (e.key === "PageDown" ? 7 : -7));
        }
        break;
      case "Enter":
        if (isOpen() && vis[active]) {
          e.preventDefault();
          pick(vis[active]);
        } else if (isOpen()) {
          e.preventDefault();
          close();
        } else if (!input) {
          e.preventDefault();
          open();
        }
        break;
      case " ":
        if (!input) {
          e.preventDefault();
          if (isOpen() && vis[active]) pick(vis[active]);
          else open();
        }
        break;
      case "Escape":
        if (isOpen()) {
          e.preventDefault();
          e.stopPropagation();
          close();
        }
        break;
      case "Tab":
        close();
        break; // focus moves on as usual; nothing is picked
      case "Backspace":
      case "Delete":
        if (!input && value) {
          e.preventDefault();
          setValue("");
          opts.onSelect("");
        }
        break;
      default:
        // select-only type-ahead: a letter jumps to the next option that starts with it
        if (
          !input &&
          e.key.length === 1 &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.altKey
        ) {
          if (!isOpen()) open("none");
          const list2 = visible();
          const k = e.key.toLocaleLowerCase();
          const from = active + 1;
          const hit = [...list2.slice(from), ...list2.slice(0, from)].find(
            (o) => label(o).trim().toLocaleLowerCase().startsWith(k),
          );
          if (hit) setActive(list2.indexOf(hit));
        }
    }
  });

  if (input) {
    input.addEventListener("input", () => {
      if (!isOpen()) open("none");
      typed = true;
      value = input.value.trim();
      refresh();
      setActive(-1);
      opts.onInput?.(input.value);
    });
  }

  // Mouse / touch / pen: a click (tap) on the field opens the list (select-only: toggles it); a click on an option picks it.
  // Only the mouse press on the list is cancelled, so the field keeps focus on desktop. NOT pointerdown: Safari / iOS then
  // never fires the tap's click. On touch the focus moves into the list (tabindex -1, inside the box), so it stays open.
  field.addEventListener("click", () => {
    if (input) {
      if (!isOpen()) {
        open();
        selectPicked();
      }
      return;
    }
    if (isOpen()) close();
    else open();
  });
  list.addEventListener("mousedown", (e) => e.preventDefault());
  // The arrow: toggles, focus stays in (or moves to) the field. mousedown is cancelled so the field never blurs (desktop).
  toggleBtn?.addEventListener("mousedown", (e) => e.preventDefault());
  toggleBtn?.addEventListener("click", () => {
    if (isOpen()) return close();
    if (document.activeElement !== field) field.focus({ preventScroll: true });
    open();
    selectPicked();
  });
  // The x: empties the field, clears the value (the page drops ?q= and shows every doctor of the other filters), focus back.
  clearBtn?.addEventListener("click", () => {
    if (!input) return;
    close();
    input.value = "";
    typed = false;
    input.focus({ preventScroll: true });
    setValue("");
    opts.onSelect("");
  });
  list.addEventListener("click", (e) => {
    const o = (e.target as HTMLElement).closest<HTMLElement>('[role="option"]');
    if (o && !o.hidden) pick(o);
  });
  list.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const o = (e.target as HTMLElement).closest<HTMLElement>('[role="option"]');
    if (o) {
      const i = visible().indexOf(o);
      if (i !== active) {
        options.forEach((x) => x.classList.remove("is-active"));
        active = i;
        o.classList.add("is-active");
        field.setAttribute("aria-activedescendant", o.id);
      }
    }
  });
  root.addEventListener("focusout", (e) => {
    if (!root.contains(e.relatedTarget as Node | null)) close();
  });
  document.addEventListener("pointerdown", (e) => {
    if (!root.contains(e.target as Node)) close();
  });

  return {
    setAvailable(values: Set<string> | null) {
      available = values;
      refresh();
      if (isOpen()) setActive(Math.min(active, visible().length - 1));
    },
    setValue,
    close,
  };
}
