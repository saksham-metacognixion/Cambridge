import data from '../data/insurers.json';
import type { Localized } from './content';
import type { RegionId } from './editions';

/* Insurers (src/data/insurers.json). /ae and /sa show only their region's insurers; Global shows all (pills filter). */
export interface Insurer {
  slug: string;
  name: Localized;
  regions: string[];
  /** absent = no logo file yet (the card shows the name only) */
  logo?: { image: string; w: number; h: number; x: number; y: number; fit?: 'contain'; ratio?: number; crop?: { w: string; h: string; left: string; top: string } };
}
// onLive: false = not one of the live site's insurer records (client sheet 13 Oct 2026 row 15): kept in the JSON, not shown.
export const insurers = (data.insurers as (Insurer & { onLive?: boolean; liveOrder?: number })[])
  .filter((i) => i.onLive !== false)
  .sort((a, b) => (a.liveOrder ?? 999) - (b.liveOrder ?? 999)); // live page order (client 13 Oct 2026: "exactly as live")
export const insurersFor = (region: RegionId) => (region === 'global' ? insurers : insurers.filter((i) => i.regions.includes(region)));
