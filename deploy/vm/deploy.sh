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

# printf %q keeps a key path with spaces intact inside rsync's -e string. Group-writable (group cambridge via the setgid
# releases directory): the dashboard's own publishes (user cambridge, deploy/vm/publish.sh) prune old releases too.
rsync -az --chmod=D2775,F664 -e "$(printf '%q ' "${ssh_cmd[@]}")" dist dist-server deploy/vm/activate.sh "$DEPLOY_HOST:/srv/cambridge/releases/$release/"
"${ssh_cmd[@]}" "$DEPLOY_HOST" "bash /srv/cambridge/releases/$release/activate.sh"

# The dashboard's checkout (/srv/cambridge/admin, deploy/vm/README.md "Dashboard"): the same source, so its Publish builds
# the same site. Code is replaced; the content the dashboard owns (posts, authors, their images) is only ever ADDED to
# (--ignore-existing: a file the client changed or deleted there is never overwritten or brought back). Run
# deploy/vm/fetch-content.sh before the build so the release itself carries the dashboard's posts.
if "${ssh_cmd[@]}" "$DEPLOY_HOST" "test -d /srv/cambridge/admin"; then
  rsh="$(printf '%q ' "${ssh_cmd[@]}")"
  rsync -az --delete --chmod=D2775,F664 --exclude-from=deploy/vm/admin-sync.exclude -e "$rsh" ./ "$DEPLOY_HOST:/srv/cambridge/admin/"
  for dir in src/content src/assets/news src/assets/authors; do
    [ -d "$dir" ] && rsync -az --ignore-existing --chmod=D2775,F664 -e "$rsh" "$dir/" "$DEPLOY_HOST:/srv/cambridge/admin/$dir/"
  done
  "${ssh_cmd[@]}" "$DEPLOY_HOST" "bash /srv/cambridge/admin/deploy/vm/admin-update.sh"
fi
