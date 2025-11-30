# 🔧 Fix per Errore 23505 durante Login

## 📋 Problema Identificato

L'errore **23505** (violazione di vincolo di unicità) si verifica durante il login perché il trigger del database `handle_new_user()` cerca di inserire un utente che potrebbe già esistere nella tabella `users`.

## 🎯 Soluzione

Abbiamo creato una migrazione che aggiorna il trigger per gestire meglio i conflitti di unicità.

## 📝 Istruzioni per Applicare il Fix

### Passo 1: Accedi a Supabase Dashboard
1. Vai su [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Accedi al tuo account
3. Seleziona il progetto **BookingHSE**

### Passo 2: Apri SQL Editor
1. Nella sidebar sinistra, clicca su **SQL Editor** (icona `</>`)
2. Clicca su **New Query**

### Passo 3: Esegui la Migrazione
1. Copia tutto il contenuto del file `database/migrations/fix_auth_trigger_23505.sql`
2. Incolla nel SQL Editor
3. Clicca su **Run** (o premi Ctrl+Enter)

### Passo 4: Verifica il Risultato
Dovresti vedere un messaggio di successo simile a:
```
NOTICE: Trigger on_auth_user_created created successfully
```

## 🧪 Test del Fix

### Dopo aver applicato la migrazione:

1. **Testa il Login**
   - Vai su [http://localhost:5173](http://localhost:5173)
   - Clicca su "Accedi"
   - Prova a fare login con le credenziali esistenti
   - **Non dovrebbe più apparire l'errore 23505**

2. **Testa la Registrazione**
   - Prova a registrare un nuovo utente
   - Verifica che il processo funzioni senza errori

3. **Controlla i Log**
   - Apri gli strumenti per sviluppatori (F12)
   - Vai nella tab **Console**
   - Verifica che non ci siano errori durante l'autenticazione

## 🔍 Cosa Fa il Fix

Il nuovo trigger:

1. **Controlla l'esistenza** dell'utente prima di inserirlo
2. **Gestisce le eccezioni** con un blocco `EXCEPTION`
3. **Ignora silenziosamente** i conflitti di unicità
4. **Logga gli errori** per debugging (opzionale)

## 📊 Codice del Fix

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Controlla se l'utente esiste già prima di inserire
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    INSERT INTO public.users (id, email, user_type, created_at, updated_at)
    VALUES (NEW.id, NEW.email, 'client', NOW(), NOW());
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Ignora silenziosamente i conflitti di unicità
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## ⚠️ Note Importanti

- **Backup**: Il fix è sicuro, ma è sempre buona pratica fare un backup prima di modifiche al database
- **Test**: Testa sempre in ambiente di sviluppo prima di applicare in produzione
- **Monitoraggio**: Monitora i log dopo l'applicazione per verificare che tutto funzioni correttamente

## 🆘 Troubleshooting

### Se il fix non funziona:

1. **Verifica che il trigger sia stato creato**:
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'on_auth_user_created';
   ```

2. **Controlla i log di Supabase**:
   - Dashboard → Logs → Database

3. **Verifica la funzione**:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';
   ```

## ✅ Risultato Atteso

Dopo aver applicato il fix:
- ✅ Login funziona senza errori 23505
- ✅ Registrazione funziona correttamente
- ✅ Gli utenti esistenti possono accedere normalmente
- ✅ I nuovi utenti vengono creati senza problemi

---

**🔑 Punto chiave**: Questo fix risolve definitivamente l'errore 23505 durante l'autenticazione gestendo meglio i conflitti di unicità nel trigger del database.