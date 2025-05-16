# PostgreSQL setup script for Windows PowerShell
# This script helps set up PostgreSQL for HydroLog development

# Default PostgreSQL connection parameters
$PG_HOST = if ($env:PG_HOST) { $env:PG_HOST } else { "localhost" }
$PG_PORT = if ($env:PG_PORT) { $env:PG_PORT } else { "5432" }
$PG_DB = if ($env:PG_DB) { $env:PG_DB } else { "hydrolog" }
$PG_USER = if ($env:PG_USER) { $env:PG_USER } else { "postgres" }
$PG_PASS = if ($env:PG_PASS) { $env:PG_PASS } else { "hydrolog_password" }

Write-Host "Setting up PostgreSQL database for HydroLog development..." -ForegroundColor Cyan

# Check if PostgreSQL is installed
try {
    $pgVersion = Invoke-Expression "psql --version"
    Write-Host "✅ PostgreSQL client found: $pgVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ PostgreSQL client not found. Please install PostgreSQL and add it to your PATH." -ForegroundColor Red
    Write-Host "Download: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

# Set PGPASSWORD environment variable for psql commands
$env:PGPASSWORD = $PG_PASS

# Check if PostgreSQL server is running
try {
    $result = Invoke-Expression "pg_isready -h $PG_HOST -p $PG_PORT -U $PG_USER"
    if ($result -like "*accepting connections*") {
        Write-Host "✅ PostgreSQL server is running" -ForegroundColor Green
    } else {
        Write-Host "❌ PostgreSQL server is not running. Please start PostgreSQL and try again." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error connecting to PostgreSQL: $_" -ForegroundColor Red
    exit 1
}

# Check if database exists
$checkDbQuery = "SELECT 1 FROM pg_database WHERE datname='$PG_DB'"
$dbExists = Invoke-Expression "psql -h $PG_HOST -p $PG_PORT -U $PG_USER -t -c `"$checkDbQuery`""

if ($dbExists -match "1") {
    Write-Host "✅ Database '$PG_DB' already exists" -ForegroundColor Green
} else {
    Write-Host "Creating database '$PG_DB'..." -ForegroundColor Cyan
    Invoke-Expression "psql -h $PG_HOST -p $PG_PORT -U $PG_USER -c `"CREATE DATABASE $PG_DB;`""
    Write-Host "✅ Database '$PG_DB' created" -ForegroundColor Green
}

# Update or create .env.local file
$envFile = ".env.local"
$connectionString = "DATABASE_URL=postgresql://${PG_USER}:${PG_PASS}@${PG_HOST}:${PG_PORT}/${PG_DB}?schema=public"

if (Test-Path $envFile) {
    Write-Host "Updating $envFile with PostgreSQL connection string..." -ForegroundColor Cyan
    # Backup original file
    Copy-Item $envFile -Destination "$envFile.backup"
    
    # Read all lines from the file
    $envContent = Get-Content $envFile
    $found = $false
    
    # Check if DATABASE_URL exists in the file
    for ($i = 0; $i -lt $envContent.Length; $i++) {
        if ($envContent[$i] -match "^DATABASE_URL=") {
            $envContent[$i] = $connectionString
            $found = $true
            break
        }
    }
    
    # If DATABASE_URL doesn't exist, add it
    if (-not $found) {
        $envContent += $connectionString
    }
    
    # Write the content back to the file
    $envContent | Set-Content $envFile
    Write-Host "✅ Updated $envFile (backup saved as $envFile.backup)" -ForegroundColor Green
} else {
    Write-Host "Creating $envFile with PostgreSQL connection string..." -ForegroundColor Cyan
    $connectionString | Set-Content $envFile
    Write-Host "✅ Created $envFile" -ForegroundColor Green
}

# Run Prisma migrations
Write-Host "Running Prisma migrations..." -ForegroundColor Cyan
npx prisma migrate dev

Write-Host "✅ PostgreSQL setup completed successfully!" -ForegroundColor Green
Write-Host "You can now start the application with: npm run dev" -ForegroundColor Cyan
