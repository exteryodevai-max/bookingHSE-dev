-- =====================================================
-- FIX ACCESSO ANONIMO AI PROVIDER - BookingHSE
-- =====================================================
-- Questo script aggiunge le policy RLS necessarie per permettere
-- agli utenti non autenticati di visualizzare i dati dei provider

-- =====================================================
-- POLICY PER TABELLA USERS
-- =====================================================

-- Permetti accesso anonimo in lettura ai dati pubblici degli utenti
-- (solo per utenti di tipo 'provider' e campi non sensibili)
CREATE POLICY "Anonymous can view provider users" 
ON public.users 
FOR SELECT 
TO anon
USING (
  user_type = 'provider' AND
  active = true
);

-- =====================================================
-- POLICY PER TABELLA PROVIDER_PROFILES
-- =====================================================

-- Permetti accesso anonimo in lettura ai profili provider pubblici
CREATE POLICY "Anonymous can view provider profiles" 
ON public.provider_profiles 
FOR SELECT 
TO anon
USING (
  verified = true OR verified = false  -- Tutti i provider profiles
);

-- =====================================================
-- VERIFICA POLICY ESISTENTI
-- =====================================================

-- Query per verificare le policy create
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('users', 'provider_profiles')
  AND roles @> '{anon}'
ORDER BY tablename, policyname;

-- =====================================================
-- TEST ACCESSO ANONIMO
-- =====================================================

-- Test query che dovrebbe funzionare per utenti anonimi
-- (da eseguire dopo aver applicato le policy)

/*
SELECT 
  s.id,
  s.title,
  s.provider_id,
  u.first_name,
  u.last_name,
  pp.business_name,
  pp.verified,
  pp.city,
  pp.province
FROM services s
LEFT JOIN users u ON s.provider_id = u.id
LEFT JOIN provider_profiles pp ON u.id = pp.user_id
WHERE s.active = true
LIMIT 5;
*/