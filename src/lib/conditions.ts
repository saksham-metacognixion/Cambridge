import data from "../data/conditions.json";
import { PAGE_PATHS } from "./paths";
import type { Localized } from "./content";

/*
 * Conditions (Conditions & Specialities page, Figma 40:318) and their detail pages (one template, Figma 41:2373 / 67:3070).
 * List data: src/data/conditions.json. Full detail content: src/data/content/conditions/<slug>.<locale>.json — a condition
 * without that file still gets a detail page, generated from its card title + summary and marked "content pending"
 * (note visible on staging only, see showPendingNote).
 * Detail pages that are not cards on the list page (Accidents Rehabilitation, Figma 41:2373) are listed in EXTRA_DETAILS.
 */
export interface Condition {
  slug: string;
  figma?: string;
  title: Localized;
  summary: Localized;
  /** specialty ids (src/data/specialties.json); mapping pending from Pramod */
  specialties: string[];
}

export const conditions: Condition[] = data.conditions as Condition[];

/** Detail pages with full content that have no card on the list page. Slug = content file name. */
export const EXTRA_DETAILS = ["accidents-rehabilitation"];

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
