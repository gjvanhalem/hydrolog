#!/bin/bash
# This script creates a new Prisma migration for PostgreSQL from the existing schema

echo "Creating PostgreSQL migration from existing SQLite schema..."

# Back up the current schema.prisma file
cp prisma/schema.prisma prisma/schema.prisma.backup

# Check if the backup was successful
if [ ! -f prisma/schema.prisma.backup ]; then
  echo "Failed to backup schema file. Exiting."
  exit 1
fi

# Modify the schema to use PostgreSQL
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma

# Validate the schema
npx prisma validate

# Check if validation succeeded
if [ $? -ne 0 ]; then
  echo "Prisma schema validation failed. Restoring backup and exiting."
  cp prisma/schema.prisma.backup prisma/schema.prisma
  exit 1
fi

# Create a new migration
echo "Creating PostgreSQL migration. Give it a name like 'migrate_to_postgresql'"
npx prisma migrate dev

# Check if migration succeeded
if [ $? -ne 0 ]; then
  echo "Prisma migration failed. Restoring backup and exiting."
  cp prisma/schema.prisma.backup prisma/schema.prisma
  exit 1
fi

echo "Migration completed successfully!"
echo "Your DATABASE_URL environment variable should now point to a PostgreSQL database."
echo "Example: DATABASE_URL=postgresql://postgres:hydrolog_password@localhost:5432/hydrolog?schema=public"
