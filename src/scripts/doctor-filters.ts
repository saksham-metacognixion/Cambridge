/*
 * Find a Doctor filter island (scope 2.6). The list is already in the HTML; this only shows/hides cards.
 * State lives in the URL (?country=&hospital=&specialty=&q=): every change pushes a history entry, back/forward restore it.
 * Logic (and its tests): src/lib/doctor-filters.ts.
 */
import {
  applyFilters, parseState, setCountry, setQuery, setSpecialty, toSearch,
  type Country, type FilterDoctor, type FilterHospital, type FilterState,
} from '../lib/doctor-filters';

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
  const nameInput = root.querySelector<HTMLInputElement>('input[name="q"]');
  const specialtySelect = root.querySelector<HTMLSelectElement>('select[name="specialty"]');
  const empty = root.querySelector<HTMLElement>('[data-doctor-empty]');
  const status = root.querySelector<HTMLElement>('[data-doctor-status]');

  // A URL value that matches no option (?specialty=foo) is dropped, so a bad link never empties the list without a visible cause.
  const specialties = specialtySelect ? [...specialtySelect.options].map((o) => o.value).filter(Boolean) : undefined;
  const read = () => parseState(location.search, region, hospitals, specialties);
  let state: FilterState = read();
  let announce = false; // the first render is the page load, not a change: do not announce it

  function render() {
    const shown = new Set(applyFilters(doctors, state).map((d) => d.slug));
    for (const d of doctors) d.el.hidden = !shown.has(d.slug);
    for (const p of pills) p.setAttribute('aria-pressed', String(p.dataset.country === state.country));
    if (nameInput && nameInput.value.trim() !== state.q) nameInput.value = state.q;
    if (specialtySelect && specialtySelect.value !== state.specialty) specialtySelect.value = state.specialty;
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

  for (const p of pills) p.addEventListener('click', () => commit(setCountry(state, p.dataset.country as Country, hospitals)));
  specialtySelect?.addEventListener('change', () => commit(setSpecialty(state, specialtySelect.value)));
  nameInput?.addEventListener('input', () => commit(setQuery(state, nameInput.value), 'replace'));
  window.addEventListener('popstate', () => { state = read(); announce = true; render(); });

  render();
}
