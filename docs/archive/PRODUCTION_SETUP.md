# 🚀 Configurazione Produzione - BookingHSE

## ❌ Problema: L'applicazione punta a localhost

Se vedi errori che puntano a `localhost:3000` o `localhost:5173`, significa che l'applicazione non è configurata correttamente per la produzione.

## ✅ Soluzione: Configurazione Dominio di Produzione

### 1. 📝 Configura il Dominio

#### Opzione A: Netlify (Raccomandato)
1. Vai su [Netlify](https://netlify.com)
2. Connetti il tuo repository GitHub
3. Il tuo sito sarà disponibile su: `https://nome-app.netlify.app`

#### Opzione B: Vercel
1. Vai su [Vercel](https://vercel.com)
2. Importa il progetto da GitHub
3. Il tuo sito sarà disponibile su: `https://nome-app.vercel.app`

#### Opzione C: Dominio Personalizzato
1. Acquista un dominio (es. `bookingHSE.com`)
2. Configuralo nel tuo provider di hosting

### 2. 🔧 Configura le Variabili d'Ambiente

#### Su Netlify:
1. Vai su **Site settings** → **Environment variables**
2. Aggiungi queste variabili:

```bash
VITE_APP_URL=https://tuo-dominio.netlify.app
VITE_SUPABASE_URL=https://hkboixswrbbijboouvdt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=production
VITE_DEBUG=false
```

#### Su Vercel:
1. Vai su **Settings** → **Environment Variables**
2. Aggiungi le stesse variabili sopra

### 3. 🔐 Configura Supabase per Produzione

1. **Vai al Dashboard Supabase**: https://supabase.com/dashboard
2. **Seleziona il tuo progetto**
3. **Vai su Authentication** → **URL Configuration**
4. **Aggiorna questi campi**:

```bash
# Site URL (URL principale dell'app)
Site URL: https://tuo-dominio.netlify.app

# Redirect URLs (URL autorizzati per redirect)
Redirect URLs:
https://tuo-dominio.netlify.app/auth/callback
https://tuo-dominio.netlify.app/auth/reset-password
https://tuo-dominio.netlify.app/**
```

### 4. 🧪 Testa la Configurazione

1. **Deploy l'applicazione**:
   ```bash
   npm run build
   ```

2. **Testa la registrazione**:
   - Vai su `https://tuo-dominio.netlify.app/register`
   - Registra un nuovo utente
   - Controlla che l'email di conferma punti al dominio corretto

3. **Verifica i redirect**:
   - L'email dovrebbe contenere link come:
   - `https://tuo-dominio.netlify.app/auth/callback?token=...`
   - **NON** `http://localhost:5173/auth/callback?token=...`

### 5. 🔍 Debug Problemi Comuni

#### Errore: "Email link is invalid or has expired"
- ✅ Verifica che `VITE_APP_URL` sia impostato correttamente
- ✅ Controlla che Supabase Site URL corrisponda al tuo dominio
- ✅ Assicurati che i Redirect URLs includano il tuo dominio

#### Errore: Link punta ancora a localhost
- ❌ **Problema**: Variabili d'ambiente non configurate
- ✅ **Soluzione**: Configura `VITE_APP_URL` nel tuo hosting provider

#### Errore: 404 dopo il redirect
- ❌ **Problema**: Redirect URLs non configurati
- ✅ **Soluzione**: Aggiungi tutti i percorsi necessari in Supabase

### 6. ⚡ Polyfill React 18 in Produzione

BookingHSE implementa un sistema avanzato di polyfill per React 18 che garantisce la compatibilità in produzione.

#### 🔧 Sistema Automatico
Il sistema di polyfill è **completamente automatico** e non richiede configurazione manuale:

```typescript
// ✅ Già configurato in vite.config.ts
import { useSyncExternalStorePolyfillPlugin } from './vite-polyfill-plugin';

export default defineConfig({
  plugins: [
    react(),
    useSyncExternalStorePolyfillPlugin(), // Polyfill automatico
  ],
});
```

#### 🚀 Cosa Fa in Produzione
1. **Rilevamento Automatico**: Scansiona i chunk vendor per React
2. **Patch Dinamica**: Aggiunge `useSyncExternalStore` se mancante
3. **Compatibilità Universale**: Funziona con nomi variabili minificati
4. **Zero Configurazione**: Attivo automaticamente in build di produzione

#### 🔍 Verifica Funzionamento
Dopo il deploy, controlla la console del browser:

```bash
# ✅ Polyfill caricato correttamente
[Polyfill] useSyncExternalStore polyfill loaded successfully

# ✅ Polyfill applicato a chunk vendor
[Polyfill] Applied useSyncExternalStore polyfill to vendor chunk

# ⚠️ Se vedi questo, il polyfill non è necessario (React già completo)
[Polyfill] useSyncExternalStore already available, polyfill not needed
```

#### 🐛 Troubleshooting Polyfill
Se vedi errori come `Cannot read properties of undefined (reading 'useSyncExternalStore')`:

1. **Verifica Build**: Assicurati che il plugin sia attivo in `vite.config.ts`
2. **Controlla Console**: Cerca i log del polyfill
3. **Cache Browser**: Prova in modalità incognito
4. **Rebuild**: Esegui `npm run build` e rideploy

#### 📊 Performance Impact
- **Overhead**: <1ms di caricamento aggiuntivo
- **Size**: +2KB gzipped solo se necessario
- **Lazy Loading**: Caricato solo quando richiesto

### 7. 📋 Checklist Pre-Produzione

- [ ] ✅ Dominio configurato (Netlify/Vercel/Custom)
- [ ] ✅ `VITE_APP_URL` impostato nel provider di hosting
- [ ] ✅ Supabase Site URL aggiornato
- [ ] ✅ Supabase Redirect URLs configurati
- [ ] ✅ Build di produzione testata
- [ ] ✅ Polyfill React 18 verificato (console logs)
- [ ] ✅ Registrazione utente testata
- [ ] ✅ Email di conferma testata
- [ ] ✅ Reset password testato

### 8. 🚨 Importante per la Sicurezza

1. **Non committare `.env.production`** nel repository
2. **Usa variabili d'ambiente** del provider di hosting
3. **Configura HTTPS** (automatico su Netlify/Vercel)
4. **Testa tutti i flussi** prima del lancio

---

## 🆘 Hai ancora problemi?

1. **Controlla i log** del tuo provider di hosting
2. **Verifica la console** del browser per errori
3. **Testa in modalità incognito** per evitare cache
4. **Controlla le variabili d'ambiente** nel dashboard del provider

---

**✨ Una volta configurato correttamente, tutti i link punteranno al tuo dominio di produzione invece che a localhost!**