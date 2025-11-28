-- Fix Storage Policies for BookingHSE
-- This script creates simplified RLS policies for storage buckets

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access - Service Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload - Service Images" ON storage.objects;
DROP POLICY IF EXISTS "Provider Update - Service Images" ON storage.objects;
DROP POLICY IF EXISTS "Provider Delete - Service Images" ON storage.objects;

-- Create simple policies for service-images bucket
-- Allow public read access
CREATE POLICY "service_images_public_read" ON storage.objects
FOR SELECT USING (bucket_id = 'service-images');

-- Allow authenticated users to upload
CREATE POLICY "service_images_authenticated_upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'service-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own files
CREATE POLICY "service_images_authenticated_update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'service-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their own files
CREATE POLICY "service_images_authenticated_delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'service-images' 
  AND auth.role() = 'authenticated'
);

-- Similar policies for profile-images
DROP POLICY IF EXISTS "profile_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "profile_images_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "profile_images_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "profile_images_authenticated_delete" ON storage.objects;

CREATE POLICY "profile_images_public_read" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "profile_images_authenticated_upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "profile_images_authenticated_update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "profile_images_authenticated_delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-images' 
  AND auth.role() = 'authenticated'
);

-- Policies for certifications (private bucket)
DROP POLICY IF EXISTS "certifications_authenticated_access" ON storage.objects;
DROP POLICY IF EXISTS "certifications_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "certifications_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "certifications_authenticated_delete" ON storage.objects;

CREATE POLICY "certifications_authenticated_access" ON storage.objects
FOR SELECT USING (
  bucket_id = 'certifications' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "certifications_authenticated_upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'certifications' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "certifications_authenticated_update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'certifications' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "certifications_authenticated_delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'certifications' 
  AND auth.role() = 'authenticated'
);