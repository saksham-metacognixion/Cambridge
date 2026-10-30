# cambridgehospital.com: security, backup and data-protection controls

Status: 30 October 2026. Prepared for the client's security review of the website hosting and management arrangement.
Each control names where it is implemented in this repository, so it can be verified rather than taken on trust.
Items marked **planned** are built but not yet running on the production server (they need server access to install).

## 1. What the website is

- A static website (Astro) built from files in this repository: no WordPress, no CMS database, no plugins. Pages are
  generated at build time and served as files; there is no code executing per visitor on the page server except a small
  Node process that serves those files and handles form submissions.
- Hosted on a Microsoft Azure virtual machine (Ubuntu 24.04 LTS, UAE North region), behind Cloudflare. Visitors never
  connect to the server directly: Cloudflare terminates HTTPS, filters traffic and forwards to the server over HTTPS.
- Editorial dashboard for Blog / PR posts (`/admin`): one named superadmin account; writes content files on the server
  and rebuilds the site. No visitor data passes through it.

## 2. Data protection

| Control | Where |
|---|---|
| **No personal data is stored.** Form submissions (appointments, enquiries, referrals, feedback, newsletter) are emailed to the hospital's inbox and discarded; no database, no logs of submitted content, no third-party form service that keeps copies. | `functions/_lib/`, `tools/azure/handler.ts`; policy in `CLAUDE.md` section 8 |
| Request bodies are never written to logs (site and dashboard). | `tools/azure/`, `tools/admin/server.ts` |
| Spam and bot protection on every form (Cloudflare Turnstile, server-side verification). | `functions/_lib/turnstile.ts` |
| Each form has a consent checkbox and privacy-policy link; required-field validation server-side. | `src/components/forms/` |
| Secrets (SMTP, Turnstile secret) only in environment files on the server, root-only (`/etc/cambridge-web.env`, mode 600); none in the repository (`.env.example` holds names only). | `deploy/vm/cambridge-web.env.example`, `.gitignore` |
| Visitor region detection uses Cloudflare's country header and a first-party cookie (`ch_geo`, `ch_edition`); no IP addresses are stored. | `src/components/CountryPopupLogic.astro` |
| Analytics / tracking: none installed (pending the client's decision on Google Analytics and a consent banner). | `CLAUDE.md` section 13 |

## 3. Network and transport security

| Control | Where |
|---|---|
| HTTPS everywhere: Cloudflare edge certificate for visitors; Cloudflare to origin in **Full (strict)** mode with a Cloudflare Origin Certificate on the server (valid to 2041). HTTP redirects to HTTPS. | `deploy/vm/Caddyfile`, `deploy/vm/README.md` section 6 |
| Cloudflare in front of the origin: DDoS protection, WAF, bot management, caching. Only Cloudflare's published IP ranges are trusted for the visitor's IP (`trusted_proxies`). Recommended (client's Cloudflare account): restrict the VM's inbound 80/443 to Cloudflare IPs. | `deploy/vm/Caddyfile` |
| `X-Content-Type-Options: nosniff` on every response. **Gap found in this review (30 Oct 2026):** `Strict-Transport-Security`, `Content-Security-Policy`, `Referrer-Policy`, `Permissions-Policy` and `X-Frame-Options` are not yet sent. HSTS can be switched on in Cloudflare today (SSL/TLS > Edge Certificates); the others are a small change in the page server, proposed as the first item under the maintenance contract. | `tools/azure/handler.ts` |
| Form endpoint accepts only requests from the site's own origin (`ALLOWED_ORIGINS`), bounded body size (32 KB, larger only for the one form with an attachment), attachment type / size / magic-bytes checks. | `functions/api/forms/[form].ts` |

## 4. Server hardening (Azure VM)

| Control | Where |
|---|---|
| SSH: key-based only, password login disabled (Azure default). Two accounts: `cambridge` (runs the site, no shell login) and `deploy` (uploads releases; may run exactly one privileged command: restart the site). | `deploy/vm/setup.sh` |
| The site process runs as an unprivileged user under systemd with `NoNewPrivileges`, `ProtectSystem=strict`, `ProtectHome`, `PrivateTmp`, `PrivateDevices`, kernel protections. | `deploy/vm/cambridge-web.service` |
| Operating-system security updates install automatically (Ubuntu unattended-upgrades). | `deploy/vm/README.md` Operations |
| Node.js 22 LTS; dependencies locked (`package-lock.json`) and installed with `npm ci`; `npm audit` available in CI. | `package.json`, `.github/workflows/deploy-vm.yml` |
| Deployments only from GitHub Actions on push to `main`: tests must pass, the server's SSH host key is pinned (`VM_KNOWN_HOSTS`), the deploy key is a GitHub secret. Every release is kept (5 newest) and a release that fails its health check rolls back automatically. | `.github/workflows/deploy-vm.yml`, `deploy/vm/activate.sh` |
| No production change without explicit approval (project rule). | `CLAUDE.md` section 15 |

## 5. Dashboard (`/admin`) security

| Control | Where |
|---|---|
| One superadmin; password stored only as a scrypt hash (never the password); session = HMAC-signed cookie, `HttpOnly`, `Secure`, `SameSite=Strict`, 12-hour expiry. | `tools/admin/server.ts` |
| Login rate limit: 5 failed attempts per IP = 15 minutes blocked. | `tools/admin/server.ts` |
| CSRF guard on every write (custom header required) on top of `SameSite=Strict`. | `tools/admin/server.ts` |
| Every save is validated against the content schema; invalid content never reaches the site. Article HTML is sanitised at build time with an allow-list (no scripts, iframes, event handlers). | `src/lib/news-schema.ts`, `src/lib/sanitize.ts` |
| Uploaded images are re-encoded (never served as uploaded), size-limited (15 MB in, under 200 KB out). | `tools/admin/server.ts` |
| Every change keeps the previous version (restore from the UI); deletions keep a copy. | `.admin/versions/` |
| The dashboard process runs as the unprivileged `cambridge` user, bound to localhost; reachable only through Cloudflare + Caddy. Recommended: Cloudflare Access in front of `/admin*` (login restricted to the superadmin's email). **Planned** on production. | `deploy/vm/cambridge-admin.service`, `deploy/vm/Caddyfile` |
| Automated tests cover authentication, rate limiting, CSRF, validation, versions, uploads (26+ checks, run on every deploy). | `tests/admin-server.test.mjs` |

## 6. Backup and recovery

| Control | Where |
|---|---|
| The whole website is reproducible from the Git repository (GitHub, private) plus the content files: a new server can be rebuilt from scratch with `setup.sh` + one deploy. | `deploy/vm/README.md` |
| Releases: the 5 most recent builds stay on the server; roll back = one command. | `deploy/vm/activate.sh` |
| Editorial content (posts, authors, images, version history): nightly archive on the server (30 kept) and, when configured, a copy to Azure Blob Storage. **Planned** (installed by `setup.sh` with the dashboard). | `deploy/vm/backup.sh`, `cambridge-backup.timer` |
| Content also flows back into the repository on every deploy (`fetch-content.sh`), so GitHub holds a current copy. **Planned**. | `.github/workflows/deploy-vm.yml` |
| Recommended (client's Azure account): VM-level snapshot / Azure Backup policy for the disk. | Azure Portal |

## 7. Vulnerability management

- Dependency updates: `npm audit` and lockfile review as part of maintenance; Node LTS and OS packages patched
  automatically / on each deploy.
- No server-side application code processes visitor input except the form handler (validated, size-limited, Turnstile-gated)
  and the dashboard (authenticated, validated).
- Third-party code on pages: none (no tag managers, no external scripts); fonts and images are self-hosted. Maps: Google Maps
  JavaScript API on the Contact page only; the key should be restricted to the site's domains in the client's Google Cloud
  console (HTTP referrer restriction).
- Suggested cadence under the maintenance contract: monthly dependency review, quarterly review of Cloudflare WAF / bot
  settings, annual external vulnerability scan of the public domain (the static surface is small).

## 8. Incident response

- Monitoring: Cloudflare analytics and WAF events; server `journalctl` logs for the site and dashboard; a deploy health
  check that fails the pipeline and rolls back a bad release automatically.
- Response: the maintainer (Metacognixion) can roll back to any of the 5 previous releases in under a minute, rotate the
  dashboard password / session secret (one environment file + restart), block traffic at Cloudflare, or take the VM off
  the internet while the site stays reachable through Cloudflare's cache.
- Because no personal data is stored on the server, a server compromise does not expose patient or visitor data; the
  exposure would be limited to the website's own content and the SMTP credential (rotatable).
- Contact path, severity levels and response times: to be stated in the maintenance (AMC) contract.

## 9. Evidence the client can request or check

| Evidence | How |
|---|---|
| HTTPS / headers | `curl -I https://cambridgehospital.com/` or https://securityheaders.com, https://www.ssllabs.com/ssltest/ (today this will show the missing headers listed in section 3) |
| Cloudflare settings (TLS mode, WAF, bot rules) | Client's own Cloudflare account |
| Server configuration | This repository: `deploy/vm/` (units, Caddyfile, setup script), reviewable line by line |
| Tests passing on each deploy | GitHub Actions run log (`Deploy to Azure VM`) |
| Backups | `/srv/cambridge/backups/` listing on the VM; Azure Blob container |
| No stored submissions | Form handler source (`functions/_lib/`): email send only, no persistence layer in the project |
