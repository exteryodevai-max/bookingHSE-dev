# 🚨 RISOLUZIONE RAPIDA ERRORE DATABASE

## Problema
```
Database connection failed: Could not find the table 'public.users' in the schema cache
```

## ✅ Soluzione (5 minuti)

### 1. Vai su Supabase Dashboard
🔗 **[https://supabase.com/dashboard](https://supabase.com/dashboard)**

### 2. Seleziona il tuo progetto BookingHSE

### 3. Vai su SQL Editor
- Clicca sull'icona `</>` nella sidebar sinistra
- Clicca su **"New Query"**

### 4. Copia e incolla lo schema
- Apri il file `database/schema.sql` in questo progetto
- Copia **TUTTO** il contenuto (Ctrl+A, Ctrl+C)
- Incolla nell'editor SQL di Supabase (Ctrl+V)
- Clicca su **"Run"** (o premi Ctrl+Enter)

### 5. Verifica il risultato
- Dovresti vedere il messaggio "Success. No rows returned"
- Vai su **"Table Editor"** nella sidebar
- Dovresti vedere tutte le tabelle create:
  - ✅ users
  - ✅ client_profiles
  - ✅ provider_profiles
  - ✅ services
  - ✅ bookings
  - ✅ reviews
  - ✅ notifications
  - ✅ certifications
  - ✅ availability_slots
  - ✅ blocked_dates

### 6. (Opzionale) Aggiungi dati di esempio
- Ripeti i passaggi 3-4 con il file `database/seed.sql`
- Questo aggiungerà dati di test per sviluppare più facilmente

## 🎉 Test Finale

1. Ricarica l'applicazione nel browser
2. Apri la Console (F12)
3. Dovresti vedere: `✅ Database connected successfully!`
4. Per testare tutte le funzioni, esegui nella console:
   ```javascript
   dbTests.runAll()
   ```

## 📞 Se hai ancora problemi

1. Verifica che il file `.env` contenga le credenziali corrette
2. Controlla che le tabelle siano state create in Supabase
3. Esegui il comando di test:
   ```bash
   npm run setup-db
   ```

---

**⏱️ Tempo stimato: 5 minuti**

**🔑 Punto chiave**: Il database Supabase è vuoto e ha bisogno dello schema SQL per creare le tabelle necessarie all'applicazione.