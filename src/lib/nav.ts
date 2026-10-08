import { urlFor, type Edition } from './editions';
import { pagePath } from './paths';
import nav from '../data/nav.json';

/** Destination of the header "We are listening" link (src/data/nav.json -> weAreListeningTarget); null = the link is off (bug 045). */
type Target = { page: string; hash?: string } | { href: string };
export function weAreListeningHref(edition: Edition): string | null {
  const t = nav.weAreListeningTarget as Target | null;
  if (!t) return null;
  if ('page' in t) return urlFor(edition, pagePath(t.page)) + (t.hash ? `#${t.hash}` : '');
  return t.href;
}
