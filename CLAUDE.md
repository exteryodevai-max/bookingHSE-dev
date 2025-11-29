# BookingHSE - Development Guide

> **IMPORTANTE PER GLI AGENTI**: Leggere attentamente questo file prima di ogni task. Aggiornare la sezione "Changelog" alla fine di ogni task completato.

---

## Quick Reference

### Comandi Essenziali
```bash
npm install          # Installa dipendenze
npm run dev          # Avvia dev server (localhost:5173)
npm run build        # Build produzione
npm run lint         # Linting
```

### SSH Tunnel (richiesto per API)
```bash
ssh -p 6001 -L 3000:127.0.0.1:3000 pierluigi@217.194.10.242
```

### Database Connection
```
Host: 217.194.10.242 (o localhost via tunnel)
Port: 5432
Database: bookinghse_dev
User: postgres
Password: bookinghse2025
```

---

## 1. Project Overview

**BookingHSE** è una piattaforma di prenotazione servizi HSE (Health, Safety, Environment) che connette clienti con fornitori.

### Tech Stack
| Layer | Tecnologia |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS 3.4 + Headless UI |
| Icons | Heroicons (@heroicons/react/24/outline, /24/solid) |
| Forms | React Hook Form + Yup validation |
| State | React Context (AuthContext) |
| API | PostgREST (NON Supabase cloud) |
| Database | PostgreSQL |
| Auth | JWT custom via funzioni PostgreSQL |
| Payments | Stripe |

### Lingua UI
- Tutta l'interfaccia è in **Italiano**
- Messaggi di errore in italiano
- Labels form in italiano

---

## 2. Project Structure

```
src/
├── components/                 # Componenti React riutilizzabili
│   ├── Auth/                   # ProtectedRoute.tsx
│   ├── Home/                   # Hero, ServiceCategories, FeaturedProviders, HowItWorks
│   ├── Layout/                 # Layout.tsx, Header.tsx, Footer.tsx
│   ├── Map/                    # Map.tsx, LocationPicker.tsx
│   ├── Search/                 # SearchForm, SearchResults, SearchFiltersPanel, GeoFilters
│   ├── payment/                # StripePaymentForm.tsx
│   ├── ui/                     # button, card, badge, FileUpload, ProfileImageUpload
│   ├── SmartCalendar.tsx       # Calendario disponibilità
│   ├── ReviewSystem.tsx        # Sistema recensioni
│   ├── NotificationCenter.tsx  # Centro notifiche
│   ├── CertificationManager.tsx
│   └── ProviderDashboard.tsx
│
├── contexts/
│   └── AuthContext.tsx         # ⭐ Auth state principale (user, signIn, signOut, updateProfile)
│
├── hooks/
│   ├── useFileUpload.ts        # Upload file con progress
│   ├── usePayment.ts           # Pagamenti Stripe
│   ├── useGeolocation.ts       # Geolocalizzazione browser
│   ├── useCache.ts             # Cache generico
│   └── useImageCache.ts        # Cache immagini
│
├── lib/
│   ├── postgrest.ts            # ⭐ Client API (esporta `supabase` per compatibilità)
│   ├── database.types.ts       # ⭐ Tipi database auto-generati
│   ├── supabase.ts             # Helper database (db.createUser, db.getServices, etc.)
│   ├── servicesApi.ts          # API servizi con filtri avanzati
│   ├── geoSearch.ts            # Ricerca geografica
│   ├── geocoding.ts            # Conversione indirizzi
│   ├── locations.ts            # Dati regioni/città Italia
│   ├── availability.ts         # Logica slot calendario
│   ├── certifications.ts       # Verifica certificazioni
│   ├── payments.ts             # Elaborazione pagamenti
│   ├── reviews.ts              # Gestione recensioni
│   ├── notifications.ts        # Sistema notifiche
│   ├── storage/                # Upload file
│   ├── cache/                  # Sistema cache (cacheManager.ts)
│   └── errors/                 # Error handling
│
├── pages/
│   ├── Auth/                   # LoginPage, RegisterPage, EmailVerification*
│   ├── Providers/              # ProviderDetailPage, ProvidersPage
│   ├── Services/               # CreateServicePage, EditServicePage, BulkImportPage
│   ├── Bookings/               # BookingsPage, BookingDetailPage
│   ├── Info/                   # HowItWorksPage, ForProvidersPage, ContactPage
│   ├── Legal/                  # TermsPage, PrivacyPage, CookiesPage
│   ├── Home.tsx
│   ├── Search.tsx
│   ├── ServiceDetail.tsx
│   ├── Profile.tsx             # ⭐ Profilo utente (client + provider)
│   ├── Dashboard.tsx
│   └── NotFoundPage.tsx
│
├── types/
│   └── index.ts                # ⭐ Tutti i tipi: User, ProviderProfile, ClientProfile, Service, Booking, etc.
│
├── utils/
│   └── categories.ts           # Categorie servizi HSE
│
└── styles/
    └── index.css               # Tailwind imports + custom styles
```

---

## 3. File Chiave per Operazioni Comuni

### Modificare Campi Profilo (Client o Provider)

