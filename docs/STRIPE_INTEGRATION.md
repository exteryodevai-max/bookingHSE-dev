# Integrazione Stripe - BookingHSE

## Panoramica
Questa documentazione descrive l'integrazione di Stripe per la gestione dei pagamenti nel sistema BookingHSE.

## Configurazione

### 1. Variabili d'Ambiente
Aggiungi le seguenti variabili al file `.env`:

```bash
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 2. Chiavi di Test Stripe
Per lo sviluppo, usa le chiavi di test di Stripe:
- **Publishable Key**: Inizia con `pk_test_`
- **Secret Key**: Inizia con `sk_test_`
- **Webhook Secret**: Inizia con `whsec_`

### 3. Configurazione Webhook
Configura i webhook Stripe per ricevere eventi:
- **URL Endpoint**: `https://your-domain.com/functions/v1/booking-webhook`
- **Eventi da ascoltare**:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `payment_intent.canceled`

## Edge Functions

### 1. stripe-payment
**Endpoint**: `/functions/v1/stripe-payment`

**Funzionalità**:
- Crea Payment Intent per prenotazioni
- Verifica disponibilità del servizio
- Aggiorna stato prenotazione

**Parametri**:
```json
{
  "bookingId": "uuid",
  "amount": 5000,
  "currency": "eur",
  "metadata": {
    "booking_id": "uuid",
    "service_name": "string"
  }
}
```

**Risposta**:
```json
{
  "success": true,
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

### 2. booking-webhook
**Endpoint**: `/functions/v1/booking-webhook`

**Funzionalità**:
- Gestisce eventi webhook di Stripe
- Aggiorna stato prenotazioni
- Invia notifiche automatiche

**Eventi gestiti**:
- `payment_intent.succeeded`: Conferma pagamento
- `payment_intent.payment_failed`: Gestisce fallimenti
- `payment_intent.canceled`: Gestisce cancellazioni

## Frontend Integration

### 1. Installazione Stripe.js
```bash
npm install @stripe/stripe-js
```

### 2. Configurazione Client
```typescript
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
```

### 3. Esempio Pagamento
```typescript
// Crea Payment Intent
const response = await fetch('/functions/v1/stripe-payment', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  },
  body: JSON.stringify({
    bookingId: 'booking-uuid',
    amount: 5000, // €50.00
    currency: 'eur'
  })
});

const { clientSecret } = await response.json();

// Conferma pagamento
const stripe = await stripePromise;
const result = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement,
    billing_details: {
      name: 'Customer Name',
      email: 'customer@email.com'
    }
  }
});
```

## Sicurezza

### 1. Validazione Server-Side
- Tutti i pagamenti sono validati lato server
- Verifica dell'autenticazione utente
- Controllo disponibilità servizi

### 2. Webhook Security
- Verifica signature Stripe
- Validazione eventi duplicati
- Logging completo delle transazioni

### 3. Gestione Errori
- Retry automatico per webhook
- Logging errori dettagliato
- Notifiche admin per problemi critici

## Testing

### 1. Carte di Test Stripe
```
Successo: 4242424242424242
Fallimento: 4000000000000002
3D Secure: 4000002500003155
```

### 2. Test Webhook
```bash
# Installa Stripe CLI
stripe listen --forward-to localhost:54321/functions/v1/booking-webhook

# Test evento
stripe trigger payment_intent.succeeded
```

### 3. Test Edge Functions
```bash
# Test payment creation
curl -X POST https://your-project.supabase.co/functions/v1/stripe-payment \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"bookingId":"test-id","amount":5000,"currency":"eur"}'
```

## Monitoraggio

### 1. Dashboard Stripe
- Monitora transazioni in tempo reale
- Analizza metriche di conversione
- Gestisci dispute e rimborsi

### 2. Logs Supabase
- Controlla logs Edge Functions
- Monitora errori webhook
- Verifica performance

### 3. Metriche Chiave
- Tasso di successo pagamenti
- Tempo medio elaborazione
- Errori webhook

## Troubleshooting

### Problemi Comuni

1. **Webhook non ricevuti**
   - Verifica URL endpoint
   - Controlla signature secret
   - Verifica connettività

2. **Pagamenti falliti**
   - Controlla chiavi API
   - Verifica amount/currency
   - Controlla logs Stripe

3. **Errori autenticazione**
   - Verifica token Supabase
   - Controlla RLS policies
   - Verifica user session

### Debug
```typescript
// Abilita debug mode
localStorage.setItem('stripe_debug', 'true');

// Controlla logs browser
console.log('Stripe errors:', error);
```

## Produzione

### 1. Chiavi Live
- Sostituisci chiavi test con live
- Aggiorna webhook URL
- Testa in ambiente staging

### 2. Compliance
- Implementa PCI compliance
- Configura data retention
- Documenta privacy policy

### 3. Backup
- Backup configurazioni webhook
- Documenta chiavi e segreti
- Piano disaster recovery