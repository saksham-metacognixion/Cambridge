import type { ImageMetadata } from "astro";
import manifest from "../data/banner-art.json";
import bg from "../assets/banners/bg.avif";
import { hasImage, img } from "./images";
import type { RegionId } from "./editions";

/**
 * Live-site banner art (components/shared/BannerArt.astro, tools/banners/prepare.py): the people cut-out `<key>-cutout`
 * (hospital pages: the building alone, its pill outlines in `<key>-pills.svg`)
 * (regions/<ae|sa>/ first, as img()) and its display size in live px at 1440. null = no live art for this banner (the
 * Our Hospitals map, news post photos): the hero keeps its own layers.
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
}

export function bannerArt(
  key: string,
  region: RegionId,
): BannerArtEntry & { image: ImageMetadata; pills: ImageMetadata | null } | null {
  const m =
    (manifest as Record<string, BannerArtEntry>)[`${region}:${key}`] ??
    (manifest as Record<string, BannerArtEntry>)[`global:${key}`];
  if (!m) return null;
  // Hospital pages: the pill outlines are a separate SVG drawn behind the building (tools/banners/split_pills.py)
  const pills = hasImage(`${key}-pills`) ? img(`${key}-pills`) : null;
  return { image: img(`${key}-cutout`, region), pills, ...m };
}

/** The live banners' shared gradient (identical file on all three editions), as the host section's CSS background. */
export const bannerBgStyle = `background:url('${bg.src}') center / cover no-repeat;`;

/** Banner stage height in Figma px (--u) for the live 500px banner (Home 550px) at 1440. */
export const bannerH = (home = false) => ((home ? 550 : 500) * 1052) / 1440;
