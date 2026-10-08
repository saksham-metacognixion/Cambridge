// Header main-menu dropdowns (bug 046: About Cambridge, Our Care, Our Hospitals, Patient Hub; markup in Header.astro, items in
// src/lib/nav.ts). Each [data-submenu] item: the label is a link to the parent page, the chevron button toggles the list
// (click / Enter / Space). Desktop (>= 1200px with a mouse): hovering the item also opens it, leaving it closes it after a
// short delay unless it was opened by click / keyboard. ArrowDown on the button opens the list and moves into it;
// ArrowUp/ArrowDown/Home/End move inside; Escape closes and returns focus to the button; focus or a click leaving the item
// closes it (any desktop-width screen, touch included). Only one dropdown is open at a time. Below 1200px the same button
// expands the list in place (accordion in the hamburger menu).
// Second level ([data-flyout], Our Care's Inpatient / Outpatient sections): same model one level down. Desktop: hover or the
// chevron opens a fly-out beside the panel; the "inward" arrow (ArrowRight, ArrowLeft in Arabic) on the row opens it and
// focuses its first link, the "outward" arrow or Escape closes it and returns to the row. Mobile: a nested accordion.
const roots = [...document.querySelectorAll<HTMLElement>("[data-submenu]")];
const desktop = matchMedia("(min-width: 1200px)");
const hover = matchMedia("(hover: hover) and (min-width: 1200px)");
const rtl = () => document.documentElement.dir === "rtl";

type Toggle = { root: HTMLElement; set: (open: boolean) => void };
const subs: Toggle[] = [];

const listNav = (items: HTMLElement[], key: string, i: number) => {
  const to = (
    {
      ArrowDown: i + 1,
      ArrowUp: i - 1,
      Home: 0,
      End: items.length - 1,
    } as Record<string, number>
  )[key];
  if (to === undefined) return false;
  items[(to + items.length) % items.length]?.focus();
  return true;
};

