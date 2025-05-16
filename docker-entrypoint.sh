#!/bin/sh
set -e

# Set DATABASE_URL for prisma if not already set
if [ -z "$DATABASE_URL" ]; then
    export DATABASE_URL="file:/app/data/dev.db"
    echo "Setting DATABASE_URL to $DATABASE_URL"
fi

# Check if the prisma database file exists, if not, create it
if [ ! -f /app/data/dev.db ]; then
    echo "Initializing database..."
    npx prisma migrate deploy
    node /app/generate-jwt-secret.js
fi

# Start the application
exec "$@"
