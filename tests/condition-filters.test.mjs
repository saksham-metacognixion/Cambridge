// Run: npm run test:conditions   (Node 22.18+/24+ strips the TypeScript types natively)
import assert from 'node:assert/strict';
import { applyFilters, emptyState, parseState, toSearch } from '../src/lib/condition-filters.ts';

const items = [
  { slug: 'stroke', title: 'Stroke Rehabilitation', specialties: ['neuro'] },
  { slug: 'back', title: 'Back Pain', specialties: ['msk'] },
  { slug: 'tbi', title: 'Traumatic Brain Injury', specialties: ['neuro'] },
  { slug: 'palsy', title: 'Cerebral Palsy', specialties: [] },
];
const known = { specialties: ['neuro', 'msk'], conditions: items.map((i) => i.slug) };
const slugs = (s) => applyFilters(items, s).map((i) => i.slug);

// default: everything, Figma order
assert.deepEqual(slugs(emptyState()), ['stroke', 'back', 'tbi', 'palsy']);
// speciality filter
assert.deepEqual(slugs({ ...emptyState(), specialty: 'neuro' }), ['stroke', 'tbi']);
// condition filter
assert.deepEqual(slugs({ ...emptyState(), condition: 'back' }), ['back']);
// both: no match -> empty (the page shows the empty state)
assert.deepEqual(slugs({ ...emptyState(), specialty: 'neuro', condition: 'back' }), []);
// A–Z keeps the filters
assert.deepEqual(slugs({ ...emptyState(), sort: 'az' }), ['back', 'palsy', 'stroke', 'tbi']);
assert.deepEqual(slugs({ specialty: 'neuro', condition: '', sort: 'az' }), ['stroke', 'tbi']);

// URL round trip, unknown values dropped
const s = { specialty: 'neuro', condition: 'tbi', sort: 'az' };
assert.equal(toSearch(s), '?specialty=neuro&condition=tbi&sort=az');
assert.deepEqual(parseState(toSearch(s), known), s);
assert.deepEqual(parseState('?specialty=nope&condition=x&sort=za', known), emptyState());
assert.equal(toSearch(emptyState()), '');

console.log('condition-filters: all tests passed');
