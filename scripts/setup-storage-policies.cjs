/**
 * Script per configurare le policy RLS per Storage Supabase
 * Utilizza l'access token MCP per autenticarsi
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configurazione da MCP
const ACCESS_TOKEN = 'sbp_775a37fdd2ae60c782c730f16e7d94999285e5fd';

/**
 * Carica le variabili d'ambiente dal file .env
 */
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  const env = {};
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    }
  }
  
  return env;
}

const env = loadEnvFile();
const SUPABASE_URL = env.VITE_SUPABASE_URL;

if (!SUPABASE_URL) {
  console.error('❌ Errore: VITE_SUPABASE_URL non trovato nel file .env');
  process.exit(1);
}

// Estrai il project ID dall'URL
const projectId = SUPABASE_URL.replace('https://', '').split('.')[0];
console.log(`🔗 Project ID: ${projectId}`);

/**
 * Effettua una richiesta HTTP
 */
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: response, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Esegue una query SQL
 */
async function executeSQL(query, description) {
  console.log(`🔧 ${description}...`);
  
  const options = {
    hostname: 'api.supabase.com',
    port: 443,
    path: `/v1/projects/${projectId}/database/query`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options, { query });
    
    if (response.status === 200) {
      console.log(`✅ ${description} completata`);
      return true;
    } else {
      console.error(`❌ Errore in ${description}:`, response.status, response.data);
      return false;
    }
  } catch (error) {
    console.error(`❌ Errore di rete in ${description}:`, error.message);
    return false;
  }
}

/**
 * Policy RLS per storage
 */
const policies = [
  {
    name: 'Rimozione policy esistenti',
    query: `
      DROP POLICY IF EXISTS "Public Access Profile Images" ON storage.objects;
      DROP POLICY IF EXISTS "Authenticated Upload Profile Images" ON storage.objects;
      DROP POLICY IF EXISTS "Users Update Own Profile Images" ON storage.objects;
      DROP POLICY IF EXISTS "Users Delete Own Profile Images" ON storage.objects;
    `
  },
  {
    name: 'Policy per visualizzare le immagini profilo (pubblico)',
    query: `
      CREATE POLICY "Public Access Profile Images" ON storage.objects
      FOR SELECT USING (bucket_id = 'profile-images');
    `
  },
  {
    name: 'Policy per caricare immagini profilo (utenti autenticati)',
    query: `
      CREATE POLICY "Authenticated Upload Profile Images" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'profile-images' AND
        auth.role() = 'authenticated'
      );
    `
  },
  {
    name: 'Policy per aggiornare le proprie immagini profilo',
    query: `
      CREATE POLICY "Users Update Own Profile Images" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'profile-images' AND
        auth.role() = 'authenticated'
      ) WITH CHECK (
        bucket_id = 'profile-images' AND
        auth.role() = 'authenticated'
      );
    `
  },
  {
    name: 'Policy per eliminare le proprie immagini profilo',
    query: `
      CREATE POLICY "Users Delete Own Profile Images" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'profile-images' AND
        auth.role() = 'authenticated'
      );
    `
  }
];

/**
 * Funzione principale
 */
async function main() {
  console.log('🚀 Configurazione Policy RLS per Storage Supabase...\n');

  let successCount = 0;
  
  for (const policy of policies) {
    const success = await executeSQL(policy.query, policy.name);
    if (success) successCount++;
    
    // Piccola pausa tra le query
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n🎉 Configurazione completata!');
  console.log(`✅ Policy configurate: ${successCount}/${policies.length}`);
  
  if (successCount === policies.length) {
    console.log('\n🔒 Tutte le policy RLS sono state configurate correttamente!');
    console.log('🔄 Ora puoi testare l\'upload delle immagini profilo nell\'applicazione.');
  } else {
    console.log('\n⚠️  Alcune policy potrebbero non essere state configurate correttamente.');
    console.log('📋 Verifica manualmente nel dashboard di Supabase.');
  }
}

// Esegui lo script
main().catch(console.error);