-- Migration: Search Performance Indexes and Full-Text Search
-- Date: 2025-11-29
-- Description: Adds performance indexes for search operations and implements
--              full-text search with weighted ranking for the services table.

-- ============================================================================
-- TASK B-1: Performance Indexes for Search
-- ============================================================================

-- Services table indexes (partial indexes for active services)
CREATE INDEX IF NOT EXISTS idx_services_category_active
  ON services(category) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_services_base_price_active
  ON services(base_price) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_services_created_at_desc_active
  ON services(created_at DESC) WHERE active = true;

-- Compound index for common query pattern (category + active + featured)
CREATE INDEX IF NOT EXISTS idx_services_category_active_featured
  ON services(category, active, featured)
  WHERE active = true;

-- Provider profiles indexes
CREATE INDEX IF NOT EXISTS idx_provider_profiles_verified
  ON provider_profiles(verified);

CREATE INDEX IF NOT EXISTS idx_provider_profiles_rating_average_desc
  ON provider_profiles(rating_average DESC);

-- ============================================================================
-- TASK B-3: Full-Text Search with Weighted Ranking
-- ============================================================================

-- Add search_vector column for full-text search
ALTER TABLE services ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update search vector with weighted fields
-- Weight A: title (most important)
-- Weight B: description (secondary importance)
-- Weight C: subcategory (tertiary importance)
CREATE OR REPLACE FUNCTION update_services_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('italian', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('italian', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('italian', COALESCE(NEW.subcategory, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search_vector on insert/update
DROP TRIGGER IF EXISTS services_search_vector_trigger ON services;
CREATE TRIGGER services_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, description, subcategory ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_services_search_vector();

-- Create GIN index on search_vector for fast full-text search
CREATE INDEX IF NOT EXISTS idx_services_search_vector
  ON services USING GIN(search_vector);

-- Update existing rows to populate search_vector
UPDATE services
SET search_vector =
  setweight(to_tsvector('italian', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('italian', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('italian', COALESCE(subcategory, '')), 'C')
WHERE search_vector IS NULL OR search_vector = '';

-- ============================================================================
-- Helper function for ranked full-text search queries
-- ============================================================================

-- Create a helper function to search services with ranking
CREATE OR REPLACE FUNCTION search_services_ranked(
  search_query TEXT,
  category_filter service_category DEFAULT NULL,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  description TEXT,
  category service_category,
  subcategory VARCHAR,
  base_price NUMERIC,
  provider_id UUID,
  active BOOLEAN,
  featured BOOLEAN,
  created_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.title,
    s.description,
    s.category,
    s.subcategory,
    s.base_price,
    s.provider_id,
    s.active,
    s.featured,
    s.created_at,
    ts_rank(s.search_vector, plainto_tsquery('italian', search_query)) AS rank
  FROM services s
  WHERE
    s.active = true
    AND s.search_vector @@ plainto_tsquery('italian', search_query)
    AND (category_filter IS NULL OR s.category = category_filter)
  ORDER BY
    s.featured DESC,
    rank DESC,
    s.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission on the search function
GRANT EXECUTE ON FUNCTION search_services_ranked TO anon, authenticated;

-- ============================================================================
-- Verification comments
-- ============================================================================
COMMENT ON INDEX idx_services_category_active IS 'Partial index on category for active services - improves category filtering';
COMMENT ON INDEX idx_services_base_price_active IS 'Partial index on base_price for active services - improves price sorting/filtering';
COMMENT ON INDEX idx_services_created_at_desc_active IS 'Partial index on created_at DESC for active services - improves recency sorting';
COMMENT ON INDEX idx_services_category_active_featured IS 'Compound partial index for common query pattern - category + active + featured';
COMMENT ON INDEX idx_provider_profiles_verified IS 'Index on verified status for provider filtering';
COMMENT ON INDEX idx_provider_profiles_rating_average_desc IS 'Index on rating_average DESC for sorting by rating';
COMMENT ON INDEX idx_services_search_vector IS 'GIN index on search_vector for full-text search';
COMMENT ON COLUMN services.search_vector IS 'tsvector column for full-text search with weighted ranking (A:title, B:description, C:subcategory)';
