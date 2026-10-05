/* About "Journey of Excellence": the two Figma arrows scroll the scroll-snap row by one card. */
document.querySelectorAll<HTMLElement>('[data-timeline]').forEach((root) => {
  const row = root.querySelector<HTMLElement>('[data-timeline-row]');
  if (!row) return;
  const step = () => (row.querySelector<HTMLElement>('[data-timeline-card]')?.getBoundingClientRect().width ?? 200) + 15;
  const rtl = getComputedStyle(row).direction === 'rtl';
  root.querySelectorAll<HTMLButtonElement>('[data-timeline-dir]').forEach((b) => {
    b.addEventListener('click', () => {
      const dir = Number(b.dataset.timelineDir) * (rtl ? -1 : 1);
      row.scrollBy({ left: dir * step(), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
  });
});
