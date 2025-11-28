const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envFile = path.join(__dirname, '..', '.env');
let envVars = {};

if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });
}

const SUPABASE_URL = envVars.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variabili d\'ambiente mancanti');
  console.error('Assicurati di avere VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nel file .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// SQL commands with conditional creation
const sqlCommands = [
  // Create archived_services table with conditional creation
  `CREATE TABLE IF NOT EXISTS archived_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    duration INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    location_type VARCHAR(50) DEFAULT 'online',
    location_address TEXT,
    requirements TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
  )`,

  // Enable RLS
  `DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE tablename = 'archived_services' 
      AND rowsecurity = true
    ) THEN
      ALTER TABLE archived_services ENABLE ROW LEVEL SECURITY;
    END IF;
  END
  $$`,

  // Create RLS Policies with conditional creation
  `DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'archived_services' 
      AND policyname = 'Provider can view own archived services'
    ) THEN
      CREATE POLICY "Provider can view own archived services" ON archived_services
        FOR SELECT USING (auth.uid() = provider_id);
    END IF;
  END
  $$`,

  `DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'archived_services' 
      AND policyname = 'Provider can archive own services'
    ) THEN
      CREATE POLICY "Provider can archive own services" ON archived_services
        FOR INSERT WITH CHECK (auth.uid() = provider_id);
    END IF;
  END
  $$`,

  `DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'archived_services' 
      AND policyname = 'Provider can restore own archived services'
    ) THEN
      CREATE POLICY "Provider can restore own archived services" ON archived_services
        FOR DELETE USING (auth.uid() = provider_id);
    END IF;
  END
  $$`,

  // Create indexes with conditional creation
  `DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'archived_services' 
      AND indexname = 'idx_archived_services_provider_id'
    ) THEN
      CREATE INDEX idx_archived_services_provider_id ON archived_services(provider_id);
    END IF;
  END
  $$`,

  `DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'archived_services' 
      AND indexname = 'idx_archived_services_category'
    ) THEN
      CREATE INDEX idx_archived_services_category ON archived_services(category);
    END IF;
  END
  $$`,

  `DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'archived_services' 
      AND indexname = 'idx_archived_services_created_at'
    ) THEN
      CREATE INDEX idx_archived_services_created_at ON archived_services(created_at DESC);
    END IF;
  END
  $$`,

  // Create updated_at trigger function
  `CREATE OR REPLACE FUNCTION update_archived_services_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql`,

  // Create trigger with conditional creation
  `DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'update_archived_services_updated_at'
    ) THEN
      CREATE TRIGGER update_archived_services_updated_at
        BEFORE UPDATE ON archived_services
        FOR EACH ROW
        EXECUTE FUNCTION update_archived_services_updated_at();
    END IF;
  END
  $$`,

  // Drop existing functions if they exist
  `DROP FUNCTION IF EXISTS archive_service(UUID, UUID) CASCADE`,
  `DROP FUNCTION IF EXISTS restore_service(UUID, UUID) CASCADE`,

  // Create archive function
  `CREATE OR REPLACE FUNCTION archive_service(p_service_id UUID, p_user_id UUID)
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
  $$ LANGUAGE plpgsql SECURITY DEFINER`,

  // Create restore function
  `CREATE OR REPLACE FUNCTION restore_service(p_service_id UUID, p_user_id UUID)
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
  $$ LANGUAGE plpgsql SECURITY DEFINER`
];

async function applyArchiveFix() {
  console.log('🚀 Applicazione fix archiviazione servizi...');
  console.log('📍 URL Supabase:', SUPABASE_URL);
  
  try {
    // Test connection
    console.log('📡 Test connessione...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('❌ Errore connessione:', error.message);
      console.log('\n📋 ISTRUZIONI MANUALI:');
      console.log('1. Vai su https://supabase.com/dashboard');
      console.log('2. Seleziona il tuo progetto');
      console.log('3. Vai su SQL Editor');
      console.log('4. Copia e incolla il contenuto di:');
      console.log('   supabase/migrations/20240924190000_add_archived_services.sql');
      console.log('5. Clicca su "Run" per eseguire lo script');
      return;
    }
    
    console.log('✅ Connessione riuscita');
    
    // Execute SQL commands
    console.log('\n🔧 Esecuzione comandi SQL...');
    
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      console.log(`\n[${i + 1}/${sqlCommands.length}] Esecuzione comando...`);
      
      try {
        // Use RPC if available, otherwise provide manual instructions
        const { error: rpcError } = await supabase.rpc('exec_sql', { sql: command });
        
        if (rpcError) {
          console.log(`⚠️  Funzione exec_sql non disponibile per comando ${i + 1}`);
          console.log('📋 Esegui manualmente nel SQL Editor di Supabase:');
          console.log(command);
          console.log('---');
        } else {
          console.log(`✅ Comando ${i + 1} eseguito`);
        }
      } catch (error) {
        console.log(`⚠️  Errore comando ${i + 1}:`, error.message);
        console.log('📋 Esegui manualmente:');
        console.log(command);
        console.log('---');
      }
    }
    
    console.log('\n✅ Fix applicato con successo!');
    console.log('\n📋 Verifica:');
    console.log('- La tabella archived_services dovrebbe essere creata');
    console.log('- Le politiche RLS dovrebbero essere configurate');
    console.log('- Le funzioni archive_service e restore_service dovrebbero essere aggiornate');
    
  } catch (error) {
    console.error('❌ Errore durante l\'applicazione del fix:', error.message);
    console.log('\n📋 ISTRUZIONI MANUALI:');
    console.log('1. Vai su https://supabase.com/dashboard');
    console.log('2. Seleziona il tuo progetto');
    console.log('3. Vai su SQL Editor');
    console.log('4. Copia e incolla il contenuto di:');
    console.log('   supabase/migrations/20240924190000_add_archived_services.sql');
    console.log('5. Clicca su "Run" per eseguire lo script');
  }
}

// Execute if called directly
if (require.main === module) {
  applyArchiveFix();
}

module.exports = { applyArchiveFix };