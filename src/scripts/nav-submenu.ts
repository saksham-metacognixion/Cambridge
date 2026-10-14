// Header main-menu dropdowns (bug 046: About Cambridge, Our Care, Our Hospitals, Patient Hub; markup in Header.astro, items in
// src/lib/nav.ts). Each [data-submenu] item: the label is a link to the parent page, the chevron button toggles the list
// (click / Enter / Space). Desktop (>= 1200px with a mouse): hovering the item also opens it, leaving it closes it after a
// short delay unless it was opened by click / keyboard. ArrowDown on the button opens the list and moves into it;
// ArrowUp/ArrowDown/Home/End move inside; Escape closes and returns focus to the button; focus or a click leaving the item
// closes it (any desktop-width screen, touch included). Only one dropdown is open at a time. Below 1200px the same button
// expands the list in place (accordion in the hamburger menu).
// Deeper levels ([data-flyout], Our Care's sections, programmes and Neurorehabilitation's programmes; any depth since bug 104):
// same model one level down. Desktop: hover or the chevron opens a fly-out beside its list (on the other side when it would
// leave the viewport); the "inward" arrow (ArrowRight, ArrowLeft in Arabic) on the row opens it and focuses its first link,
// the "outward" arrow or Escape closes it and returns to the row. Mobile: nested accordions.
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
  const flyOf = new Map<Element, Toggle>();
  // the link of a row (a plain row: the link itself; a row with a fly-out: the link in its head)
  const rowLink = (li: Element) =>
    li.querySelector<HTMLAnchorElement>(":scope > a, :scope > .fly-head > a");
  // the open fly-outs next to `li` in the same list (one open per list)
  const openSiblings = (li: Element) =>
    [...(li.parentElement?.children ?? [])].filter(
      (x) => x !== li && x.hasAttribute("data-flyout") && x.hasAttribute("data-open"),
    );
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

  // Fly-outs at every depth (bug 104: Our Care section -> programmes -> Neurorehabilitation's programmes), one model:
  // opening one closes the open one beside it, closing one closes every fly-out inside it.
  for (const li of root.querySelectorAll<HTMLElement>("[data-flyout]")) {
    const fbtn = li.querySelector<HTMLButtonElement>(":scope > .fly-head > [data-flyout-btn]")!;
    const link = li.querySelector<HTMLAnchorElement>(":scope > .fly-head > .sub-item")!;
    const panel = li.querySelector<HTMLElement>(":scope > .fly")!;
    const list = panel.querySelector<HTMLElement>(":scope > .fly-list")!;
    const kids = [...list.children].map(rowLink).filter((x): x is HTMLAnchorElement => !!x);
    let fpinned = false;
    const fopen = () => li.hasAttribute("data-open");
    // Desktop: open on the side that fits the viewport (Header.astro [data-flip]); a nested fly-out first tries its parent's side.
    const place = () => {
      if (!desktop.matches) return li.removeAttribute("data-flip");
      const pref = li.parentElement?.closest("[data-flyout]")?.hasAttribute("data-flip") ?? false;
      const vw = document.documentElement.clientWidth;
      const room = (flip: boolean) => {
        li.toggleAttribute("data-flip", flip);
        const r = list.getBoundingClientRect();
        return Math.min(r.left, vw - r.right); // < 0 = overflows
      };
      const a = room(pref);
      if (a >= 0) return;
      if (room(!pref) < a) li.toggleAttribute("data-flip", pref); // neither fits: the side that overflows less
    };
    const fset = (open: boolean) => {
      if (open) {
        openSiblings(li).forEach((x) => flyOf.get(x)?.set(false));
        place();
      } else li.querySelectorAll("[data-flyout][data-open]").forEach((x) => flyOf.get(x)?.set(false));
      li.toggleAttribute("data-open", open);
      fbtn.setAttribute("aria-expanded", String(open));
      if (!open) fpinned = false;
    };
    const toggle = { root: li, set: fset };
    flys.push(toggle);
    flyOf.set(li, toggle);
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
    // Hover intent: with no fly-out open beside it, a row opens at once; with one open, only after the pointer rests here
    // (`later`), so a diagonal move from a row to its fly-out across the rows below does not switch it. Coming back into
    // the open row / fly-out cancels the switch. Leaving the dropdown closes everything (root pointerleave).
    li.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse" || !hover.matches) return;
      clearTimeout(intent);
      if (fopen()) return;
      if (openSiblings(li).length) later(() => fset(true));
      else fset(true);
    });
    li.addEventListener("focusout", (e) => {
      const next = (e as FocusEvent).relatedTarget as Node | null;
      if (next && !li.contains(next) && desktop.matches) fset(false);
    });
    // Keys are handled by the innermost level: this li takes its own row's inward arrow and the keys of its fly-out's rows;
    // anything else on its own row goes up to the list the row belongs to (parent fly-out or the dropdown).
    li.addEventListener("keydown", (e) => {
      if (!desktop.matches) return; // mobile: plain Tab order through the accordion
      const inward = rtl() ? "ArrowLeft" : "ArrowRight";
      const outward = rtl() ? "ArrowRight" : "ArrowLeft";
      const t = e.target as HTMLElement;
      if (t === link || t === fbtn) {
        if (e.key === inward) {
          e.preventDefault();
          e.stopPropagation();
          enter();
        }
        return;
      }
      const row = t.closest("li");
      if (!row || row.parentElement !== list) return; // a deeper level's key (that level stopped it already)
      e.stopPropagation(); // the outer levels' own keys must not act on this fly-out's rows
      if (e.key === outward || e.key === "Escape") {
        e.preventDefault();
        fset(false);
        link.focus();
        return;
      }
      const k = kids.indexOf(rowLink(row)!);
      if (listNav(kids, e.key, k)) e.preventDefault();
    });
  }
  // a mouse resting on a row without a fly-out closes the fly-out open beside it (same intent delay)
  for (const li of root.querySelectorAll<HTMLElement>(":is(.sub-list, .fly-list) > li:not([data-flyout])")) {
    li.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse" || !hover.matches) return;
      clearTimeout(intent);
      const open = openSiblings(li);
      if (open.length) later(() => open.forEach((x) => flyOf.get(x)?.set(false)));
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
  // Arms the mobile panel's closing transition (Header.astro .nav-toggled .menu) after the first open, so a resize across the
  // desktop breakpoint never animates the closed panel.
  document.getElementById("nav-toggle")?.addEventListener(
    "change",
    (e) => (e.target as HTMLElement).closest(".hd")?.classList.add("nav-toggled"),
    { once: true },
  );
  desktop.addEventListener("change", closeAll);
  hover.addEventListener("change", closeAll);
}
