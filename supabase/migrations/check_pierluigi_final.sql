-- Query finale per verificare l'utente pierluigi.pisanti@gmail.com
-- Restituisce risultati in formato tabellare

-- Controllo in auth.users
SELECT 
    'RISULTATO AUTH.USERS' as tipo_controllo,
    CASE 
        WHEN EXISTS(SELECT 1 FROM auth.users WHERE email = 'pierluigi.pisanti@gmail.com') 
        THEN 'UTENTE TROVATO' 
        ELSE 'UTENTE NON TROVATO' 
    END as risultato,
    COALESCE(
        (SELECT id::text FROM auth.users WHERE email = 'pierluigi.pisanti@gmail.com' LIMIT 1),
        'N/A'
    ) as user_id,
    COALESCE(
        (SELECT email_confirmed_at::text FROM auth.users WHERE email = 'pierluigi.pisanti@gmail.com' LIMIT 1),
        'N/A'
    ) as email_confirmed,
    COALESCE(
        (SELECT created_at::text FROM auth.users WHERE email = 'pierluigi.pisanti@gmail.com' LIMIT 1),
        'N/A'
    ) as created_at

UNION ALL

-- Controllo in public.users
SELECT 
    'RISULTATO PUBLIC.USERS' as tipo_controllo,
    CASE 
        WHEN EXISTS(SELECT 1 FROM public.users WHERE email = 'pierluigi.pisanti@gmail.com') 
        THEN 'UTENTE TROVATO' 
        ELSE 'UTENTE NON TROVATO' 
    END as risultato,
    COALESCE(
        (SELECT id::text FROM public.users WHERE email = 'pierluigi.pisanti@gmail.com' LIMIT 1),
        'N/A'
    ) as user_id,
    COALESCE(
        (SELECT user_type::text FROM public.users WHERE email = 'pierluigi.pisanti@gmail.com' LIMIT 1),
        'N/A'
    ) as user_type,
    COALESCE(
        (SELECT (first_name || ' ' || last_name) FROM public.users WHERE email = 'pierluigi.pisanti@gmail.com' LIMIT 1),
        'N/A'
    ) as nome_completo

UNION ALL

-- Controllo profili correlati
SELECT 
    'PROFILI CORRELATI' as tipo_controllo,
    CASE 
        WHEN EXISTS(
            SELECT 1 FROM client_profiles cp 
            JOIN users u ON cp.user_id = u.id 
            WHERE u.email = 'pierluigi.pisanti@gmail.com'
        ) THEN 'CLIENT PROFILE TROVATO'
        WHEN EXISTS(
            SELECT 1 FROM provider_profiles pp 
            JOIN users u ON pp.user_id = u.id 
            WHERE u.email = 'pierluigi.pisanti@gmail.com'
        ) THEN 'PROVIDER PROFILE TROVATO'
        ELSE 'NESSUN PROFILO TROVATO'
    END as risultato,
    'N/A' as user_id,
    'N/A' as email_confirmed,
    'N/A' as created_at;

-- Query separata per contare le prenotazioni
SELECT 
    'PRENOTAZIONI' as info_type,
    COUNT(*)::text as count
FROM bookings b
JOIN users u ON (b.client_id = u.id OR b.provider_id = u.id)
WHERE u.email = 'pierluigi.pisanti@gmail.com';