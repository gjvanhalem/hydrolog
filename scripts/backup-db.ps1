# PowerShell script for PostgreSQL database backup

# Default configuration (override with environment variables)
$BACKUP_DIR = if ($env:BACKUP_DIR) { $env:BACKUP_DIR } else { "./backups" }
$DB_HOST = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$DB_PORT = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }
$DB_NAME = if ($env:DB_NAME) { $env:DB_NAME } else { "hydrolog" }
$DB_USER = if ($env:DB_USER) { $env:DB_USER } else { "postgres" }
$DB_PASSWORD = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "hydrolog_password" }
$RETENTION_DAYS = if ($env:RETENTION_DAYS) { [int]$env:RETENTION_DAYS } else { 7 }

# Timestamp for the backup file
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "$BACKUP_DIR\hydrolog_$TIMESTAMP.sql"

# Make sure the backup directory exists
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
}

# Set the PGPASSWORD environment variable for passwordless connection
$env:PGPASSWORD = $DB_PASSWORD

Write-Host "Starting PostgreSQL backup of $DB_NAME database..." -ForegroundColor Cyan

# Create the backup with pg_dump
try {
    pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -F p -f $BACKUP_FILE
    
    if ($LASTEXITCODE -eq 0) {
        # Compress the backup file using PowerShell's Compress-Archive
        Write-Host "Compressing backup file..." -ForegroundColor Cyan
        Compress-Archive -Path $BACKUP_FILE -DestinationPath "$BACKUP_FILE.zip" -Force
        Remove-Item $BACKUP_FILE -Force
        
        $compressedFile = "$BACKUP_FILE.zip"
        $fileSize = "{0:N2} MB" -f ((Get-Item $compressedFile).Length / 1MB)
        
        Write-Host "Backup successful: $compressedFile ($fileSize)" -ForegroundColor Green
        
        # Remove backups older than RETENTION_DAYS
        if ($RETENTION_DAYS -gt 0) {
            Write-Host "Removing backups older than $RETENTION_DAYS days..." -ForegroundColor Cyan
            Get-ChildItem -Path $BACKUP_DIR -Filter "hydrolog_*.sql.zip" | 
                Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$RETENTION_DAYS) } | 
                ForEach-Object { 
                    Remove-Item $_.FullName -Force
                    Write-Host "Removed old backup: $($_.Name)" -ForegroundColor Gray
                }
        }
        
        Write-Host "Backup process completed successfully." -ForegroundColor Green
    } else {
        Write-Host "Backup failed with exit code $LASTEXITCODE!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Backup failed with error: $_" -ForegroundColor Red
    exit 1
}
