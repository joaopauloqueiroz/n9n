-- Grant permissions to user n9n on database n9n
-- Run this as postgres superuser

-- Grant usage on schema public
GRANT USAGE ON SCHEMA public TO n9n;

-- Grant create on schema public
GRANT CREATE ON SCHEMA public TO n9n;

-- Grant all privileges on all tables in schema public
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO n9n;

-- Grant all privileges on all sequences in schema public
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO n9n;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO n9n;

-- Set default privileges for future sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO n9n;

-- Make n9n the owner of the schema (alternative approach)
-- ALTER SCHEMA public OWNER TO n9n;

