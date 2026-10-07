// Slow, endless auto-scroll for horizontal rows (Home Doctors, Care Support, Testimonials), as on the live site.
// Markup: scroller [data-autoscroll] > row [data-loop-row] > items [data-loop-item]. Items with [hidden] (e.g. a country
// pill's filter) are not part of the loop.
// The row is copied as often as needed to fill the scroller, and the scroller wraps by exactly one period, so the loop is
// seamless in LTR and RTL at every breakpoint. Copies are aria-hidden and out of the tab order (screen readers and the
// keyboard meet each item once) but still take pointer clicks, since a copy is often the card on screen.
// Eases to a stop on hover / focus, stops at once on touch/drag, wheel, when off screen or the tab is hidden; on resume it continues from wherever
// the visitor (or a script) left the row.
// Events on the scroller: 'autoscroll:refresh' (dispatch after changing which items show) rebuilds the copies;
// 'autoscroll:hold' (dispatch before scrolling the row from script) pauses for RESUME_MS; 'autoscroll:change' is sent
// after every rebuild. The scroller carries [data-looping] while the loop is set up.
// prefers-reduced-motion: nothing runs and the row stays a plain swipe/scroll-snap row.
// [data-autoscroll="step"] (Our Care doctors, the live page's Greenshift Swiper: autoplay delay 1000, speed 1000, loop,
// pauseOnMouseEnter): instead of gliding, the row waits STEP_DELAY_MS, then slides one item in STEP_MS with Swiper's CSS
// `ease`, and so on. Hover / focus let the slide in progress finish and hold the next one; touch, drag and wheel stop it at
// once, and the next slide lands on the next item boundary.

const SECONDS_PER_ITEM = 8; // pace taken from the live-site recording; tied to the item step so it looks the same at every width
const RESUME_MS = 2500; // after a touch/wheel, wait this long before moving again
const EASE_MS = 450; // time constant of the pace easing in / out (hover, resume)
const STEP_DELAY_MS = 1000; // Swiper autoplay delay (data-autodelay)
const STEP_MS = 1000; // Swiper speed (data-speed)
const FOCUSABLE = "a[href], button, input, select, textarea, [tabindex]";

// CSS `ease` = cubic-bezier(0.25, 0.1, 0.25, 1) (Swiper's wrapper transition): solve x(s) = p, return y(s).
function ease(p: number) {
  const bez = (s: number, a: number, b: number) =>
    3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
  const dBez = (s: number, a: number, b: number) =>
    3 * a * (1 - s) ** 2 + 6 * (b - a) * s * (1 - s) + 3 * (1 - b) * s * s;
  let s = p;
  for (let i = 0; i < 8; i++)
    s = Math.min(
      1,
      Math.max(0, s - (bez(s, 0.25, 0.25) - p) / (dBez(s, 0.25, 0.25) || 1)),
    );
  return bez(s, 0.1, 1);
}

function setup(scroller: HTMLElement) {
  const stepMode = scroller.dataset.autoscroll === "step";
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
  let stepPx = 0; // item step (step mode)

  const clear = () => {
    copies.forEach((c) => c.remove());
    copies = [];
    period = 0;
    scroller.style.removeProperty("display");
    scroller.style.removeProperty("scroll-snap-type");
    row.style.removeProperty("flex-shrink");
    delete scroller.dataset.looping;
    delete scroller.dataset.loopPeriod;
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
    scroller.dataset.loopPeriod = String(period); // read by src/scripts/drag-scroll.ts to wrap a mouse drag
    speed = step / SECONDS_PER_ITEM;
    stepPx = step;
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

  // The pace eases in and out (EASE_MS) on hover / resume, so the row never starts or stops dead; a press, wheel or script
  // scroll (autoscroll:hold) stops it at once so nothing fights the visitor.
  let vel = 0; // px per second, now
  // Step mode: a slide from `from` over `stepPx`, started at `s0` (0 = none); the next one may start at `nextAt`.
  let from = 0,
    s0 = 0,
    nextAt = 0;
  const stepTick = (t: number) => {
    if (!last || (!s0 && !running)) pos = read();
    last = t;
    if (touch || !visible || document.hidden || period <= 0) s0 = 0;
    if (s0) {
      const p = Math.min(1, (t - s0) / STEP_MS);
      pos = from + stepPx * ease(p);
      if (p >= 1) {
        s0 = 0;
        nextAt = t + STEP_DELAY_MS;
      }
    } else if (paused() || period <= 0) {
      nextAt = t + STEP_DELAY_MS;
    } else if (t >= nextAt) {
      // next item boundary (the visitor may have left the row between two items)
      from = Math.floor(pos / stepPx + 0.02) * stepPx;
      s0 = t;
    }
    running = !!s0;
    if (running) {
      if (pos >= period) {
        pos -= period;
        from -= period;
      }
      scroller.scrollLeft = sign * pos;
    }
    requestAnimationFrame(stepTick);
  };
  const tick = (t: number) => {
    const target = !paused() && period > 0 ? speed : 0;
    const dt = last ? Math.min(t - last, 64) : 0;
    // First frame after a stop (or a hidden tab): continue from where the row is (the visitor may have moved it).
    if (!last || !running) pos = read();
    last = t;
    if (touch || !visible || document.hidden || period <= 0) vel = 0;
    else vel += (target - vel) * (1 - Math.exp(-dt / EASE_MS));
    if (vel < 0.5 && target === 0) vel = 0;
    running = vel > 0;
    if (running) {
      pos += (vel * dt) / 1000;
      if (pos >= period) pos -= period;
      scroller.scrollLeft = sign * pos;
    }
    requestAnimationFrame(tick);
  };

  const holdOff = () => {
    resumeAt = performance.now() + RESUME_MS;
    vel = 0;
    s0 = 0;
    running = false;
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

  requestAnimationFrame(stepMode ? stepTick : tick);
}

const motion = matchMedia("(prefers-reduced-motion: no-preference)");
if (motion.matches)
  document.querySelectorAll<HTMLElement>("[data-autoscroll]").forEach(setup);
