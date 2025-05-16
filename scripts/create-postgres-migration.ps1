# This script creates a new Prisma migration for PostgreSQL from the existing schema

Write-Host "Creating PostgreSQL migration from existing SQLite schema..." -ForegroundColor Cyan

# Back up the current schema.prisma file
Copy-Item -Path "prisma/schema.prisma" -Destination "prisma/schema.prisma.backup"

# Check if the backup was successful
if (-not (Test-Path "prisma/schema.prisma.backup")) {
  Write-Host "Failed to backup schema file. Exiting." -ForegroundColor Red
  exit 1
}

# Modify the schema to use PostgreSQL
(Get-Content "prisma/schema.prisma") -replace 'provider = "sqlite"', 'provider = "postgresql"' | Set-Content "prisma/schema.prisma"

# Validate the schema
try {
  npx prisma validate
  if ($LASTEXITCODE -ne 0) {
    throw "Validation failed"
  }
} catch {
  Write-Host "Prisma schema validation failed. Restoring backup and exiting." -ForegroundColor Red
  Copy-Item -Path "prisma/schema.prisma.backup" -Destination "prisma/schema.prisma" -Force
  exit 1
}

# Create a new migration
Write-Host "Creating PostgreSQL migration. Give it a name like 'migrate_to_postgresql'" -ForegroundColor Cyan
try {
  npx prisma migrate dev
  if ($LASTEXITCODE -ne 0) {
    throw "Migration failed"
  }
} catch {
  Write-Host "Prisma migration failed. Restoring backup and exiting." -ForegroundColor Red
  Copy-Item -Path "prisma/schema.prisma.backup" -Destination "prisma/schema.prisma" -Force
  exit 1
}

Write-Host "Migration completed successfully!" -ForegroundColor Green
Write-Host "Your DATABASE_URL environment variable should now point to a PostgreSQL database." -ForegroundColor Cyan
Write-Host "Example: DATABASE_URL=postgresql://postgres:hydrolog_password@localhost:5432/hydrolog?schema=public" -ForegroundColor Yellow
