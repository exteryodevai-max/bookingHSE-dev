# Edge Functions - BookingHSE

## Panoramica

Le Edge Functions di Supabase sono state implementate per gestire la business logic critica dell'applicazione BookingHSE. Queste funzioni serverless gestiscono pagamenti, notifiche e webhook in modo sicuro e scalabile.

## Funzioni Implementate

### 1. stripe-payment

**Endpoint:** `https://hkboixswrbbijboouvdt.supabase.co/functions/v1/stripe-payment`

**Scopo:** Gestisce la creazione di Payment Intent per i pagamenti Stripe.

**Metodo:** POST

**Parametri richiesti:**
```json
{
  "amount": 5000,           // Importo in centesimi (€50.00)
  "currency": "eur",        // Valuta (opzionale, default: eur)
  "booking_id": "uuid",     // ID della prenotazione
  "customer_email": "email", // Email del cliente
  "description": "string"   // Descrizione opzionale
}
```

**Risposta di successo:**
```json
{
  "success": true,
  "client_secret": "pi_xxx_secret_xxx",
  "payment_intent_id": "pi_xxx",
  "amount": 5000,
  "currency": "eur"
}
```

**Funzionalità:**
- Verifica l'esistenza della prenotazione
- Valida l'importo con quello della prenotazione
- Crea Payment Intent su Stripe
- Aggiorna lo stato della prenotazione nel database

### 2. send-notification

**Endpoint:** `https://hkboixswrbbijboouvdt.supabase.co/functions/v1/send-notification`

**Scopo:** Invia notifiche email personalizzate per eventi di prenotazione.

**Metodo:** POST

**Parametri richiesti:**
```json
{
  "type": "booking_confirmation", // Tipo di notifica
  "booking_id": "uuid",          // ID della prenotazione
  "recipient_email": "email",    // Email destinatario (opzionale)
  "custom_message": "string"     // Messaggio personalizzato (opzionale)
}
```

**Tipi di notifica supportati:**
- `booking_confirmation` - Conferma prenotazione
- `booking_reminder` - Promemoria prenotazione
- `payment_confirmation` - Conferma pagamento
- `booking_cancelled` - Prenotazione cancellata

**Risposta di successo:**
```json
{
  "success": true,
  "message": "Notification sent successfully",
  "email_id": "email_id",
  "recipient": "email@example.com"
}
```

**Funzionalità:**
- Template email personalizzati per ogni tipo di notifica
- Supporto per Resend API (preferito) o fallback Supabase
- Logging automatico delle notifiche nel database
- Template HTML e testo per compatibilità

### 3. booking-webhook

**Endpoint:** `https://hkboixswrbbijboouvdt.supabase.co/functions/v1/booking-webhook`

**Scopo:** Gestisce webhook di Stripe e aggiornamenti di stato delle prenotazioni.

**Metodi:** POST

**Webhook Stripe supportati:**
- `payment_intent.succeeded` - Pagamento completato
- `payment_intent.payment_failed` - Pagamento fallito
- `payment_intent.canceled` - Pagamento cancellato

**Webhook personalizzati:**
```json
{
  "action": "status_update",
  "booking_id": "uuid",
  "data": {
    "status": "confirmed",
    "notes": "Note opzionali"
  }
}
```

**Azioni supportate:**
- `status_update` - Aggiorna stato prenotazione
- `reminder_sent` - Segna promemoria inviato
- `no_show` - Segna come no-show
- `completed` - Segna come completata

## Configurazione Ambiente

Le Edge Functions richiedono le seguenti variabili d'ambiente in Supabase:

```bash
# Stripe (richiesto per pagamenti)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Resend (opzionale, per email migliori)
RESEND_API_KEY=re_xxx

# Supabase (automatiche)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
```

## Sicurezza

### Autenticazione
- Tutte le funzioni richiedono JWT valido (`verify_jwt: true`)
- Stripe webhook usa signature verification
- Accesso al database tramite service role key

### Validazione
- Validazione parametri richiesti
- Verifica esistenza prenotazioni
- Controllo importi per prevenire frodi
- Sanitizzazione input utente

### CORS
- Headers CORS configurati per domini autorizzati
- Supporto preflight OPTIONS requests

## Utilizzo nel Frontend

### Esempio: Creare pagamento

