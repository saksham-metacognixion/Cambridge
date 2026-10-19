import data from "../data/conditions.json";
import { PAGE_PATHS } from "./paths";
import type { Localized } from "./content";

/*
 * Conditions (Conditions & Specialities page, Figma 40:318) and their detail pages (one template, Figma 41:2373 / 67:3070).
 * List data: src/data/conditions.json. Full detail content: src/data/content/conditions/<slug>.<locale>.json — a condition
 * without that file still gets a detail page, generated from its card title + summary and marked "content pending"
 * (note visible on staging only, see showPendingNote).
 * Detail pages that are not cards on the list page would be listed in EXTRA_DETAILS (none today).
 */
export interface Condition {
  slug: string;
  figma?: string;
  title: Localized;
  summary: Localized;
  /** specialty ids (src/data/specialties.json), from the WordPress condition_specialty terms */
  specialties: string[];
  /** slug of the live site's /condition/<old_slug>/ page (301 map, src/lib/redirects.ts) */
  old_slug?: string;
  /** doctors.json slugs linked from the live condition page (tools/import-wp-cpt.mjs); "Expert Care, Trusted Doctors" */
  doctors?: string[];
}

export const conditions: Condition[] = data.conditions as Condition[];

/** Detail pages with full content that have no card on the list page. Slug = content file name. Empty since 5 Oct 2026: the Figma 'Accidents Rehabilitation' placeholder page is not in the client's content (its text lives on in figma-cache). */
export const EXTRA_DETAILS: string[] = [];

export const CONDITION_PATHS = {
  list: PAGE_PATHS.conditions,
  detail: (slug: string) => `${PAGE_PATHS.conditions}/${slug}`,
};

const detailFiles = import.meta.glob("../data/content/conditions/*.en.json");
/** Slugs that have a full content file. */
export const detailSlugs = new Set(
  Object.keys(detailFiles).map((p) => p.replace(/^.*\/(.+)\.en\.json$/, "$1")),
);

/** Every detail page slug: all cards + the extra pages. */
export const allDetailSlugs = [
  ...conditions.map((c) => c.slug),
  ...EXTRA_DETAILS.filter((s) => !conditions.some((c) => c.slug === s)),
];

/**
 * "Content pending" note on generated detail pages: ONLY when the build sets PUBLIC_SHOW_PENDING_NOTE=true (staging),
 * and never on an indexable (production) build.
 */
export function showPendingNote(indexable: boolean): boolean {
  return !indexable && import.meta.env.PUBLIC_SHOW_PENDING_NOTE === "true";
}

/** Condition slugs already reported by the build as "banner photo pending" (one warning per slug, not per edition / locale). */
export const bannerWarned = new Set<string>();
