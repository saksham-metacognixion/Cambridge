/*
 * Mouse drag for every horizontal row (.hscroll: Home Doctors, Care Support, Testimonials, About timeline, Media Hub rows),
 * as on the live site's timeline (user request 7 Oct 2026): open hand over a row that overflows, press and drag to move it.
 * Touch and trackpads keep the native swipe / scroll (smoothest there); this only adds the mouse.
 *   - The row follows the pointer 1:1, written once per frame. Positions are kept as "distance from the start edge" (abs),
 *     so LTR and RTL share the code (scrollLeft runs negative in RTL).
 *   - Release, measured on the live-site recording: the row keeps the throw speed and slows down evenly (~0.4 s), then
 *     settles on the nearest card, easing back if it went past it. Done with a critically damped spring that starts at the
 *     release speed, so there is no jump in speed at any point. Rows that snap (and looping rows) land on a card; other rows
 *     coast to a stop. prefers-reduced-motion: no coasting, the row lands at once.
 *   - A looping row (src/scripts/autoscroll.ts, [data-loop-period]) wraps by one period, so it can be dragged either way
 *     without hitting an end. Auto-scroll pauses on pointerdown and eases back in a little after release.
 *   - A drag (more than THRESHOLD px) swallows the click that follows, so a card link or button is not opened by accident;
 *     a plain click still works. Native image / link dragging is off inside the rows.
 * Styles: .hscroll[data-drag-scroll] / .is-dragging in src/styles/global.css.
 */

