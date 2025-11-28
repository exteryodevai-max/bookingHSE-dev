-- Fix RLS policies for email verification
-- Check if INSERT policy for client_profiles exists and recreate if needed

-- Drop existing policy if it exists (ignore errors if it doesn't exist)
DROP POLICY IF EXISTS "Users can insert their own client profile" ON client_profiles;

-- Add INSERT policy for client_profiles
CREATE POLICY "Users can insert their own client profile" 
ON client_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Verify all policies are in place
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('users', 'client_profiles', 'provider_profiles')
ORDER BY tablename, cmd, policyname;