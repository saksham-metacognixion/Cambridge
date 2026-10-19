// Converts the WordPress export of the current site (WXR 1.2, posts + attachments) into src/data/news/posts.json
// (schema: src/data/news/README.md). No dependency: the WXR fields are read with regular expressions per <item>.
//
// Usage: node tools/import-wp-news.mjs [path/to/export.xml]
//        then: node tools/download-news-images.mjs   (featured images + YouTube posters into src/assets)
//
// What it does, per published post:
//   language   `/ar/` in the post link = Arabic, else English
//   slug       English post_name. An Arabic post (WPML translation) keeps the English slug when its post_name is the
//              same; the few with an Arabic post_name are paired with the English post that has the same post_date
//              (WPML duplicates keep the date); a post that cannot be paired keeps its own decoded slug (reported).
//   category   the post's category nicename, ignoring the WPML "latest-posts" bucket (10 posts carry Events + Latest Posts)
//   date       post_date (site time) as YYYY-MM-DD
//   old_url    path of the post on the current site (301 map, /redirects-news.txt)
//   title      entity-decoded plain text
//   excerpt    the export has none: the first paragraph, cut at a word boundary (EXCERPT_MAX) with "..." (reported)
//   body       the Gutenberg HTML with: block comments removed; YouTube embeds turned into
//              <figure data-youtube="<id>"><a href="https://www.youtube.com/watch?v=<id>">title</a></figure>
//              (ArticleBody renders a click-to-play facade, the link is the no-JS fallback); h1 -> h2, h5/h6 -> h4;
//              links to cambridgehospital.com made root-relative; Check Point "protect" wrappers unwrapped to the real URL;
//              links to the favicon's attachment page (a WordPress auto-link on the word "patients") reduced to their text.
//              Everything else is left to the build-time sanitizer (src/lib/sanitize.ts).
//   image      featured image (_thumbnail_id -> attachment) as the key news/<slug>; image_source = its URL for the
//              download script; image_alt = the attachment's alt text. An Arabic post whose featured image differs from
//              the English one (not just WPML's duplicate upload "<name>-1.ext") gets news/<slug>-ar.
//   region     "global" (the export has no region; every edition lists every post, docs/open-decisions.md D15)
// A report goes to docs/news-import.md.
import fs from 'node:fs';
import path from 'node:path';

const SRC = process.argv[2] ?? 'docs/cambridgehospital.WordPress.2026-10-06.xml';
const OUT = 'src/data/news/posts.json';
const REPORT = 'docs/news-import.md';
const EXCERPT_MAX = 160;
const SITE = 'https://cambridgehospital.com';

const xml = fs.readFileSync(SRC, 'utf8');

