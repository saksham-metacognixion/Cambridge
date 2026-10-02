import { urlFor, type Edition } from "./editions";

/*
 * Inline links in JSON text: "[label](href)". href "@<path>" = a page inside the current edition (urlFor), anything else
 * is used as is (external links open in a new tab). Everything else is plain text (no HTML in JSON).
 */
export type Segment = { text: string; href?: string; external?: boolean };

export function segments(text: string, edition: Edition): Segment[] {
  const out: Segment[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) out.push({ text: text.slice(last, m.index) });
    const href = m[2].startsWith("@") ? urlFor(edition, m[2].slice(1)) : m[2];
    out.push({ text: m[1], href, external: /^https?:/.test(href) });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}
