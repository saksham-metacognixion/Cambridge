# News posts

Since 30 Oct 2026 every post is **one file**, `src/content/news/<slug>.json`, read and validated by `src/lib/news.ts`
(schema with field notes: `src/lib/news-schema.ts`). The SEO & GEO dashboard writes these files; the build reads them.
A file that breaks the schema stops the build with its name and the field.

```json
{
  "slug": "...", "date": "YYYY-MM-DD", "category": "health-articles", "type": "blog", "status": "published",
  "editions": ["global", "ae", "sa"], "image": "news/<slug>",
  "en": { "title": "...", "excerpt": "...", "body": "<p>...</p>", "image_alt": "", "old_url": "/<slug>/",
          "seo": { "title": "... | Cambridge Hospital", "description": "..." } },
  "ar": { "...the Arabic version, same fields..." }
}
```

- Top level = what both languages share (date, category, `type` blog / pr, `status`, `editions`, featured image, author,
  reviewer, `previous_slugs`, `noindex`). `en` is required; `ar` absent = the English text is shown on the Arabic editions.
- `seo.title` / `seo.description` = `<title>` and meta description of the article page (for migrated posts the live site's
  values, formerly in `src/data/seo.json`). Absent = the template pattern (`content/article/page.*.json` meta) / the excerpt.
- Only live posts are built: `published`, or `scheduled` once `publish_at` (else `date`) has passed. `editions` decides which
  Media Hubs list the post and where its article page exists.
- `old_url` (per language) and `previous_slugs` feed the 301 map (`src/lib/redirects.ts`).
- `body` is article HTML, sanitised at build (`src/lib/sanitize.ts`: p, h2-h4, ul/ol/li, a, strong/em, br, img, figure,
  blockquote, table). A list item starting `<strong>Lead:</strong>` renders the teal lead line; a YouTube embed is
  `<figure data-youtube="<id>"><a href>title</a></figure>` (click-to-play poster, `ArticleVideo.astro`); a photo in the text
  is `<figure data-image="<asset key>"><img alt="..."></figure>` (`ArticleImage.astro`).
- `image` = key under `src/assets` without extension, one file per post shared by both languages; `image_alt` falls back to
  the title when empty. `hero_button: false` hides the hero button; `hero_photo: "full"` shows the whole photo on desktop.
- GEO fields (`focus_keyword`, `key_takeaways`, `faqs`, `sources`, `canonical`) live under each language; `author` /
  `reviewer` at the top level. Migrated posts do not have them yet.

## History

- 129 posts (EN + AR) were imported from the WordPress export of the old site on 6 Oct 2026 (`tools/import-wp-news.mjs`
  -> `posts.json`; report `docs/news-import.md`; images `tools/download-news-images.mjs`). Two press releases written for this
  site followed in `site-posts.json` (21-23 Oct 2026).
- On 30 Oct 2026 `tools/migrate-news.mjs` split both files into the per-post files above, moved each post's `<title>` /
  meta description from `seo.json` into `en.seo` / `ar.seo`, and set `type` / `status` / `editions` on every post. Every
  other value was copied unchanged; a page-by-page comparison of the build before and after showed no difference. The old
  files stay in git history (commit before the migration).

`sample-images.json`: TEMPORARY photos for posts whose featured image file is missing (NW1). `src/data/news.json` is a
different file: the three Home "News & Insights" cards with their Figma text and crops; their slugs point at posts.
