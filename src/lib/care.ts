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
 * home-care.sa); pages without a file are generated from care.json and marked "content pending" on staging (showPendingNote).
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

/** Nodes at a given depth (1 = services) with their trails. */
export const careNodesAtDepth = (depth: number) =>
  allCareNodes().filter((p) => p.trail.length === depth);

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
/** Full page content: the region variant when one exists (home-care.sa on /sa), else the shared file, else null. */
export function careContent(slug: string, locale: LocaleId, region?: RegionId) {
  if (slug === "shared") return null;
  if (region && region !== "global" && careContentNames.has(`${slug}.${region}`))
    return content(`care/${slug}.${region}`, locale);
  return careContentNames.has(slug) ? content(`care/${slug}`, locale) : null;
}
