-- PostgreSQL initialization script for HydroLog
-- This script will be executed when the PostgreSQL container first starts up

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set up performance-related configuration
ALTER SYSTEM SET shared_buffers TO '128MB';
ALTER SYSTEM SET work_mem TO '4MB';
ALTER SYSTEM SET maintenance_work_mem TO '64MB';
ALTER SYSTEM SET effective_cache_size TO '512MB';
ALTER SYSTEM SET max_connections TO '100';

-- Set up logging
ALTER SYSTEM SET log_min_duration_statement TO '500ms';
ALTER SYSTEM SET log_statement TO 'ddl';
ALTER SYSTEM SET log_connections TO 'on';
ALTER SYSTEM SET log_disconnections TO 'on';

-- Apply changes
SELECT pg_reload_conf();
