-- Migration: Remove website column from provider_profiles
-- Date: 2025-11-29
-- Description: Removes the website field from provider_profiles table
--              The website field remains in client_profiles as intended

-- Drop the website column from provider_profiles
-- This is a safe operation that only removes this specific column
ALTER TABLE provider_profiles DROP COLUMN IF EXISTS website;

-- Add a comment to document this change
COMMENT ON TABLE provider_profiles IS 'Provider profile information - website field removed on 2025-11-29';
