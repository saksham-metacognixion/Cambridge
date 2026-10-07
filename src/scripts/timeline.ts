/*
 * About "Journey of Excellence": the live site's Swiper behaviour (animation audit against the live About page, 7 Oct 2026;
 * its settings: speed 400, loop, autoplay 6000 ms, pauseOnMouseEnter off, disableOnInteraction on, grab cursor) on our
 * scroll-snap row, without a slider library.
 * - Loop: the cards are copied once after the originals (copies aria-hidden, out of the tab order) and the row wraps by one
 *   period ([data-loop-period], also read by drag-scroll.ts), so it never hits an end.
 * - The two Figma arrows move one card, 400 ms with Swiper's CSS `ease`; past the last card comes the first again.
 * - Autoplay: one card every 6 s, starting like the live site's lazily loaded Swiper (first mouseover / scroll / touch / key);
 *   not paused by hovering, paused while the tab is hidden, and stopped for good by any interaction (arrow, drag, swipe,
 *   wheel). prefers-reduced-motion: no autoplay and the arrows jump.
 */
const SPEED = 400; // Swiper `speed`
const DELAY = 6000; // Swiper `autoplay.delay`
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// CSS `ease` = cubic-bezier(0.25, 0.1, 0.25, 1), solved for x by Newton steps.
const ease = (x: number) => {
  const bx = (t: number) =>
    3 * 0.25 * t * (1 - t) ** 2 + 3 * 0.25 * t * t * (1 - t) + t ** 3;
  const by = (t: number) =>
    3 * 0.1 * t * (1 - t) ** 2 + 3 * t * t * (1 - t) + t ** 3;
  let t = x;
  for (let i = 0; i < 8; i++) {
    const d = (bx(t + 1e-4) - bx(t - 1e-4)) / 2e-4;
    if (!d) break;
    t = Math.min(1, Math.max(0, t - (bx(t) - x) / d));
  }
  return by(t);
};

document.querySelectorAll<HTMLElement>("[data-timeline]").forEach((root) => {
  const row = root.querySelector<HTMLElement>("[data-timeline-row]");
  const cards = row
    ? [...row.querySelectorAll<HTMLElement>("[data-timeline-card]")]
    : [];
  if (!row || cards.length < 2) return;
  const sign = () => (getComputedStyle(row).direction === "rtl" ? -1 : 1);
  const now = () => row.scrollLeft * sign(); // distance from the start edge
  const edge = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return sign() < 0 ? -r.right : r.left;
  };

  // Loop copies (the connector line is copied along so the gaps look the same in the copy).
  const frag = document.createDocumentFragment();
  let firstCopy: HTMLElement | undefined;
  for (const c of cards) {
    c.setAttribute("data-loop-item", "");
    const k = c.cloneNode(true) as HTMLElement;
    k.setAttribute("aria-hidden", "true");
    k.removeAttribute("data-timeline-card");
    k.querySelectorAll("[id]").forEach((e) => e.removeAttribute("id"));
    firstCopy ??= k;
    frag.append(k);
  }
  row.append(frag);
  const connector = row.querySelector<HTMLElement>(".connector");
  const connectorCopy = connector?.cloneNode(true) as HTMLElement | undefined;
  if (connectorCopy) row.insertBefore(connectorCopy, firstCopy!); // behind the copies, as the original is behind the cards
  let period = 0;
  let resized = 0; // a resize re-snaps the row: that scroll is not the visitor's
  const measure = () => {
    period = edge(firstCopy!) - edge(cards[0]);
    resized = performance.now();
    row.dataset.loopPeriod = String(period);
    if (connector && connectorCopy)
      connectorCopy.style.insetInlineStart = `calc(${getComputedStyle(connector).insetInlineStart} + ${period}px)`;
  };
  measure();
  new ResizeObserver(measure).observe(row);

  // Every scrollLeft this script writes is remembered, so a scroll event can tell the visitor's scrolling from ours.
  let mine = NaN;
  const write = (abs: number) => {
    row.scrollLeft = abs * sign();
    mine = row.scrollLeft;
  };
  const put = (abs: number) => {
    abs %= period;
    if (abs < 0) abs += period;
    write(abs);
  };
  // Card starts (abs), originals and copies, from the current layout.
  const stops = () => {
    const at = now(),
      o = edge(row);
    return [...row.querySelectorAll<HTMLElement>(":scope > article")].map(
      (c) => at + edge(c) - o,
    );
  };

  let raf = 0;
  const slide = (dir: 1 | -1) => {
    cancelAnimationFrame(raf);
    let from = now();
    if (dir < 0 && from < 1) from += period; // before the first card: continue from the same view in the copy
    put(from);
    const s = stops();
    const to =
      dir > 0
        ? s.find((p) => p > from + 1)
        : [...s].reverse().find((p) => p < from - 1);
    if (to === undefined) return;
    if (reduced()) return put(to);
    row.style.scrollSnapType = "none"; // or the browser snaps every frame back to a card
    const t0 = performance.now();
    const frame = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - t0) / SPEED));
      write(from + (to - from) * ease(p));
      if (p < 1) raf = requestAnimationFrame(frame);
      else {
        raf = 0;
        put(to);
        row.style.scrollSnapType = "";
      }
    };
    raf = requestAnimationFrame(frame);
  };

  // The visitor scrolling the row (drag, swipe, wheel, keys) stops autoplay, like Swiper's sliderFirstMove; a native
  // swipe / trackpad scroll that ends inside the copy is moved back to the same view in the originals.
  let idle = 0;
  row.addEventListener(
    "scroll",
    () => {
      if (raf) return;
      if (Math.abs(row.scrollLeft - mine) > 1 && performance.now() - resized > 300) stop();
      clearTimeout(idle);
      idle = window.setTimeout(() => now() >= period - 1 && put(now()), 150);
    },
    { passive: true },
  );

  // Autoplay
  let timer = 0;
  let stopped = reduced();
  const schedule = () => {
    clearTimeout(timer);
    if (!stopped && !document.hidden)
      timer = window.setTimeout(() => {
        slide(1);
        schedule();
      }, DELAY);
  };
  const stop = () => {
    stopped = true;
    clearTimeout(timer);
  };
  const start = () => {
    for (const [t, e] of starters) t.removeEventListener(e, start);
    schedule();
  };
  const starters: [EventTarget, string][] = [
    [document.body, "mouseover"],
    [document.body, "touchmove"],
    [window, "scroll"],
    [document.body, "keydown"],
  ];
  if (!stopped)
    for (const [t, e] of starters)
      t.addEventListener(e, start, { once: true, passive: true });
  document.addEventListener("visibilitychange", schedule);

  root
    .querySelectorAll<HTMLButtonElement>("[data-timeline-dir]")
    .forEach((b) => {
      b.addEventListener("click", () => {
        stop();
        slide(Number(b.dataset.timelineDir) > 0 ? 1 : -1);
      });
    });
});
