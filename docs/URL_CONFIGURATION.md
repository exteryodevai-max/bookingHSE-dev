# 🌐 Guida Configurazione URL Centralizzata - BookingHSE

Guida completa al sistema di configurazione URL centralizzata di BookingHSE, progettato per gestire automaticamente domini e percorsi attraverso diversi ambienti.

## 📋 Indice

1. [Panoramica](#panoramica)
2. [Struttura Configurazione](#struttura-configurazione)
3. [Funzioni Utility](#funzioni-utility)
4. [Utilizzo Pratico](#utilizzo-pratico)
5. [Configurazione per Ambiente](#configurazione-per-ambiente)
6. [Migrazione dal Sistema Precedente](#migrazione-dal-sistema-precedente)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## 🎯 Panoramica

Il sistema di configurazione URL centralizzata di BookingHSE fornisce:

- **🔄 Adattamento automatico** all'ambiente (produzione, staging, sviluppo)
- **🎯 Costruzione dinamica** degli URL basata su `VITE_APP_URL`
- **🔧 Utility functions** per generazione URL consistente
- **🔒 Sicurezza** attraverso validazione domini
- **📱 Multi-ambiente** con supporto per produzione, staging e locale
- **🔄 Compatibilità** con il codice esistente

## 🏗️ Struttura Configurazione

### File Principale: `src/config/urls.ts`

```typescript
// Configurazione domini per ambiente
const APP_CONFIG = {
  domains: {
    production: 'bookinghse.com',
    staging: 'staging.bookinghse.com',
    local: 'localhost:5173'
  },
  
  // URL dinamico basato su VITE_APP_URL
  APP_URL: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
  
  // Percorsi di autenticazione
  authPaths: {
    login: '/auth/login',
    signup: '/auth/signup',
    reset: '/auth/reset-password',
    callback: '/auth/callback'
  },
  
  // Funzioni utility (vedi sezione dedicata)
  getFullUrl: (path: string) => string,
  getAuthUrl: (type: AuthType, token?: string) => string,
  getCurrentDomain: () => string,
  isProduction: () => boolean
};
```

### Tipi TypeScript

```typescript
type AuthType = 'login' | 'signup' | 'reset' | 'callback';

interface AppConfig {
  domains: {
    production: string;
    staging: string;
    local: string;
  };
  APP_URL: string;
  authPaths: Record<AuthType, string>;
  getFullUrl: (path: string) => string;
  getAuthUrl: (type: AuthType, token?: string) => string;
  getCurrentDomain: () => string;
  isProduction: () => boolean;
}
```

## 🛠️ Funzioni Utility

### `getFullUrl(path: string): string`

Costruisce URL completi combinando il dominio base con il percorso specificato.

```typescript
// Esempi per diversi ambienti
APP_CONFIG.getFullUrl('/dashboard')
// Produzione: 'https://bookinghse.com/dashboard'
// Staging: 'https://staging.bookinghse.com/dashboard'
// Locale: 'http://localhost:5173/dashboard'

APP_CONFIG.getFullUrl('/api/users')
// Produzione: 'https://bookinghse.com/api/users'
// Locale: 'http://localhost:5173/api/users'
```

**Caratteristiche:**
- ✅ Gestisce automaticamente protocollo (https/http)
- ✅ Rimuove slash duplicati
- ✅ Valida il formato del percorso
- ✅ Supporta percorsi assoluti e relativi

### `getAuthUrl(type: AuthType, token?: string): string`

Genera URL di autenticazione con supporto per token opzionali.

```typescript
// URL di base
APP_CONFIG.getAuthUrl('login')
// → 'https://bookinghse.com/auth/login'

APP_CONFIG.getAuthUrl('signup')
// → 'https://bookinghse.com/auth/signup'

// URL con token
APP_CONFIG.getAuthUrl('reset', 'abc123xyz')
// → 'https://bookinghse.com/auth/reset-password?token=abc123xyz'

APP_CONFIG.getAuthUrl('callback', 'refresh_token_here')
// → 'https://bookinghse.com/auth/callback?token=refresh_token_here'
```

**Caratteristiche:**
- ✅ Validazione tipo di autenticazione
- ✅ Encoding automatico dei token
- ✅ Gestione parametri query
- ✅ Supporto per token di reset e callback

### `getCurrentDomain(): string`

Rileva il dominio attuale basandosi su `VITE_APP_URL`.

```typescript
// Esempi di rilevamento
APP_CONFIG.getCurrentDomain()
// Se VITE_APP_URL = 'https://bookinghse.com' → 'bookinghse.com'
// Se VITE_APP_URL = 'https://staging.bookinghse.com' → 'staging.bookinghse.com'
// Se VITE_APP_URL = 'http://localhost:5173' → 'localhost:5173'
```

**Caratteristiche:**
- ✅ Parsing automatico dell'URL
- ✅ Rimozione protocollo
- ✅ Gestione porte personalizzate
- ✅ Fallback per configurazioni non valide

### `isProduction(): boolean`

Verifica se l'applicazione è in esecuzione in ambiente di produzione.

```typescript
// Controllo ambiente
if (APP_CONFIG.isProduction()) {
  // Logica specifica per produzione
  enableAnalytics();
  disableDebugMode();
} else {
  // Logica per sviluppo/staging
  enableDebugMode();
  showDeveloperTools();
}

// Esempi di risultato
// bookinghse.com → true
// staging.bookinghse.com → false
// localhost:5173 → false
```

## 💼 Utilizzo Pratico

### Nei Componenti React

```typescript
import { APP_CONFIG } from '../config/urls';

function AuthComponent() {
  const handlePasswordReset = async (email: string) => {
    // Genera URL di reset dinamico
    const resetUrl = APP_CONFIG.getAuthUrl('reset');
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetUrl
    });
    
    if (!error) {
      toast.success(`Email di reset inviata! Controlla la tua casella.`);
    }
  };

  const redirectToLogin = () => {
    // Redirect dinamico
    window.location.href = APP_CONFIG.getAuthUrl('login');
  };

  return (
    <div>
      <button onClick={() => handlePasswordReset('user@example.com')}>
        Reset Password
      </button>
      <button onClick={redirectToLogin}>
        Vai al Login
      </button>
    </div>
  );
}
```

### Nei Context e Hook

```typescript
import { APP_CONFIG } from '../config/urls';

export function useAuth() {
  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: APP_CONFIG.getAuthUrl('callback')
      }
    });
    
    return { data, error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: APP_CONFIG.getAuthUrl('reset')
    });
    
    return { error };
  };

  return { signUp, resetPassword };
}
```

### Nelle API Routes

```typescript
import { APP_CONFIG } from '../config/urls';

export async function POST(request: Request) {
  const { email } = await request.json();
  
  // Genera URL di callback dinamico
  const callbackUrl = APP_CONFIG.getAuthUrl('callback');
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: callbackUrl
  });
  
  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  
  return Response.json({ 
    success: true,
    message: 'Email di reset inviata',
    redirectUrl: callbackUrl
  });
}
```

## 🌍 Configurazione per Ambiente

### Produzione

**Variabili Ambiente:**
```env
VITE_APP_URL=https://bookinghse.com
NODE_ENV=production
```

**Configurazione Supabase:**
```
Site URL: https://bookinghse.com
Redirect URLs:
- https://bookinghse.com/auth/callback
- https://bookinghse.com/auth/login
- https://bookinghse.com/auth/signup
- https://bookinghse.com/auth/reset-password
```

**Risultati URL:**
```typescript
APP_CONFIG.getFullUrl('/dashboard') // → 'https://bookinghse.com/dashboard'
APP_CONFIG.getAuthUrl('reset') // → 'https://bookinghse.com/auth/reset-password'
APP_CONFIG.isProduction() // → true
```

### Staging

**Variabili Ambiente:**
```env
VITE_APP_URL=https://staging.bookinghse.com
NODE_ENV=development
```

**Configurazione Supabase:**
```
Site URL: https://staging.bookinghse.com
Redirect URLs:
- https://staging.bookinghse.com/auth/callback
- https://staging.bookinghse.com/auth/login
- https://staging.bookinghse.com/auth/signup
- https://staging.bookinghse.com/auth/reset-password
```

**Risultati URL:**
```typescript
APP_CONFIG.getFullUrl('/dashboard') // → 'https://staging.bookinghse.com/dashboard'
APP_CONFIG.getAuthUrl('reset') // → 'https://staging.bookinghse.com/auth/reset-password'
APP_CONFIG.isProduction() // → false
```

### Sviluppo Locale

**Variabili Ambiente:**
```env
VITE_APP_URL=http://localhost:5173
NODE_ENV=development
```

**Configurazione Supabase:**
```
Site URL: http://localhost:5173
Redirect URLs:
- http://localhost:5173/auth/callback
- http://localhost:5173/auth/login
- http://localhost:5173/auth/signup
- http://localhost:5173/auth/reset-password
```

**Risultati URL:**
```typescript
APP_CONFIG.getFullUrl('/dashboard') // → 'http://localhost:5173/dashboard'
APP_CONFIG.getAuthUrl('reset') // → 'http://localhost:5173/auth/reset-password'
APP_CONFIG.isProduction() // → false
```

## 🔄 Migrazione dal Sistema Precedente

### Codice Precedente (Deprecato)

```typescript
// ❌ Vecchio approccio - statico e non flessibile
import { 
  LOGIN_URL, 
  SIGNUP_URL, 
  PASSWORD_RESET_URL 
} from '../config/urls';

const resetUrl = PASSWORD_RESET_URL; // URL fisso
const loginUrl = LOGIN_URL; // URL fisso
```

### Nuovo Codice (Raccomandato)

```typescript
// ✅ Nuovo approccio - dinamico e flessibile
import { APP_CONFIG } from '../config/urls';

const resetUrl = APP_CONFIG.getAuthUrl('reset'); // URL dinamico
const loginUrl = APP_CONFIG.getAuthUrl('login'); // URL dinamico
```

### Strategia di Migrazione

1. **Fase 1 - Compatibilità**: Il sistema mantiene gli export legacy
2. **Fase 2 - Migrazione graduale**: Aggiorna i file uno alla volta
3. **Fase 3 - Cleanup**: Rimuovi gli import legacy quando non più utilizzati

### Script di Migrazione

```bash
# Trova tutti i file che usano il vecchio sistema
grep -r "PASSWORD_RESET_URL\|LOGIN_URL\|SIGNUP_URL" src/

# Sostituisci gradualmente con il nuovo sistema
# Esempio per AuthContext.tsx (già completato)
```

## 📋 Best Practices

### ✅ Raccomandazioni

1. **Usa sempre APP_CONFIG** per nuovi sviluppi
```typescript
// ✅ Corretto
const url = APP_CONFIG.getAuthUrl('reset', token);

// ❌ Evita
const url = `${window.location.origin}/auth/reset-password?token=${token}`;
```

2. **Valida i token prima dell'uso**
```typescript
// ✅ Corretto
const resetUrl = token 
  ? APP_CONFIG.getAuthUrl('reset', token)
  : APP_CONFIG.getAuthUrl('reset');

// ❌ Evita
const resetUrl = APP_CONFIG.getAuthUrl('reset', token); // token potrebbe essere undefined
```

3. **Usa controlli ambiente per logica condizionale**
```typescript
// ✅ Corretto
if (APP_CONFIG.isProduction()) {
  // Logica produzione
} else {
  // Logica sviluppo/staging
}

// ❌ Evita
if (window.location.hostname === 'bookinghse.com') {
  // Hardcoded e fragile
}
```

4. **Centralizza la configurazione URL**
```typescript
// ✅ Corretto - tutto in un posto
const authUrls = {
  login: APP_CONFIG.getAuthUrl('login'),
  signup: APP_CONFIG.getAuthUrl('signup'),
  reset: APP_CONFIG.getAuthUrl('reset')
};

// ❌ Evita - URL sparsi nel codice
const loginUrl = 'https://bookinghse.com/auth/login';
const signupUrl = 'https://bookinghse.com/auth/signup';
```

### ❌ Errori Comuni da Evitare

1. **Non hardcodare mai i domini**
```typescript
// ❌ Sbagliato
const apiUrl = 'https://bookinghse.com/api/users';

// ✅ Corretto
const apiUrl = APP_CONFIG.getFullUrl('/api/users');
```

2. **Non assumere il protocollo**
```typescript
// ❌ Sbagliato
const url = `http://${domain}/path`;

// ✅ Corretto
const url = APP_CONFIG.getFullUrl('/path');
```

3. **Non ignorare la gestione degli errori**
```typescript
// ❌ Sbagliato
const domain = APP_CONFIG.getCurrentDomain(); // Potrebbe fallire

// ✅ Corretto
try {
  const domain = APP_CONFIG.getCurrentDomain();
  // Usa domain
} catch (error) {
  console.error('Errore nel rilevamento dominio:', error);
  // Fallback
}
```

## 🔧 Troubleshooting

### Problema: URL non corretti in produzione

**Sintomi:**
- URL che puntano a localhost in produzione
- Redirect di autenticazione che falliscono
- API calls che vanno al dominio sbagliato

**Diagnosi:**
```bash
# Verifica variabile ambiente
echo $VITE_APP_URL

# Controlla build output
npm run build
grep -r "localhost" dist/

# Test in browser console
console.log(APP_CONFIG.APP_URL);
console.log(APP_CONFIG.getCurrentDomain());
```

**Soluzioni:**
1. Verifica che `VITE_APP_URL` sia impostato correttamente
2. Ricostruisci l'applicazione dopo aver cambiato le variabili
3. Controlla che il deployment platform abbia le variabili corrette

### Problema: Errori di autenticazione

**Sintomi:**
- "Invalid redirect URL" da Supabase
- Utenti non riescono a completare il login
- Email di reset che non funzionano

**Diagnosi:**
```typescript
// Test URL generation
console.log('Auth URLs:', {
  login: APP_CONFIG.getAuthUrl('login'),
  signup: APP_CONFIG.getAuthUrl('signup'),
  reset: APP_CONFIG.getAuthUrl('reset'),
  callback: APP_CONFIG.getAuthUrl('callback')
});
```

**Soluzioni:**
1. Verifica configurazione Supabase Auth URLs
2. Controlla che tutti gli URL siano nella whitelist
3. Verifica CORS settings
4. Testa con URL di sviluppo prima di produzione

### Problema: Configurazione non aggiornata

**Sintomi:**
- Modifiche alla configurazione non riflesse
- Comportamento inconsistente tra ambienti
- Cache di URL vecchi

**Soluzioni:**
1. Pulisci cache del browser
2. Riavvia il server di sviluppo
3. Verifica che non ci siano import cached
4. Controlla che le modifiche siano state salvate

### Debug Utilities

```typescript
// Aggiungi al tuo componente per debug
function DebugUrls() {
  if (!APP_CONFIG.isProduction()) {
    console.log('🔧 Debug URL Configuration:', {
      APP_URL: APP_CONFIG.APP_URL,
      currentDomain: APP_CONFIG.getCurrentDomain(),
      isProduction: APP_CONFIG.isProduction(),
      authUrls: {
        login: APP_CONFIG.getAuthUrl('login'),
        signup: APP_CONFIG.getAuthUrl('signup'),
        reset: APP_CONFIG.getAuthUrl('reset'),
        callback: APP_CONFIG.getAuthUrl('callback')
      }
    });
  }
  
  return null;
}
```

## 📚 Riferimenti

- **File principale**: `src/config/urls.ts`
- **Documentazione API**: `docs/API.md`
- **Guida Deployment**: `docs/DEPLOYMENT.md`
- **README principale**: `README.md`

---

**Versione**: 1.0.0  
**Ultimo aggiornamento**: Gennaio 2024  
**Autore**: Team BookingHSE