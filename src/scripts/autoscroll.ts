// Slow, endless auto-scroll for horizontal rows (Testimonials, Care Support), as on the live site.
// Markup: scroller [data-autoscroll] > row [data-loop-row] > items [data-loop-item].
// The row is cloned once (aria-hidden + inert, so screen readers and keyboard see each item once) and the
// scroller wraps by exactly one period, so the loop is seamless in LTR and RTL at every breakpoint.
// Pauses on hover, focus, touch/drag, wheel, when off screen or the tab is hidden.
// prefers-reduced-motion: nothing runs and the row stays a plain swipe/scroll-snap row.

const SECONDS_PER_ITEM = 8; // pace taken from the live-site recording; tied to the item step so it looks the same at every width
const RESUME_MS = 2500; // after a touch/wheel, wait this long before moving again

function setup(scroller: HTMLElement) {
  const row = scroller.querySelector<HTMLElement>("[data-loop-row]");
  if (!row) return;
  const items = () =>
    Array.from(row.querySelectorAll<HTMLElement>("[data-loop-item]"));
  if (items().length < 2) return;

  const clone = row.cloneNode(true) as HTMLElement;
  clone.removeAttribute("data-loop-row");
  clone.setAttribute("aria-hidden", "true");
  clone.inert = true;
  clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
  clone
    .querySelectorAll('[style*="scroll-snap-align"]')
    .forEach((el) => ((el as HTMLElement).style.scrollSnapAlign = "none"));
  row.after(clone);

  // Rows sit side by side; snapping would fight the continuous motion, so it is off while auto-scroll is active.
  scroller.style.display = "flex";
  scroller.style.scrollSnapType = "none";
  row.style.flexShrink = "0";
  clone.style.flexShrink = "0";
  clone.style.setProperty("margin-inline-start", "0px", "important");

  const rtl = getComputedStyle(scroller).direction === "rtl";
  const sign = rtl ? -1 : 1;
  const edge = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return rtl ? -r.right : r.left;
  };

  let period = 0;
  let speed = 0; // px per second
  // One period = distance from item 1 to its copy. The clone is nudged so that distance is n × the item step.
  const measure = () => {
    clone.style.setProperty("margin-inline-start", "0px", "important");
    const a = items();
    const b = Array.from(
      clone.querySelectorAll<HTMLElement>("[data-loop-item]"),
    );
    const step = edge(a[1]) - edge(a[0]);
    const target = step * a.length;
    const gap = target - (edge(b[0]) - edge(a[0]));
    // important: the mobile .t-row margin is !important and would otherwise win
    clone.style.setProperty("margin-inline-start", `${gap}px`, "important");
    period = target;
    speed = step / SECONDS_PER_ITEM;
  };
  measure();

  let pos = Math.abs(scroller.scrollLeft);
  let last = 0;
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
    const dt = last ? Math.min(t - last, 64) : 0;
    last = t;
    if (!paused() && period > 0) {
      pos += (speed * dt) / 1000;
      if (pos >= period) pos -= period;
      scroller.scrollLeft = sign * pos;
    }
    raf = requestAnimationFrame(tick);
  };
  let raf = 0;

  // Re-read the position after the visitor moved the row, and keep it inside one period.
  const sync = () => {
    pos = Math.abs(scroller.scrollLeft);
    if (period > 0 && pos >= period) {
      pos -= period;
      scroller.scrollLeft = sign * pos;
    }
  };
  const holdOff = () => {
    resumeAt = performance.now() + RESUME_MS;
  };

  scroller.addEventListener("mouseenter", () => {
    hover = true;
  });
  scroller.addEventListener("mouseleave", () => {
    hover = false;
    sync();
  });
  scroller.addEventListener("focusin", () => {
    focus = true;
  });
  scroller.addEventListener("focusout", () => {
    focus = false;
    sync();
  });
  scroller.addEventListener(
    "pointerdown",
    () => {
      touch = true;
    },
    { passive: true },
  );
  const release = () => {
    if (touch) {
      touch = false;
      sync();
      holdOff();
    }
  };
  window.addEventListener("pointerup", release, { passive: true });
  window.addEventListener("pointercancel", release, { passive: true });
  scroller.addEventListener(
    "touchstart",
    () => {
      touch = true;
    },
    { passive: true },
  );
  scroller.addEventListener("touchend", release, { passive: true });
  scroller.addEventListener(
    "wheel",
    () => {
      holdOff();
      requestAnimationFrame(sync);
    },
    { passive: true },
  );
  scroller.addEventListener("scrollend", () => {
    if (paused()) sync();
  });

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    last = 0;
  }).observe(scroller);
  document.addEventListener("visibilitychange", () => {
    last = 0;
  });
  new ResizeObserver(() => {
    measure();
    sync();
  }).observe(row);

  raf = requestAnimationFrame(tick);
}

const motion = matchMedia("(prefers-reduced-motion: no-preference)");
if (motion.matches)
  document.querySelectorAll<HTMLElement>("[data-autoscroll]").forEach(setup);
