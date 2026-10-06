import data from '../data/testimonials.json';
import type { Localized } from './content';
import type { RegionId } from './editions';

/* Patient testimonials (src/data/testimonials.json). /ae and /sa show only their region's stories; Global shows all. */
export interface Testimonial {
  slug: string;
  name: Localized;
  quote: Localized;
  regions: string[];
  /** absent = no photo yet (card without the photo layer) */
  photo?: { image: string; alt: Localized; w: number; h: number; x: number; y: number; r?: number; ratio?: number; crop?: { w: string; h: string; left: string; top: string } };
  pattern: string[];
  layers: string[];
}
export const testimonials = data.testimonials as Testimonial[];
export const testimonialsFor = (region: RegionId) => (region === 'global' ? testimonials : testimonials.filter((t) => t.regions.includes(region)));

/** The six stories of the home page's "Stories of Care and Recovery" row (testimonials.json `home`, Figma 2007:342 order). */
export const homeTestimonials: Testimonial[] = (data.home as string[]).map((slug) => {
  const s = testimonials.find((x) => x.slug === slug);
  if (!s) throw new Error(`testimonials.json home: unknown story "${slug}"`);
  return s;
});
