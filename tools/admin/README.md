# Dashboard (SEO & GEO): admin service + UI

One superadmin edits Blog / PR posts and Authors at `/admin`; every save writes the content files the site is built from
(`src/content/news/<slug>.json`, `src/content/authors/<slug>.json`), and **Publish site** rebuilds the site. No database,
no GitHub account for the client: the files are the content, the build validates them (`src/lib/news-schema.ts`,
`src/lib/authors-schema.ts`), and every change keeps the previous version under `.admin/versions/` (restore from the UI).

| Part | File | Notes |
|---|---|---|
| Service | `tools/admin/server.ts` | Node, no framework. Login, session cookie, JSON API under `/api/admin`, static UI, publish |
| UI | `tools/admin/ui/` (preact, plain CSS) | Login, posts list + editor (EN / AR, SEO, GEO, score, Google preview), authors |
| Article editor | `tools/admin/ui/editor.tsx` | Rich text (headings, bold, italic, links, lists, quote, photo, YouTube) with an HTML view; see below |
| Checks | `tools/admin/ui/checks.ts` | The spec's focus-keyword rules + GEO checks, warnings only |
| Bundle | `tools/admin/bundle.mjs` -> `dist-admin/` | `npm run admin:bundle`; `npm run admin` bundles and starts |
| Tests | `tests/admin-server.test.mjs` | `npm run test:admin` (in `npm test`): the API over real HTTP against a temp copy |

## Run it locally

```bash
node tools/admin/hash-password.mjs 'a password of 12+ characters'   # prints ADMIN_PASSWORD_HASH=...
# .env: ADMIN_EMAIL, ADMIN_PASSWORD_HASH, ADMIN_SESSION_SECRET (openssl rand -hex 32), LOCAL_DEV=true,
#       ADMIN_SITE_URL=http://localhost:4321 (the "View" links), PUBLISH_COMMAND=npm run build
set -a; . ./.env; set +a; npm run admin          # http://localhost:8788/admin
npm run preview                                   # the built site, after a Publish
```

## Rules the service enforces

- Every save is validated with the build's schema; errors come back per field and nothing is written.
- A published / scheduled post with a featured image needs alt text (spec section 2). Drafts can be saved without it.
- Renaming a post's web address keeps the old one: it is added to `previous_slugs` and 301s to the new URL.
- Delete asks for the web address to be typed and keeps a copy under `.admin/versions/<kind>/<slug>/…-deleted.json`.
- An author named as `author` / `reviewer` on any post cannot be deleted.
- Writes need the `X-Requested-With: admin` header (CSRF guard) and the session cookie (HttpOnly, SameSite=Strict,
  Secure unless `LOCAL_DEV=true`, 12 h). Login: 5 wrong attempts per IP = 15 minutes blocked. Request bodies are never logged.
- Publish runs `PUBLISH_COMMAND` in `CONTENT_ROOT`, one at a time; the UI polls its state and shows the log tail.

## Scheduled posts

Status "Scheduled" + "Goes live at": every `SCHEDULE_CHECK_SECONDS` (60) the service looks for scheduled posts whose time
has passed, marks them published (a version copy is kept) and starts one build, so the post goes live on time without
anyone pressing Publish. The build itself also treats a scheduled post whose time has passed as live (`src/lib/news.ts`),
so even a build started for another reason carries it. The publish panel lists what is due next.

## On the Azure VM (deploy/vm/, "Dashboard")

A second systemd unit, `cambridge-admin` (port 8788, user `cambridge`), runs the bundle from `/srv/cambridge/admin`, a
checkout of the repository that `deploy/vm/deploy.sh` keeps up to date; Caddy routes `/admin*` and `/api/admin*` to it.
`PUBLISH_COMMAND` = `deploy/vm/publish.sh`: build there, new release, `activate.sh` (switch, health check, roll back).
The VM is the source of truth for posts, authors and their images: a GitHub deploy copies them into its build first
(`fetch-content.sh`). `cambridge-backup.timer` archives `src/content` + images + `.admin` nightly (30 kept, optionally to
Azure Blob). Wiring is written and syntax-checked; running it needs the VM access (`setup.sh` again, then a deploy).

## The article editor

The body is edited as rich text (a `contenteditable` area, no editor library) and stored as clean HTML: whatever the browser
or a paste from Word / Google Docs produces is rewritten by `serialize()` into the tags the build's sanitizer keeps
(`src/lib/sanitize.ts`: p, h2–h4, ul, ol, li, a[href], strong, em, br, blockquote, table, sup, sub). Styles, classes, spans,
scripts and unknown tags are dropped, their text kept; `<b>` / `<i>` / `<h1>` become `<strong>` / `<em>` / `<h2>`; a list or quote
Chrome nests inside a paragraph is split out. A migrated post that is opened and saved comes out byte-identical (checked on
the Oracle PR, the shoulder-pain article and a video post). Photo in the text: upload (same WebP rule, key
`news/<slug>-2`, `-3`, …) or, on the Arabic tab, reuse one from the English text; stored as the
`<figure data-image="key"><img alt></figure>` marker ArticleBody renders as an optimised Picture, the caption under the preview
is the alt text. Video: a YouTube link becomes the `<figure data-youtube="id"><a href>title</a></figure>` marker (click-to-play
facade). The "HTML" button shows the raw HTML for anyone who prefers it (tables are edited there).

## Not built yet

Arabic labels for the GEO blocks (from the client), the client's authors list.
Image upload is in: `POST /api/admin/upload/<posts|authors>/<slug>` converts to WebP under 200 KB (sharp: quality, then
width, stepped down until it fits; EXIF rotation applied), saves `src/assets/news/<slug>.webp` or `authors/<slug>.webp`,
moves an older file of the same name to `.admin/versions/images/`; `GET /api/admin/image/<key>` serves the preview. The GEO blocks (byline, key takeaways, FAQ, sources) and the author page are on the site since 30 Oct
2026 (src/components/article/Article*.astro, src/pages/[...base]/media-hub/author/).
