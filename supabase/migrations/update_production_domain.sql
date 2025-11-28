-- ==============================================
-- Aggiornamento configurazione per dominio BookingHSE.com
-- ==============================================

-- Questo file contiene le istruzioni per configurare Supabase
-- per il dominio di produzione BookingHSE.com

/*
==============================================
CONFIGURAZIONE MANUALE RICHIESTA IN SUPABASE DASHBOARD
==============================================

1. AUTHENTICATION SETTINGS:
   - Vai su Authentication > Settings
   - Site URL: https://bookinghse.com
   - Redirect URLs (aggiungi):
     * https://bookinghse.com/auth/callback
     * https://bookinghse.com/auth/confirm
     * https://bookinghse.com/auth/reset-password
     * https://bookinghse.com/dashboard
     * https://bookinghse.com

2. EMAIL TEMPLATES:
   - Vai su Authentication > Email Templates
   - Confirm signup: Aggiorna {{ .SiteURL }} con https://bookinghse.com
   - Reset password: Aggiorna {{ .SiteURL }} con https://bookinghse.com
   - Magic link: Aggiorna {{ .SiteURL }} con https://bookinghse.com

3. CORS SETTINGS (se necessario):
   - Vai su Settings > API
   - CORS origins: https://bookinghse.com

4. CUSTOM DOMAIN (opzionale):
   - Vai su Settings > Custom Domains
   - Aggiungi bookinghse.com se vuoi un dominio personalizzato

==============================================
VERIFICA CONFIGURAZIONE
==============================================

Dopo aver configurato manualmente:
1. Testa la registrazione utente
2. Verifica che le email puntino a https://bookinghse.com
3. Testa il login e logout
4. Verifica i redirect dopo autenticazione

*/

-- Query per verificare la configurazione attuale
SELECT 
    'Verifica configurazione Supabase per BookingHSE.com' as message,
    'Configurazione manuale richiesta nel dashboard' as action_required;

-- Nota: La configurazione del dominio deve essere fatta manualmente
-- nel dashboard di Supabase per motivi di sicurezza