// ---------- WXR helpers ----------
const unCdata = (v) =>
  v
    .trim()
    .replace(/^<!\[CDATA\[/, '')
    .replace(/\]\]>$/, '')
    .replace(/\]\]\]\]><!\[CDATA\[>/g, ']]>');
const field = (item, tag) => {
  const m = item.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`));
  return m ? unCdata(m[1]) : '';
};
const metas = (item) => {
  const out = {};
  const re = /<wp:postmeta>\s*<wp:meta_key><!\[CDATA\[([^\]]*)\]\]><\/wp:meta_key>\s*<wp:meta_value><!\[CDATA\[([\s\S]*?)\]\]><\/wp:meta_value>\s*<\/wp:postmeta>/g;
  for (const m of item.matchAll(re)) out[m[1]] = m[2];
  return out;
};
const categories = (item) =>
  [...item.matchAll(/<category domain="category" nicename="([^"]*)">/g)].map((m) => decodeURIComponent(m[1]));

const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', copy: '©', reg: '®', trade: '™' };
const decode = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (all, e) => {
    if (e[0] === '#') return String.fromCodePoint(parseInt(e[1] === 'x' || e[1] === 'X' ? e.slice(2) : e.slice(1), e[1] === 'x' || e[1] === 'X' ? 16 : 10));
    return NAMED[e.toLowerCase()] ?? all;
  });
const text = (html) => decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

// ---------- read items ----------
const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
const attachments = new Map(); // id -> { url, alt }
const rawPosts = [];
for (const it of items) {
  const type = field(it, 'wp:post_type');
  const id = field(it, 'wp:post_id');
  if (type === 'attachment') {
    attachments.set(id, { url: field(it, 'wp:attachment_url'), alt: decode(metas(it)._wp_attachment_image_alt ?? '').trim() });
  } else if (type === 'post' && field(it, 'wp:status') === 'publish') {
    const link = field(it, 'link');
    const meta = metas(it);
    rawPosts.push({
      id,
      link,
      language: /\/ar\//.test(new URL(link).pathname) ? 'ar' : 'en',
      name: field(it, 'wp:post_name'),
      title: decode(field(it, 'title')).replace(/\s+/g, ' ').trim(),
      date: field(it, 'wp:post_date'),
      dateGmt: field(it, 'wp:post_date_gmt'),
      content: field(it, 'content:encoded'),
      categories: categories(it),
      thumb: meta._thumbnail_id ?? '',
      // oEmbed cache of the post: iframe title per YouTube id (used as the link text / accessible name of the facade)
      videoTitles: Object.fromEntries(
        Object.entries(meta)
          .filter(([k]) => k.startsWith('_oembed_') && !k.startsWith('_oembed_time_'))
          .map(([, v]) => {
            const idm = v.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{11})/);
            const tm = v.match(/<iframe[^>]*\stitle="([^"]*)"/);
            return idm ? [idm[1], decode(tm?.[1] ?? '').replace(/\s+/g, ' ').trim()] : null;
          })
          .filter(Boolean),
      ),
    });
  }
}

// ---------- body transforms ----------
const videoTitles = new Map();
for (const p of rawPosts) for (const [id, t] of Object.entries(p.videoTitles)) if (t && !videoTitles.has(id)) videoTitles.set(id, t);
const report = { nonYoutubeEmbeds: [], unpaired: [], noImage: [], missingAttachment: [], arOwnImage: [], unwrapped: 0, relativised: 0, videos: 0, excerptCut: 0, h1: 0, slugPairedByDate: [] };
const YT_ID = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function transformBody(html, post) {
  let out = html.replace(/<!--[\s\S]*?-->/g, '');
  // YouTube embed blocks -> facade marker
  out = out.replace(/<figure class="wp-block-embed[^"]*"[^>]*>\s*<div class="wp-block-embed__wrapper">\s*([^<\s]+)\s*<\/div>\s*<\/figure>/g, (all, url) => {
    const m = url.match(YT_ID);
    if (!m) {
      report.nonYoutubeEmbeds.push(`${post.language} ${post.name}: ${url}`);
      return `<p><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>`;
    }
    report.videos++;
    const id = m[1];
    // title: this post's oEmbed cache, else any post's (the translation often has it), else the post title
    const title = post.videoTitles[id] || videoTitles.get(id) || post.title;
    return `<figure data-youtube="${id}"><a href="https://www.youtube.com/watch?v=${id}">${escapeHtml(title)}</a></figure>`;
  });
  // headings outside the article scale
  out = out.replace(/<(\/?)h1\b/g, (a, s) => (report.h1++, `<${s}h2`)).replace(/<(\/?)h[56]\b/g, '<$1h4');
  // links: unwrap Check Point protection, make same-site links root-relative
  out = out.replace(/href="([^"]*)"/g, (all, href) => {
    let h = decode(href);
    const cp = h.match(/^https?:\/\/protect\.checkpoint\.com\/v2\/(?:r\d+\/)?___(.+?)___\./);
    if (cp) {
      h = cp[1].replace(/^(https?:)\/(?!\/)/, '$1//'); // the wrapper collapses "https://" to "https:/"
      report.unwrapped++;
    }
    if (h.startsWith(SITE + '/') || h === SITE) {
      h = h.slice(SITE.length) || '/';
      report.relativised++;
    }
    return `href="${escapeHtml(h)}"`;
  });
  // links to a media attachment page (the Arabic posts link the word "patients" to the favicon's page): keep the text only
  out = out.replace(/<a\b[^>]*href="\/(?:ar\/)?cambridge-hospital-favicon\/?"[^>]*>([\s\S]*?)<\/a>/g, (_, t) => (report.attachmentLinks = (report.attachmentLinks ?? 0) + 1, t));
  return out.trim();
}

function excerptOf(html) {
  for (const m of html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)) {
    const t = text(m[1]).replace(/ /g, ' ').trim();
    if (!t) continue;
    if (t.length <= EXCERPT_MAX) return t;
    report.excerptCut++;
    const cut = t.slice(0, EXCERPT_MAX + 1);
    return cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:.!?–-]+$/, '') + '...';
  }
  return '';
}

// ---------- pair Arabic posts with the English slug ----------
const en = rawPosts.filter((p) => p.language === 'en');
const enBySlug = new Map(en.map((p) => [p.name, p]));
const enByDate = new Map();
for (const p of en) enByDate.set(p.date, [...(enByDate.get(p.date) ?? []), p]);

function slugFor(p) {
  if (p.language === 'en') return p.name;
  if (enBySlug.has(p.name)) return p.name;
  const sameDate = enByDate.get(p.date) ?? [];
  if (sameDate.length === 1) {
    report.slugPairedByDate.push(`${p.title} -> ${sameDate[0].name}`);
    return sameDate[0].name;
  }
  const own = decodeURIComponent(p.name).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
  report.unpaired.push(`${p.title} (${p.link}) -> ${own}`);
  return own;
}

// ---------- build records ----------
const posts = [];
for (const p of rawPosts) {
  const slug = slugFor(p);
  const cats = p.categories.filter((c) => c !== 'latest-posts');
  const category = cats[0] ?? p.categories[0] ?? '';
  const att = p.thumb ? attachments.get(p.thumb) : undefined;
  if (p.thumb && !att) report.missingAttachment.push(`${p.language} ${slug}: attachment ${p.thumb}`);
  if (!att) report.noImage.push(`${p.language} ${slug}`);
  // WPML duplicates the featured image for a translation (same file uploaded again as "<name>-1.ext"): one key per slug
  // unless the Arabic file is really another picture.
  let image = att ? `news/${slug}` : '';
  let source = att?.url ?? '';
  if (p.language === 'ar' && att) {
    const enAtt = enBySlug.get(slug)?.thumb ? attachments.get(enBySlug.get(slug).thumb) : undefined;
    const name = (u) => decodeURIComponent(u.split('/').pop()).toLowerCase();
    const dup = name(att.url).replace(/-\d+(?=\.[a-z0-9]+$)/, ''); // "<name>-1.ext" -> "<name>.ext"
    if (enAtt && name(att.url) !== name(enAtt.url) && dup !== name(enAtt.url)) {
      image = `news/${slug}-ar`;
      report.arOwnImage.push(`${slug}: ${enAtt.url.split('/').pop()} | ${att.url.split('/').pop()}`);
    } else if (enAtt) source = enAtt.url;
  }
  const body = transformBody(p.content, p);
  posts.push({
    slug,
    old_url: new URL(p.link).pathname,
    title: p.title,
    date: p.date.slice(0, 10),
    category,
    excerpt: excerptOf(body),
    body,
    image,
    image_source: source,
    image_alt: att?.alt ?? '',
    region: 'global',
    language: p.language,
  });
}

// English first per date (newest first), stable for the same date
posts.sort((a, b) => b.date.localeCompare(a.date) || a.language.localeCompare(b.language) || a.slug.localeCompare(b.slug));

// ---------- checks ----------
const seen = new Set();
for (const p of posts) {
  const k = `${p.slug}|${p.language}`;
  if (seen.has(k)) throw new Error(`duplicate record ${k}`);
  seen.add(k);
  if (!/^[\p{L}\p{N}-]+$/u.test(p.slug)) throw new Error(`bad slug "${p.slug}"`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date)) throw new Error(`bad date on ${k}`);
  if (!p.category) throw new Error(`no category on ${k}`);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(posts, null, 2) + '\n');

// ---------- report ----------
const count = (f) => posts.reduce((m, p) => ((m[f(p)] = (m[f(p)] ?? 0) + 1), m), {});
const byCat = count((p) => `${p.category} (${p.language})`);
const dates = posts.map((p) => p.date).sort();
const list = (arr) => (arr.length ? arr.map((x) => `- ${x}`).join('\n') : '- none');
const md = `# News import report

Generated by \`tools/import-wp-news.mjs\` from \`${path.basename(SRC)}\` on ${new Date().toISOString().slice(0, 10)}.
Output: \`${OUT}\` (${posts.length} records: ${posts.filter((p) => p.language === 'en').length} English, ${posts.filter((p) => p.language === 'ar').length} Arabic; ${new Set(posts.map((p) => p.slug)).size} article slugs). Dates ${dates[0]} to ${dates[dates.length - 1]}.

## Per category and language
${Object.entries(byCat).sort().map(([k, v]) => `- ${k}: ${v}`).join('\n')}

## Transformations
- YouTube embeds turned into click-to-play facades: ${report.videos}
- Excerpts generated from the first paragraph (none in the export); cut at ${EXCERPT_MAX} characters: ${report.excerptCut}
- Links to cambridgehospital.com made root-relative: ${report.relativised}
- Check Point "protect" link wrappers unwrapped: ${report.unwrapped}
- h1 inside a body turned into h2: ${report.h1}

## Arabic posts paired with the English slug by date (Arabic post_name)
${list(report.slugPairedByDate)}

## Arabic posts that could not be paired (own slug, no language switch)
${list(report.unpaired)}

## Arabic posts with their own featured image (key news/<slug>-ar)
${list(report.arOwnImage)}

## Posts without a featured image
${list(report.noImage)}

## Featured image attachment missing from the export
${list(report.missingAttachment)}

## Embeds that are not YouTube (left as a link)
${list(report.nonYoutubeEmbeds)}
`;
fs.writeFileSync(REPORT, md);
console.log(md);
