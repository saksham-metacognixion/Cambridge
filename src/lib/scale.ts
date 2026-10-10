/**
 * THE ONE PLACE for the Figma -> page scale.
 * The Figma frame is 1052px wide; the page is built at 1440px.
 * BaseLayout injects these two numbers as CSS variables (--design-w, --target-w) and
 * global.css derives the unit `--u` (= 1 Figma px) from them. Change TARGET_W here to rescale everything.
 */
export const DESIGN_W = 1052;
export const TARGET_W = 1440;
/**
 * Width at which the design STOPS scaling up (CSS --max-w). 0 = never: above 1440 the whole layout keeps growing with the
 * screen, so a 1920 / 2560 monitor shows the design filling the screen with no side margins (user decision, 10 Oct 2026,
 * responsive audit). Set e.g. 1920 to cap the scale there and centre the page with margins beyond it (the pre-10-Oct
 * behaviour was a 1440 cap). Image `sizes` for scaled artwork use vwSizes() so the browser fetches the right candidate.
 */
export const MAX_W = 0;
/** The CSS value for --max-w: a huge number means "no cap". */
export const MAX_W_CSS = MAX_W || 100000;
/** 1 Figma px in CSS px at the target width (~1.3688). Use for build-time maths such as image widths. */
export const U = TARGET_W / DESIGN_W;
/** Rendered pixel size of a Figma length at the target width, rounded (for <Image width>). */
export const px = (figmaPx: number) => Math.round(figmaPx * U);
/** `sizes` for an image that is figmaPx wide in the design: above 1024px the layout scales with the page width (--u = 100cqw /
 *  DESIGN_W), so the rendered width is figmaPx / DESIGN_W of the viewport; below 1024px the fixed-unit size (px()) applies. */
export const vwSizes = (figmaPx: number, phone?: string) => `(min-width: 1024px) ${((figmaPx / DESIGN_W) * 100).toFixed(2)}vw, ${phone ?? `${px(figmaPx)}px`}`;
