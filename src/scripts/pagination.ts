/*
 * Shared pagination dots (bug 012): ONE implementation for every row and gallery. Markup = src/components/shared/Pagination.astro
 * (an empty <nav data-pagination>); this module fills it with one <button> per page, marks the current one with aria-current
 * and hides the whole thing with fewer than two pages. The page maths live in src/lib/pagination.ts (tested in Node).
 *
 *  - Scroll rows mount themselves: <Pagination for="<row id>"> -> [data-for]. A page = one visible width of the row, the
 *    last page = the end of the row (src/lib/pagination.ts). The current dot follows manual scrolling; the pages are
 *    recounted when the row is resized (ResizeObserver), when cards are added or hidden (MutationObserver: Latest posts load
 *    more, filters) and when the fonts are in. Native scrolling / swiping stays untouched; a dot click smooth-scrolls there.
 *  - Anything with its own notion of a page (the looping Home doctors row, the hospital photo galleries) calls
 *    createPagination(nav, source) with its own count / current / go and update() when its state changes.
 *
 * Narrow screens (bug 023): a long row (the Home doctors row has ~18 pages at 360-390) would give a dot line wider than the
 * phone. Every dot stays in the DOM, but only a window of WINDOW dots around the current one is shown below 600px
 * (Pagination.astro hides [data-out] dots there); the dot at each window edge with more beyond is drawn smaller
 * ([data-edge]). The window moves with the current page. Wider screens show every dot, as before.
 *
 * RTL: every evergreen browser (Chrome, Firefox, Safari) reports a negative scrollLeft in an RTL scroller, 0 at the logical
 * start (the right edge). Positions are therefore taken as |scrollLeft| and the sign is put back when scrolling, so dot 1
 * is always the logical first page in both directions.
 */
import {
  loopPageCount,
  loopPageIndex,
  pageCount,
  pageIndex,
  windowStart,
} from "../lib/pagination";

export interface Source {
  /** number of pages (0 or 1 hides the dots) */
  count(): number;
  /** current page, 0-based */
  current(): number;
  /** show page i */
  go(i: number): void;
}
export interface Pagination {
  /** pages may have changed: rebuild the dots (if the count changed) and mark the current one */
  update(): void;
  /** only the position changed: mark the current dot */
  mark(): void;
}

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
/** Dots shown at once below 600px (Pagination.astro). */
const WINDOW = 7;


export function createPagination(nav: HTMLElement, src: Source): Pagination {
  const label = nav.dataset.dotLabel ?? "{n}";
  let dots: HTMLButtonElement[] = [];
  const mark = () => {
    const i = src.current();
    const n = dots.length;
    const a = windowStart(i, n, WINDOW);
    const b = Math.min(n, a + WINDOW) - 1;
    dots.forEach((d, k) => {
      if (k === i) d.setAttribute("aria-current", "true");
      else d.removeAttribute("aria-current");
      d.toggleAttribute("data-out", k < a || k > b);
      d.toggleAttribute(
        "data-edge",
        (k === a && a > 0) || (k === b && b < n - 1),
      );
    });
  };
  const update = () => {
    const n = src.count();
    nav.hidden = n < 2;
    if (dots.length !== n) {
      dots = Array.from({ length: n }, (_, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "pgn-dot";
        b.setAttribute(
          "aria-label",
          label.replace("{n}", String(i + 1)).replace("{total}", String(n)),
        );
        b.addEventListener("click", () => src.go(i));
        return b;
      });
      nav.replaceChildren(...dots);
    }
    mark();
  };
  update();
  return { update, mark };
}

/**
 * Horizontal scroller as a page source; `watch` keeps the dots in step with scrolling, resizing and content changes.
 * A row that loops (src/scripts/autoscroll.ts sets [data-loop-period] on it, e.g. the Media Hub Latest row, bug 064) has
 * no end: its pages tile one loop period (every card once, the copies excluded) and the position is taken inside it, as in
 * the Home doctors row (doctors-row.ts); a dot click pauses the loop ('autoscroll:hold') so the smooth scroll is not
 * overridden, and every rebuild of the copies ('autoscroll:change') recounts the pages.
 */
export function scrollSource(
  row: HTMLElement,
): Source & { watch(pg: Pagination): void } {
  const sign = () => (getComputedStyle(row).direction === "rtl" ? -1 : 1);
  const max = () => row.scrollWidth - row.clientWidth;
  const period = () => Number(row.dataset.loopPeriod) || 0;
  return {
    count: () =>
      period()
        ? loopPageCount(period(), row.clientWidth)
        : pageCount(max(), row.clientWidth),
    current: () =>
      period()
        ? loopPageIndex(Math.abs(row.scrollLeft), period(), row.clientWidth)
        : pageIndex(Math.abs(row.scrollLeft), max(), row.clientWidth),
    go: (i) => {
      row.dispatchEvent(new Event("autoscroll:hold"));
      row.scrollTo({
        left: sign() * Math.min(i * row.clientWidth, max()),
        behavior: reduced ? "auto" : "smooth",
      });
    },
    watch(pg) {
      let raf = 0;
      row.addEventListener(
        "scroll",
        () => {
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(pg.mark);
        },
        { passive: true },
      );
      row.addEventListener("autoscroll:change", pg.update);
      new ResizeObserver(pg.update).observe(row);
      new MutationObserver(pg.update).observe(row, {
        childList: true,
        subtree: true,
        attributeFilter: ["hidden"],
      });
      document.fonts?.ready.then(pg.update);
    },
  };
}

// Self-mounting scroll rows.
for (const nav of document.querySelectorAll<HTMLElement>(
  "[data-pagination][data-for]",
)) {
  const row = document.getElementById(nav.dataset.for!);
  if (!row) continue;
  const src = scrollSource(row);
  src.watch(createPagination(nav, src));
}
