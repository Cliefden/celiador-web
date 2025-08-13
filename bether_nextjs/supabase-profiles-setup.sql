-- Supabase Profiles Table Setup for Bether
-- Run this in your Supabase SQL Editor

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Audit fields
  creator UUID,
  updater UUID,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleter UUID,
  deletedAt TIMESTAMP WITH TIME ZONE,
  
  -- Basic profile information
  username TEXT UNIQUE,
  full_name TEXT,
  website TEXT,
  avatar_url TEXT,
  
  -- Detailed name components
  name_prefix TEXT,
  first_name TEXT,
  middle_name TEXT,
  pre_last_name TEXT,
  last_name TEXT,
  name_suffix TEXT,
  
  -- Contact information
  phone_number TEXT,
  personal_id TEXT,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deletedAt);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON profiles(updatedAt);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (
    auth.uid() = id 
    OR auth.uid() = creator 
    OR auth.uid() = updater
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Users can create their own profile" ON profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id 
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (
    auth.uid() = id 
    OR auth.uid() = creator
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Users can delete their own profile" ON profiles
  FOR DELETE USING (
    auth.uid() = id 
    OR auth.uid() = creator
    OR auth.role() = 'service_role'
  );

-- Create function to automatically update updatedAt timestamp and updater
CREATE OR REPLACE FUNCTION update_profiles_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedAt = NOW();
  NEW.updater = auth.uid();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to automatically set creator on insert
CREATE OR REPLACE FUNCTION set_profiles_creator_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.creator = auth.uid();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update audit fields
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_profiles_updated_at_column();

CREATE TRIGGER set_profiles_creator 
  BEFORE INSERT ON profiles 
  FOR EACH ROW EXECUTE FUNCTION set_profiles_creator_column();

-- Create a function to sync auth.users with profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing tables to reference profiles instead of auth.users
-- This is optional and can be done later when migrating existing data

-- Example: Update projects table to reference profiles
-- ALTER TABLE projects ADD COLUMN creator_profile UUID REFERENCES profiles(id);
-- ALTER TABLE projects ADD COLUMN updater_profile UUID REFERENCES profiles(id);
-- ALTER TABLE projects ADD COLUMN deleter_profile UUID REFERENCES profiles(id);

-- Example: Update jobs table to reference profiles  
-- ALTER TABLE jobs ADD COLUMN creator_profile UUID REFERENCES profiles(id);
-- ALTER TABLE jobs ADD COLUMN updater_profile UUID REFERENCES profiles(id);
-- ALTER TABLE jobs ADD COLUMN deleter_profile UUID REFERENCES profiles(id);
