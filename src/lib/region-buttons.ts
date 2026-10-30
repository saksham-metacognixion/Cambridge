import { content } from "./content";
import { careInRegion } from "./care";
import { getEdition, urlFor, type Edition, type RegionId } from "./editions";

/**
 * Country buttons on the Global care cards (client sheet "CH Website Comments.xlsx", 13 Oct 2026, rows 6 + 12: "these should
 * be UAE and KSA, not Start Your Care"). On the Global edition a card that opens a care page gets one button per country
 * where that page exists (careInRegion, so In-School Care shows UAE only, as on the live site), each opening the same page in that country's
 * edition, same language. Labels = the header's region names (approved Arabic, layout/header.<locale>.json).
 * Returns null on /ae and /sa (the country is already chosen: the card keeps its single button).
 */
export interface RegionButton {
  region: RegionId;
  label: string;
  href: string;
}

const COUNTRIES: RegionId[] = ["ae", "sa"];

export function careRegionButtons(
  edition: Edition,
  slug: string,
  path: string,
): RegionButton[] | null {
  if (edition.region !== "global") return null;
  const names = content("layout/header", edition.locale).region.options as {
    region: RegionId;
    label: string;
  }[];
  const label = (r: RegionId) =>
    names.find((o) => o.region === r)?.label ?? r.toUpperCase();
  return COUNTRIES.filter((r) => careInRegion(slug, r)).map((r) => ({
    region: r,
    label: label(r),
    href: urlFor(getEdition(r, edition.locale), path),
  }));
}
