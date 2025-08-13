-- Supabase Storage Setup for Project Files
-- Run this in your Supabase SQL Editor

-- Create storage bucket for project files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'project-files', 
  'project-files', 
  false, 
  52428800, -- 50MB file size limit
  ARRAY['text/plain', 'text/javascript', 'text/typescript', 'text/css', 'text/html', 'text/markdown', 'application/json', 'application/xml', 'image/png', 'image/jpeg', 'image/gif', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- RLS policies for project files
-- Users can view their own project files
CREATE POLICY "Users can view their own project files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'project-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can upload their own project files
CREATE POLICY "Users can upload their own project files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'project-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own project files
CREATE POLICY "Users can update their own project files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'project-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own project files
CREATE POLICY "Users can delete their own project files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'project-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Service role can access all files (for orchestrator)
CREATE POLICY "Service role can access all project files" ON storage.objects
FOR ALL USING (
  bucket_id = 'project-files' AND 
  auth.role() = 'service_role'
);

-- Verify the bucket was created
SELECT * FROM storage.buckets WHERE id = 'project-files';
