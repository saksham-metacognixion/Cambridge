// Careers "no openings" panel (bug 088 reopened, 13 Oct 2026): a link with data-no-openings="<panel id>" becomes a toggle
// button for that panel instead of navigating (its href stays as the no-JS fallback). Every button that controls the same
// panel shows the same aria-expanded. Space activates it like a native button.
const buttons = [...document.querySelectorAll<HTMLAnchorElement>('a[data-no-openings]')];
const sync = (id: string, open: boolean) =>
  buttons.filter((b) => b.dataset.noOpenings === id).forEach((b) => b.setAttribute('aria-expanded', String(open)));
for (const b of buttons) {
  const id = b.dataset.noOpenings!;
  const panel = document.getElementById(id);
  if (!panel) continue;
  b.setAttribute('role', 'button');
  b.setAttribute('aria-controls', id);
  b.setAttribute('aria-expanded', 'false');
  const toggle = (e: Event) => { e.preventDefault(); panel.hidden = !panel.hidden; sync(id, !panel.hidden); };
  b.addEventListener('click', toggle);
  b.addEventListener('keydown', (e) => { if (e.key === ' ') toggle(e); });
}
