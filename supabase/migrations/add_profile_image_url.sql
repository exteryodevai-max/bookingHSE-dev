-- Aggiunge il campo profile_image_url alla tabella users
ALTER TABLE users 
ADD COLUMN profile_image_url TEXT;

-- Aggiunge il campo profile_image_url alla tabella provider_profiles
ALTER TABLE provider_profiles 
ADD COLUMN profile_image_url TEXT;

-- Commenti per documentare i campi
COMMENT ON COLUMN users.profile_image_url IS 'URL dell''immagine del profilo utente';
COMMENT ON COLUMN provider_profiles.profile_image_url IS 'URL dell''immagine del profilo provider';