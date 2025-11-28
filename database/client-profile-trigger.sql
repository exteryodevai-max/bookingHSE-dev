-- Trigger per la creazione automatica dei profili cliente
-- Questo trigger crea un record in client_profiles quando un utente di tipo "client" viene inserito

-- Funzione per creare il profilo cliente
CREATE OR REPLACE FUNCTION create_client_profile_on_user_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Crea il profilo cliente solo se l'utente è di tipo "client"
  IF NEW.user_type = 'client' THEN
    -- Controlla se il profilo cliente esiste già
    IF NOT EXISTS (SELECT 1 FROM client_profiles WHERE user_id = NEW.id) THEN
      -- Crea un profilo cliente vuoto con solo i campi richiesti
      INSERT INTO client_profiles (
        user_id,
        company_name,
        created_at,
        updated_at
      ) VALUES (
        NEW.id,
        COALESCE(NEW.company_name, ''), -- Usa company_name da users se esiste, altrimenti stringa vuota
        NOW(),
        NOW()
      );
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log dell'errore ma non blocca l'inserimento dell'utente
    RAISE WARNING 'Errore nella creazione del profilo cliente per user_id %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger per creare il profilo cliente
DROP TRIGGER IF EXISTS create_client_profile_trigger ON users;
CREATE TRIGGER create_client_profile_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_client_profile_on_user_insert();

-- Funzione per aggiornare il company_name quando viene aggiornato nella tabella users
CREATE OR REPLACE FUNCTION update_client_profile_company_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Aggiorna il company_name nel profilo cliente solo se l'utente è di tipo "client"
  IF NEW.user_type = 'client' AND OLD.company_name IS DISTINCT FROM NEW.company_name THEN
    UPDATE client_profiles 
    SET 
      company_name = COALESCE(NEW.company_name, ''),
      updated_at = NOW()
    WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log dell'errore ma non blocca l'aggiornamento
    RAISE WARNING 'Errore nell''aggiornamento del company_name nel profilo cliente per user_id %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger per aggiornare il company_name
DROP TRIGGER IF EXISTS update_client_profile_company_name_trigger ON users;
CREATE TRIGGER update_client_profile_company_name_trigger
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_client_profile_company_name();

-- Commenti per documentare
COMMENT ON FUNCTION create_client_profile_on_user_insert() IS 'Crea automaticamente un profilo cliente quando un utente di tipo client viene inserito';
COMMENT ON FUNCTION update_client_profile_company_name() IS 'Aggiorna il company_name nel profilo cliente quando viene modificato nella tabella users';
COMMENT ON TRIGGER create_client_profile_trigger ON users IS 'Trigger per la creazione automatica dei profili cliente';
COMMENT ON TRIGGER update_client_profile_company_name_trigger ON users IS 'Trigger per l''aggiornamento automatico del company_name nei profili cliente';