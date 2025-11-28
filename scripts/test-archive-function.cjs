#!/usr/bin/env node

/**
 * Script per testare la funzione archive_service corrente
 */

const fs = require('fs');
const path = require('path');

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
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Errore: Variabili d\'ambiente Supabase mancanti!');
  process.exit(1);
}

console.log('🔍 Testing current archive_service function...');
console.log('');
console.log('📋 ISTRUZIONI MANUALI:');
console.log('1. Vai su https://supabase.com/dashboard');
console.log('2. Seleziona il tuo progetto');
console.log('3. Vai su SQL Editor');
console.log('4. Esegui questa query per vedere la definizione della funzione:');
console.log('');
console.log('SELECT pg_get_functiondef(oid) as function_definition');
console.log('FROM pg_proc');
console.log('WHERE proname = \'archive_service\';');
console.log('');
console.log('5. Cerca nella definizione se usa service_record.duration o service_record.duration_hours');
console.log('');
console.log('💡 Se la funzione usa service_record.duration invece di service_record.duration_hours,');
console.log('   esegui questo SQL per correggerla:');
console.log('');
console.log('-- Drop existing function');
console.log('DROP FUNCTION IF EXISTS archive_service(uuid, uuid);');
console.log('');
console.log('-- Create corrected archive_service function');
console.log('CREATE OR REPLACE FUNCTION archive_service(');
console.log('  p_service_id UUID,');
console.log('  p_user_id UUID');
console.log(') RETURNS BOOLEAN AS $$');
console.log('DECLARE');
console.log('  service_record RECORD;');
console.log('BEGIN');
console.log('  -- Get service record');
console.log('  SELECT * INTO service_record');
console.log('  FROM services ');
console.log('  WHERE id = p_service_id AND provider_id = p_user_id;');
console.log('  ');
console.log('  IF NOT FOUND THEN');
console.log('    RAISE EXCEPTION \'Service not found or unauthorized\';');
console.log('  END IF;');
console.log('  ');
console.log('  -- Insert into archived_services');
console.log('  INSERT INTO archived_services (');
console.log('    id, provider_id, title, description, category, duration, price, ');
console.log('    currency, location_type, location_address, requirements, images, ');
console.log('    active, created_at, updated_at, metadata');
console.log('  ) VALUES (');
console.log('    service_record.id, service_record.provider_id, service_record.title, ');
console.log('    service_record.description, service_record.category, ');
console.log('    COALESCE(service_record.duration_hours, 0), -- CORRETTO: usa duration_hours invece di duration');
console.log('    service_record.base_price, -- CORRETTO: usa base_price invece di price');
console.log('    service_record.currency, service_record.location_type, ');
console.log('    COALESCE(service_record.location_street, \'\'), -- Map location fields');
console.log('    COALESCE(ARRAY_TO_STRING(service_record.requirements, \', \'), \'\'), -- Map requirements array to text');
console.log('    COALESCE(ARRAY_TO_STRING(service_record.images, \', \'), \'\'), -- Map images array to text');
console.log('    false, service_record.created_at, service_record.updated_at, ');
console.log('    jsonb_build_object(');
console.log('      \'subcategory\', service_record.subcategory,');
console.log('      \'service_type\', service_record.service_type,');
console.log('      \'pricing_unit\', service_record.pricing_unit,');
console.log('      \'duration_hours\', service_record.duration_hours,');
console.log('      \'max_participants\', service_record.max_participants,');
console.log('      \'min_participants\', service_record.min_participants,');
console.log('      \'service_areas\', service_record.service_areas,');
console.log('      \'deliverables\', service_record.deliverables,');
console.log('      \'tags\', service_record.tags,');
console.log('      \'documents\', service_record.documents,');
console.log('      \'featured\', service_record.featured,');
console.log('      \'slug\', service_record.slug,');
console.log('      \'meta_description\', service_record.meta_description');
console.log('    )');
console.log('  );');
console.log('  ');
console.log('  -- Delete from services');
console.log('  DELETE FROM services WHERE id = p_service_id;');
console.log('  ');
console.log('  RETURN TRUE;');
console.log('END;');
console.log('$$ LANGUAGE plpgsql SECURITY DEFINER;');
console.log('');
console.log('📌 NOTA: Assicurati che la tabella archived_services esista con la struttura corretta!');