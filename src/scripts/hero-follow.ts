// Hero: the mother and baby follow the cursor horizontally, as on the live site (cursor left -> they drift
// left, cursor right -> right; back to centre when the cursor leaves the hero). The background and pills stay.
// Eased every frame so the motion glides. Layers: hero/banner3-subject (moves) over hero/banner3-bg (static).
// Mouse/trackpad only and not with prefers-reduced-motion; touch devices keep the static image.

const SHIFT = 0.01; // max drift each way, as a share of the hero width (~14px at 1440)
const EASE = 0.08; // share of the remaining distance covered per frame (at 60fps)

const box = document.querySelector<HTMLElement>('[data-hero-follow]');
const img = box?.querySelector('img');
const ok = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');

if (box && img && ok.matches) {
  const hero = box.closest('section') ?? box;
  let target = 0; // -1 (cursor at left edge) .. 1 (right edge)
  let x = 0;
  let raf = 0;
  let last = 0;
  img.style.willChange = 'transform';

  const frame = (t: number) => {
    const k = 1 - Math.pow(1 - EASE, last ? (t - last) / (1000 / 60) : 1); // same feel at 60/120Hz
    last = t;
    x += (target - x) * k;
    img.style.transform = `translate3d(${(x * box.clientWidth * SHIFT).toFixed(2)}px,0,0)`;
    if (Math.abs(target - x) > 0.001) raf = requestAnimationFrame(frame);
    else { raf = 0; last = 0; }
  };
  const go = () => { if (!raf) raf = requestAnimationFrame(frame); };

  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = hero.getBoundingClientRect();
    target = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
    go();
  });
  hero.addEventListener('pointerleave', () => { target = 0; go(); });
}
