-- =====================================================
-- POLITICHE RLS PER SUPABASE STORAGE - BookingHSE
-- =====================================================
-- Questo file contiene tutte le politiche Row Level Security
-- necessarie per i bucket di storage di Supabase
--
-- ISTRUZIONI:
-- 1. Copia e incolla questo contenuto nel SQL Editor di Supabase
-- 2. Esegui le query una alla volta
-- 3. Verifica che non ci siano errori
-- =====================================================

-- Abilita RLS per la tabella storage.objects (se non già abilitato)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLITICHE PER BUCKET: service-images (PUBBLICO)
-- =====================================================

-- Permetti a tutti di visualizzare le immagini dei servizi
CREATE POLICY "Public Access - Service Images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'service-images');

-- Permetti agli utenti autenticati di caricare immagini dei servizi
CREATE POLICY "Authenticated Upload - Service Images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'service-images' AND 
  auth.role() = 'authenticated'
);

-- Permetti ai provider di aggiornare le proprie immagini dei servizi
-- (basato sul path che dovrebbe iniziare con user_id)
CREATE POLICY "Provider Update - Service Images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'service-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permetti ai provider di eliminare le proprie immagini dei servizi
CREATE POLICY "Provider Delete - Service Images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'service-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- POLITICHE PER BUCKET: profile-images (PUBBLICO)
-- =====================================================

-- Permetti a tutti di visualizzare le immagini del profilo
CREATE POLICY "Public Access - Profile Images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profile-images');

-- Permetti agli utenti autenticati di caricare la propria immagine profilo
CREATE POLICY "User Upload - Profile Images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'profile-images' AND 
  auth.role() = 'authenticated' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permetti agli utenti di aggiornare la propria immagine profilo
CREATE POLICY "User Update - Profile Images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'profile-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permetti agli utenti di eliminare la propria immagine profilo
CREATE POLICY "User Delete - Profile Images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'profile-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- POLITICHE PER BUCKET: certifications (PRIVATO)
-- =====================================================

-- Solo il proprietario può visualizzare le proprie certificazioni
CREATE POLICY "Owner Access - Certifications" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'certifications' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Solo il proprietario può caricare le proprie certificazioni
CREATE POLICY "Owner Upload - Certifications" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'certifications' AND 
  auth.role() = 'authenticated' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Solo il proprietario può aggiornare le proprie certificazioni
CREATE POLICY "Owner Update - Certifications" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'certifications' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Solo il proprietario può eliminare le proprie certificazioni
CREATE POLICY "Owner Delete - Certifications" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'certifications' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- POLITICHE PER BUCKET: temp-uploads (TEMPORANEO)
-- =====================================================

-- Solo il proprietario può visualizzare i propri upload temporanei
CREATE POLICY "Owner Access - Temp Uploads" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'temp-uploads' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Solo utenti autenticati possono caricare file temporanei
CREATE POLICY "Authenticated Upload - Temp Uploads" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'temp-uploads' AND 
  auth.role() = 'authenticated' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Solo il proprietario può aggiornare i propri upload temporanei
CREATE POLICY "Owner Update - Temp Uploads" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'temp-uploads' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Solo il proprietario può eliminare i propri upload temporanei
CREATE POLICY "Owner Delete - Temp Uploads" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'temp-uploads' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- POLITICHE PER BUCKET MANAGEMENT
-- =====================================================

-- Permetti a tutti di visualizzare i bucket pubblici
CREATE POLICY "Public Bucket Access" 
ON storage.buckets 
FOR SELECT 
USING (public = true);

-- Solo admin possono gestire i bucket (questa policy potrebbe essere troppo restrittiva)
-- CREATE POLICY "Admin Bucket Management" 
-- ON storage.buckets 
-- FOR ALL 
-- USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- FUNZIONI HELPER PER LE POLITICHE
-- =====================================================

-- Funzione per verificare se un utente è il proprietario di un file
-- basato sul path del file che dovrebbe essere: user_id/filename
CREATE OR REPLACE FUNCTION storage.is_file_owner(file_path text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Estrae l'user_id dal path (primo elemento dopo lo split)
  RETURN auth.uid()::text = split_part(file_path, '/', 1);
END;
$$;

-- Funzione per verificare se un utente può accedere a un file
-- (utile per logiche più complesse)
CREATE OR REPLACE FUNCTION storage.can_access_file(bucket_name text, file_path text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Per bucket pubblici, tutti possono accedere
  IF bucket_name IN ('service-images', 'profile-images') THEN
    RETURN true;
  END IF;
  
  -- Per bucket privati, solo il proprietario
  IF bucket_name IN ('certifications', 'temp-uploads') THEN
    RETURN storage.is_file_owner(file_path);
  END IF;
  
  -- Default: nega accesso
  RETURN false;
END;
$$;

-- =====================================================
-- VERIFICA CONFIGURAZIONE
-- =====================================================

-- Query per verificare che le politiche siano state create correttamente
-- Esegui questa query dopo aver applicato tutte le politiche sopra

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

-- Query per verificare che RLS sia abilitato
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' 
AND tablename IN ('objects', 'buckets');

-- =====================================================
-- NOTE IMPORTANTI
-- =====================================================

/*
STRUTTURA PATH CONSIGLIATA:

service-images/
  ├── {user_id}/
  │   ├── {service_id}/
  │   │   ├── main.jpg
  │   │   ├── gallery_1.jpg
  │   │   └── gallery_2.jpg

profile-images/
  ├── {user_id}/
  │   ├── avatar.jpg
  │   └── cover.jpg

certifications/
  ├── {user_id}/
  │   ├── cert_1.pdf
  │   ├── cert_2.jpg
  │   └── license.pdf

temp-uploads/
  ├── {user_id}/
  │   ├── {timestamp}_temp_file.jpg
  │   └── processing/

Questa struttura garantisce che:
1. Le politiche RLS funzionino correttamente
2. Ogni utente possa accedere solo ai propri file
3. I file siano organizzati in modo logico
4. Sia facile implementare cleanup automatici
*/

-- =====================================================
-- CLEANUP AUTOMATICO (OPZIONALE)
-- =====================================================

-- Funzione per pulire i file temporanei più vecchi di 24 ore
CREATE OR REPLACE FUNCTION storage.cleanup_temp_files()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Elimina file temporanei più vecchi di 24 ore
  DELETE FROM storage.objects 
  WHERE bucket_id = 'temp-uploads' 
  AND created_at < NOW() - INTERVAL '24 hours';
  
  -- Log dell'operazione
  RAISE NOTICE 'Cleanup temp files completed at %', NOW();
END;
$$;

-- Programma il cleanup automatico (richiede pg_cron extension)
-- SELECT cron.schedule('cleanup-temp-files', '0 2 * * *', 'SELECT storage.cleanup_temp_files();');

-- =====================================================
-- FINE FILE
-- =====================================================