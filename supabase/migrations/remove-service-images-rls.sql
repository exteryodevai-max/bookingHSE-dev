-- Script AGGRESSIVO per rimuovere TUTTE le policy RLS dal bucket service-images
-- Basato sulle policy specifiche visibili nell'interfaccia Supabase

-- STEP 1: Rimuovi tutte le policy specifiche per nome esatto
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete Service Images" ON storage.objects;
DROP POLICY IF EXISTS "Owner Update Service Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "service_images_authenticated_delete" ON storage.objects;
DROP POLICY IF EXISTS "service_images_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "service_images_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "service_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "service_images_upload_policy" ON storage.objects;

-- STEP 2: Rimuovi eventuali altre varianti di nomi
DROP POLICY IF EXISTS "service_images_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "service_images_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "service_images_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "service_images_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload service images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view service images" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage their service images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to services folder" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to service images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to their service folder" ON storage.objects;

-- STEP 3: Rimuovi policy per storage.buckets
DROP POLICY IF EXISTS "service_images_bucket_policy" ON storage.buckets;
DROP POLICY IF EXISTS "Public can view service-images bucket" ON storage.buckets;
DROP POLICY IF EXISTS "Users can access service-images bucket" ON storage.buckets;

-- STEP 4: Query per verificare che tutte le policy siano state rimosse
SELECT 
    'Policy RLS rimanenti per storage.objects:' as info,
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND (
    policyname ILIKE '%service%' 
    OR policyname ILIKE '%authenticated%upload%'
    OR policyname ILIKE '%owner%delete%'
    OR policyname ILIKE '%owner%update%'
    OR policyname ILIKE '%public%access%'
  );

-- STEP 5: Query per verificare policy su storage.buckets
SELECT 
    'Policy RLS rimanenti per storage.buckets:' as info,
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'buckets';

-- STEP 6: Conteggio finale delle policy
SELECT 
    'Conteggio finale policy storage:' as info,
    schemaname,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'storage'
GROUP BY schemaname, tablename;