#!/usr/bin/env bash
# "Publish site" on the VM: the dashboard's PUBLISH_COMMAND (cambridge-admin.service, user cambridge). Builds the site
# from the dashboard's checkout (/srv/cambridge/admin, whose src/content the dashboard edits) and makes the build live
# the same way a GitHub deploy does: a new release under /srv/cambridge/releases + deploy/vm/activate.sh (switch, restart,
# health check, roll back). The dashboard shows this script's output as the publish log.
set -euo pipefail
base=/srv/cambridge
cd "$base/admin"
export PATH=/usr/bin:/bin:/usr/local/bin HOME="${HOME:-$base/cache}" ASTRO_CACHE_DIR="${ASTRO_CACHE_DIR:-$base/cache/astro}"
umask 002

echo "Building the website from $(pwd) ..."
npm run build:azure

release="$base/releases/$(date -u +%Y%m%d-%H%M%S)-dashboard"
mkdir -p "$release"
cp -r dist dist-server "$release/"
cp deploy/vm/activate.sh "$release/"
echo "Making release $(basename "$release") live ..."
bash "$release/activate.sh"
echo "Published."