for (const root of roots) {
  const btn = root.querySelector<HTMLButtonElement>("[data-submenu-btn]");
  if (!btn) continue;
  let pinned = false;
  let timer: number | undefined;
  // first-level links only (a fly-out's links have their own list)
  const items = [
    ...root.querySelectorAll<HTMLAnchorElement>(".sub-item:not(.fly-item)"),
  ];
  const flys: Toggle[] = [];
  let intent: number | undefined;
  const later = (fn: () => void) => { clearTimeout(intent); intent = window.setTimeout(fn, 250); };
  const isOpen = () => root.hasAttribute("data-open");
  const set = (open: boolean) => {
    if (open) subs.forEach((s) => s.root !== root && s.set(false));
    else { clearTimeout(intent); flys.forEach((f) => f.set(false)); }
    root.toggleAttribute("data-open", open);
    btn.setAttribute("aria-expanded", String(open));
    if (!open) pinned = false;
  };
  subs.push({ root, set });

  for (const li of root.querySelectorAll<HTMLElement>("[data-flyout]")) {
    const fbtn = li.querySelector<HTMLButtonElement>("[data-flyout-btn]")!;
    const link = li.querySelector<HTMLAnchorElement>(".fly-head > .sub-item")!;
    const kids = [...li.querySelectorAll<HTMLAnchorElement>(".fly-item")];
    let fpinned = false;
    const fopen = () => li.hasAttribute("data-open");
    const fset = (open: boolean) => {
      if (open) flys.forEach((f) => f.root !== li && f.set(false));
      li.toggleAttribute("data-open", open);
      fbtn.setAttribute("aria-expanded", String(open));
      if (!open) fpinned = false;
    };
    flys.push({ root: li, set: fset });
    const enter = () => {
      fset(true);
      fpinned = true;
      requestAnimationFrame(() => kids[0]?.focus());
    }; // next frame: still hidden in this one
    fbtn.addEventListener("click", () => {
      if (fopen() && !fpinned && hover.matches) {
        fpinned = true;
        return;
      }
      if (fopen()) fset(false);
      else {
        fset(true);
        fpinned = true;
      }
    });
    // Hover intent: with no fly-out open, a row opens at once; with another one open, only after the pointer rests here
    // (`later`), so a diagonal move from a row to its fly-out across the rows below does not switch it. Coming back into
    // the open row / fly-out cancels the switch. Leaving the dropdown closes everything (root pointerleave).
    li.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse" || !hover.matches) return;
      clearTimeout(intent);
      if (fopen()) return;
      if (flys.some((f) => f.root !== li && f.root.hasAttribute("data-open"))) later(() => fset(true));
      else fset(true);
    });
    li.addEventListener("focusout", (e) => {
      const next = (e as FocusEvent).relatedTarget as Node | null;
      if (next && !li.contains(next) && desktop.matches) fset(false);
    });
    li.addEventListener("keydown", (e) => {
      if (!desktop.matches) return; // mobile: plain Tab order through the accordion
      const inward = rtl() ? "ArrowLeft" : "ArrowRight";
      const outward = rtl() ? "ArrowRight" : "ArrowLeft";
      const k = kids.indexOf(e.target as HTMLAnchorElement);
      if (k < 0) {
        if (e.key === inward) {
          e.preventDefault();
          enter();
        }
        return; // ArrowUp/Down on the row: first-level list (root handler)
      }
      e.stopPropagation(); // the dropdown's own keys must not act on a fly-out link
      if (e.key === outward || e.key === "Escape") {
        e.preventDefault();
        fset(false);
        link.focus();
        return;
      }
      if (listNav(kids, e.key, k)) e.preventDefault();
    });
  }
  // a mouse resting on a first-level row without a fly-out closes the open fly-out (same intent delay)
  for (const li of root.querySelectorAll<HTMLElement>(".sub-list > li:not([data-flyout])")) {
    li.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse" || !hover.matches) return;
      clearTimeout(intent);
      if (flys.some((f) => f.root.hasAttribute("data-open"))) later(() => flys.forEach((f) => f.set(false)));
    });
  }

  btn.addEventListener("click", () => {
    if (isOpen() && !pinned && hover.matches) {
      pinned = true;
      return;
    } // hover-opened: a click keeps it open
    if (isOpen()) set(false);
    else {
      set(true);
      pinned = true;
    }
  });
  root.addEventListener("pointerenter", (e) => {
    if (e.pointerType !== "mouse" || !hover.matches) return;
    clearTimeout(timer);
    if (!isOpen()) set(true);
  });
  root.addEventListener("pointerleave", (e) => {
    if (e.pointerType !== "mouse" || !hover.matches || pinned) return;
    timer = window.setTimeout(() => set(false), 150);
  });
  root.addEventListener("focusout", (e) => {
    const next = (e as FocusEvent).relatedTarget as Node | null;
    if (next && !root.contains(next) && desktop.matches) set(false);
  });
  root.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) {
      set(false);
      btn.focus();
      return;
    }
    if (e.target === btn && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      // next frame: the list is still visibility:hidden (it fades in) in this one, and a hidden link cannot take focus
      e.preventDefault();
      set(true);
      pinned = true;
      const to = e.key === "ArrowDown" ? 0 : -1;
      requestAnimationFrame(() => items.at(to)?.focus());
      return;
    }
    // a fly-out chevron counts as its row
    const t = e.target as HTMLElement;
    const row = t.matches("[data-flyout-btn]")
      ? t
          .closest("[data-flyout]")
          ?.querySelector<HTMLAnchorElement>(".fly-head > .sub-item")
      : t;
    const i = items.indexOf(row as HTMLAnchorElement);
    if (i >= 0 && listNav(items, e.key, i)) e.preventDefault();
  });
}

if (subs.length) {
  const closeAll = () => subs.forEach((s) => s.set(false));
  document.addEventListener("pointerdown", (e) => {
    if (desktop.matches && !subs.some((s) => s.root.contains(e.target as Node)))
      closeAll();
  });
  addEventListener("pageshow", (e) => {
    if (e.persisted) closeAll();
  });
  document.getElementById("nav-toggle")?.addEventListener("change", closeAll);
  desktop.addEventListener("change", closeAll);
  hover.addEventListener("change", closeAll);
}
