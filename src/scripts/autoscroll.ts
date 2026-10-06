// Slow, endless auto-scroll for horizontal rows (Home Doctors, Care Support, Testimonials), as on the live site.
// Markup: scroller [data-autoscroll] > row [data-loop-row] > items [data-loop-item]. Items with [hidden] (e.g. a country
// pill's filter) are not part of the loop.
// The row is copied as often as needed to fill the scroller, and the scroller wraps by exactly one period, so the loop is
// seamless in LTR and RTL at every breakpoint. Copies are aria-hidden and out of the tab order (screen readers and the
// keyboard meet each item once) but still take pointer clicks, since a copy is often the card on screen.
// Pauses on hover, focus, touch/drag, wheel, when off screen or the tab is hidden; on resume it continues from wherever
// the visitor (or a script) left the row.
// Events on the scroller: 'autoscroll:refresh' (dispatch after changing which items show) rebuilds the copies;
// 'autoscroll:hold' (dispatch before scrolling the row from script) pauses for RESUME_MS; 'autoscroll:change' is sent
// after every rebuild. The scroller carries [data-looping] while the loop is set up.
// prefers-reduced-motion: nothing runs and the row stays a plain swipe/scroll-snap row.

const SECONDS_PER_ITEM = 8; // pace taken from the live-site recording; tied to the item step so it looks the same at every width
const RESUME_MS = 2500; // after a touch/wheel, wait this long before moving again
const FOCUSABLE = "a[href], button, input, select, textarea, [tabindex]";

function setup(scroller: HTMLElement) {
  const row = scroller.querySelector<HTMLElement>("[data-loop-row]");
  if (!row) return;
  const shown = (el: HTMLElement) =>
    Array.from(el.querySelectorAll<HTMLElement>("[data-loop-item]")).filter(
      (i) => !i.hidden,
    );

  const rtl = getComputedStyle(scroller).direction === "rtl";
  const sign = rtl ? -1 : 1;
  const edge = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return rtl ? -r.right : r.left;
  };

  const copy = () => {
    const c = row.cloneNode(true) as HTMLElement;
    c.removeAttribute("data-loop-row");
    c.setAttribute("aria-hidden", "true");
    c.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
    c.querySelectorAll<HTMLElement>(FOCUSABLE).forEach(
      (el) => (el.tabIndex = -1),
    );
    c.querySelectorAll<HTMLElement>('[style*="scroll-snap-align"]').forEach(
      (el) => (el.style.scrollSnapAlign = "none"),
    );
    c.style.flexShrink = "0";
    return c;
  };

  let copies: HTMLElement[] = [];
  let period = 0;
  let speed = 0; // px per second

  const clear = () => {
    copies.forEach((c) => c.remove());
    copies = [];
    period = 0;
    scroller.style.removeProperty("display");
    scroller.style.removeProperty("scroll-snap-type");
    row.style.removeProperty("flex-shrink");
    delete scroller.dataset.looping;
  };

  // One period = distance from item 1 to its first copy = n × the item step. Each copy is nudged so that holds (the row's
  // own padding would otherwise add to the distance). Enough copies that one period + the visible width is always filled.
  const build = (force = false) => {
    const a = shown(row);
    if (a.length < 2) {
      clear();
      scroller.dispatchEvent(new Event("autoscroll:change"));
      return;
    }
    // Rows sit side by side; snapping would fight the continuous motion, so it is off while auto-scroll is active.
    scroller.style.display = "flex";
    scroller.style.scrollSnapType = "none";
    row.style.flexShrink = "0";
    scroller.dataset.looping = "";
    const step = edge(a[1]) - edge(a[0]);
    const target = step * a.length;
    const need = Math.max(1, Math.ceil(scroller.clientWidth / target));
    if (force || need !== copies.length) {
      copies.forEach((c) => c.remove());
      copies = Array.from({ length: need }, copy);
      row.after(...copies);
    }
    // important: the mobile .t-row margin is !important and would otherwise win
    const nudge = (v: number) =>
      copies.forEach((c) =>
        c.style.setProperty("margin-inline-start", `${v}px`, "important"),
      );
    nudge(0);
    nudge(target - (edge(shown(copies[0])[0]) - edge(a[0])));
    period = target;
    speed = step / SECONDS_PER_ITEM;
    scroller.dispatchEvent(new Event("autoscroll:change"));
  };
  build();

  // Where the row is now, inside one period (the copies make every position past it look the same).
  const read = () => {
    const p = Math.abs(scroller.scrollLeft);
    return period > 0 ? p % period : p;
  };

  let pos = read();
  let last = 0;
  let running = false;
  let hover = false,
    focus = false,
    touch = false,
    visible = false;
  let resumeAt = 0;
  const paused = () =>
    hover ||
    focus ||
    touch ||
    !visible ||
    document.hidden ||
    performance.now() < resumeAt;

  const tick = (t: number) => {
    const run = !paused() && period > 0;
    // Starting or resuming: continue from where the row is (the visitor may have scrolled it meanwhile).
    if (run && (!running || !last)) pos = read();
    const dt = run && running && last ? Math.min(t - last, 64) : 0;
    running = run;
    last = t;
    if (run) {
      pos += (speed * dt) / 1000;
      if (pos >= period) pos -= period;
      scroller.scrollLeft = sign * pos;
    }
    requestAnimationFrame(tick);
  };

  const holdOff = () => {
    resumeAt = performance.now() + RESUME_MS;
  };

  scroller.addEventListener("mouseenter", () => (hover = true));
  scroller.addEventListener("mouseleave", () => (hover = false));
  scroller.addEventListener("focusin", () => (focus = true));
  scroller.addEventListener("focusout", () => (focus = false));
  const press = () => (touch = true);
  const release = () => {
    if (touch) {
      touch = false;
      holdOff();
    }
  };
  scroller.addEventListener("pointerdown", press, { passive: true });
  scroller.addEventListener("touchstart", press, { passive: true });
  scroller.addEventListener("touchend", release, { passive: true });
  window.addEventListener("pointerup", release, { passive: true });
  window.addEventListener("pointercancel", release, { passive: true });
  scroller.addEventListener("wheel", holdOff, { passive: true });
  scroller.addEventListener("autoscroll:hold", holdOff);
  scroller.addEventListener("autoscroll:refresh", () => {
    build(true);
    pos = read();
  });

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
  }).observe(scroller);
  document.addEventListener("visibilitychange", () => {
    last = 0;
  });
  new ResizeObserver(() => {
    build();
    pos = read();
  }).observe(scroller);

  requestAnimationFrame(tick);
}

const motion = matchMedia("(prefers-reduced-motion: no-preference)");
if (motion.matches)
  document.querySelectorAll<HTMLElement>("[data-autoscroll]").forEach(setup);
