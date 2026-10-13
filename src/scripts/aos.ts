// Scroll entrances: the live site's Greenshift "AOS light" (aoslight.js + its per-block CSS), audited against the live About
// page on 7 Oct 2026. An element with `data-aos` gets `aos-animate` 10 ms after any part of it enters the viewport (bottom
// 5 % excluded) and loses it as soon as it is fully out of view again, above or below, so the entrance replays every time the
// section is scrolled back to (no `data-aos-once` on the live site). CSS in global.css; armed by the `aos` class that
// BaseLayout sets in <head> (IntersectionObserver present, no prefers-reduced-motion).

// An item inside a horizontal row (`.hscroll`, e.g. the Media Hub tiles) follows its ROW: the row is observed, and all its items
// show / hide together. Observed one by one, the tiles swiped in from the side were "out of view", so they were blank and faded in
// 0.8 s late on every swipe (mobile QA M3, 13 Oct 2026); the vertical entrance stays as live.

const els = document.querySelectorAll<HTMLElement>("[data-aos]");
if (els.length && document.documentElement.classList.contains("aos")) {
  const seen = new WeakSet<Element>();
  const targets = new Map<Element, HTMLElement[]>(); // observed element -> the [data-aos] items it drives
  els.forEach((el) => {
    const key = el.closest(".hscroll") ?? el;
    targets.set(key, [...(targets.get(key) ?? []), el]);
  });
  const io = new IntersectionObserver(
    (entries) => {
      for (const { target: t, isIntersecting } of entries) {
        const items = targets.get(t) ?? [];
        if (isIntersecting) {
          seen.add(t);
          setTimeout(
            () =>
              seen.has(t) &&
              items.forEach((i) => i.classList.add("aos-animate")),
            10,
          );
        } else {
          seen.delete(t);
          items.forEach((i) => i.classList.remove("aos-animate"));
        }
      }
    },
    { threshold: 0, rootMargin: "0px 0px -5% 0px" },
  );
  targets.forEach((_, key) => io.observe(key));
}
