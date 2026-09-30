/**
 * THE ONE PLACE for the Figma -> page scale.
 * The Figma frame is 1052px wide; the page is built at 1440px.
 * BaseLayout injects these two numbers as CSS variables (--design-w, --target-w) and
 * global.css derives the unit `--u` (= 1 Figma px) from them. Change TARGET_W here to rescale everything.
 */
export const DESIGN_W = 1052;
export const TARGET_W = 1440;
/** 1 Figma px in CSS px at the target width (~1.3688). Use for build-time maths such as image widths. */
export const U = TARGET_W / DESIGN_W;
/** Rendered pixel size of a Figma length at the target width, rounded (for <Image width>). */
export const px = (figmaPx: number) => Math.round(figmaPx * U);
