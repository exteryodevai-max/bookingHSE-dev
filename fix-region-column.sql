-- FIX: Add region column to provider_profiles table
-- This fixes the "Could not find the 'region' column of 'provider_profiles'" error

-- Add the missing region column
ALTER TABLE provider_profiles 
ADD COLUMN IF NOT EXISTS region VARCHAR(100);

-- Add comment for documentation
COMMENT ON COLUMN provider_profiles.region IS 'Geographic region/state for provider address';

-- Verify the column was added
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'provider_profiles' AND column_name = 'region';