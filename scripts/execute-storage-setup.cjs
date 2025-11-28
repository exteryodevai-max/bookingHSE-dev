const fs = require('fs');
const https = require('https');
const path = require('path');

// Funzione per leggere le variabili d'ambiente dal file .env
function loadEnvVars() {
  const envPath = path.join(__dirname, '..', '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });
  
  return envVars;
}

// Carica le variabili d'ambiente
const env = loadEnvVars();
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Errore: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devono essere configurati nel file .env');
  process.exit(1);
}

// Funzione per eseguire query SQL tramite API REST
async function executeSQL(sql) {
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
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
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
          resolve({ success: true, data: JSON.parse(data) });
        } else {
          reject({ success: false, status: res.statusCode, data });
        }
      });
    });

    req.on('error', (error) => {
      reject({ success: false, error: error.message });
    });

    req.write(postData);
    req.end();
  });
}

// Funzione per creare bucket tramite API Storage
async function createBucket(bucketName, config) {
  return new Promise((resolve, reject) => {
    const url = new URL('/storage/v1/bucket', SUPABASE_URL);
    
    const postData = JSON.stringify({
      id: bucketName,
      name: bucketName,
      public: config.public || false,
      file_size_limit: config.fileSizeLimit || null,
      allowed_mime_types: config.allowedMimeTypes || null
    });
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
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
          resolve({ success: true, data: JSON.parse(data) });
        } else {
          reject({ success: false, status: res.statusCode, data });
        }
      });
    });

    req.on('error', (error) => {
      reject({ success: false, error: error.message });
    });

    req.write(postData);
    req.end();
  });
}

// Configurazione bucket
const BUCKETS_CONFIG = {
  'service-images': {
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  'profile-images': {
    public: true,
    fileSizeLimit: 2097152, // 2MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  'certifications': {
    public: false,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  },
  'temp-uploads': {
    public: false,
    fileSizeLimit: 15728640, // 15MB
    allowedMimeTypes: null // Tutti i tipi
  }
};

async function main() {
  console.log('🚀 Avvio configurazione Storage Supabase...');
  console.log('📍 URL Supabase:', SUPABASE_URL);
  
  try {
    // 1. Prova a creare i bucket
    console.log('\n📦 Creazione bucket...');
    
    for (const [bucketName, config] of Object.entries(BUCKETS_CONFIG)) {
      try {
        console.log(`   Creando bucket: ${bucketName}...`);
        const result = await createBucket(bucketName, config);
        console.log(`   ✅ Bucket ${bucketName} creato con successo`);
      } catch (error) {
        if (error.status === 409) {
          console.log(`   ℹ️  Bucket ${bucketName} già esistente`);
        } else {
          console.log(`   ❌ Errore creazione bucket ${bucketName}:`, error.status, error.data);
        }
      }
    }
    
    // 2. Leggi e prova a eseguire lo script SQL
    console.log('\n📜 Lettura script SQL...');
    const sqlPath = path.join(__dirname, '..', 'database', 'storage-setup.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('\n⚠️  NOTA IMPORTANTE:');
    console.log('Le politiche RLS devono essere create manualmente nel SQL Editor di Supabase.');
    console.log('Lo script SQL è pronto in: database/storage-setup.sql');
    
    console.log('\n📋 PROSSIMI PASSI MANUALI:');
    console.log('1. Vai su https://supabase.com/dashboard');
    console.log('2. Seleziona il progetto BookingHSE');
    console.log('3. Vai su "SQL Editor"');
    console.log('4. Copia e incolla il contenuto di database/storage-setup.sql');
    console.log('5. Esegui lo script per creare le politiche RLS');
    
    console.log('\n✅ Setup bucket completato! Ora esegui manualmente lo script SQL.');
    
  } catch (error) {
    console.error('❌ Errore durante il setup:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };