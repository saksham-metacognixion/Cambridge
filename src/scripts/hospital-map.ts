// Home hospital map (sections/Facilities.astro, bug 133, 15 Oct 2026): the section's entrance class and the pin cards.
// - `.in` once 25 % of the section is in view (the CSS fades the map in and drops the pins; reduced motion = no motion).
// - A pin card opens on hover / keyboard focus (CSS) and on tap / click (data-open on its .spot; one open at a time);
//   Escape, a click outside and focus leaving the spot close it. aria-expanded mirrors the open state.
// - Before a card shows it is clamped inside the section: --dx shifts it back from the section's side edges, data-flip puts
//   it under the pin when there is no room above. Cards are absolutely positioned, so nothing in the page moves.

const roots = document.querySelectorAll<HTMLElement>("[data-hospital-map]");

for (const root of roots) {
  // Entrance
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          root.classList.add("in");
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(root);
  } else root.classList.add("in");

  const spots = [...root.querySelectorAll<HTMLElement>("[data-spot]")];
  const pinOf = (s: HTMLElement) => s.querySelector<HTMLButtonElement>(".pin")!;
  const cardOf = (s: HTMLElement) => s.querySelector<HTMLElement>(".hcard")!;

  const place = (s: HTMLElement) => {
    const card = cardOf(s);
    const pin = pinOf(s).getBoundingClientRect();
    const sec = root.getBoundingClientRect();
    const margin = 8;
    // measure at --dx 0 and unflipped
    s.style.setProperty("--dx", "0px");
    s.removeAttribute("data-flip");
    const r = card.getBoundingClientRect();
    const minL = Math.max(sec.left, 0) + margin;
    const maxR = Math.min(sec.right, innerWidth) - margin;
    let dx = 0;
    if (r.left < minL) dx = minL - r.left;
    else if (r.right > maxR) dx = maxR - r.right;
    if (dx) s.style.setProperty("--dx", `${Math.round(dx)}px`);
    // flip under the pin when the card would rise above the section's top (or the viewport top while the section is above it)
    const top = Math.max(sec.top, 0);
    if (r.top < top + margin && pin.bottom + r.height < sec.bottom) s.setAttribute("data-flip", "");
  };

  const setOpen = (s: HTMLElement, open: boolean) => {
    if (open) {
      for (const o of spots) if (o !== s) setOpen(o, false);
      place(s);
      s.setAttribute("data-open", "");
    } else s.removeAttribute("data-open");
    pinOf(s).setAttribute("aria-expanded", String(open));
  };

  for (const s of spots) {
    const pin = pinOf(s);
    pin.addEventListener("click", () => setOpen(s, !s.hasAttribute("data-open")));
    s.addEventListener("pointerenter", () => place(s));
    s.addEventListener("focusin", () => place(s));
    s.addEventListener("focusout", (e) => {
      if (!s.contains(e.relatedTarget as Node | null)) setOpen(s, false);
    });
  }
  root.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const open = spots.find((s) => s.hasAttribute("data-open"));
    if (open) {
      setOpen(open, false);
      pinOf(open).focus();
    }
  });
  document.addEventListener("pointerdown", (e) => {
    const t = e.target as Node;
    for (const s of spots) if (s.hasAttribute("data-open") && !s.contains(t)) setOpen(s, false);
  });
}
