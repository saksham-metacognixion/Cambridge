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

/*
 * "No openings" panel (careers.json `noOpenings`, bug 088 reopened 13 Oct 2026): shown in place of a navigation for
 * 'View Open Roles' / 'Apply Now'. null = not shown for this edition (switched off, or no approved text in its language:
 * never English on an Arabic page), and the buttons keep their links.
 */
export type NoOpenings = { text: string; link: { label: string; href: string } | null };
export function noOpenings(edition: Edition): NoOpenings | null {
  const n = config.noOpenings;
  const lang = edition.locale as 'en' | 'ar';
  const text = n.enabled ? n.text[lang] : '';
  if (!text) {
    if (n.enabled) console.warn(`[careers] noOpenings: no ${lang} text, '${edition.locale}' Careers buttons keep their links (docs/open-decisions.md D4)`);
    return null;
  }
  const label = n.link?.label[lang];
  return { text, link: label ? { label, href: 'page' in n.link.to ? urlFor(edition, pagePath(n.link.to.page)) : (n.link.to as { href: string }).href } : null };
}
