/**
 * Script per configurare i bucket Supabase Storage per BookingHSE
 * Crea automaticamente i bucket necessari e configura le politiche RLS
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

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
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Errore: Variabili d\'ambiente Supabase mancanti!');
  console.log('Assicurati che .env contenga:');
  console.log('- VITE_SUPABASE_URL');
  console.log('- VITE_SUPABASE_ANON_KEY');
  console.log('- SUPABASE_SERVICE_KEY (necessaria per operazioni admin)');
  process.exit(1);
}

/**
 * Configurazione bucket da creare
 */
const BUCKETS_CONFIG = [
  {
    id: 'service-images',
    name: 'service-images',
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
    description: 'Public bucket for service images and galleries'
  },
  {
    id: 'profile-images',
    name: 'profile-images', 
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    fileSizeLimit: 2 * 1024 * 1024, // 2MB
    description: 'Public bucket for user profile images'
  },
  {
    id: 'certifications',
    name: 'certifications',
    public: false,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
    description: 'Private bucket for certification documents'
  },
  {
    id: 'temp-uploads',
    name: 'temp-uploads',
    public: false,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    fileSizeLimit: 15 * 1024 * 1024, // 15MB
    description: 'Temporary storage for file processing'
  }
];

/**
 * Esegue una richiesta HTTP a Supabase
 */
function makeSupabaseRequest(method, endpoint, data = null, useServiceKey = false) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, SUPABASE_URL);
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${useServiceKey ? SUPABASE_SERVICE_KEY : SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    };
    
    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : null;
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsedData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        } catch (error) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(responseData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

/**
 * Verifica se un bucket esiste
 */
async function checkBucketExists(bucketId) {
  try {
    await makeSupabaseRequest('GET', `/storage/v1/bucket/${bucketId}`);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Crea un bucket
 */
async function createBucket(bucketConfig) {
  try {
    const exists = await checkBucketExists(bucketConfig.id);
    
    if (exists) {
      console.log(`✅ Bucket '${bucketConfig.id}' già esistente`);
      return true;
    }

    const bucketData = {
      id: bucketConfig.id,
      name: bucketConfig.name,
      public: bucketConfig.public,
      file_size_limit: bucketConfig.fileSizeLimit,
      allowed_mime_types: bucketConfig.allowedMimeTypes
    };

    await makeSupabaseRequest('POST', '/storage/v1/bucket', bucketData, true);
    console.log(`✅ Bucket '${bucketConfig.id}' creato con successo`);
    return true;
  } catch (error) {
    console.error(`❌ Errore creazione bucket '${bucketConfig.id}':`, error.message);
    return false;
  }
}

/**
 * Crea le politiche RLS per i bucket
 */
async function createStoragePolicies() {
  const policies = [
    // Policy per service-images (pubblico)
    {
      name: 'service_images_select',
      sql: `
        CREATE POLICY "Public Access" ON storage.objects
        FOR SELECT USING (bucket_id = 'service-images');
      `
    },
    {
      name: 'service_images_insert',
      sql: `
        CREATE POLICY "Authenticated Upload" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'service-images' AND 
          auth.role() = 'authenticated'
        );
      `
    },
    // Policy per profile-images (pubblico)
    {
      name: 'profile_images_select',
      sql: `
        CREATE POLICY "Public Access Profile" ON storage.objects
        FOR SELECT USING (bucket_id = 'profile-images');
      `
    },
    {
      name: 'profile_images_insert',
      sql: `
        CREATE POLICY "User Profile Upload" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'profile-images' AND 
          auth.role() = 'authenticated'
        );
      `
    },
    // Policy per certifications (privato)
    {
      name: 'certifications_select',
      sql: `
        CREATE POLICY "Owner Access Certifications" ON storage.objects
        FOR SELECT USING (
          bucket_id = 'certifications' AND 
          auth.uid()::text = (storage.foldername(name))[1]
        );
      `
    },
    {
      name: 'certifications_insert',
      sql: `
        CREATE POLICY "Owner Upload Certifications" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'certifications' AND 
          auth.uid()::text = (storage.foldername(name))[1]
        );
      `
    }
  ];

  console.log('\n📋 Configurazione politiche RLS...');
  console.log('⚠️  ATTENZIONE: Le politiche RLS devono essere create manualmente nel SQL Editor di Supabase.');
  console.log('\n📋 ISTRUZIONI MANUALI:');
  console.log('1. Vai su https://supabase.com/dashboard');
  console.log('2. Seleziona il tuo progetto');
  console.log('3. Vai su SQL Editor');
  console.log('4. Copia e incolla le seguenti query SQL:');
  console.log('\n--- POLITICHE RLS PER STORAGE ---');
  
  policies.forEach(policy => {
    console.log(`\n-- ${policy.name}`);
    console.log(policy.sql.trim());
  });
  
  console.log('\n--- FINE POLITICHE ---\n');
}

/**
 * Test connessione a Supabase
 */
async function testConnection() {
  try {
    await makeSupabaseRequest('GET', '/rest/v1/');
    console.log('✅ Connessione a Supabase riuscita');
    return true;
  } catch (error) {
    console.error('❌ Errore connessione a Supabase:', error.message);
    return false;
  }
}

/**
 * Funzione principale
 */
async function setupStorage() {
  console.log('🚀 Avvio configurazione Supabase Storage per BookingHSE...');
  console.log('');

  try {
    // Test connessione
    console.log('📡 Test connessione a Supabase...');
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Impossibile connettersi a Supabase');
    }
    console.log('');

    // Verifica service key
    if (!SUPABASE_SERVICE_KEY) {
      console.log('⚠️  Service Key non configurata - alcune operazioni potrebbero fallire');
      console.log('   Aggiungi SUPABASE_SERVICE_KEY al file .env per operazioni admin');
      console.log('');
    }

    // Crea bucket
    console.log('📦 Creazione bucket storage...');
    let successCount = 0;
    
    for (const bucketConfig of BUCKETS_CONFIG) {
      const success = await createBucket(bucketConfig);
      if (success) successCount++;
    }
    
    console.log(`\n✅ ${successCount}/${BUCKETS_CONFIG.length} bucket configurati correttamente`);
    
    // Crea politiche RLS
    await createStoragePolicies();
    
    console.log('\n🎉 Configurazione storage completata!');
    console.log('');
    console.log('📋 PROSSIMI PASSI:');
    console.log('1. Esegui le politiche RLS nel SQL Editor di Supabase');
    console.log('2. Verifica che i bucket siano visibili in Storage > Buckets');
    console.log('3. Testa l\'upload di file nell\'applicazione');
    console.log('');
    
  } catch (error) {
    console.error('❌ Errore durante la configurazione:', error.message);
    console.log('');
    console.log('🔧 RISOLUZIONE PROBLEMI:');
    console.log('1. Verifica le credenziali nel file .env');
    console.log('2. Controlla che il progetto Supabase sia attivo');
    console.log('3. Assicurati di avere i permessi necessari');
    process.exit(1);
  }
}

// Esegui lo script
if (require.main === module) {
  setupStorage();
}

module.exports = { setupStorage, BUCKETS_CONFIG };