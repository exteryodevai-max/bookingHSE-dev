#!/usr/bin/env node

/**
 * Script per configurare automaticamente il database Supabase
 * Esegue lo schema SQL e i dati di esempio
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Carica le variabili d'ambiente dal file .env
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '..', '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim().replace(/["']/g, '');
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('❌ Errore lettura file .env:', error.message);
    return {};
  }
}

const env = loadEnvFile();
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY; // Serve la service key per operazioni admin
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Errore: Variabili d\'ambiente Supabase mancanti!');
  console.log('Assicurati che .env contenga:');
  console.log('- VITE_SUPABASE_URL');
  console.log('- VITE_SUPABASE_ANON_KEY');
  console.log('- SUPABASE_SERVICE_KEY (opzionale, per operazioni admin)');
  process.exit(1);
}

/**
 * Esegue una query SQL su Supabase
 */
async function executeSQL(sql, description) {
  return new Promise((resolve, reject) => {
    const url = new URL('/rest/v1/rpc/exec_sql', SUPABASE_URL);
    
    const postData = JSON.stringify({ sql });
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ ${description}`);
          resolve(data);
        } else {
          console.error(`❌ Errore ${description}: ${res.statusCode}`);
          console.error(data);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      console.error(`❌ Errore di rete ${description}:`, err.message);
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Testa la connessione al database
 */
async function testConnection() {
  try {
    const url = new URL('/rest/v1/', SUPABASE_URL);
    
    return new Promise((resolve, reject) => {
      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        }
      };

      const req = https.request(options, (res) => {
        if (res.statusCode === 200) {
          console.log('✅ Connessione a Supabase riuscita');
          resolve(true);
        } else {
          console.error(`❌ Errore connessione: ${res.statusCode}`);
          reject(false);
        }
      });

      req.on('error', (err) => {
        console.error('❌ Errore di connessione:', err.message);
        reject(false);
      });

      req.end();
    });
  } catch (error) {
    console.error('❌ Errore test connessione:', error.message);
    return false;
  }
}

/**
 * Funzione principale
 */
async function setupDatabase() {
  console.log('🚀 Avvio configurazione database BookingHSE...');
  console.log('');

  try {
    // Test connessione
    console.log('📡 Test connessione a Supabase...');
    await testConnection();
    console.log('');

    // Leggi e esegui schema
    console.log('📋 Configurazione schema database...');
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`File schema non trovato: ${schemaPath}`);
    }
    
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    console.log(`📄 Letto schema SQL (${schemaSQL.length} caratteri)`);
    
    // Nota: Supabase potrebbe non supportare l'esecuzione diretta di SQL complessi via API
    // In questo caso, mostra le istruzioni manuali
    console.log('');
    console.log('⚠️  ATTENZIONE: Per motivi di sicurezza, Supabase richiede l\'esecuzione manuale dello schema.');
    console.log('');
    console.log('📋 ISTRUZIONI MANUALI:');
    console.log('1. Vai su https://supabase.com/dashboard');
    console.log('2. Seleziona il tuo progetto');
    console.log('3. Vai su SQL Editor');
    console.log('4. Copia e incolla il contenuto di database/schema.sql');
    console.log('5. Clicca su "Run" per eseguire lo script');
    console.log('');
    console.log('6. (Opzionale) Ripeti per database/seed.sql per i dati di esempio');
    console.log('');
    
    // Verifica se le tabelle esistono
    console.log('🔍 Verifica configurazione database...');
    
    // Semplice test per vedere se le tabelle esistono
    try {
      const testUrl = new URL('/rest/v1/users?limit=1', SUPABASE_URL);
      
      await new Promise((resolve, reject) => {
        const options = {
          hostname: testUrl.hostname,
          port: 443,
          path: testUrl.pathname + testUrl.search,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY
          }
        };

        const req = https.request(options, (res) => {
          if (res.statusCode === 200) {
            console.log('✅ Tabella users trovata - Database configurato!');
            resolve(true);
          } else if (res.statusCode === 404) {
            console.log('⚠️  Tabella users non trovata - Esegui lo schema manualmente');
            resolve(false);
          } else {
            console.log(`⚠️  Stato sconosciuto: ${res.statusCode}`);
            resolve(false);
          }
        });

        req.on('error', (err) => {
          console.log('⚠️  Errore verifica tabelle:', err.message);
          resolve(false);
        });

        req.end();
      });
    } catch (error) {
      console.log('⚠️  Impossibile verificare le tabelle:', error.message);
    }
    
    console.log('');
    console.log('🎉 Setup completato!');
    console.log('📖 Per maggiori dettagli, consulta DATABASE_SETUP.md');
    
  } catch (error) {
    console.error('❌ Errore durante il setup:', error.message);
    process.exit(1);
  }
}

// Esegui solo se chiamato direttamente
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase, testConnection };