/*
 * Build-time HTML sanitizer for the article bodies in src/data/news/posts.json (Pramod's export of the current site).
 * Allow-list only: a small set of text tags and attributes survives; every other tag is dropped (its text is kept), and
 * the whole content of <script>, <style>, <iframe>, <object>, <embed>, <svg>, <noscript>, <template> is removed.
 * No dependency: a tokenizer over the tag syntax is enough for trusted-source content that is rendered statically.
 * Links: http(s), mailto:, tel: and root-relative paths only; external links get rel="noopener". Images: src (same
 * rules), alt, width, height, loading=lazy. Body text tags: see TAGS.
 * Videos: the news import (tools/import-wp-news.mjs) writes a YouTube embed as <figure data-youtube="<11-char id>">
 * with a link inside; that one data attribute is kept (validated) so ArticleBody can render a click-to-play facade.
 */
const TAGS = new Set([
  "p",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "a",
  "strong",
  "b",
  "em",
  "i",
  "br",
  "img",
  "figure",
  "figcaption",
  "blockquote",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "sup",
  "sub",
]);
const DROP_WITH_CONTENT = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "svg",
  "noscript",
  "template",
  "form",
  "video",
  "audio",
]);
const VOID = new Set(["br", "img"]);
const ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title"]),
  img: new Set(["src", "alt", "width", "height"]),
  figure: new Set(["data-youtube"]),
  th: new Set(["colspan", "rowspan", "scope"]),
  td: new Set(["colspan", "rowspan"]),
};
const RENAME: Record<string, string> = { b: "strong", i: "em" };

const escapeAttr = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

function safeUrl(v: string): string | null {
  const u = v.trim();
  if (!u) return null;
  if (
    /^(https?:|mailto:|tel:)/i.test(u) ||
    u.startsWith("/") ||
    u.startsWith("#")
  )
    return u;
  return null;
}

function attributes(tag: string, raw: string): string {
  const allowed = ATTRS[tag];
  if (!allowed) return "";
  const out: string[] = [];
  const re =
    /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const m of raw.matchAll(re)) {
    const name = m[1].toLowerCase();
    if (!allowed.has(name)) continue;
    let value = m[2] ?? m[3] ?? m[4] ?? "";
    if (name === "href" || name === "src") {
      const safe = safeUrl(value);
      if (!safe) continue;
      value = safe;
    }
    if (name === "data-youtube" && !/^[A-Za-z0-9_-]{11}$/.test(value)) continue;
    if (
      (name === "width" ||
        name === "height" ||
        name === "colspan" ||
        name === "rowspan") &&
      !/^\d{1,4}$/.test(value)
    )
      continue;
    out.push(`${name}="${escapeAttr(value)}"`);
  }
  if (tag === "a") {
    const href = out.find((a) => a.startsWith("href="));
    if (href && /^href="https?:/i.test(href))
      out.push('target="_blank"', 'rel="noopener"');
  }
  if (tag === "img") out.push('loading="lazy"', 'decoding="async"');
  return out.length ? " " + out.join(" ") : "";
}

export function sanitizeHtml(html: string): string {
  if (!html) return "";
  const src = html.replace(/<!--[\s\S]*?-->/g, "");
  let out = "";
  let i = 0;
  const open: string[] = [];
  const re = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    out += src.slice(i, m.index);
    i = m.index + m[0].length;
    const closing = m[0][1] === "/";
    const tag = m[1].toLowerCase();
    if (DROP_WITH_CONTENT.has(tag) && !closing) {
      const end = new RegExp(`</${tag}\\s*>`, "i");
      end.lastIndex = i;
      const rest = src.slice(i);
      const close = rest.search(end);
      if (close === -1) {
        i = src.length;
        break;
      }
      const skip = rest.match(end)![0].length;
      i += close + skip;
      re.lastIndex = i;
      continue;
    }
    if (!TAGS.has(tag)) continue; // unknown tag: dropped, its text stays
    const name = RENAME[tag] ?? tag;
    if (VOID.has(name)) {
      if (!closing) out += `<${name}${attributes(name, m[2])}>`;
      continue;
    }
    if (closing) {
      const at = open.lastIndexOf(name);
      if (at === -1) continue; // stray close tag
      while (open.length > at) out += `</${open.pop()}>`;
    } else {
      open.push(name);
      out += `<${name}${attributes(name, m[2])}>`;
    }
  }
  out += src.slice(i);
  while (open.length) out += `</${open.pop()}>`;
  return out.trim();
}
