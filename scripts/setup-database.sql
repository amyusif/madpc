-- MADPC Database Setup Script
-- Run this script in your Supabase SQL Editor to set up all required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (if not exists)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  badge_number TEXT UNIQUE,
  role TEXT CHECK (role IN ('district_commander', 'unit_supervisor')),
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create personnel table (if not exists)
CREATE TABLE IF NOT EXISTS personnel (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  badge_number TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  rank TEXT NOT NULL,
  unit TEXT NOT NULL,
  date_joined DATE DEFAULT CURRENT_DATE,
  emergency_contacts TEXT[] DEFAULT '{}',
  marital_status TEXT CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')) DEFAULT 'single',
  spouse TEXT,
  children_count INTEGER DEFAULT 0,
  no_children BOOLEAN DEFAULT false,
  status TEXT CHECK (status IN ('active', 'inactive', 'suspended', 'retired')) DEFAULT 'active',
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cases table (if not exists)
CREATE TABLE IF NOT EXISTS cases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_number TEXT UNIQUE NOT NULL,
  case_title TEXT NOT NULL,
  case_type TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('open', 'in_progress', 'closed', 'archived')) DEFAULT 'open',
  assigned_to TEXT,
  reported_by TEXT NOT NULL,
  location TEXT,
  incident_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create duties table
CREATE TABLE IF NOT EXISTS duties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  personnel_id UUID REFERENCES personnel(id) ON DELETE CASCADE,
  duty_type TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('scheduled', 'assigned', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create alerts table (if not exists)
CREATE TABLE IF NOT EXISTS alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'warning', 'error', 'success')) DEFAULT 'info',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('active', 'dismissed', 'resolved')) DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create evidence_files table (for case evidence)
CREATE TABLE IF NOT EXISTS evidence_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document_attachments table (for general attachments)
CREATE TABLE IF NOT EXISTS document_attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  entity_type TEXT NOT NULL, -- 'case', 'personnel', 'report', 'duty'
  entity_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_personnel_badge_number ON personnel(badge_number);
CREATE INDEX IF NOT EXISTS idx_personnel_status ON personnel(status);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_priority ON cases(priority);
CREATE INDEX IF NOT EXISTS idx_duties_personnel_id ON duties(personnel_id);
CREATE INDEX IF NOT EXISTS idx_duties_status ON duties(status);
CREATE INDEX IF NOT EXISTS idx_duties_start_time ON duties(start_time);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_evidence_files_case_id ON evidence_files(case_id);
CREATE INDEX IF NOT EXISTS idx_document_attachments_entity ON document_attachments(entity_type, entity_id);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE duties ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Authenticated users can view profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view personnel" ON personnel FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert personnel" ON personnel FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update personnel" ON personnel FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete personnel" ON personnel FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view cases" ON cases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert cases" ON cases FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update cases" ON cases FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete cases" ON cases FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view duties" ON duties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert duties" ON duties FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update duties" ON duties FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete duties" ON duties FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view alerts" ON alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert alerts" ON alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update alerts" ON alerts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete alerts" ON alerts FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view evidence files" ON evidence_files FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert evidence files" ON evidence_files FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update evidence files" ON evidence_files FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete evidence files" ON evidence_files FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view document attachments" ON document_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert document attachments" ON document_attachments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update document attachments" ON document_attachments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete document attachments" ON document_attachments FOR DELETE TO authenticated USING (true);

-- Insert sample data for testing (optional)
-- Uncomment the following lines if you want sample data

-- INSERT INTO personnel (badge_number, first_name, last_name, email, rank, unit) VALUES
-- ('P001', 'John', 'Doe', 'john.doe@police.gov', 'Constable', 'Patrol'),
-- ('P002', 'Jane', 'Smith', 'jane.smith@police.gov', 'Sergeant', 'Investigation'),
-- ('P003', 'Mike', 'Johnson', 'mike.johnson@police.gov', 'Inspector', 'Traffic')
-- ON CONFLICT (badge_number) DO NOTHING;

-- INSERT INTO cases (case_number, case_title, case_type, description, reported_by) VALUES
-- ('CAS001', 'Theft Investigation', 'Theft', 'Stolen vehicle reported at downtown area', 'John Citizen'),
-- ('CAS002', 'Fraud Case', 'Fraud', 'Credit card fraud investigation', 'Jane Citizen'),
-- ('CAS003', 'Traffic Accident', 'Accident', 'Multi-vehicle accident on highway', 'Traffic Control')
-- ON CONFLICT (case_number) DO NOTHING;

-- INSERT INTO duties (personnel_id, duty_type, description, location, start_time) VALUES
-- ((SELECT id FROM personnel WHERE badge_number = 'P001'), 'Patrol', 'Night patrol duty', 'Downtown District', NOW() + INTERVAL '1 day'),
-- ((SELECT id FROM personnel WHERE badge_number = 'P002'), 'Investigation', 'Case investigation', 'Police Station', NOW() + INTERVAL '2 hours'),
-- ((SELECT id FROM personnel WHERE badge_number = 'P003'), 'Traffic Control', 'Traffic management', 'Main Street', NOW() + INTERVAL '4 hours');

-- Add comments for documentation
COMMENT ON TABLE personnel IS 'Police personnel information and management';
COMMENT ON TABLE cases IS 'Case management and tracking';
COMMENT ON TABLE duties IS 'Duty assignments and scheduling';
COMMENT ON TABLE alerts IS 'System alerts and notifications';
COMMENT ON TABLE evidence_files IS 'Case evidence file metadata';
COMMENT ON TABLE document_attachments IS 'Document attachments for various entities';
