import data from "../data/leadership.json";
import {
  editions,
  getEdition,
  urlFor,
  type Edition,
  type LocaleId,
} from "./editions";
import type { Localized } from "./content";

/**
 * Meet the Team (Task 198, 16 Oct 2026; WP6). Data: src/data/leadership.json (tools/leadership/import.py, from the live
 * English / Arabic Meet the Team pages and profiles + docs/leadership.json). No Figma frame: the list follows the live page
 * (hero, country filter, photo cards in the live order, the recovery band) on the site's Find a Doctor card; a profile follows
 * the live profile (breadcrumb, photo, name, title, Professional Summary) on the site's doctor profile.
 *
 * URLs: the list is PAGE_PATHS.meetTheTeam (/about/meet-the-team/, the live URL); a profile keeps its live URL
 * /leadership/<slug>/ (LEADER_PATHS), so old links open the same person without a redirect. The live slugs are kept as
 * published, collision included: /leadership/arafat-alakhrass/ is Dr. Wael Sary, /leadership/arafat-alakhrass-2/ is Arafat
 * Alakhrass.
 *
 * Editions (no UAE / KSA mixing, like doctor profiles): Global lists all 16 (live order) with the All Countries / UAE / KSA
 * filter; /ae lists the UAE leaders, /sa the KSA leaders. A profile is built on Global and in its own country's editions.
 */
export interface Leader {
  id: number;
  slug: string;
  country: "ae" | "sa";
  order: number;
  name: Localized;
  title: Localized;
  bio: Localized;
  photo: string;
  old_urls: string[];
}

export const leaders: Leader[] = (data.leaders as Leader[])
  .slice()
  .sort((a, b) => a.order - b.order);

export const LEADER_PATHS = {
  /** the live section root; it has no page of its own (redirects to Meet the Team) */
  section: "leadership",
  profile: (slug: string) => `leadership/${slug}`,
};

/** Edition ids that build a leader's profile: Global + the leader's own country. */
export const leaderEditions = (l: Pick<Leader, "country">) =>
  editions
    .filter((e) => e.region === "global" || e.region === l.country)
    .map((e) => e.id);

/** The leaders an edition lists: all on Global, that country's on /ae and /sa. Live order. */
export const leadersForEdition = (e: Edition) =>
  e.region === "global"
    ? leaders
    : leaders.filter((l) => l.country === e.region);

/** A field in exactly this language: no English fallback on Arabic pages (an empty Arabic field shows nothing). */
export const own = (f: Localized, locale: LocaleId) =>
  (locale === "en" ? f.en : (f.ar ?? "")) || "";

/** The profile link from an edition: its own profile there, else the one in the leader's country (same language). */
export function leaderHref(l: Leader, e: Edition): string {
  const target = leaderEditions(l).includes(e.id)
    ? e
    : getEdition(l.country, e.locale);
  return urlFor(target, LEADER_PATHS.profile(l.slug));
}
