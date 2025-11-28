-- Migration: Add archived services table and functions
-- Created at: 2024-09-24 19:00:00

-- Step 1: Create archived_services table
CREATE TABLE IF NOT EXISTS archived_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  duration INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  location_type VARCHAR(50) DEFAULT 'online',
  location_address TEXT,
  requirements TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Step 2: Enable RLS
ALTER TABLE archived_services ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS Policies
CREATE POLICY "Provider can view own archived services" ON archived_services
  FOR SELECT USING (auth.uid() = provider_id);

CREATE POLICY "Provider can archive own services" ON archived_services
  FOR INSERT WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Provider can restore own archived services" ON archived_services
  FOR DELETE USING (auth.uid() = provider_id);

-- Step 4: Create indexes
CREATE INDEX idx_archived_services_provider_id ON archived_services(provider_id);
CREATE INDEX idx_archived_services_category ON archived_services(category);
CREATE INDEX idx_archived_services_created_at ON archived_services(created_at DESC);

-- Step 5: Create updated_at trigger
CREATE OR REPLACE FUNCTION update_archived_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_archived_services_updated_at
  BEFORE UPDATE ON archived_services
  FOR EACH ROW
  EXECUTE FUNCTION update_archived_services_updated_at();

-- Step 6: Create archive function
CREATE OR REPLACE FUNCTION archive_service(p_service_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  service_record RECORD;
BEGIN
  -- Get service record
  SELECT * INTO service_record
  FROM services 
  WHERE id = p_service_id AND provider_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found or unauthorized';
  END IF;
  
  -- Insert into archived_services
  INSERT INTO archived_services (
    id, provider_id, title, description, category, duration, price, 
    currency, location_type, location_address, requirements, images, 
    active, created_at, updated_at, metadata
  ) VALUES (
    service_record.id, service_record.provider_id, service_record.title, 
    service_record.description, service_record.category, 
    COALESCE(service_record.duration_hours, 0), -- Map duration_hours to duration
    service_record.base_price, -- Map base_price to price
    service_record.currency, service_record.location_type, 
    '', -- Empty string for location_address (field doesn't exist in services table)
    COALESCE(ARRAY_TO_STRING(service_record.requirements, ', '), ''), -- Map requirements array to text
    COALESCE(ARRAY_TO_STRING(service_record.images, ', '), ''), -- Map images array to text
    false, service_record.created_at, service_record.updated_at, 
    jsonb_build_object(
      'subcategory', service_record.subcategory,
      'service_type', service_record.service_type,
      'pricing_unit', service_record.pricing_unit,
      'duration_hours', service_record.duration_hours,
      'max_participants', service_record.max_participants,
      'min_participants', service_record.min_participants,
      'service_areas', service_record.service_areas,
      'deliverables', service_record.deliverables,
      'tags', service_record.tags,
      'documents', service_record.documents,
      'featured', service_record.featured,
      'slug', service_record.slug,
      'meta_description', service_record.meta_description
    )
  );
  
  -- Delete from services
  DELETE FROM services WHERE id = p_service_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create restore function
CREATE OR REPLACE FUNCTION restore_service(p_service_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  archived_record RECORD;
  metadata_json JSONB;
BEGIN
  -- Get archived service record
  SELECT * INTO archived_record
  FROM archived_services 
  WHERE id = p_service_id AND provider_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Archived service not found or unauthorized';
  END IF;
  
  -- Parse metadata if it exists
  metadata_json := COALESCE(archived_record.metadata, '{}'::JSONB);
  
  -- Insert back into services
  INSERT INTO services (
    id, provider_id, title, description, category, subcategory, service_type,
    location_type, base_price, pricing_unit, currency,
    duration_hours, max_participants, min_participants, service_areas,
    requirements, deliverables, tags, images, documents, active, featured,
    slug, meta_description, created_at, updated_at
  ) VALUES (
    archived_record.id, archived_record.provider_id, archived_record.title, 
    archived_record.description, archived_record.category,
    COALESCE(metadata_json->>'subcategory', NULL),
    COALESCE(metadata_json->>'service_type', 'on_request'),
    archived_record.location_type,
    archived_record.price, -- Map price back to base_price
    COALESCE(metadata_json->>'pricing_unit', 'fixed'),
    archived_record.currency,
    archived_record.duration, -- Map duration back to duration_hours
    COALESCE((metadata_json->>'max_participants')::INTEGER, NULL),
    COALESCE((metadata_json->>'min_participants')::INTEGER, 1),
    COALESCE((metadata_json->'service_areas')::TEXT[], NULL),
    CASE 
      WHEN archived_record.requirements IS NOT NULL AND archived_record.requirements != '' 
      THEN STRING_TO_ARRAY(archived_record.requirements, ', ') 
      ELSE '{}'::TEXT[] 
    END,
    COALESCE((metadata_json->'deliverables')::TEXT[], NULL),
    COALESCE((metadata_json->'tags')::TEXT[], NULL),
    CASE 
      WHEN archived_record.images IS NOT NULL AND archived_record.images != '' 
      THEN STRING_TO_ARRAY(archived_record.images, ', ') 
      ELSE '{}'::TEXT[] 
    END,
    COALESCE((metadata_json->'documents')::TEXT[], NULL),
    true, -- active
    COALESCE((metadata_json->>'featured')::BOOLEAN, false),
    COALESCE(metadata_json->>'slug', NULL),
    COALESCE(metadata_json->>'meta_description', NULL),
    archived_record.created_at, archived_record.updated_at
  );
  
  -- Delete from archived_services
  DELETE FROM archived_services WHERE id = p_service_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;