| Step | File | Cosa modificare |
|------|------|-----------------|
| 1 | `src/types/index.ts` | Aggiungere/rimuovere campo da `ClientProfile` o `ProviderProfile` |
| 2 | `src/lib/database.types.ts` | Aggiornare tipi Row/Insert/Update per la tabella |
| 3 | `src/contexts/AuthContext.tsx` | Mapping del campo nei default e nei metodi di caricamento |
| 4 | `src/pages/Profile.tsx` | Schema Yup + campo form + submit handler |
| 5 | Pagine display | `ProviderDetailPage.tsx`, `ServiceDetail.tsx`, etc. |
| 6 | Database | Migration SQL se serve modificare schema |

### Aggiungere Nuova Pagina

1. Creare file in `src/pages/[NomePage].tsx`
2. Aggiungere route in `src/App.tsx`
3. Se protetta: wrappare con `<ProtectedRoute>`

### Aggiungere Nuovo Componente

1. Creare in `src/components/[Feature]/[NomeComponente].tsx`
2. Se UI base: metterlo in `src/components/ui/`

---

## 4. Tipi TypeScript Principali

### User & Profiles (`src/types/index.ts`)

```typescript
interface User {
  id: string
  email: string
  user_type: 'client' | 'provider' | 'admin'
  profile: ClientProfile | ProviderProfile
  created_at: string
  updated_at: string
}

interface ClientProfile {
  company_name: string
  vat_number: string
  fiscal_code: string
  company_size: 'micro' | 'small' | 'medium' | 'large'
  industry_sector: string
  employees_count: number
  phone: string
  website?: string  // Solo client ha website
  legal_address: Address
  contact_person: ContactPerson
  certifications?: string[]
}

interface ProviderProfile {
  business_name: string
  vat_number: string
  fiscal_code: string
  description: string
  phone: string
  address: Address
  contact_person: ContactPerson
  specializations: string[]
  service_areas: string[]
  languages: string[]
  experience_years: number
  team_size: number
  rating_average: number
  reviews_count: number
  verified: boolean
  profile_image_url?: string
  certifications: Certification[]
  // NOTA: website rimosso il 2025-11-29
}
```

### Service Categories

```typescript
type ServiceCategory =
  | 'consultation_management'  // Consulenza e gestione
  | 'workplace_safety'         // Sicurezza sul lavoro
  | 'training_education'       // Formazione
  | 'environment'              // Ambiente
  | 'occupational_health'      // Medicina del lavoro
  | 'emergency_crisis'         // Emergenze
  | 'innovation_digital'       // Innovazione digitale
  | 'specialized_services'     // Servizi specializzati
```

### Booking Status Flow

```
draft → pending → confirmed → in_progress → completed
                     ↓
                 cancelled
```

---

## 5. Pattern di Codice

### API Calls (PostgREST)

```typescript
import { supabase } from '@/lib/postgrest';

// Query
const { data, error } = await supabase
  .from('services')
  .select('*')
  .eq('provider_id', providerId)
  .order('created_at', { ascending: false });

// Insert
const { data, error } = await supabase
  .from('bookings')
  .insert({ client_id, service_id, status: 'pending' })
  .select()
  .single();

// Update
const { error } = await supabase
  .from('provider_profiles')
  .update({ description: 'Nuova descrizione' })
  .eq('user_id', userId);

// RPC (funzioni PostgreSQL)
const { data, error } = await supabase.rpc('login', {
  p_email: email,
  p_password: password
});
```

### Form con React Hook Form + Yup

```typescript
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
  email: yup.string().email('Email non valida').required('Email obbligatoria'),
  phone: yup.string().required('Telefono obbligatorio'),
  website: yup.string().url('URL non valido').nullable(),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: yupResolver(schema),
  mode: 'onBlur'
});

// Nel JSX
<input {...register('email')} className="..." />
{errors.email && <p className="text-red-600 text-sm">{errors.email.message}</p>}
```

### Conditional Rendering

```tsx
// Mostra solo se il campo esiste
{profile.phone && (
  <div className="flex items-center">
    <PhoneIcon className="h-5 w-5 mr-2" />
    {profile.phone}
  </div>
)}
```

### Protected Routes

```tsx
// In App.tsx
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />

// Solo per provider
<Route path="/services/create" element={
  <ProtectedRoute requiresUserType="provider">
    <CreateServicePage />
  </ProtectedRoute>
} />
```

---

## 6. Styling (Tailwind CSS)

### Colori Principali
- **Primary**: `blue-600`, `blue-500`, `blue-700`
- **Danger**: `red-600`, `red-50`
- **Success**: `green-600`, `green-50`
- **Warning**: `yellow-600`, `yellow-50`
- **Gray**: `gray-50` → `gray-900`

### Pattern Comuni

```tsx
// Button primario
className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"

// Card
className="bg-white rounded-lg shadow-md border border-gray-200 p-6"

// Form input
className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"

// Error message
className="text-red-600 text-sm mt-1"

// Container centrato
className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"

// Grid responsive
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
```

### Icone (Heroicons)

