-- Users authentication for MADPC (custom auth)
-- Run in your PostgreSQL (Supabase SQL editor)

-- Enable extensions (if needed)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (separate from Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('district_commander', 'unit_supervisor')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at'
  ) THEN
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Seed an admin user (replace password_hash later)
-- INSERT INTO users (email, password_hash, role) VALUES (
--   'admin@example.com',
--   '$2a$10$examplehashgeneratedwithbcrypt',
--   'district_commander'
-- ) ON CONFLICT (email) DO NOTHING;

