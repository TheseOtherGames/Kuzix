#!/usr/bin/env bash
# Restores a dump made by db-backup.sh. Replaces the current data.
#   scripts/db-restore.sh /var/backups/kuzix/kuzix-20261111-030000.sql.gz [-y]
# Stop the app first (systemctl --user stop kuzix) so no game writes during the restore.
set -euo pipefail
file="${1:?usage: $0 <backup.sql.gz> [-y]}"
file="$(realpath "$file")"
cd "$(dirname "$0")/.."

gzip -t "$file"
if [ "${2:-}" != "-y" ]; then
	read -rp "Replace the Kuzix database with $file? [y/N] " answer
	[ "$answer" = "y" ] || { echo "Cancelled."; exit 1; }
fi

gunzip -c "$file" | docker compose exec -T db sh -c 'psql -q -o /dev/null -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 --single-transaction'
echo "Restored $file"
