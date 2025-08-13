-- Fix Audit Triggers for Projects and Jobs
-- Run this in your Supabase SQL Editor

-- Drop existing triggers first
DROP TRIGGER IF EXISTS set_projects_creator ON projects;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS set_jobs_creator ON jobs;
DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;

-- Drop existing functions
DROP FUNCTION IF EXISTS set_projects_creator_column();
DROP FUNCTION IF EXISTS update_projects_updated_at_column();
DROP FUNCTION IF EXISTS set_jobs_creator_column();
DROP FUNCTION IF EXISTS update_jobs_updated_at_column();

-- Create function to automatically set creator on insert for projects
CREATE OR REPLACE FUNCTION set_projects_creator_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.creator = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to automatically update updatedAt timestamp and updater for projects
CREATE OR REPLACE FUNCTION update_projects_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedAt = NOW();
  NEW.updater = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to automatically set creator on insert for jobs
CREATE OR REPLACE FUNCTION set_jobs_creator_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.creator = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to automatically update updatedAt timestamp and updater for jobs
CREATE OR REPLACE FUNCTION update_jobs_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedAt = NOW();
  NEW.updater = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for projects
CREATE TRIGGER set_projects_creator 
  BEFORE INSERT ON projects 
  FOR EACH ROW EXECUTE FUNCTION set_projects_creator_column();

CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON projects 
  FOR EACH ROW EXECUTE FUNCTION update_projects_updated_at_column();

-- Create triggers for jobs
CREATE TRIGGER set_jobs_creator 
  BEFORE INSERT ON jobs 
  FOR EACH ROW EXECUTE FUNCTION set_jobs_creator_column();

CREATE TRIGGER update_jobs_updated_at 
  BEFORE UPDATE ON jobs 
  FOR EACH ROW EXECUTE FUNCTION update_jobs_updated_at_column();

-- Verify triggers are created
SELECT 
  trigger_name, 
  event_object_table, 
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table IN ('projects', 'jobs')
ORDER BY event_object_table, event_manipulation;
