// Home hospital map (sections/Facilities.astro, bug 133 + the client's reference `cambridge-locations-2.html`, 15 Oct 2026).
// - `.in` once 25 % of the section is in view, once (the CSS draws the map outline, drops the pins, fades the labels and
//   counters in); the six counters on the map then count 0 -> value as in the reference: 2 s each, ease-out cubic, starting
//   1.7 s + 0.12 s per counter after the entrance. Reduced motion / no IntersectionObserver (html.aos absent): no motion,
//   the counters keep their final text.
// - A pin's card opens on hover (mouse: pointerenter, closes 260 ms after the pointer leaves the pin AND the card), on tap
//   (touch: toggles; a tap outside closes), on keyboard focus / Enter / Space (Escape closes and focuses the pin). One card
//   at a time; aria-expanded mirrors the open state; data-active on the spot drives the pin's hover look.
// - Before a card shows it is placed like the reference: centred on the pin, 16 px above it when there is room (inside the
//   viewport and the section), else 16 px under it (.below), kept 8 px inside the map's width (a card wider than the map
//   overflows it evenly); --ax = the arrow's x on the pin's axis. Cards are absolutely positioned, so nothing in the page moves.

const motion = document.documentElement.classList.contains("aos");
const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);

for (const root of document.querySelectorAll<HTMLElement>("[data-hospital-map]")) {
  const mapin = root.querySelector<HTMLElement>("[data-mapin]") ?? root;

  /* ---- counters ---- */
  const counters = [...root.querySelectorAll<HTMLElement>("[data-hm-count]")].flatMap((el) => {
    const text = el.textContent ?? "";
    const m = text.match(/^(\D*)([\d,]+)(.*)$/);
    if (!m) return [];
    const [, pre, num, post] = m;
    const value = Number(num.replace(/,/g, ""));
    const grouped = num.includes(",");
    const fmt = (n: number) => pre + (grouped ? Math.round(n).toLocaleString("en-US") : String(Math.round(n))) + post;
    return [{ el, set: (p: number) => (el.textContent = fmt(value * p)), done: () => (el.textContent = text) }];
  });
  if (motion) counters.forEach((c) => c.set(0));
  const runCounters = () => {
    if (!motion) return;
    counters.forEach((c, i) => {
      setTimeout(() => {
        const t0 = performance.now();
        const tick = (now: number) => {
          const k = Math.min((now - t0) / 2000, 1);
          if (k < 1) {
            c.set(easeOut(k));
            requestAnimationFrame(tick);
          } else c.done();
        };
        requestAnimationFrame(tick);
      }, 1700 + i * 120);
    });
  };

  /* ---- entrance ---- */
  const enter = () => {
    root.classList.add("in");
    runCounters();
  };
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          enter();
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(root);
  } else enter();

  /* ---- pin cards ---- */
  // (the section's top / bottom are read at placement time, so the card follows the layout at any width)
  type Spot = { s: HTMLElement; pin: HTMLButtonElement; shape: Element; card: HTMLElement };
  const spots: Spot[] = [...root.querySelectorAll<HTMLElement>("[data-spot]")].flatMap((s) => {
    const pin = s.querySelector<HTMLButtonElement>(".pin");
    const shape = s.querySelector(".shape");
    const card = s.querySelector<HTMLElement>(".hcard");
    return pin && shape && card ? [{ s, pin, shape, card }] : [];
  });
  let hideTimer: ReturnType<typeof setTimeout> | undefined;
  let current: Spot | null = null;
  let lastPointer = "";
  let refocusing = false; // Escape moves focus back to the pin: that focus must not reopen the card

  const place = (p: Spot) => {
    const wr = mapin.getBoundingClientRect();
    const sr = p.s.getBoundingClientRect();
    const r = p.shape.getBoundingClientRect();
    const sec = root.getBoundingClientRect();
    const cx = r.left + r.width / 2 - wr.left;
    const top = r.top - wr.top;
    const bottom = r.bottom - wr.top;
    const cw = p.card.offsetWidth;
    const ch = p.card.offsetHeight;
    // reference clamp: 8 px inside the map (a wider card overflows it evenly); then never outside the viewport's 16 px gutters
    let left = Math.min(Math.max(cx - cw / 2, 8 - Math.max(0, (cw - wr.width) / 2)), Math.max(8, wr.width - cw - 8));
    left = Math.max(16 - wr.left, Math.min(left, innerWidth - 16 - wr.left - cw));
    // above the pin (reference: while the card stays inside the viewport), and inside the section
    const above = r.top - ch - 16 > Math.max(0, sec.top);
    // the card is a child of its spot: convert the map-relative position to spot-relative
    p.card.style.left = `${left - (sr.left - wr.left)}px`;
    p.card.style.top = `${(above ? top - ch - 16 : bottom + 16) - (sr.top - wr.top)}px`;
    p.card.style.setProperty("--ax", `${Math.min(Math.max(cx - left, 18), cw - 18)}px`);
    p.card.classList.toggle("below", !above);
  };
  const deactivate = (p: Spot) => {
    p.card.classList.remove("show");
    p.s.removeAttribute("data-active");
    p.pin.setAttribute("aria-expanded", "false");
  };
  const show = (p: Spot) => {
    clearTimeout(hideTimer);
    if (current && current !== p) deactivate(current);
    current = p;
    p.s.setAttribute("data-active", "");
    p.pin.setAttribute("aria-expanded", "true");
    place(p);
    p.card.classList.add("show");
  };
  const hide = () => {
    clearTimeout(hideTimer);
    if (current) deactivate(current);
    current = null;
  };
  const hideSoon = () => {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, 260);
  };
  const isOpen = (p: Spot) => current === p && p.card.classList.contains("show");
  const nearest = (x: number, y: number, fallback: Spot) => {
    let best = fallback;
    let d0 = Infinity;
    for (const q of spots) {
      const r = q.shape.getBoundingClientRect();
      const d = Math.hypot(r.left + r.width / 2 - x, r.top + r.height * 0.4 - y); // the head's centre
      if (d < d0) {
        d0 = d;
        best = q;
      }
    }
    return best;
  };

  for (const p of spots) {
    p.pin.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "touch") show(p);
    });
    p.pin.addEventListener("pointerleave", (e) => {
      if (e.pointerType !== "touch") hideSoon();
    });
    p.pin.addEventListener("pointerdown", (e) => {
      lastPointer = e.pointerType;
    });
    // click: touch / keyboard toggle; a mouse click keeps the hovered card open (hover already showed it). A tap goes to the
    // pin whose head is nearest the finger: the 44px touch layers of the close pairs (Abu Dhabi / Al Ain, Dhahran / Al Khobar)
    // overlap on phones, and the later pin in the DOM would otherwise take a tap on its neighbour's head.
    p.pin.addEventListener("click", (e) => {
      const mouse = lastPointer === "mouse";
      lastPointer = "";
      const q = e.detail ? nearest(e.clientX, e.clientY, p) : p;
      if (!mouse && isOpen(q)) hide();
      else show(q);
    });
    p.pin.addEventListener("focus", () => {
      if (!refocusing && p.pin.matches(":focus-visible")) show(p);
    });
    p.pin.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        show(p);
      }
    });
    p.card.addEventListener("pointerenter", () => clearTimeout(hideTimer));
    p.card.addEventListener("pointerleave", (e) => {
      if (e.pointerType !== "touch") hideSoon();
    });
    // keyboard: focus leaving the pin and its card closes the card
    p.s.addEventListener("focusout", (e) => {
      const to = e.relatedTarget as Node | null;
      if (to && !p.s.contains(to) && isOpen(p)) hide();
    });
  }
  document.addEventListener("click", (e) => {
    // a click outside every pin and card closes (a tap on a neighbouring pin's touch layer may have opened the nearest pin)
    if (current && !(e.target as Element).closest?.("[data-spot]")) hide();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !current) return;
    const p = current;
    hide();
    if (p.s.contains(document.activeElement)) {
      refocusing = true;
      p.pin.focus();
      refocusing = false;
    }
  });
  window.addEventListener("resize", () => current && place(current));
}