```tsx
import { PhoneIcon, EnvelopeIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

<PhoneIcon className="h-5 w-5 text-gray-400" />
```

---

## 7. Database Schema

### Tabelle Principali

| Tabella | Descrizione | FK |
|---------|-------------|-----|
| `users` | Utenti base (id, email, user_type) | - |
| `client_profiles` | Profili clienti | user_id → users |
| `provider_profiles` | Profili fornitori | user_id → users |
| `services` | Servizi HSE | provider_id → provider_profiles |
| `bookings` | Prenotazioni | client_id, provider_id, service_id |
| `reviews` | Recensioni | booking_id, reviewer_id, service_id |
| `notifications` | Notifiche | user_id → users |

### Auth Schema

| Tabella | Descrizione |
|---------|-------------|
| `auth.users` | Utenti autenticazione (email, password hash) |
| `auth.sessions` | Sessioni attive |
| `auth.audit_log` | Log eventi auth |

### Funzioni RPC

| Funzione | Parametri | Return |
|----------|-----------|--------|
| `login` | p_email, p_password | { user, access_token } |
| `signup` | p_email, p_password, p_user_type, ... | { user, access_token } |

---

## 8. Authentication Flow

### Login
1. User inserisce email/password in `LoginPage`
2. `signIn()` chiama `supabase.rpc('login', {...})`
3. PostgreSQL valida credenziali, genera JWT
4. JWT salvato in localStorage (`sb-access-token`)
5. `loadUserProfile()` carica profilo da DB
6. User state aggiornato in AuthContext

### Logout
1. `signOut()` chiamato da Header
2. Rimuove token da localStorage
3. Pulisce state user
4. Redirect a home

### Session Check
- All'avvio, AuthContext controlla localStorage
- Se token presente, carica profilo
- Cache profilo per 30 minuti

---

## 9. Environment Variables

### Client-side (VITE_ prefix)
```env
VITE_SUPABASE_URL=http://localhost:3000
VITE_SUPABASE_ANON_KEY=dev-anon-key
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME=BookingHSE-DEV
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_DEBUG=true
```

### Server-side
```env
DATABASE_URL=postgresql://postgres:bookinghse2025@217.194.10.242:5432/bookinghse_dev
JWT_SECRET=bookinghse-dev-jwt-secret-2025-min32chars
```

---

## 10. Import Aliases

| Alias | Path |
|-------|------|
| `@` | `./src` |
| `@components` | `./src/components` |
| `@pages` | `./src/pages` |
| `@types` | `./src/types` |
| `@lib` | `./src/lib` |
| `@utils` | `./src/utils` |

```typescript
// Esempio
import { useAuth } from '@/contexts/AuthContext';
import type { User, Service } from '@types';
import { supabase } from '@lib/postgrest';
```

---

## 11. Convenzioni Naming

| Tipo | Convenzione | Esempio |
|------|-------------|---------|
| Componenti React | PascalCase | `ProviderDetailPage.tsx` |
| Hook | camelCase con `use` | `useFileUpload.ts` |
| Utility | camelCase | `geoSearch.ts` |
| Tipi | PascalCase | `interface ProviderProfile` |
| Costanti | UPPER_SNAKE_CASE | `SERVICE_CATEGORIES` |
| Database columns | snake_case | `created_at`, `user_type` |

---

## 12. Checklist per Agenti

### Prima di iniziare un task:
- [ ] Leggere questo file CLAUDE.md
- [ ] Identificare tutti i file da modificare
- [ ] Verificare i tipi in `src/types/index.ts`
- [ ] Controllare se serve migration database

### Durante il task:
- [ ] Usare i pattern esistenti nel codebase
- [ ] Mantenere la lingua italiana per UI
- [ ] Testare che l'app compili senza errori

### Dopo il task:
- [ ] Verificare che non ci siano errori TypeScript
- [ ] **Aggiornare la sezione Changelog qui sotto**
- [ ] Documentare eventuali nuovi pattern utilizzati

---

## 13. Changelog

> **Agenti: aggiornare questa sezione dopo ogni task completato**

### 2025-11-29
- **Rimosso campo website da ProviderProfile**
  - Files modificati: `ProviderDetailPage.tsx`, `ServiceDetail.tsx`, `Profile.tsx`, `AuthContext.tsx`, `types/index.ts`, `database.types.ts`
  - Migration: `ALTER TABLE provider_profiles DROP COLUMN IF EXISTS website`
  - Note: Il campo website rimane per ClientProfile

### 2025-11-29
- **Setup ambiente sviluppo**
  - Creato database `bookinghse_dev`
  - Installato PostgREST sul server
  - Creato `src/lib/postgrest.ts` come client API
  - Configurato JWT secret matching tra DB e PostgREST

---

## 14. Known Issues / TODO

- [ ] Implementare refresh token automatico
- [ ] Aggiungere validazione IBAN per pagamenti
- [ ] Ottimizzare caricamento immagini profilo

---

## 15. Contatti Sviluppo

- Repository: `bookingHSE-dev`
- Server: 217.194.10.242 (porta SSH: 6001)
- Database dev: `bookinghse_dev`
