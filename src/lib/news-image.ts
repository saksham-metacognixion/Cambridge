import { getImage } from 'astro:assets';
import { img } from './images';
import type { Edition } from './editions';
import { badgeDate, type Post } from './news';
import { urlFor } from './editions';
import { px } from './scale';

// Card image box is 248.389 x 175.333 Figma px; widths are 1x and 2x of that at the 1440 target.
const BOX_W = px(248.389);
const BOX_H = px(175.333);

export interface CardData {
  slug: string;
  category: string;
  href: string;
  title: string;
  excerpt: string;
  iso: string;
  day: string;
  weekday: string;
  dateFull: string;
  src: string;
  srcset: string;
  alt: string;
  /** inline style of the <img>, only for a Figma placeholder crop */
  crop: string;
}

/** Everything one Media Hub card needs; used by the server-rendered cards and by posts.json (client-rendered cards). */
export async function cardData(post: Post, edition: Edition): Promise<CardData> {
  // A post without an image (or whose file is missing) renders its card with an empty image box instead of failing the build.
  let src: ReturnType<typeof img> | null = null;
  try {
    src = post.image ? img(post.image, edition.region) : null;
  } catch {
    console.warn(`[news] ${post.slug}: image "${post.image}" not found in src/assets`);
  }
  let url = '';
  let srcset = '';
  let crop = '';
  if (!src) {
    // nothing to process
  } else if (post.image_crop) {
    // Figma placeholder crop: the source is drawn larger than the box and offset, so keep the original size.
    url = (await getImage({ src, width: 960, format: 'webp' })).src;
    const c = post.image_crop;
    crop = `height:${c.h};inset-inline-start:${c.l};top:${c.t};width:${c.w};object-fit:fill`;
  } else {
    const [a, b] = await Promise.all(
      [BOX_W, BOX_W * 2].map((w) => getImage({ src, width: w, height: Math.round((w * BOX_H) / BOX_W), fit: 'cover', format: 'webp' })),
    );
    url = a.src;
    srcset = `${a.src} ${BOX_W}w, ${b.src} ${BOX_W * 2}w`;
  }
  const d = badgeDate(post.date, edition.locale);
  return {
    slug: post.slug,
    category: post.category,
    href: urlFor(edition, `media-hub/${post.slug}`),
    title: post.title,
    excerpt: post.excerpt,
    iso: post.date,
    day: d.day,
    weekday: d.weekday,
    dateFull: d.full,
    src: url,
    srcset,
    alt: post.image_alt || post.title,
    crop,
  };
}