const THRESHOLD = 5; // px of movement before a press becomes a drag
const THROW_MS = 220; // how far a throw carries: release speed (px/ms) x this
const OMEGA = 11; // spring stiffness (rad/s): settles in ~0.45 s
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function setup(row: HTMLElement) {
  const sign = () => (getComputedStyle(row).direction === "rtl" ? -1 : 1);
  const max = () => row.scrollWidth - row.clientWidth;
  const period = () => Number(row.dataset.loopPeriod) || 0;

  // Grab cursor only when there is something to drag.
  const mark = () => row.toggleAttribute("data-drag-scroll", max() > 1);
  new ResizeObserver(mark).observe(row);
  mark();

  // Show position `abs`: a looping row stays inside its first period (every position past it looks the same), any other
  // row is clamped. Returns where it ended up.
  const put = (abs: number) => {
    const p = period();
    if (p > 0) {
      abs %= p;
      if (abs < 0) abs += p;
    } else abs = Math.min(Math.max(abs, 0), max());
    row.scrollLeft = abs * sign();
    return abs;
  };
  const now = () => row.scrollLeft * sign();

  // Card positions (abs) a throw can land on: the snap-aligned children / grandchildren of a row that snaps, or every
  // item (copies included) of a looping row. null = the row neither snaps nor loops: it just coasts.
  const cardStops = (): number[] | null => {
    const cs = getComputedStyle(row);
    const looping = period() > 0;
    if (!looping && !snaps) return null;
    const r = row.getBoundingClientRect();
    const rtl = cs.direction === "rtl";
    const pad =
      parseFloat(rtl ? cs.scrollPaddingRight : cs.scrollPaddingLeft) || 0;
    const at = now();
    const els = looping
      ? row.querySelectorAll<HTMLElement>("[data-loop-item]")
      : row.querySelectorAll<HTMLElement>(":scope > *, :scope > * > *");
    const stops = looping ? [] : [0, max()];
    for (const el of els) {
      if (el.hidden) continue;
      if (!looping && getComputedStyle(el).scrollSnapAlign.includes("none"))
        continue;
      const e = el.getBoundingClientRect();
      if (!e.width) continue;
      const d = rtl ? r.right - pad - e.right : e.left - (r.left + pad);
      const p = at + d;
      if (looping) stops.push(p - period(), p, p + period());
      else stops.push(Math.min(Math.max(p, 0), max()));
    }
    return stops.length ? stops : null;
  };

  let id: number | null = null;
  let x0 = 0;
  let origin = 0; // abs position at the press, moved along when a looping row wraps
  let want = 0;
  let dragging = false;
  let samples: { x: number; t: number }[] = [];
  let frame = 0;
  let snaps = false; // read at the press: during the drag .is-dragging turns snapping off

  const stopAnim = () => cancelAnimationFrame(frame);

  row.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || max() <= 1) return;
    if (
      (e.target as Element).closest(
        "input, select, textarea, [contenteditable]",
      )
    )
      return;
    stopAnim();
    id = e.pointerId;
    x0 = e.clientX;
    origin = want = now();
    if (!row.classList.contains("is-dragging")) {
      const t = getComputedStyle(row).scrollSnapType;
      snaps = !!t && t !== "none";
    }
    dragging = false;
    samples = [{ x: e.clientX, t: e.timeStamp }];
  });

  const render = () => {
    frame = 0;
    const shown = put(want);
    origin += shown - want; // a wrap moves the origin with it
    want = shown;
  };

  row.addEventListener("pointermove", (e) => {
    if (e.pointerId !== id) return;
    const dx = e.clientX - x0;
    if (!dragging) {
      if (Math.abs(dx) < THRESHOLD) return;
      dragging = true;
      row.setPointerCapture(e.pointerId);
      row.classList.add("is-dragging");
      getSelection()?.removeAllRanges();
    }
    want = origin - dx * sign();
    if (!frame) frame = requestAnimationFrame(render);
    samples.push({ x: e.clientX, t: e.timeStamp });
    if (samples.length > 8) samples.shift();
  });

  const release = (e: PointerEvent) => {
    if (e.pointerId !== id) return;
    id = null;
    if (!dragging) return;
    dragging = false;
    stopAnim();
    render();
    // Swallow the click this release produces (if any).
    const stop = (ev: Event) => {
      ev.preventDefault();
      ev.stopPropagation();
    };
    window.addEventListener("click", stop, { capture: true, once: true });
    setTimeout(() => window.removeEventListener("click", stop, true), 0);

    // Release speed (abs px per ms) over the last ~80 ms; 0 if the pointer rested before letting go.
    const last = samples[samples.length - 1];
    const first = samples.find((s) => last.t - s.t <= 80) ?? last;
    const idle = e.timeStamp - last.t > 60;
    const v =
      !idle && last.t > first.t
        ? (-(last.x - first.x) / (last.t - first.t)) * sign()
        : 0;

    const from = now();
    const aim = from + v * THROW_MS;
    const stops = cardStops();
    let target = stops
      ? stops.reduce((a, b) => (Math.abs(b - aim) < Math.abs(a - aim) ? b : a))
      : aim;
    if (period() <= 0) target = Math.min(Math.max(target, 0), max());

    const done = () => row.classList.remove("is-dragging");
    if (reduced() || (Math.abs(target - from) < 0.5 && Math.abs(v) < 0.02)) {
      put(target);
      done();
      return;
    }
    // Critically damped spring from `from` (speed v) to `target`: x(t) = (a + b t) e^(-wt), no speed jump at release.
    const a = from - target;
    const b = v * 1000 + OMEGA * a; // v in px/s
    const t0 = performance.now();
    let base = target; // follows the wraps of a looping row
    const step = (t: number) => {
      const s = (t - t0) / 1000;
      const k = Math.exp(-OMEGA * s);
      const x = (a + b * s) * k;
      const speed = (b - OMEGA * (a + b * s)) * k;
      const shown = put(base + x);
      base += shown - (base + x);
      if (Math.abs(x) < 0.3 && Math.abs(speed) < 6) {
        put(base);
        done();
        frame = 0;
        return;
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
  };
  row.addEventListener("pointerup", release);
  row.addEventListener("pointercancel", release);
  row.addEventListener("lostpointercapture", (e) => {
    if (dragging) release(e);
  });
  // The visitor takes over (wheel / trackpad / touch): stop the throw where it is.
  const takeOver = () => {
    if (!frame || dragging) return;
    stopAnim();
    frame = 0;
    row.classList.remove("is-dragging");
  };
  row.addEventListener("wheel", takeOver, { passive: true });
  row.addEventListener("touchstart", takeOver, { passive: true });
  // Native drag of images and links would take the gesture over.
  row.addEventListener("dragstart", (e) => e.preventDefault());
}

document.querySelectorAll<HTMLElement>(".hscroll").forEach(setup);
