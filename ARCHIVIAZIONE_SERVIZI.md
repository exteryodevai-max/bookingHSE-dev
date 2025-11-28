# Sistema di Archiviazione Servizi - Documentazione

## Panoramica
Questa implementazione risolve il problema dell'archiviazione dei servizi che continuavano a riapparire dopo l'archiviazione. La soluzione utilizza una tabella separata per i servizi archiviati.

## Architettura

### 1. Tabella `archived_services`
Creata una nuova tabella `archived_services` con la stessa struttura della tabella `services` per memorizzare i servizi archiviati.

**Caratteristiche:**
- Struttura identica a `services`
- RLS policies per sicurezza
- Indici per performance
- Trigger per `updated_at`

### 2. Funzioni Database
Create due funzioni PostgreSQL per gestire il trasferimento dei servizi:

#### `archive_service(p_service_id UUID, p_user_id UUID)`
- Sposta un servizio da `services` a `archived_services`
- Verifica che il servizio appartenga all'utente
- Mantiene tutti i dati originali

#### `restore_service(p_service_id UUID, p_user_id UUID)`
- Ripristina un servizio da `archived_services` a `services`
- Riattiva il servizio (active = true)
- Verifica che il servizio appartenga all'utente

### 3. Frontend - Funzioni Helper
Create nuove funzioni TypeScript in `src/lib/archiveService.ts`:

#### `archiveService(serviceId: string, userId: string)`
- Chiama la funzione database `archive_service`
- Gestisce errori e logging

#### `restoreService(serviceId: string, userId: string)`
- Chiama la funzione database `restore_service`
- Gestisce errori e logging

#### `loadArchivedServices(userId: string)`
- Carica i servizi archiviati per un provider
- Include relazioni con utenti e profili

### 4. Frontend - Modifiche Pagina
Aggiornate le funzioni in `ProviderServicesPage.tsx`:

#### `loadProviderServices()`
- Carica servizi attivi da `services`
- Carica servizi archiviati da `archived_services`
- Separa completamente i due insiemi di dati

#### `handleDeleteService()` e `handleSoftDelete()`
- Usano `archiveService()` invece di `UPDATE active = false`
- Elimina il problema dei dati cached

#### `handleRestoreService()`
- Usa `restoreService()` invece di `UPDATE active = true`
- Sposta fisicamente il servizio tra tabelle

## Vantaggi della Soluzione

1. **Elimina Race Conditions**: I servizi vengono fisicamente spostati, non solo flaggati
2. **No Cache Issues**: Query separate eliminano problemi di cache
3. **Performance Migliore**: Le query sono più semplici e veloci
4. **Sicurezza**: RLS policies specifiche per ogni tabella
5. **Audit Trail**: Storico completo degli spostamenti

## Installazione

1. Esegui la migrazione SQL:
```bash
supabase db push supabase/migrations/20240924190000_add_archived_services.sql
```

2. Ricarica il frontend per applicare le modifiche

## Test

Per testare il sistema:
1. Archivia un servizio dal pannello provider
2. Verifica che sparisca dai servizi attivi
3. Controlla che appaia nei servizi archiviati
4. Ripristina il servizio
5. Verifica che torni nei servizi attivi

## Problemi Risolti e Soluzioni

### Errore 400 Bad Request
**Sintomo**: La funzione `archive_service` restituiva errore 400
**Causa**: Ricerca del campo `location_address` inesistente
**Soluzione**: Sostituito con stringa vuota `''`

### Errore 42804 (Type Mismatch)
**Sintomo**: "cannot cast type text[] to jsonb"
**Causa**: Conversione diretta non supportata tra `text[]` e `jsonb`
**Soluzione**: Utilizzo di `to_jsonb()` per conversione corretta

### Errore 42846 (Cannot cast)
**Sintomo**: Cast diretto fallito durante archiviazione
**Causa**: Sintassi di cast non valida per array → JSONB
**Soluzione**: Implementazione con `CASE` statement condizionale

### Script di Correzione Definitivo
Creato `force-fix-archive.cjs` che:
- Fa DROP completo delle funzioni esistenti
- Ricrea le funzioni con corretta gestione tipi
- Risolve definitivamente tutti i problemi di conversione

## Logging
Il sistema include logging dettagliato per il debugging:
- `[loadProviderServices]` - Caricamento servizi
- Archiviazione/Ripristino con successo/errore
- Conteggi finali dei servizi

## Sicurezza
- Le funzioni database verificano la proprietà del servizio
- Le RLS policies limitano l'accesso ai propri servizi
- Le transazioni assicurano consistenza dei dati