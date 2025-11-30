-- Query per verificare le RLS policies per la tabella services
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

-- Query per verificare che RLS sia abilitato
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'services';

-- Query per verificare l'utente corrente e i suoi ruoli
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- Query per verificare il profilo dell'utente
SELECT 
  id,
  email,
  user_type,
  created_at
FROM users 
WHERE id = auth.uid();

-- Query per verificare il provider_profile
SELECT 
  user_id,
  business_name,
  verified,
  created_at
FROM provider_profiles 
WHERE user_id = auth.uid();