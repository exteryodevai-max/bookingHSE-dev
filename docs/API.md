# 📡 API Documentation - BookingHSE

Documentazione completa degli endpoint API per la piattaforma BookingHSE.

## 📋 Indice

1. [Panoramica](#panoramica)
2. [Autenticazione](#autenticazione)
3. [Endpoint Utenti](#endpoint-utenti)
4. [Endpoint Servizi](#endpoint-servizi)
5. [Endpoint Prenotazioni](#endpoint-prenotazioni)
6. [Endpoint Pagamenti](#endpoint-pagamenti)
7. [Endpoint Recensioni](#endpoint-recensioni)
8. [Endpoint Notifiche](#endpoint-notifiche)
9. [Endpoint Storage](#endpoint-storage)
10. [Endpoint Analytics](#endpoint-analytics)
11. [Codici di Errore](#codici-di-errore)
12. [Rate Limiting](#rate-limiting)

## 🌐 Panoramica

### Base URL

BookingHSE utilizza un sistema di configurazione URL centralizzata che si adatta automaticamente all'ambiente:

```
Production: https://bookinghse.com/api
Staging: https://staging.bookinghse.com/api
Development: http://localhost:5173/api
Supabase: https://your-project-id.supabase.co/rest/v1
```

#### Configurazione URL Dinamica

Il sistema rileva automaticamente l'ambiente e costruisce gli URL appropriati:

```typescript
import { APP_CONFIG } from '../config/urls';

// URL API dinamici
const apiUrl = APP_CONFIG.getFullUrl('/api');
// → 'https://bookinghse.com/api' (produzione)
// → 'http://localhost:5173/api' (sviluppo)

// URL di autenticazione
const authUrl = APP_CONFIG.getAuthUrl('callback');
// → 'https://bookinghse.com/auth/callback' (produzione)
// → 'http://localhost:5173/auth/callback' (sviluppo)
```

#### Endpoint di Configurazione

**GET /api/config** - Ottieni configurazione URL corrente
```json
{
  "success": true,
  "data": {
    "baseUrl": "https://bookinghse.com",
    "apiUrl": "https://bookinghse.com/api",
    "environment": "production",
    "authUrls": {
      "login": "https://bookinghse.com/auth/login",
      "signup": "https://bookinghse.com/auth/signup",
      "reset": "https://bookinghse.com/auth/reset-password",
      "callback": "https://bookinghse.com/auth/callback"
    }
  }
}
```

### Formato Risposte
Tutte le risposte API sono in formato JSON:

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Headers Richiesti
```http
Content-Type: application/json
Authorization: Bearer <supabase_jwt_token>
apikey: <supabase_anon_key>
```

## 🔐 Autenticazione

### Sistema di Autenticazione Avanzato

Il sistema di autenticazione di BookingHSE include funzionalità avanzate di debug, retry logic e testing della connessione per garantire massima affidabilità.

#### Funzionalità Debug
- **Logging dettagliato**: Tracciamento completo del processo di autenticazione
- **Retry automatico**: Tentativo automatico in caso di errori temporanei
- **Test connessione**: Verifica dello stato della connessione Supabase
- **Timeout handling**: Gestione timeout per operazioni lente

### Registrazione Utente
```http
POST /auth/signup
```

**Payload:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "userType": "client" | "provider",
  "companyName": "Nome Azienda",
  "firstName": "Mario",
  "lastName": "Rossi",
  "phone": "+39 123 456 7890",
  "acceptTerms": true
}
```

**Risposta:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "user_type": "client",
      "profile": {
        "company_name": "Nome Azienda",
        "first_name": "Mario",
        "last_name": "Rossi"
      }
    }
  },
  "message": "Utente registrato con successo"
}
```

### Login Utente
```http
POST /auth/signin
```

**Payload:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### Test Connessione Supabase
```typescript
// Funzione per testare la connessione
const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    return !error;
  } catch (error) {
    console.error('Test connessione fallito:', error);
    return false;
  }
};
```

### Debug Stato Autenticazione
```typescript
// Funzione di debug per lo stato di autenticazione
const checkAuthState = async () => {
  try {
    console.log('🔍 Controllo stato autenticazione...');
    
    // Test connessione
    const isConnected = await testSupabaseConnection();
    console.log('📡 Connessione Supabase:', isConnected ? '✅' : '❌');
    
    // Verifica sessione
    const { data: { session }, error } = await supabase.auth.getSession();
    console.log('🔑 Sessione corrente:', session ? '✅' : '❌');
    
    if (error) {
      console.error('❌ Errore sessione:', error);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('💥 Errore controllo auth:', error);
    return null;
  }
};
```

### Reset Password
```http
POST /auth/reset-password
```

**Payload:**
```json
{
  "email": "user@example.com"
}
```

### Aggiorna Password
```http
PUT /auth/update-password
```

**Payload:**
```json
{
  "password": "newSecurePassword123"
}
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "user_type": "client" | "provider",
  "full_name": "Mario Rossi"
}
```

**Risposta:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "user_type": "client",
      "email_confirmed_at": null
    },
    "session": {
      "access_token": "jwt_token",
      "refresh_token": "refresh_token",
      "expires_at": 1642234567
    }
  }
}
```

### Login
```http
POST /auth/signin
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### Logout
```http
POST /auth/signout
```

### Refresh Token
```http
POST /auth/refresh
```

**Body:**
```json
{
  "refresh_token": "refresh_token_here"
}
```

## 🗄️ Database Helper Functions

### Funzioni Utenti

#### Crea Utente
```typescript
db.createUser(userData: Database['public']['Tables']['users']['Insert'])
```

**Esempio:**
```typescript
const newUser = await db.createUser({
  id: 'uuid',
  email: 'user@example.com',
  user_type: 'client',
  profile: {
    company_name: 'Azienda SRL',
    first_name: 'Mario',
    last_name: 'Rossi'
  }
});
```

#### Ottieni Utente per ID
```typescript
db.getUserById(id: string)
```

#### Aggiorna Profilo Utente
```typescript
db.updateUserProfile(id: string, profileData: Database['public']['Tables']['users']['Update'])
```

### Funzioni Servizi

#### Crea Servizio
```typescript
db.createService(serviceData: Database['public']['Tables']['services']['Insert'])
```

#### Ottieni Servizi con Filtri
```typescript
db.getServices(filters: {
  category?: string;
  location?: { city?: string };
  price_range?: { min: number; max: number };
  rating_min?: number;
  sort_by?: 'price_asc' | 'price_desc' | 'rating' | 'featured';
  page?: number;
  limit?: number;
  provider_id?: string;
})
```

**Esempio:**
```typescript
const services = await db.getServices({
  category: 'safety_training',
  location: { city: 'Milano' },
  price_range: { min: 100, max: 500 },
  rating_min: 4.0,
  sort_by: 'rating',
  page: 1,
  limit: 10
});
```

#### Ottieni Servizio per ID
```typescript
db.getServiceById(id: string)
```

#### Aggiorna Servizio
```typescript
db.updateService(id: string, serviceData: Database['public']['Tables']['services']['Update'])
```

#### Elimina Servizio
```typescript
db.deleteService(id: string)
```

### Funzioni Prenotazioni

#### Crea Prenotazione
```typescript
db.createBooking(bookingData: Database['public']['Tables']['bookings']['Insert'])
```

#### Ottieni Prenotazioni Utente
```typescript
db.getUserBookings(userId: string, filters?: {
  status?: string;
  date_from?: string;
  date_to?: string;
})
```

#### Aggiorna Stato Prenotazione
```typescript
db.updateBookingStatus(id: string, status: string)}
```

## 🛡️ Sistema di Gestione Errori

BookingHSE implementa un sistema avanzato di gestione errori per tutte le operazioni API, garantendo robustezza e user experience ottimale.

### Funzioni Core

#### parseSupabaseError(error, context?)
Analizza e categorizza errori Supabase per fornire messaggi user-friendly.

**Parametri:**
- `error` (any): L'errore da analizzare
- `context` (string, optional): Contesto dell'operazione per logging

**Ritorna:**
```typescript
interface ParsedSupabaseError {
  code: string;
  message: string;
  userMessage: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  isRetryable: boolean;
  context?: string;
  originalError: any;
}
```

**Esempio:**
```typescript
import { parseSupabaseError } from '../lib/errors';

try {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    const parsedError = parseSupabaseError(error, 'AUTH_SIGNUP');
    console.log('Errore categorizzato:', parsedError);
    // Output: { code: 'AUTH_SIGNUP_FAILED', message: 'Registrazione fallita', ... }
  }
} catch (error) {
  const parsedError = parseSupabaseError(error, 'AUTH_SIGNUP_EXCEPTION');
}
```

#### withErrorHandling(fn, options?)
Wrapper HOF che aggiunge gestione errori e retry automatico a qualsiasi funzione asincrona.

**Parametri:**
- `fn` (Function): Funzione da wrappare
- `options` (ErrorHandlingOptions): Configurazioni opzionali

**Opzioni:**
```typescript
interface ErrorHandlingOptions {
  retryConfig?: RetryConfig | keyof typeof RETRY_CONFIGS;
  errorContext?: string;
  fallbackValue?: any;
  onError?: (error: ParsedSupabaseError) => void;
  onRetry?: (attempt: number, error: any) => void;
}
```

**Esempio:**
```typescript
import { withErrorHandling } from '../lib/errors';

// Operazione database con retry automatico
const createUser = withErrorHandling(
  async (userData: UserData) => {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  {
    retryConfig: 'database',
    errorContext: 'USER_CREATION',
    onError: (error) => console.log('Errore creazione utente:', error),
    onRetry: (attempt) => console.log(`Tentativo ${attempt}...`)
  }
);

// Utilizzo
const newUser = await createUser({
  email: 'test@example.com',
  name: 'Test User'
});
```

#### useSupabaseError()
Hook React per gestione errori consistente nei componenti.

**Ritorna:**
```typescript
interface UseSupabaseErrorReturn {
  handleError: (error: any, context?: string, metadata?: any) => void;
  logError: (error: any, message?: string, context?: string, metadata?: any) => void;
  isLoading: boolean;
  lastError: ParsedSupabaseError | null;
  clearError: () => void;
}
```

**Esempio:**
```typescript
import { useSupabaseError } from '../lib/errors';

function UserProfile() {
  const { handleError, logError, isLoading, clearError } = useSupabaseError();
  const [user, setUser] = useState(null);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        handleError(error, 'USER_PROFILE_LOAD', { userId });
        return;
      }

      setUser(data);
      logError(null, 'Profilo caricato con successo', 'USER_PROFILE_LOAD_SUCCESS');
    } catch (error) {
      handleError(error, 'USER_PROFILE_LOAD_EXCEPTION');
    }
  };

  return (
    <div>
      {isLoading && <div>Caricamento...</div>}
      <button onClick={() => loadProfile('user-id')}>
        Carica Profilo
      </button>
      <button onClick={clearError}>
        Pulisci Errori
      </button>
    </div>
  );
}
```

### Configurazioni Retry

#### createRetryConfig(type)
Crea configurazioni di retry predefinite per diversi tipi di operazioni.

**Tipi disponibili:**
- `'database'`: Per operazioni database (3 tentativi, backoff esponenziale)
- `'network'`: Per errori di rete (5 tentativi, backoff rapido)
- `'auth'`: Per operazioni di autenticazione (2 tentativi, backoff lento)
- `'storage'`: Per operazioni di storage (3 tentativi, backoff medio)

**Esempio:**
```typescript
import { createRetryConfig } from '../lib/errors';

const customRetryConfig = createRetryConfig('database');
// Ritorna: { maxAttempts: 3, baseDelay: 1000, maxDelay: 5000, backoffFactor: 2 }

// Configurazione personalizzata
const criticalOperationConfig = {
  ...createRetryConfig('database'),
  maxAttempts: 5,
  onRetry: (attempt, error) => {
    console.log(`Tentativo critico ${attempt}:`, error.message);
  }
};
```

### Utility Functions

#### isRetryableError(error)
Determina se un errore può essere risolto con un retry.

**Parametri:**
- `error` (any): L'errore da verificare

**Ritorna:** `boolean`

**Esempio:**
```typescript
import { isRetryableError } from '../lib/errors';

const handleOperation = async () => {
  try {
    await riskyOperation();
  } catch (error) {
    if (isRetryableError(error)) {
      console.log('Errore recuperabile, implemento retry...');
      // Logica di retry
    } else {
      console.log('Errore permanente, gestisco fallback...');
      // Gestione errore definitivo
    }
  }
};
```

#### logSupabaseError(error, context?, metadata?)
Funzione di logging strutturato per errori Supabase.

**Parametri:**
- `error` (any): L'errore da loggare
- `context` (string, optional): Contesto dell'operazione
- `metadata` (object, optional): Metadati aggiuntivi

**Esempio:**
```typescript
import { logSupabaseError } from '../lib/errors';

const processPayment = async (paymentData) => {
  try {
    const result = await stripeAPI.charge(paymentData);
    
    logSupabaseError(null, 'PAYMENT_SUCCESS', {
      amount: paymentData.amount,
      transactionId: result.id
    });
    
    return result;
  } catch (error) {
    logSupabaseError(error, 'PAYMENT_FAILED', {
      amount: paymentData.amount,
      userId: paymentData.userId
    });
    throw error;
  }
};
```

### Error Categories e Severity

#### ERROR_CATEGORIES
Enum delle categorie di errori supportate:

```typescript
export enum ERROR_CATEGORIES {
  AUTH = 'AUTH',
  DATABASE = 'DATABASE', 
  NETWORK = 'NETWORK',
  STORAGE = 'STORAGE',
  VALIDATION = 'VALIDATION',
  PERMISSION = 'PERMISSION',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN'
}
```

#### ERROR_SEVERITY
Enum dei livelli di gravità degli errori:

```typescript
export enum ERROR_SEVERITY {
  LOW = 'LOW',       // Errori informativi
  MEDIUM = 'MEDIUM', // Errori che richiedono attenzione
  HIGH = 'HIGH',     // Errori critici
  CRITICAL = 'CRITICAL' // Errori che bloccano l'applicazione
}
```

### Esempi di Integrazione API

#### Endpoint con Gestione Errori Completa

```typescript
// Hook personalizzato per gestione bookings
export function useBookings() {
  const { handleError, logError } = useSupabaseError();

  const createBooking = withErrorHandling(
    async (bookingData: CreateBookingData) => {
      // Validazione input
      if (!bookingData.serviceId || !bookingData.providerId) {
        throw new Error('VALIDATION_REQUIRED_FIELDS');
      }

      // Creazione booking
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          ...bookingData,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select(`
          *,
          service:services(*),
          provider:users!provider_id(*),
          client:users!client_id(*)
        `)
        .single();

      if (error) throw error;

      // Log successo
      logError(null, 'Booking creato con successo', 'BOOKING_CREATE_SUCCESS', {
        bookingId: data.id,
        serviceId: data.service_id
      });

      return data;
    },
    {
      retryConfig: 'database',
      errorContext: 'BOOKING_CREATION',
      onError: (error) => {
        handleError(error.originalError, 'BOOKING_CREATE_FAILED', {
          serviceId: bookingData?.serviceId
        });
      }
    }
  );

  const updateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) {
        handleError(error, 'BOOKING_STATUS_UPDATE_FAILED', { bookingId, status });
        return { success: false };
      }

      logError(null, 'Status booking aggiornato', 'BOOKING_STATUS_UPDATE_SUCCESS', {
        bookingId,
        newStatus: status
      });

      return { success: true, data };
    } catch (error) {
      handleError(error, 'BOOKING_STATUS_UPDATE_EXCEPTION', { bookingId });
      return { success: false };
    }
  };

  return {
    createBooking,
    updateBookingStatus
  };
}
```

#### Gestione Errori per Upload File

```typescript
export function useFileUpload() {
  const { handleError, logError } = useSupabaseError();

  const uploadServiceImage = withErrorHandling(
    async (file: File, serviceId: string) => {
      // Validazione file
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('FILE_TOO_LARGE');
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('INVALID_FILE_TYPE');
      }

      // Upload file
      const fileName = `${serviceId}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('service-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Ottieni URL pubblico
      const { data: { publicUrl } } = supabase.storage
        .from('service-images')
        .getPublicUrl(fileName);

      logError(null, 'Immagine servizio caricata', 'SERVICE_IMAGE_UPLOAD_SUCCESS', {
        fileName,
        fileSize: file.size,
        serviceId
      });

      return { fileName, publicUrl };
    },
    {
      retryConfig: 'storage',
      errorContext: 'SERVICE_IMAGE_UPLOAD',
      onError: (error) => {
        if (error.originalError?.message === 'FILE_TOO_LARGE') {
          handleError(error.originalError, 'STORAGE_FILE_TOO_LARGE');
        } else if (error.originalError?.message === 'INVALID_FILE_TYPE') {
          handleError(error.originalError, 'STORAGE_INVALID_FORMAT');
        } else {
          handleError(error.originalError, 'STORAGE_UPLOAD_FAILED');
        }
      }
    }
  );

  return { uploadServiceImage };
}
```

## 📧 Endpoint Contatti

### Invia Email di Contatto
```http
POST /api/contact
```

**Body:**
```json
{
  "name": "Mario Rossi",
  "email": "mario@esempio.com",
  "subject": "Richiesta informazioni servizi",
  "message": "Salve, sono interessato ai vostri servizi di sicurezza...",
  "category": "general" | "support" | "sales" | "partnership"
}
```

**Risposta Successo:**
```json
{
  "success": true,
  "data": {
    "messageId": "msg_xxxxxxxxxxxxxxxxxxxxxxxx",
    "to": "info@bookinghse.com",
    "subject": "Richiesta informazioni servizi",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "message": "Email inviata con successo"
}
```

**Risposta Errore:**
```json
{
  "success": false,
  "error": {
    "code": "CONTACT_VALIDATION_ERROR",
    "message": "Il campo email è obbligatorio",
    "field": "email"
  }
}
```

**Codici di Errore:**
- `CONTACT_VALIDATION_ERROR` - Validazione fallita
- `CONTACT_EMAIL_FAILED` - Errore invio email
- `CONTACT_RATE_LIMITED` - Troppe richieste

**Rate Limiting:** 5 richieste per minuto per IP

## 👥 Endpoint Utenti

### Ottieni Profilo Utente
```http
GET /users/profile
```

**Risposta:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "user_type": "client",
    "full_name": "Mario Rossi",
    "avatar_url": "https://...",
    "created_at": "2024-01-01T00:00:00Z",
    "profile": {
      "company_name": "Acme Corp",
      "vat_number": "IT12345678901",
      "phone": "+39 123 456 7890"
    }
  }
}
```

### Aggiorna Profilo
```http
PUT /users/profile
```

**Body:**
```json
{
  "full_name": "Mario Rossi",
  "phone": "+39 123 456 7890",
  "avatar_url": "https://..."
}
```

### Ottieni Profilo Client
```http
GET /users/client-profile
```

### Aggiorna Profilo Client
```http
PUT /users/client-profile
```

**Body:**
```json
{
  "company_name": "Acme Corporation",
  "vat_number": "IT12345678901",
  "industry": "manufacturing",
  "employee_count": 150,
  "description": "Azienda leader nel settore manifatturiero",
  "website": "https://acme.com",
  "address": {
    "street": "Via Roma 123",
    "city": "Milano",
    "postal_code": "20100",
    "country": "IT",
    "latitude": 45.4642,
    "longitude": 9.1900
  }
}
```

### Ottieni Profilo Provider
```http
GET /users/provider-profile
```

### Aggiorna Profilo Provider
```http
PUT /users/provider-profile
```

**Body:**
```json
{
  "company_name": "HSE Solutions SRL",
  "vat_number": "IT98765432109",
  "specializations": ["safety_training", "risk_assessment"],
  "years_experience": 10,
  "description": "Esperti in sicurezza sul lavoro",
  "hourly_rate_min": 50.00,
  "hourly_rate_max": 150.00,
  "service_radius_km": 100,
  "certifications": [
    {
      "name": "ISO 45001 Lead Auditor",
      "issuer": "IRCA",
      "issue_date": "2023-01-15",
      "expiry_date": "2026-01-15",
      "document_url": "https://..."
    }
  ]
}
```

## 🛠️ Endpoint Servizi

### Lista Servizi
```http
GET /services
```

**Query Parameters:**
- `category` (string): Filtra per categoria
- `location` (string): Filtra per località
- `min_price` (number): Prezzo minimo
- `max_price` (number): Prezzo massimo
- `provider_id` (uuid): Filtra per provider
- `page` (number): Numero pagina (default: 1)
- `limit` (number): Elementi per pagina (default: 20)
- `sort` (string): Ordinamento (price_asc, price_desc, rating_desc, created_desc)

**Esempio:**
```http
GET /services?category=safety_training&location=Milano&min_price=50&max_price=200&page=1&limit=10
```

**Risposta:**
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "id": "uuid",
        "title": "Corso Sicurezza Cantieri",
        "description": "Formazione completa per la sicurezza nei cantieri",
        "category": "safety_training",
        "price_type": "per_hour",
        "price_amount": 75.00,
        "duration_hours": 8,
        "location": "Milano",
        "is_remote": false,
        "provider": {
          "id": "uuid",
          "company_name": "HSE Solutions",
          "rating": 4.8,
          "reviews_count": 156
        },
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "pages": 5
    }
  }
}
```

### Dettaglio Servizio
```http
GET /services/:id
```

### Crea Servizio (Provider)
```http
POST /services
```

**Body:**
```json
{
  "title": "Valutazione Rischi Aziendali",
  "description": "Analisi completa dei rischi presenti in azienda",
  "category_id": "uuid",
  "price_type": "fixed",
  "price_amount": 500.00,
  "duration_hours": 16,
  "location": "Milano",
  "is_remote": false,
  "requirements": "Accesso a tutti i reparti aziendali",
  "deliverables": "Documento di valutazione rischi completo"
}
```

### Aggiorna Servizio
```http
PUT /services/:id
```

### Elimina Servizio
```http
DELETE /services/:id
```

### Categorie Servizi
```http
GET /services/categories
```

## 📅 Endpoint Prenotazioni

### Lista Prenotazioni
```http
GET /bookings
```

**Query Parameters:**
- `status` (string): pending, confirmed, in_progress, completed, cancelled
- `client_id` (uuid): Filtra per cliente
- `provider_id` (uuid): Filtra per provider
- `date_from` (date): Data inizio periodo
- `date_to` (date): Data fine periodo

### Dettaglio Prenotazione
```http
GET /bookings/:id
```

### Crea Prenotazione
```http
POST /bookings
```

**Body:**
```json
{
  "service_id": "uuid",
  "provider_id": "uuid",
  "scheduled_date": "2024-02-15",
  "scheduled_time": "09:00",
  "duration_hours": 8,
  "location": "Via Roma 123, Milano",
  "notes": "Richiesta accesso anticipato alle 8:30",
  "items": [
    {
      "service_id": "uuid",
      "quantity": 1,
      "unit_price": 500.00,
      "notes": "Valutazione completa"
    }
  ]
}
```

### Aggiorna Status Prenotazione
```http
PUT /bookings/:id/status
```

**Body:**
```json
{
  "status": "confirmed",
  "notes": "Confermata disponibilità per la data richiesta"
}
```

### Cancella Prenotazione
```http
DELETE /bookings/:id
```

## 💳 Endpoint Pagamenti

### Crea Payment Intent
```http
POST /payments/create-intent
```

**Body:**
```json
{
  "booking_id": "uuid",
  "amount": 500.00,
  "currency": "EUR",
  "payment_method_types": ["card"]
}
```

**Risposta:**
```json
{
  "success": true,
  "data": {
    "client_secret": "pi_xxx_secret_xxx",
    "payment_intent_id": "pi_xxx",
    "amount": 50000,
    "currency": "eur"
  }
}
```

### Conferma Pagamento
```http
POST /payments/confirm
```

### Storico Pagamenti
```http
GET /payments
```

### Rimborso
```http
POST /payments/:id/refund
```

## ⭐ Endpoint Recensioni

### Lista Recensioni
```http
GET /reviews
```

**Query Parameters:**
- `provider_id` (uuid): Recensioni per provider
- `client_id` (uuid): Recensioni del cliente
- `service_id` (uuid): Recensioni per servizio
- `rating` (number): Filtra per rating (1-5)

### Crea Recensione
```http
POST /reviews
```

**Body:**
```json
{
  "booking_id": "uuid",
  "provider_id": "uuid",
  "rating": 5,
  "title": "Servizio eccellente",
  "comment": "Professionali e competenti, altamente raccomandati",
  "would_recommend": true
}
```

### Risposta a Recensione (Provider)
```http
POST /reviews/:id/response
```

**Body:**
```json
{
  "response": "Grazie per la recensione positiva!"
}
```

## 🔔 Endpoint Notifiche

### Lista Notifiche
```http
GET /notifications
```

**Query Parameters:**
- `unread_only` (boolean): Solo non lette
- `type` (string): Tipo notifica
- `limit` (number): Numero massimo

### Marca come Letta
```http
PUT /notifications/:id/read
```

### Marca Tutte come Lette
```http
PUT /notifications/mark-all-read
```

### Elimina Notifica
```http
DELETE /notifications/:id
```

## 📁 Endpoint Storage

### Upload File
```http
POST /storage/:bucket/upload
```

**Headers:**
```http
Content-Type: multipart/form-data
Authorization: Bearer <jwt_token>
```

**Payload (FormData):**
```javascript
const formData = new FormData();
formData.append('file', fileObject);
formData.append('folder', 'certificates'); // Opzionale
formData.append('generateThumbnail', 'true'); // Per immagini
```

**Risposta:**
```json
{
  "success": true,
  "data": {
    "path": "user-id/certificates/document.pdf",
    "url": "https://project.supabase.co/storage/v1/object/public/certifications/user-id/certificates/document.pdf",
    "size": 2048576,
    "mimeType": "application/pdf",
    "thumbnailUrl": null
  },
  "message": "File caricato con successo"
}
```

### Lista File
```http
GET /storage/:bucket/files
```

**Query Parameters:**
- `folder` (string): Cartella specifica
- `limit` (number): Numero massimo file (default: 50)
- `offset` (number): Offset per paginazione
- `sortBy` (string): Campo ordinamento (name, created_at, size)
- `order` (string): Direzione ordinamento (asc, desc)

**Esempio:**
```http
GET /storage/certifications/files?folder=iso-docs&limit=20&sortBy=created_at&order=desc
```

**Risposta:**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "name": "iso-9001-certificate.pdf",
        "path": "user-id/iso-docs/iso-9001-certificate.pdf",
        "size": 1024000,
        "mimeType": "application/pdf",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z",
        "url": "https://..."
      }
    ],
    "total": 15,
    "hasMore": true
  }
}
```

### Download File
```http
GET /storage/:bucket/download/:path
```

**Per file pubblici:**
```http
GET /storage/service-images/download/user-id/services/image.jpg
```

**Per file privati (genera signed URL):**
```http
GET /storage/certifications/download/user-id/docs/certificate.pdf?expiresIn=3600
```

**Risposta:**
```json
{
  "success": true,
  "data": {
    "url": "https://project.supabase.co/storage/v1/object/sign/certifications/user-id/docs/certificate.pdf?token=...",
    "expiresAt": "2024-01-15T11:30:00Z"
  }
}
```

### Elimina File
```http
DELETE /storage/:bucket/files/:path
```

**Esempio:**
```http
DELETE /storage/certifications/files/user-id/docs/old-certificate.pdf
```

**Risposta:**
```json
{
  "success": true,
  "message": "File eliminato con successo"
}
```

### Informazioni Storage Utente
```http
GET /storage/user/usage
```

**Risposta:**
```json
{
  "success": true,
  "data": {
    "totalUsage": 52428800, // bytes
    "buckets": {
      "certifications": {
        "fileCount": 12,
        "totalSize": 41943040
      },
      "profile-images": {
        "fileCount": 2,
        "totalSize": 1048576
      },
      "service-images": {
        "fileCount": 8,
        "totalSize": 9437184
      }
    },
    "limits": {
      "maxTotalSize": 1073741824, // 1GB
      "maxFileSize": 10485760 // 10MB per file
    }
  }
}
```

### Bucket Configurati

| Bucket | Tipo | Max Size | Formati | Endpoint Base |
|--------|------|----------|---------|---------------|
| `service-images` | Pubblico | 5MB | JPG, PNG, WebP | `/storage/service-images` |
| `profile-images` | Pubblico | 2MB | JPG, PNG, WebP | `/storage/profile-images` |
| `certifications` | Privato | 10MB | PDF, JPG, PNG | `/storage/certifications` |
| `temp-uploads` | Privato | 5MB | Tutti | `/storage/temp-uploads` |

### Validazioni File

#### Tipi MIME Supportati
```json
{
  "service-images": ["image/jpeg", "image/png", "image/webp", "image/avif"],
  "profile-images": ["image/jpeg", "image/png", "image/webp"],
  "certifications": ["application/pdf", "image/jpeg", "image/png"],
  "temp-uploads": ["*"]
}
```

#### Dimensioni Massime
```json
{
  "service-images": 5242880,    // 5MB
  "profile-images": 2097152,    // 2MB
  "certifications": 10485760,   // 10MB
  "temp-uploads": 5242880       // 5MB
}
```

### Errori Storage

| Codice | Messaggio | Descrizione |
|--------|-----------|-------------|
| `STORAGE_001` | File too large | File supera dimensione massima |
| `STORAGE_002` | Invalid file type | Tipo MIME non supportato |
| `STORAGE_003` | Bucket not found | Bucket non esistente |
| `STORAGE_004` | Access denied | Permessi insufficienti |
| `STORAGE_005` | File not found | File non trovato |
| `STORAGE_006` | Upload failed | Errore durante upload |
| `STORAGE_007` | Storage quota exceeded | Quota storage superata |

### Esempi di Utilizzo

#### Upload Certificazione
```javascript
const uploadCertification = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', 'iso-certifications');
  
  const response = await fetch('/api/storage/certifications/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return response.json();
};
```

#### Download File Privato
```javascript
const downloadFile = async (filePath) => {
  const response = await fetch(`/api/storage/certifications/download/${filePath}?expiresIn=3600`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const { data } = await response.json();
  window.open(data.url, '_blank');
};
```

#### Lista File con Paginazione
```javascript
const getFiles = async (page = 1, limit = 20) => {
  const response = await fetch(`/api/storage/certifications/files?limit=${limit}&offset=${(page-1)*limit}&sortBy=created_at&order=desc`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.json();
};
```

## 📊 Endpoint Analytics

### Dashboard Provider
```http
GET /analytics/provider/dashboard
```

**Risposta:**
```json
{
  "success": true,
  "data": {
    "total_bookings": 156,
    "total_revenue": 45000.00,
    "average_rating": 4.8,
    "completion_rate": 0.95,
    "monthly_stats": [
      {
        "month": "2024-01",
        "bookings": 12,
        "revenue": 3600.00
      }
    ],
    "performance_metrics": {
      "response_time_avg": 2.3,
      "customer_satisfaction": 4.7,
      "repeat_customers": 0.65
    }
  }
}
```

### Dashboard Client
```http
GET /analytics/client/dashboard
```

**Risposta:**
```json
{
  "success": true,
  "data": {
    "total_spent": 12500.00,
    "total_bookings": 45,
    "favorite_providers": [
      {
        "provider_id": "uuid",
        "company_name": "HSE Solutions",
        "bookings_count": 8
      }
    ],
    "spending_trends": [
      {
        "month": "2024-01",
        "amount": 2100.00,
        "bookings": 3
      }
    ]
  }
}
```

### Metriche Real-time
```http
GET /analytics/realtime-metrics
```

**Risposta:**
```json
{
  "success": true,
  "data": {
    "active_users": 127,
    "ongoing_bookings": 23,
    "pending_payments": 8,
    "system_health": {
      "database": "healthy",
      "storage": "healthy",
      "auth": "healthy"
    }
  }
}
```

## 🌍 Endpoint Geolocalizzazione

### Ricerca Servizi per Posizione
```http
GET /services/nearby
```

**Query Parameters:**
- `lat` (number): Latitudine
- `lng` (number): Longitudine  
- `radius` (number): Raggio in km (default: 50)
- `category` (string): Categoria servizio

**Risposta:**
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "id": "uuid",
        "title": "Valutazione Rischi",
        "provider": {
          "company_name": "HSE Solutions",
          "distance_km": 12.5
        },
        "location": {
          "address": "Via Roma 123, Milano",
          "coordinates": [45.4642, 9.1900]
        }
      }
    ],
    "total_count": 15,
    "search_center": [45.4642, 9.1900],
    "search_radius": 50
  }
}
```

### Geocoding Indirizzo
```http
POST /geocoding/address
```

**Payload:**
```json
{
  "address": "Via Roma 123, Milano, Italia"
}
```

**Risposta:**
```json
{
  "success": true,
  "data": {
    "coordinates": [45.4642, 9.1900],
    "formatted_address": "Via Roma, 123, 20100 Milano MI, Italia",
    "components": {
      "street": "Via Roma",
      "number": "123",
      "city": "Milano",
      "postal_code": "20100",
      "country": "Italia"
    }
  }
}
```

## 🔔 Endpoint Notifiche Real-time

### Sottoscrizione WebSocket
```javascript
// Connessione WebSocket per notifiche real-time
const ws = new WebSocket('wss://your-project-id.supabase.co/realtime/v1/websocket');

