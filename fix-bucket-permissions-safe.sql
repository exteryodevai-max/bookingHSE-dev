-- =====================================================
-- FIX BUCKET PERMISSIONS - VERSIONE SICURA
-- =====================================================
-- Questo script evita di modificare storage.buckets
-- e si concentra solo su storage.objects

-- 1. Verifica RLS su storage.objects (dovrebbe essere già abilitato)
-- Se non è abilitato, Supabase lo abiliterà automaticamente

-- 2. Rimuovi policy esistenti per evitare conflitti
DROP POLICY IF EXISTS "service_images_select" ON storage.objects;
DROP POLICY IF EXISTS "service_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "service_images_update" ON storage.objects;
DROP POLICY IF EXISTS "service_images_delete" ON storage.objects;

DROP POLICY IF EXISTS "profile_images_select" ON storage.objects;
DROP POLICY IF EXISTS "profile_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "profile_images_update" ON storage.objects;
DROP POLICY IF EXISTS "profile_images_delete" ON storage.objects;

DROP POLICY IF EXISTS "certifications_select" ON storage.objects;
DROP POLICY IF EXISTS "certifications_insert" ON storage.objects;
DROP POLICY IF EXISTS "certifications_update" ON storage.objects;
DROP POLICY IF EXISTS "certifications_delete" ON storage.objects;

DROP POLICY IF EXISTS "temp_uploads_select" ON storage.objects;
DROP POLICY IF EXISTS "temp_uploads_insert" ON storage.objects;
DROP POLICY IF EXISTS "temp_uploads_update" ON storage.objects;
DROP POLICY IF EXISTS "temp_uploads_delete" ON storage.objects;

-- 3. Policy per service-images (PUBLIC ACCESS)
CREATE POLICY "service_images_select" ON storage.objects
FOR SELECT TO public 
USING (bucket_id = 'service-images');

CREATE POLICY "service_images_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'service-images');

CREATE POLICY "service_images_update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'service-images')
WITH CHECK (bucket_id = 'service-images');

CREATE POLICY "service_images_delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'service-images');

-- 4. Policy per profile-images (PUBLIC ACCESS)
CREATE POLICY "profile_images_select" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'profile-images');

CREATE POLICY "profile_images_insert" ON storage.objects
FOR INSERT TO authenticated  
WITH CHECK (bucket_id = 'profile-images');

CREATE POLICY "profile_images_update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'profile-images')
WITH CHECK (bucket_id = 'profile-images');

CREATE POLICY "profile_images_delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'profile-images');

-- 5. Policy per certifications (AUTHENTICATED ONLY)
CREATE POLICY "certifications_select" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'certifications');

CREATE POLICY "certifications_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'certifications');

CREATE POLICY "certifications_update" ON storage.objects  
FOR UPDATE TO authenticated
USING (bucket_id = 'certifications')
WITH CHECK (bucket_id = 'certifications');

CREATE POLICY "certifications_delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'certifications');

-- 6. Policy per temp-uploads (AUTHENTICATED ONLY)
CREATE POLICY "temp_uploads_select" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'temp-uploads');

CREATE POLICY "temp_uploads_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'temp-uploads');

CREATE POLICY "temp_uploads_update" ON storage.objects
FOR UPDATE TO authenticated  
USING (bucket_id = 'temp-uploads')
WITH CHECK (bucket_id = 'temp-uploads');

CREATE POLICY "temp_uploads_delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'temp-uploads');

-- 7. Verifica policy create
SELECT schemaname, tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;