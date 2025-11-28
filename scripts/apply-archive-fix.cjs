#!/usr/bin/env node

/**
 * Script per applicare il fix alle funzioni di archiviazione
 * Aggiorna le funzioni archive_service e restore_service
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Carica le variabili d'ambiente
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
          console.error('Risposta:', data);
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
 * Funzione principale per applicare il fix
 */
async function applyArchiveFix() {
  console.log('🚀 Applicazione fix funzioni di archiviazione...');
  console.log('');

  try {
    // Leggi il file di migrazione aggiornato
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20240924190000_add_archived_services.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`File di migrazione non trovato: ${migrationPath}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log(`📄 Letto file di migrazione (${migrationSQL.length} caratteri)`);
    
    // Estrai solo le funzioni da aggiornare (per evitare di ricreare tabelle esistenti)
    const archiveFunctionSQL = `
-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS archive_service(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS restore_service(UUID, UUID) CASCADE;

-- Recreate archive_service function
CREATE OR REPLACE FUNCTION archive_service(p_service_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  service_record RECORD;
BEGIN
  -- Get service record
  SELECT * INTO service_record
  FROM services 
  WHERE id = p_service_id AND provider_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found or unauthorized';
  END IF;
  
  -- Insert into archived_services
  INSERT INTO archived_services (
    id, provider_id, title, description, category, duration, price, 
    currency, location_type, location_address, requirements, images, 
    active, created_at, updated_at, metadata
  ) VALUES (
    service_record.id, service_record.provider_id, service_record.title, 
    service_record.description, service_record.category, 
    COALESCE(service_record.duration_hours, 0), -- Map duration_hours to duration
    service_record.base_price, -- Map base_price to price
    service_record.currency, service_record.location_type, 
    COALESCE(service_record.location_street, ''), -- Map location fields
    COALESCE(ARRAY_TO_STRING(service_record.requirements, ', '), ''), -- Map requirements array to text
    COALESCE(ARRAY_TO_STRING(service_record.images, ', '), ''), -- Map images array to text
    false, service_record.created_at, service_record.updated_at, 
    jsonb_build_object(
      'subcategory', service_record.subcategory,
      'service_type', service_record.service_type,
      'pricing_unit', service_record.pricing_unit,
      'duration_hours', service_record.duration_hours,
      'max_participants', service_record.max_participants,
      'min_participants', service_record.min_participants,
      'service_areas', service_record.service_areas,
      'deliverables', service_record.deliverables,
      'tags', service_record.tags,
      'documents', service_record.documents,
      'featured', service_record.featured,
      'slug', service_record.slug,
      'meta_description', service_record.meta_description
    )
  );
  
  -- Delete from services
  DELETE FROM services WHERE id = p_service_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate restore_service function
CREATE OR REPLACE FUNCTION restore_service(p_service_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  archived_record RECORD;
  metadata_json JSONB;
BEGIN
  -- Get archived service record
  SELECT * INTO archived_record
  FROM archived_services 
  WHERE id = p_service_id AND provider_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Archived service not found or unauthorized';
  END IF;
  
  -- Parse metadata if it exists
  metadata_json := COALESCE(archived_record.metadata, '{}'::JSONB);
  
  -- Insert back into services
  INSERT INTO services (
    id, provider_id, title, description, category, subcategory, service_type,
    location_type, location_street, base_price, pricing_unit, currency,
    duration_hours, max_participants, min_participants, service_areas,
    requirements, deliverables, tags, images, documents, active, featured,
    slug, meta_description, created_at, updated_at
  ) VALUES (
    archived_record.id, archived_record.provider_id, archived_record.title, 
    archived_record.description, archived_record.category,
    COALESCE(metadata_json->>'subcategory', NULL),
    COALESCE(metadata_json->>'service_type', 'on_request'),
    archived_record.location_type,
    COALESCE(archived_record.location_address, NULL),
    archived_record.price, -- Map price back to base_price
    COALESCE(metadata_json->>'pricing_unit', 'fixed'),
    archived_record.currency,
    archived_record.duration, -- Map duration back to duration_hours
    COALESCE((metadata_json->>'max_participants')::INTEGER, NULL),
    COALESCE((metadata_json->>'min_participants')::INTEGER, 1),
    COALESCE((metadata_json->'service_areas')::TEXT[], NULL),
    CASE 
      WHEN archived_record.requirements IS NOT NULL AND archived_record.requirements != '' 
      THEN STRING_TO_ARRAY(archived_record.requirements, ', ') 
      ELSE '{}'::TEXT[] 
    END,
    COALESCE((metadata_json->'deliverables')::TEXT[], NULL),
    COALESCE((metadata_json->'tags')::TEXT[], NULL),
    CASE 
      WHEN archived_record.images IS NOT NULL AND archived_record.images != '' 
      THEN STRING_TO_ARRAY(archived_record.images, ', ') 
      ELSE '{}'::TEXT[] 
    END,
    COALESCE((metadata_json->'documents')::TEXT[], NULL),
    true, -- active
    COALESCE((metadata_json->>'featured')::BOOLEAN, false),
    COALESCE(metadata_json->>'slug', NULL),
    COALESCE(metadata_json->>'meta_description', NULL),
    archived_record.created_at, archived_record.updated_at
  );
  
  -- Delete from archived_services
  DELETE FROM archived_services WHERE id = p_service_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    console.log('🔄 Aggiornamento funzioni di archiviazione...');
    
    // Esegui l'aggiornamento delle funzioni
    await executeSQL(archiveFunctionSQL, 'Funzioni di archiviazione aggiornate');
    
    console.log('');
    console.log('🎉 Fix applicato con successo!');
    console.log('');
    console.log('✅ Le funzioni archive_service e restore_service sono state aggiornate');
    console.log('✅ Ora supportano correttamente la struttura attuale del database');
    console.log('✅ Risolto l\'errore "record service_record has no field duration"');
    
  } catch (error) {
    console.error('❌ Errore durante l\'applicazione del fix:', error.message);
    console.log('');
    console.log('📋 ISTRUZIONI MANUALI ALTERNATIVE:');
    console.log('1. Vai su https://supabase.com/dashboard');
    console.log('2. Seleziona il tuo progetto');
    console.log('3. Vai su SQL Editor');
    console.log('4. Copia e incolla il contenuto di:');
    console.log('   supabase/migrations/20240924190000_add_archived_services.sql');
    console.log('5. Clicca su "Run" per eseguire lo script');
    process.exit(1);
  }
}

// Esegui lo script
applyArchiveFix().catch(console.error);