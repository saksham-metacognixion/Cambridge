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
| Settings | `tools/admin/ui/settings.tsx` | AI crawlers (robots.txt) and the manual 301 redirects (see below) |
| Preview | `tools/admin/server.ts` (`/admin/preview/*`) | `astro dev` on demand behind the login: a saved post as the real page, no build (see below) |
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
- A post's `reviewer` is a different person from its `author` (`400`, field `reviewer`; the GEO check "Reviewed by a
  clinician" only passes for a second person).
- Writes need the `X-Requested-With: admin` header (CSRF guard) and the session cookie (HttpOnly, SameSite=Strict,
  Secure unless `LOCAL_DEV=true`, 12 h). Login: 5 wrong attempts per IP = 15 minutes blocked. Request bodies are never logged.
- Publish runs `PUBLISH_COMMAND` in `CONTENT_ROOT`, one at a time (a second request while one runs = `409 publish_running`).
  The UI polls its state every 5 s while the dashboard is open (2 s during a build), so a build started in another tab or
  by the scheduler shows as "Publishing…" everywhere; it refuses to start while an editor has unsaved changes (a build only
  sees saved files) and tells people a build takes `PUBLISH_MINUTES` (25) minutes.

## In the dashboard (UI)

- Leaving a post, author or Settings page with unsaved changes asks "You have unsaved changes. Leave without saving?"
  (Stay / Leave), for every dashboard link and the browser's Back / Forward inside the dashboard; a reload, a tab close or
  another site gets the browser's own warning. Nothing asks once the changes are saved.
- The Arabic version of a post is created by the first Arabic text typed, not by opening the tab; an Arabic version with
  nothing in it is left out on save, one with text but no title asks for the title.
- New posts: Blog shows the "Consult for a Care Plan" button; PR / News hides it and shows the whole photo in the hero
  (both languages). Switching the type moves these settings to the new type's default unless they were changed by hand.
- `logo.svg` / `favicon.svg` (copies of `src/assets/header/logo.svg` and `public/favicon.svg`) are part of the UI bundle.

## Preview before publishing

"Preview" (post editor header, and in the list for posts that are not live) opens the SAVED post as the real page, drafts,
scheduled and archived posts included, at `/admin/preview/<edition>/media-hub/<slug>/` (the post's first edition; the Arabic
tab previews the Arabic version). Behind the login only; nothing is published and nothing is indexed (`noindex`, `no-store`).
How: the service starts `astro dev` in `CONTENT_ROOT` the first time a preview is opened (`PREVIEW_COMMAND`, default
`npx --no-install astro dev --host 127.0.0.1 --port $PREVIEW_PORT --ignore-lock`, with `ASTRO_BASE=/admin/preview` and
`NEWS_PREVIEW=true`: astro.config.mjs puts the pages under that base, `src/lib/news.ts` treats every post as live) and
proxies `/admin/preview/*` to it; the first request waits for it (up to 20 s, then a "Starting…" page that reloads itself).
A page renders in about a second from the files on disk, so a change to a saved post shows at once. Astro reads the SET of
content files only at start, so the dev server is stopped when a post, author or image is added, renamed or deleted
(`previewInvalidate`) and starts again at the next preview request (a few seconds). It is stopped after
`PREVIEW_IDLE_MINUTES` (20) without a request and when the service stops; while it runs it takes about 1 GB of memory.
Vite's own URLs (`/@vite`, `/@fs`, `/src`, `/@id`, `/node_modules`) are not under the base: the proxy prefixes them in HTML /
CSS / JS bodies and strips the prefix again on the way in (setting Vite's `base` breaks the dev server's page routing).
Links inside the preview point at the live site, as on the page itself. A small "Preview · not published" badge is added.

## Redirects (Settings > Redirects)

Manual 301 redirects, old address -> new address, written to `src/data/redirects.json` (schema `src/lib/redirects-schema.ts`;
the build stops on a bad file). The build merges them FIRST into `dist/_redirects` (`src/lib/redirects.ts manualRedirects`),
ahead of the generated rules (old live-site URLs, renamed posts), so a manual rule wins for the same old address; every host
reads that file (Cloudflare, `vercel.json`, the Azure page server, nginx). Saved as a whole list (`GET` / `PUT
/api/admin/settings/redirects`), each rule normalised: a full address of this site becomes its path, the source loses its
trailing slash and is percent-encoded as browsers send it (an Arabic path pastes fine), a page target gets the slash every
page URL ends in; the target may be a full `https://` link elsewhere. Refused with the row and field named: a source that is
not a path (query, `*`, the home page), a target that is itself redirected (no chains), the old and new address the same, a
source listed twice, and the address of a published / scheduled post (rename the post instead: `previous_slugs` makes that
redirect by itself; those automatic ones are listed read-only under the manual list). A rule keeps the date it was added;
every save keeps the previous file under `.admin/versions/settings/`. Changes reach the website on the next Publish.

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
