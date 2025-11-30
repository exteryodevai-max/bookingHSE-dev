-- FIX DEFINITIVO FOREIGN KEY CONSTRAINT
-- Risolve il problema che impedisce il JOIN tra services e users

-- 1. Elimina completamente tutte le foreign key esistenti sulla tabella services
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'services' 
        AND constraint_type = 'FOREIGN KEY'
    LOOP
        EXECUTE 'ALTER TABLE services DROP CONSTRAINT IF EXISTS ' || constraint_record.constraint_name;
        RAISE NOTICE 'Eliminata constraint: %', constraint_record.constraint_name;
    END LOOP;
END $$;

-- 2. Verifica che tutti i provider_id esistano nella tabella users
SELECT 
    'VERIFICA PROVIDER_ID' as step,
    COUNT(*) as servizi_totali,
    COUNT(CASE WHEN provider_id IS NOT NULL THEN 1 END) as servizi_con_provider_id,
    COUNT(CASE WHEN provider_id IS NULL THEN 1 END) as servizi_senza_provider_id
FROM services 
WHERE active = true;

-- 3. Mostra i provider_id che non esistono nella tabella users
SELECT 
    'PROVIDER_ID NON ESISTENTI' as step,
    s.provider_id,
    COUNT(*) as numero_servizi
FROM services s
LEFT JOIN users u ON s.provider_id = u.id
WHERE s.provider_id IS NOT NULL 
AND u.id IS NULL
AND s.active = true
GROUP BY s.provider_id;

-- 4. Imposta a NULL i provider_id che non esistono
UPDATE services 
SET provider_id = NULL 
WHERE provider_id IS NOT NULL 
AND provider_id NOT IN (SELECT id FROM users WHERE id IS NOT NULL);

-- 5. Ricrea la foreign key constraint con nome specifico
ALTER TABLE services 
ADD CONSTRAINT fk_services_provider_id 
FOREIGN KEY (provider_id) 
REFERENCES users(id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- 6. Verifica che la constraint sia stata creata
SELECT 
    'CONSTRAINT CREATA' as step,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'services'
    AND kcu.column_name = 'provider_id';

-- 7. Test del JOIN semplice
SELECT 
    'TEST JOIN SEMPLICE' as step,
    COUNT(*) as servizi_totali,
    COUNT(u.id) as servizi_con_join_riuscito,
    COUNT(*) - COUNT(u.id) as servizi_con_join_fallito
FROM services s
LEFT JOIN users u ON s.provider_id = u.id
WHERE s.active = true;

-- 8. Test specifico per Exteryo e Anna
SELECT 
    'TEST EXTERYO E ANNA' as step,
    s.title,
    s.provider_id,
    u.first_name,
    u.last_name,
    CASE 
        WHEN u.id IS NOT NULL THEN 'JOIN RIUSCITO ✅'
        ELSE 'JOIN FALLITO ❌'
    END as status
FROM services s
LEFT JOIN users u ON s.provider_id = u.id
WHERE s.provider_id IN (
    'a5620bd3-2da0-4c30-8c26-5dd1083ae93b',  -- Exteryo
    '4d925b04-bd78-41f3-8d2a-db22620fa60f'   -- Anna
)
AND s.active = true;

-- 9. Verifica finale: tutti i servizi dovrebbero avere un provider
SELECT 
    'VERIFICA FINALE' as step,
    COUNT(*) as servizi_attivi_totali,
    COUNT(CASE WHEN provider_id IS NOT NULL THEN 1 END) as servizi_con_provider,
    COUNT(CASE WHEN provider_id IS NULL THEN 1 END) as servizi_senza_provider,
    ROUND(
        (COUNT(CASE WHEN provider_id IS NOT NULL THEN 1 END) * 100.0 / COUNT(*)), 2
    ) as percentuale_con_provider
FROM services 
WHERE active = true;