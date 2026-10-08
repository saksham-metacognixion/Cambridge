// Run: npm run test:filters   (Node 22.18+/24+ strips the TypeScript types natively)
import assert from 'node:assert/strict';
import {
  applyFilters, defaultState, hospitalsFor, parseState, setCountry, setHospital, setQuery, setSpecialty, toSearch,
} from '../src/lib/doctor-filters.ts';

const hospitals = [
  { slug: 'abu-dhabi', country: 'ae' },
  { slug: 'al-ain', country: 'ae' },
  { slug: 'dhahran', country: 'sa' },
  { slug: 'jeddah', country: 'sa' },
];
const doctors = [
  { slug: 'a', name: 'Dr. Ahmad Al Khayer', country: 'ae', hospital: 'abu-dhabi', specialties: ['rehab'] },
  { slug: 'b', name: 'Dr. Wael Sary', country: 'ae', hospital: 'al-ain', specialties: ['icu'] },
  { slug: 'c', name: 'Dr. Rasha Hassan', country: 'sa', hospital: 'dhahran', specialties: ['gp'] },
  { slug: 'd', name: 'Dr. Ebtihal Rahma Ahmed', country: 'sa', hospital: 'jeddah', specialties: ['icu', 'gp'] },
];
const slugs = (s) => applyFilters(doctors, s).map((d) => d.slug);

let failed = 0;
const test = (name, fn) => {
  try { fn(); console.log('  ok   ' + name); } catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + e.message); }
};

console.log('Find a Doctor filters');

