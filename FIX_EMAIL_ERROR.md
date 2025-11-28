# 🚨 RISOLUZIONE ERRORE EMAIL LINK SCADUTO

## Errore Attuale
```
http://localhost:3000/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired
```

## Causa del Problema
Il link nell'email punta a `localhost:3000` ma l'applicazione gira su `localhost:5173`.

## ✅ SOLUZIONE IMMEDIATA

### 1. Accedi al Dashboard Supabase
1. Vai su [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Seleziona il tuo progetto `hkboixswrbbijboouvdt`
3. Vai in **Settings** (icona ingranaggio in basso a sinistra)
4. Clicca su **Authentication**

### 2. Correggi le URL di Configurazione
Nella sezione **URL Configuration**:

**CAMBIA DA:**
- Site URL: `http://localhost:3000`

**CAMBIA A:**
- Site URL: `http://localhost:5173`

**AGGIUNGI ai Redirect URLs:**
```
http://localhost:5173/auth/callback
http://localhost:5173/reset-password
http://localhost:5173
```

### 3. Salva le Modifiche
Clicca **Save** per applicare le modifiche.

### 4. Test Immediato
1. Vai su [http://localhost:5173/register](http://localhost:5173/register)
2. Registra un nuovo utente con una email diversa
3. Controlla l'email ricevuta
4. Il link dovrebbe ora puntare a `localhost:5173`

## 🔍 Verifica Configurazione Attuale

Le tue variabili d'ambiente sono corrette:
- ✅ `VITE_APP_URL=http://localhost:5173`
- ✅ `VITE_SUPABASE_URL=https://hkboixswrbbijboouvdt.supabase.co`

## ⚠️ Note Importanti

1. **Le modifiche nel dashboard Supabase sono immediate**
2. **I link email già inviati rimarranno con il vecchio URL**
3. **Dovrai registrare un nuovo utente per testare il fix**
4. **Per la produzione, ricordati di cambiare a `https://tuodominio.com`**

## 🚀 Dopo il Fix

Una volta corrette le impostazioni:
1. I nuovi link email punteranno a `localhost:5173/auth/callback`
2. La pagina `AuthCallback.tsx` gestirà automaticamente la conferma
3. L'utente verrà reindirizzato appropriatamente dopo la verifica

---

**💡 Suggerimento**: Salva questo documento per riferimenti futuri quando deploy in produzione!