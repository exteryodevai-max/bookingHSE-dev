CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_services_title_trgm
  ON services USING GIN (lower(title) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_services_description_trgm
  ON services USING GIN (lower(description) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_services_subcategory_trgm
  ON services USING GIN (lower(subcategory) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_services_service_areas_gin
  ON services USING GIN (service_areas);

-- Ensure previous trigger is removed before redefining the function
DROP TRIGGER IF EXISTS services_service_areas_lower_trigger ON services;
CREATE OR REPLACE FUNCTION set_service_areas_lower()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.service_areas IS NULL THEN
    NEW.service_areas_lower := NULL;
  ELSE
    SELECT array_agg(lower(x)) INTO NEW.service_areas_lower FROM unnest(NEW.service_areas) AS x;
  END IF;
  RETURN NEW;
END;
$$;

ALTER TABLE services ADD COLUMN IF NOT EXISTS service_areas_lower text[];

CREATE TRIGGER services_service_areas_lower_trigger
BEFORE INSERT OR UPDATE OF service_areas ON services
FOR EACH ROW
EXECUTE FUNCTION set_service_areas_lower();

CREATE INDEX IF NOT EXISTS idx_services_service_areas_lower_gin
  ON services USING GIN (service_areas_lower);

UPDATE services
SET service_areas_lower = (
  SELECT array_agg(lower(x)) FROM unnest(services.service_areas) AS x
)
WHERE service_areas IS NOT NULL AND (service_areas_lower IS NULL OR array_length(service_areas_lower,1) IS DISTINCT FROM array_length(service_areas,1));