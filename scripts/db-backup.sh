#!/usr/bin/env bash
# Gzipped SQL dump of the Kuzix database. Meant for cron, e.g.:
#   0 3 * * * BACKUP_DIR=/var/backups/kuzix /path/to/kuzix/scripts/db-backup.sh >> /var/log/kuzix-backup.log 2>&1
# BACKUP_DIR: where dumps go (default: ./backups). BACKUP_KEEP_DAYS: older dumps are deleted (default: 14, 0 = keep all).
set -euo pipefail
cd "$(dirname "$0")/.."

BACKUP_DIR="${BACKUP_DIR:-$PWD/backups}"
BACKUP_KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
mkdir -p "$BACKUP_DIR"

file="$BACKUP_DIR/kuzix-$(date +%Y%m%d-%H%M%S).sql.gz"
# Write to a temp file first so a failed dump never looks like a valid backup.
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner' | gzip -9 > "$file.part"
mv "$file.part" "$file"
echo "$(date -Is) backup written: $file"

if [ "$BACKUP_KEEP_DAYS" -gt 0 ]; then
	find "$BACKUP_DIR" -name 'kuzix-*.sql.gz' -mtime +"$BACKUP_KEEP_DAYS" -delete
fi
