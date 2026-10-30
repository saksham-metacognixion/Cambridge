# Azure App Service deployment

> Not in use: App Service could not be created on this subscription (quota 0 in UAE North, October 2026).
> Production runs on a VM: `deploy/vm/README.md`. The server (`tools/azure/`) is the same.

The site is the static Astro build (`dist/`) plus one Node program, `dist-server/server.mjs`, that App Service runs. The
program serves the pages and does what Cloudflare Pages / Vercel do on their own:

| Request | Handled by |
|---|---|
| Page or file | `dist/`, `/<path>/` -> `<path>/index.html`, cache headers from `dist/_headers` |
| Page URL without its slash | 301 to `/<path>/` |
| Old live-site URL (1,692 rules) | 301 from `dist/_redirects`, one hop |
| Unknown URL | 404 with the edition's own 404 page (`/ae/ar/404.html` ...) |
| `POST /api/forms/<form>` | The shared form handler, `functions/api/forms/[form].ts` (Turnstile + email) |
| Country pop-up cookie | The shared middleware, `functions/_middleware.ts` |

Source: `tools/azure/` (handler, Node adapter, entry). Tests: `npm run test:azure`. Local run: `npm run build:azure && npm start`
(port 8080, env from your shell).

## 1. App Service

Azure Portal > App Services > Create > Web App:

- Publish: **Code**. Runtime stack: **Node 22 LTS**. Operating system: **Linux**. Region: UAE North.
- After creation, Configuration > General settings:
  - Startup Command: `node dist-server/server.mjs`
  - Always on: On
  - SCM Basic Auth Publishing Credentials: On (needed by the publish profile below)
- Health check (Monitoring > Health check): path `/`.

## 2. Application settings (Configuration > Application settings)

Read at run time; a change restarts the app, no rebuild. Full descriptions in `.env.example`.

| Name | Value |
|---|---|
| `EMAIL_PROVIDER` | `smtp` |
| `SMTP_HOST` / `SMTP_PORT` | e.g. `smtp.gmail.com` / `587` |
| `SMTP_USER` / `SMTP_PASS` | The mailbox and its password (Gmail: an App Password) |
| `MAIL_FROM` | Sender; defaults to `SMTP_USER` for smtp |
| `TURNSTILE_SECRET_KEY` | Pairs with `PUBLIC_TURNSTILE_SITE_KEY` below |
| `FORM_TO_BOOK_APPOINTMENT`, `FORM_TO_SEND_ENQUIRY`, `FORM_TO_FEEDBACK`, `FORM_TO_REFER_PATIENT`, `FORM_TO_NEWSLETTER`, `INTERNATIONAL_INBOX` | Inbox per form |
| `ALLOWED_ORIGINS` | Only if forms are posted from a host other than the one the app sees (see section 4) |

Never set `LOCAL_DEV` here.

## 3. GitHub Actions (`.github/workflows/azure-app-service.yml`)

Every push to `main` tests, builds and deploys. Repository Settings > Secrets and variables > Actions:

| Kind | Name | Value |
|---|---|---|
| Variable | `AZURE_WEBAPP_NAME` | The App Service name. The workflow is skipped until this is set |
| Secret | `AZURE_WEBAPP_PUBLISH_PROFILE` | App Service > Overview > Download publish profile (file contents) |
| Variable | `PUBLIC_TURNSTILE_SITE_KEY` | Turnstile site key (build time, public) |
| Variable | `PUBLIC_GOOGLE_MAPS_KEY` | Maps JavaScript API browser key, restricted to the site's domains (build time, public) |

Use the workflow in this repo, not the one Deployment Center generates: that one deploys the repository and lets App
Service build it, which does not produce `dist-server/`.

## 4. Custom domain, Front Door, DNS

The form handler checks the browser's `Origin` against the host the app receives, and its no-JavaScript redirect goes
back to that host. So the visitor's host name must reach the app unchanged:

- App Service alone: add the domain under Custom domains (+ managed certificate).
- With Azure Front Door in front: add the domain to Front Door **and** to the App Service (with its managed certificate), and leave the origin host header
  empty in the Front Door origin, so the original host is forwarded. Otherwise the app sees `<app>.azurewebsites.net`
  and refuses form posts from the real domain (403 `origin`).

The production domain in `site.config.mjs` is `https://cambridgehospital.com` (no `www`): canonical, hreflang and sitemap
URLs use it. GoDaddy cannot point the bare domain at Front Door or App Service with a CNAME: either move the DNS zone to
Azure DNS, or serve the bare domain with an A record to the App Service IP and `www` by CNAME.

Go-live: set `INDEXABLE = true` in `site.config.mjs` (staging keeps every page `noindex`) and push.

## Country pop-up

The middleware reads the visitor's country from Cloudflare's or Vercel's header (`functions/_lib/geo.ts`). Neither
App Service nor Front Door sends those headers, so on Azure no country is detected and no pop-up is shown (the documented
behaviour for an unknown country). Supporting an Azure-provided country needs a decision first.

## Order of work

1. Back up the WordPress VM (disk snapshot + database export). Leave it running.
2. App Service + settings + GitHub variables; deploy; test on `https://<app>.azurewebsites.net/`.
3. Custom domain (and Front Door), certificates.
4. `INDEXABLE = true`, DNS switch in GoDaddy.
5. After a stable period, delete the old resource group.
