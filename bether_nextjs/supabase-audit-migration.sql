-- Migration script to add audit fields to existing tables
-- Run this in your Supabase SQL Editor after the main setup

-- Add audit fields to projects table if they don't exist
DO $$ 
BEGIN
    -- Add creator column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'creator') THEN
        ALTER TABLE projects ADD COLUMN creator UUID;
    END IF;
    
    -- Add updater column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'updater') THEN
        ALTER TABLE projects ADD COLUMN updater UUID;
    END IF;
    
    -- Add deleter column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'deleter') THEN
        ALTER TABLE projects ADD COLUMN deleter UUID;
    END IF;
    
    -- Add deletedAt column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'deletedAt') THEN
        ALTER TABLE projects ADD COLUMN "deletedAt" TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add audit fields to jobs table if they don't exist
DO $$ 
BEGIN
    -- Add userId column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'userid') THEN
        ALTER TABLE jobs ADD COLUMN userid UUID;
    END IF;
    
    -- Add creator column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'creator') THEN
        ALTER TABLE jobs ADD COLUMN creator UUID;
    END IF;
    
    -- Add updater column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'updater') THEN
        ALTER TABLE jobs ADD COLUMN updater UUID;
    END IF;
    
    -- Add deleter column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'deleter') THEN
        ALTER TABLE jobs ADD COLUMN deleter UUID;
    END IF;
    
    -- Add deletedAt column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'deletedAt') THEN
        ALTER TABLE jobs ADD COLUMN "deletedAt" TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects("deletedAt");
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(userid);
CREATE INDEX IF NOT EXISTS idx_jobs_deleted_at ON jobs("deletedAt");

-- Update existing records to set creator and updater based on userId
UPDATE projects 
SET creator = userId, updater = userId 
WHERE creator IS NULL;

UPDATE jobs 
SET creator = userid, updater = userid 
WHERE creator IS NULL AND userid IS NOT NULL;

-- Update RLS policies to include audit fields
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (
    (auth.uid() = userId OR auth.uid() = creator OR auth.uid() = updater) 
    AND "deletedAt" IS NULL 
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (
    (auth.uid() = userId OR auth.uid() = creator) 
    AND "deletedAt" IS NULL 
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (
    (auth.uid() = userId OR auth.uid() = creator) 
    AND "deletedAt" IS NULL 
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Users can view jobs for their projects" ON jobs;
CREATE POLICY "Users can view jobs for their projects" ON jobs
  FOR SELECT USING (
    (
      EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = jobs.projectId 
        AND projects.userId = auth.uid()
      )
      OR auth.uid() = jobs.userid 
      OR auth.uid() = jobs.creator 
      OR auth.uid() = jobs.updater
    )
    AND jobs."deletedAt" IS NULL 
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Users can update jobs for their projects" ON jobs;
CREATE POLICY "Users can update jobs for their projects" ON jobs
  FOR UPDATE USING (
    (
      EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = jobs.projectId 
        AND projects.userId = auth.uid()
      )
      OR auth.uid() = jobs.userid 
      OR auth.uid() = jobs.creator
    )
    AND jobs."deletedAt" IS NULL 
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Users can delete jobs for their projects" ON jobs;
CREATE POLICY "Users can delete jobs for their projects" ON jobs
  FOR DELETE USING (
    (
      EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = jobs.projectId 
        AND projects.userId = auth.uid()
      )
      OR auth.uid() = jobs.userid 
      OR auth.uid() = jobs.creator
    )
    AND jobs."deletedAt" IS NULL 
    OR auth.role() = 'service_role'
  );

-- Update the trigger functions to handle audit fields
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedAt = NOW();
  NEW.updater = auth.uid();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION set_creator_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.creator = auth.uid();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_projects_creator') THEN
        CREATE TRIGGER set_projects_creator 
          BEFORE INSERT ON projects 
          FOR EACH ROW EXECUTE FUNCTION set_creator_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_jobs_creator') THEN
        CREATE TRIGGER set_jobs_creator 
          BEFORE INSERT ON jobs 
          FOR EACH ROW EXECUTE FUNCTION set_creator_column();
    END IF;
END $$;
