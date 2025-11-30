-- Fix: Add region column to provider_profiles table
-- This fixes the "Could not find the 'region' column" error

-- Check if region column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'provider_profiles' AND column_name = 'region'
    ) THEN
        ALTER TABLE provider_profiles 
        ADD COLUMN region VARCHAR(100);
        
        RAISE NOTICE '✅ region column added successfully';
    ELSE
        RAISE NOTICE 'ℹ️ region column already exists';
    END IF;
END
$$;

-- Verify the column was added
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'provider_profiles' AND column_name = 'region';