-- =====================================================
-- RIPRISTINO POLICY RLS ESSENZIALI
-- =====================================================
-- Questo script ripristina le policy RLS minime necessarie
-- per il funzionamento del sistema mantenendo l'upload delle immagini

-- 1. Verifica che RLS sia abilitato su storage.objects (senza modificare la tabella)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy per permettere lettura pubblica di tutti i file
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT 
TO public
USING (true);

-- 4. Policy per permettere upload autenticato su tutti i bucket
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- 5. Policy specifica per service-images - accesso completo pubblico
CREATE POLICY "service_images_public_full_access" ON storage.objects
FOR ALL 
TO public
USING (bucket_id = 'service-images')
WITH CHECK (bucket_id = 'service-images');

-- 6. Policy per permettere agli utenti di gestire i propri file
CREATE POLICY "Users can manage own files" ON storage.objects
FOR ALL 
TO authenticated
USING (auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

-- 7. Policy per profile-images - solo utenti autenticati
CREATE POLICY "profile_images_authenticated_access" ON storage.objects
FOR ALL 
TO authenticated
USING (bucket_id = 'profile-images')
WITH CHECK (bucket_id = 'profile-images');

-- 8. Verifica che tutti i bucket siano configurati correttamente
UPDATE storage.buckets 
SET public = true 
WHERE name IN ('service-images', 'profile-images');

-- 9. Messaggio di conferma
SELECT 'Policy RLS essenziali ripristinate - Sistema dovrebbe essere accessibile' as status;