-- COMPREHENSIVE FOREIGN KEY FIX
-- Risolve definitivamente il problema "Provider non disponibile"

-- 1. Prima elimina completamente la foreign key esistente
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_provider_id_fkey;

-- 2. Verifica che tutti i provider_id nei servizi esistano nella tabella users
-- Se ci sono provider_id che non esistono, li impostiamo a NULL temporaneamente
UPDATE services 
SET provider_id = NULL 
WHERE provider_id IS NOT NULL 
AND provider_id NOT IN (SELECT id FROM users WHERE id IS NOT NULL);

-- 3. Mostra i servizi che hanno provider_id NULL (dovrebbero essere 0 dopo il fix)
SELECT 
    COUNT(*) as servizi_senza_provider,
    'Servizi con provider_id NULL' as descrizione
FROM services 
WHERE provider_id IS NULL AND active = true;

-- 4. Ricrea la foreign key constraint con le opzioni corrette
ALTER TABLE services 
ADD CONSTRAINT services_provider_id_fkey 
FOREIGN KEY (provider_id) 
REFERENCES users(id) 
ON DELETE SET NULL 
ON UPDATE CASCADE
DEFERRABLE INITIALLY DEFERRED;

-- 5. Verifica che la foreign key sia stata creata correttamente
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'services'
    AND kcu.column_name = 'provider_id';

-- 6. Test del JOIN per verificare che funzioni
SELECT 
    s.id as service_id,
    s.title,
    s.provider_id,
    u.id as user_id,
    u.first_name,
    u.last_name,
    pp.business_name,
    CASE 
        WHEN u.id IS NOT NULL THEN 'PROVIDER TROVATO ✅'
        ELSE 'PROVIDER NON TROVATO ❌'
    END as status
FROM 
    services s
    LEFT JOIN users u ON s.provider_id = u.id
    LEFT JOIN provider_profiles pp ON u.id = pp.user_id
WHERE 
    s.active = true
ORDER BY s.title
LIMIT 10;

-- 7. Conta i servizi per provider per verificare la distribuzione
SELECT 
    u.first_name || ' ' || u.last_name as provider_name,
    pp.business_name,
    COUNT(s.id) as numero_servizi,
    u.id as provider_id
FROM 
    users u
    LEFT JOIN provider_profiles pp ON u.id = pp.user_id
    LEFT JOIN services s ON u.id = s.provider_id AND s.active = true
WHERE 
    u.user_type = 'provider'
GROUP BY u.id, u.first_name, u.last_name, pp.business_name
ORDER BY numero_servizi DESC;

-- 8. Verifica finale: tutti i servizi attivi dovrebbero avere un provider
SELECT 
    COUNT(*) as servizi_totali,
    COUNT(CASE WHEN provider_id IS NOT NULL THEN 1 END) as servizi_con_provider,
    COUNT(CASE WHEN provider_id IS NULL THEN 1 END) as servizi_senza_provider,
    ROUND(
        (COUNT(CASE WHEN provider_id IS NOT NULL THEN 1 END) * 100.0 / COUNT(*)), 2
    ) as percentuale_con_provider
FROM services 
WHERE active = true;