```typescript
const { data, error } = await supabase.functions.invoke('stripe-payment', {
  body: {
    amount: booking.total_amount * 100, // Converti in centesimi
    booking_id: booking.id,
    customer_email: user.email,
    description: `Pagamento per ${service.title}`
  }
});

if (data?.success) {
  // Usa client_secret per Stripe Elements
  const { client_secret } = data;
  // Procedi con il pagamento frontend
}
```

### Esempio: Inviare notifica

```typescript
const { data, error } = await supabase.functions.invoke('send-notification', {
  body: {
    type: 'booking_confirmation',
    booking_id: booking.id
  }
});
```

### Esempio: Aggiornare stato prenotazione

```typescript
const { data, error } = await supabase.functions.invoke('booking-webhook', {
  body: {
    action: 'status_update',
    booking_id: booking.id,
    data: {
      status: 'confirmed',
      notes: 'Prenotazione confermata dal provider'
    }
  }
});
```

## Monitoraggio e Debug

### Log delle funzioni
- Accedi ai log tramite Supabase Dashboard > Edge Functions

## 4. Funzione Contact (Netlify Functions)

**Endpoint:** `/.netlify/functions/contact`

**Scopo:** Gestisce l'invio di email di contatto tramite Resend API.

**Metodo:** POST

**Parametri richiesti:**
```json
{
  "name": "Mario Rossi",
  "email": "mario@esempio.com",
  "subject": "Richiesta informazioni",
  "message": "Messaggio dettagliato...",
  "category": "general"
}
```

**Categorie supportate:**
- `general` - Richieste generali
- `support` - Supporto tecnico
- `sales` - Vendite e commerciale
- `partnership` - Partnership

**Risposta di successo:**
```json
{
  "success": true,
  "data": {
    "messageId": "msg_xxxxxxxxxxxxxxxxxxxxxxxx",
    "to": "info@bookinghse.com",
    "subject": "Richiesta informazioni",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "message": "Email inviata con successo"
}
```

**Risposta di errore:**
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

**Funzionalità:**
- Validazione completa dei campi obbligatori
- Rate limiting (5 richieste/minuto per IP)
- Template email professionali con branding BookingHSE
- Logging degli invii email
- Gestione errori con codici specifici

**Configurazione Netlify:**
```toml
[build]
  functions = "netlify/functions"

[build.environment]
  RESEND_API_KEY = "re_xxx"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

**Utilizzo nel Frontend:**
```typescript
const response = await fetch('/api/contact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: formData.name,
    email: formData.email,
    subject: formData.subject,
    message: formData.message,
    category: formData.category
  })
});

const result = await response.json();
if (result.success) {
  // Email inviata con successo
} else {
  // Gestione errore
}
```
- Ogni funzione logga eventi importanti
- Errori dettagliati per debugging

### Metriche
- Invocazioni per funzione
- Tempi di esecuzione
- Tasso di errore
- Utilizzo risorse

## Prossimi Sviluppi

### Funzioni aggiuntive pianificate:
1. **availability-sync** - Sincronizzazione disponibilità
2. **review-processor** - Elaborazione recensioni
3. **analytics-collector** - Raccolta metriche
4. **backup-scheduler** - Backup automatici

### Miglioramenti:
- Rate limiting per prevenire abusi
- Retry logic per chiamate esterne
- Caching per performance
- Monitoring avanzato

## Troubleshooting

### Errori comuni:

**"Missing required environment variables"**
- Verifica configurazione variabili in Supabase Dashboard

**"Booking not found"**
- Controlla che booking_id sia valido e esistente

**"Amount mismatch"**
- Verifica che l'importo corrisponda al totale della prenotazione

**"Webhook signature verification failed"**
- Controlla STRIPE_WEBHOOK_SECRET in Supabase

### Test delle funzioni:
```bash
# Test locale (se configurato)
supabase functions serve

# Test in produzione
curl -X POST https://hkboixswrbbijboouvdt.supabase.co/functions/v1/stripe-payment \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"amount": 5000, "booking_id": "uuid", "customer_email": "test@example.com"}'
```

---

**Nota:** Assicurati di configurare le variabili d'ambiente in Supabase Dashboard > Settings > Edge Functions prima di utilizzare le funzioni in produzione.