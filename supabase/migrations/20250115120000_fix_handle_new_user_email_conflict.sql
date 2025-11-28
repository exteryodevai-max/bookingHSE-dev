-- Fix handle_new_user function to properly handle email conflicts
-- This resolves the 23505 error that occurs during login when the user already exists

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the new user into the users table with proper conflict handling
  -- Handle conflicts on both id and email constraints
  INSERT INTO public.users (id, email, user_type, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    'client', -- Default user type, can be changed later
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Handle any remaining unique constraint violations gracefully
    -- This includes email conflicts and any other unique constraints
    -- Log the conflict but don't fail the authentication process
    RAISE NOTICE 'User already exists with email %, skipping insert', NEW.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a comment to document the fix
COMMENT ON FUNCTION handle_new_user() IS 'Handles new user creation with proper email and ID conflict resolution to prevent 23505 errors during authentication';