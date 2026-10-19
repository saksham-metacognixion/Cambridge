// Count-up for stat numbers, as on the live site. Runs once. prefers-reduced-motion: nothing runs, the final numbers just show.
// Markup: [data-countup] holds the final text from JSON (e.g. "300,000+"), so no-JS and SEO see the real value.
// Screen readers read a separate sr-only copy; the animated span is aria-hidden.
// Two modes:
//  - group (Home Facilities, from the live-site recording): every number in a [data-countup-group] runs 0 -> value over 2 s,
//    ease-out cubic, all finishing together once the group is 30 % in view; the final value shows until then.
//  - Greenshift counter (Our Hospitals impact band, the live page's .gs-counter): an element with data-countup-duration="<s>"
//    counts on its own, linear, whole numbers rounded down, from 0, when it is 30 % in view; it shows "0" until then.

const DURATION = 2000; // ms, group mode
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

function prepare(el: HTMLElement, linear: boolean) {
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
      el.textContent = fmt(linear ? Math.floor(target * p) : Math.round(target * easeOut(p)));
    },
    zero: () => {
      el.textContent = pre + "0";
    },
    done: () => {
      el.textContent = text;
    },
  };
}

type Counter = NonNullable<ReturnType<typeof prepare>>;

function run(counters: Counter[], duration: number) {
  counters.forEach((c) => c.set(0));
  let start = 0;
  const tick = (t: number) => {
    if (!start) start = t;
    const p = Math.min((t - start) / duration, 1);
    counters.forEach((c) => (p < 1 ? c.set(p) : c.done()));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

if (matchMedia("(prefers-reduced-motion: no-preference)").matches) {
  // Observed element -> what to run when it comes into view.
  const watch = new Map<Element, () => void>();
  const groups = new Map<Element, HTMLElement[]>();
  document.querySelectorAll<HTMLElement>("[data-countup]").forEach((el) => {
    const secs = parseFloat(el.dataset.countupDuration ?? "");
    if (secs > 0) {
      const c = prepare(el, true);
      if (!c) return;
      c.zero();
      watch.set(el, () => run([c], secs * 1000));
      return;
    }
    const g = el.closest("[data-countup-group]") ?? el;
    groups.set(g, [...(groups.get(g) ?? []), el]);
  });
  // The stats wrapper is display:contents on desktop (no box), so its first stat is observed instead.
  groups.forEach((els, g) => {
    const counters = els.map((el) => prepare(el, false)).filter((c): c is Counter => !!c);
    watch.set(g.getClientRects().length ? g : els[0], () => run(counters, DURATION));
  });
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        watch.get(e.target)!();
      });
    },
    { threshold: 0.3 },
  );
  watch.forEach((_, el) => io.observe(el));
}
