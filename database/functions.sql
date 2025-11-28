-- Funzioni SQL personalizzate per BookingHSE
-- Da eseguire dopo schema.sql per funzionalità avanzate

-- Abilita estensioni necessarie per funzioni geografiche
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Funzione per calcolare la distanza tra due punti geografici
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL,
  lng1 DECIMAL,
  lat2 DECIMAL,
  lng2 DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
  -- Formula di Haversine per calcolare la distanza in km
  RETURN (
    6371 * acos(
      cos(radians(lat1)) * 
      cos(radians(lat2)) * 
      cos(radians(lng2) - radians(lng1)) + 
      sin(radians(lat1)) * 
      sin(radians(lat2))
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Funzione per ricerca servizi per distanza
CREATE OR REPLACE FUNCTION services_by_distance(
  lat DECIMAL,
  lng DECIMAL,
  radius_km DECIMAL DEFAULT 50
)
RETURNS TABLE(
  id UUID,
  provider_id UUID,
  title VARCHAR,
  description TEXT,
  category service_category,
  subcategory VARCHAR,
  service_type service_type,
  location_type location_type,
  base_price DECIMAL,
  pricing_unit pricing_unit,
  currency VARCHAR,
  duration_hours DECIMAL,
  max_participants INTEGER,
  min_participants INTEGER,
  service_areas TEXT[],
  requirements TEXT[],
  deliverables TEXT[],
  active BOOLEAN,
  featured BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  distance_km DECIMAL,
  provider_name VARCHAR,
  provider_rating DECIMAL,
  provider_verified BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.provider_id,
    s.title,
    s.description,
    s.category,
    s.subcategory,
    s.service_type,
    s.location_type,
    s.base_price,
    s.pricing_unit,
    s.currency,
    s.duration_hours,
    s.max_participants,
    s.min_participants,
    s.service_areas,
    s.requirements,
    s.deliverables,
    s.active,
    s.featured,
    s.created_at,
    s.updated_at,
    calculate_distance(lat, lng, pp.latitude, pp.longitude) AS distance_km,
    pp.business_name AS provider_name,
    pp.rating_average AS provider_rating,
    pp.verified AS provider_verified
  FROM services s
  INNER JOIN provider_profiles pp ON s.provider_id = pp.user_id
  WHERE 
    s.active = true
    AND pp.latitude IS NOT NULL 
    AND pp.longitude IS NOT NULL
    AND calculate_distance(lat, lng, pp.latitude, pp.longitude) <= radius_km
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- Funzione per ricerca full-text avanzata
CREATE OR REPLACE FUNCTION search_services_fulltext(
  search_query TEXT,
  search_limit INTEGER DEFAULT 20,
  search_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  title VARCHAR,
  description TEXT,
  category service_category,
  subcategory VARCHAR,
  base_price DECIMAL,
  provider_name VARCHAR,
  provider_rating DECIMAL,
  relevance_score REAL
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
    pp.business_name AS provider_name,
    pp.rating_average AS provider_rating,
    (
      similarity(unaccent(lower(s.title)), unaccent(lower(search_query))) * 3 +
      similarity(unaccent(lower(s.description)), unaccent(lower(search_query))) * 2 +
      similarity(unaccent(lower(s.subcategory)), unaccent(lower(search_query))) * 1.5 +
      similarity(unaccent(lower(pp.business_name)), unaccent(lower(search_query))) * 1
    ) AS relevance_score
  FROM services s
  INNER JOIN provider_profiles pp ON s.provider_id = pp.user_id
  WHERE 
    s.active = true
    AND (
      unaccent(lower(s.title)) % unaccent(lower(search_query))
      OR unaccent(lower(s.description)) % unaccent(lower(search_query))
      OR unaccent(lower(s.subcategory)) % unaccent(lower(search_query))
      OR unaccent(lower(pp.business_name)) % unaccent(lower(search_query))
    )
  ORDER BY relevance_score DESC
  LIMIT search_limit
  OFFSET search_offset;
END;
$$ LANGUAGE plpgsql;

-- Funzione per calcolare statistiche provider
CREATE OR REPLACE FUNCTION calculate_provider_stats(provider_user_id UUID)
RETURNS TABLE(
  total_services INTEGER,
  active_services INTEGER,
  total_bookings INTEGER,
  completed_bookings INTEGER,
  total_revenue DECIMAL,
  average_rating DECIMAL,
  total_reviews INTEGER,
  response_rate DECIMAL,
  completion_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM services WHERE provider_id = provider_user_id),
    (SELECT COUNT(*)::INTEGER FROM services WHERE provider_id = provider_user_id AND active = true),
    (SELECT COUNT(*)::INTEGER FROM bookings WHERE provider_id = provider_user_id),
    (SELECT COUNT(*)::INTEGER FROM bookings WHERE provider_id = provider_user_id AND status = 'completed'),
    (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE provider_id = provider_user_id AND payment_status = 'captured'),
    (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE provider_id = provider_user_id),
    (SELECT COUNT(*)::INTEGER FROM reviews WHERE provider_id = provider_user_id),
    (
      SELECT CASE 
        WHEN COUNT(*) = 0 THEN 0
        ELSE (COUNT(*) FILTER (WHERE status != 'pending'))::DECIMAL / COUNT(*) * 100
      END
      FROM bookings 
      WHERE provider_id = provider_user_id 
        AND created_at >= NOW() - INTERVAL '30 days'
    ),
    (
      SELECT CASE 
        WHEN COUNT(*) = 0 THEN 0
        ELSE (COUNT(*) FILTER (WHERE status = 'completed'))::DECIMAL / COUNT(*) * 100
      END
      FROM bookings 
      WHERE provider_id = provider_user_id
    );
END;
$$ LANGUAGE plpgsql;

-- Funzione per aggiornare il rating del provider
CREATE OR REPLACE FUNCTION update_provider_rating(provider_user_id UUID)
RETURNS VOID AS $$
DECLARE
  new_rating DECIMAL;
  review_count INTEGER;
BEGIN
  SELECT 
    COALESCE(AVG(rating), 0),
    COUNT(*)
  INTO new_rating, review_count
  FROM reviews 
  WHERE provider_id = provider_user_id;
  
  UPDATE provider_profiles 
  SET 
    rating_average = new_rating,
    reviews_count = review_count,
    updated_at = NOW()
  WHERE user_id = provider_user_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger per aggiornare automaticamente il rating quando viene aggiunta una recensione
CREATE OR REPLACE FUNCTION trigger_update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM update_provider_rating(NEW.provider_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_provider_rating(OLD.provider_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reviews_update_provider_rating ON reviews;
CREATE TRIGGER reviews_update_provider_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_provider_rating();

-- Funzione per ottenere servizi trending
CREATE OR REPLACE FUNCTION get_trending_services(
  days_back INTEGER DEFAULT 30,
  result_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  title VARCHAR,
  category service_category,
  base_price DECIMAL,
  provider_name VARCHAR,
  booking_count BIGINT,
  revenue DECIMAL,
  trend_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.category,
    s.base_price,
    pp.business_name AS provider_name,
    COUNT(b.id) AS booking_count,
    COALESCE(SUM(b.total_amount), 0) AS revenue,
    (
      COUNT(b.id)::DECIMAL * 0.6 + 
      COALESCE(SUM(b.total_amount), 0) / 1000 * 0.4
    ) AS trend_score
  FROM services s
  INNER JOIN provider_profiles pp ON s.provider_id = pp.user_id
  LEFT JOIN bookings b ON s.id = b.service_id 
    AND b.created_at >= NOW() - INTERVAL '1 day' * days_back
    AND b.status IN ('confirmed', 'in_progress', 'completed')
  WHERE s.active = true
  GROUP BY s.id, s.title, s.category, s.base_price, pp.business_name
  ORDER BY trend_score DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Funzione per raccomandazioni personalizzate
CREATE OR REPLACE FUNCTION get_personalized_recommendations(
  user_id UUID,
  result_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  title VARCHAR,
  category service_category,
  base_price DECIMAL,
  provider_name VARCHAR,
  provider_rating DECIMAL,
  recommendation_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH user_preferences AS (
    -- Analizza le preferenze dell'utente basate sui booking passati
    SELECT 
      s.category,
      s.location_type,
      AVG(s.base_price) as avg_price_preference,
      COUNT(*) as category_frequency
    FROM bookings b
    INNER JOIN services s ON b.service_id = s.id
    WHERE b.client_id = user_id
      AND b.status IN ('completed', 'confirmed')
      AND b.created_at >= NOW() - INTERVAL '6 months'
    GROUP BY s.category, s.location_type
  ),
  similar_users AS (
    -- Trova utenti con preferenze simili
    SELECT DISTINCT b2.client_id
    FROM bookings b1
    INNER JOIN services s1 ON b1.service_id = s1.id
    INNER JOIN bookings b2 ON s1.category = (SELECT s2.category FROM services s2 WHERE s2.id = b2.service_id)
    WHERE b1.client_id = user_id
      AND b2.client_id != user_id
      AND b1.status IN ('completed', 'confirmed')
      AND b2.status IN ('completed', 'confirmed')
    LIMIT 50
  )
  SELECT 
    s.id,
    s.title,
    s.category,
    s.base_price,
    pp.business_name AS provider_name,
    pp.rating_average AS provider_rating,
    (
      -- Score basato su preferenze categoria
      CASE WHEN up.category = s.category THEN up.category_frequency * 2 ELSE 0 END +
      -- Score basato su prezzo simile
      CASE WHEN ABS(s.base_price - up.avg_price_preference) <= up.avg_price_preference * 0.3 THEN 3 ELSE 0 END +
      -- Score basato su rating provider
      pp.rating_average +
      -- Score basato su popolarità tra utenti simili
      (SELECT COUNT(*) FROM bookings b 
       INNER JOIN similar_users su ON b.client_id = su.client_id 
       WHERE b.service_id = s.id) * 0.5
    ) AS recommendation_score
  FROM services s
  INNER JOIN provider_profiles pp ON s.provider_id = pp.user_id
  LEFT JOIN user_preferences up ON s.category = up.category
  WHERE s.active = true
    AND s.id NOT IN (
      -- Escludi servizi già prenotati
      SELECT service_id FROM bookings WHERE client_id = user_id
    )
  ORDER BY recommendation_score DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Funzione per analytics avanzate
CREATE OR REPLACE FUNCTION get_service_analytics(
  service_id UUID,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE(
  total_views BIGINT,
  total_bookings BIGINT,
  conversion_rate DECIMAL,
  total_revenue DECIMAL,
  average_booking_value DECIMAL,
  customer_satisfaction DECIMAL,
  repeat_customers BIGINT,
  cancellation_rate DECIMAL
) AS $$
DECLARE
  date_filter_start DATE := COALESCE(start_date, CURRENT_DATE - INTERVAL '30 days');
  date_filter_end DATE := COALESCE(end_date, CURRENT_DATE);
BEGIN
  RETURN QUERY
  SELECT 
    -- Views (simulato - in produzione useresti una tabella di tracking)
    (SELECT COUNT(*) FROM bookings WHERE service_id = get_service_analytics.service_id) * 10 AS total_views,
    
    -- Bookings
    (SELECT COUNT(*) 
     FROM bookings b 
     WHERE b.service_id = get_service_analytics.service_id
       AND b.created_at::DATE BETWEEN date_filter_start AND date_filter_end) AS total_bookings,
    
    -- Conversion rate (bookings/views)
    CASE 
      WHEN (SELECT COUNT(*) FROM bookings WHERE service_id = get_service_analytics.service_id) * 10 > 0
      THEN (SELECT COUNT(*) FROM bookings WHERE service_id = get_service_analytics.service_id)::DECIMAL / 
           ((SELECT COUNT(*) FROM bookings WHERE service_id = get_service_analytics.service_id) * 10) * 100
      ELSE 0
    END AS conversion_rate,
    
    -- Revenue
    (SELECT COALESCE(SUM(total_amount), 0) 
     FROM bookings b 
     WHERE b.service_id = get_service_analytics.service_id
       AND b.payment_status = 'captured'
       AND b.created_at::DATE BETWEEN date_filter_start AND date_filter_end) AS total_revenue,
    
    -- Average booking value
    (SELECT COALESCE(AVG(total_amount), 0) 
     FROM bookings b 
     WHERE b.service_id = get_service_analytics.service_id
       AND b.payment_status = 'captured'
       AND b.created_at::DATE BETWEEN date_filter_start AND date_filter_end) AS average_booking_value,
    
    -- Customer satisfaction
    (SELECT COALESCE(AVG(rating), 0) 
     FROM reviews r 
     INNER JOIN bookings b ON r.booking_id = b.id
     WHERE b.service_id = get_service_analytics.service_id
       AND r.created_at::DATE BETWEEN date_filter_start AND date_filter_end) AS customer_satisfaction,
    
    -- Repeat customers
    (SELECT COUNT(DISTINCT client_id) 
     FROM bookings b1 
     WHERE b1.service_id = get_service_analytics.service_id
       AND EXISTS (
         SELECT 1 FROM bookings b2 
         WHERE b2.client_id = b1.client_id 
           AND b2.service_id = get_service_analytics.service_id
           AND b2.id != b1.id
       )) AS repeat_customers,
    
    -- Cancellation rate
    CASE 
      WHEN (SELECT COUNT(*) FROM bookings WHERE service_id = get_service_analytics.service_id) > 0
      THEN (SELECT COUNT(*) FROM bookings WHERE service_id = get_service_analytics.service_id AND status = 'cancelled')::DECIMAL / 
           (SELECT COUNT(*) FROM bookings WHERE service_id = get_service_analytics.service_id) * 100
      ELSE 0
    END AS cancellation_rate;
END;
$$ LANGUAGE plpgsql;

-- Indici per ottimizzare le performance
CREATE INDEX IF NOT EXISTS idx_services_category_active ON services(category, active);
CREATE INDEX IF NOT EXISTS idx_services_location_type ON services(location_type);
CREATE INDEX IF NOT EXISTS idx_services_price_range ON services(base_price, pricing_unit);
CREATE INDEX IF NOT EXISTS idx_services_fulltext ON services USING gin(to_tsvector('italian', title || ' ' || description));
CREATE INDEX IF NOT EXISTS idx_provider_profiles_location ON provider_profiles(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(created_at, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status_payment ON bookings(status, payment_status);
CREATE INDEX IF NOT EXISTS idx_reviews_provider_rating ON reviews(provider_id, rating);

-- Commenti per documentazione
COMMENT ON FUNCTION calculate_distance IS 'Calcola la distanza in km tra due punti geografici usando la formula di Haversine';
COMMENT ON FUNCTION services_by_distance IS 'Restituisce servizi ordinati per distanza da un punto geografico';
COMMENT ON FUNCTION search_services_fulltext IS 'Ricerca full-text avanzata con scoring di rilevanza';
COMMENT ON FUNCTION calculate_provider_stats IS 'Calcola statistiche complete per un provider';
COMMENT ON FUNCTION get_trending_services IS 'Restituisce servizi trending basati su booking e revenue';
COMMENT ON FUNCTION get_personalized_recommendations IS 'Genera raccomandazioni personalizzate per un utente';
COMMENT ON FUNCTION get_service_analytics IS 'Analytics dettagliate per un servizio specifico';