// Sottoscrizione a notifiche utente
const subscription = supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    console.log('Nuova notifica:', payload.new);
    showNotification(payload.new);
  })
  .subscribe();
```

### Push Notifications
```http
POST /notifications/push
```

**Payload:**
```json
{
  "user_id": "uuid",
  "title": "Nuova prenotazione",
  "message": "Hai ricevuto una nuova richiesta di prenotazione",
  "type": "booking_request",
  "data": {
    "booking_id": "uuid",
    "action_url": "/bookings/uuid"
  }
}
```

### Centro Notifiche
```http
GET /notifications/center
```

**Query Parameters:**
- `unread_only` (boolean): Solo non lette
- `type` (string): Tipo notifica
- `limit` (number): Numero massimo
- `offset` (number): Offset per paginazione

**Risposta:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "title": "Prenotazione confermata",
        "message": "La tua prenotazione è stata confermata",
        "type": "booking_confirmed",
        "read": false,
        "created_at": "2024-01-15T10:30:00Z",
        "data": {
          "booking_id": "uuid"
        }
      }
    ],
    "unread_count": 5,
    "total_count": 23
  }
}
```

## ❌ Codici di Errore

### Codici HTTP Standard
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Unprocessable Entity
- `429` - Too Many Requests
- `500` - Internal Server Error

