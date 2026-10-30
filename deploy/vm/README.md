# Azure VM deployment

Production runs on an Azure VM (Ubuntu 24.04, UAE North): App Service could not be created on this subscription
(App Service quota 0 in UAE North, October 2026; the App Service setup stays in `deploy/azure/` should that change).

```
Visitor ──► Cloudflare (HTTPS, CDN, country header) ──► Caddy :443 (Cloudflare Origin Certificate)
              └─► node dist-server/server.mjs on 127.0.0.1:8080   (systemd unit cambridge-web, user cambridge)
                    /srv/cambridge/current ──► /srv/cambridge/releases/<UTC time>-<commit>/   (the live one + 4 previous)

push to main ──► GitHub Actions (.github/workflows/deploy-vm.yml): npm test, npm run build:azure
             ──► deploy/vm/deploy.sh: rsync dist/ + dist-server/ as a new release over SSH (user deploy)
             ──► deploy/vm/activate.sh on the VM: switch current, restart, health check, roll back if it fails
```

The server is the same one App Service would run (`tools/azure/`): pages, redirects, 404s, forms, country cookie.

The dashboard (`tools/admin/`, one superadmin at `/admin`) runs next to it:

```
Caddy /admin*, /api/admin* ──► node dist-admin/admin-server.mjs on 127.0.0.1:8788   (systemd unit cambridge-admin, user cambridge)
   edits  /srv/cambridge/admin/src/content/{news,authors}/*.json  + src/assets/{news,authors}/   (a checkout of this repository)
   "Publish site" / a scheduled post ──► deploy/vm/publish.sh: npm run build:azure there ──► new release ──► activate.sh
GitHub deploy ──► fetch-content.sh (VM posts -> checkout) ──► build ──► deploy.sh: release + sync the source into /srv/cambridge/admin
nightly 02:30 UTC ──► cambridge-backup.timer: src/content + images + .admin -> /srv/cambridge/backups (30 kept) [+ Azure Blob]
```

**The VM is the source of truth for posts, authors and their images.** The client writes them in the dashboard; a GitHub
deploy first copies them into the build (`fetch-content.sh`) and only ever *adds* repository files to the VM, never
overwrites or removes one there. Add or change a post through the dashboard, not in the repository.

| File | Installed as |
|---|---|
| `setup.sh` | Run once (safe to re-run): Node 22, Caddy, users `cambridge` / `deploy`, sudoers, directories, units |
| `cambridge-web.service` | `/etc/systemd/system/cambridge-web.service` (the site) |
| `cambridge-admin.service` | `/etc/systemd/system/cambridge-admin.service` (the dashboard, port 8788) |
| `cambridge-backup.service` + `.timer` | Nightly content backup (`backup.sh`) |
| `Caddyfile` | `/etc/caddy/Caddyfile` (site + `/admin*`, `/api/admin*` routes) |
| `cambridge-web.env.example` | `/etc/cambridge-web.env` (root only; kept on re-run) |
| `cambridge-admin.env.example` | `/etc/cambridge-admin.env` (root only; kept on re-run): superadmin login, build keys |
| `deploy.sh`, `activate.sh` | Used by every deployment; `deploy.sh` also syncs the source into the dashboard's checkout and runs `admin-update.sh` |
| `fetch-content.sh` | Before a build: the dashboard's posts from the VM into the checkout (`npm run content:pull`) |
| `publish.sh` | The dashboard's Publish on the VM: build there, new release, `activate.sh` |
| `admin-sync.exclude` | What `deploy.sh` leaves out of the dashboard's checkout |

## 1. Network (Azure Portal > VM > Networking > Network settings > inbound rules)

- 80 and 443, TCP, source Any.
- 22, TCP: GitHub Actions connects from changing addresses, so source Any. Logins are key-only (Azure creates the VM
  with password login off); `deploy` can only upload releases and restart the site.

## 2. Deploy key (on your laptop, once)

```bash
ssh-keygen -t ed25519 -N '' -C cambridge-github-deploy -f ~/.ssh/cambridge_deploy
```

`cambridge_deploy.pub` goes on the VM (step 3); `cambridge_deploy` (private) goes into GitHub (step 4) and nowhere else.

## 3. Set up the VM

```bash
scp -r deploy/vm azureuser@<vm-ip>:/tmp/vm
ssh azureuser@<vm-ip> "sudo bash /tmp/vm/setup.sh '$(cat ~/.ssh/cambridge_deploy.pub)'"
```

## 4. GitHub (repository Settings > Secrets and variables > Actions)

