// Header region switch (current region > Global / UAE / KSA; label and aria-current are rendered by Header.astro from
// the page's edition). Click or Enter/Space toggles; on desktop hover also opens it. ArrowDown/ArrowUp open it and move
// between the regions (starting on the current one), Home/End jump to the first/last. Escape or a click outside closes
// it (Escape returns focus to the button); choosing a region closes it. Menu links are visibility:hidden while closed,
// so they are only reachable by Tab when it is open.

// Found from the button: <html data-region="..."> (edition, set by BaseLayout) also matches [data-region], so a bare
// querySelector('[data-region]') toggled data-open on <html> and the menu never opened.
const btn = document.querySelector<HTMLButtonElement>("[data-region-btn]");
const root = btn?.closest<HTMLElement>("[data-region]") ?? null;
if (root && btn) {
  const hover = matchMedia("(hover: hover) and (min-width: 1200px)");
  let pinned = false; // opened by click/keyboard, so mouse-leave must not close it
  let timer: number | undefined;

  const set = (open: boolean) => {
    root.toggleAttribute("data-open", open);
    btn.setAttribute("aria-expanded", String(open));
    if (!open) pinned = false;
  };
  const isOpen = () => root.hasAttribute("data-open");

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
    if (e.pointerType !== "mouse" || pinned) return;
    timer = window.setTimeout(() => set(false), 150);
  });

  document.addEventListener("pointerdown", (e) => {
    if (isOpen() && !root.contains(e.target as Node)) set(false);
  });
  root.addEventListener("focusout", (e) => {
    const next = (e as FocusEvent).relatedTarget as Node | null;
    if (next && !root.contains(next)) set(false);
  });
  root.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) {
      set(false);
      btn.focus();
    }
  });
  const items = [...root.querySelectorAll<HTMLAnchorElement>(".ritem")];
  const focusItem = (i: number) =>
    items[(i + items.length) % items.length]?.focus();
  btn.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    set(true);
    pinned = true;
    const cur = items.findIndex(
      (a) => a.getAttribute("aria-current") === "true",
    );
    focusItem(cur >= 0 ? cur : e.key === "ArrowDown" ? 0 : -1);
  });
  root.addEventListener("keydown", (e) => {
    // From the event target, not document.activeElement: the button's ArrowDown has already moved focus to an item
    // by the time it bubbles here, and must not move it a second time.
    const i = items.indexOf(e.target as HTMLAnchorElement);
    if (i < 0) return;
    const to = (
      {
        ArrowDown: i + 1,
        ArrowUp: i - 1,
        Home: 0,
        End: items.length - 1,
      } as Record<string, number>
    )[e.key];
    if (to === undefined) return;
    e.preventDefault();
    focusItem(to);
  });
  items.forEach((a) => a.addEventListener("click", () => set(false)));
  // Back/forward cache restores the page as it was left: never show it with the menu still open.
  addEventListener("pageshow", (e) => {
    if (e.persisted) set(false);
  });
  // Closing the hamburger menu (or resizing across the breakpoint) must not leave the submenu open.
  document
    .getElementById("nav-toggle")
    ?.addEventListener("change", () => set(false));
  hover.addEventListener("change", () => set(false));
}
