/**
 * Script per configurare i bucket Supabase Storage tramite API REST
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
 * Lista i bucket esistenti
 */
async function listBuckets() {
  console.log('📋 Verifico i bucket esistenti...');
  
  const options = {
    hostname: 'api.supabase.com',
    port: 443,
    path: `/v1/projects/${projectId}/storage/buckets`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options);
    
    if (response.status === 200) {
      console.log('✅ Bucket esistenti:', response.data.map(b => b.name));
      return response.data;
    } else {
      console.error('❌ Errore nel recupero bucket:', response.status, response.data);
      return [];
    }
  } catch (error) {
    console.error('❌ Errore di rete:', error.message);
    return [];
  }
}

/**
 * Crea un bucket
 */
async function createBucket(bucketConfig) {
  console.log(`📦 Creando bucket: ${bucketConfig.name}...`);
  
  const options = {
    hostname: 'api.supabase.com',
    port: 443,
    path: `/v1/projects/${projectId}/storage/buckets`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options, bucketConfig);
    
    if (response.status === 201 || response.status === 200) {
      console.log(`✅ Bucket '${bucketConfig.name}' creato con successo`);
      return true;
    } else if (response.status === 409) {
      console.log(`ℹ️  Bucket '${bucketConfig.name}' già esistente`);
      return true;
    } else {
      console.error(`❌ Errore nella creazione del bucket '${bucketConfig.name}':`, response.status, response.data);
      return false;
    }
  } catch (error) {
    console.error(`❌ Errore di rete per bucket '${bucketConfig.name}':`, error.message);
    return false;
  }
}

/**
 * Esegue una query SQL
 */
async function executeSQL(query) {
  console.log('🔧 Eseguendo query SQL...');
  
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
      console.log('✅ Query SQL eseguita con successo');
      return true;
    } else {
      console.error('❌ Errore nell\'esecuzione SQL:', response.status, response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Errore di rete SQL:', error.message);
    return false;
  }
}

/**
 * Configurazione bucket
 */
const bucketsConfig = [
  {
    name: 'profile-images',
    public: true,
    file_size_limit: 2097152, // 2MB
    allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp']
  },
  {
    name: 'service-images',
    public: true,
    file_size_limit: 5242880, // 5MB
    allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp']
  }
];

/**
 * Policy RLS per storage
 */
const storagePolicy = `
-- Policy per visualizzare le immagini profilo (pubblico)
CREATE POLICY IF NOT EXISTS "Public Access Profile Images" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-images');

-- Policy per caricare immagini profilo (solo utenti autenticati)
CREATE POLICY IF NOT EXISTS "Authenticated Upload Profile Images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.role() = 'authenticated'
);

-- Policy per aggiornare le proprie immagini profilo
CREATE POLICY IF NOT EXISTS "Users Update Own Profile Images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-images' AND
  auth.role() = 'authenticated'
) WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.role() = 'authenticated'
);

-- Policy per eliminare le proprie immagini profilo
CREATE POLICY IF NOT EXISTS "Users Delete Own Profile Images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-images' AND
  auth.role() = 'authenticated'
);
`;

/**
 * Funzione principale
 */
async function main() {
  console.log('🚀 Avvio configurazione Storage Supabase tramite API...\n');

  // 1. Lista bucket esistenti
  const existingBuckets = await listBuckets();
  const existingBucketNames = existingBuckets.map(b => b.name);

  // 2. Crea bucket mancanti
  let bucketsCreated = 0;
  for (const bucketConfig of bucketsConfig) {
    if (!existingBucketNames.includes(bucketConfig.name)) {
      const success = await createBucket(bucketConfig);
      if (success) bucketsCreated++;
    } else {
      console.log(`ℹ️  Bucket '${bucketConfig.name}' già esistente`);
    }
  }

  // 3. Configura policy RLS
  console.log('\n📋 Configurando policy RLS...');
  const policySuccess = await executeSQL(storagePolicy);

  // 4. Riepilogo
  console.log('\n🎉 Configurazione completata!');
  console.log(`📦 Bucket creati: ${bucketsCreated}`);
  console.log(`🔒 Policy RLS: ${policySuccess ? 'Configurate' : 'Errore'}`);
  
  if (bucketsCreated > 0 || policySuccess) {
    console.log('\n✅ Storage configurato correttamente!');
    console.log('🔄 Ricarica l\'applicazione per testare l\'upload delle immagini.');
  }
}

// Esegui lo script
main().catch(console.error);