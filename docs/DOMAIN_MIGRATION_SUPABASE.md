# Configurazione Supabase per il Nuovo Dominio bookinghse.com

## 📋 Panoramica

Questo documento descrive le modifiche necessarie da apportare alla configurazione Supabase dopo la migrazione del dominio da `booking-hse.netlify.app` a `bookinghse.com`.

## 📋 Informazioni Progetto Supabase
- **Progetto ID:** `hkboixswrbbijboouvdt`
- **Nome:** bookingHSE
- **Database Host:** db.hkboixswrbbijboouvdt.supabase.co
- **Regione:** eu-west-1

## 🔧 Configurazioni da Aggiornare

### 1. CORS Settings (OBBLIGATORIO)

**Dove:** Dashboard Supabase → Settings → API → CORS Settings

**Domini da aggiungere:**
```
https://bookinghse.com
https://www.bookinghse.com
http://localhost:5173
http://localhost:3000
```

**Nota:** Mantieni anche il vecchio dominio `https://booking-hse.netlify.app` durante il periodo di transizione per evitare interruzioni del servizio.

### 2. Auth Settings

**Dove:** Dashboard Supabase → Authentication → Settings

#### Site URL
```
https://bookinghse.com
```

#### Redirect URLs
Aggiungi i seguenti URL alla lista degli URL di redirect autorizzati:
```
https://bookinghse.com/auth/callback
https://bookinghse.com/auth/confirm-email
https://bookinghse.com/auth/reset-password
https://bookinghse.com/**
https://www.bookinghse.com/**
```

### 3. Edge Functions (se utilizzate)

Se stai utilizzando Supabase Edge Functions, verifica che:
- Le funzioni non abbiano riferimenti hardcoded al vecchio dominio
- I CORS delle Edge Functions includano il nuovo dominio

## 🚀 Procedura di Migrazione

### Fase 1: Preparazione
1. ✅ Aggiorna il codice con il nuovo dominio (completato)
2. ✅ Testa la build localmente (completato)
3. ⏳ Configura Supabase CORS (da fare manualmente)

### Fase 2: Configurazione Supabase
1. **Accedi alla Dashboard Supabase**
   - Vai su [supabase.com](https://supabase.com)
   - Seleziona il progetto BookingHSE

2. **Aggiorna CORS Settings**
   - Settings → API → CORS Settings
   - Aggiungi `https://bookinghse.com`
   - Aggiungi `https://www.bookinghse.com`

3. **Aggiorna Auth Settings**
   - Authentication → Settings
   - Aggiorna Site URL: `https://bookinghse.com`
   - Aggiungi i redirect URLs elencati sopra

### Fase 3: Deploy e Test
1. Fai il deploy su Netlify
2. Testa tutte le funzionalità di autenticazione
3. Verifica che le API calls funzionino correttamente
4. Controlla che non ci siano errori CORS nel browser

## 🔍 Verifica Post-Migrazione

### Checklist di Test
- [ ] Login/Logout funziona correttamente
- [ ] Registrazione nuovi utenti
- [ ] Reset password via email
- [ ] Conferma email per nuovi account
- [ ] Tutte le API calls funzionano senza errori CORS
- [ ] Upload/download file (se utilizzato Supabase Storage)

### Comandi di Test
```bash
# Testa con il nuovo dominio
VITE_APP_URL=https://bookinghse.com npm run dev

# Verifica la build di produzione
npm run build
npm run preview
```

## 🚨 Troubleshooting

### Errori CORS Comuni
Se vedi errori come:
```
Access to fetch at 'https://[project].supabase.co/...' from origin 'https://bookinghse.com' has been blocked by CORS policy
```

**Soluzione:**
1. Verifica che `https://bookinghse.com` sia aggiunto ai CORS settings
2. Aspetta 5-10 minuti per la propagazione delle modifiche
3. Svuota la cache del browser

### Errori di Autenticazione
Se l'autenticazione non funziona:
1. Controlla che il Site URL sia aggiornato
2. Verifica che tutti i redirect URLs siano configurati
3. Controlla che le variabili d'ambiente siano corrette

## 📞 Supporto

Per problemi con la configurazione Supabase:
- [Documentazione Supabase CORS](https://supabase.com/docs/guides/api/cors)
- [Documentazione Auth Settings](https://supabase.com/docs/guides/auth/auth-helpers/auth-ui)
- [Community Support](https://github.com/supabase/supabase/discussions)

## 📝 Note Aggiuntive

- **Periodo di Transizione:** Mantieni il vecchio dominio nei CORS per almeno 48 ore dopo il deploy
- **Cache:** Alcuni browser potrebbero cacheare le impostazioni CORS, consiglia agli utenti di svuotare la cache se riscontrano problemi
- **Monitoraggio:** Monitora i log di Supabase per eventuali errori dopo la migrazione

---

**Ultimo aggiornamento:** $(Get-Date -Format "dd/MM/yyyy HH:mm")
**Versione:** 1.0.5