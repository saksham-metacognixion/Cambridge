# News posts (`posts.json`)

One flat array, one record per post per language. PLACEHOLDER: the 3 posts shown on the Figma Media Hub page.
Replace the file with Pramod's export (~259 posts); no code change is needed.

| field | notes |
|---|---|
| slug | URL slug of the article |
| old_url | path of the post on the current site (for 301 redirects) |
| title, excerpt | plain text |
| date | `YYYY-MM-DD` |
| category | `health-articles`, `events`, `conferences` or `press-releases` (keys of the Media Hub dropdown) |
| body | sanitized HTML of the article (used by the article page, not built yet) |
| image | key under `src/assets` without extension, e.g. `news/my-post`. Download with `node tools/download-news-images.mjs` |
| image_source | optional: URL of the image on the current site (input of the download script) |
| image_alt | falls back to the title when empty |
| region | `global`, `ae` or `sa` (kept for later; every edition currently lists all posts) |
| language | `en` or `ar`. An edition uses its language's record for a slug, and falls back to the English record |
| image_crop | optional, Figma placeholder only: `{h,l,t,w}` crop copied from Figma. Real posts use object-fit: cover |
