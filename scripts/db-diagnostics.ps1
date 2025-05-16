# PostgreSQL diagnostics script for PowerShell
# This script checks PostgreSQL connection and settings

# Default PostgreSQL connection parameters
$PG_HOST = if ($env:PG_HOST) { $env:PG_HOST } else { "localhost" }
$PG_PORT = if ($env:PG_PORT) { $env:PG_PORT } else { "5432" }
$PG_DB = if ($env:PG_DB) { $env:PG_DB } else { "hydrolog" }
$PG_USER = if ($env:PG_USER) { $env:PG_USER } else { "postgres" }
$PG_PASS = if ($env:PG_PASS) { $env:PG_PASS } else { "hydrolog_password" }

# Set PGPASSWORD environment variable for passwordless connection
$env:PGPASSWORD = $PG_PASS

Write-Host "=== HydroLog PostgreSQL Diagnostics ===" -ForegroundColor Cyan
Write-Host "Checking connection to PostgreSQL..." -ForegroundColor Cyan

# Check if PostgreSQL is installed
try {
    $pgVersion = Invoke-Expression "psql --version"
    Write-Host "✅ PostgreSQL client found: $pgVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ PostgreSQL client not found. Please install PostgreSQL and add it to your PATH." -ForegroundColor Red
    exit 1
}

# Check if PostgreSQL server is running
try {
    $result = Invoke-Expression "pg_isready -h $PG_HOST -p $PG_PORT -U $PG_USER"
    if ($result -like "*accepting connections*") {
        Write-Host "✅ PostgreSQL server is running" -ForegroundColor Green
    } else {
        Write-Host "❌ PostgreSQL server is not running or not accessible" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error connecting to PostgreSQL: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Database Version ===" -ForegroundColor Cyan
Invoke-Expression "psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DB -c `"SELECT version();`""

Write-Host "`n=== Database Size ===" -ForegroundColor Cyan
Invoke-Expression "psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DB -c `"SELECT pg_size_pretty(pg_database_size('$PG_DB')) AS db_size;`""

Write-Host "`n=== Table Sizes ===" -ForegroundColor Cyan
$tableSizesQuery = @"
SELECT
  table_name,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) AS total_size
FROM
  information_schema.tables
WHERE
  table_schema = 'public'
ORDER BY
  pg_total_relation_size(quote_ident(table_name)) DESC
LIMIT 10;
"@
Invoke-Expression "psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DB -c `"$tableSizesQuery`""

Write-Host "`n=== Connection Stats ===" -ForegroundColor Cyan
$connectionStatsQuery = @"
SELECT
  datname AS database,
  numbackends AS connections
FROM
  pg_stat_database
WHERE
  datname = '$PG_DB';
"@
Invoke-Expression "psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DB -c `"$connectionStatsQuery`""

Write-Host "`n=== Performance Configuration ===" -ForegroundColor Cyan
$performanceConfigQuery = @"
SELECT
  name, setting, unit, context
FROM
  pg_settings
WHERE
  name IN (
    'shared_buffers', 'work_mem',
    'maintenance_work_mem', 'effective_cache_size',
    'max_connections', 'random_page_cost'
  );
"@
Invoke-Expression "psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DB -c `"$performanceConfigQuery`""

Write-Host "`n=== Extensions Installed ===" -ForegroundColor Cyan
$extensionsQuery = @"
SELECT
  extname AS extension_name,
  extversion AS version
FROM
  pg_extension;
"@
Invoke-Expression "psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DB -c `"$extensionsQuery`""

Write-Host "`n=== Database Health ===" -ForegroundColor Cyan
$dbHealthQuery = @"
SELECT
  'Last vacuum: ' || last_vacuum::timestamp(0),
  'Last autovacuum: ' || last_autovacuum::timestamp(0),
  'Last analyze: ' || last_analyze::timestamp(0),
  'Last autoanalyze: ' || last_autoanalyze::timestamp(0)
FROM
  pg_stat_user_tables
LIMIT 1;
"@
Invoke-Expression "psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DB -c `"$dbHealthQuery`""

Write-Host "`nDiagnostics completed successfully" -ForegroundColor Green
