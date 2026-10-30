#!/usr/bin/env bash
# Upload the build to the Azure VM as a new release and make it live (deploy/vm/README.md).
# Used by .github/workflows/deploy-vm.yml; also works from a laptop that holds the deploy key.
# Usage, after `npm run build:azure`:  DEPLOY_HOST=deploy@<vm-ip> [SSH_KEY=<private key file>] ./deploy/vm/deploy.sh
set -euo pipefail

: "${DEPLOY_HOST:?Set DEPLOY_HOST, e.g. deploy@20.174.19.143}"
cd "$(dirname "$0")/../.."
[ -f dist/index.html ] && [ -f dist-server/server.mjs ] || { echo "No build found: run npm run build:azure first." >&2; exit 1; }

release="$(date -u +%Y%m%d-%H%M%S)-$(git rev-parse --short=10 HEAD)"
ssh_cmd=(ssh -o BatchMode=yes)
[ -n "${SSH_KEY:-}" ] && ssh_cmd+=(-i "$SSH_KEY")

# printf %q keeps a key path with spaces intact inside rsync's -e string.
rsync -az -e "$(printf '%q ' "${ssh_cmd[@]}")" dist dist-server deploy/vm/activate.sh "$DEPLOY_HOST:/srv/cambridge/releases/$release/"
"${ssh_cmd[@]}" "$DEPLOY_HOST" "bash /srv/cambridge/releases/$release/activate.sh"
