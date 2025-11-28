-- Query per verificare l'esistenza dell'utente pierluigi.pisanti@gmail.com
-- e restituire i risultati in formato leggibile

DO $$
DECLARE
    auth_user_exists BOOLEAN := FALSE;
    public_user_exists BOOLEAN := FALSE;
    auth_user_record RECORD;
    public_user_record RECORD;
    client_profile_count INTEGER := 0;
    provider_profile_count INTEGER := 0;
    bookings_count INTEGER := 0;
BEGIN
    -- Controllo auth.users
    SELECT EXISTS(
        SELECT 1 FROM auth.users 
        WHERE email = 'pierluigi.pisanti@gmail.com'
    ) INTO auth_user_exists;
    
    -- Controllo public.users
    SELECT EXISTS(
        SELECT 1 FROM public.users 
        WHERE email = 'pierluigi.pisanti@gmail.com'
    ) INTO public_user_exists;
    
    -- Se esiste in auth.users, ottieni i dettagli
    IF auth_user_exists THEN
        SELECT id, email, email_confirmed_at, created_at, last_sign_in_at
        INTO auth_user_record
        FROM auth.users 
        WHERE email = 'pierluigi.pisanti@gmail.com';
        
        RAISE NOTICE 'UTENTE TROVATO in auth.users:';
        RAISE NOTICE 'ID: %', auth_user_record.id;
        RAISE NOTICE 'Email: %', auth_user_record.email;
        RAISE NOTICE 'Email confermata: %', auth_user_record.email_confirmed_at;
        RAISE NOTICE 'Creato il: %', auth_user_record.created_at;
        RAISE NOTICE 'Ultimo accesso: %', auth_user_record.last_sign_in_at;
    ELSE
        RAISE NOTICE 'UTENTE NON TROVATO in auth.users';
    END IF;
    
    -- Se esiste in public.users, ottieni i dettagli
    IF public_user_exists THEN
        SELECT id, email, user_type, first_name, last_name, phone, company_name, created_at
        INTO public_user_record
        FROM public.users 
        WHERE email = 'pierluigi.pisanti@gmail.com';
        
        RAISE NOTICE 'UTENTE TROVATO in public.users:';
        RAISE NOTICE 'ID: %', public_user_record.id;
        RAISE NOTICE 'Email: %', public_user_record.email;
        RAISE NOTICE 'Tipo utente: %', public_user_record.user_type;
        RAISE NOTICE 'Nome: %', public_user_record.first_name;
        RAISE NOTICE 'Cognome: %', public_user_record.last_name;
        RAISE NOTICE 'Telefono: %', public_user_record.phone;
        RAISE NOTICE 'Azienda: %', public_user_record.company_name;
        RAISE NOTICE 'Creato il: %', public_user_record.created_at;
        
        -- Controllo profili correlati
        SELECT COUNT(*) INTO client_profile_count
        FROM client_profiles cp
        WHERE cp.user_id = public_user_record.id;
        
        SELECT COUNT(*) INTO provider_profile_count
        FROM provider_profiles pp
        WHERE pp.user_id = public_user_record.id;
        
        SELECT COUNT(*) INTO bookings_count
        FROM bookings b
        WHERE b.client_id = public_user_record.id OR b.provider_id = public_user_record.id;
        
        RAISE NOTICE 'Profili client: %', client_profile_count;
        RAISE NOTICE 'Profili provider: %', provider_profile_count;
        RAISE NOTICE 'Prenotazioni associate: %', bookings_count;
    ELSE
        RAISE NOTICE 'UTENTE NON TROVATO in public.users';
    END IF;
    
    -- Riepilogo finale
    RAISE NOTICE '=== RIEPILOGO ===';
    RAISE NOTICE 'Utente in auth.users: %', CASE WHEN auth_user_exists THEN 'SÌ' ELSE 'NO' END;
    RAISE NOTICE 'Utente in public.users: %', CASE WHEN public_user_exists THEN 'SÌ' ELSE 'NO' END;
    
END $$;