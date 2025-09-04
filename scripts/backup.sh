#!/bin/bash

# Automated backup script for Hockey Stats Tracking App
# This script creates backups of the database and uploads them to S3

set -euo pipefail

# Configuration
BACKUP_DIR="/tmp/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
DB_BACKUP_FILE="stat_tracking_db_${DATE}.sql.gz"
LOG_FILE="/var/log/backup_${DATE}.log"

# Environment variables (should be set in production)
: ${DATABASE_URL:?"DATABASE_URL is not set"}
: ${S3_BACKUP_BUCKET:?"S3_BACKUP_BUCKET is not set"}
: ${BACKUP_RETENTION_DAYS:=30}
: ${AWS_REGION:="us-east-1"}

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Cleanup function
cleanup() {
    log "Cleaning up temporary files..."
    rm -rf "$BACKUP_DIR"
}

# Set up cleanup trap
trap cleanup EXIT

# Create backup directory
mkdir -p "$BACKUP_DIR"
cd "$BACKUP_DIR"

log "Starting backup process..."

# Database backup
log "Creating database backup..."
if ! pg_dump "$DATABASE_URL" | gzip > "$DB_BACKUP_FILE"; then
    error_exit "Database backup failed"
fi

# Verify backup file
if [[ ! -f "$DB_BACKUP_FILE" || ! -s "$DB_BACKUP_FILE" ]]; then
    error_exit "Backup file is empty or missing"
fi

BACKUP_SIZE=$(du -h "$DB_BACKUP_FILE" | cut -f1)
log "Database backup created: $DB_BACKUP_FILE (${BACKUP_SIZE})"

# Upload to S3
log "Uploading backup to S3..."
if ! aws s3 cp "$DB_BACKUP_FILE" "s3://${S3_BACKUP_BUCKET}/database/" --region "$AWS_REGION"; then
    error_exit "Failed to upload backup to S3"
fi

log "Backup uploaded successfully to s3://${S3_BACKUP_BUCKET}/database/${DB_BACKUP_FILE}"

# Clean up old backups from S3
log "Cleaning up old backups (older than ${BACKUP_RETENTION_DAYS} days)..."
CUTOFF_DATE=$(date -d "${BACKUP_RETENTION_DAYS} days ago" +"%Y-%m-%d")

aws s3 ls "s3://${S3_BACKUP_BUCKET}/database/" --region "$AWS_REGION" | \
while read -r line; do
    FILE_DATE=$(echo "$line" | awk '{print $1}')
    FILE_NAME=$(echo "$line" | awk '{print $4}')
    
    if [[ "$FILE_DATE" < "$CUTOFF_DATE" && -n "$FILE_NAME" ]]; then
        log "Deleting old backup: $FILE_NAME"
        aws s3 rm "s3://${S3_BACKUP_BUCKET}/database/${FILE_NAME}" --region "$AWS_REGION"
    fi
done

# Create backup metadata
METADATA_FILE="backup_metadata_${DATE}.json"
cat > "$METADATA_FILE" << EOF
{
    "backup_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "database_backup": "$DB_BACKUP_FILE",
    "backup_size_bytes": $(stat -c%s "$DB_BACKUP_FILE"),
    "backup_size_human": "$BACKUP_SIZE",
    "retention_days": $BACKUP_RETENTION_DAYS,
    "s3_location": "s3://${S3_BACKUP_BUCKET}/database/${DB_BACKUP_FILE}",
    "status": "completed"
}
EOF

# Upload metadata
aws s3 cp "$METADATA_FILE" "s3://${S3_BACKUP_BUCKET}/metadata/" --region "$AWS_REGION"

# Health check - verify we can list recent backups
RECENT_BACKUPS=$(aws s3 ls "s3://${S3_BACKUP_BUCKET}/database/" --region "$AWS_REGION" | wc -l)
if [[ "$RECENT_BACKUPS" -lt 1 ]]; then
    error_exit "No backups found in S3 after upload"
fi

log "Backup process completed successfully"
log "Recent backups in S3: $RECENT_BACKUPS"

# Send notification (if webhook URL is configured)
if [[ -n "${BACKUP_WEBHOOK_URL:-}" ]]; then
    log "Sending backup notification..."
    curl -X POST "$BACKUP_WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"text\": \"✅ Database backup completed successfully\",
            \"details\": {
                \"backup_file\": \"$DB_BACKUP_FILE\",
                \"backup_size\": \"$BACKUP_SIZE\",
                \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
            }
        }" || log "Failed to send notification (non-critical)"
fi

log "Backup script finished"