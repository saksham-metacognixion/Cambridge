// Hero cursor-follow: the live site's `gs-prlx-mouse data-prlx-xy="14"` (Greenshift gsap-mousemove-init.js), the same block
// on every live page hero (48 pages in the WordPress export, Home included, and the Our Hospitals map). Animation audit
// against the live About page, 7 Oct 2026:
// - listens on the whole page (body), not only the hero, and never springs back (no `data-prlx-rest`);
// - x = (clientX / body width - 0.5) * 14, y = (clientY / body height - 0.5) * 14 px (the body height is the whole
//   document, so y stays a few px above rest with a small range, exactly as live);
// - every mousemove starts gsap.to(…) = 0.5 s, Power1.easeOut (quad out) from where the layer is now.
// Only the layer(s) move: `[data-hero-follow]` is the clipping box, `[data-hero-subject]` the people layer (`<key>-subject`,
// made by tools/hero-layers) over the static `<key>-bg` layer, so the gradient and pills never move. A hero without layers
// has no `data-hero-follow` and stays still. `data-hero-follow="map"` (Our Hospitals): every `[data-hero-subject]` of the
// section (the banner's baked-in map layer and HeroMap's vector overlay) moves together.
// Mouse/trackpad only and not with prefers-reduced-motion; touch devices keep the static image.

const XY = 14; // data-prlx-xy
const DUR = 500; // gsap.to default duration (ms)

const box = document.querySelector<HTMLElement>("[data-hero-follow]");
const ok = matchMedia(
  "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
);

if (box && ok.matches) {
  const hero = box.closest("section") ?? box;
  const subjects =
    box.dataset.heroFollow === "map"
      ? [...hero.querySelectorAll<HTMLElement>("[data-hero-subject]")]
      : [
          box.querySelector<HTMLElement>("[data-hero-subject]") ??
            box.querySelector("img"),
        ].filter((e): e is HTMLElement => !!e);
  if (subjects.length) {
    let x = 0,
      y = 0; // current offset (px)
    let fx = 0,
      fy = 0,
      tx = 0,
      ty = 0,
      t0 = 0; // tween: from, to, start time
    let raf = 0;
    for (const s of subjects) s.style.willChange = "transform";
    // RTL: the box is mirrored (`rtl:-scale-x-100` on it, Hero / PageHero / ContactHero / FeedbackHero), which flips the img's
    // own x axis; reverse x so the layer still moves with the cursor on screen. Read from the box's transform, not the
    // direction: banners with readable content (PageHero keepComposition / mirror=false, the map) are not flipped in RTL.
    const cs = getComputedStyle(box);
    const flipped =
      new DOMMatrix(cs.transform).a < 0 !== parseFloat(cs.scale) < 0; // Tailwind's scale-x-* sets `scale`, not `transform`
    const dir = flipped ? -1 : 1;

    const frame = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - t0) / DUR));
      const e = 1 - (1 - p) * (1 - p); // Power1.easeOut
      x = fx + (tx - fx) * e;
      y = fy + (ty - fy) * e;
      const tf = `translate3d(${(dir * x).toFixed(3)}px,${y.toFixed(3)}px,0)`;
      for (const s of subjects) s.style.transform = tf;
      raf = p < 1 ? requestAnimationFrame(frame) : 0;
    };

    document.addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerType !== "mouse") return;
        const b = document.body;
        fx = x;
        fy = y;
        tx = (e.clientX / b.offsetWidth - 0.5) * XY;
        ty = (e.clientY / b.offsetHeight - 0.5) * XY;
        // Start on the frame clock (GSAP's ticker time), not performance.now(): rAF timestamps are the frame's start, earlier
        // than the event, so a clock read here made the next frame (and, with the mouse moving, every frame) stall at p = 0.
        t0 = Number(document.timeline?.currentTime ?? performance.now());
        if (!raf) raf = requestAnimationFrame(frame);
      },
      { passive: true },
    );
  }
}