| Kind | Name | Value |
|---|---|---|
| Variable | `VM_HOST` | The VM's public IP. The workflow is skipped until this is set |
| Variable | `VM_KNOWN_HOSTS` | Output of `ssh-keyscan -t ed25519 <vm-ip>` (pins the VM's identity) |
| Secret | `VM_SSH_KEY` | Contents of `~/.ssh/cambridge_deploy` (the private key) |
| Variable | `PUBLIC_TURNSTILE_SITE_KEY` | Turnstile site key (build time) |
| Variable | `PUBLIC_GOOGLE_MAPS_KEY` | Maps JavaScript API browser key (build time) |

Then Actions > Deploy to Azure VM > Run workflow (later pushes to `main` deploy by themselves). Check the site on
the domain (section 6).

## 5. Run-time settings (when the keys arrive)

```bash
ssh azureuser@<vm-ip>
sudo nano /etc/cambridge-web.env          # SMTP, Turnstile secret, form inboxes (see the comments in the file)
sudo systemctl restart cambridge-web
```

## 5b. Dashboard login (once)

```bash
node tools/admin/hash-password.mjs 'the superadmin password'    # on a laptop; prints ADMIN_PASSWORD_HASH=...
ssh azureuser@<vm-ip>
sudo nano /etc/cambridge-admin.env     # ADMIN_EMAIL, ADMIN_PASSWORD_HASH (without the quotes), ADMIN_SESSION_SECRET (openssl rand -hex 32),
                                       # PUBLIC_TURNSTILE_SITE_KEY + PUBLIC_GOOGLE_MAPS_KEY (same as the GitHub variables)
sudo systemctl restart cambridge-admin
```

The dashboard is at `https://<domain>/admin` after the first deploy (which creates `/srv/cambridge/admin`). Its first
Publish encodes every image (~12 min on a 2-vCPU VM; a 4 GB VM is the minimum for the build); later ones reuse the cache in
`/srv/cambridge/cache` and take 1–3 minutes. Optional, recommended: put `/admin*` and `/api/admin*` behind Cloudflare Access
(Zero Trust > Access > Applications, self-hosted, path `admin`) so only the superadmin's email can even reach the login.

## 6. HTTPS (Cloudflare)

The domain's DNS is on Cloudflare: visitors connect to Cloudflare, which connects to the VM over HTTPS and checks the
VM's certificate (SSL/TLS mode **Full (strict)**). The VM's certificate is a Cloudflare Origin Certificate
(`*.cambridgehospital.com` + `cambridgehospital.com`, valid until Oct 2041), trusted by Cloudflare only. Cloudflare
also sends the visitor's country (`CF-IPCountry`), which the country pop-up reads.

Install the certificate before `setup.sh` (it refuses to install the Caddyfile without it). From the folder with the two
files Cloudflare showed (certificate, private key):

```bash
scp origin.pem origin.key azureuser@<vm-ip>:
ssh azureuser@<vm-ip> 'sudo install -d -m 750 -o root -g caddy /etc/caddy/certs &&
  sudo install -m 644 -o root -g caddy origin.pem /etc/caddy/certs/origin.pem &&
  sudo install -m 640 -o root -g caddy origin.key /etc/caddy/certs/origin.key &&
  shred -u origin.key && rm origin.pem && sudo systemctl reload caddy'
```

Cloudflare settings: SSL/TLS > Overview **Full (strict)**; Edge Certificates **Always Use HTTPS**; DNS: an `A` record,
**Proxied**, for each name served from the VM (a staging subdomain first, `@` and `www` at go-live). Optional: limit the
VM's inbound 80/443 rules to Cloudflare's addresses (https://www.cloudflare.com/ips/), the same list as `trusted_proxies`
in the Caddyfile, so nobody reaches the VM around Cloudflare.

## 7. Go-live

1. Cloudflare DNS: point `@` and `www` (Proxied) at the VM IP, replacing the WordPress server.
2. `INDEXABLE = true` in `site.config.mjs`, push.
3. After a stable period: back up and delete the old WordPress resource group.

## Operations

| Task | Command (on the VM) |
|---|---|
| Status / logs | `systemctl status cambridge-web`, `journalctl -u cambridge-web -f`, `journalctl -u caddy -f` |
| Roll back | `sudo -u deploy bash /srv/cambridge/releases/<previous>/activate.sh` |
| Restart | `sudo systemctl restart cambridge-web` |
| Dashboard | `systemctl status cambridge-admin`, `journalctl -u cambridge-admin -f` (the publish log is also shown in the UI) |
| Backups | `/srv/cambridge/backups/content-<date>.tar.gz`; restore: `sudo -u cambridge tar -xzf <archive> -C /srv/cambridge/admin`, then Publish |
| Pull the posts into a laptop checkout | `DEPLOY_HOST=deploy@<vm-ip> SSH_KEY=~/.ssh/cambridge_deploy npm run content:pull` |

A release that does not answer within 20 s is rolled back automatically; the workflow run then fails.
OS security updates install themselves (Ubuntu's unattended-upgrades); reboot when `/var/run/reboot-required` exists.
