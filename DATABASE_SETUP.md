# 🗄️ Configurazione Database BookingHSE

Guida completa per configurare il database Supabase per l'applicazione BookingHSE.

## 📋 Indice

1. [Prerequisiti](#prerequisiti)
2. [Setup Iniziale](#setup-iniziale)
3. [Configurazione Schema](#configurazione-schema)
4. [Popolamento Dati](#popolamento-dati)
5. [Configurazione Sicurezza](#configurazione-sicurezza)
6. [Verifica e Test](#verifica-e-test)
7. [Risoluzione Problemi](#risoluzione-problemi)
8. [Manutenzione](#manutenzione)

## 🔧 Prerequisiti

### Account e Servizi
- ✅ Account Supabase attivo
- ✅ Progetto Supabase creato
- ✅ File `.env` configurato con credenziali Supabase

### Credenziali Necessarie
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 🚀 Setup Iniziale

### 1. Accesso a Supabase Dashboard
1. Vai su [Supabase Dashboard](https://supabase.com/dashboard)
2. Effettua il login con il tuo account
3. Seleziona il progetto BookingHSE
4. Annota l'URL del progetto e le chiavi API

### 2. Configurazione Progetto
1. **Settings** > **General**: Verifica nome e regione del progetto
2. **Settings** > **API**: Copia URL e chiavi per il file `.env`
3. **Settings** > **Database**: Annota la stringa di connessione

## 📊 Configurazione Schema

### Passaggio 1: Esecuzione Schema Principale

1. **Apri SQL Editor**
   - Vai su **SQL Editor** (icona `</>` nella sidebar)
   - Clicca su **New Query**

2. **Esegui Schema Base**
   ```sql
   -- Copia e incolla il contenuto completo di database/schema.sql
   -- Questo include:
   -- - Estensioni PostgreSQL (uuid-ossp, postgis)
   -- - Enum personalizzati
   -- - Tabelle principali
   -- - Indici per performance
   -- - Trigger per timestamp automatici
   ```

3. **Verifica Esecuzione**
   - Controlla che non ci siano errori nel log
   - Verifica che tutte le tabelle siano state create

### Passaggio 2: Funzioni e Trigger

1. **Esegui Funzioni Personalizzate**
   ```sql
   -- Copia e incolla il contenuto di database/functions.sql
   -- Include funzioni per:
   -- - Gestione profili utente
   -- - Calcoli di rating
   -- - Notifiche automatiche
   -- - Analytics e reportistica
   ```

### Passaggio 3: 🔐 Trigger di Sincronizzazione Utenti

**⚠️ IMPORTANTE**: Questo passaggio è **OBBLIGATORIO** per il corretto funzionamento della registrazione utenti.

1. **Esegui Trigger di Sincronizzazione**
   ```sql
   -- Copia e incolla il contenuto COMPLETO di database/user-sync-triggers.sql
   -- Questo script include:
   -- - handle_new_user() - Sincronizza nuovi utenti da auth.users
   -- - handle_user_email_update() - Aggiorna email in tempo reale
   -- - handle_user_delete() - Gestisce cleanup alla cancellazione
   -- - Trigger automatici permanenti
   ```

2. **Esegui Fix Migrazione (Se Necessario)**
   ```sql
   -- Se hai problemi con errori 23505 (duplicate key), esegui:
   -- Copia e incolla il contenuto di database/migrations/fix_auth_trigger_23505.sql
   -- Questo fix migliora la gestione dei conflitti e previene errori di duplicazione
   ```

3. **Verifica Installazione Trigger**
   ```sql
   -- Controlla che i trigger siano stati creati
   SELECT trigger_name, event_manipulation, event_object_table 
   FROM information_schema.triggers 
   WHERE trigger_schema = 'auth' AND event_object_table = 'users';
   
   -- Dovresti vedere:
   -- on_auth_user_created | INSERT | users
   -- on_auth_user_updated | UPDATE | users  
   -- on_auth_user_deleted | DELETE | users
   ```

4. **Test del Sistema di Sincronizzazione**
   ```sql
   -- Verifica che le funzioni esistano
   SELECT routine_name, routine_type 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name LIKE 'handle_%user%';
   
   -- Dovresti vedere:
   -- handle_new_user | FUNCTION
   -- handle_user_email_update | FUNCTION
   -- handle_user_delete | FUNCTION
   ```

#### 🎯 Funzionamento dei Trigger

| Trigger | Evento | Funzione | Descrizione |
|---------|--------|----------|-------------|
| `on_auth_user_created` | INSERT su auth.users | `handle_new_user()` | Crea automaticamente record in public.users |
| `on_auth_user_updated` | UPDATE email su auth.users | `handle_user_email_update()` | Sincronizza modifiche email |
| `on_auth_user_deleted` | DELETE su auth.users | `handle_user_delete()` | Cleanup automatico |

#### ✅ Vantaggi del Sistema

- **Automatico**: I trigger si attivano automaticamente ad ogni operazione
- **Permanente**: Rimangono attivi per sempre dopo l'installazione
- **Affidabile**: Garantiscono consistenza dei dati sempre
- **Zero Manutenzione**: Nessun intervento richiesto dopo il setup
- **Performance**: Esecuzione immediata senza latenza
- **Robusto**: Gestione avanzata degli errori (fix 23505)

#### 🚨 Note Importanti

- **Esecuzione Una Tantum**: I trigger vanno installati solo una volta
- **Persistenza**: Rimangono attivi anche dopo riavvii del database
- **Compatibilità**: Funzionano con tutte le versioni di Supabase
- **Sicurezza**: Utilizzano `SECURITY DEFINER` per privilegi elevati
- **Error Handling**: Il sistema include gestione avanzata degli errori per prevenire duplicazioni

### Struttura Tabelle Create

| Tabella | Descrizione | Righe Stimate | Colonne Recenti Aggiunte |
|---------|-------------|---------------|--------------------------|
| `users` | Utenti base del sistema | 1000+ | - |
| `client_profiles` | Profili aziende clienti | 300+ | - |
| `provider_profiles` | Profili fornitori HSE | 200+ | **`region`** (VARCHAR) - Regione geografica |
| `admin_profiles` | Profili amministratori | 5-10 | - |
| `services` | Catalogo servizi HSE | 100+ | **`archived_at`** (TIMESTAMP), **`archived_reason`** (VARCHAR) - Soft delete |
| `service_categories` | Categorie servizi | 20+ | - |
| `bookings` | Prenotazioni e ordini | 5000+ | - |
| `booking_items` | Dettagli prenotazioni | 10000+ | - |
| `reviews` | Recensioni e valutazioni | 2000+ | - |
| `notifications` | Sistema notifiche | 50000+ | - |
| `certifications` | Certificazioni provider | 500+ | - |
| `insurance_coverages` | Coperture assicurative | 200+ | - |
| `availability_slots` | Disponibilità provider | 10000+ | - |
| `payments` | Transazioni pagamenti | 5000+ | - |
| `addresses` | Indirizzi geografici | 1000+ | - |
| `contact_persons` | Persone di contatto | 500+ | - |

## 📁 Configurazione Storage

### Setup Bucket Supabase

Il sistema BookingHSE utilizza **Supabase Storage** per la gestione sicura di file e documenti.

#### Passaggio 1: Esecuzione Script Storage

1. **Apri SQL Editor**
   - Vai su **SQL Editor** nel dashboard Supabase
   - Clicca su **New Query**

2. **Esegui Setup Storage**
   ```sql
   -- Copia e incolla il contenuto completo di database/storage-setup.sql
   -- Questo script include:
   -- - Creazione bucket storage
   -- - Configurazione RLS policies
   -- - Funzioni helper per gestione file
   -- - Trigger per cleanup automatico
   ```

3. **Verifica Bucket Creati**
   - Vai su **Storage** nella sidebar
   - Dovresti vedere 4 bucket:
     - `service-images` (pubblico)
     - `profile-images` (pubblico)
     - `certifications` (privato)
     - `temp-uploads` (privato)

#### Passaggio 2: Configurazione Automatica (Alternativa)

```bash
# Esegui script automatico per setup bucket
node scripts/execute-storage-setup.cjs
```

**Nota**: Lo script automatico potrebbe fallire se `SUPABASE_SERVICE_ROLE_KEY` non è configurata. In tal caso, usa il metodo manuale sopra.

### Bucket Configurati

| Bucket | Tipo | Dimensione Max | Formati Supportati | Uso |
|--------|------|----------------|-------------------|-----|
| `service-images` | Pubblico | 5MB | JPG, PNG, WebP | Immagini servizi HSE |
| `profile-images` | Pubblico | 2MB | JPG, PNG, WebP | Avatar e foto profilo |
| `certifications` | Privato | 10MB | PDF, JPG, PNG | Certificazioni e documenti |
| `temp-uploads` | Privato | 5MB | Tutti | Upload temporanei |

### Politiche RLS Storage

Le politiche di sicurezza implementate:

```sql
-- Esempio: Upload certificazioni
CREATE POLICY "Users can upload their own certifications"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'certifications' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Esempio: Download file privati
CREATE POLICY "Users can download their own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'certifications' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Funzioni Helper Storage

Funzioni SQL create per gestione avanzata:

- **`get_user_storage_usage()`** - Calcola spazio utilizzato per utente
- **`cleanup_temp_files()`** - Rimuove file temporanei scaduti
- **`validate_file_access()`** - Verifica permessi accesso file
- **`generate_signed_url()`** - Crea URL firmati per download sicuri

### Verifica Setup Storage

1. **Test Upload**
   ```javascript
   // Test nel browser console
   const { data, error } = await supabase.storage
     .from('temp-uploads')
     .upload('test.txt', new Blob(['test content']));
   
   console.log('Upload test:', { data, error });
   ```

2. **Verifica Policies**
   - Vai su **Storage** > **Policies**
   - Controlla che tutte le policies siano attive
   - Testa upload/download con utenti diversi

3. **Monitoring Storage**
   ```sql
   -- Query per monitorare utilizzo storage
   SELECT 
     bucket_id,
     COUNT(*) as file_count,
     SUM(metadata->>'size')::bigint as total_size
   FROM storage.objects 
   GROUP BY bucket_id;
   ```

### Troubleshooting Storage

#### "Bucket not found"
- **Causa**: Script storage non eseguito
- **Soluzione**: Esegui `database/storage-setup.sql` manualmente

#### "Access denied"
- **Causa**: Politiche RLS troppo restrittive
- **Soluzione**: Verifica che l'utente sia autenticato e abbia i permessi

#### "File size exceeded"
- **Causa**: File troppo grande per il bucket
- **Soluzione**: Controlla limiti configurati e comprimi il file

## 🌱 Popolamento Dati

### Dati di Esempio (Opzionale)

1. **Esegui Seed Data**
   ```sql
   -- Copia e incolla il contenuto di database/seed.sql
   -- Include dati di esempio per:
   -- - Utenti di test
   -- - Categorie servizi
   -- - Servizi di esempio
   -- - Prenotazioni di test
   ```

2. **Dati Minimi per Produzione**
   ```sql
   -- Solo categorie servizi essenziali
   INSERT INTO service_categories (name, description, icon) VALUES
   ('safety_training', 'Formazione sulla Sicurezza', 'shield'),
   ('environmental_consulting', 'Consulenza Ambientale', 'leaf'),
   ('workplace_safety', 'Sicurezza sul Lavoro', 'hard-hat'),
   ('risk_assessment', 'Valutazione Rischi', 'alert-triangle'),
   ('compliance_audit', 'Audit di Conformità', 'check-circle');
   ```

## 🔒 Configurazione Sicurezza

### Row Level Security (RLS)

1. **Verifica RLS Abilitato**
   - Vai su **Table Editor**
   - Per ogni tabella, verifica che RLS sia attivo
   - Le politiche sono già definite nello schema

2. **Politiche Principali**
   ```sql
   -- Esempi di politiche implementate:
   
   -- Users: possono vedere e modificare solo i propri dati
   CREATE POLICY "Users can view own profile" ON users
   FOR SELECT USING (auth.uid() = id);
   
   -- Bookings: clienti vedono le proprie, provider quelle assegnate
   CREATE POLICY "Clients can view own bookings" ON bookings
   FOR SELECT USING (client_id = auth.uid());
   
   -- Services: tutti possono leggere, solo provider possono modificare i propri
   CREATE POLICY "Anyone can view services" ON services
   FOR SELECT USING (true);
   ```

### Configurazione Auth

1. **Settings** > **Authentication**
2. **Providers**: Abilita Email/Password
3. **Email Templates**: Personalizza template di conferma
4. **URL Configuration**: Imposta redirect URLs

## ✅ Verifica e Test

### Test Connessione Database

1. **Test Manuale**
   ```bash
   # Esegui script di setup
   npm run setup-db
   
   # Avvia applicazione
   npm run dev
   ```

2. **Verifica Console Browser**
   ```javascript
   // Apri console del browser (F12)
   // Dovresti vedere:
   console.log('✅ Database connected successfully!');
   
   // Test completo funzionalità
   dbTests.runAll();
   ```

### Test Funzionalità

| Funzionalità | Test | Stato |
|--------------|------|-------|
| Registrazione utente | Crea nuovo account | ✅ |
| Login/Logout | Autentica utente | ✅ |
| Creazione profilo | Client/Provider setup | ✅ |
| Ricerca servizi | Filtri e risultati | ✅ |
| Prenotazione | Flusso completo | ✅ |
| Pagamenti | Integrazione Stripe | ✅ |
| Recensioni | Creazione e visualizzazione | ✅ |
| Notifiche | Real-time updates | ✅ |

### Monitoring Performance

1. **Query Performance**
   ```sql
   -- Verifica query lente
   SELECT query, mean_exec_time, calls
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

2. **Indici Mancanti**
   ```sql
   -- Controlla utilizzo indici
   SELECT schemaname, tablename, indexname, idx_scan
   FROM pg_stat_user_indexes
   ORDER BY idx_scan ASC;
   ```

## 🚨 Risoluzione Problemi

### Errori Comuni

#### "Could not find the table 'public.users'"
- **Causa**: Schema non eseguito correttamente
- **Soluzione**: 
  1. Verifica esecuzione `database/schema.sql`
  2. Controlla log errori in SQL Editor
  3. Riprova esecuzione step by step

#### "Missing Supabase environment variables"
- **Causa**: File `.env` non configurato
- **Soluzione**:
  1. Copia `.env.example` in `.env`
  2. Compila con credenziali reali da Supabase Dashboard
  3. Riavvia server di sviluppo

#### "Row Level Security policy violation"
- **Causa**: Politiche RLS troppo restrittive
- **Soluzione**:
  1. Verifica politiche in **Authentication** > **Policies**
  2. Controlla che l'utente sia autenticato
  3. Debug con query SQL dirette

#### "Connection timeout"
- **Causa**: Problemi di rete o configurazione
- **Soluzione**:
  1. Verifica URL Supabase in `.env`
  2. Controlla stato servizi Supabase
  3. Testa connessione da SQL Editor

### Debug Avanzato

1. **Logs Real-time**
   ```bash
   # Monitora logs Supabase
   # Dashboard > Logs > Real-time
   ```

2. **Query Debugging**
   ```sql
   -- Abilita logging query
   SET log_statement = 'all';
   SET log_min_duration_statement = 0;
   ```

## 🔄 Manutenzione

### Backup Automatici

1. **Configurazione Backup**
   - Supabase Pro: Backup automatici giornalieri
   - Retention: 7 giorni (Pro), 30 giorni (Team)

2. **Backup Manuali**
   ```bash
   # Export schema
   pg_dump --schema-only --no-owner --no-privileges $DATABASE_URL > schema_backup.sql
   
   # Export data
   pg_dump --data-only --no-owner --no-privileges $DATABASE_URL > data_backup.sql
   ```

### Migrazioni Schema

1. **Versioning**
   ```sql
   -- Crea tabella versioni
   CREATE TABLE schema_versions (
     version VARCHAR(20) PRIMARY KEY,
     applied_at TIMESTAMP DEFAULT NOW(),
     description TEXT
   );
   ```

2. **Script Migrazione Recenti**
   ```bash
   # Migrazioni applicate recentemente:
   # database/migrations/add_region_to_provider_profiles.sql
   # database/migrations/fix_auth_trigger_23505.sql
   # database/migrations/add_service_archiving_columns.sql
   ```

3. **Migrazioni Recenti Applicate**

   **🔄 Migrazione: Aggiunta colonna region a provider_profiles**
   - **Data**: 2024-01-20
   - **Descrizione**: Aggiunge la colonna `region` mancante alla tabella `provider_profiles` per correggere errori di validazione
   - **File**: `database/migrations/add_region_to_provider_profiles.sql`

   **🔄 Migrazione: Fix trigger autenticazione per prevenire errore 23505**
   - **Data**: 2024-01-20
   - **Descrizione**: Aggiorna il trigger `handle_new_user()` per gestire meglio le inserzioni duplicate di utenti
   - **File**: `database/migrations/fix_auth_trigger_23505.sql`

   **🔄 Migrazione: Aggiunta colonne di archiviazione servizi**
   - **Data**: 2025-01-27
   - **Descrizione**: Aggiunge colonne per soft delete funzionale alla tabella `services`
   - **File**: `database/migrations/add_service_archiving_columns.sql`

### Ottimizzazioni Performance

1. **Indici Personalizzati**
   ```sql
   -- Indici per query frequenti
   CREATE INDEX CONCURRENTLY idx_bookings_client_status 
   ON bookings(client_id, status) WHERE status != 'cancelled';
   
   CREATE INDEX CONCURRENTLY idx_services_category_location 
   ON services(category_id, location) WHERE is_active = true;
   ```

2. **Vacuum e Analyze**
   ```sql
   -- Manutenzione automatica
   VACUUM ANALYZE;
   ```

## 📞 Supporto

### Risorse Utili
- 📖 [Documentazione Supabase](https://supabase.com/docs)
- 🎯 [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql)
- 🔍 [PostgreSQL Docs](https://www.postgresql.org/docs/)
- 💬 [Community Discord](https://discord.supabase.com/)

### Contatti
- **Issues**: GitHub Issues del progetto
- **Email**: support@bookinghse.com
- **Documentazione**: Wiki del progetto

---

**⚡ Tip**: Mantieni sempre un backup recente prima di modifiche importanti al database!