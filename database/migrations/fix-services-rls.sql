-- =====================================================
-- FIX RLS POLICIES PER TABELLA SERVICES
-- =====================================================
-- Questo script risolve l'errore 42501 per la creazione servizi

-- 1. Verifica le policy esistenti per la tabella services
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'services' 
ORDER BY policyname;

-- 2. Verifica che RLS sia abilitato
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'services';

-- 3. Elimina le policy esistenti per ricrearle correttamente
DROP POLICY IF EXISTS "Anyone can view active services" ON services;
DROP POLICY IF EXISTS "Providers can view their own services" ON services;
DROP POLICY IF EXISTS "Providers can insert their own services" ON services;
DROP POLICY IF EXISTS "Providers can update their own services" ON services;
DROP POLICY IF EXISTS "Providers can delete their own services" ON services;

-- 4. Ricrea le policy RLS corrette
-- Policy per visualizzare servizi attivi (pubblico)
CREATE POLICY "Anyone can view active services" 
ON services 
FOR SELECT 
USING (active = true);

-- Policy per provider: visualizzare i propri servizi
CREATE POLICY "Providers can view their own services" 
ON services 
FOR SELECT 
USING (auth.uid() = provider_id);

-- Policy per provider: inserire i propri servizi (QUESTA È LA CHIAVE!)
CREATE POLICY "Providers can insert their own services" 
ON services 
FOR INSERT 
WITH CHECK (auth.uid() = provider_id);

-- Policy per provider: aggiornare i propri servizi
CREATE POLICY "Providers can update their own services" 
ON services 
FOR UPDATE 
USING (auth.uid() = provider_id);

-- Policy per provider: eliminare i propri servizi
CREATE POLICY "Providers can delete their own services" 
ON services 
FOR DELETE 
USING (auth.uid() = provider_id);

-- 5. Verifica che le policy siano state create correttamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'services' 
ORDER BY policyname;

-- 6. Test per verificare l'utente corrente
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- 7. Verifica il profilo dell'utente
SELECT 
  id,
  email,
  user_type,
  created_at
FROM users 
WHERE id = auth.uid();

-- 8. Verifica il provider_profile
SELECT 
  user_id,
  business_name,
  verified,
  created_at
FROM provider_profiles 
WHERE user_id = auth.uid();

-- =====================================================
-- MESSAGGIO DI CONFERMA
-- =====================================================
SELECT 'RLS Policies per tabella services aggiornate correttamente!' as status;