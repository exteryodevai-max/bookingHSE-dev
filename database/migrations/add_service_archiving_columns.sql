-- Migration: Add service archiving columns
-- Date: 2025-01-27
-- Description: Adds archiving columns to services table for soft delete functionality

-- Add archived_at column to track when a service was archived
ALTER TABLE services 
ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;

-- Add archived_reason column to store the reason for archiving
ALTER TABLE services 
ADD COLUMN archived_reason VARCHAR(500);

-- Add index on archived_at for better query performance
CREATE INDEX idx_services_archived_at ON services(archived_at);

-- Add composite index for provider_id and archived_at for provider service queries
CREATE INDEX idx_services_provider_archived ON services(provider_id, archived_at);

-- Add comment to document the columns
COMMENT ON COLUMN services.archived_at IS 'Timestamp when the service was archived (soft deleted)';
COMMENT ON COLUMN services.archived_reason IS 'Reason for archiving the service';

-- Update existing archived services to have archived_at timestamp
UPDATE services 
SET archived_at = updated_at 
WHERE active = false AND archived_at IS NULL;