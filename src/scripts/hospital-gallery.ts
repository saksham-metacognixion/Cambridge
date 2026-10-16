/*
 * Hospital photo gallery (Figma 112:7721 "A Healing Environment"): the centred photo is active, its neighbours sit behind it.
 * Controls: the photos (click / tap a side photo, Left / Right (mirrored on RTL), Home / End on the focused photo, or swipe)
 * and the shared pagination dots under the gallery (src/scripts/pagination.ts; one dot per photo of the shown area, the
 * active photo marked, a dot click shows that photo; hidden with a single photo). The area dropdown shows another set
 * (text + photos). State is per area; positions are written as data-pos (0 active, ±1 neighbours, ±2 far, 9 hidden) and
 * the CSS places them.
 * Autoplay (animation audit, saved live hospital page 9 Oct 2026: Greenshift Swiper autoplay delay 8000, speed 800,
 * pauseOnMouseEnter, disableOnInteraction): the shown area moves to the next photo every 8 s; the mouse over the photos
 * holds it; a swipe / drag ends it for good; a click, key or dot only restarts the 8 s. Off with prefers-reduced-motion.
 */
import { createPagination, type Pagination } from "./pagination";

const mod = (a: number, b: number) => ((a % b) + b) % b;

for (const root of document.querySelectorAll<HTMLElement>("[data-gallery]")) {
  const select = root.querySelector<HTMLSelectElement>("[data-gallery-select]");
  const areas = [...root.querySelectorAll<HTMLElement>("[data-gallery-area]")];
  const nav = root.querySelector<HTMLElement>("[data-pagination]");
  const rtl = document.documentElement.dir === "rtl";

  // The shown area's slide state, for the dots.
  type State = { len: number; active: () => number; go: (i: number) => void };
  const states = new Map<HTMLElement, State>();
  const shown = (): State | undefined =>
    states.get(areas.find((a) => !a.hidden) ?? areas[0]);
  let pg: Pagination | undefined;
  const AUTO_MS = 8000;
  const auto = matchMedia("(prefers-reduced-motion: no-preference)").matches;
  let timer = 0;
  let hover = false;
  let stopped = false;
  const arm = () => {
    window.clearTimeout(timer);
    if (!auto || stopped) return;
    timer = window.setTimeout(() => {
      if (!hover && !document.hidden) shown()?.go((shown()?.active() ?? 0) + 1);
      arm();
    }, AUTO_MS);
  };

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
      if (!area.hidden) pg?.mark();
    };
    const go = (i: number, focus = false) => {
      active = mod(i, len);
      render(true);
      arm();
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
    // Swipe (pointer events, horizontal only; vertical scrolling stays native thanks to touch-action: pan-y). The mouse
    // swipes too (press and drag, src/scripts/drag-scroll.ts is the row equivalent); the click that ends a mouse swipe is
    // swallowed so it does not also pick the photo under the pointer.
    let x0: number | null = null;
    list.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button === 0) x0 = e.clientX;
    });
    list.addEventListener("pointerup", (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      x0 = null;
      if (Math.abs(dx) < 40) return;
      stopped = true; // a swipe / drag ends the autoplay (Swiper disableOnInteraction)
      if (e.pointerType === "mouse") {
        const stop = (ev: Event) => {
          ev.preventDefault();
          ev.stopPropagation();
        };
        window.addEventListener("click", stop, { capture: true, once: true });
        setTimeout(() => window.removeEventListener("click", stop, true), 0);
      }
      go(active + (dx < 0 !== rtl ? 1 : -1));
    });
    list.addEventListener("pointercancel", () => {
      x0 = null;
    });
    list.addEventListener("dragstart", (e) => e.preventDefault());
    list.addEventListener("mouseenter", () => (hover = true));
    list.addEventListener("mouseleave", () => (hover = false));
    states.set(area, { len, active: () => active, go: (i) => go(i) });
    render(false);
  }

  if (nav)
    pg = createPagination(nav, {
      count: () => shown()?.len ?? 0,
      current: () => shown()?.active() ?? 0,
      go: (i) => shown()?.go(i),
    });

  select?.addEventListener("change", () => {
    for (const a of areas) a.hidden = a.dataset.galleryArea !== select.value;
    pg?.update();
    arm();
  });
  document.addEventListener("visibilitychange", arm);
  if (states.size) arm();
}
