// Header region switch (Global > UAE / KSA). Click or Enter/Space toggles; on desktop hover also opens it.
// Escape or a click outside closes it (Escape returns focus to the button). Menu links are visibility:hidden
// while closed, so they are only reachable by Tab when it is open.

// Found from the button: <html data-region="..."> (edition, set by BaseLayout) also matches [data-region], so a bare
// querySelector('[data-region]') toggled data-open on <html> and the menu never opened.
const btn = document.querySelector<HTMLButtonElement>('[data-region-btn]');
const root = btn?.closest<HTMLElement>('[data-region]') ?? null;
if (root && btn) {
  const hover = matchMedia('(hover: hover) and (min-width: 1200px)');
  let pinned = false; // opened by click/keyboard, so mouse-leave must not close it
  let timer: number | undefined;

  const set = (open: boolean) => {
    root.toggleAttribute('data-open', open);
    btn.setAttribute('aria-expanded', String(open));
    if (!open) pinned = false;
  };
  const isOpen = () => root.hasAttribute('data-open');

  btn.addEventListener('click', () => {
    if (isOpen() && !pinned && hover.matches) { pinned = true; return; } // hover-opened: a click keeps it open
    if (isOpen()) set(false);
    else { set(true); pinned = true; }
  });

  root.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse' || !hover.matches) return;
    clearTimeout(timer);
    if (!isOpen()) set(true);
  });
  root.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'mouse' || pinned) return;
    timer = window.setTimeout(() => set(false), 150);
  });

  document.addEventListener('pointerdown', (e) => {
    if (isOpen() && !root.contains(e.target as Node)) set(false);
  });
  root.addEventListener('focusout', (e) => {
    const next = (e as FocusEvent).relatedTarget as Node | null;
    if (next && !root.contains(next)) set(false);
  });
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) { set(false); btn.focus(); }
  });
  // Closing the hamburger menu (or resizing across the breakpoint) must not leave the submenu open.
  document.getElementById('nav-toggle')?.addEventListener('change', () => set(false));
  hover.addEventListener('change', () => set(false));
}
