#!/bin/bash
# Database backup script for PostgreSQL

# Default configuration (override with environment variables)
BACKUP_DIR=${BACKUP_DIR:-"./backups"}
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"hydrolog"}
DB_USER=${DB_USER:-"postgres"}
DB_PASSWORD=${DB_PASSWORD:-"hydrolog_password"}
RETENTION_DAYS=${RETENTION_DAYS:-7}

# Timestamp for the backup file
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/hydrolog_${TIMESTAMP}.sql"

# Make sure the backup directory exists
mkdir -p "$BACKUP_DIR"

# Set the PGPASSWORD environment variable for passwordless connection
export PGPASSWORD="$DB_PASSWORD"

echo "Starting PostgreSQL backup of $DB_NAME database..."

# Create the backup with pg_dump
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F p > "$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
  # Compress the backup file
  gzip "$BACKUP_FILE"
  COMPRESSED_FILE="${BACKUP_FILE}.gz"
  
  echo "Backup successful: $COMPRESSED_FILE ($(du -h "$COMPRESSED_FILE" | cut -f1))"
  
  # Remove backups older than RETENTION_DAYS
  if [ "$RETENTION_DAYS" -gt 0 ]; then
    echo "Removing backups older than $RETENTION_DAYS days..."
    find "$BACKUP_DIR" -name "hydrolog_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
  fi
  
  echo "Backup process completed successfully."
else
  echo "Backup failed!"
  exit 1
fi
