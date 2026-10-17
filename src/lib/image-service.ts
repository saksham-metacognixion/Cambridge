import sharpService from "astro/assets/services/sharp";
import type { LocalImageService } from "astro";

/**
 * Bug 190 (16 Oct 2026): every photo was encoded at sharp's default AVIF quality 50 (no quality set anywhere): soft faces and
 * smeared fabric patterns. This is Astro's sharp service with a default `quality` for the lossy formats, written into each
 * image's options (not only the encoder config) so it is part of Astro's cache key and file name: a cached q50 file can never be
 * served again, locally or from a host's build cache. A `quality` prop on a <Picture> / <Image> still wins. PNG is left alone
 * (sharp's png quality turns on palette quantisation). The 4:4:4 chroma for AVIF is set in astro.config.mjs (image.service.config).
 */
const DEFAULT_QUALITY: Record<string, number> = {
  avif: 80,
  webp: 85,
  jpeg: 85,
  jpg: 85,
};

const service: LocalImageService = {
  ...(sharpService as LocalImageService),
  async validateOptions(options, imageConfig) {
    const o = await (sharpService as LocalImageService).validateOptions!(
      options,
      imageConfig,
    );
    if (o.quality === undefined && o.format && o.format in DEFAULT_QUALITY)
      o.quality = DEFAULT_QUALITY[o.format];
    return o;
  },
};

export default service;
