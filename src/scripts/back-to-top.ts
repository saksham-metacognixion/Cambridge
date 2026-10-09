// "Go to top" (AN1, animation audit 9 Oct 2026) = the live Blocksy back-to-top: shown (fade + 15px rise, .3s ease, CSS .to-top
// in global.css) once the page is scrolled past 100px, hidden again at the top; a click scrolls smoothly to the top (instant
// with prefers-reduced-motion). The live threshold is Blocksy's default (its chunk is not in the saved pages): 100px assumed.
const btn = document.querySelector<HTMLElement>("[data-to-top]");
if (btn) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  let raf = 0;
  const update = () => { raf = 0; btn.classList.toggle("is-shown", window.scrollY > 100); };
  addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduce.matches ? "auto" : "smooth" }));
  update();
}
