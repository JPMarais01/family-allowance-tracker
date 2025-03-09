BEGIN;

-- 1. Ensure the public schema exists and is accessible
CREATE SCHEMA IF NOT EXISTS public;

-- 2. Grant full permissions on the schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- 3. Grant table permissions (including future tables)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON TABLES TO postgres, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT ON TABLES TO anon;

-- 4. Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, authenticated;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE ON SEQUENCES TO postgres, service_role, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT ON SEQUENCES TO anon;

-- 5. Explicitly set PostgREST schema configuration
ALTER ROLE authenticator SET pgrst.db_schemas TO 'api, public, storage, graphql_public';

-- 6. Make sure PostgREST can use the public schema functions
ALTER ROLE authenticator SET search_path TO 'api', 'public', 'storage', 'graphql_public';

COMMIT;
