#!/bin/sh
# Docker entry point script to initialize the container environment

set -e

# Create necessary directories
mkdir -p /app/data
mkdir -p /app/logs
mkdir -p /app/public/uploads

# Check if the database file exists
if [ ! -f "/app/data/hydro.db" ]; then
  echo "Initializing database..."
  # Run Prisma migrations
  npx prisma migrate deploy
  echo "Database initialization completed."
else
  echo "Database already exists, checking for migrations..."
  # Always run migrations to ensure schema is up to date
  npx prisma migrate deploy
fi

# Start the application
echo "Starting HydroLog application..."
exec "$@"
