#!/bin/sh
# Script to migrate data from SQLite to PostgreSQL
# Prerequisites:
# - Both SQLite and PostgreSQL databases need to be configured
# - sqlite3 and pg_dump/psql utilities need to be installed

# Step 1: Export data from SQLite to SQL format
echo "Exporting data from SQLite to SQL format..."

# Export each table
for table in User Session Plant PlantLog SystemLog System UserSystem; do
  echo "Exporting $table..."
  sqlite3 -header -csv ./data/hydro.db "SELECT * FROM '$table';" > ./$table.csv
done

# Step 2: Import data into PostgreSQL
echo "Importing data to PostgreSQL..."

# Database connection parameters
PG_HOST=${PG_HOST:-localhost}
PG_PORT=${PG_PORT:-5432}
PG_DB=${PG_DB:-hydrolog}
PG_USER=${PG_USER:-postgres}
PG_PASS=${PG_PASS:-hydrolog_password}

export PGPASSWORD=$PG_PASS

# Import each table
for table in User Session Plant PlantLog SystemLog System UserSystem; do
  echo "Importing $table..."
  # This assumes the CSV headers match PostgreSQL column names exactly
  psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DB -c "\COPY \"$table\" FROM './$table.csv' WITH CSV HEADER;"
done

# Step 3: Reset sequences (auto-increment IDs)
echo "Resetting sequences..."
psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DB -c "
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
"

# Clean up CSV files
echo "Cleaning up..."
rm -f ./*.csv

echo "Migration completed successfully!"
