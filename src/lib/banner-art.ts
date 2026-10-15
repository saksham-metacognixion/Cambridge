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
export function bannerArt(
  key: string,
  region: RegionId,
): { image: ImageMetadata; pills: ImageMetadata | null; w: number; h: number; shape: boolean } | null {
  const m =
    (manifest as Record<string, { w: number; h: number; shape: boolean }>)[
      `${region}:${key}`
    ] ??
    (manifest as Record<string, { w: number; h: number; shape: boolean }>)[
      `global:${key}`
    ];
  if (!m) return null;
  // Hospital pages: the pill outlines are a separate SVG drawn behind the building (tools/banners/split_pills.py)
  const pills = hasImage(`${key}-pills`) ? img(`${key}-pills`) : null;
  return { image: img(`${key}-cutout`, region), pills, ...m };
}

/** The live banners' shared gradient (identical file on all three editions), as the host section's CSS background. */
export const bannerBgStyle = `background:url('${bg.src}') center / cover no-repeat;`;

/** Banner stage height in Figma px (--u) for the live 500px banner (Home 550px) at 1440. */
export const bannerH = (home = false) => ((home ? 550 : 500) * 1052) / 1440;
