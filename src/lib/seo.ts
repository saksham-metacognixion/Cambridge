import { SITE_URL, INDEXABLE } from '../../site.config.mjs';
import { editions, defaultEdition, urlFor, type Edition } from './editions';

export { INDEXABLE };

export const absolute = (rootRelative: string) => new URL(rootRelative, SITE_URL).href;

/** hreflang alternates for one page path across all 6 editions, plus x-default (Global English). */
export function alternates(path: string) {
  return [
    ...editions.map((e) => ({ hreflang: e.lang, href: absolute(urlFor(e, path)) })),
    { hreflang: 'x-default', href: absolute(urlFor(defaultEdition, path)) },
  ];
}

/** og:locale wants en_AE style; Global has no country. */
export const ogLocale = (e: Edition) => e.lang.replace('-', '_');
