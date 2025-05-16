#!/bin/sh
# Local PostgreSQL database setup for development

# Default values (can be overridden by environment variables)
PG_HOST=${PG_HOST:-localhost}
PG_PORT=${PG_PORT:-5432}
PG_DB=${PG_DB:-hydrolog}
PG_USER=${PG_USER:-postgres}
PG_PASS=${PG_PASS:-hydrolog_password}

# Export PostgreSQL password for psql commands
export PGPASSWORD=$PG_PASS

echo "Setting up PostgreSQL database for HydroLog development..."

# Check if PostgreSQL is running
if pg_isready -h $PG_HOST -p $PG_PORT -U $PG_USER > /dev/null 2>&1; then
    echo "✅ PostgreSQL server is running"
else
    echo "❌ PostgreSQL server is not running. Please start PostgreSQL and try again."
    exit 1
fi

# Check if database exists, if not create it
if psql -h $PG_HOST -p $PG_PORT -U $PG_USER -lqt | cut -d \| -f 1 | grep -qw $PG_DB; then
    echo "✅ Database '$PG_DB' already exists"
else
    echo "Creating database '$PG_DB'..."
    psql -h $PG_HOST -p $PG_PORT -U $PG_USER -c "CREATE DATABASE $PG_DB;"
    echo "✅ Database '$PG_DB' created"
fi

# Update .env file with PostgreSQL connection string
ENV_FILE=.env.local
if [ -f "$ENV_FILE" ]; then
    echo "Updating $ENV_FILE with PostgreSQL connection string..."
    # Backup original file
    cp $ENV_FILE ${ENV_FILE}.backup
    # Replace or add DATABASE_URL
    if grep -q "DATABASE_URL" $ENV_FILE; then
        sed -i "s|DATABASE_URL=.*|DATABASE_URL=postgresql://${PG_USER}:${PG_PASS}@${PG_HOST}:${PG_PORT}/${PG_DB}?schema=public|" $ENV_FILE
    else
        echo "DATABASE_URL=postgresql://${PG_USER}:${PG_PASS}@${PG_HOST}:${PG_PORT}/${PG_DB}?schema=public" >> $ENV_FILE
    fi
    echo "✅ Updated $ENV_FILE (backup saved as ${ENV_FILE}.backup)"
else
    echo "Creating $ENV_FILE with PostgreSQL connection string..."
    echo "DATABASE_URL=postgresql://${PG_USER}:${PG_PASS}@${PG_HOST}:${PG_PORT}/${PG_DB}?schema=public" > $ENV_FILE
    echo "✅ Created $ENV_FILE"
fi

# Run Prisma migrations
echo "Running Prisma migrations..."
npx prisma migrate dev

echo "✅ PostgreSQL setup completed successfully!"
echo "You can now start the application with: npm run dev"
