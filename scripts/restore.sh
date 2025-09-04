#!/bin/bash

# Database restore script for Hockey Stats Tracking App
# This script restores a database backup from S3

set -euo pipefail

# Configuration
RESTORE_DIR="/tmp/restore"
LOG_FILE="/var/log/restore_$(date +"%Y%m%d_%H%M%S").log"

# Environment variables
: ${DATABASE_URL:?"DATABASE_URL is not set"}
: ${S3_BACKUP_BUCKET:?"S3_BACKUP_BUCKET is not set"}
: ${AWS_REGION:="us-east-1"}

# Parse command line arguments
BACKUP_FILE=""
LIST_BACKUPS=false
FORCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--file)
            BACKUP_FILE="$2"
            shift 2
            ;;
        -l|--list)
            LIST_BACKUPS=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  -f, --file FILENAME    Restore from specific backup file"
            echo "  -l, --list            List available backups"
            echo "  --force               Skip confirmation prompts"
            echo "  -h, --help            Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

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
    rm -rf "$RESTORE_DIR"
}

# Set up cleanup trap
trap cleanup EXIT

# List backups function
list_backups() {
    log "Available backups in S3:"
    aws s3 ls "s3://${S3_BACKUP_BUCKET}/database/" --region "$AWS_REGION" | \
    sort -r | head -20 | \
    while read -r line; do
        echo "  $line"
    done
}

# Main execution
log "Starting restore process..."

# Handle list option
if [[ "$LIST_BACKUPS" == true ]]; then
    list_backups
    exit 0
fi

# Validate backup file parameter
if [[ -z "$BACKUP_FILE" ]]; then
    log "No backup file specified. Available backups:"
    list_backups
    echo ""
    echo "Please specify a backup file with -f option"
    exit 1
fi

# Verify backup exists in S3
log "Verifying backup file exists: $BACKUP_FILE"
if ! aws s3 ls "s3://${S3_BACKUP_BUCKET}/database/${BACKUP_FILE}" --region "$AWS_REGION" > /dev/null 2>&1; then
    error_exit "Backup file not found in S3: $BACKUP_FILE"
fi

# Safety confirmation
if [[ "$FORCE" != true ]]; then
    echo ""
    echo "⚠️  WARNING: This will REPLACE the current database with the backup!"
    echo "Database: $DATABASE_URL"
    echo "Backup file: $BACKUP_FILE"
    echo ""
    read -p "Are you sure you want to continue? (type 'yes' to confirm): " -r
    if [[ ! $REPLY == "yes" ]]; then
        log "Restore cancelled by user"
        exit 0
    fi
fi

# Create restore directory
mkdir -p "$RESTORE_DIR"
cd "$RESTORE_DIR"

# Download backup from S3
log "Downloading backup from S3..."
if ! aws s3 cp "s3://${S3_BACKUP_BUCKET}/database/${BACKUP_FILE}" . --region "$AWS_REGION"; then
    error_exit "Failed to download backup from S3"
fi

# Verify downloaded file
if [[ ! -f "$BACKUP_FILE" || ! -s "$BACKUP_FILE" ]]; then
    error_exit "Downloaded backup file is empty or missing"
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log "Backup downloaded successfully: ${BACKUP_SIZE}"

# Extract database connection details
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\).*/\1/p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')

log "Database details extracted - Host: $DB_HOST, Port: ${DB_PORT:-5432}, Database: $DB_NAME"

# Test database connection
log "Testing database connection..."
if ! pg_isready -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" > /dev/null 2>&1; then
    error_exit "Cannot connect to database"
fi

# Create a pre-restore backup of current database
CURRENT_BACKUP="pre_restore_backup_$(date +"%Y%m%d_%H%M%S").sql.gz"
log "Creating backup of current database before restore..."
if ! pg_dump "$DATABASE_URL" | gzip > "$CURRENT_BACKUP"; then
    log "WARNING: Failed to create pre-restore backup (continuing anyway)"
else
    log "Pre-restore backup created: $CURRENT_BACKUP"
    # Upload current backup to S3
    aws s3 cp "$CURRENT_BACKUP" "s3://${S3_BACKUP_BUCKET}/pre-restore/" --region "$AWS_REGION" || \
        log "WARNING: Failed to upload pre-restore backup to S3"
fi

# Drop existing connections (PostgreSQL)
log "Terminating active database connections..."
psql "$DATABASE_URL" -c "
    SELECT pg_terminate_backend(pid) 
    FROM pg_stat_activity 
    WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();
" || log "WARNING: Failed to terminate some connections"

# Restore database
log "Starting database restore..."
if [[ "$BACKUP_FILE" == *.gz ]]; then
    # Gzipped backup
    if ! gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL"; then
        error_exit "Database restore failed"
    fi
else
    # Uncompressed backup
    if ! psql "$DATABASE_URL" < "$BACKUP_FILE"; then
        error_exit "Database restore failed"
    fi
fi

log "Database restore completed successfully"

# Verify restore
log "Verifying restore..."

# Check if key tables exist and have data
VERIFICATION_QUERY="
SELECT 
    'teams' as table_name, COUNT(*) as row_count FROM teams
UNION ALL
SELECT 
    'players' as table_name, COUNT(*) as row_count FROM players
UNION ALL
SELECT 
    'games' as table_name, COUNT(*) as row_count FROM games;
"

if ! psql "$DATABASE_URL" -c "$VERIFICATION_QUERY"; then
    error_exit "Database verification failed"
fi

log "Database verification completed"

# Update statistics
log "Updating database statistics..."
psql "$DATABASE_URL" -c "ANALYZE;" || log "WARNING: Failed to update statistics"

# Create restore metadata
METADATA_FILE="restore_metadata_$(date +"%Y%m%d_%H%M%S").json"
cat > "$METADATA_FILE" << EOF
{
    "restore_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "source_backup": "$BACKUP_FILE",
    "backup_size": "$BACKUP_SIZE",
    "database_url": "$(echo "$DATABASE_URL" | sed 's/:[^@]*@/:***@/')",
    "pre_restore_backup": "$CURRENT_BACKUP",
    "status": "completed"
}
EOF

# Upload metadata
aws s3 cp "$METADATA_FILE" "s3://${S3_BACKUP_BUCKET}/restore-metadata/" --region "$AWS_REGION" || \
    log "WARNING: Failed to upload restore metadata"

# Send notification (if webhook URL is configured)
if [[ -n "${RESTORE_WEBHOOK_URL:-}" ]]; then
    log "Sending restore notification..."
    curl -X POST "$RESTORE_WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"text\": \"✅ Database restore completed successfully\",
            \"details\": {
                \"source_backup\": \"$BACKUP_FILE\",
                \"backup_size\": \"$BACKUP_SIZE\",
                \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
            }
        }" || log "Failed to send notification (non-critical)"
fi

log "Restore process completed successfully"
log "Log file: $LOG_FILE"

echo ""
echo "✅ Database restore completed successfully!"
echo "📊 Restored from: $BACKUP_FILE"
echo "💾 Backup size: $BACKUP_SIZE"
echo "📋 Log file: $LOG_FILE"
echo ""
echo "🔧 Next steps:"
echo "1. Restart your application services"
echo "2. Verify application functionality"
echo "3. Monitor for any issues"