#!/usr/bin/env node

/**
 * Script per correggere la funzione archive_service
 * Risolve l'errore "record \"service_record\" has no field \"duration\""
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
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;
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
 * Funzione principale per correggere archive_service
 */
async function fixArchiveDuration() {
  console.log('🔧 Fixing archive_service function duration field issue...');
  
  try {
    // Test connessione
    await testConnection();
    
    // SQL per correggere la funzione archive_service
    const fixSQL = `
-- Drop existing function
DROP FUNCTION IF EXISTS archive_service(uuid, uuid);

-- Create corrected archive_service function
CREATE OR REPLACE FUNCTION archive_service(
  service_id uuid,
  archived_by uuid
) RETURNS uuid AS $$
DECLARE
  archived_service_id uuid;
  service_record services%ROWTYPE;
BEGIN
  -- Get the service record
  SELECT * INTO service_record FROM services WHERE id = service_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found';
  END IF;
  
  -- Archive the service
  INSERT INTO archived_services (
    id,
    provider_id,
    title,
    description,
    category,
    duration,
    price,
    currency,
    location_type,
    location_details,
    requirements,
    included_items,
    tags,
    images,
    metadata,
    created_at,
    updated_at,
    archived_at,
    archived_by,
    original_created_at
  ) VALUES (
    service_record.id,
    service_record.provider_id,
    service_record.title,
    service_record.description,
    service_record.category,
    COALESCE(service_record.duration_hours, 0), -- CORRETTO: usa duration_hours invece di duration
    COALESCE(service_record.base_price, 0),    -- CORRETTO: usa base_price invece di price
    service_record.currency,
    service_record.location_type,
    service_record.location_details,
    service_record.requirements,
    service_record.included_items,
    service_record.tags,
    service_record.images,
    jsonb_build_object(
      'active', service_record.active,
      'featured', service_record.featured,
      'rating', service_record.rating,
      'review_count', service_record.review_count,
      'bookings_count', service_record.bookings_count
    ),
    service_record.created_at,
    service_record.updated_at,
    NOW(),
    archived_by,
    service_record.created_at
  )
  RETURNING id INTO archived_service_id;
  
  -- Delete the original service
  DELETE FROM services WHERE id = service_id;
  
  RETURN archived_service_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    console.log('📋 Esecuzione correzione SQL...');
    console.log(fixSQL);
    
    try {
      await executeSQL(fixSQL, 'Correzione funzione archive_service');
      console.log('✅ Fix applicato con successo!');
      console.log('');
      console.log('📋 La funzione archive_service è stata corretta:');
      console.log('• Usa service_record.duration_hours invece di service_record.duration');
      console.log('• Usa service_record.base_price invece di service_record.price');
      console.log('• Inserisce i metadati correttamente in formato JSONB');
      
    } catch (sqlError) {
      console.error('❌ Errore esecuzione SQL:', sqlError.message);
      console.log('');
      console.log('💡 Manual fix required:');
      console.log('1. Go to Supabase SQL Editor');
      console.log('2. Copy and paste the SQL commands above');
      console.log('3. Click "Run" to execute');
      console.log('4. Make sure the function uses service_record.duration_hours instead of service_record.duration');
    }
    
  } catch (error) {
    console.error('❌ Errore generale:', error.message);
  }
}

// Esegui il fix
fixArchiveDuration();