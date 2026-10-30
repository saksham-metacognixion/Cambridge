// SEO + GEO checks shown while the post is edited (SEO & GEO Dashboard Spec, section 4: the nine focus-keyword rules, plus
// the GEO blocks of section 6). Warnings only: nothing here blocks publishing (the alt-text rule is enforced by the server).
export type Locale = { title: string; excerpt?: string; body?: string; image_alt?: string; seo?: { title?: string; description?: string }; focus_keyword?: string; key_takeaways?: string[]; faqs?: { q: string; a: string }[]; sources?: { title?: string; url: string }[] };
export type Check = { group: "SEO" | "GEO"; label: string; ok: boolean; tip: string; weight: number };

export const TITLE = { min: 50, max: 60 };
export const DESC = { min: 140, max: 160 };
export const stripHtml = (h: string) => (h || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
export const words = (h: string) => stripHtml(h).split(" ").filter(Boolean);
const norm = (s: string) => (s || "").toLowerCase().replace(/\s+/g, " ").trim();

/** Fallbacks the site applies when a field is empty (same as the article template). */
export const seoTitle = (l: Locale) => l.seo?.title || `${l.title} | Cambridge Hospital`;
export const seoDescription = (l: Locale) => l.seo?.description || stripHtml(l.excerpt || l.body || "").slice(0, 155);

export function runChecks(l: Locale, slug: string, o: { otherKeywords: string[]; author?: string; reviewer?: string; updated?: string; date?: string }): { score: number; checks: Check[]; wordCount: number } {
  const kw = norm(l.focus_keyword || "");
  const has = (s: string) => !!kw && norm(s).includes(kw);
  const title = seoTitle(l);
  const desc = seoDescription(l);
  const bodyText = stripHtml(l.body || "");
  const first100 = words(l.body || "").slice(0, 100).join(" ");
  const wordCount = words(l.body || "").length;
  const alts = [l.image_alt || "", ...[...(l.body || "").matchAll(/alt="([^"]*)"/g)].map((m) => m[1])];
  const internal = /href="(\/|https?:\/\/(www\.)?cambridgehospital\.com)/.test(l.body || "");
  const kwSlug = kw.replace(/[^\p{L}\p{N}]+/gu, "-");
  const age = (() => { const d = o.updated || o.date; return d ? (Date.now() - Date.parse(d)) / 864e5 : 9999; })();
  const c = (group: Check["group"], label: string, ok: boolean, tip: string, weight = 5): Check => ({ group, label, ok, tip, weight });
  const checks: Check[] = [
    c("SEO", "Focus keyword chosen", !!kw, "Pick the phrase people search for, e.g. \"stroke rehabilitation Abu Dhabi\".", 4),
    c("SEO", "Keyword in the meta title", has(title), "Put the keyword in the title, ideally near the start.", 6),
    c("SEO", "Keyword in the meta description", has(desc), "Use the keyword once in the description.", 4),
    c("SEO", "Keyword in the URL", !!kw && slug.includes(kwSlug), `Make the web address contain the keyword, e.g. /media-hub/${kwSlug || "keyword"}.`, 3),
    c("SEO", "Keyword in the heading (H1)", has(l.title), "The page heading is the post title: include the keyword.", 4),
    c("SEO", "Keyword in the first 100 words", has(first100), "Mention the keyword early in the article.", 4),
    c("SEO", "At least 600 words", wordCount >= 600, `Now ${wordCount} words.`, 5),
    c("SEO", "Keyword in an image description", alts.some((a) => has(a)), "Describe the featured image (alt text) with the keyword.", 3),
    c("SEO", "Links to another page on the site", internal, "Add at least one link to a page of cambridgehospital.com.", 3),
    c("SEO", "Keyword not used by another post", !kw || !o.otherKeywords.map(norm).includes(kw), "Another published post has this focus keyword; give each post its own.", 3),
    c("SEO", `Meta title ${TITLE.min}–${TITLE.max} characters`, title.length >= TITLE.min && title.length <= TITLE.max, `Now ${title.length}.`, 3),
    c("SEO", `Meta description ${DESC.min}–${DESC.max} characters`, desc.length >= DESC.min && desc.length <= DESC.max, `Now ${desc.length}.`, 3),
    c("SEO", "Featured image described (alt text)", !!(l.image_alt || "").trim(), "Required before publishing.", 4),
    c("GEO", "2–3 key takeaways", (l.key_takeaways || []).filter(Boolean).length >= 2, "Short facts at the top: what AI assistants quote.", 6),
    c("GEO", "FAQ with 2+ questions", (l.faqs || []).filter((f) => f.q && f.a).length >= 2, "Real patient questions with short answers (also FAQPage schema).", 5),
    c("GEO", "2+ sources", (l.sources || []).filter((s) => s.url).length >= 2, "Link the studies or official pages the facts come from.", 5),
    c("GEO", "Named author", !!o.author, "Choose the author (byline + Person schema).", 4),
    c("GEO", "Reviewed by a clinician", !!o.reviewer, "A medical reviewer shows expertise and trust.", 5),
    c("GEO", "Updated in the last 12 months", age < 366, "Refresh the facts and set \"Last updated\".", 3),
    c("GEO", "Body is 600+ words (depth)", bodyText.length > 0 && wordCount >= 600, "Thin pages are rarely cited.", 2),
  ];
  const total = checks.reduce((a, x) => a + x.weight, 0);
  const got = checks.reduce((a, x) => a + (x.ok ? x.weight : 0), 0);
  return { score: Math.round((got / total) * 100), checks, wordCount };
}
