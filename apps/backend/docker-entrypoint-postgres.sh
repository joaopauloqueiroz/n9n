#!/bin/bash
set -e

# Use the default postgres entrypoint
/docker-entrypoint.sh "$@" &

# Wait for PostgreSQL to be ready
until pg_isready -U postgres > /dev/null 2>&1; do
  sleep 1
done

# Create user and database if they don't exist (runs every time container starts)
psql -v ON_ERROR_STOP=1 --username postgres <<-EOSQL
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'n9n') THEN
            CREATE USER n9n WITH PASSWORD 'n9npassWd*';
        ELSE
            ALTER USER n9n WITH PASSWORD 'n9npassWd*';
        END IF;
    END
    \$\$;
    
    SELECT 'CREATE DATABASE n9n OWNER n9n'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'n9n')\gexec
    
    GRANT ALL PRIVILEGES ON DATABASE n9n TO n9n;
EOSQL

echo "PostgreSQL user and database ensured"

# Wait for the postgres process
wait

