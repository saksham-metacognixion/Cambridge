/*
 * Topic tabs of the detail template (WAI-ARIA tabs, vertical): click / Enter / Space selects; Arrow Up/Down (and
 * Left/Right) move focus with automatic activation, Home/End jump to the first / last tab. Roving tabindex.
 */
for (const root of document.querySelectorAll<HTMLElement>(
  "[data-detail-tabs]",
)) {
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const panels = tabs.map((t) =>
    document.getElementById(t.getAttribute("aria-controls") ?? ""),
  );

  const select = (i: number, focus = false) => {
    tabs.forEach((t, k) => {
      const on = k === i;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      if (panels[k]) panels[k]!.hidden = !on;
    });
    if (focus) tabs[i].focus();
  };

  tabs.forEach((t, i) => {
    t.addEventListener("click", () => select(i));
    t.addEventListener("keydown", (e) => {
      const last = tabs.length - 1;
      const next = {
        ArrowDown: i + 1,
        ArrowRight: i + 1,
        ArrowUp: i - 1,
        ArrowLeft: i - 1,
        Home: 0,
        End: last,
      }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      select((next + tabs.length) % tabs.length, true);
    });
  });
}
