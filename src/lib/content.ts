import type { LocaleId } from './editions';

// Page text lives in src/data/pages/<page>/<locale>.json. Arabic files stay empty until the Arabic Figma
// frames are fetched; until then a missing Arabic key falls back to English and is reported at build time.
const files = import.meta.glob<Record<string, unknown>>('../data/pages/*/*.json', { eager: true, import: 'default' });

export function pageData<T = any>(page: string, locale: LocaleId): T {
  const en = files[`../data/pages/${page}/en.json`];
  if (!en) throw new Error(`Missing src/data/pages/${page}/en.json`);
  if (locale === 'en') return en as T;
  const loc = files[`../data/pages/${page}/${locale}.json`] ?? {};
  return mergeFallback(en, loc, `${page}/${locale}`) as T;
}

const reported = new Set<string>();
function mergeFallback(en: any, loc: any, where: string): any {
  if (Array.isArray(en)) return en.map((v, i) => mergeFallback(v, loc?.[i], `${where}[${i}]`));
  if (en && typeof en === 'object') {
    const out: any = {};
    for (const k of Object.keys(en)) out[k] = mergeFallback(en[k], loc?.[k], `${where}.${k}`);
    return out;
  }
  if (loc === undefined || loc === null || loc === '') {
    if (typeof en === 'string' && !reported.has(where.split('.')[0])) {
      reported.add(where.split('.')[0]);
      console.warn(`[content] ${where.split('.')[0]}: Arabic text missing, English shown (waiting for Arabic Figma data)`);
    }
    return en;
  }
  return loc;
}
