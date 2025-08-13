-- First, create a backup of the profiles table
CREATE TABLE profiles_backup AS SELECT * FROM profiles;

-- Drop existing triggers that depend on the enum
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop existing policies that might reference the type
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can access all profiles" ON profiles;

-- Drop the profiles table (which depends on the enum)
DROP TABLE IF EXISTS profiles;

-- Drop and recreate the enum with new values
DROP TYPE IF EXISTS user_role;
CREATE TYPE user_role AS ENUM ('super', 'admin', 'client', 'supplier', 'user');

-- Recreate the profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'user',
  first_name TEXT,
  middle_name TEXT,
  pre_last_name TEXT,
  last_name TEXT,
  personal_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Restore data from backup
INSERT INTO profiles (
  id, role,
  first_name, middle_name, pre_last_name, last_name, personal_id,
  created_at, updated_at
)
SELECT 
  id,
  CASE 
    WHEN role::text = 'super' THEN 'super'::user_role
    WHEN role::text = 'admin' THEN 'admin'::user_role
    ELSE 'user'::user_role
  END,
  first_name, middle_name, pre_last_name, last_name, personal_id,
  created_at, updated_at
FROM profiles_backup;

-- Drop the backup table
DROP TABLE profiles_backup;

-- Recreate the function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger for new user signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Recreate the policies
CREATE POLICY "Users can read their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
  ON profiles
  FOR DELETE
  USING (auth.uid() = id);

CREATE POLICY "Service role can access all profiles"
  ON profiles
  USING (auth.jwt() ->> 'role' = 'service_role'); 