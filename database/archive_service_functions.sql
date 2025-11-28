-- Funzione per archiviare un servizio (sposta da services a archived_services)
CREATE OR REPLACE FUNCTION archive_service(service_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  service_record RECORD;
  archived_count INTEGER;
BEGIN
  -- Verifica che il servizio esista e appartenga all'utente
  SELECT * INTO service_record
  FROM services 
  WHERE id = service_id AND provider_id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Servizio non trovato o non autorizzato';
  END IF;
  
  -- Inserisce il servizio nella tabella archived_services
  INSERT INTO archived_services (
    id, provider_id, title, description, category, duration, price, 
    currency, location_type, location_address, requirements, images, 
    active, created_at, updated_at, metadata
  ) VALUES (
    service_record.id, service_record.provider_id, service_record.title, 
    service_record.description, service_record.category, service_record.duration, 
    service_record.price, service_record.currency, service_record.location_type, 
    service_record.location_address, service_record.requirements, service_record.images,
    false, service_record.created_at, service_record.updated_at, service_record.metadata
  );
  
  -- Elimina il servizio dalla tabella services
  DELETE FROM services WHERE id = service_id;
  
  -- Restituisce true se l'operazione è riuscita
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per ripristinare un servizio (sposta da archived_services a services)
CREATE OR REPLACE FUNCTION restore_service(service_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  archived_record RECORD;
  restored_count INTEGER;
BEGIN
  -- Verifica che il servizio archiviato esista e appartenga all'utente
  SELECT * INTO archived_record
  FROM archived_services 
  WHERE id = service_id AND provider_id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Servizio archiviato non trovato o non autorizzato';
  END IF;
  
  -- Inserisce il servizio nella tabella services
  INSERT INTO services (
    id, provider_id, title, description, category, duration, price, 
    currency, location_type, location_address, requirements, images, 
    active, created_at, updated_at, metadata
  ) VALUES (
    archived_record.id, archived_record.provider_id, archived_record.title, 
    archived_record.description, archived_record.category, archived_record.duration, 
    archived_record.price, archived_record.currency, archived_record.location_type, 
    archived_record.location_address, archived_record.requirements, archived_record.images,
    true, archived_record.created_at, archived_record.updated_at, archived_record.metadata
  );
  
  -- Elimina il servizio dalla tabella archived_services
  DELETE FROM archived_services WHERE id = service_id;
  
  -- Restituisce true se l'operazione è riuscita
  GET DIAGNOSTICS restored_count = ROW_COUNT;
  RETURN restored_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;