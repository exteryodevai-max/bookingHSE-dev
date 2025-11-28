-- Migration: Add region column to provider_profiles table
-- Date: 2024-01-20
-- Description: Adds the missing 'region' column to provider_profiles table to fix validation errors

-- Add the region column to provider_profiles table
ALTER TABLE provider_profiles 
ADD COLUMN region VARCHAR(100);

-- Add a comment to document the column
COMMENT ON COLUMN provider_profiles.region IS 'Geographic region/state for provider address';

-- Update existing records to have empty region (can be updated later)
UPDATE provider_profiles 
SET region = '' 
WHERE region IS NULL;