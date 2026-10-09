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
# $uri is percent-DECODED, so a percent-encoded source (the Arabic post slugs, bug 060) is written decoded; map keys are
# case-insensitive, so the upper / lower-case twins of _redirects collapse to one key (a duplicate would only warn).
node -e '
const fs = require("node:fs");
const keys = new Map();
for (const line of fs.readFileSync("dist/_redirects", "utf8").split("\n")) {
  const [from, to] = line.trim().split(/\s+/);
  if (!from || !to) continue;
  let k = from.endsWith("/*") ? "~^" + from.slice(0, -1) : from;
  if (k.includes("%")) try { k = decodeURIComponent(k); } catch {}
  if (!keys.has(k.toLowerCase())) keys.set(k.toLowerCase(), `"${k}" "${to}";`);
}
fs.writeFileSync("dist/_redirects.nginx-map", [...keys.values()].join("\n") + "\n");
'
rsync -avz --delete dist/ "$DEPLOY_HOST:$REMOTE_DIR/"
echo "Deployed $(git rev-parse --short HEAD) to $DEPLOY_HOST:$REMOTE_DIR"
