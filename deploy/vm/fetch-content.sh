#!/usr/bin/env bash
# Copy the posts, authors and their images FROM the VM's dashboard into this checkout (the VM is the source of truth for
# them: the client edits there). Run before a build that will be deployed, so a code deploy never removes a post written
# in the dashboard. Used by .github/workflows/deploy-vm.yml; also `npm run content:pull` on a laptop with the deploy key.
# Usage: DEPLOY_HOST=deploy@<vm-ip> [SSH_KEY=<private key file>] ./deploy/vm/fetch-content.sh
set -euo pipefail
: "${DEPLOY_HOST:?Set DEPLOY_HOST, e.g. deploy@20.174.19.143}"
cd "$(dirname "$0")/../.."
ssh_cmd=(ssh -o BatchMode=yes)
[ -n "${SSH_KEY:-}" ] && ssh_cmd+=(-i "$SSH_KEY")
rsh="$(printf '%q ' "${ssh_cmd[@]}")"

# Nothing to fetch until the dashboard has been set up on the VM.
if ! "${ssh_cmd[@]}" "$DEPLOY_HOST" "test -d /srv/cambridge/admin/src/content/news"; then
  echo "No dashboard content on $DEPLOY_HOST yet; keeping the repository's posts."
  exit 0
fi
# Safety: the VM copy replaces this checkout's posts (--delete). A half-set-up or emptied VM folder must never turn into a
# deploy without posts, so a VM that holds far fewer posts than the repository stops the deploy instead.
vm_posts="$("${ssh_cmd[@]}" "$DEPLOY_HOST" "ls /srv/cambridge/admin/src/content/news | grep -c '\.json$'")"
repo_posts="$(ls src/content/news | grep -c '\.json$')"
if [ "$vm_posts" -lt $((repo_posts - 20)) ]; then
  echo "The dashboard on $DEPLOY_HOST holds $vm_posts posts, this checkout $repo_posts: refusing to replace the posts (is the VM folder complete?)." >&2
  exit 1
fi
for dir in src/content/news src/content/authors src/assets/news src/assets/authors; do
  "${ssh_cmd[@]}" "$DEPLOY_HOST" "test -d /srv/cambridge/admin/$dir" || continue
  mkdir -p "$dir"
  rsync -az --delete -e "$rsh" "$DEPLOY_HOST:/srv/cambridge/admin/$dir/" "$dir/"
done
echo "Content fetched from $DEPLOY_HOST: $(ls src/content/news | wc -l) posts, $(ls src/content/authors 2>/dev/null | wc -l) authors."
