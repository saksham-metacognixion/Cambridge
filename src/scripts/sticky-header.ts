// Sticky header state (AN1, animation audit 9 Oct 2026): the header sticks via CSS (Header.astro .hd); this marks it .is-stuck
// once it has reached its sticky offset (the live Blocksy data-sticky="yes" state: the row's shadow appears over .2s) and keeps
// html's scroll-padding-top equal to the stuck height, so hash targets land below the bar (Blocksy --scroll-margin-top-offset).
const hd = document.querySelector<HTMLElement>("[data-sticky-header]");
if (hd) {
  let raf = 0;
  const update = () => {
    raf = 0;
    const top = parseFloat(getComputedStyle(hd).top) || 0; // 0, or the negative top-row offset on desktop
    const stuck = window.scrollY > 0 && hd.getBoundingClientRect().top <= top + 0.5;
    hd.classList.toggle("is-stuck", stuck);
    document.documentElement.style.scrollPaddingTop = `${Math.max(0, Math.round(hd.offsetHeight + top))}px`;
  };
  const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule);
  update();
}
