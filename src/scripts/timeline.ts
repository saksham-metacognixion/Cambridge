/*
 * About "Journey of Excellence": the live site's Swiper layout on our scroll-snap row, without a slider library and without
 * its motion (all animations removed, 16 Oct 2026: no autoplay, the arrows jump).
 * - Loop: the cards are copied once after the originals (copies aria-hidden, out of the tab order) and the row wraps by one
 *   period ([data-loop-period], also read by drag-scroll.ts), so it never hits an end.
 * - The two Figma arrows move one card at once; past the last card comes the first again.
 * - Dots ([data-timeline-dot], decorative like the live, non-clickable Swiper bullets): one per card, the current one = the
 *   card at the row's start; it follows the arrows and manual scrolling.
 */
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
  const measure = () => {
    period = edge(firstCopy!) - edge(cards[0]);
    row.dataset.loopPeriod = String(period);
    if (connector && connectorCopy)
      connectorCopy.style.insetInlineStart = `calc(${getComputedStyle(connector).insetInlineStart} + ${period}px)`;
  };
  measure();
  new ResizeObserver(measure).observe(row);

  const put = (abs: number) => {
    abs %= period;
    if (abs < 0) abs += period;
    row.scrollLeft = abs * sign();
  };
  // Card starts (abs), originals and copies, from the current layout.
  const stops = () => {
    const at = now(),
      o = edge(row);
    return [...row.querySelectorAll<HTMLElement>(":scope > article")].map(
      (c) => at + edge(c) - o,
    );
  };

  // Dots: card index at a given start distance (abs), wrapped into the originals.
  const dots = [...root.querySelectorAll<HTMLElement>("[data-timeline-dot]")];
  const markAt = (abs: number) => {
    const step = edge(cards[1]) - edge(cards[0]);
    if (!dots.length || !step) return;
    const n = cards.length;
    const i = ((Math.round(abs / step) % n) + n) % n;
    dots.forEach((d, k) => d.classList.toggle("on", k === i));
  };

  const slide = (dir: 1 | -1) => {
    let from = now();
    if (dir < 0 && from < 1) from += period; // before the first card: continue from the same view in the copy
    put(from);
    const s = stops();
    const to =
      dir > 0
        ? s.find((p) => p > from + 1)
        : [...s].reverse().find((p) => p < from - 1);
    if (to === undefined) return;
    markAt(to);
    put(to);
  };

  // A native swipe / trackpad scroll that ends inside the copy is moved back to the same view in the originals.
  let idle = 0;
  row.addEventListener(
    "scroll",
    () => {
      markAt(now());
      clearTimeout(idle);
      idle = window.setTimeout(() => now() >= period - 1 && put(now()), 150);
    },
    { passive: true },
  );

  root
    .querySelectorAll<HTMLButtonElement>("[data-timeline-dir]")
    .forEach((b) => {
      b.addEventListener("click", () => {
        slide(Number(b.dataset.timelineDir) > 0 ? 1 : -1);
      });
    });
});
