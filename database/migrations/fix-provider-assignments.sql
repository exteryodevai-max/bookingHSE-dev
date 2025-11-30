-- Fix Provider Assignments - Gestione corretta dei valori NULL UUID
-- Questo script risolve l'errore di conversione UUID NULL

-- 1. Mostra lo stato attuale dei servizi con i loro provider
SELECT 
    s.id as service_id,
    s.title,
    CASE 
        WHEN s.provider_id IS NULL THEN 'NESSUN PROVIDER'
        ELSE s.provider_id::text
    END as provider_id_status,
    s.active,
    s.created_at
FROM services s
ORDER BY s.created_at DESC;

-- 2. Conta i servizi senza provider
SELECT 
    COUNT(*) as servizi_senza_provider
FROM services 
WHERE provider_id IS NULL AND active = true;

-- 3. Mostra i servizi con provider_id NULL
SELECT 
    id,
    title,
    category,
    created_at
FROM services 
WHERE provider_id IS NULL 
ORDER BY created_at DESC;

-- 4. Verifica quali provider_id esistono nella tabella users
SELECT DISTINCT
    s.provider_id,
    CASE 
        WHEN u.id IS NOT NULL THEN 'ESISTE'
        ELSE 'NON ESISTE'
    END as user_status,
    COUNT(s.id) as numero_servizi
FROM services s
LEFT JOIN users u ON s.provider_id = u.id
WHERE s.provider_id IS NOT NULL
GROUP BY s.provider_id, u.id
ORDER BY numero_servizi DESC;

-- 5. Prima di fare UPDATE, creiamo gli utenti mancanti senza business_type
-- Crea l'utente Pippo Srl
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
    'pippo@pippohse.com',
    'provider',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    user_type = EXCLUDED.user_type,
    updated_at = NOW();

-- Crea il profilo provider per Pippo Srl (senza business_type)
INSERT INTO provider_profiles (
    user_id,
    business_name,
    phone,
    city,
    province,
    country,
    created_at,
    updated_at
) VALUES (
    'ac97755e-cf3e-40a4-8526-b0e6b9e7c154',
    'Pippo Srl',
    '+39 123 456 7890',
    'Milano',
    'MI',
    'Italy',
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    phone = EXCLUDED.phone,
    city = EXCLUDED.city,
    province = EXCLUDED.province,
    updated_at = NOW();

-- Crea il secondo provider
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

-- Profilo per il secondo provider
INSERT INTO provider_profiles (
    user_id,
    business_name,
    phone,
    city,
    province,
    country,
    created_at,
    updated_at
) VALUES (
    '4d925b04-bd78-41f3-8d2a-db22620fa60f',
    'Provider Due Srl',
    '+39 123 456 7891',
    'Roma',
    'RM',
    'Italy',
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    phone = EXCLUDED.phone,
    city = EXCLUDED.city,
    province = EXCLUDED.province,
    updated_at = NOW();

-- Crea il terzo provider
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

-- Profilo per il terzo provider
INSERT INTO provider_profiles (
    user_id,
    business_name,
    phone,
    city,
    province,
    country,
    created_at,
    updated_at
) VALUES (
    'a5620bd3-2da0-4c30-8c26-5dd1083ae93b',
    'Provider Tre Srl',
    '+39 123 456 7892',
    'Torino',
    'TO',
    'Italy',
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    phone = EXCLUDED.phone,
    city = EXCLUDED.city,
    province = EXCLUDED.province,
    updated_at = NOW();

-- 6. Aggiorna i servizi con provider_id NULL assegnandoli a Pippo Srl
UPDATE services 
SET provider_id = 'ac97755e-cf3e-40a4-8526-b0e6b9e7c154',
    updated_at = NOW()
WHERE provider_id IS NULL 
AND active = true;

-- 7. Verifica finale - mostra tutti i provider creati
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
WHERE u.user_type = 'provider'
ORDER BY u.first_name;

-- 8. Verifica finale - conta i servizi per provider
SELECT 
    u.first_name || ' ' || u.last_name as provider_name,
    pp.business_name,
    COUNT(s.id) as numero_servizi
FROM users u
LEFT JOIN provider_profiles pp ON u.id = pp.user_id
LEFT JOIN services s ON u.id = s.provider_id AND s.active = true
WHERE u.user_type = 'provider'
GROUP BY u.id, u.first_name, u.last_name, pp.business_name
ORDER BY numero_servizi DESC;

-- 9. Test finale del JOIN per verificare che funzioni
SELECT 
    s.id,
    s.title,
    s.provider_id,
    u.first_name,
    u.last_name,
    pp.business_name
FROM services s
LEFT JOIN users u ON s.provider_id = u.id
LEFT JOIN provider_profiles pp ON u.id = pp.user_id
WHERE s.active = true
LIMIT 5;