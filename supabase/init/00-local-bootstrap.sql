-- Local-only bootstrap.
--
-- Hosted Supabase provides the `auth` schema and `auth.users` table via GoTrue.
-- The bare Postgres image does not, but our migrations declare foreign keys
-- against `auth.users`. This creates a minimal stand-in so migrations apply
-- cleanly locally. It is a no-op anywhere the real schema already exists.

CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stubs for the helpers our RLS policies call, so policies parse locally.
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID
  LANGUAGE sql STABLE AS $$
    SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
  $$;

CREATE OR REPLACE FUNCTION auth.role() RETURNS TEXT
  LANGUAGE sql STABLE AS $$
    SELECT COALESCE(NULLIF(current_setting('request.jwt.claim.role', true), ''), 'anon');
  $$;

-- Used by the `public.is_admin()` helper our RLS policies depend on.
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS JSONB
  LANGUAGE sql STABLE AS $$
    SELECT COALESCE(
      NULLIF(current_setting('request.jwt.claims', true), '')::jsonb,
      '{}'::jsonb
    );
  $$;

-- GoTrue creates these roles on hosted Supabase; RLS policies grant to them
-- by name, so they must exist locally for the policies to be created at all.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
  END IF;
END
$$;
