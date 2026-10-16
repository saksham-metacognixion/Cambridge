/*
 * Mouse drag for every horizontal row (.hscroll: Home Doctors, Care Support, Testimonials, About timeline, Media Hub rows),
 * as on the live site's timeline (user request 7 Oct 2026): open hand over a row that overflows, press and drag to move it.
 * Touch and trackpads keep the native swipe / scroll (smoothest there); this only adds the mouse.
 *   - The row follows the pointer 1:1, written once per frame. Positions are kept as "distance from the start edge" (abs),
 *     so LTR and RTL share the code (scrollLeft runs negative in RTL).
 *   - Release: no throw and no coasting (all animations removed, 16 Oct 2026). Rows that snap (and looping rows) land on the
 *     nearest card at once; other rows stay where the pointer let go.
 *   - A looping row ([data-loop-period], the About timeline) wraps by one period, so it can be dragged either way without
 *     hitting an end.
 *   - A drag (more than THRESHOLD px) swallows the click that follows, so a card link or button is not opened by accident;
 *     a plain click still works. Native image / link dragging is off inside the rows.
 * Styles: .hscroll[data-drag-scroll] / .is-dragging in src/styles/global.css.
 */

const THRESHOLD = 5; // px of movement before a press becomes a drag

function setup(row: HTMLElement) {
  const sign = () => (getComputedStyle(row).direction === "rtl" ? -1 : 1);
  const max = () => row.scrollWidth - row.clientWidth;
  const period = () => Number(row.dataset.loopPeriod) || 0;

  // Grab cursor only when there is something to drag.
  const mark = () => row.toggleAttribute("data-drag-scroll", max() > 1);
  new ResizeObserver(mark).observe(row);
  mark();

  // Show position `abs`: a looping row stays inside its first period (every position past it looks the same), any other
  // row is clamped. A row with a lead ([data-loop-lead]) stays inside [lead, lead + period) once past it. Returns where it
  // ended up.
  const put = (abs: number) => {
    const p = period();
    if (p > 0) {
      const lead = Number(row.dataset.loopLead) || 0;
      if (abs < 0 || abs >= lead + p)
        abs = lead + ((((abs - lead) % p) + p) % p);
    } else abs = Math.min(Math.max(abs, 0), max());
    row.scrollLeft = abs * sign();
    return abs;
  };
  const now = () => row.scrollLeft * sign();

  // Card positions (abs) a release can land on: the snap-aligned children / grandchildren of a row that snaps, or every
  // item (copies included) of a looping row. null = the row neither snaps nor loops: it stays where it is.
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
  let frame = 0;
  let snaps = false; // read at the press: during the drag .is-dragging turns snapping off

  row.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || max() <= 1) return;
    if (
      (e.target as Element).closest(
        "input, select, textarea, [contenteditable]",
      )
    )
      return;
    cancelAnimationFrame(frame);
    frame = 0;
    id = e.pointerId;
    x0 = e.clientX;
    origin = want = now();
    if (!row.classList.contains("is-dragging")) {
      const t = getComputedStyle(row).scrollSnapType;
      snaps = !!t && t !== "none";
    }
    dragging = false;
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
  });

  const release = (e: PointerEvent) => {
    if (e.pointerId !== id) return;
    id = null;
    if (!dragging) return;
    dragging = false;
    cancelAnimationFrame(frame);
    render();
    // Swallow the click this release produces (if any).
    const stop = (ev: Event) => {
      ev.preventDefault();
      ev.stopPropagation();
    };
    window.addEventListener("click", stop, { capture: true, once: true });
    setTimeout(() => window.removeEventListener("click", stop, true), 0);

    // Land on the nearest card at once (snapping / looping rows); other rows stay put.
    const from = now();
    const stops = cardStops();
    let target = stops
      ? stops.reduce((a, b) =>
          Math.abs(b - from) < Math.abs(a - from) ? b : a,
        )
      : from;
    if (period() <= 0) target = Math.min(Math.max(target, 0), max());
    put(target);
    row.classList.remove("is-dragging");
  };
  row.addEventListener("pointerup", release);
  row.addEventListener("pointercancel", release);
  row.addEventListener("lostpointercapture", (e) => {
    if (dragging) release(e);
  });
  // Native drag of images and links would take the gesture over.
  row.addEventListener("dragstart", (e) => e.preventDefault());
}

document.querySelectorAll<HTMLElement>(".hscroll").forEach(setup);
