# Configurazione Email di Conferma Supabase

## Problema
Quando un utente si registra, riceve un'email di conferma con un link che punta a `localhost` invece del dominio di produzione. Questo può causare problemi nel processo di login.

## Soluzione

### 1. Configurazione Dashboard Supabase

Accedi al dashboard di Supabase e vai in:
**Settings > Authentication > URL Configuration**

Configura i seguenti URL:

- **Site URL**: `https://tuodominio.com` (URL di produzione)
- **Redirect URLs**: Aggiungi tutti gli URL validi per i redirect:
  - `https://tuodominio.com/auth/callback`
  - `https://tuodominio.com/reset-password`
  - `http://localhost:5173/auth/callback` (per sviluppo)
  - `http://localhost:5173/reset-password` (per sviluppo)

### 2. Variabili d'Ambiente

Nel file `.env`:

```env
# URL dell'applicazione (cambia in base all'ambiente)
VITE_APP_URL=https://tuodominio.com  # Per produzione
# VITE_APP_URL=http://localhost:5173  # Per sviluppo
```

### 3. Configurazione per Ambiente

#### Sviluppo
```env
VITE_APP_URL=http://localhost:5173
```

#### Produzione
```env
VITE_APP_URL=https://tuodominio.com
```

### 4. Verifica Configurazione

1. **Email di conferma**: Dovrebbe reindirizzare a `/auth/callback`
2. **Reset password**: Dovrebbe reindirizzare a `/reset-password`
3. **Gestione errori**: La pagina di callback gestisce automaticamente errori e successi

### 5. Pagina di Callback

La pagina `/auth/callback` è stata creata per:
- Gestire il token di conferma email
- Verificare la sessione utente
- Reindirizzare appropriatamente in base al tipo di utente
- Mostrare messaggi di errore se necessario

### 6. Test

Per testare la configurazione:
1. Registra un nuovo utente
2. Controlla l'email ricevuta
3. Verifica che il link punti al dominio corretto
4. Clicca sul link e verifica il redirect

### Note Importanti

- La variabile `VITE_APP_URL` deve essere impostata correttamente per ogni ambiente
- I redirect URL devono essere configurati nel dashboard Supabase
- La pagina di callback gestisce automaticamente la verifica dell'email
- In caso di errori, l'utente viene reindirizzato alla pagina di login con un messaggio appropriato