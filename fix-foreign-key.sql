-- Fix Foreign Key Constraint per services.provider_id -> users.id
-- Questo script risolve il problema del JOIN che non funziona

-- 1. Prima elimina la foreign key esistente se presente
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_provider_id_fkey;

-- 2. Verifica che non ci siano valori NULL o invalidi in provider_id
-- (Questo è importante per poter creare la foreign key)
UPDATE services 
SET provider_id = NULL 
WHERE provider_id NOT IN (SELECT id FROM users);

-- 3. Crea la foreign key constraint corretta
ALTER TABLE services 
ADD CONSTRAINT services_provider_id_fkey 
FOREIGN KEY (provider_id) 
REFERENCES users(id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- 4. Verifica che la foreign key sia stata creata
SELECT 
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

-- 5. Test della relazione dopo il fix
SELECT 
    s.id as service_id,
    s.title,
    s.provider_id,
    u.id as user_id,
    u.first_name,
    u.last_name,
    pp.business_name
FROM 
    services s
    LEFT JOIN users u ON s.provider_id = u.id
    LEFT JOIN provider_profiles pp ON u.id = pp.user_id
WHERE 
    s.provider_id = 'ac97755e-cf3e-40a4-8526-b0e6b9e7c154'
LIMIT 5;