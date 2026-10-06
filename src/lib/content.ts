import type { LocaleId } from './editions';

/*
 * Content lives in JSON so a CMS can be added later (CLAUDE.md §4):
 *   src/data/content/<page>/<section>.<locale>.json   page text (e.g. home/hero.en.json)
 *   src/data/doctors.json, hospitals.json, news.json    entities (placeholders until Pramod's export arrives)
 * English text = Figma / the client's documents. Arabic = the live site's Arabic pages (WordPress export, 6 Oct 2026) where the
 * export has them; every missing Arabic value falls back to English and the build prints one warning per file.
 */
const files = import.meta.glob<Record<string, unknown>>('../data/content/**/*.json', { eager: true, import: 'default' });

/** content('home/hero', 'ar') -> merged object (Arabic where present, English otherwise). */
export function content<T = any>(name: string, locale: LocaleId): T {
  const en = files[`../data/content/${name}.en.json`];
  if (!en) throw new Error(`Missing src/data/content/${name}.en.json`);
  if (locale === 'en') return en as T;
  const loc = files[`../data/content/${name}.${locale}.json`] ?? {};
  return merge(en, loc, `${name}.${locale}`) as T;
}

/** Localized entity field: { en: "...", ar: "..." } -> string for the locale (English fallback). */
export type Localized = { en: string; ar?: string };
export function t(field: Localized, locale: LocaleId, where = 'entity'): string {
  const v = field[locale];
  if (v) return v;
  if (locale !== 'en') warn(where);
  return field.en;
}

const warned = new Set<string>();
function warn(where: string) {
  if (warned.has(where)) return;
  warned.add(where);
  console.warn(`[content] ${where}: Arabic text missing, English shown (no Arabic for it in the live site's export, docs/open-decisions.md WP2)`);
}

function merge(en: any, loc: any, where: string): any {
  // An Arabic array replaces the English one with ITS length (an Arabic text can have a different number of paragraphs /
  // title lines); each element still falls back element-wise.
  if (Array.isArray(en)) {
    if (Array.isArray(loc) && loc.length) return loc.map((v, i) => merge(en[i] ?? en[en.length - 1] ?? '', v, where));
    return en.map((v, i) => merge(v, loc?.[i], where));
  }
  if (en && typeof en === 'object') {
    const out: any = {};
    for (const k of Object.keys(en)) out[k] = merge(en[k], loc?.[k], where);
    return out;
  }
  if (loc === undefined || loc === null || loc === '') {
    if (typeof en === 'string' && /[A-Za-z]/.test(en)) warn(where);
    return en;
  }
  return loc;
}
