/*
 * Home "Expert Care, Trusted Doctors" row (src/components/sections/Doctors.astro).
 *   Pills [data-country] all | sa | ae: show the cards whose data-sets contains it (ALL = every card), back to the first
 *   page, pages recounted. No URL state: the home page has several pill sets.
 *   Pagination dots: the shared component (src/scripts/pagination.ts), fed with this row's pages: a page = one visible
 *   width of the row. While the row loops ([data-looping], src/scripts/autoscroll.ts) it has no end, so the pages tile one
 *   loop period (every shown card once) and the position is taken inside it; otherwise (prefers-reduced-motion) the pages
 *   are those of a plain scroller, the last one at the end of the row. Hidden when every card fits.
 *   Start: one stop in on desktop, as Figma draws it (first card cut at the left edge).
 *   Auto-scroll: pills tell it to rebuild its copies ('autoscroll:refresh'); a dot click pauses it ('autoscroll:hold') so
 *   the smooth scroll is not overridden; after every rebuild ('autoscroll:change') the pages are recounted.
 * RTL: scrollLeft runs negative in RTL, so positions are taken as absolute values and the sign is put back on scroll.
 */
import { loopPageCount, loopPageIndex, pageCount, pageIndex } from "../lib/pagination";
import { createPagination } from "./pagination";

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const desktop = matchMedia("(min-width: 1024px)");

for (const section of document.querySelectorAll<HTMLElement>(
  "section:has([data-row])",
)) {
  const row = section.querySelector<HTMLElement>("[data-row]");
  const nav = section.querySelector<HTMLElement>("[data-pagination]");
  const pills = [
    ...section.querySelectorAll<HTMLButtonElement>(
      "[data-row-pills] [data-country]",
    ),
  ];
  if (!row || !nav) continue;
  // The original cards only (the auto-scroll copies come after the [data-loop-row] element).
  const cards = [
    ...row.querySelectorAll<HTMLElement>("[data-loop-row] [data-sets]"),
  ];
  const looping = () => row.hasAttribute("data-looping");
  const sign = () => (getComputedStyle(row).direction === "rtl" ? -1 : 1);

  const visible = () => cards.filter((c) => !c.hidden);
  // Card pitch; one loop period = every shown card once (autoscroll.ts: step x items).
  const pitch = () => {
    const [a, b] = visible();
    return a && b ? Math.abs(b.offsetLeft - a.offsetLeft) : 0;
  };
  const period = () => pitch() * visible().length;
  const max = () => row.scrollWidth - row.clientWidth;
  const page = () => row.clientWidth;
  const pos = () => Math.abs(row.scrollLeft);
  const scroll = (x: number, smooth = true) =>
    row.scrollTo({
      left: sign() * x,
      behavior: smooth && !reduced ? "smooth" : "auto",
    });

  const pg = createPagination(nav, {
    count: () =>
      looping() ? loopPageCount(period(), page()) : pageCount(max(), page()),
    current: () =>
      looping()
        ? loopPageIndex(pos(), period(), page())
        : pageIndex(pos(), max(), page()),
    go: (i) => {
      row.dispatchEvent(new Event("autoscroll:hold"));
      scroll(Math.min(i * page(), max()));
    },
  });

  const show = (country: string) => {
    for (const c of cards)
      c.hidden = !(c.dataset.sets ?? "").split(" ").includes(country);
    for (const p of pills)
      p.setAttribute("aria-pressed", String(p.dataset.country === country));
    scroll(0, false);
    row.dispatchEvent(new Event("autoscroll:refresh"));
    pg.update();
  };

  for (const p of pills)
    p.addEventListener("click", () => show(p.dataset.country ?? "all"));
  let raf = 0;
  row.addEventListener(
    "scroll",
    () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(pg.mark);
    },
    { passive: true },
  );
  new ResizeObserver(() => pg.update()).observe(row);
  row.addEventListener("autoscroll:change", () => pg.update());

  if (desktop.matches) scroll(pitch(), false);
  pg.update();
}
