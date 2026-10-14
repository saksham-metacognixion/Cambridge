import { urlFor, type Edition } from "./editions";
import { pagePath, PAGE_PATHS } from "./paths";
import { allRoutes } from "./routes";
import { CARE_PATHS, services, type CareNode } from "./care";
import { HOSPITAL_PATHS, hospitals, hospitalName } from "./hospitals";
import { t } from "./content";
import nav from "../data/nav.json";

/*
 * Header main-menu dropdowns (bug 046). A main link (layout/header JSON) gets its list from either
 * - `children`: a fixed list of page keys (About Cambridge, Patient Hub: the live site's header menu), or
 * - `menu`: a list generated from data: "care" = the whole Our Care tree (care.json), every node with its children as a
 *   fly-out, "hospitals" = the hospitals (hospitals.json).
 * Every item is checked against the edition's route registry (allRoutes), so the menu only links pages that are built in
 * that edition: no page yet (Meet Our Team), a care service of another country (In-School Care on /sa) or another country's
 * hospital is left out without any menu-specific region logic. Bug 104 (14 Oct 2026): Our Care follows the live menu to its
 * full depth (service -> section -> programme -> Neurorehabilitation's three programmes); it used to stop at the sections.
 */
export interface NavItem {
  label: string;
  href: string;
  /** page path inside the edition (the header's active-section match, bug 116) */
  path: string;
  current: boolean;
  children: NavItem[];
}
export interface MainLinkSource {
  children?: { label: string; page: string }[];
  menu?: "care" | "hospitals";
}

export function headerSubmenu(
  link: MainLinkSource,
  edition: Edition,
  here: string,
): NavItem[] {
  const built = new Set(allRoutes(edition).map((r) => r.path));
  const item = (
    label: string,
    path: string,
    children: NavItem[] = [],
  ): NavItem[] =>
    built.has(path)
      ? [
          {
            label,
            href: urlFor(edition, path),
            path,
            current: here === path,
            children,
          },
        ]
      : [];
  const loc = edition.locale;
  if (link.menu === "care") {
    const tree = (nodes: CareNode[], trail: string[]): NavItem[] =>
      nodes.flatMap((n) =>
        item(
          t(n.title, loc, "care"),
          CARE_PATHS.of([...trail, n.slug]),
          tree(n.children, [...trail, n.slug]),
        ),
      );
    return tree(services, []);
  }
  if (link.menu === "hospitals") {
    // grouped by country (UAE, then KSA), data order inside: on Global the six read as two blocks
    const regionOrder = ["ae", "sa"];
    return [...hospitals]
      .sort(
        (a, b) => regionOrder.indexOf(a.region) - regionOrder.indexOf(b.region),
      )
      .flatMap((h) =>
        item(hospitalName(h, loc), HOSPITAL_PATHS.detail(h.slug)),
      );
  }
  return (link.children ?? []).flatMap((k) =>
    k.page in PAGE_PATHS ? item(k.label, pagePath(k.page)) : [],
  );
}

/** Destination of the header "We are listening" link (src/data/nav.json -> weAreListeningTarget); null = the link is off (bug 045). */
type Target = { page: string; hash?: string } | { href: string };
export function weAreListeningHref(edition: Edition): string | null {
  const t = nav.weAreListeningTarget as Target | null;
  if (!t) return null;
  if ("page" in t)
    return urlFor(edition, pagePath(t.page)) + (t.hash ? `#${t.hash}` : "");
  return t.href;
}
