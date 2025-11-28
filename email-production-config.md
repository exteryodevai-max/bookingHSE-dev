# Configurazione Email di Produzione - BookingHSE

## Impostazioni Dashboard Supabase

### 1. URL Configuration
Vai su: **Dashboard Supabase > Settings > Authentication > URL Configuration**

Configura:
- **Site URL**: `https://bookinghse.com`
- **Redirect URLs**:
  - `https://bookinghse.com/auth/callback`
  - `https://bookinghse.com/reset-password`
  - `https://bookinghse.com/auth/confirm`

### 2. Email Templates
Vai su: **Dashboard Supabase > Authentication > Email Templates**

#### Template Conferma Registrazione:
```html
<h2>Conferma la tua registrazione su BookingHSE</h2>
<p>Clicca sul link per confermare il tuo account:</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/">
    Conferma Email
  </a>
</p>
<p>Se non hai richiesto questa registrazione, ignora questa email.</p>
```

#### Template Reset Password:
```html
<h2>Reset Password - BookingHSE</h2>
<p>Hai richiesto di reimpostare la password. Clicca sul link:</p>
<p>
  <a href="{{ .SiteURL }}/reset-password?token_hash={{ .TokenHash }}&type=recovery">
    Reimposta Password
  </a>
</p>
<p>Se non hai richiesto questo reset, ignora questa email.</p>
```

### 3. SMTP Configuration (Opzionale)
Per email personalizzate, configura SMTP:
- **Host**: smtp.gmail.com (o altro provider)
- **Port**: 587
- **Username**: tua-email@gmail.com
- **Password**: app-password
- **From**: noreply@bookinghse.com

### 4. Rate Limiting
- **Max emails per hour**: 100
- **Max emails per day**: 1000

## Variabili d'Ambiente Aggiornate

```env
VITE_APP_URL=https://bookinghse.com
VITE_EMAIL_REDIRECT_URL=https://bookinghse.com/auth/callback
VITE_RESET_PASSWORD_URL=https://bookinghse.com/reset-password
```

## Test Email Functionality

Dopo la configurazione, testa:
1. Registrazione nuovo utente
2. Conferma email
3. Reset password
4. Login con email confermata

## Note Importanti

- Le email di conferma sono abilitate di default sui progetti hosted
- I template email supportano variabili come `{{ .SiteURL }}`, `{{ .TokenHash }}`
- Per domini personalizzati, configura DNS records appropriati
- Monitora i log email nel dashboard per debugging