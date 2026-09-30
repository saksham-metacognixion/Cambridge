/**
 * Registry of page paths inside an edition. Every page exists in all 6 editions.
 * Templates filled from JSON (doctors, hospitals, news) will add their dynamic paths here, so the
 * sitemaps and hreflang stay complete.
 */
export interface PageRoute {
  key: string;
  /** path inside the edition, "" = edition home */
  path: string;
}

export function allRoutes(): PageRoute[] {
  return [{ key: 'home', path: '' }];
}
