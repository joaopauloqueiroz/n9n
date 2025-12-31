#!/bin/bash
set -e

# Create user and database if they don't exist
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'n9n') THEN
            CREATE USER n9n WITH PASSWORD 'n9npassWd*';
        END IF;
    END
    \$\$;
    
    SELECT 'CREATE DATABASE n9n OWNER n9n'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'n9n')\gexec
    
    GRANT ALL PRIVILEGES ON DATABASE n9n TO n9n;
EOSQL

echo "PostgreSQL user and database initialized"

