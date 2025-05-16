#!/bin/bash
# PostgreSQL diagnostics script
# This script checks PostgreSQL connection and settings

# Default PostgreSQL connection parameters
PG_HOST=${PG_HOST:-localhost}
PG_PORT=${PG_PORT:-5432}
PG_DB=${PG_DB:-hydrolog}
PG_USER=${PG_USER:-postgres}
PG_PASS=${PG_PASS:-hydrolog_password}

# Set PGPASSWORD environment variable for passwordless connection
export PGPASSWORD=$PG_PASS

echo "=== HydroLog PostgreSQL Diagnostics ==="
echo "Checking connection to PostgreSQL..."

# Check if PostgreSQL server is running
if pg_isready -h $PG_HOST -p $PG_PORT -U $PG_USER > /dev/null 2>&1; then
  echo "✅ PostgreSQL server is running"
else
  echo "❌ PostgreSQL server is not running or not accessible"
  exit 1
fi

echo -e "\n=== Database Version ==="
psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DB -c "SELECT version();"

echo -e "\n=== Database Size ==="
psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DB -c "SELECT pg_size_pretty(pg_database_size('$PG_DB')) AS db_size;"

echo -e "\n=== Table Sizes ==="
psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DB -c "
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
"

echo -e "\n=== Connection Stats ==="
psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DB -c "
SELECT
  datname AS database,
  numbackends AS connections
FROM
  pg_stat_database
WHERE
  datname = '$PG_DB';
"

echo -e "\n=== Performance Configuration ==="
psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DB -c "
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
"

echo -e "\n=== Extensions Installed ==="
psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DB -c "
SELECT
  extname AS extension_name,
  extversion AS version
FROM
  pg_extension;
"

echo -e "\n=== Database Health ==="
psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DB -c "
SELECT
  'Last vacuum: ' || last_vacuum::timestamp(0),
  'Last autovacuum: ' || last_autovacuum::timestamp(0),
  'Last analyze: ' || last_analyze::timestamp(0),
  'Last autoanalyze: ' || last_autoanalyze::timestamp(0)
FROM
  pg_stat_user_tables
LIMIT 1;
"

echo -e "\nDiagnostics completed successfully"
