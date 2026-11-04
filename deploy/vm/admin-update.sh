#!/usr/bin/env bash
# Runs on the VM as `deploy` after deploy/vm/deploy.sh synced the source into /srv/cambridge/admin: install the
# dependencies, bundle the admin service, restart it. Caches live in /srv/cambridge/cache (cambridge-admin.service).
set -euo pipefail
cd /srv/cambridge/admin
umask 002
export HOME=/srv/cambridge/cache
npm ci --no-audit --no-fund
node tools/admin/bundle.mjs
sudo systemctl restart cambridge-admin
for _ in $(seq 1 15); do
  curl -fs -o /dev/null http://127.0.0.1:8788/healthz && { echo "Dashboard updated."; exit 0; }
  sleep 1
done
echo "The dashboard did not answer on 127.0.0.1:8788 (journalctl -u cambridge-admin)." >&2
exit 1
