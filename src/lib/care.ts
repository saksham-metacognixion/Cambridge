import data from "../data/care.json";
import { PAGE_PATHS } from "./paths";
import { content, type Localized } from "./content";
import type { LocaleId, RegionId } from "./editions";

/*
 * Our Care hierarchy (src/data/care.json) = the folder structure of the client's content ('Website Content - Suhad/Our Care',
 * 5 Oct 2026): hub (Figma 36:5631) -> 4 services (Inpatient Care = Figma 83:226) -> sections (Figma 41:1730 template)
 * -> programmes (condition-detail template 41:2373: Overview + topic tabs), up to 4 levels under /care.
 * URL pattern in ONE place: care, care/<service>, care/<service>/<section>, ... (the live site's /care/... paths quoted in the
 * documents; derived slugs are UNCONFIRMED, docs/open-decisions.md CT2).
 * Full page text: src/data/content/care/<slug>.<locale>.json (+ <slug>.<region>.<locale>.json for a region variant, e.g.
 * home-healthcare.sa); pages without a file are generated from care.json and marked "content pending" on staging (showPendingNote).
 */
export interface CareNode {
  slug: string;
  figma?: string;
  title: Localized;
  /** card title when the parent page names it differently from the page title (Inpatient Care: "Post Acute Care") */
  cardTitle?: Localized;
  /** card text (from the parent's document) = the generated overview of a page without a content file */
  desc: Localized;
  image?: string;
  alt?: string;
  /** programme card icon (ConditionCards): 'neuro' | 'musculoskeletal' | 'post-surgical' | 'accident' (Figma post-acute icons) or an
   *  image key under src/assets (care/icons/*, the client's programme icons, 9 Oct 2026) */
  icon?: string;
  /** countries that offer this service (bug 047): absent = every edition; e.g. ["ae"] = UAE only (In-School Care). Global
   *  lists every service; a child inherits its ancestors' limits. */
  regions?: RegionId[];
  children: CareNode[];
}
export interface CarePath {
  node: CareNode;
  /** slugs from the service down to this node */
  trail: string[];
  parent: CareNode | null;
}

export const services = data.services as CareNode[];

export const CARE_PATHS = {
  hub: PAGE_PATHS.ourCare,
  /** care/<service>[/<section>[/<programme>...]] */
  of: (trail: string[]) => [PAGE_PATHS.ourCare, ...trail].join("/"),
  service: (slug: string) => `${PAGE_PATHS.ourCare}/${slug}`,
};

/** Every node with its trail, depth-first in data order. */
export function allCareNodes(): CarePath[] {
  const out: CarePath[] = [];
  const walk = (nodes: CareNode[], trail: string[], parent: CareNode | null) => {
    for (const n of nodes) {
      const t = [...trail, n.slug];
      out.push({ node: n, trail: t, parent });
      walk(n.children, t, n);
    }
  };
  walk(services, [], null);
  return out;
}

/** Nodes at a given depth (1 = services) with their trails; with a region, only the ones offered there (careInRegion). */
export const careNodesAtDepth = (depth: number, region?: RegionId) =>
  allCareNodes().filter((p) => p.trail.length === depth && (!region || careInRegion(p.node.slug, region)));

const bySlug = new Map(allCareNodes().map((p) => [p.node.slug, p]));
/**
 * Is the care page `slug` offered in this region (bug 047)? Global: always. UAE / KSA: unless the node or one of its
 * ancestors has `regions` without that region. Unknown slugs are left alone (true). Pages that fail are not built in that
 * edition, their cards / footer links are hidden, and the URL 301s to the edition's Our Care hub (src/lib/redirects.ts).
 */
export function careInRegion(slug: string, region: RegionId): boolean {
  if (region === "global") return true;
  const p = bySlug.get(slug);
  if (!p) return true;
  return p.trail.every((s) => {
    const r = bySlug.get(s)!.node.regions;
    return !r || r.includes(region);
  });
}
/** Every care page that is NOT offered in `region`, as trails (for the redirects). */
export const careOutsideRegion = (region: RegionId) =>
  allCareNodes().filter((p) => !careInRegion(p.node.slug, region));

export const service = (slug: string): CareNode => {
  const s = services.find((x) => x.slug === slug);
  if (!s)
    throw new Error(`Unknown service slug "${slug}" (src/data/care.json)`);
  return s;
};

const files = import.meta.glob("../data/content/care/*.en.json");
/** Content file names (without .en.json): "<slug>" or "<slug>.<region>". */
export const careContentNames = new Set(
  Object.keys(files).map((p) => p.replace(/^.*\/(.+)\.en\.json$/, "$1")),
);
/** Full page content: the region variant when one exists (home-healthcare.sa on /sa), else the shared file, else null. */
export function careContent(slug: string, locale: LocaleId, region?: RegionId) {
  if (slug === "shared") return null;
  if (region && region !== "global" && careContentNames.has(`${slug}.${region}`))
    return content(`care/${slug}.${region}`, locale);
  return careContentNames.has(slug) ? content(`care/${slug}`, locale) : null;
}
