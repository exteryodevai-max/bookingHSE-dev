-- =====================================================
-- FIX BUCKET PERMISSIONS - BookingHSE
-- =====================================================
-- Problema: ANON KEY non vede i bucket (0 bucket trovati)
-- Soluzione: Policy RLS corrette per storage.buckets

-- 1. ABILITA RLS su storage.buckets se non già abilitato
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- 2. POLICY per permettere a tutti di VEDERE i bucket pubblici
DROP POLICY IF EXISTS "Public buckets are viewable by everyone" ON storage.buckets;
CREATE POLICY "Public buckets are viewable by everyone" 
ON storage.buckets FOR SELECT 
USING (public = true);

-- 3. POLICY per permettere agli utenti autenticati di vedere tutti i bucket
DROP POLICY IF EXISTS "Authenticated users can view all buckets" ON storage.buckets;
CREATE POLICY "Authenticated users can view all buckets" 
ON storage.buckets FOR SELECT 
TO authenticated 
USING (true);

-- =====================================================
-- POLICY per storage.objects (file nei bucket)
-- =====================================================

-- 4. POLICY per service-images (pubblico)
DROP POLICY IF EXISTS "service_images_select" ON storage.objects;
CREATE POLICY "service_images_select" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'service-images');

DROP POLICY IF EXISTS "service_images_insert" ON storage.objects;
CREATE POLICY "service_images_insert" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'service-images');

DROP POLICY IF EXISTS "service_images_update" ON storage.objects;
CREATE POLICY "service_images_update" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'service-images' AND auth.uid()::text = owner) 
WITH CHECK (bucket_id = 'service-images');

DROP POLICY IF EXISTS "service_images_delete" ON storage.objects;
CREATE POLICY "service_images_delete" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'service-images' AND auth.uid()::text = owner);

-- 5. POLICY per profile-images (pubblico)
DROP POLICY IF EXISTS "profile_images_select" ON storage.objects;
CREATE POLICY "profile_images_select" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "profile_images_insert" ON storage.objects;
CREATE POLICY "profile_images_insert" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "profile_images_update" ON storage.objects;
CREATE POLICY "profile_images_update" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'profile-images' AND auth.uid()::text = owner) 
WITH CHECK (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "profile_images_delete" ON storage.objects;
CREATE POLICY "profile_images_delete" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'profile-images' AND auth.uid()::text = owner);

-- 6. POLICY per certifications (privato)
DROP POLICY IF EXISTS "certifications_select" ON storage.objects;
CREATE POLICY "certifications_select" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'certifications' AND auth.uid()::text = owner);

DROP POLICY IF EXISTS "certifications_insert" ON storage.objects;
CREATE POLICY "certifications_insert" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'certifications');

DROP POLICY IF EXISTS "certifications_update" ON storage.objects;
CREATE POLICY "certifications_update" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'certifications' AND auth.uid()::text = owner) 
WITH CHECK (bucket_id = 'certifications');

DROP POLICY IF EXISTS "certifications_delete" ON storage.objects;
CREATE POLICY "certifications_delete" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'certifications' AND auth.uid()::text = owner);

-- 7. POLICY per temp-uploads (privato)
DROP POLICY IF EXISTS "temp_uploads_select" ON storage.objects;
CREATE POLICY "temp_uploads_select" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'temp-uploads' AND auth.uid()::text = owner);

DROP POLICY IF EXISTS "temp_uploads_insert" ON storage.objects;
CREATE POLICY "temp_uploads_insert" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'temp-uploads');

DROP POLICY IF EXISTS "temp_uploads_update" ON storage.objects;
CREATE POLICY "temp_uploads_update" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'temp-uploads' AND auth.uid()::text = owner) 
WITH CHECK (bucket_id = 'temp-uploads');

DROP POLICY IF EXISTS "temp_uploads_delete" ON storage.objects;
CREATE POLICY "temp_uploads_delete" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'temp-uploads' AND auth.uid()::text = owner);

-- =====================================================
-- VERIFICA POLICY APPLICATE
-- =====================================================
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
WHERE schemaname = 'storage' 
ORDER BY tablename, policyname;