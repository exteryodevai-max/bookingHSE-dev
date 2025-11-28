# 🚨 ISTRUZIONI PER VERIFICARE IL TRIGGER SU SUPABASE DASHBOARD

## Passaggi per controllare lo stato del trigger:

### 1. Apri il Supabase Dashboard
- Vai su: https://supabase.com/dashboard
- Accedi con il tuo account

### 2. Controlla lo stato del trigger
**Nel SQL Editor, esegui queste query:**

```sql
-- Verifica se il trigger esiste e è attivo
SELECT 
  tgname as trigger_name,
  tgenabled as enabled_status,
  CASE 
    WHEN tgenabled = 'O' THEN 'ENABLED'
    WHEN tgenabled = 'D' THEN 'DISABLED'
    ELSE 'UNKNOWN'
  END as status_text
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```

### 3. Controlla la funzione
```sql
-- Verifica la funzione handle_new_user
SELECT 
  proname as function_name,
  prosrc as source_code
FROM pg_proc 
WHERE proname = 'handle_new_user';
```

### 4. Verifica errori recenti
```sql
-- Controlla errori recenti
SELECT 
  error_message,
  created_at
FROM auth.audit_log_entries 
WHERE created_at > NOW() - INTERVAL '1 hour'
AND error_message IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

### 5. Se il trigger è DISABILITATO, riabilitalo:
```sql
-- Riabilita il trigger
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
```

### 6. Se il trigger NON esiste, ricrealo:
```sql
-- Drop sicuro se esiste
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Ricrea la funzione
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_type_from_metadata TEXT;
BEGIN
  -- Estrai user_type dai metadati
  user_type_from_metadata := NEW.raw_user_meta_data->>'user_type';
  
  -- Default a 'client' se non valido
  IF user_type_from_metadata IS NULL OR user_type_from_metadata NOT IN ('client', 'provider', 'admin') THEN  
    user_type_from_metadata := 'client';
  END IF;

  -- Inserisci nella tabella users
  INSERT INTO public.users (id, email, user_type, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    user_type_from_metadata::user_type,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log dell'errore ma non bloccare la registrazione
    RAISE NOTICE 'Errore in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ricrea il trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

### 7. Test finale
Dopo aver applicato il fix, esegui nel terminale:
```bash
node simple-trigger-check.cjs
```

## 🎯 Risultati attesi:
- ✅ Trigger deve essere ENABLED
- ✅ Funzione handle_new_user deve esistere
- ✅ Dopo la registrazione, l'utente deve apparire in tabella `users` con il tipo corretto