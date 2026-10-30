# Dashboard (SEO & GEO): admin service + UI

One superadmin edits Blog / PR posts and Authors at `/admin`; every save writes the content files the site is built from
(`src/content/news/<slug>.json`, `src/content/authors/<slug>.json`), and **Publish site** rebuilds the site. No database,
no GitHub account for the client: the files are the content, the build validates them (`src/lib/news-schema.ts`,
`src/lib/authors-schema.ts`), and every change keeps the previous version under `.admin/versions/` (restore from the UI).

| Part | File | Notes |
|---|---|---|
| Service | `tools/admin/server.ts` | Node, no framework. Login, session cookie, JSON API under `/api/admin`, static UI, publish |
| UI | `tools/admin/ui/` (preact, plain CSS) | Login, posts list + editor (EN / AR, SEO, GEO, score, Google preview), authors |
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

## On the Azure VM (next step, deploy/vm/)

A second systemd unit (`cambridge-admin`, port 8788, `HOST=127.0.0.1`) in a repo checkout with `node_modules`; Caddy
routes `/admin*` and `/api/admin*` to it; `PUBLISH_COMMAND` builds there and switches the release (`deploy/vm/activate.sh`);
a nightly job copies `src/content` + `.admin` to Azure Blob. Not set up yet: needs the VM access.

## Not built yet

Image upload (WebP ≤ 200 KB) from the dashboard, a rich-text editor for the article body (HTML today), the visible GEO
blocks + author page on the site (templates), scheduled-publish cron, Azure wiring.
