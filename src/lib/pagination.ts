/*
 * Page maths of the shared pagination dots (src/scripts/pagination.ts, src/components/shared/Pagination.astro), kept pure
 * so tests/pagination.test.mjs can run it in Node.
 *
 * A horizontal row is paged by its visible width: page i starts at i × page, the last page starts at `max` (the end of the
 * row: scrollWidth - clientWidth), so the visitor can always reach the end cleanly. A row that does not overflow has 0 pages
 * (no dots). The current page is the one whose start is nearest to the scroll position.
 *
 * A looping row (Home doctors, src/scripts/autoscroll.ts) has no end: its positions repeat every `period`, so the pages
 * tile one period and the distance is measured around the loop.
 */

/** Number of pages of a row with `max` = scrollWidth - clientWidth and `page` = one visible width. */
export function pageCount(max: number, page: number): number {
  if (!(page > 0) || max <= 1) return 0;
  return Math.ceil((max - 1) / page) + 1;
}

/** Scroll position of the start of every page (the last one is the end of the row). */
export function pageStarts(max: number, page: number): number[] {
  return Array.from({ length: pageCount(max, page) }, (_, i) => Math.min(i * page, max));
}

/** Page whose start is nearest to `pos` (0-based). */
export function pageIndex(pos: number, max: number, page: number): number {
  return nearest(pos, pageStarts(max, page), (a, b) => Math.abs(a - b));
}

/** Pages that tile one loop period (a looping row never "fits"; fewer than 2 pages hides the dots). */
export function loopPageCount(period: number, page: number): number {
  if (!(page > 0) || !(period > 0)) return 0;
  return Math.ceil(period / page);
}

/** Start of every page inside one loop period. */
export function loopPageStarts(period: number, page: number): number[] {
  return Array.from({ length: loopPageCount(period, page) }, (_, i) => i * page);
}

/** Page nearest to `pos` (taken inside one period) measured around the loop, so the end of the period is next to its start. */
export function loopPageIndex(pos: number, period: number, page: number): number {
  const p = period > 0 ? ((pos % period) + period) % period : 0;
  return nearest(p, loopPageStarts(period, page), (a, b) => {
    const d = Math.abs(a - b);
    return Math.min(d, period - d);
  });
}

/** First dot of a window of `size` dots shown around the current one (narrow screens, bug 023): centred, clamped to the ends. */
export function windowStart(current: number, count: number, size: number): number {
  return Math.max(0, Math.min(current - Math.floor(size / 2), count - size));
}

function nearest(pos: number, starts: number[], dist: (a: number, b: number) => number): number {
  let best = 0;
  for (let i = 1; i < starts.length; i++) if (dist(pos, starts[i]) < dist(pos, starts[best])) best = i;
  return best;
}
