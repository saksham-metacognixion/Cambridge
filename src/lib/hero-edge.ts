import type { ImageMetadata } from "astro";
import sharp from "sharp";

/*
 * Bug 086, screens wider than 1440 (styles/global.css .hero-bleed): the bands either side of the hero stage continue the
 * banner's outermost pixel column to the viewport edge. Was a background-image stretched to 200000 % (one column shown),
 * which some engines refuse or tile differently (Safari / Firefox raster limits). Now the column itself is turned into a
 * vertical linear-gradient at build time: the same pixels, no extra download, rendered identically in every engine.
 *
 * The column is read from the source file at full resolution and simplified (Ramer-Douglas-Peucker on RGBA against y) to the
 * fewest stops that stay within TOL of every pixel; the sharp pill edges keep two close stops, smooth gradients keep a few.
 * Only `fsPath` of the ImageMetadata is read (does not copy the original into dist, see lib/images.ts).
 */
const TOL = 1.5; // max channel deviation (0-255) between the gradient and the real column
const cache = new Map<string, Promise<{ start: string; end: string }>>();

type Px = [number, number, number, number];

function simplify(col: Px[]): number[] {
  const keep = new Set([0, col.length - 1]);
  const stack: [number, number][] = [[0, col.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    let worst = -1,
      at = -1;
    for (let i = a + 1; i < b; i++) {
      const t = (i - a) / (b - a);
      const d = Math.max(
        ...col[i].map((v, c) =>
          Math.abs(v - (col[a][c] + (col[b][c] - col[a][c]) * t)),
        ),
      );
      if (d > worst) {
        worst = d;
        at = i;
      }
    }
    if (worst > TOL) {
      keep.add(at);
      stack.push([a, at], [at, b]);
    }
  }
  return [...keep].sort((x, y) => x - y);
}

function gradient(col: Px[]): string {
  const n = col.length;
  // pixel i covers [i, i+1) / n: place its colour at its centre so the gradient lines up with the image's own sampling
  const stops = simplify(col).map((i) => {
    const [r, g, b, a] = col[i];
    const c =
      a === 255
        ? `rgb(${r} ${g} ${b})`
        : `rgb(${r} ${g} ${b} / ${(a / 255).toFixed(3)})`;
    return `${c} ${(((i + 0.5) / n) * 100).toFixed(3)}%`;
  });
  return `linear-gradient(${stops.join(",")})`;
}

async function read(path: string) {
  const { data, info } = await sharp(path)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const column = (x: number): Px[] =>
    Array.from({ length: info.height }, (_, y) => {
      const i = (y * info.width + x) * 4;
      return [data[i], data[i + 1], data[i + 2], data[i + 3]];
    });
  return { start: gradient(column(0)), end: gradient(column(info.width - 1)) };
}

/** CSS gradients of the image's left (`start`) and right (`end`) pixel columns, top to bottom. */
export function heroEdge(
  image: ImageMetadata,
): Promise<{ start: string; end: string }> {
  const path = (image as ImageMetadata & { fsPath?: string }).fsPath;
  if (!path)
    throw new Error(
      "heroEdge: image has no fsPath (pass an imported raster image)",
    );
  let p = cache.get(path);
  if (!p) cache.set(path, (p = read(path)));
  return p;
}

/** Style vars for a .hero-bleed section: --hero-edge-start / --hero-edge-end. */
export async function heroEdgeVars(
  image: ImageMetadata,
  prefix = "hero-edge",
): Promise<string> {
  const g = await heroEdge(image);
  return `--${prefix}-start:${g.start};--${prefix}-end:${g.end};`;
}
