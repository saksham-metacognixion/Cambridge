#!/usr/bin/env bash
# One-time setup of the Azure VM (Ubuntu 24.04) for the site; safe to run again. See deploy/vm/README.md.
# Usage, on the VM, from a copy of deploy/vm/:  sudo bash setup.sh '<public key of the deploy key>'
#   - Node.js 22 (NodeSource) and Caddy (official apt repository)
#   - user `cambridge` runs the site (no login); user `deploy` uploads releases over SSH with the deploy key only,
#     and may run exactly one root command: restarting the site
#   - /srv/cambridge/releases, the systemd units (site, dashboard, nightly backup timer), the Caddyfile, and
#     /etc/cambridge-web.env + /etc/cambridge-admin.env (kept if they exist)
set -euo pipefail

[ "$(id -u)" -eq 0 ] || { echo "Run with sudo." >&2; exit 1; }
DEPLOY_KEY="${1:?Usage: sudo bash setup.sh '<public key of the deploy key>'}"
here="$(cd "$(dirname "$0")" && pwd)"

apt-get update
apt-get install -y ca-certificates curl gnupg rsync debian-keyring debian-archive-keyring apt-transport-https

if ! node --version 2>/dev/null | grep -q '^v22\.'; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

if ! command -v caddy >/dev/null; then
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/gpg.key | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update
  apt-get install -y caddy
fi

id cambridge >/dev/null 2>&1 || useradd --system --no-create-home --shell /usr/sbin/nologin cambridge
id deploy >/dev/null 2>&1 || useradd --create-home --shell /bin/bash deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
printf '%s\n' "$DEPLOY_KEY" > /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys

# Releases are written by `deploy` (GitHub) and by the dashboard (`cambridge`, deploy/vm/publish.sh): one group, setgid
# directories, so either can switch and prune them. /srv/cambridge/admin = the dashboard's checkout of the repository
# (code synced by deploy.sh, posts edited by the dashboard); /srv/cambridge/cache = npm + Astro image caches.
usermod -aG cambridge deploy
install -d -o deploy -g deploy /srv/cambridge
install -d -m 2775 -o deploy -g cambridge /srv/cambridge/releases
install -d -m 2775 -o cambridge -g cambridge /srv/cambridge/admin /srv/cambridge/cache /srv/cambridge/backups
chmod 2775 /srv/cambridge/releases

sudoers=/etc/sudoers.d/cambridge-deploy
cat > "$sudoers" <<'SUDO'
deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart cambridge-web, /usr/bin/systemctl restart cambridge-admin
cambridge ALL=(root) NOPASSWD: /usr/bin/systemctl restart cambridge-web
SUDO
chmod 440 "$sudoers"
visudo -cf "$sudoers"

[ -f /etc/cambridge-web.env ] || install -m 600 -o root -g root "$here/cambridge-web.env.example" /etc/cambridge-web.env
[ -f /etc/cambridge-admin.env ] || install -m 600 -o root -g root "$here/cambridge-admin.env.example" /etc/cambridge-admin.env

install -m 644 "$here/cambridge-web.service" /etc/systemd/system/cambridge-web.service
install -m 644 "$here/cambridge-admin.service" /etc/systemd/system/cambridge-admin.service
install -m 644 "$here/cambridge-backup.service" /etc/systemd/system/cambridge-backup.service
install -m 644 "$here/cambridge-backup.timer" /etc/systemd/system/cambridge-backup.timer
# The Caddyfile serves HTTPS with the Cloudflare Origin Certificate, a secret installed by hand (README, "HTTPS").
for f in /etc/caddy/certs/origin.pem /etc/caddy/certs/origin.key; do
  [ -f "$f" ] || { echo "Missing $f: install the Cloudflare Origin Certificate first (deploy/vm/README.md, HTTPS)." >&2; exit 1; }
done
install -m 644 "$here/Caddyfile" /etc/caddy/Caddyfile
systemctl daemon-reload
# Enabled for boot; the site first starts with the first release (deploy/vm/activate.sh), the dashboard with the first
# deploy that syncs its checkout (deploy/vm/admin-update.sh). The backup timer runs nightly once that checkout exists.
systemctl enable cambridge-web cambridge-admin
systemctl enable --now cambridge-backup.timer
caddy validate --config /etc/caddy/Caddyfile
systemctl reload-or-restart caddy

echo "Setup done. Node $(node --version), $(caddy version | cut -d' ' -f1). Next: fill /etc/cambridge-admin.env, then the first deploy (deploy/vm/README.md)."
