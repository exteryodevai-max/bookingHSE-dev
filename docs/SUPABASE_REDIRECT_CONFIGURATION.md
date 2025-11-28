# Configurazione Redirect URL Supabase per BookingHSE

## 📋 Informazioni Progetto
- **Progetto ID:** `hkboixswrbbijboouvdt`
- **Nome:** bookingHSE
- **Regione:** eu-west-1
- **Status:** ACTIVE_HEALTHY
- **Database Host:** db.hkboixswrbbijboouvdt.supabase.co

## 🔧 Configurazione Redirect URL

### Accesso alla Dashboard
1. Vai su [supabase.com](https://supabase.com)
2. Accedi al tuo account
3. Seleziona il progetto **bookingHSE** (ID: `hkboixswrbbijboouvdt`)

### Configurazione Authentication Settings

#### Passo 1: Naviga alle Impostazioni Auth
```
Dashboard → Authentication → Settings → URL Configuration
```

#### Passo 2: Site URL
Imposta il Site URL principale:
```
https://bookinghse.com
```

#### Passo 3: Redirect URLs
Aggiungi tutti i seguenti URL nella sezione "Redirect URLs":

**URL di Produzione:**
```
https://bookinghse.com
https://bookinghse.com/*
https://www.bookinghse.com
https://www.bookinghse.com/*
https://bookinghse.com/auth/callback
https://bookinghse.com/auth/reset-password
https://bookinghse.com/auth/verify
https://bookinghse.com/email-verification
https://bookinghse.com/email-verification-confirm
https://bookinghse.com/email-verification-wait
https://bookinghse.com/email-waiting
```

**URL di Transizione (mantieni temporaneamente):**
```
https://booking-hse.netlify.app/*
```

**URL di Sviluppo:**
```
http://localhost:5173/*
http://localhost:3000/*
```

### Configurazione CORS

#### Passo 4: CORS Settings
```
Dashboard → Settings → API → CORS Settings
```

Aggiungi i seguenti domini:
```
https://bookinghse.com
https://www.bookinghse.com
https://booking-hse.netlify.app
http://localhost:5173
http://localhost:3000
```

## 📝 Lista Completa URL da Configurare

### Redirect URLs (copia e incolla uno per volta)
```
https://bookinghse.com
https://bookinghse.com/*
https://www.bookinghse.com
https://www.bookinghse.com/*
https://bookinghse.com/auth/callback
https://bookinghse.com/auth/reset-password
https://bookinghse.com/auth/verify
https://bookinghse.com/email-verification
https://bookinghse.com/email-verification-confirm
https://bookinghse.com/email-verification-wait
https://bookinghse.com/email-waiting
https://booking-hse.netlify.app/*
http://localhost:5173/*
http://localhost:3000/*
```

### CORS Origins
```
https://bookinghse.com
https://www.bookinghse.com
https://booking-hse.netlify.app
http://localhost:5173
http://localhost:3000
```

## 🔍 Verifica Configurazione

### Test di Funzionalità
Dopo aver configurato gli URL, testa:

1. **Login/Logout**
   ```bash
   # Testa dal nuovo dominio
   curl -X POST https://hkboixswrbbijboouvdt.supabase.co/auth/v1/token \
     -H "Origin: https://bookinghse.com" \
     -H "apikey: [YOUR_ANON_KEY]"
   ```

2. **Reset Password**
   - Vai su `https://bookinghse.com/auth/reset-password`
   - Testa il flusso completo

3. **Email Verification**
   - Registra un nuovo utente
   - Verifica che l'email di conferma funzioni

### Controllo Errori CORS
Apri la console del browser su `https://bookinghse.com` e verifica che non ci siano errori tipo:
```
Access to fetch at 'https://hkboixswrbbijboouvdt.supabase.co/...' 
from origin 'https://bookinghse.com' has been blocked by CORS policy
```

## 🚨 Troubleshooting

### Errore "Invalid redirect URL"
- Verifica che l'URL sia esattamente come configurato
- Controlla che non ci siano spazi extra
- Assicurati che l'URL inizi con `https://` o `http://`

### Errore CORS
- Aspetta 5-10 minuti per la propagazione
- Svuota la cache del browser
- Verifica che il dominio sia aggiunto ai CORS settings

### Email non funzionanti
- Controlla che il Site URL sia corretto
- Verifica che i redirect URL per email verification siano configurati
- Testa con un indirizzo email diverso

## 📞 Supporto

### Link Utili
- [Supabase Auth Settings](https://supabase.com/docs/guides/auth/auth-helpers/auth-ui)
- [CORS Configuration](https://supabase.com/docs/guides/api/cors)
- [Redirect URLs Guide](https://supabase.com/docs/guides/auth/redirect-urls)

### Informazioni di Debug
```
Progetto: bookingHSE
ID: hkboixswrbbijboouvdt
Database: db.hkboixswrbbijboouvdt.supabase.co
Regione: eu-west-1
```

---

**Creato:** $(Get-Date -Format "dd/MM/yyyy HH:mm")  
**Progetto:** BookingHSE v1.0.5  
**Configurazione:** Migrazione dominio bookinghse.com