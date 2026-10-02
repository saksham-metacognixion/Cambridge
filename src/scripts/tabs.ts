/*
 * WAI-ARIA tabs for any [data-tabs] container (detail-page topics: vertical; Refer a Patient For Doctors / For Others:
 * horizontal). Click / Enter / Space selects; arrow keys move focus with automatic activation (Left/Right mirrored on
 * RTL pages), Home/End jump to the first / last tab. Roving tabindex. Panels = the tabs' aria-controls targets.
 */
for (const root of document.querySelectorAll<HTMLElement>('[data-tabs]')) {
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls') ?? ''));
  const rtl = getComputedStyle(root).direction === 'rtl';

  const select = (i: number, focus = false) => {
    tabs.forEach((t, k) => {
      const on = k === i;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (panels[k]) panels[k]!.hidden = !on;
    });
    if (focus) tabs[i].focus();
  };

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i));
    t.addEventListener('keydown', (e) => {
      const fwd = rtl ? 'ArrowLeft' : 'ArrowRight';
      const back = rtl ? 'ArrowRight' : 'ArrowLeft';
      const keys: Record<string, number> = { ArrowDown: i + 1, [fwd]: i + 1, ArrowUp: i - 1, [back]: i - 1, Home: 0, End: tabs.length - 1 };
      const next = keys[e.key];
      if (next === undefined) return;
      e.preventDefault();
      select((next + tabs.length) % tabs.length, true);
    });
  });
}
