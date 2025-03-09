BEGIN;

-- 1. Grant necessary permissions to the anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. Grant access to all existing tables based on your RLS policies
-- (RLS will still control actual row access)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- 3. Set up future grants automatically
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT ON TABLES TO anon;

-- 4. Configure PostgREST to include the public schema
-- This is the critical part that exposes your schema to the API
ALTER ROLE authenticator SET pgrst.db_schemas TO 'api, public';

COMMIT;
