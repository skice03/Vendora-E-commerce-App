#!/bin/bash
# ============================================================
# REQ-80: Automated MySQL Database Backup Script
# ============================================================
# This script creates a compressed backup of the VendoraDB
# database using mysqldump. It stores backups in a local 
# directory with timestamped filenames and retains only
# the last 30 backups to manage disk usage.
#
# Usage:
#   ./scripts/backup-db.sh
#
# To automate with cron (e.g., daily at 2:00 AM):
#   crontab -e
#   0 2 * * * /path/to/Vendora/scripts/backup-db.sh >> /path/to/Vendora/backups/backup.log 2>&1
# ============================================================

set -euo pipefail

# --- Configuration ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_ROOT}/backups"
DB_NAME="VendoraDB"
DB_USER="root"
DB_HOST="localhost"
DB_PORT="3306"
MAX_BACKUPS=30

# --- Create backup directory ---
mkdir -p "$BACKUP_DIR"

# --- Generate timestamped filename ---
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_backup_${TIMESTAMP}.sql.gz"

echo "[$(date)] Starting backup of database '${DB_NAME}'..."

# --- Run mysqldump and compress ---
# Uses --single-transaction for InnoDB tables (non-blocking)
# Uses --routines to include stored procedures
# Uses --triggers to include triggers
mysqldump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --user="$DB_USER" \
    --single-transaction \
    --routines \
    --triggers \
    --databases "$DB_NAME" \
    | gzip > "$BACKUP_FILE"

# --- Verify backup was created ---
if [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "[$(date)] ✅ Backup successful: ${BACKUP_FILE} (${BACKUP_SIZE})"
else
    echo "[$(date)] ❌ Backup FAILED — file not created."
    exit 1
fi

# --- Prune old backups (keep only the most recent $MAX_BACKUPS) ---
BACKUP_COUNT=$(ls -1 "${BACKUP_DIR}"/${DB_NAME}_backup_*.sql.gz 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
    REMOVE_COUNT=$((BACKUP_COUNT - MAX_BACKUPS))
    echo "[$(date)] Pruning ${REMOVE_COUNT} old backup(s)..."
    ls -1t "${BACKUP_DIR}"/${DB_NAME}_backup_*.sql.gz | tail -n "$REMOVE_COUNT" | xargs rm -f
fi

echo "[$(date)] Backup complete. Total backups: $(ls -1 "${BACKUP_DIR}"/${DB_NAME}_backup_*.sql.gz 2>/dev/null | wc -l)"
