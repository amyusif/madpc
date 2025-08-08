-- Supabase Storage Setup for MADPC File Management
-- Run this script in your Supabase SQL editor to set up storage buckets

-- Create storage buckets for different file types
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'user-profiles',
    'user-profiles',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  ),
  (
    'personnel-photos',
    'personnel-photos',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  ),
  (
    'case-evidence',
    'case-evidence',
    false, -- Private bucket for evidence
    52428800, -- 50MB
    ARRAY[
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      'application/pdf',
      'video/mp4', 'video/webm',
      'audio/mp3', 'audio/wav'
    ]
  ),
  (
    'documents',
    'documents',
    false, -- Private bucket for documents
    10485760, -- 10MB
    ARRAY[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
  ),
  (
    'reports',
    'reports',
    false, -- Private bucket for reports
    10485760, -- 10MB
    ARRAY[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
  ),
  (
    'imports',
    'imports',
    false, -- Private bucket for import files
    10485760, -- 10MB
    ARRAY[
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  )
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for user profiles (public read, authenticated write)
CREATE POLICY "User profiles are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-profiles');

CREATE POLICY "Authenticated users can upload user profiles"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-profiles');

CREATE POLICY "Authenticated users can update user profiles"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'user-profiles');

CREATE POLICY "Authenticated users can delete user profiles"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'user-profiles');

-- Create RLS policies for personnel photos (public read, authenticated write)
CREATE POLICY "Personnel photos are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'personnel-photos');

CREATE POLICY "Authenticated users can upload personnel photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'personnel-photos');

CREATE POLICY "Authenticated users can update personnel photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'personnel-photos');

CREATE POLICY "Authenticated users can delete personnel photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'personnel-photos');

-- Create RLS policies for case evidence (authenticated only)
CREATE POLICY "Authenticated users can view case evidence"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'case-evidence');

CREATE POLICY "Authenticated users can upload case evidence"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'case-evidence');

CREATE POLICY "Authenticated users can update case evidence"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'case-evidence');

CREATE POLICY "Authenticated users can delete case evidence"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'case-evidence');

-- Create RLS policies for documents (authenticated only)
CREATE POLICY "Authenticated users can view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can update documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');

-- Create RLS policies for reports (authenticated only)
CREATE POLICY "Authenticated users can view reports"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'reports');

CREATE POLICY "Authenticated users can upload reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'reports');

CREATE POLICY "Authenticated users can update reports"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'reports');

CREATE POLICY "Authenticated users can delete reports"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'reports');

-- Create RLS policies for imports (authenticated only)
CREATE POLICY "Authenticated users can view imports"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'imports');

CREATE POLICY "Authenticated users can upload imports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'imports');

CREATE POLICY "Authenticated users can update imports"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'imports');

CREATE POLICY "Authenticated users can delete imports"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'imports');

-- Add photo_url column to personnel table if it doesn't exist
ALTER TABLE personnel
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add avatar_url column to profiles table if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create evidence_files table for tracking case evidence
CREATE TABLE IF NOT EXISTS evidence_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- Create document_attachments table for general document attachments
CREATE TABLE IF NOT EXISTS document_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
CREATE INDEX IF NOT EXISTS idx_evidence_files_case_id ON evidence_files(case_id);
CREATE INDEX IF NOT EXISTS idx_document_attachments_entity ON document_attachments(entity_type, entity_id);

-- Enable RLS on new tables
ALTER TABLE evidence_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for evidence_files
CREATE POLICY "Authenticated users can view evidence files"
ON evidence_files FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert evidence files"
ON evidence_files FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update evidence files"
ON evidence_files FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete evidence files"
ON evidence_files FOR DELETE
TO authenticated
USING (true);

-- Create RLS policies for document_attachments
CREATE POLICY "Authenticated users can view document attachments"
ON document_attachments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert document attachments"
ON document_attachments FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update document attachments"
ON document_attachments FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete document attachments"
ON document_attachments FOR DELETE
TO authenticated
USING (true);

-- Add comments for documentation
COMMENT ON TABLE evidence_files IS 'Stores metadata for case evidence files';
COMMENT ON TABLE document_attachments IS 'Stores metadata for document attachments across different entities';
COMMENT ON COLUMN personnel.photo_url IS 'URL to personnel profile photo in storage';
