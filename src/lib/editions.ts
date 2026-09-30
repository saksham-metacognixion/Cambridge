import config from '../data/editions.json';

export type RegionId = 'global' | 'ae' | 'sa';
export type LocaleId = 'en' | 'ar';

export interface Edition {
  /** e.g. "ae-ar" */
  id: string;
  region: RegionId;
  locale: LocaleId;
  country: string | null;
  regionName: string;
  /** URL prefix without slashes: "" | "ar" | "ae" | "ae/ar" | "sa" | "sa/ar" */
  base: string;
  dir: 'ltr' | 'rtl';
  /** <html lang> and hreflang value: en, ar, en-AE, ar-AE, en-SA, ar-SA */
  lang: string;
}

/** The one place that decides the URL prefix of an edition. */
function basePath(regionPath: string, localePath: string): string {
  return [regionPath, localePath].filter(Boolean).join('/');
}

export const editions: Edition[] = config.regions.flatMap((r) =>
  config.locales.map((l) => ({
    id: `${r.id}-${l.id}`,
    region: r.id as RegionId,
    locale: l.id as LocaleId,
    country: r.country,
    regionName: r.name,
    base: basePath(r.path, l.path),
    dir: l.dir as 'ltr' | 'rtl',
    lang: r.country ? `${l.id}-${r.country}` : l.id,
  })),
);

export const defaultEdition = editions.find(
  (e) => e.region === config.default.region && e.locale === config.default.locale,
)!;

export function getEdition(region: RegionId, locale: LocaleId): Edition {
  return editions.find((e) => e.region === region && e.locale === locale)!;
}

/** Edition for a `[...base]` route param (undefined = Global English). */
export function editionFromBase(base: string | undefined): Edition {
  const e = editions.find((x) => x.base === (base ?? ''));
  if (!e) throw new Error(`Unknown edition base "${base}"`);
  return e;
}

/**
 * Split a pathname into its edition and the page path inside the edition.
 * "/ae/ar/find-a-doctor" -> { edition: ae-ar, path: "find-a-doctor" }. Longest base wins.
 */
export function parsePath(pathname: string): { edition: Edition; path: string } {
  const clean = pathname.replace(/\.html$/, '').replace(/^\/+|\/+$/g, '').replace(/(^|\/)index$/, '');
  const sorted = [...editions].sort((a, b) => b.base.length - a.base.length);
  for (const e of sorted) {
    if (e.base === '') return { edition: e, path: clean };
    if (clean === e.base || clean.startsWith(e.base + '/')) return { edition: e, path: clean.slice(e.base.length).replace(/^\//, '') };
  }
  return { edition: defaultEdition, path: clean };
}

/** Root-relative URL of a page path in an edition. urlFor(ae-en, "") -> "/ae", urlFor(global-en, "") -> "/". */
export function urlFor(edition: Edition, path = ''): string {
  const p = [edition.base, path].filter(Boolean).join('/');
  return '/' + p;
}

/** getStaticPaths helper for `[...base]` routes. */
export function editionPaths() {
  return editions.map((e) => ({ params: { base: e.base || undefined } }));
}
