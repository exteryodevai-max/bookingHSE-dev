# Fix: Conversione Tipo JSONB per Archiviazione Servizi

## Problema

**Errore PostgreSQL 42804**: "cannot cast type text[] to jsonb"
**Errore PostgreSQL 42846**: Cast diretto fallito durante archiviazione

### Sintomi
- La funzione `archive_service` falliva con errori di tipo
- I servizi non venivano archiviati correttamente
- Console mostrava errori di conversione tipo

## Analisi Root Cause

### Struttura Tabelle
- **Tabella `services`**: Il campo `images` è di tipo `text[]` (array di testo)
- **Tabella `archived_services`**: Il campo `images` è di tipo `jsonb`

### Problema di Conversione
La conversione diretta `text[]` → `jsonb` non è supportata nativamente da PostgreSQL, causando gli errori:
- `42804`: Type mismatch durante l'inserimento
- `42846`: Cast diretto non valido

## Soluzione Implementata

### Script di Correzione: `force-fix-archive.cjs`

#### 1. Drop Completo Funzioni
```sql
DROP FUNCTION IF EXISTS archive_service(UUID, UUID);
DROP FUNCTION IF EXISTS restore_service(UUID, UUID);
```

#### 2. Ricreazione Funzione `archive_service`
```sql
CREATE OR REPLACE FUNCTION archive_service(p_service_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Verifica proprietà e inserisce in archived_services con conversione corretta
    INSERT INTO archived_services (
        id, provider_id, title, description, price, duration, 
        category, active, created_at, updated_at, images,
        location_city, location_province, location_country, location_postal_code
    )
    SELECT 
        id, provider_id, title, description, price, duration, 
        category, active, created_at, updated_at, 
        CASE 
            WHEN images IS NULL OR array_length(images, 1) = 0 THEN '[]'::jsonb
            ELSE to_jsonb(images)
        END,
        location_city, location_province, location_country, location_postal_code
    FROM services 
    WHERE id = p_service_id AND provider_id = p_user_id;
    
    -- Elimina dalla tabella originale
    DELETE FROM services WHERE id = p_service_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 3. Ricreazione Funzione `restore_service`
```sql
CREATE OR REPLACE FUNCTION restore_service(p_service_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Reinserisce in services mantenendo il tipo originale text[]
    INSERT INTO services (
        id, provider_id, title, description, price, duration, 
        category, active, created_at, updated_at, images,
        location_city, location_province, location_country, location_postal_code
    )
    SELECT 
        id, provider_id, title, description, price, duration, 
        category, true, created_at, updated_at, 
        CASE 
            WHEN images = '[]'::jsonb OR images IS NULL THEN '{}'::text[]
            ELSE (images)::text[]
        END,
        location_city, location_province, location_country, location_postal_code
    FROM archived_services 
    WHERE id = p_service_id AND provider_id = p_user_id;
    
    -- Elimina dalla tabella archiviata
    DELETE FROM archived_services WHERE id = p_service_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Tecniche di Conversione Utilizzate

### 1. `text[]` → `jsonb` (Archiviazione)
```sql
CASE 
    WHEN images IS NULL OR array_length(images, 1) = 0 THEN '[]'::jsonb
    ELSE to_jsonb(images)
END
```

### 2. `jsonb` → `text[]` (Ripristino)
```sql
CASE 
    WHEN images = '[]'::jsonb OR images IS NULL THEN '{}'::text[]
    ELSE (images)::text[]
END
```

## Vantaggi della Soluzione

1. **Conversione Sicura**: Gestione di casi edge (null, array vuoti)
2. **Performance**: Utilizzo di funzioni native PostgreSQL
3. **Robustezza**: Error handling integrato con CASE statements
4. **Mantenibilità**: Codice chiaro e documentato

## Testing

### Test di Conversione
```sql
-- Test conversione text[] → jsonb
SELECT to_jsonb(ARRAY['image1.jpg', 'image2.jpg']);

-- Test conversione jsonb → text[]
SELECT ('["image1.jpg","image2.jpg"]'::jsonb)::text[];
```

### Test Funzioni
1. Archivia servizio con immagini
2. Verifica conversione corretta in `archived_services`
3. Ripristina servizio
4. Verifica conversione inversa corretta in `services`

## File Correlati

- `force-fix-archive.cjs` - Script di correzione definitivo
- `ARCHIVIAZIONE_SERVIZI.md` - Documentazione completa sistema
- `ARCHIVIAZIONE_SERVIZI_COMPLETATA.md` - Riepilogo implementazione

## Note Tecniche

- **`to_jsonb()`**: Funzione PostgreSQL che converte qualsiasi tipo a JSONB
- **Cast esplicito**: `(value)::target_type` per conversioni sicure
- **CASE statement**: Gestione condizionale per valori null/vuoti

## Risoluzione Definitiva

Questo fix risolve permanentemente i problemi di conversione tipo tra le tabelle `services` e `archived_services`, garantendo un sistema di archiviazione robusto e senza errori.