-- Fix Audit Triggers to Work with Service Role Key
-- Run this in your Supabase SQL Editor

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS set_projects_creator ON projects;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS set_jobs_creator ON jobs;
DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;

DROP FUNCTION IF EXISTS set_projects_creator_column();
DROP FUNCTION IF EXISTS update_projects_updated_at_column();
DROP FUNCTION IF EXISTS set_jobs_creator_column();
DROP FUNCTION IF EXISTS update_jobs_updated_at_column();

-- Create function to set creator on insert for projects
-- This function checks if creator is already set, if not, uses userid
CREATE OR REPLACE FUNCTION set_projects_creator_column()
RETURNS TRIGGER AS $$
BEGIN
  -- If creator is not set, use userid
  IF NEW.creator IS NULL THEN
    NEW.creator = NEW.userid;
  END IF;
  
  -- If updater is not set, use userid
  IF NEW.updater IS NULL THEN
    NEW.updater = NEW.userid;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update updater on update for projects
CREATE OR REPLACE FUNCTION update_projects_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedAt = NOW();
  NEW.updater = NEW.userid;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to set creator on insert for jobs
CREATE OR REPLACE FUNCTION set_jobs_creator_column()
RETURNS TRIGGER AS $$
BEGIN
  -- If creator is not set, use userid
  IF NEW.creator IS NULL THEN
    NEW.creator = NEW.userid;
  END IF;
  
  -- If updater is not set, use userid
  IF NEW.updater IS NULL THEN
    NEW.updater = NEW.userid;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update updater on update for jobs
CREATE OR REPLACE FUNCTION update_jobs_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedAt = NOW();
  NEW.updater = NEW.userid;
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
