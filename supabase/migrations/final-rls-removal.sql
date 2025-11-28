-- =====================================================
-- RIMOZIONE DEFINITIVA POLICY RLS PER service-images
-- =====================================================
-- Questo script rimuove solo le policy RLS senza modificare la tabella

-- 1. Rimuovi tutte le policy esistenti per storage.objects
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete Service Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "service_images_authenticated_delete" ON storage.objects;
DROP POLICY IF EXISTS "service_images_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "service_images_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "service_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "service_images_upload_policy" ON storage.objects;

-- 2. Rimuovi policy specifiche per il bucket service-images
DROP POLICY IF EXISTS "Allow public uploads to service-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to service-images" ON storage.objects;
DROP POLICY IF EXISTS "service-images-upload" ON storage.objects;
DROP POLICY IF EXISTS "service-images-read" ON storage.objects;
DROP POLICY IF EXISTS "service-images-delete" ON storage.objects;
DROP POLICY IF EXISTS "service-images-update" ON storage.objects;

-- 3. Rimuovi policy generiche che potrebbero interferire
DROP POLICY IF EXISTS "Users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an image" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;

-- 4. Crea una policy permissiva per service-images
CREATE POLICY "service_images_public_access" ON storage.objects
FOR ALL 
TO public
USING (bucket_id = 'service-images')
WITH CHECK (bucket_id = 'service-images');

-- 5. Verifica che il bucket sia pubblico
UPDATE storage.buckets 
SET public = true 
WHERE name = 'service-images';

-- 6. Messaggio di conferma
SELECT 'Policy RLS aggiornate - Bucket service-images ora accessibile pubblicamente' as status;