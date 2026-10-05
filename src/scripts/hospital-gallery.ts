/*
 * Hospital photo gallery (Figma 112:7721 "A Healing Environment"): the centred photo is active, its neighbours sit behind it.
 * Figma draws no arrows or dots, so the photos are the controls: click / tap a side photo, Left / Right (mirrored on RTL),
 * Home / End on the focused photo, or swipe. The area dropdown shows another set (text + photos). State is per area;
 * positions are written as data-pos (0 active, ±1 neighbours, ±2 far, 9 hidden) and the CSS places them.
 */
const mod = (a: number, b: number) => ((a % b) + b) % b;

for (const root of document.querySelectorAll<HTMLElement>("[data-gallery]")) {
  const select = root.querySelector<HTMLSelectElement>("[data-gallery-select]");
  const areas = [...root.querySelectorAll<HTMLElement>("[data-gallery-area]")];
  const rtl = document.documentElement.dir === "rtl";

  for (const area of areas) {
    const list = area.querySelector<HTMLElement>("[data-slides]");
    if (!list) continue;
    const slides = [...list.querySelectorAll<HTMLElement>("[data-slide]")];
    const status = area.querySelector<HTMLElement>("[data-gallery-status]");
    const len = slides.length;
    let active = Number(list.dataset.active ?? 0) || 0;

    const render = (announce: boolean) => {
      slides.forEach((s, i) => {
        const d = mod(i - active, len);
        const pos =
          d === 0
            ? 0
            : d === 1
              ? 1
              : d === 2 && len > 3
                ? 2
                : d === len - 1
                  ? -1
                  : d === len - 2 && len > 4
                    ? -2
                    : 9;
        s.dataset.pos = String(pos);
        const b = s.querySelector<HTMLButtonElement>("button");
        if (b) {
          b.tabIndex = i === active ? 0 : -1;
          if (i === active) b.setAttribute("aria-current", "true");
          else b.removeAttribute("aria-current");
        }
      });
      list.dataset.active = String(active);
      if (status && announce)
        status.textContent = (status.dataset.template ?? "")
          .replace("{n}", String(active + 1))
          .replace("{total}", String(len));
    };
    const go = (i: number, focus = false) => {
      active = mod(i, len);
      render(true);
      if (focus)
        slides[active]
          .querySelector<HTMLElement>("button")
          ?.focus({ preventScroll: true });
    };

    slides.forEach((s, i) =>
      s.querySelector("button")?.addEventListener("click", () => {
        if (i !== active) go(i);
      }),
    );
    list.addEventListener("keydown", (e) => {
      const k = e.key;
      const next =
        (k === "ArrowRight") !== rtl ? 1 : (k === "ArrowLeft") !== rtl ? -1 : 0;
      if (k === "ArrowRight" || k === "ArrowLeft") {
        e.preventDefault();
        go(active + next, true);
      } else if (k === "Home") {
        e.preventDefault();
        go(0, true);
      } else if (k === "End") {
        e.preventDefault();
        go(len - 1, true);
      }
    });
    // Swipe (pointer events, horizontal only; vertical scrolling stays native thanks to touch-action: pan-y).
    let x0: number | null = null;
    list.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse") x0 = e.clientX;
    });
    list.addEventListener("pointerup", (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      x0 = null;
      if (Math.abs(dx) < 40) return;
      go(active + (dx < 0 !== rtl ? 1 : -1));
    });
    list.addEventListener("pointercancel", () => {
      x0 = null;
    });
    render(false);
  }

  select?.addEventListener("change", () => {
    for (const a of areas) a.hidden = a.dataset.galleryArea !== select.value;
  });
}
