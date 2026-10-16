import type { ImageMetadata } from "astro";
import manifest from "../data/banner-art.json";
import { img } from "./images";
import type { RegionId } from "./editions";

/**
 * Live-site banner art (components/shared/BannerArt.astro, tools/banners/prepare.py): the people cut-out `<key>-cutout`
 * (hospital pages: the building alone) (regions/<ae|sa>/ first, as img()) and its display size in live px at 1440. null = no
 * live art for this banner (the Our Hospitals map, news post photos): the hero keeps its own layers.
 */
/**
 * Bug 131 (15 Oct 2026): a cut-out whose subject is cut flat by the FILE edge (the live files: a man's back at the right edge of
 * the Insurance photo, the hand on the Media Hub phone, a bed or a table at the left ...) showed that straight edge inside the
 * banner. `bleed: "end"` = the subject's inline-end edge is cut: the people are pushed past the viewport's end edge (so the cut
 * is off screen at every width, like a photo that runs off the page); `fade: "start" | "top" | "start top"` = that edge is cut
 * too but faces the copy (or the banner top), so it is feathered out over ~48 live px. Measured per file by an alpha scan of
 * the outer 2 px of each edge (scratch tools, 15 Oct 2026); assets with transparent edges carry neither key.
 */
export interface BannerArtEntry {
  w: number;
  h: number;
  shape: boolean;
  bleed?: "end";
  fade?: "start" | "top" | "start top";
  /** Bug 146 (15 Oct 2026): the subject holds readable or real-world content (the calculator phone screens, the lungs): in RTL the
   *  composition is mirrored as usual but the subject itself is drawn unflipped (BannerArt `.bn-readable`). */
  readable?: boolean;
  /** Bug 180 (16 Oct 2026): top-left of the outline pill stack in the people box, live px, where the client's 16 Oct composite
   *  draws it (tools/banners/pill_place.py). Absent = pillBox()'s default. */
  pills?: [number, number];
}

export function bannerArt(
  key: string,
  region: RegionId,
): BannerArtEntry & { image: ImageMetadata } | null {
  const m =
    (manifest as Record<string, BannerArtEntry>)[`${region}:${key}`] ??
    (manifest as Record<string, BannerArtEntry>)[`global:${key}`];
  if (!m) return null;
  return { image: img(`${key}-cutout`, region), ...m };
}

/**
 * Bug 180 (16 Oct 2026): the client's banners of 16 Oct (docs/client-assets/website-images-oct16, the same on all three
 * editions) are a light grey vertical gradient, an outline pill stack (assets/banners/pills.svg, PILLS live px) and the people.
 * The gradient, measured down the people-free start side of all 44 files (within 1/255; the files' 685 px frame = the banner
 * height), replaces the live site's white-to-grey `banners/bg.avif`.
 */
export const bannerBgStyle = "background:linear-gradient(#e4e7e9 9%, #dae0e4 27.9%, #c4d0d9 71.8%, #beccd6 84.4%);";

/** The outline pill stack's size in live px (pills.svg = 1540.74 x 1178.6 composite px at 500/1370). */
export const PILLS = { w: 562.31, h: 430.15 };

/** The pill stack's top-left in the people box (live px): the composite's spot, else centred on the people with its bottom 18.6
 *  live px above theirs (the median of the 28 composites drawn at their own size, tools/banners/pill_place.py). */
export const pillBox = (e: BannerArtEntry) =>
  e.pills ? { x: e.pills[0], y: e.pills[1] } : { x: (e.w - PILLS.w) / 2, y: e.h - 18.6 - PILLS.h };

/** Banner stage height in Figma px (--u) for the live 500px banner (Home 550px) at 1440. */
export const bannerH = (home = false) => ((home ? 550 : 500) * 1052) / 1440;