### Formato Errori
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "I dati forniti non sono validi",
    "details": {
      "email": ["Email già in uso"],
      "password": ["Password troppo debole"]
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Codici Errore Personalizzati
- `AUTH_REQUIRED` - Autenticazione richiesta
- `INVALID_TOKEN` - Token non valido
- `INSUFFICIENT_PERMISSIONS` - Permessi insufficienti
- `RESOURCE_NOT_FOUND` - Risorsa non trovata
- `VALIDATION_ERROR` - Errore di validazione
- `PAYMENT_FAILED` - Pagamento fallito
- `BOOKING_CONFLICT` - Conflitto prenotazione
- `RATE_LIMIT_EXCEEDED` - Limite richieste superato

## 🚦 Rate Limiting

### Limiti Standard
- **Autenticazione**: 5 tentativi/minuto per IP
- **API Generali**: 100 richieste/minuto per utente
- **Upload File**: 10 upload/minuto per utente
- **Pagamenti**: 20 richieste/minuto per utente

### Headers Risposta
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642234567
```

### Errore Rate Limit
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Troppe richieste. Riprova tra 60 secondi.",
    "retry_after": 60
  }
}
```

## 🔧 Esempi di Utilizzo

### JavaScript/TypeScript
```javascript
// Configurazione client
const apiClient = {
  baseURL: 'https://your-project-id.supabase.co/rest/v1',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'your_supabase_anon_key',
    'Authorization': `Bearer ${userToken}`
  }
};

// Esempio: Ricerca servizi
async function searchServices(filters) {
  const params = new URLSearchParams(filters);
  const response = await fetch(`${apiClient.baseURL}/services?${params}`, {
    headers: apiClient.headers
  });
  return response.json();
}

// Esempio: Crea prenotazione
async function createBooking(bookingData) {
  const response = await fetch(`${apiClient.baseURL}/bookings`, {
    method: 'POST',
    headers: apiClient.headers,
    body: JSON.stringify(bookingData)
  });
  return response.json();
}
```

### cURL
```bash
# Ricerca servizi
curl -X GET "https://your-project-id.supabase.co/rest/v1/services?category=safety_training" \
  -H "apikey: your_supabase_anon_key" \
  -H "Authorization: Bearer your_jwt_token"

# Crea prenotazione
curl -X POST "https://your-project-id.supabase.co/rest/v1/bookings" \
  -H "Content-Type: application/json" \
  -H "apikey: your_supabase_anon_key" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "service_id": "uuid",
    "scheduled_date": "2024-02-15",
    "notes": "Richiesta urgente"
  }'
```

## 📚 Risorse Aggiuntive

- [Documentazione Supabase](https://supabase.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Postman Collection](./postman_collection.json)
- [OpenAPI Specification](./openapi.yaml)

---

**📝 Nota**: Questa documentazione è in continuo aggiornamento. Per la versione più recente, consulta sempre il repository del progetto.