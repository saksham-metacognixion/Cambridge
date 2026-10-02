// Count-up for stat numbers (Facilities section), as on the live site: every number runs from 0 to its value
// when the group scrolls into view, all finishing together. Runs once.
// Markup: [data-countup] holds the final text from JSON (e.g. "300,000+"), so no-JS and SEO see the real value.
// Screen readers read a separate sr-only copy; the animated span is aria-hidden.
// prefers-reduced-motion: nothing runs, the final numbers just show.

const DURATION = 2000; // ms, from the live-site recording
const ease = (t: number) => 1 - Math.pow(1 - t, 3); // ease-out cubic

function prepare(el: HTMLElement) {
  const text = el.textContent ?? "";
  const m = text.match(/^(\D*)([\d,]+)(.*)$/);
  if (!m) return null;
  const [, pre, num, post] = m;
  const target = Number(num.replace(/,/g, ""));
  const grouped = num.includes(",");
  const fmt = (n: number) =>
    pre + (grouped ? n.toLocaleString("en-US") : String(n)) + post;
  return {
    set: (p: number) => {
      el.textContent = fmt(Math.round(target * ease(p)));
    },
    done: () => {
      el.textContent = text;
    },
  };
}

function run(els: HTMLElement[]) {
  const counters = els
    .map(prepare)
    .filter((c): c is NonNullable<typeof c> => !!c);
  counters.forEach((c) => c.set(0));
  let start = 0;
  const tick = (t: number) => {
    if (!start) start = t;
    const p = Math.min((t - start) / DURATION, 1);
    counters.forEach((c) => (p < 1 ? c.set(p) : c.done()));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

if (matchMedia("(prefers-reduced-motion: no-preference)").matches) {
  const groups = new Map<Element, HTMLElement[]>();
  document.querySelectorAll<HTMLElement>("[data-countup]").forEach((el) => {
    const g = el.closest("[data-countup-group]") ?? el;
    groups.set(g, [...(groups.get(g) ?? []), el]);
  });
  // Observed element -> its counters. The stats wrapper is display:contents on desktop (no box),
  // so its first stat is observed instead.
  const watch = new Map<Element, HTMLElement[]>();
  groups.forEach((els, g) => watch.set(g.getClientRects().length ? g : els[0], els));
  // Counting starts only once the group is in view, so nobody sees it sitting at 0.
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        run(watch.get(e.target)!);
      });
    },
    { threshold: 0.3 },
  );
  watch.forEach((_, el) => io.observe(el));
}
