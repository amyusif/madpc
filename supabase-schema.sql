-- Supabase Database Schema for Police Command System
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table for user profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  badge_number TEXT,
  role TEXT NOT NULL CHECK (role IN ('district_commander', 'unit_supervisor')),
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create personnel table
CREATE TABLE IF NOT EXISTS personnel (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  badge_number TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  rank TEXT NOT NULL,
  unit TEXT NOT NULL,
  date_joined DATE NOT NULL,
  emergency_contacts TEXT[] DEFAULT '{}',
  marital_status TEXT NOT NULL,
  spouse TEXT,
  children_count INTEGER,
  no_children BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'retired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cases table
CREATE TABLE IF NOT EXISTS cases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_number TEXT NOT NULL UNIQUE,
  case_title TEXT NOT NULL,
  case_type TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed', 'archived')),
  assigned_to UUID REFERENCES personnel(id),
  reported_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create duties table
CREATE TABLE IF NOT EXISTS duties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  personnel_id UUID REFERENCES personnel(id) ON DELETE CASCADE,
  duty_type TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'assigned', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_personnel_updated_at BEFORE UPDATE ON personnel FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_duties_updated_at BEFORE UPDATE ON duties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE duties ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Personnel policies (authenticated users can read/write)
CREATE POLICY "Authenticated users can view personnel" ON personnel FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert personnel" ON personnel FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update personnel" ON personnel FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete personnel" ON personnel FOR DELETE TO authenticated USING (true);

-- Cases policies (authenticated users can read/write)
CREATE POLICY "Authenticated users can view cases" ON cases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert cases" ON cases FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update cases" ON cases FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete cases" ON cases FOR DELETE TO authenticated USING (true);

-- Duties policies (authenticated users can read/write)
CREATE POLICY "Authenticated users can view duties" ON duties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert duties" ON duties FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update duties" ON duties FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete duties" ON duties FOR DELETE TO authenticated USING (true);

-- Alerts policies (authenticated users can read/write)
CREATE POLICY "Authenticated users can view alerts" ON alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert alerts" ON alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update alerts" ON alerts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete alerts" ON alerts FOR DELETE TO authenticated USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_personnel_badge_number ON personnel(badge_number);
CREATE INDEX IF NOT EXISTS idx_personnel_status ON personnel(status);
CREATE INDEX IF NOT EXISTS idx_personnel_rank ON personnel(rank);
CREATE INDEX IF NOT EXISTS idx_personnel_unit ON personnel(unit);

CREATE INDEX IF NOT EXISTS idx_cases_case_number ON cases(case_number);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_priority ON cases(priority);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_to ON cases(assigned_to);

CREATE INDEX IF NOT EXISTS idx_duties_personnel_id ON duties(personnel_id);
CREATE INDEX IF NOT EXISTS idx_duties_status ON duties(status);
CREATE INDEX IF NOT EXISTS idx_duties_start_time ON duties(start_time);

CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_priority ON alerts(priority);
CREATE INDEX IF NOT EXISTS idx_alerts_created_by ON alerts(created_by);

-- Insert sample data (optional)
-- You can uncomment these to add sample data

-- INSERT INTO personnel (badge_number, first_name, last_name, email, rank, unit, date_joined, marital_status) VALUES
-- ('SGT001', 'John', 'Doe', 'john.doe@police.gov.gh', 'sergeant', 'patrol', '2020-01-15', 'Married'),
-- ('CPL002', 'Jane', 'Smith', 'jane.smith@police.gov.gh', 'corporal', 'investigation', '2021-03-20', 'Single'),
-- ('INSP003', 'Robert', 'Johnson', 'robert.johnson@police.gov.gh', 'inspector', 'traffic', '2019-06-10', 'Divorced');

-- INSERT INTO cases (case_number, case_title, case_type, description, priority, reported_by) VALUES
-- ('CASE-2024-001', 'Theft Investigation', 'Theft', 'Reported theft of motorcycle from residential area', 'high', 'Kwame Asante'),
-- ('CASE-2024-002', 'Traffic Violation', 'Traffic', 'Speeding violation on main highway', 'medium', 'Traffic Officer'),
-- ('CASE-2024-003', 'Domestic Dispute', 'Domestic', 'Noise complaint and domestic disturbance', 'low', 'Neighbor Report');

-- INSERT INTO duties (personnel_id, duty_type, description, location, start_time, end_time, status) VALUES
-- ((SELECT id FROM personnel WHERE badge_number = 'SGT001'), 'Patrol', 'Night patrol duty', 'Downtown District', '2024-01-20 18:00:00', '2024-01-21 06:00:00', 'scheduled'),
-- ((SELECT id FROM personnel WHERE badge_number = 'CPL002'), 'Investigation', 'Follow up on theft case', 'Police Station', '2024-01-20 08:00:00', '2024-01-20 16:00:00', 'assigned');

COMMENT ON TABLE profiles IS 'User profiles for authentication and role management';
COMMENT ON TABLE personnel IS 'Police personnel information and management';
COMMENT ON TABLE cases IS 'Case management and tracking';
COMMENT ON TABLE duties IS 'Duty assignments and scheduling';
COMMENT ON TABLE alerts IS 'System alerts and notifications';
