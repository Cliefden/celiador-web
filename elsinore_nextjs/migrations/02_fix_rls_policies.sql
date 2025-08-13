-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON profiles;

-- Create a policy to allow users to delete their own profile
CREATE POLICY "Users can delete their own profile"
  ON profiles
  FOR DELETE
  USING (auth.uid() = id);

-- Create a policy to allow service role to access all profiles
-- This will be used by server-side functions with service role
CREATE POLICY "Service role can access all profiles"
  ON profiles
  USING (auth.jwt() ->> 'role' = 'service_role'); 