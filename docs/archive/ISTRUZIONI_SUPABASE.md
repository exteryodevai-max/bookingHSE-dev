# Istruzioni per Implementare l'Archiviazione Servizi su Supabase

## Metodo 1: Dashboard Supabase (Consigliato)

1. **Accedi al tuo progetto Supabase**
   - Vai su https://app.supabase.com
   - Seleziona il tuo progetto

2. **SQL Editor**
   - Vai su "SQL Editor" nel menu laterale
   - Clicca "New query"

3. **Esegui lo script SQL**
   - Copia il contenuto del file `supabase/migrations/20240924190000_add_archived_services.sql`
   - Incollalo nell'editor SQL
   - Clicca "Run" o premi Ctrl+Enter

## Metodo 2: CLI Supabase (Se configurato)

Se hai già configurato Supabase CLI con il tuo progetto:

```bash
supabase db push supabase/migrations/20240924190000_add_archived_services.sql
```

## Verifica dell'Installazione

Dopo aver eseguito la migrazione, verifica che:

1. **Tabella creata**: `archived_services` dovrebbe apparire in "Table Editor"
2. **Funzioni create**: Le funzioni `archive_service` e `restore_service` dovrebbero essere visibili in "Database" > "Functions"
3. **RLS Policies**: Le policies dovrebbero essere attive per la tabella `archived_services`

## Test della Funzionalità

1. **Archivia un servizio**:
   - Vai su http://localhost:5174/services/provider
   - Trova un servizio attivo
   - Clicca "Archivia"
   - Il servizio dovrebbe sparire dai servizi attivi

2. **Verifica servizi archiviati**:
   - Clicca su "Servizi Archiviati"
   - Il servizio archiviato dovrebbe apparire qui

3. **Ripristina un servizio**:
   - Nei servizi archiviati, clicca "Ripristina"
   - Il servizio dovrebbe tornare nei servizi attivi

## Risoluzione Problemi

### Se la migrazione fallisce:
1. Controlla di avere i permessi di amministratore
2. Verifica che non ci siano conflitti con tabelle esistenti
3. Prova a eseguire le query una alla volta

### Se i servizi non si archiviano:
1. Controlla la console del browser per errori
2. Verifica che le funzioni siano state create correttamente
3. Controlla i log di Supabase per errori lato server

### Se i servizi archiviati non compaiono:
1. Verifica che la tabella `archived_services` abbia dati
2. Controlla che le RLS policies siano configurate correttamente
3. Assicurati che l'utente abbia i permessi necessari

## File Creati

- `supabase/migrations/20240924190000_add_archived_services.sql` - Migrazione completa
- `src/lib/archiveService.ts` - Funzioni helper TypeScript
- `ARCHIVIAZIONE_SERVIZI.md` - Documentazione tecnica
- `ISTRUZIONI_SUPABASE.md` - Questo file di istruzioni

## Supporto

Se incontri problemi:
1. Controlla i log nel browser console
2. Verifica i log di Supabase
3. Contatta il supporto con i dettagli dell'errore