# Configurazione Manuale Storage Supabase

## Problema Rilevato
Il componente `ProfileImageUpload` sta tentando di caricare file nel bucket `profile-images` che non esiste, causando errori:
- 400 Bad Request durante l'upload
- "Bucket not found" error

## Soluzione: Configurazione Manuale

### 1. Accedi alla Dashboard Supabase
1. Vai su https://supabase.com/dashboard
2. Seleziona il progetto BookingHSE
3. Vai su **Storage** nel menu laterale

### 2. Crea i Bucket Necessari

#### Bucket: profile-images
- **Nome**: `profile-images`
- **Pubblico**: ✅ Sì
- **Limite dimensione file**: 2MB (2097152 bytes)
- **Tipi MIME consentiti**: `image/jpeg`, `image/png`, `image/webp`

#### Bucket: service-images (opzionale per il futuro)
- **Nome**: `service-images`
- **Pubblico**: ✅ Sì
- **Limite dimensione file**: 5MB (5242880 bytes)
- **Tipi MIME consentiti**: `image/jpeg`, `image/png`, `image/webp`

### 3. Configura le Policy RLS

Vai su **SQL Editor** e esegui queste query:

```sql
-- Policy per visualizzare le immagini profilo (pubblico)
CREATE POLICY "Public Access Profile Images" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-images');

-- Policy per caricare immagini profilo (solo utenti autenticati)
CREATE POLICY "Authenticated Upload Profile Images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.role() = 'authenticated'
);

-- Policy per aggiornare le proprie immagini profilo
CREATE POLICY "Users Update Own Profile Images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-images' AND
  auth.role() = 'authenticated'
) WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.role() = 'authenticated'
);

-- Policy per eliminare le proprie immagini profilo
CREATE POLICY "Users Delete Own Profile Images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-images' AND
  auth.role() = 'authenticated'
);
```

### 4. Verifica la Configurazione

Dopo aver creato i bucket e le policy:
1. Torna all'applicazione
2. Vai alla pagina Profilo
3. Prova a caricare un'immagine profilo
4. Verifica che non ci siano più errori nella console

## Modifiche Apportate al Codice

✅ **ProfileImageUpload in Profile.tsx**: Aggiunto i parametri necessari:
- `bucket="profile-images"`
- `path` basato sull'ID utente
- `currentImageUrl` dal profilo
- Callback per gestire successo ed errori

## Note Tecniche

- Il componente ora utilizza correttamente il bucket `profile-images`
- Le immagini vengono salvate con path: `{user_id}/{timestamp}_{filename}`
- Toast notifications per feedback utente
- Gestione errori migliorata