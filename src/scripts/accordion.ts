// Accordion over native <details class="qa"> items (FAQ page, article FAQ block). The <details> of one group share a name
// attribute, so the browser closes the open one when another opens (bug 025); without JS that is the whole behaviour.
// With JS the open / close is animated like the live Greenshift accordion (animation audit, saved live FAQs page 9 Oct 2026:
// answer max-height 0 -> 5000px and opacity 0 -> 1 over .25s ease-out, the chevron turning over .3s): the script takes over
// the exclusivity (the name attribute is dropped, since the browser would close the other item at once), keeps `open` until
// the collapse has run, and sets .is-open a frame after opening so the transition has a start state. Off with
// prefers-reduced-motion (plain toggle).
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const MS = 260;
const closers = new WeakMap<HTMLDetailsElement, number>();
const collapse = (d: HTMLDetailsElement) => {
  d.classList.remove('is-open');
  if (reduce) { d.open = false; return; }
  closers.set(d, window.setTimeout(() => { if (!d.classList.contains('is-open')) d.open = false; closers.delete(d); }, MS));
};
const expand = (d: HTMLDetailsElement) => {
  window.clearTimeout(closers.get(d));
  d.open = true;
  if (reduce) { d.classList.add('is-open'); return; }
  requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add('is-open')));
};
document.querySelectorAll<HTMLDetailsElement>('details.qa').forEach((d) => {
  const group = d.getAttribute('name') ?? '';
  d.removeAttribute('name');
  d.dataset.group = group;
  d.querySelector('summary')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (d.classList.contains('is-open')) collapse(d);
    else {
      document.querySelectorAll<HTMLDetailsElement>(`details.qa.is-open[data-group="${group}"]`).forEach((o) => { if (o !== d) collapse(o); });
      expand(d);
    }
  });
});
