-- Delete all services for provider "Pippo srl"
-- This migration will remove all services associated with the provider "Pippo srl"
-- while keeping the provider profile intact

-- First, let's identify the provider ID for "Pippo srl"
-- We'll use a transaction to ensure data consistency

BEGIN;

-- Get the provider ID for "Pippo srl"
-- Note: We're looking in the users table since providers are stored there
WITH pippo_provider AS (
  SELECT id 
  FROM users 
  WHERE company_name = 'Pippo srl' 
    AND user_type = 'provider'
  LIMIT 1
)
-- Delete all services for this provider
DELETE FROM services