// Header main-menu dropdowns (bug 046: About Cambridge, Patient Hub; markup in Header.astro). Each [data-submenu] item:
// the label is a link to the parent page, the chevron button toggles the list (click / Enter / Space). Desktop (>= 1200px with
// a mouse): hovering the item also opens it, leaving it closes it after a short delay unless it was opened by click / keyboard.
// ArrowDown on the button opens the list and moves into it; ArrowUp/ArrowDown/Home/End move inside; Escape closes and returns
// focus to the button; focus or a click leaving the item closes it. Only one dropdown is open at a time. Below 1200px the
// same button expands the list in place (accordion in the hamburger menu).
const roots = [...document.querySelectorAll<HTMLElement>("[data-submenu]")];
const hover = matchMedia("(hover: hover) and (min-width: 1200px)");

type Sub = { root: HTMLElement; btn: HTMLButtonElement; set: (open: boolean) => void };
const subs: Sub[] = [];

for (const root of roots) {
  const btn = root.querySelector<HTMLButtonElement>("[data-submenu-btn]");
  if (!btn) continue;
  let pinned = false;
  let timer: number | undefined;
  const items = [...root.querySelectorAll<HTMLAnchorElement>(".sub-item")];
  const isOpen = () => root.hasAttribute("data-open");
  const set = (open: boolean) => {
    if (open) subs.forEach((s) => s.root !== root && s.set(false));
    root.toggleAttribute("data-open", open);
    btn.setAttribute("aria-expanded", String(open));
    if (!open) pinned = false;
  };
  subs.push({ root, btn, set });

  btn.addEventListener("click", () => {
    if (isOpen() && !pinned && hover.matches) { pinned = true; return; } // hover-opened: a click keeps it open
    if (isOpen()) set(false);
    else { set(true); pinned = true; }
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
    if (next && !root.contains(next) && hover.matches) set(false);
  });
  const focusItem = (i: number) => items[(i + items.length) % items.length]?.focus();
  root.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) { set(false); btn.focus(); return; }
    if (e.target === btn && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      // next frame: the list is still visibility:hidden (it fades in) in this one, and a hidden link cannot take focus
      e.preventDefault(); set(true); pinned = true; const to = e.key === "ArrowDown" ? 0 : -1; requestAnimationFrame(() => focusItem(to)); return;
    }
    const i = items.indexOf(e.target as HTMLAnchorElement);
    if (i < 0) return;
    const to = ({ ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: items.length - 1 } as Record<string, number>)[e.key];
    if (to === undefined) return;
    e.preventDefault();
    focusItem(to);
  });
}

if (subs.length) {
  const closeAll = () => subs.forEach((s) => s.set(false));
  document.addEventListener("pointerdown", (e) => {
    if (hover.matches && !subs.some((s) => s.root.contains(e.target as Node))) closeAll();
  });
  addEventListener("pageshow", (e) => { if (e.persisted) closeAll(); });
  document.getElementById("nav-toggle")?.addEventListener("change", closeAll);
  hover.addEventListener("change", closeAll);
}
