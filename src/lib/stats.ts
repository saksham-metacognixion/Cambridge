import type { Edition } from './editions';
import { content } from './content';

/*
 * Stats shared between pages: a stat `{ "shared": "<key>" }` takes its number and label from the landing page's
 * home/facilities JSON (entries carry a `key`), so the number and its spelling are identical site-wide (scope 2.9).
 * Page-specific stats are plain `{ number, label }`.
 */
type Stat = { number: string; label: string };
export function resolveStats(edition: Edition, stats: Array<Stat | { shared: string }>): Stat[] {
  const shared = content('home/facilities', edition.locale).stats as Array<Stat & { key?: string }>;
  return stats.map((s) => {
    if (!('shared' in s)) return s;
    const hit = shared.find((x) => x.key === s.shared);
    if (!hit) throw new Error(`Unknown shared stat "${s.shared}" (keys: src/data/content/home/facilities.en.json)`);
    return { number: hit.number, label: hit.label };
  });
}
