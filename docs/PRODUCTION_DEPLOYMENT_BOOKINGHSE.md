# 🚀 Guida al Deployment di Produzione - BookingHSE.com

## 📋 Panoramica

Questa guida ti accompagna nel processo di configurazione e deployment dell'applicazione BookingHSE per il dominio di produzione **BookingHSE.com**.

## 🔧 Configurazione Ambiente di Produzione

### 1. File di Configurazione

#### `.env.production`
Il file `.env.production` è già configurato con:

```bash
# URL base dell'applicazione (PRODUZIONE)
VITE_APP_URL=https://bookinghse.com

# Configurazione Supabase
VITE_SUPABASE_URL=https://hkboixswrbbijboouvdt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Ambiente di produzione
NODE_ENV=production
VITE_DEBUG=false

# URL di callback per autenticazione
VITE_AUTH_CALLBACK_URL=https://bookinghse.com/auth/callback
VITE_LOGIN_REDIRECT_URL=https://bookinghse.com/dashboard
VITE_LOGOUT_REDIRECT_URL=https://bookinghse.com
VITE_EMAIL_CONFIRM_URL=https://bookinghse.com/auth/confirm
VITE_PASSWORD_RESET_URL=https://bookinghse.com/auth/reset-password
```

### 2. Configurazione URL Centralizzata

Il file `src/config/urls.ts` gestisce automaticamente gli URL per sviluppo e produzione:

- **Sviluppo**: `http://localhost:5173`
- **Produzione**: `https://bookinghse.com`

## 🔐 Configurazione Supabase Dashboard

### Passaggi Obbligatori nel Dashboard Supabase

1. **Accedi al Dashboard Supabase**
   - Vai su [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Seleziona il progetto BookingHSE

2. **Authentication Settings**
   - Vai su **Authentication** → **Settings**
   - **Site URL**: `https://bookinghse.com`

3. **Redirect URLs**
   Aggiungi questi URL nella sezione **Redirect URLs**:
   ```
   https://bookinghse.com/auth/callback
   https://bookinghse.com/auth/confirm
   https://bookinghse.com/auth/reset-password
   https://bookinghse.com/dashboard
   https://bookinghse.com
   https://bookinghse.com/**
   ```

4. **Email Templates**
   - Vai su **Authentication** → **Email Templates**
   - **Confirm signup**: Verifica che `{{ .SiteURL }}` punti a `https://bookinghse.com`
   - **Reset password**: Verifica che `{{ .SiteURL }}` punti a `https://bookinghse.com`
   - **Magic link**: Verifica che `{{ .SiteURL }}` punti a `https://bookinghse.com`

## 🌐 Configurazione CORS

### Supabase CORS Settings

1. Vai su **Settings** → **API**
2. Nella sezione **CORS origins**, aggiungi:
   ```
   https://bookinghse.com
   ```

### Vercel/Netlify CORS (se necessario)

Se usi Vercel, aggiungi al file `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "https://bookinghse.com" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, POST, PUT, DELETE, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization" }
      ]
    }
  ]
}
```

## 📦 Build e Deploy

### 1. Build di Produzione

```bash
# Installa le dipendenze
npm install

# Build per produzione
npm run build

# Preview del build (opzionale)
npm run preview
```

### 2. Deploy su Vercel

```bash
# Installa Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### 3. Deploy su Netlify

```bash
# Installa Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

## 🔍 Configurazione DNS

### Configurazione Dominio BookingHSE.com

1. **Vercel**:
   - Vai su Vercel Dashboard
   - Aggiungi il dominio `bookinghse.com`
   - Configura i record DNS:
     ```
     Type: A
     Name: @
     Value: 76.76.19.61 (IP Vercel)
     
     Type: CNAME
     Name: www
     Value: cname.vercel-dns.com
     ```

2. **Netlify**:
   - Vai su Netlify Dashboard
   - Aggiungi il dominio `bookinghse.com`
   - Configura i record DNS:
     ```
     Type: A
     Name: @
     Value: 75.2.60.5 (IP Netlify)
     
     Type: CNAME
     Name: www
     Value: [your-site].netlify.app
     ```

## ✅ Checklist di Verifica

### Prima del Deploy
- [ ] File `.env.production` configurato
- [ ] Supabase Site URL aggiornato
- [ ] Redirect URLs configurati in Supabase
- [ ] Email templates verificati
- [ ] CORS configurato
- [ ] Build di produzione testato

### Dopo il Deploy
- [ ] Sito accessibile su `https://bookinghse.com`
- [ ] Registrazione utente funzionante
- [ ] Email di conferma con URL corretto
- [ ] Login/logout funzionanti
- [ ] Reset password funzionante
- [ ] Redirect dopo autenticazione corretti

## 🧪 Test di Produzione

### 1. Test Registrazione
```bash
# Vai su https://bookinghse.com/auth/register
# Registra un nuovo utente
# Verifica che l'email di conferma punti a bookinghse.com
```

### 2. Test Login
```bash
# Vai su https://bookinghse.com/auth/login
# Effettua il login
# Verifica il redirect alla dashboard
```

### 3. Test Reset Password
```bash
# Vai su https://bookinghse.com/auth/login
# Clicca "Password dimenticata?"
# Verifica che l'email punti a bookinghse.com
```

## 🚨 Risoluzione Problemi

### Errore: "Invalid redirect URL"
- Verifica che l'URL sia aggiunto nei Redirect URLs di Supabase
- Controlla che non ci siano spazi o caratteri extra

### Email puntano ancora a localhost
- Verifica la configurazione Site URL in Supabase
- Controlla che `VITE_APP_URL` sia impostato correttamente
- Riavvia l'applicazione dopo le modifiche

### Errori CORS
- Verifica la configurazione CORS in Supabase
- Controlla i headers del server se usi un backend personalizzato

## 📞 Supporto

Per problemi o domande:
1. Controlla i log del browser (F12 → Console)
2. Verifica i log di Supabase (Dashboard → Logs)
3. Consulta la documentazione ufficiale di Supabase

---

**✨ Una volta completata la configurazione, BookingHSE sarà completamente operativo su https://bookinghse.com!**