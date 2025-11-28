-- Diagnosi configurazione email Supabase
-- Questo file contiene query per verificare la configurazione email

-- 1. Verifica utenti recenti e il loro stato di conferma email
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    confirmation_sent_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Verifica utenti con email non confermate
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    CASE 
        WHEN email_confirmed_at IS NULL THEN 'Non confermata'
        ELSE 'Confermata'
    END as stato_email
FROM auth.users 
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;

-- 3. Statistiche generali sulle email
SELECT 
    COUNT(*) as totale_utenti,
    COUNT(email_confirmed_at) as email_confermate,
    COUNT(*) - COUNT(email_confirmed_at) as email_non_confermate,
    CAST(
        (COUNT(email_confirmed_at)::float / COUNT(*)::float) * 100 AS DECIMAL(5,2)
    ) as percentuale_confermate
FROM auth.users;

-- 4. Verifica utenti creati nelle ultime 24 ore
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    confirmation_sent_at,
    raw_user_meta_data->>'user_type' as tipo_utente
FROM auth.users 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 5. Verifica presenza di utenti specifici (esempio)
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data
FROM auth.users 
WHERE email LIKE '%@gmail.com'
ORDER BY created_at DESC
LIMIT 5;