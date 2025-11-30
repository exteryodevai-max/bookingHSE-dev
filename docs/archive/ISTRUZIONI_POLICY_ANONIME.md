# 🔧 ISTRUZIONI: Applicazione Policy RLS per Accesso Anonimo

## ❌ PROBLEMA IDENTIFICATO
Gli utenti **NON autenticati** vedono "Provider non disponibile" perché le policy RLS bloccano l'accesso anonimo alle tabelle `users` e `provider_profiles`.

## ✅ SOLUZIONE
Applicare le seguenti policy RLS tramite il **Dashboard Supabase**.

---

## 📋 STEP 1: Accesso al Dashboard Supabase

1. Vai su: https://supabase.com/dashboard
2. Seleziona il progetto **BookingHSE**
3. Vai su **SQL Editor** nel menu laterale

---

## 📋 STEP 2: Applicazione Policy per Tabella `users`

Copia e incolla questo SQL nel **SQL Editor**:

```sql
-- Policy per permettere accesso anonimo ai dati pubblici dei provider
CREATE POLICY "Anonymous can view provider users" 
ON public.users 
FOR SELECT 
TO anon
USING (
  user_type = 'provider'
);
```

**Clicca "Run"** per eseguire.

---

## 📋 STEP 3: Applicazione Policy per Tabella `provider_profiles`

Copia e incolla questo SQL nel **SQL Editor**:

```sql
-- Policy per permettere accesso anonimo ai profili provider
CREATE POLICY "Anonymous can view provider profiles" 
ON public.provider_profiles 
FOR SELECT 
TO anon
USING (true);
```

**Clicca "Run"** per eseguire.

---

## 📋 STEP 4: Verifica Policy Applicate

Esegui questa query per verificare che le policy siano state create:

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('users', 'provider_profiles')
  AND 'anon' = ANY(roles)
ORDER BY tablename, policyname;
```

**Risultato atteso:**
- 2 policy con ruolo `anon`
- Una per `users` e una per `provider_profiles`

---

## 📋 STEP 5: Test Funzionamento

Dopo aver applicato le policy:

1. **Apri il frontend** in modalità incognito/privata
2. **Vai alla pagina di ricerca servizi**
3. **Verifica che i provider siano visibili** (non più "Provider non disponibile")

---

## 🔍 DIAGNOSI TECNICA

### Prima delle Policy (PROBLEMA):
```
📋 TEST 3: Accesso anonimo con JOIN provider
✅ Servizi con JOIN accessibili: 5
   - LAVORO: NON DISPONIBILE ❌
   - Digital Safety: NON DISPONIBILE ❌
   - test senza rls bucket servizi: NON DISPONIBILE ❌
```

### Dopo le Policy (RISOLTO):
```
📋 TEST 3: Accesso anonimo con JOIN provider
✅ Servizi con JOIN accessibili: 5
   - LAVORO: Bitt ✅
   - Digital Safety: Exteryo SRL ✅
   - test senza rls bucket servizi: Pippo Srl ✅
```

---

## ⚠️ NOTE IMPORTANTI

1. **Sicurezza**: Le policy permettono solo lettura (`SELECT`) di dati pubblici
2. **Filtri**: Solo provider attivi e dati non sensibili sono esposti
3. **Reversibilità**: Le policy possono essere rimosse se necessario

---

## 🚨 SE LE POLICY ESISTONO GIÀ

Se ricevi errore "policy already exists", prima rimuovi le policy esistenti:

```sql
-- Rimuovi policy esistenti
DROP POLICY IF EXISTS "Anonymous can view provider users" ON public.users;
DROP POLICY IF EXISTS "Anonymous can view provider profiles" ON public.provider_profiles;
```

Poi riapplica le policy sopra.

---

## 📞 SUPPORTO

Se hai problemi nell'applicazione:
1. Verifica di essere nel progetto corretto
2. Controlla i permessi del tuo account Supabase
3. Verifica che RLS sia abilitato sulle tabelle