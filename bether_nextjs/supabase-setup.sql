-- Supabase Database Setup for Bether
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  templateKey TEXT NOT NULL,
  repoProvider TEXT,
  repoOwner TEXT,
  repoName TEXT,
  userId UUID NOT NULL,
  status TEXT DEFAULT 'READY',
  env JSONB,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  projectId UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  prompt TEXT,
  status TEXT DEFAULT 'PENDING',
  output TEXT,
  error TEXT,
  metadata JSONB,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(userId);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_project_id ON jobs(projectId);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

-- Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for projects
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (auth.uid() = userId OR auth.role() = 'service_role');

CREATE POLICY "Users can create their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = userId OR auth.role() = 'service_role');

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (auth.uid() = userId OR auth.role() = 'service_role');

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (auth.uid() = userId OR auth.role() = 'service_role');

-- Create RLS policies for jobs
CREATE POLICY "Users can view jobs for their projects" ON jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = jobs.projectId 
      AND projects.userId = auth.uid()
    ) OR auth.role() = 'service_role'
  );

CREATE POLICY "Users can create jobs for their projects" ON jobs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = jobs.projectId 
      AND projects.userId = auth.uid()
    ) OR auth.role() = 'service_role'
  );

CREATE POLICY "Users can update jobs for their projects" ON jobs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = jobs.projectId 
      AND projects.userId = auth.uid()
    ) OR auth.role() = 'service_role'
  );

CREATE POLICY "Users can delete jobs for their projects" ON jobs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = jobs.projectId 
      AND projects.userId = auth.uid()
    ) OR auth.role() = 'service_role'
  );

-- Create function to automatically update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedAt = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updatedAt
CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON projects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at 
  BEFORE UPDATE ON jobs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
