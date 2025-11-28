const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Funzione per leggere le variabili d'ambiente dal file .env
function loadEnvVars() {
  const envPath = path.join(__dirname, '..', '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value && !key.startsWith('#')) {
      envVars[key.trim()] = value.trim();
    }
  });
  
  return envVars;
}

const env = loadEnvVars();
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Errore: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devono essere configurati nel file .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function addUserColumns() {
  console.log('🚀 Verifica struttura tabella users...');
  
  try {
    // Prima verifichiamo la struttura attuale
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Errore durante la verifica:', error);
      return false;
    }
    
    console.log('📋 Struttura attuale della tabella users:');
    if (data && data.length > 0) {
      console.log('Colonne presenti:', Object.keys(data[0]));
      
      const hasFirstName = 'first_name' in data[0];
      const hasLastName = 'last_name' in data[0];
      const hasPhone = 'phone' in data[0];
      const hasCompanyName = 'company_name' in data[0];
      
      if (hasFirstName && hasLastName && hasPhone && hasCompanyName) {
        console.log('✅ Tutte le colonne necessarie sono già presenti!');
        return true;
      } else {
        console.log('⚠️  Colonne mancanti rilevate.');
        console.log('📋 ISTRUZIONI MANUALI:');
        console.log('1. Vai su https://supabase.com/dashboard');
        console.log('2. Seleziona il tuo progetto');
        console.log('3. Vai su SQL Editor');
        console.log('4. Esegui questo comando SQL:');
        console.log('');
        console.log('ALTER TABLE users');
        if (!hasFirstName) console.log('ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),');
        if (!hasLastName) console.log('ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),');
        if (!hasPhone) console.log('ADD COLUMN IF NOT EXISTS phone VARCHAR(20),');
        if (!hasCompanyName) console.log('ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);');
        console.log('');
        console.log('5. Clicca su "Run" per eseguire lo script');
        return false;
      }
    } else {
      console.log('⚠️  Nessun dato trovato nella tabella users');
      return false;
    }
  } catch (error) {
    console.error('❌ Errore:', error.message);
    return false;
  }
}

async function verifyColumns() {
  console.log('🔍 Verifica struttura tabella users...');
  
  try {
    // Verifica che le colonne siano state aggiunte
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Errore durante la verifica:', error);
      return false;
    }
    
    console.log('✅ Struttura tabella users verificata');
    return true;
  } catch (error) {
    console.error('❌ Errore:', error.message);
    return false;
  }
}

async function main() {
  console.log('📡 Connessione a:', SUPABASE_URL);
  
  const success = await addUserColumns();
  if (success) {
    await verifyColumns();
    console.log('🎉 Migrazione completata con successo!');
  } else {
    console.log('❌ Migrazione fallita');
    process.exit(1);
  }
}

main().catch(console.error);