import data from '../data/insurers.json';
import type { Localized } from './content';
import type { RegionId } from './editions';

/* Insurers (src/data/insurers.json). /ae and /sa show only their region's insurers; Global shows all (pills filter). */
export interface Insurer {
  slug: string;
  name: Localized;
  regions: string[];
  logo: { image: string; w: number; h: number; x: number; y: number; fit?: 'contain'; ratio?: number; crop?: { w: string; h: string; left: string; top: string } };
}
export const insurers = data.insurers as Insurer[];
export const insurersFor = (region: RegionId) => (region === 'global' ? insurers : insurers.filter((i) => i.regions.includes(region)));
