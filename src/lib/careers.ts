import { urlFor, type Edition } from './editions';
import { pagePath } from './paths';
import config from '../data/careers.json';

/*
 * Careers button destinations (src/data/careers.json). Each is { page } (edition-aware internal page, key in PAGE_PATHS)
 * or { href } (absolute URL, e.g. an external jobs portal). Changing a destination = editing that JSON only.
 */
type Link = { page: string } | { href: string };
export function careersLink(edition: Edition, key: 'joinUrl' | 'openRolesUrl' | 'applyUrl'): string {
  const l = config[key] as Link;
  return 'page' in l ? urlFor(edition, pagePath(l.page)) : l.href;
}
