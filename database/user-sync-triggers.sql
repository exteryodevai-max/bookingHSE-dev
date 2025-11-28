-- User Synchronization Triggers for BookingHSE
-- Questo file contiene le funzioni e trigger necessari per sincronizzare
-- automaticamente auth.users con la tabella users personalizzata

-- Funzione per gestire la creazione automatica di un utente nella tabella users
-- quando viene creato un nuovo utente in auth.users
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

-- Trigger che si attiva quando viene inserito un nuovo utente in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Funzione per gestire l'aggiornamento dell'email
CREATE OR REPLACE FUNCTION handle_user_email_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Aggiorna l'email nella tabella users quando viene cambiata in auth.users
  UPDATE public.users
  SET 
    email = NEW.email,
    updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger per sincronizzare gli aggiornamenti email
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_email_update();

-- Funzione per gestire la cancellazione di un utente
CREATE OR REPLACE FUNCTION handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- La cancellazione è già gestita da ON DELETE CASCADE nella foreign key
  -- Questo trigger può essere usato per cleanup aggiuntivo se necessario
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger per gestire la cancellazione (opzionale)
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_delete();

-- Commenti per documentazione
COMMENT ON FUNCTION handle_new_user() IS 'Sincronizza automaticamente i nuovi utenti da auth.users alla tabella users, rispettando il user_type dai metadati';
COMMENT ON FUNCTION handle_user_email_update() IS 'Sincronizza gli aggiornamenti email da auth.users alla tabella users';
COMMENT ON FUNCTION handle_user_delete() IS 'Gestisce la cancellazione degli utenti (cleanup aggiuntivo se necessario)';

-- Nota: Questi trigger garantiscono che ogni utente creato tramite Supabase Auth
-- venga automaticamente inserito nella tabella users personalizzata con i valori di default.
-- Il tipo di utente può essere successivamente aggiornato tramite l'applicazione.