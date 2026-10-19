#!/usr/bin/env bash
# Build and upload the static site to the nginx QA staging server.
# Usage: DEPLOY_HOST=user@server REMOTE_DIR=/var/www/cambridge-staging ./deploy/deploy.sh
set -euo pipefail

: "${DEPLOY_HOST:?Set DEPLOY_HOST, e.g. ubuntu@1.2.3.4}"
REMOTE_DIR="${REMOTE_DIR:-/var/www/cambridge-staging}"

cd "$(dirname "$0")/.."
npm run build
# nginx has no _redirects support: dist/_redirects -> dist/_redirects.nginx-map (included by deploy/nginx/cambridge-staging.conf).
node tools/nginx-redirect-map.mjs
rsync -avz --delete dist/ "$DEPLOY_HOST:$REMOTE_DIR/"
echo "Deployed $(git rev-parse --short HEAD) to $DEPLOY_HOST:$REMOTE_DIR"
