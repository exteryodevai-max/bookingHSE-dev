-- Fix handle_new_user function to respect user_type from metadata
-- This resolves the issue where all new users were being created as 'client' regardless of their selected type

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_type_from_metadata TEXT;
BEGIN
  -- Estrae il user_type dai metadati dell'utente
  user_type_from_metadata := NEW.raw_user_meta_data->>'user_type';

  -- Se non è specificato nei metadati, usa 'client' come default
  IF user_type_from_metadata IS NULL OR user_type_from_metadata NOT IN ('client', 'provider', 'admin') THEN
    user_type_from_metadata := 'client';
  END IF;

  -- Controlla se l'utente esiste già prima di inserire
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    -- Inserisce automaticamente il nuovo utente nella tabella users solo se non esiste
    INSERT INTO public.users (id, email, user_type, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      user_type_from_metadata::user_type, -- Usa il tipo utente dai metadati
      NOW(),
      NOW()
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Se si verifica comunque un errore di violazione di unicità, ignora silenziosamente
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the comment to document the fix
COMMENT ON FUNCTION handle_new_user() IS 'Sincronizza automaticamente i nuovi utenti da auth.users alla tabella users, rispettando il user_type dai metadati';