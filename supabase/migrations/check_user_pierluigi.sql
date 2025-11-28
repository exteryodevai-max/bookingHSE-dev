-- Query per verificare se l'utente pierluigi.pisanti@gmail.com esiste nel database

-- Controllo nella tabella auth.users
SELECT 
    'auth.users' as table_name,
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at,
    last_sign_in_at,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'pierluigi.pisanti@gmail.com';

-- Controllo nella tabella public.users
SELECT 
    'public.users' as table_name,
    id,
    email,
    user_type,
    first_name,
    last_name,
    phone,
    company_name,
    created_at,
    updated_at
FROM public.users 
WHERE email = 'pierluigi.pisanti@gmail.com';

-- Controllo se ci sono record correlati nelle altre tabelle
SELECT 
    'client_profiles' as table_name,
    COUNT(*) as count
FROM client_profiles cp
JOIN users u ON cp.user_id = u.id
WHERE u.email = 'pierluigi.pisanti@gmail.com';

SELECT 
    'provider_profiles' as table_name,
    COUNT(*) as count
FROM provider_profiles pp
JOIN users u ON pp.user_id = u.id
WHERE u.email = 'pierluigi.pisanti@gmail.com';

SELECT 
    'bookings' as table_name,
    COUNT(*) as count
FROM bookings b
JOIN users u ON (b.client_id = u.id OR b.provider_id = u.id)
WHERE u.email = 'pierluigi.pisanti@gmail.com';