/**
 * THE ONE PLACE for the Figma -> page scale.
 * The Figma frame is 1052px wide; the page is built at 1440px.
 * BaseLayout injects these two numbers as CSS variables (--design-w, --target-w) and
 * global.css derives the unit `--u` (= 1 Figma px) from them. Change TARGET_W here to rescale everything.
 */
export const DESIGN_W = 1052;
export const TARGET_W = 1440;
/**
 * Width at which the design STOPS scaling up (CSS --max-w). 1440 since bug 089 (13 Oct 2026, client: the site looked oversized
 * on laptops / large monitors, the Home hero filled 85 % of a 1920x1080 screen): above 1440 text, buttons and heroes keep their
 * 1440 size, the content stays centred, and section backgrounds, hero bands (.hero-bleed) and overflowing rows (--gutter) still
 * run to both screen edges. 0 = never stop (10-13 Oct 2026, R073: the whole layout grew with the screen). Image `sizes` for
 * scaled artwork use vwSizes() so the browser fetches the right candidate.
 */
export const MAX_W = 1440;
/** The CSS value for --max-w: a huge number means "no cap". */
export const MAX_W_CSS = MAX_W || 100000;
/** 1 Figma px in CSS px at the target width (~1.3688). Use for build-time maths such as image widths. */
export const U = TARGET_W / DESIGN_W;
/** Rendered pixel size of a Figma length at the target width, rounded (for <Image width>). */
export const px = (figmaPx: number) => Math.round(figmaPx * U);
/** `sizes` for an image that is figmaPx wide in the design: from 1024px up to MAX_W the layout scales with the page width (--u =
 *  100cqw / DESIGN_W), so the rendered width is figmaPx / DESIGN_W of the viewport; above MAX_W it stays at the capped size; below
 *  1024px the fixed-unit size (px()) applies. */
export const vwSizes = (figmaPx: number, phone?: string) =>
  `${MAX_W ? `(min-width: ${MAX_W}px) ${Math.round((figmaPx * MAX_W) / DESIGN_W)}px, ` : ''}(min-width: 1024px) ${((figmaPx / DESIGN_W) * 100).toFixed(2)}vw, ${phone ?? `${px(figmaPx)}px`}`;
