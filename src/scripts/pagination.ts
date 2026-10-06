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
 * RTL: every evergreen browser (Chrome, Firefox, Safari) reports a negative scrollLeft in an RTL scroller, 0 at the logical
 * start (the right edge). Positions are therefore taken as |scrollLeft| and the sign is put back when scrolling, so dot 1
 * is always the logical first page in both directions.
 */
import { pageCount, pageIndex } from "../lib/pagination";

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

export function createPagination(nav: HTMLElement, src: Source): Pagination {
  const label = nav.dataset.dotLabel ?? "{n}";
  let dots: HTMLButtonElement[] = [];
  const mark = () => {
    const i = src.current();
    dots.forEach((d, k) =>
      k === i ? d.setAttribute("aria-current", "true") : d.removeAttribute("aria-current"),
    );
  };
  const update = () => {
    const n = src.count();
    nav.hidden = n < 2;
    if (dots.length !== n) {
      dots = Array.from({ length: n }, (_, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "pgn-dot";
        b.setAttribute("aria-label", label.replace("{n}", String(i + 1)).replace("{total}", String(n)));
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

/** Horizontal scroller as a page source; `watch` keeps the dots in step with scrolling, resizing and content changes. */
export function scrollSource(row: HTMLElement): Source & { watch(pg: Pagination): void } {
  const sign = () => (getComputedStyle(row).direction === "rtl" ? -1 : 1);
  const max = () => row.scrollWidth - row.clientWidth;
  return {
    count: () => pageCount(max(), row.clientWidth),
    current: () => pageIndex(Math.abs(row.scrollLeft), max(), row.clientWidth),
    go: (i) =>
      row.scrollTo({
        left: sign() * Math.min(i * row.clientWidth, max()),
        behavior: reduced ? "auto" : "smooth",
      }),
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
      new ResizeObserver(pg.update).observe(row);
      new MutationObserver(pg.update).observe(row, { childList: true, subtree: true, attributeFilter: ["hidden"] });
      document.fonts?.ready.then(pg.update);
    },
  };
}

// Self-mounting scroll rows.
for (const nav of document.querySelectorAll<HTMLElement>("[data-pagination][data-for]")) {
  const row = document.getElementById(nav.dataset.for!);
  if (!row) continue;
  const src = scrollSource(row);
  src.watch(createPagination(nav, src));
}
