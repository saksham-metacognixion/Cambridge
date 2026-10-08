/*
 * Find a Doctor filter island (scope 2.6). The list is already in the HTML; this shows/hides cards and, on every change,
 * narrows the two dropdowns to the options that still give results (bug 052: country first, then specialty <-> name).
 * A country change clears a specialty / doctor of the other country (prune), and so does a hand-edited URL.
 * State lives in the URL (?country=&hospital=&specialty=&q=): every change pushes a history entry, back/forward restore it.
 * Logic (and its tests): src/lib/doctor-filters.ts. Dropdowns: src/scripts/combobox.ts.
 */
import {
  applyFilters, nameOptions, parseState, prune, setCountry, setQuery, setSpecialty, specialtyOptions, toSearch,
  type Country, type FilterDoctor, type FilterHospital, type FilterState,
} from '../lib/doctor-filters';
import { createCombobox } from './combobox';

const root = document.querySelector<HTMLElement>('[data-doctor-filters]');
if (root) {
  const region = root.dataset.region ?? 'global';
  const hospitals: FilterHospital[] = JSON.parse(root.querySelector('script[data-hospitals]')?.textContent ?? '[]');
  const items = [...root.querySelectorAll<HTMLElement>('[data-doctor-list] > li')];
  const doctors: (FilterDoctor & { el: HTMLElement })[] = items.map((el) => ({
    el,
    slug: el.dataset.slug ?? '',
    name: el.dataset.name ?? '',
    country: el.dataset.country ?? '',
    hospital: el.dataset.hospital ?? '',
    specialties: (el.dataset.specialties ?? '').split(' ').filter(Boolean),
  }));
  // Buttons only: the doctor cards (<li data-country>) carry the same attribute and must not become pills.
  const pills = [...root.querySelectorAll<HTMLButtonElement>('button[data-country]')];
  const nameBox = root.querySelector<HTMLElement>('[data-combobox][data-name="q"]');
  const specialtyBox = root.querySelector<HTMLElement>('[data-combobox][data-name="specialty"]');
  const empty = root.querySelector<HTMLElement>('[data-doctor-empty]');
  const status = root.querySelector<HTMLElement>('[data-doctor-status]');

  // A URL value that matches no option (?specialty=foo) is dropped, and so is one the country does not allow
  // (?country=sa&q=<a UAE doctor>): a link never empties the list without a visible cause. The cleaned URL replaces it.
  const specialties = specialtyBox
    ? [...specialtyBox.querySelectorAll<HTMLElement>('[role="option"]')].map((o) => o.dataset.value ?? '').filter(Boolean)
    : undefined;
  const read = () => prune(parseState(location.search, region, hospitals, specialties), doctors);
  let state: FilterState = read();
  let announce = false; // the first render is the page load, not a change: do not announce it

  const nameCb = nameBox && createCombobox(nameBox, {
    onSelect: (v) => commit(setQuery(state, v)),
    onInput: (text) => commit(setQuery(state, text), 'replace'),
  });
  const specialtyCb = specialtyBox && createCombobox(specialtyBox, { onSelect: (v) => commit(setSpecialty(state, v)) });

  function render() {
    const shown = new Set(applyFilters(doctors, state).map((d) => d.slug));
    for (const d of doctors) d.el.hidden = !shown.has(d.slug);
    for (const p of pills) p.setAttribute('aria-pressed', String(p.dataset.country === state.country));
    // Each dropdown offers only what fits the other filters, so no pick can end in "No doctors match your search".
    nameCb?.setAvailable(nameOptions(doctors, state));
    nameCb?.setValue(state.q);
    specialtyCb?.setAvailable(specialtyOptions(doctors, state));
    specialtyCb?.setValue(state.specialty);
    if (empty) empty.hidden = shown.size > 0;
    if (status && announce) status.textContent = (status.dataset.template ?? '').replace('{n}', String(shown.size));
  }

  function commit(next: FilterState, mode: 'push' | 'replace' = 'push') {
    state = next;
    const search = toSearch(state, region);
    if (search !== location.search) history[mode === 'push' ? 'pushState' : 'replaceState'](null, '', location.pathname + search + location.hash);
    announce = true;
    render();
  }

  for (const p of pills) p.addEventListener('click', () => commit(prune(setCountry(state, p.dataset.country as Country, hospitals), doctors)));
  window.addEventListener('popstate', () => { state = read(); announce = true; render(); });

  // A stale / invalid link is corrected in place (no extra history entry).
  const clean = toSearch(state, region);
  if (clean !== location.search) history.replaceState(null, '', location.pathname + clean + location.hash);
  render();
  root.dataset.ready = ""; // hydrated (QA scripts wait for this)
}
