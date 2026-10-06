// Run: npm run test:pagination   (Node 22.18+/24+ strips the TypeScript types natively)
import assert from 'node:assert/strict';
import { loopPageCount, loopPageIndex, loopPageStarts, pageCount, pageIndex, pageStarts } from '../src/lib/pagination.ts';

// A row that fits (or overhangs by a rounding pixel) has no pages: the dots are hidden.
assert.equal(pageCount(0, 1440), 0);
assert.equal(pageCount(1, 1440), 0);
assert.equal(pageCount(-5, 1440), 0);
assert.equal(pageCount(500, 0), 0);

// Pages of one visible width; the last page starts at the end of the row.
assert.equal(pageCount(560, 1440), 2); // 2000 wide in a 1440 scroller
assert.deepEqual(pageStarts(560, 1440), [0, 560]);
assert.equal(pageCount(2000, 1440), 3); // 3440 wide
assert.deepEqual(pageStarts(2000, 1440), [0, 1440, 2000]);
assert.equal(pageCount(2880, 1440), 3); // exactly 3 widths: 0, 1440, 2880
assert.deepEqual(pageStarts(2880, 1440), [0, 1440, 2880]);
assert.equal(pageCount(2881, 1440), 3); // 1px past three widths: a rounding pixel, no extra page
assert.equal(pageCount(2882, 1440), 4);

// The current page is the one whose start is nearest to the scroll position (RTL callers pass |scrollLeft|).
assert.equal(pageIndex(0, 2000, 1440), 0);
assert.equal(pageIndex(700, 2000, 1440), 0);
assert.equal(pageIndex(800, 2000, 1440), 1);
assert.equal(pageIndex(1440, 2000, 1440), 1);
assert.equal(pageIndex(1800, 2000, 1440), 2);
assert.equal(pageIndex(2000, 2000, 1440), 2);
assert.equal(pageIndex(99999, 2000, 1440), 2);
assert.equal(pageIndex(300, 0, 1440), 0); // no pages: index 0, never out of range

// Looping rows: the pages tile one period; the distance wraps around the loop.
assert.equal(loopPageCount(0, 1440), 0);
assert.equal(loopPageCount(1746, 1440), 2); // 6 doctor cards x 291
assert.equal(loopPageCount(6984, 1440), 5); // 24 cards
assert.deepEqual(loopPageStarts(6984, 1440), [0, 1440, 2880, 4320, 5760]);
assert.equal(loopPageIndex(0, 6984, 1440), 0);
assert.equal(loopPageIndex(1500, 6984, 1440), 1);
assert.equal(loopPageIndex(5760, 6984, 1440), 4);
assert.equal(loopPageIndex(6900, 6984, 1440), 0); // 84 before the wrap: nearer to page 1 (at 0) than to page 5 (at 5760)
assert.equal(loopPageIndex(6984 + 1500, 6984, 1440), 1); // a position past one period is taken inside it
assert.equal(loopPageIndex(-100, 6984, 1440), 0);

console.log('pagination: all assertions passed');
