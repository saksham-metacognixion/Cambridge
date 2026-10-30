/**
 * Desktop columns (>= 1024px) of a Figma card row: card / gap / card / gap ... in Figma units, with only as many card tracks as
 * there are cards (at most four, the Figma row). Bug 179 (16 Oct 2026, hospital pages + Our Care: components/hospital/CareCards.astro)
 * and bug 199 (16 Oct 2026, Home Services: components/sections/Services.astro): KSA has three services, and a fixed seven-track grid
 * left an empty fourth slot at the end of the row. A row with fewer than four cards is centred by its component (`few`).
 * @param count number of cards
 * @param w card width in Figma px
 * @param xs Figma x of the four card columns (the gaps between them are kept as they are)
 */
export function cardColumns(count: number, w: number, xs: number[]): { cols: string; few: boolean } {
  const n = Math.min(count, 4);
  const tracks = [w, xs[1] - xs[0] - w, w, xs[2] - xs[1] - w, w, xs[3] - xs[2] - w, w].slice(0, Math.max(1, 2 * n - 1));
  return { cols: tracks.map((v) => `calc(${v} * var(--u))`).join(' '), few: n < 4 };
}
