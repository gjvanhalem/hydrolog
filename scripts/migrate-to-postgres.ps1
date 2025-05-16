# Script to migrate data from SQLite to PostgreSQL in PowerShell
# Prerequisites:
# - Both SQLite and PostgreSQL databases need to be configured
# - sqlite3 and psql utilities need to be installed

# Default PostgreSQL connection parameters
$PG_HOST = if ($env:PG_HOST) { $env:PG_HOST } else { "localhost" }
$PG_PORT = if ($env:PG_PORT) { $env:PG_PORT } else { "5432" }
$PG_DB = if ($env:PG_DB) { $env:PG_DB } else { "hydrolog" }
$PG_USER = if ($env:PG_USER) { $env:PG_USER } else { "postgres" }
$PG_PASS = if ($env:PG_PASS) { $env:PG_PASS } else { "hydrolog_password" }

Write-Host "Migrating data from SQLite to PostgreSQL..." -ForegroundColor Cyan

# Check if SQLite3 is installed
try {
    $sqliteVersion = Invoke-Expression "sqlite3 --version"
    Write-Host "✅ SQLite3 client found: $sqliteVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ SQLite3 client not found. Please install SQLite3 and add it to your PATH." -ForegroundColor Red
    exit 1
}

# Check if PostgreSQL is installed
try {
    $pgVersion = Invoke-Expression "psql --version"
    Write-Host "✅ PostgreSQL client found: $pgVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ PostgreSQL client not found. Please install PostgreSQL and add it to your PATH." -ForegroundColor Red
    exit 1
}

# Set PGPASSWORD environment variable for psql commands
$env:PGPASSWORD = $PG_PASS

# Step 1: Export data from SQLite to CSV format
Write-Host "Exporting data from SQLite to CSV format..." -ForegroundColor Cyan

$tables = @("User", "Session", "Plant", "PlantLog", "SystemLog", "System", "UserSystem")

foreach ($table in $tables) {
    Write-Host "Exporting $table..." -ForegroundColor Cyan
    Invoke-Expression "sqlite3 -header -csv ./data/hydro.db `"SELECT * FROM '$table';`" > ./$table.csv"
}

# Step 2: Import data into PostgreSQL
Write-Host "Importing data to PostgreSQL..." -ForegroundColor Cyan

foreach ($table in $tables) {
    Write-Host "Importing $table..." -ForegroundColor Cyan
    $copySql = "\COPY `"$table`" FROM './$table.csv' WITH CSV HEADER;"
    Invoke-Expression "psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DB -c `"$copySql`""
}

# Step 3: Reset sequences (auto-increment IDs)
Write-Host "Resetting sequences..." -ForegroundColor Cyan

$resetSequencesSql = @"
DO \$\$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename, attname FROM pg_tables t
              JOIN pg_attribute a ON a.attrelid = t.tablename::regclass
              WHERE t.schemaname = 'public'
              AND a.attname = 'id'
              AND a.attnum > 0
              AND NOT a.attisdropped)
    LOOP
        EXECUTE 'SELECT setval(''public.\"' || r.tablename || '_id_seq\"'', COALESCE((SELECT MAX(id) FROM public.\"' || r.tablename || '\"), 1), true);';
    END LOOP;
END \$\$;
"@

Invoke-Expression "psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DB -c `"$resetSequencesSql`""

# Clean up CSV files
Write-Host "Cleaning up..." -ForegroundColor Cyan
foreach ($table in $tables) {
    Remove-Item -Path "./$table.csv" -Force
}

Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
