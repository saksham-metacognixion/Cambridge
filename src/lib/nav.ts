import { urlFor, type Edition } from './editions';
import { pagePath } from './paths';
import nav from '../data/nav.json';

/** Destination of the header "We are listening" link (src/data/nav.json -> weAreListeningTarget). */
type Target = { page: string; hash?: string } | { href: string };
export function weAreListeningHref(edition: Edition): string {
  const t = nav.weAreListeningTarget as Target;
  if ('page' in t) return urlFor(edition, pagePath(t.page)) + (t.hash ? `#${t.hash}` : '');
  return t.href;
}
