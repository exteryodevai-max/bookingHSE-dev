-- Creazione degli utenti provider mancanti
-- Questo script risolve il problema "Provider non disponibile"

-- 1. Crea l'utente Pippo Srl (20 servizi)
INSERT INTO users (
  id,
  first_name,
  last_name,
  email,
  user_type,
  created_at,
  updated_at
) VALUES (
  'ac97755e-cf3e-40a4-8526-b0e6b9e7c154',
  'Pippo',
  'Srl',
  'pippo@example.com',
  'provider',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  user_type = EXCLUDED.user_type,
  updated_at = NOW();

-- 2. Crea il profilo provider per Pippo Srl
INSERT INTO provider_profiles (
  user_id,
  business_name,
  business_type,
  phone,
  email,
  city,
  province,
  country,
  created_at,
  updated_at
) VALUES (
  'ac97755e-cf3e-40a4-8526-b0e6b9e7c154',
  'Pippo Srl',
  'Consulenza HSE',
  '+39 123 456 7890',
  'pippo@example.com',
  'Milano',
  'MI',
  'Italy',
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  business_type = EXCLUDED.business_type,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  city = EXCLUDED.city,
  province = EXCLUDED.province,
  updated_at = NOW();

-- 3. Crea il secondo provider (1 servizio)
INSERT INTO users (
  id,
  first_name,
  last_name,
  email,
  user_type,
  created_at,
  updated_at
) VALUES (
  '4d925b04-bd78-41f3-8d2a-db22620fa60f',
  'Provider',
  'Due',
  'provider2@example.com',
  'provider',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  user_type = EXCLUDED.user_type,
  updated_at = NOW();

-- 4. Crea il profilo provider per il secondo provider
INSERT INTO provider_profiles (
  user_id,
  business_name,
  business_type,
  phone,
  email,
  city,
  province,
  country,
  created_at,
  updated_at
) VALUES (
  '4d925b04-bd78-41f3-8d2a-db22620fa60f',
  'Provider Due Srl',
  'Servizi HSE',
  '+39 123 456 7891',
  'provider2@example.com',
  'Roma',
  'RM',
  'Italy',
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  business_type = EXCLUDED.business_type,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  city = EXCLUDED.city,
  province = EXCLUDED.province,
  updated_at = NOW();

-- 5. Crea il terzo provider (1 servizio)
INSERT INTO users (
  id,
  first_name,
  last_name,
  email,
  user_type,
  created_at,
  updated_at
) VALUES (
  'a5620bd3-2da0-4c30-8c26-5dd1083ae93b',
  'Provider',
  'Tre',
  'provider3@example.com',
  'provider',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  user_type = EXCLUDED.user_type,
  updated_at = NOW();

-- 6. Crea il profilo provider per il terzo provider
INSERT INTO provider_profiles (
  user_id,
  business_name,
  business_type,
  phone,
  email,
  city,
  province,
  country,
  created_at,
  updated_at
) VALUES (
  'a5620bd3-2da0-4c30-8c26-5dd1083ae93b',
  'Provider Tre Srl',
  'Digital Safety',
  '+39 123 456 7892',
  'provider3@example.com',
  'Torino',
  'TO',
  'Italy',
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  business_type = EXCLUDED.business_type,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  city = EXCLUDED.city,
  province = EXCLUDED.province,
  updated_at = NOW();

-- 7. Verifica che tutti i provider siano stati creati
SELECT 
  u.id,
  u.first_name,
  u.last_name,
  u.user_type,
  pp.business_name,
  pp.city,
  pp.province
FROM users u
LEFT JOIN provider_profiles pp ON u.id = pp.user_id
WHERE u.id IN (
  'ac97755e-cf3e-40a4-8526-b0e6b9e7c154',
  '4d925b04-bd78-41f3-8d2a-db22620fa60f',
  'a5620bd3-2da0-4c30-8c26-5dd1083ae93b'
)
ORDER BY u.first_name;