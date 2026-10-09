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
// [data-autoscroll="step"] = the live site's Greenshift Swiper autoplay (animation audit 8 Oct 2026, WordPress export): the row
// waits `data-autoscroll-delay` ms (Swiper autoplay.delay, default 1000), then slides one item in `data-autoscroll-speed` ms
// (Swiper speed, default 1000) with the wrapper's CSS `ease`, and so on. A delay of 0 (Care Support 12 s, Testimonials 15 s
// per item on the live Home page) is the continuous marquee: one eased slide straight after the other, never a stop.
// `data-autoscroll-pause="no"` = the live `disablepause` (Swiper pauseOnMouseEnter off): the mouse does not pause it
// (keyboard focus still does, so the focused card stays in view). `data-autoscroll-restore="no"` = Swiper's default
// disableOnInteraction (no `autoplayrestore`): after a touch, drag or wheel the row stays where the visitor left it for good;
// with restore (default) it moves on again RESUME_MS later. Hover / focus let the slide in progress finish and hold the next
// one; touch, drag and wheel stop it at once, and the next slide lands on the next item boundary.
// Live rows: Home doctors + Our Care / Refer doctors = step 1000 / 1000, no restore; Care Support = step 0 / 12000, no hover
// pause, restore; Testimonials = step 0 / 15000, no hover pause, restore; Media Hub Latest keeps the glide (R061, client).

const SECONDS_PER_ITEM = 8; // glide pace (Media Hub Latest, R061); tied to the item step so it looks the same at every width
const RESUME_MS = 2500; // after a touch/wheel, wait this long before moving again (restore rows)
const EASE_MS = 450; // time constant of the pace easing in / out (hover, resume)
const STEP_DELAY_MS = 1000; // Swiper autoplay delay (data-autodelay) unless data-autoscroll-delay says otherwise
const STEP_MS = 1000; // Swiper speed (data-speed) unless data-autoscroll-speed says otherwise
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
  const num = (v: string | undefined, d: number) => (v !== undefined && v !== "" && !isNaN(+v) ? +v : d);
  const stepDelay = num(scroller.dataset.autoscrollDelay, STEP_DELAY_MS);
  const stepMs = num(scroller.dataset.autoscrollSpeed, STEP_MS);
  const pauseOnHover = scroller.dataset.autoscrollPause !== "no";
  const restore = scroller.dataset.autoscrollRestore !== "no";
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
  let stopped = false; // restore="no": a touch / drag / wheel ends the autoplay for good (Swiper disableOnInteraction)
  const paused = () =>
    stopped ||
    (hover && pauseOnHover) ||
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
    dist = 0,
    s0 = 0,
    nextAt = 0;
  // The frame loop sleeps while the row is off screen or the tab is hidden (no idle rAF work); IO / visibilitychange wake it.
  let sleeping = false;
  const frame = (fn: FrameRequestCallback) => {
    if (!visible || document.hidden) {
      sleeping = true;
      last = 0;
      return;
    }
    requestAnimationFrame(fn);
  };
  const wake = () => {
    if (!sleeping || !visible || document.hidden) return;
    sleeping = false;
    requestAnimationFrame(stepMode ? stepTick : tick);
  };
  const stepTick = (t: number) => {
    if (!last || (!s0 && !running)) pos = read();
    last = t;
    if (touch || !visible || document.hidden || period <= 0) s0 = 0;
    if (s0) {
      const p = Math.min(1, (t - s0) / stepMs);
      pos = from + dist * ease(p);
      if (p >= 1) {
        s0 = 0;
        nextAt = t + stepDelay;
      }
    } else if (paused() || period <= 0) {
      nextAt = t + stepDelay;
    } else if (t >= nextAt) {
      // Slide on to the next item boundary. From a boundary that is one item; from mid-item (an interrupted slide, or the
      // visitor left the row between two items) it is the rest of the way, never a jump back to the previous boundary.
      const next = Math.ceil(pos / stepPx - 0.02) * stepPx;
      from = pos;
      dist = next - pos > 1 ? next - pos : stepPx;
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
    frame(stepTick);
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
    frame(tick);
  };

  // `moved` = the visitor dragged / swiped the row (Swiper's sliderFirstMove): on a no-restore row that ends the autoplay for
  // good. A tap or click, a wheel over the row or a script hold (dot click, pill change) only holds it, as before.
  const holdOff = (moved = false) => {
    resumeAt = performance.now() + RESUME_MS;
    if (!restore && moved) stopped = true;
    vel = 0;
    s0 = 0;
    running = false;
  };

  scroller.addEventListener("mouseenter", () => (hover = true));
  scroller.addEventListener("mouseleave", () => (hover = false));
  scroller.addEventListener("focusin", () => (focus = true));
  scroller.addEventListener("focusout", () => (focus = false));
  let pressPos = 0;
  const press = () => {
    if (!touch) pressPos = scroller.scrollLeft;
    touch = true;
  };
  const release = () => {
    if (touch) {
      touch = false;
      holdOff(Math.abs(scroller.scrollLeft - pressPos) > 1);
    }
  };
  scroller.addEventListener("pointerdown", press, { passive: true });
  scroller.addEventListener("touchstart", press, { passive: true });
  scroller.addEventListener("touchend", release, { passive: true });
  window.addEventListener("pointerup", release, { passive: true });
  window.addEventListener("pointercancel", release, { passive: true });
  scroller.addEventListener("wheel", () => holdOff(), { passive: true });
  scroller.addEventListener("autoscroll:hold", () => holdOff());
  scroller.addEventListener("autoscroll:refresh", () => {
    build(true);
    pos = read();
  });

  // The LAST entry is the current state: one callback can carry several (e.g. a #hash jump and a rebuild of the copies in
  // the same frame), and reading the first one left the loop asleep on a stale "not intersecting" (bug 064).
  new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1].isIntersecting;
    wake();
  }).observe(scroller);
  document.addEventListener("visibilitychange", () => {
    last = 0;
    wake();
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
