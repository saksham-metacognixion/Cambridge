# News posts (`posts.json`)

One flat array, one record per post per language. **Generated** from the WordPress export of the current site
(`docs/cambridgehospital.WordPress.2026-10-05 (1).xml`, 129 posts in English + their 129 Arabic translations) by

```
node tools/import-wp-news.mjs            # XML -> posts.json + docs/news-import.md (report)
node tools/download-news-images.mjs --browser   # featured images + YouTube posters -> src/assets
```

Do not edit `posts.json` by hand: re-run the import on a new export (and keep the download script's rule: existing
files are never overwritten). What the import does with each field is documented at the top of the script.

| field | notes |
|---|---|
| slug | URL slug of the article = the English `post_name`. The Arabic translation of a post has the SAME slug (that is how the language switch finds it) |
| old_url | path of the post on the current site (`/slug/`, `/ar/slug/`), feeds the 301 map `/redirects-news.txt` |
| title, excerpt | plain text. The export has no excerpts: the excerpt is the first paragraph, cut at 160 characters with "..." (empty for the video-only interviews) |
| date | `YYYY-MM-DD` (post date, site time) |
| category | `events`, `conferences`, `press-releases`, `health-articles` (keys of the Media Hub dropdown) or `interviews` (7 TV interviews; not in the dropdown, docs/open-decisions.md NW2) |
| body | HTML of the article. Sanitised at build time (`src/lib/sanitize.ts`: p, h2-h4, ul/ol/li, a, strong/em, br, img, figure, blockquote, table; everything else is dropped). A list item that starts with `<strong>Lead:</strong>` renders the teal lead line of the Figma layout. A YouTube embed is `<figure data-youtube="<id>"><a href>title</a></figure>` and renders as a click-to-play poster (`src/components/article/ArticleVideo.astro`). Page: `media-hub/<slug>` in every edition (`NEWS_PATHS`, `src/lib/news.ts`); empty body = "Content pending" on staging |
| image | key under `src/assets` without extension: `news/<slug>` (the featured image; one file per slug, shared by both languages) |
| image_source | URL of the featured image on the current site (input of the download script) |
| image_alt | the attachment's alt text on the current site; falls back to the title when empty |
| region | `global` for every post (the export has no region; every edition lists all posts, D15) |
| language | `en` or `ar`. An edition uses its language's record for a slug, and falls back to the English record |
| image_crop | optional, Figma placeholder only (unused since the import): `{h,l,t,w}` crop copied from Figma |

`src/data/news.json` is a different file: the three Home "News & Insights" cards with their Figma text and crops; their
slugs point at posts of this file so "Read more" opens the article.
