-- ==============================================
-- CONFIGURAZIONE STORAGE SUPABASE per BookingHSE
-- ==============================================
-- Questo file contiene tutte le istruzioni SQL necessarie per configurare
-- i bucket di storage e le relative politiche RLS in Supabase.
--
-- ISTRUZIONI:
-- 1. Vai su https://supabase.com/dashboard
-- 2. Seleziona il tuo progetto BookingHSE
-- 3. Vai su SQL Editor
-- 4. Copia e incolla questo intero file
-- 5. Esegui lo script

-- ==============================================
-- CREAZIONE BUCKET STORAGE
-- ==============================================

-- Bucket per immagini dei servizi (pubblico)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-images',
  'service-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Bucket per immagini profilo (pubblico)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Bucket per certificazioni (privato)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certifications',
  'certifications',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Bucket per upload temporanei (privato)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'temp-uploads',
  'temp-uploads',
  false,
  15728640, -- 15MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- POLITICHE RLS PER STORAGE
-- ==============================================

-- Rimuovi politiche esistenti se presenti
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Profile" ON storage.objects;
DROP POLICY IF EXISTS "User Profile Upload" ON storage.objects;
DROP POLICY IF EXISTS "Owner Access Certifications" ON storage.objects;
DROP POLICY IF EXISTS "Owner Upload Certifications" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete Certifications" ON storage.objects;
DROP POLICY IF EXISTS "Temp Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Temp Upload Insert" ON storage.objects;
DROP POLICY IF EXISTS "Temp Upload Delete" ON storage.objects;

-- ==============================================
-- POLITICHE PER SERVICE-IMAGES (Pubblico)
-- ==============================================

-- Accesso pubblico in lettura per immagini servizi
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'service-images');

-- Upload autenticato per immagini servizi
CREATE POLICY "Authenticated Upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'service-images' AND 
  auth.role() = 'authenticated'
);

-- Update per proprietari
CREATE POLICY "Owner Update Service Images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'service-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
) WITH CHECK (
  bucket_id = 'service-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Delete per proprietari
CREATE POLICY "Owner Delete Service Images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'service-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ==============================================
-- POLITICHE PER PROFILE-IMAGES (Pubblico)
-- ==============================================

-- Accesso pubblico in lettura per immagini profilo
CREATE POLICY "Public Access Profile" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-images');

-- Upload per utenti autenticati
CREATE POLICY "User Profile Upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-images' AND 
  auth.role() = 'authenticated' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Update per proprietari
CREATE POLICY "Owner Update Profile Images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
) WITH CHECK (
  bucket_id = 'profile-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Delete per proprietari
CREATE POLICY "Owner Delete Profile Images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ==============================================
-- POLITICHE PER CERTIFICATIONS (Privato)
-- ==============================================

-- Accesso solo per proprietari delle certificazioni
CREATE POLICY "Owner Access Certifications" ON storage.objects
FOR SELECT USING (
  bucket_id = 'certifications' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Upload solo per proprietari
CREATE POLICY "Owner Upload Certifications" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'certifications' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Update per proprietari
CREATE POLICY "Owner Update Certifications" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'certifications' AND 
  auth.uid()::text = (storage.foldername(name))[1]
) WITH CHECK (
  bucket_id = 'certifications' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Delete per proprietari
CREATE POLICY "Owner Delete Certifications" ON storage.objects
FOR DELETE USING (
  bucket_id = 'certifications' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ==============================================
-- POLITICHE PER TEMP-UPLOADS (Temporaneo)
-- ==============================================

-- Accesso per utenti autenticati ai propri file temporanei
CREATE POLICY "Temp Upload Access" ON storage.objects
FOR SELECT USING (
  bucket_id = 'temp-uploads' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Upload per utenti autenticati
CREATE POLICY "Temp Upload Insert" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'temp-uploads' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Delete per proprietari (per pulizia)
CREATE POLICY "Temp Upload Delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'temp-uploads' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ==============================================
-- FUNZIONI HELPER PER STORAGE
-- ==============================================

-- Funzione per ottenere l'URL pubblico di un file
CREATE OR REPLACE FUNCTION get_storage_public_url(bucket_name text, file_path text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN format('https://%s/storage/v1/object/public/%s/%s', 
    current_setting('app.settings.supabase_url', true), 
    bucket_name, 
    file_path
  );
END;
$$;

-- Funzione per pulire file temporanei vecchi (da eseguire periodicamente)
CREATE OR REPLACE FUNCTION cleanup_temp_uploads()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Elimina file temporanei più vecchi di 24 ore
  DELETE FROM storage.objects 
  WHERE bucket_id = 'temp-uploads' 
    AND created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- ==============================================
-- VERIFICA CONFIGURAZIONE
-- ==============================================

-- Verifica che i bucket siano stati creati
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id IN ('service-images', 'profile-images', 'certifications', 'temp-uploads')
ORDER BY id;

-- Verifica che le politiche siano state create
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;

-- ==============================================
-- FINE CONFIGURAZIONE STORAGE
-- ==============================================

-- ✅ CONFIGURAZIONE COMPLETATA!
-- 
-- PROSSIMI PASSI:
-- 1. Verifica che tutti i bucket siano visibili in Storage > Buckets
-- 2. Testa l'upload di file nell'applicazione
-- 3. Configura un cron job per eseguire cleanup_temp_uploads() periodicamente
--
-- NOTA: Per abilitare la pulizia automatica dei file temporanei,
-- configura un cron job che esegua: SELECT cleanup_temp_uploads();