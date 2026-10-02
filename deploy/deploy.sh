#!/usr/bin/env bash
# Build and upload the static site to the nginx QA staging server.
# Usage: DEPLOY_HOST=user@server REMOTE_DIR=/var/www/cambridge-staging ./deploy/deploy.sh
set -euo pipefail

: "${DEPLOY_HOST:?Set DEPLOY_HOST, e.g. ubuntu@1.2.3.4}"
REMOTE_DIR="${REMOTE_DIR:-/var/www/cambridge-staging}"

cd "$(dirname "$0")/.."
npm run build
rsync -avz --delete dist/ "$DEPLOY_HOST:$REMOTE_DIR/"
echo "Deployed $(git rev-parse --short HEAD) to $DEPLOY_HOST:$REMOTE_DIR"
