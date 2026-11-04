# Dashboard: manual 301 redirects and preview before publish

Date: 2 Nov 2026. Nothing committed or deployed. Dashboard = `tools/admin/` (SEO & GEO dashboard). Two spec behaviours that
were missing: the redirect manager (only the automatic redirect of a renamed post existed) and a preview of a post before it
is published (a post could only be seen after a full publish, which takes the whole build cycle).

## Manual 301 redirects (Settings > Redirects)

- **Data**: `src/data/redirects.json` (`redirects: [{ from, to, note, added }]`), schema `src/lib/redirects-schema.ts` (zod,
  shared by the build and the service; the build stops on a bad file like it does for a bad post).
- **Build**: `src/lib/redirects.ts manualRedirects()` is merged FIRST in `allRedirects()`, so a manual rule wins over a
  generated one for the same old address (the dedupe keeps the first). Everything downstream is unchanged: `dist/_redirects`
  (both slash forms, Arabic hex twins), `vercel.json`, the Azure page server, the nginx map. Checked on the dev server's
  `/_redirects/`: a manual `/events` rule replaced the generated one at the top of the file.
- **Service** (`tools/admin/server.ts`): `GET` / `PUT /api/admin/settings/redirects`, the whole list at once like robots. Each
  rule is normalised (`normalizeRedirect`: a pasted full address of this site -> its path; source without trailing slash,
  percent-encoded uppercase as browsers send it; page target with the trailing slash, bug 057; external `https://` target
  allowed) and validated; then the list as a whole: a source listed twice, a target that is itself a source (no chains), old =
  new, and a source that is the address of a published / scheduled post in any edition / language (the page would vanish; the
  editor's "Web address" renames a post and `previous_slugs` makes that redirect). Errors come back per row and field
  (`redirects.<i>.from`). The answer also lists the automatic redirects of renamed posts, read-only. `added` is kept for a rule
  that stays; a version copy goes to `.admin/versions/settings/redirects-<time>.json`.
- **UI** (`tools/admin/ui/settings.tsx`): Settings is now AI crawlers + Redirects (each with its own Save and its own
  unsaved-changes hold on Publish). Rows: old address -> new address, note, "Added <date>", remove; an empty row is dropped
  on save; the server's row errors are listed and the field outlined. The automatic redirects open under a summary line.

## Preview before publish

- **Approach**: the site is static and a build takes `PUBLISH_MINUTES`, so the preview is Astro's dev server, which renders
  a page from the files on disk in about a second. The admin service starts it on demand (`PREVIEW_COMMAND`, default
  `npx --no-install astro dev --host 127.0.0.1 --port $PREVIEW_PORT --ignore-lock`, in `CONTENT_ROOT`, its own process
  group) with `ASTRO_BASE=/admin/preview` (astro.config.mjs: pages and `/_image` under that base, the only path Caddy sends
  to the service; HMR off) and `NEWS_PREVIEW=true` (`src/lib/news.ts isLive`: every status counts as live), proxies
  `GET /admin/preview/*` to it behind the session (no session -> 302 to the sign-in page), stops it after
  `PREVIEW_IDLE_MINUTES` (20) idle, when the service stops, and when content files are added / renamed / removed.
- **Measured (2 Nov 2026)**: a post page renders 1–2 s after start (dev server ready in ~300 ms); ~940 MB RSS while it runs
  (hence the idle stop). An edit to a saved post shows on the next load (Vite invalidates the eager glob). A NEW file is
  NOT seen until the dev server restarts (Astro caches `getStaticPaths`; a change to another post does not clear it; touching
  `src/lib/news.ts` does), so the service stops the dev server on create / rename / delete / restore-of-new / image upload
  (`previewInvalidate`), ~3 s at the next preview. Astro applies `base` to its pages and `/_image` but not to Vite's URLs
  (`/@vite/client`, `/@fs/...` for SVGs, `/src/...` scripts and styles, `/@id`, `/node_modules` imports inside JS); setting
  `vite.base` as well made every page 404. The proxy therefore rewrites those prefixes in HTML / CSS / JS bodies
  (`(["'(=])/(@vite|@fs|@id|src|node_modules)/`) and fetches them from the dev server's root. `/fonts/*` in the site CSS
  stays absolute and is served by the admin service itself. A "Preview · not published" badge is injected before `</body>`.
  Responses carry `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow`, `X-Frame-Options: DENY`.
- **UI**: "Preview" in the editor header (disabled with "Save first" while there are unsaved changes; previews the Arabic
  version from the Arabic tab) and in the list for posts that are not live; the Publish card says so. The link is the post's
  first edition (Global, UAE, KSA order): `/admin/preview[/ae|/sa][/ar]/media-hub/<slug>/`.
- **VM**: `deploy/vm/cambridge-admin.service` sets `PREVIEW_PORT` / `PREVIEW_IDLE_MINUTES`; the checkout has `node_modules`
  (`admin-update.sh`), nothing else to install. Memory: the VM needs ~1 GB free beside a running build for a preview during
  a publish. Locally: `npm run admin` as before; the preview uses port 4330 (the developer's own `astro dev` on 4321 is
  unaffected, `--ignore-lock`).

## Tests
- `npm run test:admin`: redirects (empty + automatic list; each refusal names its row; normalisation, empty row dropped, note
  trimmed, added date kept, version copy; the written file passes the build schema; the repo file too) and preview (no session
  -> 302 and nothing started; the stand-in dev server is started, waited for and proxied with the env it needs; URL
  rewriting in HTML, CSS and JS; images, 301s and 404s pass through; a new post stops it and the next request restarts it; a
  save keeps it; a command that exits -> 503 page with its output; closing the service stops it).
- `npm run test:news`: `src/data/redirects.json` shape.
