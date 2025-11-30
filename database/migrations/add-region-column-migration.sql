-- Migration: Add region column to provider_profiles
-- Created: 2025-09-24T21:00:39.897Z
-- Purpose: Fix "Could not find the 'region' column" error

ALTER TABLE provider_profiles 
ADD COLUMN IF NOT EXISTS region VARCHAR(100);

-- Add comment for documentation
COMMENT ON COLUMN provider_profiles.region IS 'Geographic region/state for provider address';
