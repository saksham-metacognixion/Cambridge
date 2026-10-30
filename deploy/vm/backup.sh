#!/usr/bin/env bash
# Nightly backup of what the dashboard writes (cambridge-backup.timer, user cambridge): the posts, authors, their images
# and the version history, as one archive in /srv/cambridge/backups (the 30 newest are kept) and, when
# AZURE_BACKUP_SAS_URL is set in /etc/cambridge-admin.env and azcopy is installed, uploaded to that Azure Blob container.
# Restore: tar -xzf <archive> -C /srv/cambridge/admin
set -euo pipefail
base=/srv/cambridge
umask 027
mkdir -p "$base/backups"
archive="$base/backups/content-$(date -u +%Y%m%d-%H%M%S).tar.gz"
cd "$base/admin"
parts=()
for p in src/content src/assets/news src/assets/authors .admin; do [ -e "$p" ] && parts+=("$p"); done
tar -czf "$archive" "${parts[@]}"
ls -1t "$base/backups"/content-*.tar.gz | tail -n +31 | xargs -r rm -f --
echo "Backup: $archive ($(du -h "$archive" | cut -f1))"
if [ -n "${AZURE_BACKUP_SAS_URL:-}" ] && command -v azcopy >/dev/null; then
  azcopy copy "$archive" "$AZURE_BACKUP_SAS_URL" --output-level essential && echo "Uploaded to Azure Blob."
fi
