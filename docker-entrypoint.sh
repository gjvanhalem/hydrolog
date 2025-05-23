#!/bin/sh
set -e

# Default PostgreSQL connection settings if not provided
if [ -z "$DATABASE_URL" ]; then
    export DATABASE_URL="postgresql://postgres:${POSTGRES_PASSWORD:-hydrolog_password}@postgres:5432/hydrolog?schema=public"
    echo "Setting DATABASE_URL to default PostgreSQL connection"
fi

echo "Using DATABASE_URL: $DATABASE_URL"

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h postgres -U postgres; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done
echo "PostgreSQL is up - executing migrations"

# Generate Prisma client with current environment variables
echo "Regenerating Prisma client with current environment variables..."
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Generate JWT secret if needed
if [ ! -f .jwt_secret_generated ]; then
    echo "Generating JWT secret..."
    node /app/generate-jwt-secret.js
    touch .jwt_secret_generated
fi

# Start the application
exec "$@"
