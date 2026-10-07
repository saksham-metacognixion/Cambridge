// Scroll entrances: the live site's Greenshift "AOS light" (aoslight.js + its per-block CSS), audited against the live About
// page on 7 Oct 2026. An element with `data-aos` gets `aos-animate` 10 ms after any part of it enters the viewport (bottom
// 5 % excluded) and loses it as soon as it is fully out of view again, above or below, so the entrance replays every time the
// section is scrolled back to (no `data-aos-once` on the live site). CSS in global.css; armed by the `aos` class that
// BaseLayout sets in <head> (IntersectionObserver present, no prefers-reduced-motion).

const els = document.querySelectorAll<HTMLElement>('[data-aos]');
if (els.length && document.documentElement.classList.contains('aos')) {
  const seen = new WeakSet<Element>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const { target: t, isIntersecting } of entries) {
        if (isIntersecting) {
          seen.add(t);
          setTimeout(() => seen.has(t) && t.classList.add('aos-animate'), 10);
        } else {
          seen.delete(t);
          t.classList.remove('aos-animate');
        }
      }
    },
    { threshold: 0, rootMargin: '0px 0px -5% 0px' },
  );
  els.forEach((el) => io.observe(el));
}
