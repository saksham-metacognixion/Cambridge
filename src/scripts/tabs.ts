/*
 * WAI-ARIA tabs for any [data-tabs] container (detail-page topics: vertical; Refer a Patient For Doctors / For Others:
 * horizontal). Click / Enter / Space selects; arrow keys move focus with automatic activation (Left/Right mirrored on
 * RTL pages), Home/End jump to the first / last tab. Roving tabindex. Panels = the tabs' aria-controls targets.
 * Optional URL state: data-tabs-param="category" on the container + data-key on each tab -> ?category=<key> (the first
 * tab = no parameter), one history entry per change, back/forward and shared links restore it (FAQ).
 * Selecting keeps the chosen tab where it was on screen: in the accordion layout (< 1024, bug 035) closing a tall panel
 * above the tapped tab would otherwise pull the tab, and the panel opening under it, up and out of view. Measured after the
 * change, so a browser's own scroll anchoring is not corrected twice; a no-op where nothing moves (desktop, horizontal tabs).
 */
for (const root of document.querySelectorAll<HTMLElement>('[data-tabs]')) {
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls') ?? ''));
  const rtl = getComputedStyle(root).direction === 'rtl';

  const param = root.dataset.tabsParam;
  const fromUrl = () => {
    const k = param ? new URLSearchParams(location.search).get(param) : null;
    const i = tabs.findIndex((t) => t.dataset.key === k);
    return i < 0 ? 0 : i;
  };
  const push = (i: number) => {
    if (!param) return;
    const q = new URLSearchParams(location.search);
    if (i === 0) q.delete(param);
    else q.set(param, tabs[i].dataset.key ?? '');
    const search = q.toString() ? `?${q}` : '';
    if (search !== location.search) history.pushState(null, '', location.pathname + search + location.hash);
  };

  const select = (i: number, focus = false) => {
    const was = tabs[i].getBoundingClientRect().top;
    tabs.forEach((t, k) => {
      const on = k === i;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (panels[k]) panels[k]!.hidden = !on;
    });
    const moved = tabs[i].getBoundingClientRect().top - was;
    if (Math.abs(moved) >= 1) window.scrollBy({ top: moved, behavior: 'instant' as ScrollBehavior });
    if (focus) tabs[i].focus();
  };

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => { select(i); push(i); });
    t.addEventListener('keydown', (e) => {
      const fwd = rtl ? 'ArrowLeft' : 'ArrowRight';
      const back = rtl ? 'ArrowRight' : 'ArrowLeft';
      const keys: Record<string, number> = { ArrowDown: i + 1, [fwd]: i + 1, ArrowUp: i - 1, [back]: i - 1, Home: 0, End: tabs.length - 1 };
      const next = keys[e.key];
      if (next === undefined) return;
      e.preventDefault();
      const n = (next + tabs.length) % tabs.length;
      select(n, true);
      push(n);
    });
  });
  if (param) {
    window.addEventListener('popstate', () => select(fromUrl()));
    if (fromUrl() !== 0) select(fromUrl());
  }
}
