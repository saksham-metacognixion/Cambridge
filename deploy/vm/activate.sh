#!/usr/bin/env bash
# Runs on the VM as `deploy`, from inside a freshly uploaded release (deploy/vm/deploy.sh):
# point /srv/cambridge/current at this release, restart the site, check it answers, and go back to the previous
# release if it does not. Keeps the 5 newest releases for rollback.
set -euo pipefail

base=/srv/cambridge
release="$(cd "$(dirname "$0")" && pwd)"
# -e: empty on the first deploy (no current yet); -f would print the missing path itself.
previous="$(readlink -e "$base/current" 2>/dev/null || true)"

switch_to() {
  ln -sfn "$1" "$base/current.next"
  mv -T "$base/current.next" "$base/current" # rename = atomic switch
  sudo systemctl restart cambridge-web
}

healthy() {
  for _ in $(seq 1 20); do
    curl -fs -o /dev/null http://127.0.0.1:8080/ && return 0
    sleep 1
  done
  return 1
}

switch_to "$release"
if ! healthy; then
  echo "Release $(basename "$release") did not answer on 127.0.0.1:8080." >&2
  if [ -n "$previous" ] && [ -d "$previous" ] && [ "$previous" != "$release" ]; then
    switch_to "$previous"
    echo "Rolled back to $(basename "$previous")." >&2
  fi
  exit 1
fi

# Keep this (live) release and the 4 newest others. Release names start with their UTC upload time
# (deploy/vm/deploy.sh), so name order is age order; the live one is excluded by path, never by its name's order.
others=()
for dir in "$base"/releases/*/; do
  dir="${dir%/}"
  [ "$dir" = "$release" ] || others+=("$dir")
done
if [ "${#others[@]}" -gt 4 ]; then rm -rf -- "${others[@]:0:${#others[@]}-4}"; fi
echo "Live: $(basename "$release")"