test('Global defaults to all doctors', () => {
  assert.equal(defaultState('global').country, 'all');
  assert.deepEqual(slugs(defaultState('global')), ['a', 'b', 'c', 'd']);
});
test('/ae and /sa default to their own country and only show its doctors', () => {
  assert.equal(defaultState('ae').country, 'ae');
  assert.deepEqual(slugs(defaultState('ae')), ['a', 'b']);
  assert.equal(defaultState('sa').country, 'sa');
  assert.deepEqual(slugs(defaultState('sa')), ['c', 'd']);
});
test('MAIN BUG: country stays selected when hospital, specialty or name changes', () => {
  let s = setCountry(defaultState('global'), 'sa', hospitals);
  s = setHospital(s, 'jeddah'); assert.equal(s.country, 'sa');
  s = setSpecialty(s, 'icu'); assert.equal(s.country, 'sa');
  s = setQuery(s, 'ebti'); assert.equal(s.country, 'sa');
  s = setHospital(s, ''); assert.equal(s.country, 'sa');
  s = setSpecialty(s, ''); assert.equal(s.country, 'sa');
  assert.deepEqual(slugs(s), ['d']);
});
test('country stays selected on /ae too, even when the other filters are changed back and forth', () => {
  let s = defaultState('ae');
  for (const next of [(x) => setSpecialty(x, 'icu'), (x) => setHospital(x, 'al-ain'), (x) => setQuery(x, 'wael')]) {
    s = next(s); assert.equal(s.country, 'ae');
  }
});
test('hospital options depend on the country', () => {
  assert.deepEqual(hospitalsFor('ae', hospitals).map((h) => h.slug), ['abu-dhabi', 'al-ain']);
  assert.deepEqual(hospitalsFor('sa', hospitals).map((h) => h.slug), ['dhahran', 'jeddah']);
  assert.equal(hospitalsFor('all', hospitals).length, 4);
});
test('changing country clears only a hospital from the other country, never the other filters', () => {
  let s = setSpecialty(setHospital(defaultState('global'), 'dhahran'), 'gp');
  s = setCountry(s, 'ae', hospitals);
  assert.equal(s.country, 'ae'); assert.equal(s.hospital, ''); assert.equal(s.specialty, 'gp');
  let t2 = setHospital(defaultState('global'), 'abu-dhabi');
  t2 = setCountry(t2, 'ae', hospitals); assert.equal(t2.hospital, 'abu-dhabi'); // same country: kept
  t2 = setCountry(t2, 'all', hospitals); assert.equal(t2.hospital, 'abu-dhabi'); // "all": kept
});
test('URL round trip: state -> query string -> same state', () => {
  const s = { country: 'sa', hospital: 'jeddah', specialty: 'icu', q: 'ebtihal' };
  const qs = toSearch(s, 'global');
  assert.equal(qs, '?country=sa&hospital=jeddah&specialty=icu&q=ebtihal');
  assert.deepEqual(parseState(qs, 'global', hospitals), s);
});
test('URL: the edition default country is left out, a different one is written (also "all" on /ae)', () => {
  assert.equal(toSearch(defaultState('ae'), 'ae'), '');
  assert.equal(toSearch({ ...defaultState('ae'), country: 'all' }, 'ae'), '?country=all');
  assert.equal(toSearch({ ...defaultState('ae'), country: 'sa' }, 'ae'), '?country=sa');
  assert.equal(parseState('?country=all', 'ae', hospitals).country, 'all');
  assert.equal(parseState('', 'ae', hospitals).country, 'ae');
  assert.equal(toSearch({ ...defaultState('global'), specialty: 'icu' }, 'global'), '?specialty=icu');
});
test('shared link reproduces the same results', () => {
  const s = parseState('?country=sa&specialty=icu', 'global', hospitals);
  assert.deepEqual(slugs(s), ['d']);
});
test('a link with a hospital from another country keeps the country and drops the hospital', () => {
  const s = parseState('?country=ae&hospital=jeddah', 'global', hospitals);
  assert.equal(s.country, 'ae'); assert.equal(s.hospital, '');
});
test('junk values fall back to defaults', () => {
  const s = parseState('?country=mars&q=%20%20', 'sa', hospitals);
  assert.equal(s.country, 'sa'); assert.equal(s.q, '');
});
test('back button: restoring an earlier URL restores that exact filter state', () => {
  // The island pushes toSearch(state) on every change and re-parses location.search on popstate.
  const history = [];
  let s = defaultState('global'); history.push(toSearch(s, 'global'));
  s = setCountry(s, 'sa', hospitals); history.push(toSearch(s, 'global'));
  s = setSpecialty(s, 'icu'); history.push(toSearch(s, 'global'));
  s = setHospital(s, 'jeddah'); history.push(toSearch(s, 'global'));
  const back = (i) => parseState(history[i], 'global', hospitals);
  assert.deepEqual(back(2), { country: 'sa', hospital: '', specialty: 'icu', q: '' });
  assert.deepEqual(back(1), { country: 'sa', hospital: '', specialty: '', q: '' });
  assert.deepEqual(back(0), defaultState('global'));
});
test('name search ignores case and accents', () => {
  assert.deepEqual(slugs(setQuery(defaultState('global'), 'KHAYER')), ['a']);
  assert.deepEqual(slugs(setQuery(defaultState('global'), 'ebtíhal')), ['d']);
});
test('a doctor with several specialties matches each of them', () => {
  assert.deepEqual(slugs(setSpecialty(defaultState('global'), 'gp')), ['c', 'd']);
  assert.deepEqual(slugs(setSpecialty(defaultState('global'), 'icu')), ['b', 'd']);
});
test('empty state: nothing matches -> empty list (country is still kept)', () => {
  let s = setCountry(defaultState('global'), 'ae', hospitals);
  s = setSpecialty(s, 'gp');
  assert.deepEqual(slugs(s), []);
  assert.equal(s.country, 'ae');
});
test('invalid URL values are ignored (unknown country, hospital, specialty)', () => {
  const s = parseState('?country=zz&hospital=999&specialty=foo', 'ae', hospitals, ['gp', 'icu']);
  assert.equal(s.country, 'ae');
  assert.equal(s.hospital, '');
  assert.equal(s.specialty, '');
  assert.equal(parseState('?specialty=gp', 'global', hospitals, ['gp']).specialty, 'gp');
});

console.log(failed ? `\n${failed} test(s) FAILED` : '\nAll filter tests passed');
process.exit(failed ? 1 : 0);
