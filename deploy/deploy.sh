#!/usr/bin/env bash
# Build and upload the static site to the nginx QA staging server.
# Usage: DEPLOY_HOST=user@server REMOTE_DIR=/var/www/cambridge-staging ./deploy/deploy.sh
set -euo pipefail

: "${DEPLOY_HOST:?Set DEPLOY_HOST, e.g. ubuntu@1.2.3.4}"
REMOTE_DIR="${REMOTE_DIR:-/var/www/cambridge-staging}"

cd "$(dirname "$0")/.."
npm run build
# nginx has no _redirects support: turn dist/_redirects ("from to 301") into a map file the server config includes
# (deploy/nginx/cambridge-staging.conf, map $uri $ch_redirect).
# A splat source ("/sa/doctor/*", bug 059 / 060) becomes a regex key; nginx checks the exact keys before the regex ones.
awk 'NF>=2 { k = $1; if (k ~ /\*$/) { sub(/\*$/, "", k); k = "~^" k } printf "\"%s\" \"%s\";\n", k, $2 }' dist/_redirects > dist/_redirects.nginx-map
rsync -avz --delete dist/ "$DEPLOY_HOST:$REMOTE_DIR/"
echo "Deployed $(git rev-parse --short HEAD) to $DEPLOY_HOST:$REMOTE_DIR"
