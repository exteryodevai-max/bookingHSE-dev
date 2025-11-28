-- Migration: Fix authentication trigger to prevent 23505 error
-- Date: 2024-01-20
-- Description: Updates the handle_new_user() trigger to better handle duplicate user insertions

-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update the function to handle conflicts more gracefully
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Controlla se l'utente esiste già prima di inserire
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    -- Inserisce automaticamente il nuovo utente nella tabella users solo se non esiste
    INSERT INTO public.users (id, email, user_type, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      'client', -- Default user type, può essere cambiato successivamente
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Se si verifica comunque un errore di violazione di unicità, ignora silenziosamente
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log dell'errore per debugging (opzionale)
    RAISE WARNING 'Error in handle_new_user(): %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ricrea il trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Verifica che il trigger sia stato creato correttamente
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created' 
    AND event_object_table = 'users'
    AND event_object_schema = 'auth'
  ) THEN
    RAISE NOTICE 'Trigger on_auth_user_created created successfully';
  ELSE
    RAISE EXCEPTION 'Failed to create trigger on_auth_user_created';
  END IF;
END $$;