# Fix Contact Person Column Error

## Problema Risolto
**Data:** 2025-01-20  
**Errore:** `Could not find the 'contact_person' column of 'provider_profiles' in the schema cache`

## Descrizione del Problema
L'applicazione tentava di salvare un oggetto `contact_person` come singola colonna nel database, ma la tabella `provider_profiles` ha colonne separate per i dati di contatto:
- `contact_person_name`
- `contact_person_role` 
- `contact_person_email`
- `contact_person_phone`

## Correzioni Applicate

### 1. Correzione Logica di Salvataggio (Profile.tsx)
**File:** `src/pages/Profile.tsx`  
**Righe:** 311, 345

**Prima:**
```typescript
contact_person: formData.contact_person,
```

**Dopo:**
```typescript
contact_person_name: formData.contact_person ? 
  `${formData.contact_person.first_name?.trim() || ''} ${formData.contact_person.last_name?.trim() || ''}`.trim() : '',
contact_person_role: formData.contact_person?.role?.trim() || '',
contact_person_email: formData.contact_person?.email?.trim() || '',
contact_person_phone: formData.contact_person?.phone?.trim() || '',
```

### 2. Correzione Validazione Yup (Profile.tsx)
**File:** `src/pages/Profile.tsx`  
**Riga:** 370

**Prima:**
```typescript
await currentSchema.validate(sectionData, { abortEarly: false });
```

**Dopo:**
```typescript
// Per la sezione contact, valida formData invece di sectionData
const dataToValidate = activeTab === 'contact' ? formData : sectionData;
await currentSchema.validate(dataToValidate, { abortEarly: false });
```

## Struttura Database Verificata
La tabella `provider_profiles` contiene le seguenti colonne per i dati di contatto:
- `contact_person_name` (text)
- `contact_person_role` (text)
- `contact_person_email` (text)
- `contact_person_phone` (text)

## Risultato
✅ Errore di schema cache risolto  
✅ Errori di validazione Yup risolti  
✅ Salvataggio profilo provider funzionante  
✅ Dati di contatto salvati correttamente nei campi separati

## Test Eseguiti
- [x] Verifica struttura tabella database
- [x] Test salvataggio sezione contatti
- [x] Validazione dati form
- [x] Controllo errori console

## Note Tecniche
- Lo schema di validazione Yup rimane invariato (valida l'oggetto `contact_person`)
- I dati vengono trasformati solo al momento del salvataggio nel database
- La logica di validazione è stata adattata per validare i dati corretti per ogni sezione